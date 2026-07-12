// ─── EdgePay 3.0 Main App ──────────────────────────────────────────────

import React, { useEffect, useMemo } from 'react';
import { StatusBar, View, StyleSheet, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { useStore, initializeStore } from './store/useStore';
import { useNetworkMonitor } from './engine/NetworkDetector';
import {
  startSmsListener, checkSmsPermissions, isSmsAvailable,
  onSmsReceived,
} from './engine/SmsService';
import { checkUssdPermissions, isUssdAvailable } from './engine/USSDService';
import { requestHdfcBalanceSms, pollHdfcBalanceSms, handleIncomingBalanceSms } from './engine/BalanceService';
import { PaymentManager } from './engine/PaymentManager';
import { startPendingTransactionMonitor } from './engine/PendingTransactionMonitor';
import { startSoundbox, stopSoundbox, updateSoundboxConfig } from './engine/PaymentSoundbox';
import { isWidgetAvailable, startPaymentWidget } from './engine/WidgetService';
import { getAutoBalanceSource } from './utils/paymentMode';
import { useTheme } from './theme';
import { RootNavigator } from './navigation/RootNavigator';

function AppContent() {
  const { colors, theme } = useTheme();

  const isOnboarded = useStore(state => state.user.isOnboarded);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const language = useStore(state => state.language);

  const setNetworkMode = useStore(state => state.setNetworkMode);
  const networkMode = useStore(state => state.networkMode);
  const setSmsPermissions = useStore(state => state.setSmsPermissions);
  const setUssdPermissions = useStore(state => state.setUssdPermissions);

  useEffect(() => {
    initializeStore().catch(console.error);
  }, []);

  useNetworkMonitor(setNetworkMode);

  const autoSwitchPaymentMode = useStore(state => state.settings.autoSwitchPaymentMode);
  const setSettings = useStore(state => state.setSettings);

  // Auto-switch wallet (online) ↔ bank/USSD (offline) for balance display
  useEffect(() => {
    if (autoSwitchPaymentMode === false) return;
    const source = getAutoBalanceSource(networkMode);
    const current = useStore.getState().settings.balanceSource;
    if (current !== source) {
      setSettings({ balanceSource: source });
    }
  }, [networkMode, autoSwitchPaymentMode, setSettings]);

  // Read soundbox settings from store
  const soundboxEnabled = useStore(state => state.settings.isSoundboxEnabled);
  const soundboxLanguage = useStore(state => state.settings.soundboxLanguage);

  useEffect(() => {
    if (!isOnboarded) return;
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      if (isSmsAvailable()) {
        const smsPerms = await checkSmsPermissions();
        setSmsPermissions(smsPerms);
        if (smsPerms.receive) {
          await startSmsListener();
          await startSoundbox({
            enabled: soundboxEnabled ?? true,
            language: soundboxLanguage || (language as any),
            announceCredits: true,
            announceDebits: false,
            speechRate: 0.5,
          });

          if (isWidgetAvailable()) {
            const widgetEnabled = useStore.getState().settings.isWidgetEnabled;
            if (widgetEnabled !== false) {
              startPaymentWidget({
                language: soundboxLanguage || (language as any),
                announceCredits: true,
                announceDebits: false,
              }).catch(console.warn);
            }
          }
        }
      }
      if (isUssdAvailable()) {
        const ussdPerms = await checkUssdPermissions();
        setUssdPermissions(ussdPerms);
      }
      
      useStore.getState().checkAndResetBudget();
      useStore.getState().recalculateSpending();
      PaymentManager.healthCheck().catch(console.warn);
    };

    init();

    return () => {
      mounted = false;
      stopSoundbox();
    };
  }, [isOnboarded, setSmsPermissions, setUssdPermissions]);

  // Lock app when going into background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        useStore.getState().setAuthenticated(false);
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  // Keep soundbox config in sync with settings changes
  useEffect(() => {
    updateSoundboxConfig({
      enabled: soundboxEnabled ?? true,
      language: soundboxLanguage || 'en',
    });
  }, [soundboxEnabled, soundboxLanguage]);

  // Auto-fetch HDFC bank balance on app open (if enabled in settings)
  useEffect(() => {
    if (!isOnboarded || !isAuthenticated) return;
    const { user, settings, setUser } = useStore.getState();
    if (!settings.autoBalanceOnAppOpen) return;
    if (settings.balanceSource !== 'BANK' || user.bank !== 'HDFC' || !isSmsAvailable()) return;

    let cleanupPoll: (() => void) | undefined;
    (async () => {
      try {
        const smsPerms = await checkSmsPermissions();
        if (!smsPerms.send || !smsPerms.receive) return;
        const sent = await requestHdfcBalanceSms({ reason: 'app-open' });
        if (!sent) return;
        const sinceMs = Date.now() - 10_000;
        cleanupPoll = await pollHdfcBalanceSms((bal) => {
          setUser({
            bankBalance: bal,
            balance: settings.balanceSource === 'BANK' ? bal : user.walletBalance,
          });
        }, undefined, { sinceMs });
      } catch (err) {
        console.warn('[App] HDFC balance auto-fetch failed:', err);
      }
    })();

    return () => cleanupPoll?.();
  }, [isOnboarded, isAuthenticated]);

  useEffect(() => {
    if (!isOnboarded || !isAuthenticated) return;
    return startPendingTransactionMonitor();
  }, [isOnboarded, isAuthenticated]);

  // Listen for incoming balance/payment SMS globally
  useEffect(() => {
    if (!isOnboarded || !isSmsAvailable()) return;
    const sub = onSmsReceived((sms) => {
      const bal = handleIncomingBalanceSms(sms);
      if (bal === null) return;
      const { settings, setUser } = useStore.getState();
      if (settings.balanceSource === 'BANK') {
        setUser({ bankBalance: bal, balance: bal });
      }
    });
    return () => sub.remove();
  }, [isOnboarded]);

  // Navigation Theme
  const navTheme = useMemo(() => ({
    dark: theme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: 'normal' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: 'bold' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  }), [theme, colors]);

  return (
    <NavigationContainer theme={navTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <RootNavigator />
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  const theme = useStore(state => state.theme);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <AppContent />
    </SafeAreaProvider>
  );
}

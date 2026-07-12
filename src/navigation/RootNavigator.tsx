import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../store/useStore';
import { useTheme, shadows } from '../theme';
import { translations } from '../utils/i18n';

// Screens
import { SplashScreen } from '../screens/splash/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { UserInfoScreen } from '../screens/onboarding/UserInfoScreen';
import { SimSelectionScreen } from '../screens/onboarding/SimSelectionScreen';
import { BankSelectionScreen } from '../screens/onboarding/BankSelectionScreen';
import { UssdVerificationScreen } from '../screens/onboarding/UssdVerificationScreen';
import { PinSetupScreen } from '../screens/onboarding/PinSetupScreen';
import { LockScreen } from '../screens/LockScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SendMoneyScreen } from '../screens/SendMoneyScreen';
import { QRScanScreen } from '../screens/QRScanScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AccountServicesScreen } from '../screens/AccountServicesScreen';
import { UpiPaymentScreen } from '../screens/UpiPaymentScreen';
import { ExpenseTrackerScreen } from '../screens/ExpenseTrackerScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';
import { WidgetSettingsScreen } from '../screens/WidgetSettingsScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ContactProfileScreen } from '../screens/ContactProfileScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SecurityCenterScreen } from '../screens/SecurityCenterScreen';
import { NotificationCenterScreen } from '../screens/NotificationCenterScreen';
import { MerchantDashboardScreen } from '../screens/MerchantDashboardScreen';
import { TransactionDetailsScreen } from '../screens/TransactionDetailsScreen';
import { MerchantQRScreen } from '../screens/MerchantQRScreen';

import {
  RootStackParamList,
  OnboardingStackParamList,
  HomeStackParamList,
  HistoryStackParamList,
  ProfileStackParamList,
  MainTabParamList
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Onboarding Stack ──────────────────────────────────────────────────
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="UserInfo" component={UserInfoScreen} />
      <OnboardingStack.Screen name="SimSelection" component={SimSelectionScreen} />
      <OnboardingStack.Screen name="BankSelection" component={BankSelectionScreen} />
      <OnboardingStack.Screen name="UssdVerification" component={UssdVerificationScreen} />
      <OnboardingStack.Screen name="PinSetup" component={PinSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

// ─── Home Stack ────────────────────────────────────────────────────────
function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="SendMoney" component={SendMoneyScreen} />
      <HomeStack.Screen name="AccountServices" component={AccountServicesScreen} />
      <HomeStack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <HomeStack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} />
    </HomeStack.Navigator>
  );
}

// ─── History Stack ─────────────────────────────────────────────────────
function HistoryNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <HistoryStack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
    </HistoryStack.Navigator>
  );
}

// ─── Profile Stack ─────────────────────────────────────────────────────
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="SecurityCenter" component={SecurityCenterScreen} />
      <ProfileStack.Screen name="Contacts" component={ContactsScreen} />
      <ProfileStack.Screen name="ContactProfile" component={ContactProfileScreen} />
      <ProfileStack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} />
      <ProfileStack.Screen name="MerchantQR" component={MerchantQRScreen} />
      <ProfileStack.Screen name="WidgetSettings" component={WidgetSettingsScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Custom Floating Bottom Tab Bar ───────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  const language = useStore(s => s.language);
  const t = translations[language] || translations.en;
  const insets = useSafeAreaInsets();

  if (!state?.routes) return null;

  const TAB_MAP: Record<string, { activeIcon: string; inactiveIcon: string; label: string }> = {
    HomeTab: { activeIcon: 'home-variant', inactiveIcon: 'home-variant-outline', label: 'Home' },
    ScanTab: { activeIcon: 'qrcode-scan', inactiveIcon: 'qrcode-scan', label: 'Scan' },
    HistoryTab: { activeIcon: 'clock', inactiveIcon: 'clock-outline', label: 'History' },
    ProfileTab: { activeIcon: 'account-circle', inactiveIcon: 'account-circle-outline', label: 'Account' },
  };

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }, shadows.card]}>
        {(state?.routes || []).map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_MAP[route.name];
          if (!config) return null;

          const isCenter = route.name === 'ScanTab';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.centerBtnWrap} activeOpacity={0.8}>
                <View style={[styles.centerBtn, shadows.button]}>
                  <Icon name="qrcode-scan" size={26} color="#FFF" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
              <Icon name={isFocused ? config.activeIcon : config.inactiveIcon} size={22} color={isFocused ? colors.primary : colors.textTertiary} />
              <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.textTertiary }]}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Tab Navigator ────────────────────────────────────────────────
function MainTabNavigator() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="ScanTab" component={QRScanScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ──────────────────────────────────────────────
export function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      <RootStack.Screen name="Lock" component={LockScreen} />
      <RootStack.Screen name="Main" component={MainTabNavigator} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  centerBtnWrap: {
    width: 60,
    height: 60,
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

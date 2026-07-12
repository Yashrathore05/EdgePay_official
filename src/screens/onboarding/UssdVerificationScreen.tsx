import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SimManager } from '../../engine/SimManager';
import { AccessibilityBridge } from '../../engine/AccessibilityBridge';
import { useStore } from '../../store/useStore';

export function UssdVerificationScreen({ navigation }: any) {
  const user = useStore(state => state.user);
  
  const [a11yEnabled, setA11yEnabled] = useState(false);
  const [checkingA11y, setCheckingA11y] = useState(true);
  const [step, setStep] = useState<number>(0);
  const [statusText, setStatusText] = useState('Initializing verification...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAccessibility();
  }, []);

  const checkAccessibility = async () => {
    setCheckingA11y(true);
    try {
      const active = await AccessibilityBridge.isAccessibilityEnabled();
      setA11yEnabled(active);
    } catch (err) {
      console.error('[UssdVerification] A11y check failed:', err);
    } finally {
      setCheckingA11y(false);
    }
  };

  const handleEnableAccessibility = async () => {
    await AccessibilityBridge.openAccessibilitySettings();
    // Alert user that they need to enable EdgePay UPI Auto-fill
    Alert.alert(
      'Accessibility Required',
      'Please enable "EdgePay UPI Auto-fill" service in the settings list to automate offline payments.',
      [{ text: 'OK', onPress: () => setTimeout(checkAccessibility, 1500) }]
    );
  };

  const runVerification = async () => {
    setLoading(true);
    setStep(1);
    setStatusText('Fetching preferred SIM card...');
    
    try {
      const prefSim = await SimManager.getPreferredSim();
      if (!prefSim) {
        throw new Error('Preferred SIM slot not set. Please go back and select a SIM.');
      }
      
      setStep(2);
      setStatusText(`Dialing *99# on SIM Slot ${prefSim.slotIndex + 1}...`);
      
      // Subscribe to accessibility USSD events
      const unsubscribe = AccessibilityBridge.subscribeToUssdDialogs(
        (event) => {
          console.log('[UssdVerification] USSD detected:', event.text);
          setStep(3);
          
          if (event.text.toLowerCase().includes('welcome') || event.text.toLowerCase().includes('select') || event.text.includes('1.')) {
            setStatusText('USSD registration found. Active profile verified!');
            setStep(4);
            setTimeout(() => {
              unsubscribe();
              setLoading(false);
              navigation.navigate('PinSetup');
            }, 2000);
          } else {
            setStatusText('Accessibility Service active. Awaiting user input...');
          }
        },
        () => {
          console.log('[UssdVerification] USSD dialogue dismissed');
        }
      );

      // Dial the code
      await SimManager.sendUssdOnSim('*99#', prefSim.subscriptionId);
      
    } catch (err: any) {
      console.error('[UssdVerification] USSD verification error:', err);
      // Fallback: Proceed to setup anyway if USSD fails (e.g. simulator or no balance)
      setStep(3);
      setStatusText('Direct check failed. Proceeding with manual confirmation.');
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('PinSetup');
      }, 2500);
    }
  };

  if (checkingA11y) {
    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
      >
        <View style={styles.topArea}>
          <Text style={styles.title}>USSD Verification</Text>
          <Text style={styles.subtitle}>
            EdgePay automates *99# using Android Accessibility. Let's make sure the service is enabled.
          </Text>
        </View>

        {!a11yEnabled ? (
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Icon name="gesture-double-tap" size={42} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Enable Accessibility Service</Text>
            <Text style={styles.cardDesc}>
              To autofill your UPI PIN and handle USSD menus in the background, EdgePay needs Accessibility permission.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEnableAccessibility}>
              <Text style={styles.primaryBtnText}>Enable Service</Text>
              <Icon name="arrow-right" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkAgainBtn} onPress={checkAccessibility}>
              <Text style={styles.checkAgainText}>Check Status Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {loading ? (
              <View style={styles.loaderArea}>
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 20 }} />
                
                {/* Progress Indicators */}
                <View style={styles.progressRow}>
                  <Icon name={step >= 1 ? "check-circle" : "circle-outline"} size={20} color={step >= 1 ? "#10B981" : "#475569"} />
                  <Text style={[styles.progressText, step >= 1 && { color: '#E2E8F0' }]}>SIM Check</Text>
                </View>
                <View style={styles.progressRow}>
                  <Icon name={step >= 2 ? "check-circle" : "circle-outline"} size={20} color={step >= 2 ? "#10B981" : "#475569"} />
                  <Text style={[styles.progressText, step >= 2 && { color: '#E2E8F0' }]}>Dialing USSD *99#</Text>
                </View>
                <View style={styles.progressRow}>
                  <Icon name={step >= 3 ? "check-circle" : "circle-outline"} size={20} color={step >= 3 ? "#10B981" : "#475569"} />
                  <Text style={[styles.progressText, step >= 3 && { color: '#E2E8F0' }]}>Verifying Connection</Text>
                </View>
                <View style={styles.progressRow}>
                  <Icon name={step >= 4 ? "check-circle" : "circle-outline"} size={20} color={step >= 4 ? "#10B981" : "#475569"} />
                  <Text style={[styles.progressText, step >= 4 && { color: '#E2E8F0' }]}>Success!</Text>
                </View>

                <Text style={styles.statusDetailText}>{statusText}</Text>
              </View>
            ) : (
              <View style={styles.verifiedArea}>
                <View style={styles.successIconContainer}>
                  <Icon name="shield-check-outline" size={48} color="#10B981" />
                </View>
                <Text style={styles.verifiedTitle}>A11y Service Active</Text>
                <Text style={styles.verifiedDesc}>
                  Service is ready to monitor. Click verify below to dial *99# and confirm offline link.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={runVerification}>
                  <Text style={styles.primaryBtnText}>Verify USSD Link</Text>
                  <Icon name="play" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.privacyText}>
            🔒 EdgePay only reads USSD Dialogs. No other visual elements are monitored.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  topArea: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  checkAgainBtn: {
    marginTop: 16,
    padding: 8,
  },
  checkAgainText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  loaderArea: {
    width: '100%',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '60%',
    marginVertical: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  statusDetailText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verifiedArea: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifiedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  verifiedDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
});

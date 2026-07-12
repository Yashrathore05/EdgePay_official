import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Alert, Vibration } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useStore } from '../../store/useStore';
import { hashPin } from '../../utils/crypto';

export function PinSetupScreen({ navigation }: any) {
  const setUser = useStore(state => state.setUser);
  const setSettings = useStore(state => state.setSettings);
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleNumberPress = (num: number) => {
    Vibration.vibrate(10);
    const current = isConfirming ? confirmPin : pin;
    if (current.length < 4) {
      if (isConfirming) {
        setConfirmPin(current + num);
      } else {
        setPin(current + num);
      }
    }
  };

  const handleDelete = () => {
    Vibration.vibrate(10);
    const current = isConfirming ? confirmPin : pin;
    if (current.length > 0) {
      if (isConfirming) {
        setConfirmPin(current.slice(0, -1));
      } else {
        setPin(current.slice(0, -1));
      }
    }
  };

  const handleNextStep = async () => {
    if (!isConfirming) {
      if (pin.length < 4) {
        Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN.');
        return;
      }
      setIsConfirming(true);
    } else {
      if (confirmPin.length < 4) {
        Alert.alert('Invalid PIN', 'Please enter the confirmation PIN.');
        return;
      }
      
      if (pin !== confirmPin) {
        Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
        setConfirmPin('');
        setIsConfirming(false);
        setPin('');
        return;
      }

      // Hash PIN securely
      const pinHash = hashPin(pin);
      
      // Check Biometric enrollment support
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { available } = await rnBiometrics.isSensorAvailable();
        
        if (available) {
          Alert.alert(
            'Biometrics Available',
            'Would you like to enable fingerprint or face unlock to access the app?',
            [
              {
                text: 'No',
                onPress: () => completeOnboarding(pinHash, false),
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: () => completeOnboarding(pinHash, true),
              },
            ]
          );
        } else {
          completeOnboarding(pinHash, false);
        }
      } catch (err) {
        console.error('[PinSetup] Biometrics check failed:', err);
        completeOnboarding(pinHash, false);
      }
    }
  };

  const completeOnboarding = (pinHash: string, useBiometrics: boolean) => {
    // Write setup info to store & AsyncStorage
    setSettings({
      pinHash,
      isBiometricEnabled: useBiometrics,
    });
    
    // Complete onboarding status
    setUser({
      isOnboarded: true,
    });

    // Authenticate app session
    useStore.getState().setAuthenticated(true);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const renderDots = () => {
    const length = isConfirming ? confirmPin.length : pin.length;
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < length && styles.dotFilled,
              isConfirming && { backgroundColor: index < length ? '#10B981' : '#334155' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
      >
        <View style={styles.topArea}>
          <Text style={styles.title}>
            {isConfirming ? 'Confirm App PIN' : 'Set App PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {isConfirming
              ? 'Re-enter your 4-digit PIN to confirm secure access.'
              : 'Create a 4-digit security PIN to lock EdgePay.'}
          </Text>
        </View>

        <View style={styles.inputArea}>
          {renderDots()}
        </View>

        {/* Custom Numeric PinPad */}
        <View style={styles.pinpad}>
          <View style={styles.row}>
            {[1, 2, 3].map(n => (
              <TouchableOpacity key={n} style={styles.key} onPress={() => handleNumberPress(n)}>
                <Text style={styles.keyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            {[4, 5, 6].map(n => (
              <TouchableOpacity key={n} style={styles.key} onPress={() => handleNumberPress(n)}>
                <Text style={styles.keyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            {[7, 8, 9].map(n => (
              <TouchableOpacity key={n} style={styles.key} onPress={() => handleNumberPress(n)}>
                <Text style={styles.keyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.keyDummy} />
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress(0)}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={handleDelete}>
              <Icon name="backspace-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isConfirming ? confirmPin.length : pin.length) < 4 && styles.buttonDisabled
          ]}
          onPress={handleNextStep}
          disabled={(isConfirming ? confirmPin.length : pin.length) < 4}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{isConfirming ? 'Confirm & Finish' : 'Next'}</Text>
          <Icon name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 20,
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
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  inputArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dotFilled: {
    backgroundColor: '#3B82F6',
  },
  pinpad: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  keyDummy: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
  },
  button: {
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

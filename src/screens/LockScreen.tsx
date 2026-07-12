import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Vibration } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';
import { authenticate, isBiometricAvailable } from '../engine/BiometricService';
import { useTheme } from '../theme';
import { hashPin } from '../utils/crypto';

export const LockScreen: React.FC = () => {
  const { colors } = useTheme();
  const setAuthenticated = useStore(state => state.setAuthenticated);
  const settings = useStore(state => state.settings);
  const user = useStore(state => state.user);

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (settings.isBiometricEnabled) {
      handleBiometric();
    }
  }, []);

  const handleBiometric = async () => {
    const available = await isBiometricAvailable();
    if (available) {
      const success = await authenticate('Unlock EdgePay');
      if (success) {
        setAuthenticated(true);
      }
    }
  };

  const handleKeyPress = (key: string) => {
    Vibration.vibrate(10);
    if (error) setError(false);
    
    if (key === 'del') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const verifyPin = (currentPin: string) => {
    const targetHash = settings.pinHash;
    if (hashPin(currentPin) === targetHash) {
      setAuthenticated(true);
    } else {
      setError(true);
      Vibration.vibrate([0, 100, 50, 100]);
      setTimeout(() => setPin(''), 1000);
    }
  };

  return (
    <View style={[s.screen, { backgroundColor: '#0F172A' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={s.header}>
        <View style={s.logoWrap}>
          <Icon name="lightning-bolt" size={32} color="#3B82F6" />
        </View>
        <Text style={s.title}>Welcome back,</Text>
        <Text style={s.name}>{user.name ? user.name.split(' ')[0] : 'User'}</Text>
      </View>

      <View style={s.dotsContainer}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              s.dot,
              { 
                backgroundColor: pin.length > i ? (error ? '#EF4444' : '#3B82F6') : '#334155',
                borderColor: error ? '#EF4444' : 'transparent',
                borderWidth: error ? 1 : 0
              }
            ]}
          />
        ))}
      </View>

      {error ? (
        <Text style={s.errorText}>Incorrect Security PIN</Text>
      ) : (
        <Text style={s.promptText}>Enter PIN to unlock</Text>
      )}

      <View style={s.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, i) => (
          <View key={i} style={s.row}>
            {row.map(key => (
              <TouchableOpacity
                key={key}
                style={s.key}
                onPress={() => handleKeyPress(key)}
              >
                <Text style={s.keyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={s.row}>
          <TouchableOpacity
            style={s.key}
            onPress={handleBiometric}
            disabled={!settings.isBiometricEnabled}
          >
            {settings.isBiometricEnabled && <Icon name="fingerprint" size={28} color="#3B82F6" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.key}
            onPress={() => handleKeyPress('0')}
          >
            <Text style={s.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.key}
            onPress={() => handleKeyPress('del')}
          >
            <Icon name="backspace-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  title: { fontSize: 16, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  name: { fontSize: 28, color: '#FFF', fontWeight: '800' },
  dotsContainer: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  errorText: { fontSize: 13, color: '#EF4444', fontWeight: '700', marginBottom: 20 },
  promptText: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 20 },
  keypad: { width: '100%', maxWidth: 300, gap: 16, marginTop: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
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
  keyText: { fontSize: 24, color: '#FFF', fontWeight: '600' },
});

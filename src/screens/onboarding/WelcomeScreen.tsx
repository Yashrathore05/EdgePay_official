import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <Icon name="lightning-bolt" size={64} color="#3B82F6" />
          </View>
          
          <Text style={styles.title}>Welcome to EdgePay</Text>
          <Text style={styles.description}>
            Experience lightning fast UPI payments without internet. Powered by secure USSD automation and offline communication.
          </Text>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Icon name="wifi-off" size={24} color="#10B981" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>100% Offline Payments</Text>
                <Text style={styles.featureDesc}>Pay merchants and friends using *99# even in low network areas.</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Icon name="shield-check" size={24} color="#3B82F6" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Secure Autofill</Text>
                <Text style={styles.featureDesc}>Accessibility service handles USSD inputs so you never struggle.</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('UserInfo')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
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
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 40,
  },
  features: {
    width: '100%',
    gap: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

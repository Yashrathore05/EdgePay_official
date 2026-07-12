import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SimManager, SimInfo } from '../../engine/SimManager';
import { useTheme } from '../../theme';

export function SimSelectionScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  const [sims, setSims] = useState<SimInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSims();
  }, []);

  const loadSims = async () => {
    setLoading(true);
    try {
      const availableSims = await SimManager.getAvailableSims();
      setSims(availableSims);
      
      if (availableSims.length > 0) {
        // Pre-select first SIM
        setSelectedSlot(availableSims[0].slotIndex);
      }
    } catch (err) {
      console.error('[SimSelection] Error loading SIMs:', err);
      Alert.alert('SIM Detection Failed', 'Please grant READ_PHONE_STATE permission to detect SIM cards.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (selectedSlot === null) {
      Alert.alert('No SIM Selected', 'Please select a SIM card to use for USSD transactions.');
      return;
    }
    
    const selected = sims.find(s => s.slotIndex === selectedSlot);
    if (selected) {
      await SimManager.setPreferredSim(selected.slotIndex, selected.subscriptionId);
      navigation.navigate('BankSelection');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
      >
        <View style={styles.topArea}>
          <Text style={styles.title}>Select SIM Card</Text>
          <Text style={styles.subtitle}>
            EdgePay needs to know which SIM card to run USSD (*99#) operations on.
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Detecting SIM cards...</Text>
          </View>
        ) : sims.length === 0 ? (
          <View style={styles.center}>
            <Icon name="sim-alert" size={54} color="#EF4444" />
            <Text style={styles.noSimTitle}>No SIM Cards Detected</Text>
            <Text style={styles.noSimDesc}>
              Make sure a valid SIM card is inserted and phone state permissions are granted.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadSims}>
              <Text style={styles.retryText}>Retry Detection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {sims.map((sim) => {
              const isSelected = selectedSlot === sim.slotIndex;
              return (
                <TouchableOpacity
                  key={sim.slotIndex}
                  style={[
                    styles.simCard,
                    isSelected && { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)' }
                  ]}
                  onPress={() => setSelectedSlot(sim.slotIndex)}
                  activeOpacity={0.7}
                >
                  <View style={styles.simLeft}>
                    <View style={[styles.simIconContainer, isSelected && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Icon name="sim" size={24} color={isSelected ? '#3B82F6' : '#64748B'} />
                    </View>
                    <View>
                      <Text style={styles.simCarrier}>{sim.carrierName}</Text>
                      <Text style={styles.simDetails}>Slot {sim.slotIndex + 1} {sim.number ? `• ${sim.number}` : ''}</Text>
                    </View>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, selectedSlot === null && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedSlot === null}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  noSimTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noSimDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    gap: 16,
    paddingTop: 8,
  },
  simCard: {
    height: 76,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  simLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  simIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simCarrier: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  simDetails: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
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

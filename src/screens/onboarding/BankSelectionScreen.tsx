import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SUPPORTED_BANKS } from '../../utils/constants';
import { useStore } from '../../store/useStore';

export function BankSelectionScreen({ navigation }: any) {
  const setUser = useStore(state => state.setUser);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const filteredBanks = SUPPORTED_BANKS.filter(bank =>
    bank.name.toLowerCase().includes(search.toLowerCase()) ||
    bank.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = () => {
    if (!selectedBank) {
      Alert.alert('No Bank Selected', 'Please select your primary bank account to proceed.');
      return;
    }
    
    setUser({ bank: selectedBank });
    navigation.navigate('UssdVerification');
  };

  const getBankIcon = (code: string) => {
    switch (code) {
      case 'SBI': return { icon: 'bank', color: '#00A4E4', bg: 'rgba(0, 164, 228, 0.1)' };
      case 'HDFC': return { icon: 'bank', color: '#004C8F', bg: 'rgba(0, 76, 143, 0.1)' };
      case 'PNB': return { icon: 'bank', color: '#A3241C', bg: 'rgba(163, 36, 28, 0.1)' };
      case 'BOB': return { icon: 'bank', color: '#FF5E00', bg: 'rgba(255, 94, 0, 0.1)' };
      case 'CANARA': return { icon: 'bank', color: '#0084FF', bg: 'rgba(0, 132, 255, 0.1)' };
      case 'UNION': return { icon: 'bank', color: '#C8102E', bg: 'rgba(200, 16, 46, 0.1)' };
      default: return { icon: 'bank', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' };
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
          <Text style={styles.title}>Select Your Bank</Text>
          <Text style={styles.subtitle}>
            Choose the bank linked to your mobile number. EdgePay will register it via *99#.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Icon name="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bank name..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Bank Grid / List */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {filteredBanks.map((bank) => {
              const isSelected = selectedBank === bank.code;
              const theme = getBankIcon(bank.code);
              return (
                <TouchableOpacity
                  key={bank.code}
                  style={[
                    styles.bankCard,
                    isSelected && { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)' }
                  ]}
                  onPress={() => setSelectedBank(bank.code)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bankIconContainer, { backgroundColor: theme.bg }]}>
                    <Icon name={theme.icon} size={28} color={theme.color} />
                  </View>
                  <Text style={styles.bankName} numberOfLines={2}>{bank.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{bank.code}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Icon name="check-circle" size={20} color="#3B82F6" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, !selectedBank && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selectedBank}
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
  },
  topArea: {
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
    lineHeight: 20,
  },
  searchWrapper: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    marginLeft: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  bankCard: {
    width: '47%',
    aspectRatio: 1.05,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  bankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 18,
    marginTop: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  button: {
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
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

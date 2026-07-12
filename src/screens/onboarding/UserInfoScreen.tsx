import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../../store/useStore';

export function UserInfoScreen({ navigation }: any) {
  const setUser = useStore(state => state.setUser);
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [username, setUsername] = useState('');
  
  const [errors, setErrors] = useState<{ name?: string; age?: string; username?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    
    if (!name.trim()) {
      nextErrors.name = 'Full name is required';
    }
    
    const parsedAge = parseInt(age, 10);
    if (!age) {
      nextErrors.age = 'Age is required';
    } else if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 100) {
      nextErrors.age = 'Age must be between 13 and 100';
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!username.trim()) {
      nextErrors.username = 'Username is required';
    } else if (!usernameRegex.test(username)) {
      nextErrors.username = '3-20 characters, alphanumeric & underscores only';
    }
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      setUser({
        name: name.trim(),
        upiId: `${username.trim()}@upi`,
      });
      // Stash username for any subsequent screen logic or API needs
      navigation.navigate('SimSelection');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>Enter your details to create your secure EdgePay profile.</Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <Icon name="account" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#475569"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Age Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <View style={[styles.inputWrapper, errors.age && styles.inputError]}>
                <Icon name="calendar-range" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter age"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  maxLength={3}
                  value={age}
                  onChangeText={setAge}
                />
              </View>
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                <Icon name="at" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose username"
                  placeholderTextColor="#475569"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.hintText}>Your UPI ID will be: {username ? `${username}@upi` : 'your_username@upi'}</Text>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Icon name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 36,
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
  form: {
    gap: 20,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  inputWrapper: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
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

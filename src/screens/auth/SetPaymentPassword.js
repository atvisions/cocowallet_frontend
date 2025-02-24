import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWallet } from '../../contexts/WalletContext';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import PasswordDots from '../../components/common/PasswordDots';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6;

export default function SetPaymentPassword({ navigation }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isBiometricSupported, toggleBiometric } = useWallet();
  const [useBiometric, setUseBiometric] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetPassword = async () => {
    if (password.length !== 6 || confirmPassword.length !== 6) {
      Alert.alert('Error', 'Password must be 6 digits');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      
      if (useBiometric) {
        const biometricAuth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity',
          cancelLabel: 'Cancel',
          disableDeviceFallback: true,
        });

        if (!biometricAuth.success) {
          Alert.alert('Error', 'Biometric verification failed');
          return;
        }
      }

      await api.setPaymentPassword(deviceId, password, confirmPassword, useBiometric);
      
      if (useBiometric) {
        await toggleBiometric(true);
      }

      await DeviceManager.setPaymentPasswordStatus(true);
      
      setStep(4);
      
      setTimeout(() => {
        navigation.navigate('Settings');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to set payment password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#1FC595" />
          </View>
          <Text style={styles.successTitle}>Success</Text>
          <Text style={styles.successDescription}>
            Payment password set successfully
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaViewContext style={styles.container} edges={['right', 'left']}>
      <View style={styles.content}>
        <Header 
          title="Set Payment Password"
          onBack={() => navigation.goBack()}
          showBackButton={true}
        />

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Set a 6-digit payment password to protect your assets
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter 6-digit password"
            placeholderTextColor="#8E8E8E"
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor="#8E8E8E"
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.button,
            (!password || !confirmPassword) && styles.buttonDisabled
          ]}
          onPress={handleSetPassword}
          disabled={!password || !confirmPassword}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>

        {isBiometricSupported && (
          <TouchableOpacity 
            style={styles.biometricOption}
            onPress={() => setUseBiometric(!useBiometric)}
          >
            <View style={styles.checkboxContainer}>
              <Ionicons
                name={useBiometric ? "checkbox" : "square-outline"}
                size={24}
                color={useBiometric ? "#1FC595" : "#8E8E8E"}
              />
              <Text style={styles.biometricText}>
                Enable fingerprint for future use
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      {loading && <Loading />}
    </SafeAreaViewContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  description: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    backgroundColor: '#1FC59580',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricOption: {
    marginTop: 24,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
  },
}); 
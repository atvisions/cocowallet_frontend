import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import * as Clipboard from 'expo-clipboard';
import Header from '../components/Header';
import * as LocalAuthentication from 'expo-local-authentication';

export default function ShowPrivateKey({ route, navigation }) {
  const { wallet } = route.params;
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    if (password.length === 6) {
      handleShowPrivateKey();
    }
  }, [password]);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const handleNumberPress = (number) => {
    if (password.length < 6) {
      setPassword(prev => prev + number);
    }
  };

  const handleDelete = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handleShowPrivateKey = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getPrivateKey(wallet.id, deviceId, password);
      
      if (response?.private_key) {
        setPrivateKey(response.private_key);
        setPassword('');
      }
    } catch (error) {
      console.error('Show private key error:', error);
      Alert.alert('Error', error.message || 'Failed to get private key');
      setPassword('');
    }
  };

  const handleCopy = async () => {
    if (privateKey) {
      await Clipboard.setStringAsync(privateKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      if (result.success) {
        const deviceId = await DeviceManager.getDeviceId();
        const response = await api.getPrivateKey(wallet.id, deviceId, '');
        
        if (response?.private_key) {
          setPrivateKey(response.private_key);
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const renderPasswordDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < password.length && styles.dotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['', 0, 'delete']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((num, j) => (
              <TouchableOpacity
                key={j}
                style={[
                  styles.numberButton,
                  num === '' && styles.emptyButton
                ]}
                onPress={() => {
                  if (num === 'delete') {
                    handleDelete();
                  } else if (num !== '') {
                    handleNumberPress(num);
                  }
                }}
                disabled={num === ''}
              >
                {num === 'delete' ? (
                  <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
                ) : (
                  <Text style={styles.numberText}>{num}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const SecurityConfirmation = () => {
    const handleContinue = () => {
      if (isConfirmed) {
        setShowPasswordInput(true);
      }
    };

    return (
      <View style={styles.securityContainer}>
        <View style={styles.topSection}>
          <View style={styles.warningIconContainer}>
            <Ionicons name="warning" size={48} color="#FF4B55" />
          </View>
          
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Security Warning</Text>
            <View style={styles.warningList}>
              <View style={styles.warningItem}>
                <Ionicons name="alert-circle" size={20} color="#FF4B55" />
                <Text style={styles.warningItemText}>
                  Never share your private key with anyone
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Ionicons name="alert-circle" size={20} color="#FF4B55" />
                <Text style={styles.warningItemText}>
                  Never enter your private key on any website
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Ionicons name="alert-circle" size={20} color="#FF4B55" />
                <Text style={styles.warningItemText}>
                  Anyone with your private key can access your wallet
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Ionicons name="alert-circle" size={20} color="#FF4B55" />
                <Text style={styles.warningItemText}>
                  Keep it in a safe place
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsConfirmed(!isConfirmed)}
            >
              <Ionicons
                name={isConfirmed ? "checkbox" : "square-outline"}
                size={20}
                color={isConfirmed ? "#1FC595" : "#8E8E8E"}
              />
              <Text style={styles.checkboxText}>
                I understand the risks and want to proceed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !isConfirmed && styles.confirmButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isConfirmed}
          >
            <Text style={[
              styles.confirmButtonText,
              !isConfirmed && styles.confirmButtonTextDisabled
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const PasswordInput = () => (
    <>
      <Text style={styles.warningText}>
        Enter payment password to view private key
      </Text>
      {isBiometricSupported && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricAuth}
        >
          <Ionicons 
            name={Platform.OS === 'ios' ? "finger-print" : "fingerprint"}
            size={24}
            color="#1FC595"
          />
          <Text style={styles.biometricText}>
            Use fingerprint
          </Text>
        </TouchableOpacity>
      )}
      {renderPasswordDots()}
      {renderNumberPad()}
    </>
  );

  return (
    <View style={styles.container}>
      <Header 
        title={privateKey ? "Private Key" : (showPasswordInput ? "Enter Password" : "Security Check")}
        onBack={() => navigation.goBack()} 
      />

      <View style={styles.content}>
        {!showPasswordInput ? (
          <SecurityConfirmation />
        ) : !privateKey ? (
          <PasswordInput />
        ) : (
          <View style={styles.privateKeyContainer}>
            <Text style={[styles.warningText, styles.dangerText]}>
              Never share your private key with anyone!
            </Text>
            <View style={styles.keyBox}>
              <Text style={styles.privateKeyText}>{privateKey}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopy}
              >
                <Ionicons 
                  name={isCopied ? "checkmark-circle" : "copy-outline"} 
                  size={24} 
                  color={isCopied ? "#1FC595" : "#8E8E8E"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
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
  warningText: {
    color: '#8E8E8E',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  dangerText: {
    color: '#FF4B55',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#272C52',
    marginHorizontal: 8,
  },
  dotFilled: {
    backgroundColor: '#1FC595',
  },
  numberPad: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#272C52',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  privateKeyContainer: {
    marginTop: 20,
  },
  keyBox: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateKeyText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
  },
  securityContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  warningIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  securityContent: {
    paddingHorizontal: 20,
  },
  securityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningList: {
    backgroundColor: '#272C52',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  warningItemText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  confirmationSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkboxText: {
    color: '#8E8E8E',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#272C52',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#8E8E8E',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  biometricText: {
    color: '#1FC595',
    fontSize: 16,
    marginLeft: 8,
  },
}); 
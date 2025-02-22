import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import Header from '../components/Header';
import Loading from '../components/Loading';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6;

export default function SetPassword({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const isPaymentPassword = route.params?.type === 'payment';

  const handleNumberPress = (number) => {
    const currentPassword = isConfirming ? confirmPassword : password;
    
    if (currentPassword.length < 6) {
      const newValue = currentPassword + number;
      
      if (isConfirming) {
        setConfirmPassword(newValue);
        if (newValue.length === 6) {
          setTimeout(() => {
            handleSetPassword(newValue);
          }, 200);
        }
      } else {
        setPassword(newValue);
        if (newValue.length === 6) {
          setTimeout(() => {
            handleSetPassword(newValue);
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isConfirming) {
      setConfirmPassword(prev => prev.slice(0, -1));
    } else {
      setPassword(prev => prev.slice(0, -1));
    }
  };

  const handleSetPassword = async (currentValue) => {
    setError('');
    
    const inputValue = currentValue || (isConfirming ? confirmPassword : password);
    console.log('Processing password:', { inputValue, isConfirming });

    if (inputValue.length !== 6) {
      setError('Please enter 6 digits password');
      return;
    }

    if (!isConfirming) {
      setTimeout(() => {
        setIsConfirming(true);
        setConfirmPassword('');
      }, 100);
      return;
    }

    if (password !== inputValue) {
      setError('Passwords do not match');
      setConfirmPassword('');
      return;
    }

    try {
      setLoading(true);
      const deviceId = await DeviceManager.getDeviceId();

      if (isPaymentPassword) {
        await api.setPaymentPassword(deviceId, password, inputValue);
        await DeviceManager.setPaymentPasswordStatus(true);
        navigation.goBack();
      } else {
        await DeviceManager.setPassword(password);
        navigation.navigate('SelectChain', { deviceId });
      }
    } catch (error) {
      setError(error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const renderPinDots = () => {
    const dots = [];
    const currentPassword = isConfirming ? confirmPassword : password;

    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            i < currentPassword.length && styles.dotFilled
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={isPaymentPassword ? "Set Payment Password" : "Set Password"}
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.mainContent}>
        <View style={styles.headerSection}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, !isConfirming && styles.activeStepDot]} />
            <View style={[styles.stepLine, isConfirming && styles.activeStepLine]} />
            <View style={[styles.stepDot, isConfirming && styles.activeStepDot]} />
          </View>
          
          <Text style={styles.stepDescription}>
            {isPaymentPassword 
              ? 'Set a 6-digit payment password to protect your assets'
              : 'Set a 6-digit password to protect your wallet'}
          </Text>
        </View>

        <View style={styles.pinSection}>
          <View style={styles.pinContainer}>
            {renderPinDots()}
          </View>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF4B55" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.keypadSection}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.keypadButton,
                item === '' && styles.emptyButton
              ]}
              onPress={() => {
                if (item === 'delete') {
                  handleDelete();
                } else if (item !== '') {
                  handleNumberPress(item.toString());
                }
              }}
            >
              {item === 'delete' ? (
                <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
              ) : item !== '' ? (
                <Text style={styles.keypadButtonText}>{item}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading && <Loading />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    paddingTop: 32,
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeStepDot: {
    backgroundColor: '#1FC595',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  activeStepLine: {
    backgroundColor: '#1FC595',
  },
  stepDescription: {
    fontSize: 15,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  pinSection: {
    marginTop: 48,
    alignItems: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotFilled: {
    backgroundColor: '#1FC595',
    borderColor: '#1FC595',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 75, 85, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  errorText: {
    color: '#FF4B55',
    fontSize: 14,
    marginLeft: 8,
  },
  keypadSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  keypadButton: {
    width: (width - 96) / 3,
    height: (width - 96) / 3,
    borderRadius: (width - 96) / 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  keypadButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '500',
  },
});
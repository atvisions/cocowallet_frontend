import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import PasswordDots from '../../components/common/PasswordDots';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6;

export default function SetPassword({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const handleNumberPress = (number) => {
    const currentPassword = step === 1 ? password : confirmPassword;
    
    if (currentPassword.length < 6) {
      const newValue = currentPassword + number;
      
      if (step === 2) {
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
            handleNext(newValue);
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 2) {
      setConfirmPassword(prev => prev.slice(0, -1));
    } else {
      setPassword(prev => prev.slice(0, -1));
    }
  };

  const handleNext = async (currentValue) => {
    setError('');
    
    const inputValue = currentValue || password;
    
    if (inputValue.length !== 6) {
      setError('Please enter 6 digits password');
      return;
    }

    setStep(2);
    setConfirmPassword('');
  };

  const handleSetPassword = async (currentValue) => {
    const currentConfirmPassword = currentValue || confirmPassword;
    
    if (currentConfirmPassword.length !== 6) {
      setError('Please enter confirmation password');
      setConfirmPassword('');
      return;
    }

    if (password !== currentConfirmPassword) {
      setError('Passwords do not match');
      setConfirmPassword('');
      return;
    }

    try {
      setLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      await DeviceManager.setPassword(password);
      
      navigation.replace('SelectChain', { deviceId });
    } catch (error) {
      setError(error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaViewContext 
      style={styles.container} 
      edges={['top', 'right', 'left']}
    >
      <View style={styles.content}>
        <Header 
          title="Set Password"
          showBackButton={false}
        />
        
        <View style={styles.mainContent}>
          <View style={styles.headerSection}>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step === 1 && styles.activeStepDot]} />
              <View style={[styles.stepLine, step === 2 && styles.activeStepLine]} />
              <View style={[styles.stepDot, step === 2 && styles.activeStepDot]} />
            </View>
            
            <Text style={styles.stepDescription}>
              Set a 6-digit password to protect your wallet
            </Text>
          </View>

          <View style={styles.pinSection}>
            <PasswordDots
              length={6}
              filledCount={step === 1 ? password.length : confirmPassword.length}
            />
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
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
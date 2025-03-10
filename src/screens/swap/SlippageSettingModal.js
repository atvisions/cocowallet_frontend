import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SlippageSettingModal = ({ visible, onClose, currentSlippage, onConfirm }) => {
  const [slippage, setSlippage] = useState(currentSlippage);
  const [customSlippage, setCustomSlippage] = useState('');
  const [error, setError] = useState('');

  const presetValues = ['0.1', '0.5', '1.0'];

  const handleSlippageSelect = (value) => {
    setSlippage(value);
    setCustomSlippage('');
    setError('');
  };

  const handleCustomSlippageChange = (value) => {
    // Remove non-numeric and non-decimal characters
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts[1];
    }
    
    // Limit to 1 decimal place
    if (parts.length === 2 && parts[1].length > 1) {
      value = parts[0] + '.' + parts[1].slice(0, 1);
    }

    setCustomSlippage(value);
    setSlippage(value);

    // Validate the input
    const numValue = parseFloat(value);
    if (numValue > 5) {
      setError('High slippage increases risk of price impact');
    } else if (numValue < 0.1) {
      setError('Transaction may fail due to price movement');
    } else {
      setError('');
    }
  };

  const handleConfirm = () => {
    if (!error) {
      onConfirm(slippage);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Slippage Tolerance</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8E8E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Your transaction will revert if the price changes unfavorably by more than this percentage.
          </Text>

          <View style={styles.presetContainer}>
            {presetValues.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.presetButton,
                  slippage === value && styles.presetButtonSelected
                ]}
                onPress={() => handleSlippageSelect(value)}
              >
                <Text style={[
                  styles.presetButtonText,
                  slippage === value && styles.presetButtonTextSelected
                ]}>
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
            
            <View style={styles.customInputContainer}>
              <TextInput
                style={[
                  styles.customInput,
                  customSlippage !== '' && styles.customInputSelected
                ]}
                placeholder="Custom"
                placeholderTextColor="#8E8E8E"
                keyboardType="decimal-pad"
                value={customSlippage}
                onChangeText={handleCustomSlippageChange}
              />
              <Text style={styles.percentageSign}>%</Text>
            </View>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.confirmButton, error ? styles.confirmButtonDisabled : null]}
            onPress={handleConfirm}
            disabled={!!error}
          >
            <LinearGradient
              colors={error ? ['#666666', '#444444'] : ['#1FC595', '#17A982']}
              style={styles.confirmButtonGradient}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#272C52',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    color: '#8E8E8E',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  presetButton: {
    backgroundColor: '#1B2C41',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#1FC595',
  },
  presetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  presetButtonTextSelected: {
    fontWeight: '600',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C41',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  customInput: {
    color: '#FFFFFF',
    fontSize: 16,
    width: 60,
    padding: 12,
  },
  customInputSelected: {
    color: '#1FC595',
  },
  percentageSign: {
    color: '#8E8E8E',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
  },
  confirmButton: {
    marginTop: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SlippageSettingModal; 
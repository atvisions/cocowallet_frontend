import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';
import * as Clipboard from 'expo-clipboard';

export default function SendScreen({ navigation, route }) {
  const { selectedWallet } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setRecipientAddress(text);
  };

  const handleScan = () => {
    // TODO: Implement QR code scanning
    navigation.navigate('QRScanner', {
      onScan: (address) => {
        setRecipientAddress(address);
      }
    });
  };

  const validateAddress = (address) => {
    // TODO: Implement proper address validation based on chain type
    return address.length > 30;
  };

  const validateAmount = (value) => {
    const numberValue = parseFloat(value);
    return !isNaN(numberValue) && numberValue > 0;
  };

  const handleContinue = () => {
    if (!recipientAddress.trim()) {
      Alert.alert('Error', 'Please enter recipient address');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    if (!validateAmount(amount)) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    // Navigate to confirmation screen
    navigation.navigate('SendConfirmation', {
      recipientAddress,
      amount,
      token: selectedWallet.chain,
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title="Send"
        onBack={() => navigation.goBack()}
      />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.formSection}>
          <Text style={styles.label}>To Address</Text>
          <View style={styles.addressInputContainer}>
            <TextInput
              style={styles.addressInput}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder="Enter or paste address"
              placeholderTextColor="#8E8E8E"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.addressActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handlePaste}
              >
                <Ionicons name="clipboard-outline" size={20} color="#1FC595" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleScan}
              >
                <Ionicons name="scan-outline" size={20} color="#1FC595" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#8E8E8E"
              keyboardType="decimal-pad"
            />
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{selectedWallet?.chain}</Text>
              <TouchableOpacity style={styles.maxButton}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceText}>
              Balance: {selectedWallet?.balance || '0.00'} {selectedWallet?.chain}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton,
            (!recipientAddress || !amount) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!recipientAddress || !amount}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  contentContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  addressInputContainer: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  addressInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  addressActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  amountInputContainer: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  maxButton: {
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maxButtonText: {
    color: '#1FC595',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceInfo: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  balanceText: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

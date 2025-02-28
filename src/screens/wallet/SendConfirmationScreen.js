import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';

export default function SendConfirmationScreen({ navigation, route }) {
  const { recipientAddress, amount, token } = route.params;
  const { selectedWallet } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = () => {
    navigation.navigate('PasswordVerification', {
      screen: 'PasswordInput',
      params: {
        purpose: 'send_transaction',
        title: 'Confirm Transaction',
        onSuccess: async (password) => {
          await processSendTransaction(password);
          return true;
        }
      }
    });
  };

  const processSendTransaction = async (password) => {
    try {
      setIsProcessing(true);
      const deviceId = await DeviceManager.getDeviceId();
      
      const response = await api.sendTransaction(deviceId, {
        fromAddress: selectedWallet.address,
        toAddress: recipientAddress,
        amount: amount,
        token: token,
        password: password
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Transaction sent successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to wallet screen
                navigation.navigate('Main');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      Alert.alert('Error', 'Failed to send transaction. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return address.length > 16
      ? `${address.slice(0, 8)}...${address.slice(-8)}`
      : address;
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Confirm Transaction"
        onBack={() => navigation.goBack()}
      />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amount}>{amount} {token}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue}>
                {formatAddress(selectedWallet?.address)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>
                {formatAddress(recipientAddress)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>~0.001 {token}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#272C52',
    borderRadius: 16,
    padding: 20,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(142, 142, 142, 0.1)',
    marginVertical: 20,
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

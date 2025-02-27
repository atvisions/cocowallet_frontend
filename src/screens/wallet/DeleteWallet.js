import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import Header from '../../components/common/Header';
import { useWallet } from '../../contexts/WalletContext';
import { CommonActions } from '@react-navigation/native';

export default function DeleteWallet({ route, navigation }) {
  const { wallet } = route.params;
  const { selectedWallet, updateSelectedWallet, wallets, setWallets } = useWallet();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    navigation.navigate('PasswordVerification', {
      screen: 'PasswordInput',
      params: {
        purpose: 'delete_wallet',
        title: 'Delete Wallet',
        walletId: wallet.id,
      onSuccess: async (password) => {
        try {
          const deviceId = await DeviceManager.getDeviceId();
          const response = await api.deleteWallet(wallet.id, deviceId, password);
          
          if (response.status === 'success') {
            const updatedWallets = wallets.filter(w => w.id !== wallet.id);
            
            if (updatedWallets.length === 0) {
              updateSelectedWallet(null);
              setWallets([]);
              
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }]
                })
              );
            } else {
              if (selectedWallet?.id === wallet.id) {
                updateSelectedWallet(updatedWallets[0]);
              }
              setWallets(updatedWallets);
              
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Tabs',
                      state: {
                        routes: [
                          { 
                            name: 'Wallet',
                            params: { refresh: true }
                          }
                        ]
                      }
                    }
                  ],
                })
              );
            }
            return true;
          } else {
            return { error: response.message || 'Failed to delete wallet' };
          }
        } catch (error) {
          return { error: error.message || 'Failed to delete wallet' };
        }
      },
      purpose: 'delete_wallet',
      title: 'Delete Wallet',
      walletId: wallet.id
    }
  });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Delete Wallet"
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={styles.warningSection}>
          <Ionicons name="warning" size={48} color="#FF4B55" />
          <Text style={styles.warningTitle}>Warning</Text>
          <Text style={styles.warningText}>
            Deleting this wallet will permanently remove it from your device. 
            Make sure you have backed up your private key before proceeding.
          </Text>
        </View>

        <View style={styles.confirmSection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsConfirmed(!isConfirmed)}
          >
            <Ionicons
              name={isConfirmed ? "checkbox" : "square-outline"}
              size={24}
              color={isConfirmed ? "#FF4B55" : "#8E8E8E"}
            />
            <Text style={styles.checkboxText}>
              I understand that this action cannot be undone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              !isConfirmed && styles.deleteButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={!isConfirmed}
          >
            <Text style={[
              styles.deleteButtonText,
              !isConfirmed && styles.deleteButtonTextDisabled
            ]}>
              Delete Wallet
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  warningTitle: {
    color: '#FF4B55',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  },
  confirmSection: {
    marginTop: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF4B55',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#272C52',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonTextDisabled: {
    color: '#8E8E8E',
  },
});
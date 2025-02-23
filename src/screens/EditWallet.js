import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import Header from '../components/Header';
import { useWallet } from '../contexts/WalletContext';
import * as Clipboard from 'expo-clipboard';
import { CommonActions } from '@react-navigation/native';

// 添加 Toast 组件
const Toast = ({ message, visible, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function EditWallet({ route, navigation }) {
  const { wallet } = route.params;
  const { selectedWallet, updateSelectedWallet } = useWallet();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [newName, setNewName] = useState(selectedWallet?.name || wallet.name);
  const [password, setPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // 添加useEffect来监听页面焦点
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedWallet) {
        setNewName(selectedWallet.name);
      }
    });

    return unsubscribe;
  }, [navigation, selectedWallet]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleRename = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      await api.renameWallet(wallet.id, deviceId, newName);
      const updatedWallet = { ...wallet, name: newName };
      updateSelectedWallet(updatedWallet);
      setShowRenameModal(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to rename wallet');
    }
  };

  const handleDelete = async () => {
    try {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'SetPaymentPassword',
          params: {
            onSuccess: async (paymentPassword) => {
              try {
                const deviceId = await DeviceManager.getDeviceId();
                await api.deleteWallet(wallet.id, deviceId, paymentPassword);
                Alert.alert('Success', 'Wallet deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Main')
                  }
                ]);
              } catch (error) {
                console.error('Delete wallet error:', error);
                Alert.alert('Error', error.message || 'Failed to delete wallet');
              }
            }
          }
        })
      );
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to process wallet deletion');
    }
  };

  const handleShowPrivateKey = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getPrivateKey(wallet.id, deviceId, password);
      Alert.alert('Private Key', response.private_key, [
        { text: 'Copy', onPress: () => Clipboard.setString(response.private_key) },
        { text: 'OK' },
      ]);
      setShowPrivateKeyModal(false);
      setPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to get private key');
    }
  };

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(wallet.address);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Wallet Settings" 
        onBack={() => navigation.goBack()} 
      />

      <View style={styles.walletInfoContainer}>
        <View style={styles.walletAvatarContainer}>
          <Image source={{ uri: wallet.avatar }} style={styles.walletAvatar} />
        </View>
        <View style={styles.walletInfo}>
          <View style={styles.walletDetails}>
            <Text style={styles.walletName}>{wallet.name}</Text>
            <View style={styles.chainBadge}>
              <Text style={styles.chainName}>{wallet.chain}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addressContainer}
              onPress={handleCopyAddress}
            >
              <Text style={styles.walletAddress}>
                {formatAddress(wallet.address)}
              </Text>
              <Ionicons 
                name={isCopied ? "checkmark-circle" : "copy-outline"} 
                size={16} 
                color={isCopied ? "#1FC595" : "#8E8E8E"} 
                style={styles.copyIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actionList}>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('RenameWallet', { wallet })}
        >
          <Ionicons name="pencil-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Rename Wallet</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E8E" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => {
            console.log('Attempting to navigate to ShowPrivateKey');
            navigation.dispatch(
              CommonActions.navigate({
                name: 'ShowPrivateKey',
                params: { wallet }
              })
            );
          }}
        >
          <Ionicons name="key-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Show Private Key</Text>
          <Ionicons name="chevron-forward" size={24} color="#8E8E8E" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#FF4B55" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete Wallet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  walletInfoContainer: {
    marginTop: 60,
    marginHorizontal: 16,
    position: 'relative',
  },
  walletAvatarContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  walletAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#171C32',
  },
  walletInfo: {
    backgroundColor: '#272C52',
    borderRadius: 16,
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  walletDetails: {
    width: '100%',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  chainBadge: {
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  chainName: {
    color: '#1FC595',
    fontSize: 14,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  walletAddress: {
    color: '#8E8E8E',
    fontSize: 14,
    marginRight: 8,
  },
  copyIcon: {
    marginLeft: 4,
    width: 16, // 固定宽度避免图标切换时的抖动
  },
  actionList: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C52',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  deleteButton: {
    marginTop: 20,
  },
  deleteText: {
    color: '#FF4B55',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(31, 197, 149, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
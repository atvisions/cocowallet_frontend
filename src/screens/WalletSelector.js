import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  Platform,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import { useWallet } from '../contexts/WalletContext';
import Header from '../components/Header';

export default function WalletSelector({ navigation }) {
  const { selectedWallet, updateSelectedWallet } = useWallet();
  const [wallets, setWallets] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      setWallets(response);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWallets();
  };

  const handleSelectWallet = async (wallet) => {
    try {
      console.log('Selecting wallet:', wallet);
      await updateSelectedWallet(wallet);
      console.log('Wallet updated, navigating back');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to select wallet:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const renderWalletItem = ({ item }) => {
    const isSelected = selectedWallet?.id === item.id;
    console.log('Rendering wallet item:', item.id, 'Selected:', isSelected);
    
    return (
      <TouchableOpacity
        style={[
          styles.walletItem,
          isSelected && styles.selectedWallet
        ]}
        onPress={() => handleSelectWallet(item)}
      >
        <View style={styles.walletItemContent}>
          <Image source={{ uri: item.avatar }} style={styles.walletAvatar} />
          <View style={styles.walletInfo}>
            <View style={styles.walletNameContainer}>
              <Text style={styles.walletName}>{item.name}</Text>
              <Text style={styles.chainName}>{item.chain}</Text>
            </View>
            <Text style={styles.walletAddress} numberOfLines={1}>
              {formatAddress(item.address)}
            </Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#1FC595" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Select Wallet"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <FlatList
          data={wallets}
          renderItem={renderWalletItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1FC595"
              colors={['#1FC595']}
            />
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateWallet')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Create Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.importButton]}
            onPress={() => navigation.navigate('ImportWallet')}
          >
            <Ionicons name="download-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Import Wallet</Text>
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
  },
  listContainer: {
    padding: 16,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedWallet: {
    borderColor: '#1FC595',
    borderWidth: 1,
  },
  walletItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  chainName: {
    fontSize: 12,
    color: '#1FC595',
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#272C52',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
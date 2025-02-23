import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceManager } from '../utils/device';
import { api } from '../services/api';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    loadSavedWallet();
    loadWallets();
  }, []);

  const loadSavedWallet = async () => {
    try {
      const savedWallet = await AsyncStorage.getItem('selected_wallet');
      if (savedWallet) {
        setSelectedWallet(JSON.parse(savedWallet));
      }
    } catch (error) {
      console.error('Failed to load saved wallet:', error);
    }
  };

  const loadWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      setWallets(response.wallets || []);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const updateSelectedWallet = async (wallet) => {
    try {
      await AsyncStorage.setItem('selected_wallet', JSON.stringify(wallet));
      setSelectedWallet(wallet);
      
      // Update wallet in the wallets list
      setWallets(prevWallets => 
        prevWallets.map(w => w.id === wallet.id ? wallet : w)
      );
    } catch (error) {
      console.error('Failed to save wallet:', error);
    }
  };

  const checkWalletStatus = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const hasPassword = await api.checkPaymentPasswordStatus(deviceId);
      return hasPassword;
    } catch (error) {
      console.error('Error checking wallet status:', error);
      return false;
    }
  };

  return (
    <WalletContext.Provider value={{
      selectedWallet,
      wallets,
      updateSelectedWallet,
      checkWalletStatus,
      loadWallets,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceManager } from '../utils/device';
import { api } from '../services/api';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [totalBalance, setTotalBalance] = useState('0.00');
  const [change24h, setChange24h] = useState(0);

  useEffect(() => {
    initializeWallets();
  }, []);

  const initializeWallets = async () => {
    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      const walletsArray = Array.isArray(response) ? response : [];
      
      if (walletsArray.length === 0) {
        await DeviceManager.setWalletCreated(false);
      } else {
        setWallets(walletsArray);
        if (!selectedWallet) {
          const savedWallet = await AsyncStorage.getItem('selected_wallet');
          setSelectedWallet(savedWallet ? JSON.parse(savedWallet) : walletsArray[0]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize wallets:', error);
      await DeviceManager.setWalletCreated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWalletData = async (wallet) => {
    try {
      console.log('=== loadWalletData Start ===');
      console.log('Loading data for wallet:', wallet);
      
      const deviceId = await DeviceManager.getDeviceId();
      console.log('Device ID:', deviceId);
      
      // 获取钱包列表以确保有最新的钱包信息
      console.log('Fetching updated wallet list...');
      const walletsResponse = await api.getWallets(deviceId);
      const walletsArray = Array.isArray(walletsResponse) ? walletsResponse : [];
      console.log('Updated wallets:', walletsArray);
      setWallets(walletsArray);
      
      // 找到并更新当前钱包信息
      console.log('Finding current wallet in updated list...');
      const updatedWallet = walletsArray.find(w => w.id === wallet.id) || wallet;
      console.log('Updated wallet info:', updatedWallet);
      setSelectedWallet(updatedWallet);

      // 获取钱包代币数据
      console.log('Fetching wallet tokens...');
      const response = await api.getWalletTokens(deviceId, wallet.id, wallet.chain);
      console.log('Token response:', response);
      
      if (response?.data) {
        console.log('Setting token data...');
        setTokens(response.data.tokens || []);
        setTotalBalance(response.data.total_value_usd || '0.00');
        if (response.data.price_change_24h) {
          setChange24h(parseFloat(response.data.price_change_24h));
        }
        console.log('Token data set successfully');
      }
      
      console.log('=== loadWalletData Complete ===');
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const updateSelectedWallet = async (wallet, shouldLoadData = true) => {
    try {
      setSelectedWallet(wallet);
      if (wallet && shouldLoadData) {
        await loadWalletData(wallet);
      }
    } catch (error) {
      console.error('Failed to update selected wallet:', error);
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

  const refreshWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      if (response?.status === 'success' && response.data?.wallets) {
        setWallets(response.data.wallets);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh wallets:', error);
    }
    return false;
  };

  const updateWallets = (newWallets) => {
    setWallets(newWallets);
  };

  const checkAndUpdateWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      const walletsArray = Array.isArray(response) ? response : [];
      
      setWallets(walletsArray);
      
      if (walletsArray.length === 0) {
        await DeviceManager.setWalletCreated(false);
        return { hasWallets: false };
      } else {
        const firstWallet = walletsArray[0];
        await updateSelectedWallet(firstWallet, true);
        return { hasWallets: true, wallet: firstWallet };
      }
    } catch (error) {
      console.error('Failed to check and update wallets:', error);
      return { hasWallets: false };
    }
  };

  return (
    <WalletContext.Provider value={{
      selectedWallet,
      wallets,
      tokens,
      totalBalance,
      change24h,
      updateSelectedWallet,
      checkAndUpdateWallets,
      loadWalletData,
      checkWalletStatus,
      loadWallets: initializeWallets,
      refreshWallets,
      updateWallets,
      isLoading,
      setTokens,
      setTotalBalance,
      setChange24h,
      setWallets,
      setSelectedWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
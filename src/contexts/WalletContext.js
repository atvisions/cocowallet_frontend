import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      setWallets(response);

      // 从AsyncStorage中获取上次选择的钱包ID
      const savedWalletId = await AsyncStorage.getItem('selectedWalletId');
      console.log('Loaded saved wallet ID:', savedWalletId);

      if (savedWalletId && response.length > 0) {
        // 将savedWalletId转换为数字类型再进行比较
        const savedWalletIdNumber = parseInt(savedWalletId, 10);
        console.log('Parsed saved wallet ID:', savedWalletIdNumber);

        // 在钱包列表中查找保存的钱包
        const savedWallet = response.find(wallet => wallet.id === savedWalletIdNumber);
        console.log('Found saved wallet:', savedWallet?.id);

        if (savedWallet) {
          console.log('Setting previously selected wallet:', savedWallet.id);
          setSelectedWallet(savedWallet);
        } else {
          // 如果找不到保存的钱包，则选择第一个钱包
          console.log('Saved wallet not found, selecting first wallet:', response[0].id);
          setSelectedWallet(response[0]);
          // 更新存储的钱包ID
          await AsyncStorage.setItem('selectedWalletId', String(response[0].id));
        }
      } else if (response.length > 0 && !selectedWallet) {
        console.log('No saved wallet ID, selecting first wallet:', response[0].id);
        setSelectedWallet(response[0]);
        // 更新存储的钱包ID
        await AsyncStorage.setItem('selectedWalletId', String(response[0].id));
      }
      console.log('Loaded wallets:', response);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const updateSelectedWallet = async (wallet) => {
    // 如果当前有选中的钱包，先清除其缓存数据
    if (selectedWallet) {
      await AsyncStorage.removeItem(`tokens_${selectedWallet.id}`);
    }

    setSelectedWallet(wallet);
    if (wallet) {
      // 保存选择的钱包ID到AsyncStorage，确保转换为字符串类型
      await AsyncStorage.setItem('selectedWalletId', String(wallet.id));
    } else {
      // 如果wallet为null，则清除保存的钱包ID
      await AsyncStorage.removeItem('selectedWalletId');
    }
  };

  const updateSelectedChain = (chain) => {
    setSelectedChain(chain);
  };

  const checkAndUpdateWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      setWallets(response);
      return response;
    } catch (error) {
      console.error('Failed to check and update wallets:', error);
      return [];
    }
  };

  return (
    <WalletContext.Provider 
      value={{
        wallets,
        selectedWallet,
        selectedChain,
        setWallets,
        setSelectedWallet,
        updateSelectedWallet,
        updateSelectedChain,
        checkAndUpdateWallets,
        loadWallets
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};
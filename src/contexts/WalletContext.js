import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [tokensData, setTokensData] = useState(new Map());
  const lastUpdateTime = useRef(new Map());

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
      console.log('加载保存的钱包ID:', savedWalletId);

      if (savedWalletId && response.length > 0) {
        // 将savedWalletId转换为数字类型再进行比较
        const savedWalletIdNumber = parseInt(savedWalletId, 10);
        console.log('解析保存的钱包ID:', savedWalletIdNumber);

        // 在钱包列表中查找保存的钱包
        const savedWallet = response.find(wallet => wallet.id === savedWalletIdNumber);
        console.log('找到保存的钱包:', savedWallet?.id);

        if (savedWallet) {
          console.log('设置之前选择的钱包:', savedWallet.id);
          setSelectedWallet(savedWallet);
        } else {
          // 如果找不到保存的钱包，则选择第一个钱包
          console.log('未找到保存的钱包，选择第一个钱包:', response[0].id);
          setSelectedWallet(response[0]);
          // 更新存储的钱包ID
          await AsyncStorage.setItem('selectedWalletId', String(response[0].id));
        }
      } else if (response.length > 0) {
        console.log('没有保存的钱包ID，选择第一个钱包:', response[0].id);
        setSelectedWallet(response[0]);
        // 更新存储的钱包ID
        await AsyncStorage.setItem('selectedWalletId', String(response[0].id));
      }
    } catch (error) {
      console.error('加载钱包失败:', error);
    }
  };

  const updateSelectedWallet = useCallback(async (wallet) => {
    try {
      // 先保存钱包ID到AsyncStorage
      if (wallet?.id) {
        await AsyncStorage.setItem('selectedWalletId', String(wallet.id));
        console.log('保存选中的钱包ID:', wallet.id);
      }
      
      // 先清空当前数据
      setTokens([]);
      // 延迟设置新钱包，确保清空操作完成
      setTimeout(() => {
        setSelectedWallet(wallet);
      }, 0);
    } catch (error) {
      console.error('保存选中钱包ID失败:', error);
    }
  }, []);

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

  const updateTokensCache = useCallback((walletId, data) => {
    setTokensData(prev => {
      const newMap = new Map(prev);
      newMap.set(walletId, data);
      return newMap;
    });
    lastUpdateTime.current.set(walletId, Date.now());
  }, []);

  const getTokensCache = useCallback((walletId) => {
    return {
      data: tokensData.get(walletId),
      lastUpdate: lastUpdateTime.current.get(walletId) || 0
    };
  }, [tokensData]);

  const value = {
    wallets,
    selectedWallet,
    selectedChain,
    setWallets,
    setSelectedWallet,
    updateSelectedWallet,
    updateSelectedChain,
    checkAndUpdateWallets,
    loadWallets,
    tokens,
    setTokens,
    tokensData,
    updateTokensCache,
    getTokensCache
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};
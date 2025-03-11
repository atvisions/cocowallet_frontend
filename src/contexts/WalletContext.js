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
  const [backgroundGradient, setBackgroundGradient] = useState('#1B4C31');
  const lastUpdateTime = useRef(new Map());

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      console.log('【钱包上下文】当前设备 ID:', deviceId);
      
      const response = await api.getWallets(deviceId);
      console.log('【钱包上下文】获取到的钱包列表:', response.map(w => ({
        id: w.id,
        chain: w.chain,
        device_id: w.device_id,
        address: w.address
      })));
      
      setWallets(response);

      // 从AsyncStorage中获取上次选择的钱包ID
      const savedWalletId = await AsyncStorage.getItem('selectedWalletId');
      console.log('【钱包上下文】加载保存的钱包ID:', savedWalletId);

      if (savedWalletId && response.length > 0) {
        // 将savedWalletId转换为数字类型再进行比较
        const savedWalletIdNumber = parseInt(savedWalletId, 10);
        console.log('【钱包上下文】解析保存的钱包ID:', savedWalletIdNumber);

        // 在钱包列表中查找保存的钱包
        const savedWallet = response.find(wallet => wallet.id === savedWalletIdNumber);
        console.log('【钱包上下文】找到保存的钱包:', savedWallet ? {
          id: savedWallet.id,
          chain: savedWallet.chain,
          device_id: savedWallet.device_id,
          address: savedWallet.address
        } : '未找到');

        if (savedWallet) {
          console.log('【钱包上下文】设置之前选择的钱包:', savedWallet.id);
          setSelectedWallet(savedWallet);
        } else {
          // 如果找不到保存的钱包，则选择第一个钱包
          console.log('【钱包上下文】未找到保存的钱包，选择第一个钱包:', {
            id: response[0].id,
            chain: response[0].chain,
            device_id: response[0].device_id,
            address: response[0].address
          });
          setSelectedWallet(response[0]);
          // 更新存储的钱包ID
          await AsyncStorage.setItem('selectedWalletId', String(response[0].id));
        }
      } else if (response.length > 0) {
        console.log('【钱包上下文】没有保存的钱包ID，选择第一个钱包:', {
          id: response[0].id,
          chain: response[0].chain,
          device_id: response[0].device_id,
          address: response[0].address
        });
        setSelectedWallet(response[0]);
        // 更新存储的钱包ID
        await AsyncStorage.setItem('selectedWalletId', String(response[0].id));
      }
    } catch (error) {
      console.error('【钱包上下文】加载钱包失败:', error);
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

  // 更新背景渐变色的函数
  const updateBackgroundGradient = useCallback((priceChange) => {
    console.log('Updating background gradient based on price change:', priceChange);
    
    // 确保 priceChange 是数字
    let numericPriceChange;
    if (typeof priceChange === 'string') {
      // 如果是字符串，移除百分号和加号，转换为数字
      numericPriceChange = parseFloat(priceChange.replace('%', '').replace('+', ''));
    } else {
      numericPriceChange = priceChange;
    }
    
    console.log('Numeric price change value:', numericPriceChange);
    
    if (!isNaN(numericPriceChange) && numericPriceChange >= 0) {
      console.log('Setting GREEN background for positive price change');
      setBackgroundGradient('rgba(27, 76, 49, 0.8)'); // 绿色背景 (上涨) 增加透明度
    } else {
      console.log('Setting PURPLE background for negative price change');
      setBackgroundGradient('rgba(44, 41, 65, 0.8)'); // 紫色背景 (下跌) 增加透明度
    }
  }, []);

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
    getTokensCache,
    backgroundGradient,
    updateBackgroundGradient
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
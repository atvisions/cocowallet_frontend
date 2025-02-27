import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';

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
      if (response.length > 0 && !selectedWallet) {
        setSelectedWallet(response[0]);
      }
      console.log('Loaded wallets:', response);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const updateSelectedWallet = async (wallet) => {
    setSelectedWallet(wallet);
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
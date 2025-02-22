import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    loadSavedWallet();
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

  const updateSelectedWallet = async (wallet) => {
    try {
      await AsyncStorage.setItem('selected_wallet', JSON.stringify(wallet));
      setSelectedWallet(wallet);
    } catch (error) {
      console.error('Failed to save wallet:', error);
    }
  };

  return (
    <WalletContext.Provider value={{ selectedWallet, updateSelectedWallet }}>
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
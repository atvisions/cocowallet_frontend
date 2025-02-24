import React, { useEffect, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { api } from '../services/api';
import { DeviceManager } from '../services/DeviceManager';

export default function ImportWallet({ navigation, route }) {
  const { chain, deviceId, fromOnboarding } = route.params;
  const { checkAndUpdateWallets } = useWallet();

  const handleImport = async (mnemonic) => {
    try {
      const chainType = CHAIN_TYPE_MAP[chain] || chain.toLowerCase();
      await api.importWallet(deviceId, chain, mnemonic, chainType);
      await DeviceManager.setWalletCreated(true);
      await DeviceManager.setChainType(chainType);

      // 获取最新的钱包列表
      const result = await checkAndUpdateWallets();
      if (!result.hasWallets) {
        throw new Error('No wallets found after import');
      }

      // 根据来源决定导航行为
      if (fromOnboarding) {
        // 从引导页来的，重置导航栈到主页
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'MainStack'
              }
            ]
          })
        );
      } else {
        // 从列表页来的，返回列表页
        navigation.goBack();
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import wallet');
    }
  };

  // ... 其他代码保持不变 ...
} 
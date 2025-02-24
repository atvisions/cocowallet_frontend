import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

export default function WalletScreen({ navigation }) {
  const { updateWallets, refreshWallets } = useWallet();

  const handleDeleteWallet = () => {
    navigation.navigate('PaymentPasswordScreen', {
      title: 'Enter Password',
      onSuccess: async (password) => {
        try {
          const deviceId = await DeviceManager.getDeviceId();
          const response = await api.deleteWallet(wallet.id, deviceId, password).catch(() => null);
          
          if (response?.status === 'success') {
            // 删除成功后刷新钱包列表
            await refreshWallets();  // 使用 context 中的方法
            // 返回到主页面并重置导航堆栈
            navigation.getParent().reset({
              index: 0,
              routes: [
                { 
                  name: 'MainStack',
                  state: {
                    routes: [{ name: 'Main' }]
                  }
                }
              ],
            });
            return true;
          }
        } catch (error) {
          console.error('Failed to delete wallet:', error);
        }
        return false;
      }
    });
  };

  // 添加刷新钱包列表的方法
  const refreshWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      if (response?.status === 'success') {
        // 更新钱包列表
        // 这里需要调用 context 或 redux 的方法来更新状态
        updateWallets(response.data.wallets);
      }
    } catch (error) {
      console.error('Failed to refresh wallets:', error);
    }
  };
} 
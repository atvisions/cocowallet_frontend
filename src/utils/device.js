import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';

const DEVICE_ID_KEY = '@coco_wallet_device_id';
const PASSWORD_SET_KEY = '@coco_wallet_password_set';
const WALLET_CREATED_KEY = '@coco_wallet_created';
const PAYMENT_PASSWORD_SET_KEY = '@coco_wallet_payment_password_set';

export const DeviceManager = {
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      throw error;
    }
  },

  generateDeviceId() {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    return `${platform}_${uuidv4()}`;
  },

  async setPasswordStatus(isSet) {
    try {
      await AsyncStorage.setItem(PASSWORD_SET_KEY, JSON.stringify(isSet));
    } catch (error) {
      console.error('Error saving password status:', error);
      throw error;
    }
  },

  async hasSetPassword() {
    try {
      const status = await AsyncStorage.getItem(PASSWORD_SET_KEY);
      return status === 'true';
    } catch (error) {
      console.error('Error checking password status:', error);
      return false;
    }
  },

  async setWalletCreated(isCreated) {
    try {
      await AsyncStorage.setItem(WALLET_CREATED_KEY, JSON.stringify(isCreated));
    } catch (error) {
      console.error('Error saving wallet status:', error);
      throw error;
    }
  },

  async hasWalletCreated() {
    try {
      const status = await AsyncStorage.getItem(WALLET_CREATED_KEY);
      return status === 'true';
    } catch (error) {
      console.error('Error checking wallet status:', error);
      return false;
    }
  },

  async hasPaymentPassword() {
    try {
      // 从本地存储获取支付密码状态
      const status = await AsyncStorage.getItem(PAYMENT_PASSWORD_SET_KEY);
      
      if (status === 'true') {
        return true;
      }

      // 如果本地没有，从服务器获取
      const deviceId = await this.getDeviceId();
      const response = await api.checkPaymentPasswordStatus(deviceId);
      
      // 更新本地状态
      await this.setPaymentPasswordStatus(response?.has_payment_password || false);
      
      return response?.has_payment_password || false;
    } catch (error) {
      console.error('Check payment password error:', error);
      return false;
    }
  },

  async setPaymentPasswordStatus(hasPassword) {
    try {
      await AsyncStorage.setItem(PAYMENT_PASSWORD_SET_KEY, hasPassword ? 'true' : 'false');
    } catch (error) {
      console.error('Error setting payment password status:', error);
    }
  },

  async clearWalletStatus() {
    try {
      await AsyncStorage.multiSet([
        [WALLET_CREATED_KEY, 'false'],
        [PASSWORD_SET_KEY, 'false'],
        [PAYMENT_PASSWORD_SET_KEY, 'false']
      ]);
    } catch (error) {
      console.error('Error clearing wallet status:', error);
      throw error;
    }
  },

  async setPassword(password) {
    try {
      // 存储钱包密码状态
      await AsyncStorage.setItem(PASSWORD_SET_KEY, 'true');
    } catch (error) {
      console.error('Error setting password:', error);
      throw error;
    }
  },

  setChainType: async (chainType) => {
    await AsyncStorage.setItem('chainType', chainType);
  },

  getChainType: async () => {
    return await AsyncStorage.getItem('chainType') || 'evm';
  }
};
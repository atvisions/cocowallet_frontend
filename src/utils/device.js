import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '@coco_wallet_device_id';
const WALLET_CREATED_KEY = '@coco_wallet_created';

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
      console.log('[DeviceManager] Checking wallet created status...');
      const status = await AsyncStorage.getItem(WALLET_CREATED_KEY);
      console.log('[DeviceManager] Wallet created status:', status === 'true');
      return status === 'true';
    } catch (error) {
      console.error('[DeviceManager] Error checking wallet status:', error);
      return false;
    }
  },

  async setChainType(chainType) {
    await AsyncStorage.setItem('chainType', chainType);
  },

  async getChainType() {
    return await AsyncStorage.getItem('chainType') || 'evm';
  },

  async setPaymentPasswordStatus(hasPassword) {
    try {
      const status = hasPassword === true ? 'true' : 'false';
      await AsyncStorage.setItem('@payment_password_status', status);
    } catch (error) {
      console.error('[DeviceManager] Error setting payment password status:', error);
      throw error;
    }
  },

  async getPaymentPasswordStatus() {
    try {
      const status = await AsyncStorage.getItem('@payment_password_status');
      return status === 'true';
    } catch (error) {
      console.error('[DeviceManager] Error getting payment password status:', error);
      return false;
    }
  }
};
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Onboarding from './src/screens/Onboarding';
import SetPassword from './src/screens/SetPassword';
import SelectChain from './src/screens/SelectChain';
import CustomSplash from './src/screens/CustomSplash';
import ShowMnemonic from './src/screens/ShowMnemonic';
import VerifyMnemonic from './src/screens/VerifyMnemonic';
import MainTabs from './src/screens/MainTabs';
import SettingsScreen from './src/screens/SettingsScreen';
import ChangePaymentPassword from './src/screens/ChangePaymentPassword';
import WalletSelector from './src/screens/WalletSelector';
import EditWallet from './src/screens/EditWallet';
import NFTCollection from './src/screens/NFTCollection';
import { DeviceManager } from './src/utils/device';
import { api } from './src/services/api';
import { StatusBar, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { WalletProvider } from './src/contexts/WalletContext';
import PasswordChangeSuccess from './src/screens/PasswordChangeSuccess';
import TokenManagement from './src/screens/TokenManagement';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    checkWalletStatus();
    async function setNavigationBarColor() {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync('#272C52');
        await NavigationBar.setButtonStyleAsync('light');
      }
    }
    setNavigationBarColor();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const localHasWallet = await DeviceManager.hasWalletCreated();
      const wallets = await api.getWallets(deviceId);
      const hasWalletInBackend = wallets && wallets.length > 0;
      
      if (!hasWalletInBackend && localHasWallet) {
        await DeviceManager.clearWalletStatus();
        setHasWallet(false);
        return;
      }
      
      setHasWallet(hasWalletInBackend);
      
      if (hasWalletInBackend) {
        const hasPassword = await api.checkPaymentPasswordStatus(deviceId);
        await DeviceManager.setPaymentPasswordStatus(hasPassword);
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  const fetchData = async () => {
    // 你的数据获取逻辑
  };

  if (isLoading) {
    return (
      <WalletProvider>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#171C32' }}>
          <View style={{ flex: 1, backgroundColor: '#171C32' }}>
            <StatusBar
              barStyle="light-content"
              backgroundColor="#171C32"
              translucent={true}
            />
            <CustomSplash />
          </View>
        </SafeAreaProvider>
      </WalletProvider>
    );
  }

  return (
    <WalletProvider>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#171C32' }}>
        <View style={{ flex: 1, backgroundColor: '#171C32' }}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#171C32"
            translucent={true}
          />
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!hasWallet ? (
                <>
                  <Stack.Screen name="Onboarding" component={Onboarding} />
                  <Stack.Screen name="SetPassword" component={SetPassword} />
                  <Stack.Screen name="SelectChain" component={SelectChain} />
                  <Stack.Screen name="ShowMnemonic" component={ShowMnemonic} />
                  <Stack.Screen name="VerifyMnemonic" component={VerifyMnemonic} />
                </>
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                  <Stack.Screen name="SetPassword" component={SetPassword} />
                  <Stack.Screen name="ChangePaymentPassword" component={ChangePaymentPassword} />
                  <Stack.Screen name="WalletSelector" component={WalletSelector} />
                  <Stack.Screen name="EditWallet" component={EditWallet} />
                  <Stack.Screen name="NFTCollection" component={NFTCollection} />
                  <Stack.Screen 
                    name="PasswordChangeSuccess" 
                    component={PasswordChangeSuccess}
                    options={{
                      headerShown: false,
                      gestureEnabled: false,
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen name="TokenManagement" component={TokenManagement} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </WalletProvider>
  );
}
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Onboarding from '../screens/onboarding/Onboarding';
import SetBiometricPassword from '../screens/settings/SetBiometricPassword';
import Settings from '../screens/settings/SettingsScreen';
import RenameWallet from '../screens/wallet/RenameWallet';
import SetPaymentPassword from '../screens/auth/SetPaymentPassword';
import ShowPrivateKey from '../screens/wallet/ShowPrivateKey';
import MainTabs from './MainTabs';
import WalletSelector from '../screens/wallet/WalletSelector';
import SelectChain from '../screens/wallet/SelectChain';
import ShowMnemonic from '../screens/ShowMnemonic';
import VerifyMnemonic from '../screens/wallet/VerifyMnemonic';
import ImportWallet from '../screens/wallet/ImportWallet';
import CustomSplash from '../screens/CustomSplash';
import LoadingWallet from '../screens/wallet/LoadingWallet';
import DeleteWallet from '../screens/wallet/DeleteWallet';
import PaymentPasswordScreen from '../screens/wallet/PaymentPasswordScreen';
import CreateWallet from '../screens/wallet/CreateWallet';
import TokenListScreen from '../screens/wallet/TokenListScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#171C32' },
        cardStyleInterpolator: ({ current: { progress }, layouts }) => ({
          cardStyle: {
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                  extrapolate: 'clamp',
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height * 0.05, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 1],
              extrapolate: 'clamp',
            }),
          },
        }),
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="CustomSplash" component={CustomSplash} />
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="MainStack" component={MainTabs} />
      <Stack.Screen name="WalletSelector" component={WalletSelector} />
      <Stack.Screen name="SelectChain" component={SelectChain} />
      <Stack.Screen name="ShowMnemonic" component={ShowMnemonic} />
      <Stack.Screen name="VerifyMnemonic" component={VerifyMnemonic} />
      <Stack.Screen name="ImportWallet" component={ImportWallet} />
      <Stack.Screen name="SetPaymentPassword" component={SetPaymentPassword} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="SetBiometricPassword" component={SetBiometricPassword} />
      <Stack.Screen name="RenameWallet" component={RenameWallet} />
      <Stack.Screen name="ShowPrivateKey" component={ShowPrivateKey} />
      <Stack.Screen name="LoadingWallet" component={LoadingWallet} />
      <Stack.Screen name="DeleteWallet" component={DeleteWallet} />
      <Stack.Screen name="PaymentPasswordScreen" component={PaymentPasswordScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWallet} />
      <Stack.Screen name="TokenListScreen" component={TokenListScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Onboarding from '../screens/Onboarding';
import SetBiometricPassword from '../screens/settings/SetBiometricPassword';
import Settings from '../screens/settings/Settings';
import RenameWallet from '../screens/RenameWallet';
import SetPaymentPassword from '../screens/SetPaymentPassword';
import ShowPrivateKey from '../screens/ShowPrivateKey';
import MainTabs from './MainTabs';
import WalletSelector from '../screens/wallet/WalletSelector';
import SelectChain from '../screens/SelectChain';
import ShowMnemonic from '../screens/ShowMnemonic';
import VerifyMnemonic from '../screens/VerifyMnemonic';
import ImportWallet from '../screens/ImportWallet';
import CustomSplash from '../screens/CustomSplash';
import LoadingWallet from '../screens/wallet/LoadingWallet';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#171C32' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
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
    </Stack.Navigator>
  );
};

export default AppNavigator;
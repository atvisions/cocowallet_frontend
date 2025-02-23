import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SetBiometricPassword from '../screens/settings/SetBiometricPassword';
import Settings from '../screens/settings/Settings';
import RenameWallet from '../screens/RenameWallet';
import SetPaymentPassword from '../screens/SetPaymentPassword';
import ShowPrivateKey from '../screens/ShowPrivateKey';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Settings" 
        component={Settings}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SetBiometricPassword" 
        component={SetBiometricPassword}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RenameWallet" 
        component={RenameWallet}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SetPaymentPassword" 
        component={SetPaymentPassword}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ShowPrivateKey" 
        component={ShowPrivateKey}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
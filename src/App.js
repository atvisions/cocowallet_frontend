import { NavigationContainer } from '@react-navigation/native';
import MainTabs from './screens/MainTabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider } from './contexts/WalletContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PasswordChangeSuccess from './screens/PasswordChangeSuccess';
import SetBiometricPassword from './screens/settings/SetBiometricPassword';
import Settings from './screens/settings/Settings';
import RenameWallet from './screens/RenameWallet';
import SetPaymentPassword from './screens/SetPaymentPassword';
import ShowPrivateKey from './screens/ShowPrivateKey';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // 初始化生物识别
    LocalAuthentication.isEnrolledAsync().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PasswordChangeSuccess" component={PasswordChangeSuccess} />
            <Stack.Screen name="SetBiometricPassword" component={SetBiometricPassword} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="RenameWallet" component={RenameWallet} />
            <Stack.Screen name="SetPaymentPassword" component={SetPaymentPassword} />
            <Stack.Screen name="ShowPrivateKey" component={ShowPrivateKey} />
          </Stack.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
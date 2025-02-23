import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider } from './src/contexts/WalletContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 导入页面组件
import MainTabs from './src/navigation/MainTabs';
import RenameWallet from './src/screens/wallet/RenameWallet';
import SetPaymentPassword from './src/screens/auth/SetPaymentPassword';
import ShowPrivateKey from './src/screens/wallet/ShowPrivateKey';
import PaymentPasswordScreen from './src/screens/wallet/PaymentPasswordScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChangePaymentPassword from './src/screens/auth/ChangePaymentPassword';
import SetPassword from './src/screens/SetPassword';
import PrivateKeyDisplay from './src/screens/wallet/PrivateKeyDisplay';

const Stack = createStackNavigator();
const RootStack = createStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="RenameWallet" component={RenameWallet} />
      <Stack.Screen name="ShowPrivateKey" component={ShowPrivateKey} />
      <Stack.Screen name="PrivateKeyDisplay" component={PrivateKeyDisplay} />
      <Stack.Screen name="ChangePaymentPassword" component={ChangePaymentPassword} />
      <Stack.Screen name="SetPassword" component={SetPassword} />
    </Stack.Navigator>
  );
}

// 创建一个新的导航器来处理密码验证流程
function PasswordVerificationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PasswordInput" component={PaymentPasswordScreen} />
      <Stack.Screen name="VerificationResult" component={PrivateKeyDisplay} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // 初始化生物识别
    LocalAuthentication.isEnrolledAsync().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NavigationContainer>
          <RootStack.Navigator 
            screenOptions={{ 
              headerShown: false,
              presentation: 'modal' 
            }}
          >
            <RootStack.Screen name="MainStack" component={MainStack} />
            <RootStack.Screen 
              name="PasswordVerification" 
              component={PasswordVerificationStack}
              options={{
                presentation: 'modal',
              }}
            />
          </RootStack.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
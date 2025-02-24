import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider, useWallet } from './src/contexts/WalletContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DeviceManager } from './src/utils/device';
import { api } from './src/services/api';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

// 导入页面组件
import MainTabs from './src/navigation/MainTabs';
import RenameWallet from './src/screens/wallet/RenameWallet';
import SetPaymentPassword from './src/screens/auth/SetPaymentPassword';
import ShowPrivateKey from './src/screens/wallet/ShowPrivateKey';
import PaymentPasswordScreen from './src/screens/wallet/PaymentPasswordScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChangePaymentPassword from './src/screens/auth/ChangePaymentPassword';
import SetPassword from './src/screens/auth/SetPassword';
import PrivateKeyDisplay from './src/screens/wallet/PrivateKeyDisplay';
import Onboarding from './src/screens/Onboarding';
import SelectChain from './src/screens/SelectChain';
import ShowMnemonic from './src/screens/ShowMnemonic';
import VerifyMnemonic from './src/screens/VerifyMnemonic';
import ImportWallet from './src/screens/wallet/ImportWallet';

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
    </Stack.Navigator>
  );
}

// 创建一个新的导航器来处理密码验证流程
function PasswordVerificationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="PasswordInput" 
        component={PaymentPasswordScreen}
        options={({ route }) => ({
          params: route.params
        })}
      />
      <Stack.Screen name="VerificationResult" component={PrivateKeyDisplay} />
    </Stack.Navigator>
  );
}

// 创建一个新的组件来使用 useWallet
function AppContent() {
  const [initialRoute, setInitialRoute] = useState(null);
  const { updateSelectedWallet } = useWallet();

  useEffect(() => {
    checkInitialRoute();
  }, []);

  const checkInitialRoute = async () => {
    try {
      // 获取设备ID
      const deviceId = await DeviceManager.getDeviceId();
      // 获取钱包列表
      const response = await api.getWallets(deviceId);
      const walletsArray = Array.isArray(response) ? response : [];

      if (walletsArray.length > 0) {
        // 如果有钱包，设置第一个钱包为选中钱包
        await updateSelectedWallet(walletsArray[0]);
        setInitialRoute('MainStack');
      } else {
        // 如果没有钱包，导航到引导页
        await DeviceManager.setWalletCreated(false);
        setInitialRoute('Onboarding');
      }
    } catch (error) {
      console.error('Error checking initial route:', error);
      setInitialRoute('Onboarding');
    }
  };

  if (!initialRoute) {
    return null; // 或者显示一个加载指示器
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          presentation: 'modal' 
        }}
        initialRouteName={initialRoute}
      >
        <RootStack.Screen name="Onboarding" component={Onboarding} />
        <RootStack.Screen name="MainStack" component={MainStack} />
        <RootStack.Screen name="SetPassword" component={SetPassword} />
        <RootStack.Screen name="SetPaymentPassword" component={SetPaymentPassword} />
        <RootStack.Screen name="SelectChain" component={SelectChain} />
        <RootStack.Screen name="ShowMnemonic" component={ShowMnemonic} />
        <RootStack.Screen name="VerifyMnemonic" component={VerifyMnemonic} />
        <RootStack.Screen name="ImportWallet" component={ImportWallet} />
        <RootStack.Screen 
          name="PasswordVerification" 
          component={PasswordVerificationStack}
          options={{
            presentation: 'modal',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// 主 App 组件
export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Gilroy-Regular': require('./assets/fonts/Gilroy-Regular.ttf'),
        'Gilroy-Medium': require('./assets/fonts/Gilroy-Medium.ttf'),
        'Gilroy-SemiBold': require('./assets/fonts/Gilroy-SemiBold.ttf'),
        'Gilroy-Bold': require('./assets/fonts/Gilroy-Bold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#171C32' }}>
        <ActivityIndicator size="large" color="#1FC595" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </SafeAreaProvider>
  );
}
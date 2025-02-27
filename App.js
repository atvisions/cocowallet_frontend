import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider, useWallet } from './src/contexts/WalletContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { processWalletList } from './src/utils/walletUtils';
import { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DeviceManager } from './src/utils/device';
import { api } from './src/services/api';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

// 导入页面组件
import MainTabs from './src/navigation/MainTabs';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import Onboarding from './src/screens/onboarding/Onboarding';
import RenameWallet from './src/screens/wallet/RenameWallet';
import SetPaymentPassword from './src/screens/auth/SetPaymentPassword';
import ShowPrivateKey from './src/screens/wallet/ShowPrivateKey';
import PaymentPasswordScreen from './src/screens/wallet/PaymentPasswordScreen';
import ChangePaymentPassword from './src/screens/auth/ChangePaymentPassword';
import PrivateKeyDisplay from './src/screens/wallet/PrivateKeyDisplay';
import SelectChain from './src/screens/wallet/SelectChain';
import ShowMnemonic from './src/screens/wallet/ShowMnemonic';
import VerifyMnemonic from './src/screens/wallet/VerifyMnemonic';
import ImportWallet from './src/screens/wallet/ImportWallet';
import LoadingWallet from './src/screens/wallet/LoadingWallet';

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
      <Stack.Screen name="PrivateKeyDisplay" component={PrivateKeyDisplay} />
    </Stack.Navigator>
  );
}

// 创建一个新的组件来使用 useWallet
function AppContent() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { updateSelectedWallet } = useWallet();

  useEffect(() => {
    checkInitialRoute();
  }, []);

  const checkInitialRoute = async () => {
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        setIsLoading(true);
        const deviceId = await DeviceManager.getDeviceId();
        console.log('Checking initial route with device ID:', deviceId);

        const response = await api.getWallets(deviceId);
        console.log('Got wallets response:', response);

        const walletsArray = Array.isArray(response) ? response : [];
        const processedWallets = processWalletList(walletsArray);
        console.log('Processed wallets array:', processedWallets);

        if (processedWallets.length > 0) {
          console.log('Found existing wallets, updating selected wallet...');
          await updateSelectedWallet(processedWallets[0]);
          setInitialRoute('MainStack');
        } else {
          console.log('No existing wallets found, navigating to onboarding...');
          await DeviceManager.setWalletCreated(false);
          setInitialRoute('Onboarding');
        }
        break;
      } catch (error) {
        console.error('Error checking initial route:', {
          message: error.message,
          status: error.status,
          attempt: 4 - retries,
          remainingRetries: retries - 1
        });

        retries--;
        
        if (retries > 0) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
        } else {
          console.log('All retries exhausted, falling back to onboarding...');
          setInitialRoute('Onboarding');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!initialRoute) {
    return null;
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
        <RootStack.Screen name="SetPaymentPassword" component={SetPaymentPassword} />
        <RootStack.Screen name="SelectChain" component={SelectChain} />
        <RootStack.Screen name="ShowMnemonic" component={ShowMnemonic} />
        <RootStack.Screen name="VerifyMnemonic" component={VerifyMnemonic} />
        <RootStack.Screen name="ImportWallet" component={ImportWallet} />
        <RootStack.Screen name="LoadingWallet" component={LoadingWallet} />
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
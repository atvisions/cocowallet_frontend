import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import { CommonActions } from '@react-navigation/native';

export default function ImportWallet({ navigation, route }) {
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { chain } = route.params;

  const handleImport = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter private key');
      return;
    }

    try {
      setLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      const hasPaymentPassword = await DeviceManager.hasPaymentPassword();
      
      if (hasPaymentPassword) {
        // 修改导航方式，使用 navigate 而不是 replace
        navigation.navigate('PasswordVerification', {
          screen: 'PasswordInput',  // 指定子导航器中的具体页面
          params: {  // 使用 params 传递参数给子页面
            purpose: 'import_wallet',
            title: 'Import Wallet',
            chain,
            privateKey
          }
        });
      } else {
        // 如果没有设置密码，导航到设置密码页面
        navigation.navigate('SetPaymentPassword', {
          onSuccess: async (password) => {
            await importWallet(password);
          }
        });
      }
    } catch (error) {
      console.error('Import wallet error:', error);
      Alert.alert('Error', 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const importWallet = async (password) => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.importPrivateKey(deviceId, chain, privateKey, password);
      
      if (response?.status === 'success') {
        Alert.alert('Success', 'Wallet imported successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'MainStack' }]
                })
              );
            }
          }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Import Wallet"
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <Text style={styles.label}>Enter Private Key</Text>
        <TextInput
          style={styles.input}
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="Enter your private key"
          placeholderTextColor="#8E8E8E"
          secureTextEntry
          multiline
        />

        <TouchableOpacity 
          style={[
            styles.button,
            !privateKey.trim() && styles.buttonDisabled
          ]}
          onPress={handleImport}
          disabled={!privateKey.trim()}
        >
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
      </View>

      {loading && <Loading />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
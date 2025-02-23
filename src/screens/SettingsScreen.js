import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import Constants from 'expo-constants';
import Header from '../components/Header';

export default function SettingsScreen({ navigation }) {
  const [hasPaymentPassword, setHasPaymentPassword] = useState(false);

  // 在组件加载时检查支付密码状态
  useEffect(() => {
    checkPaymentPasswordStatus();
  }, []);

  // 每次页面获得焦点时重新检查状态
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkPaymentPasswordStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const checkPaymentPasswordStatus = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.checkPaymentPasswordStatus(deviceId);
      console.log('Payment password status:', response);  // 添加日志
      setHasPaymentPassword(response || false);
    } catch (error) {
      console.error('Check payment password error:', error);
      setHasPaymentPassword(false);
    }
  };

  const handleSetPaymentPassword = () => {
    if (hasPaymentPassword) {
      navigation.navigate('ChangePaymentPassword');
    } else {
      navigation.navigate('SetPassword', { type: 'payment' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Settings"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleSetPaymentPassword}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#1FC595' }]}>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.menuItemText}>
                {hasPaymentPassword ? 'Change Payment Password' : 'Set Payment Password'}
              </Text>
            </View>
            <View style={styles.menuItemRight}>
              {hasPaymentPassword && (
                <View style={styles.checkmarkContainer}>
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#5856D6' }]}>
                <Ionicons name="information" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.menuItemText}>Version</Text>
            </View>
            <Text style={styles.versionText}>
              {Constants.expoConfig.version}
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#272C52',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
}); 
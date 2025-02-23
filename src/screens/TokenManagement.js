import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Platform, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../components/common/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../contexts/WalletContext';

const ToggleSwitch = ({ value, onToggle }) => {
  const translateX = new Animated.Value(value ? 20 : 0);

  const toggle = () => {
    onToggle();
    Animated.timing(translateX, {
      toValue: value ? 0 : 20,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.switchContainer,
        { backgroundColor: value ? '#1FC595' : 'rgba(255, 255, 255, 0.1)' }
      ]}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <Animated.View 
        style={[
          styles.switchThumb,
          { transform: [{ translateX }] }
        ]} 
      />
    </TouchableOpacity>
  );
};

const TokenManagement = ({ route, navigation }) => {
  const { selectedWallet } = useWallet();
  const wallet = selectedWallet;
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTokenId, setLoadingTokenId] = useState(null);
  const { onTokenVisibilityChanged } = route.params || {};  // 从路由参数中获取回调

  // 添加缓存时间常量
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

  const loadTokens = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      
      // 检查缓存
      const cacheKey = `token_visibility_${selectedWallet.id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      // 如果有缓存且未过期且不是强制刷新
      if (!forceRefresh && cachedData) {
        const { tokens: cachedTokens, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('Using cached token data');
          setTokens(cachedTokens);
          setLoading(false);
          return;
        }
      }

      // 如果没有缓存或缓存过期，请求新数据
      const response = await api.getTokensManagement(
        selectedWallet.id, 
        deviceId, 
        selectedWallet.chain
      );

      if (response?.status === 'success') {
        const newTokens = response.data.tokens || response.data;
        if (Array.isArray(newTokens)) {
          setTokens(newTokens);
          // 更新缓存
          await AsyncStorage.setItem(cacheKey, JSON.stringify({
            tokens: newTokens,
            timestamp: Date.now()
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadTokens();
  }, [selectedWallet?.id]);

  const toggleVisibility = async (tokenAddress) => {
    try {
      setLoadingTokenId(tokenAddress);
      const deviceId = await DeviceManager.getDeviceId();

      const response = await api.toggleTokenVisibility(
        selectedWallet.id,
        tokenAddress,
        deviceId,
        selectedWallet.chain
      );

      if (response?.status === 'success') {
        // 更新本地状态
        const updatedTokens = tokens.map(token => 
          token.address === tokenAddress 
            ? { ...token, is_visible: !token.is_visible }
            : token
        );
        setTokens(updatedTokens);

        // 更新缓存
        const cacheKey = `token_visibility_${selectedWallet.id}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          tokens: updatedTokens,
          timestamp: Date.now()
        }));

        // 确保回调被调用
        if (typeof onTokenVisibilityChanged === 'function') {
          console.log('Calling visibility changed callback');
          onTokenVisibilityChanged();
        }
      }
    } catch (error) {
      console.error('Toggle visibility error:', error);
    } finally {
      setLoadingTokenId(null);
    }
  };

  const renderTokenPlaceholder = () => (
    <View style={styles.tokenItem}>
      <View style={styles.tokenLeftContent}>
        <View style={[styles.tokenLogo, styles.placeholder]} />
        <View style={styles.tokenInfo}>
          <View style={[styles.placeholder, { width: 120, height: 20, marginBottom: 4 }]} />
          <View style={[styles.placeholder, { width: 80, height: 16 }]} />
        </View>
      </View>
      <View style={[styles.switchContainer, styles.placeholder]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Token Management"
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1FC595" />
        </View>
      ) : (
        <FlatList
          data={tokens}
          renderItem={({ item }) => (
            <View style={styles.tokenItem}>
              <View style={styles.tokenLeftContent}>
                <Image 
                  source={{ uri: item.logo }} 
                  style={styles.tokenLogo}
                />
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenName}>{item.name}</Text>
                  <Text style={styles.tokenSymbol}>{item.symbol}</Text>
                </View>
              </View>
              {loadingTokenId === item.address ? (
                <View style={[styles.switchContainer, { backgroundColor: item.is_visible ? '#1FC595' : 'rgba(255, 255, 255, 0.1)' }]}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <ToggleSwitch 
                  value={item.is_visible}
                  onToggle={() => toggleVisibility(item.address)}
                />
              )}
            </View>
          )}
          keyExtractor={item => item.address}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  listContainer: {
    padding: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#272C52',
    borderRadius: 12,
    marginBottom: 12,
  },
  tokenLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenSymbol: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  switchContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TokenManagement; 
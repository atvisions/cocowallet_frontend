import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../../contexts/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';
import TokenManagement from '../TokenManagement';

export default function WalletScreen({ navigation }) {
  const { selectedWallet, updateSelectedWallet } = useWallet();
  const [wallets, setWallets] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [totalBalance, setTotalBalance] = useState('0.00');
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [change24h, setChange24h] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedWallet) {
      console.log('Wallet changed, loading new data...');
      setTokens([]);
      setTotalBalance('0.00');
      setChange24h(0);
      setIsLoading(true);
      loadTokens(true);
    }
  }, [selectedWallet?.id]);

  const loadInitialData = async () => {
    try {
      await loadWallets();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadWallets = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      setWallets(response);
      
      if (!selectedWallet && response.length > 0) {
        console.log('Setting first wallet:', response[0]);
        updateSelectedWallet(response[0]);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadCachedData = async () => {
    try {
      if (!selectedWallet) return;
      
      const cachedTokens = await AsyncStorage.getItem(`tokens_${selectedWallet.id}`);
      if (cachedTokens) {
        const { data, timestamp } = JSON.parse(cachedTokens);
        if (Date.now() - timestamp < 2 * 60 * 1000) {
          console.log('Using cached token data');
          setTokens(data.tokens);
          setTotalBalance(data.total_value_usd);
          const change = calculate24hChange(data.tokens);
          setChange24h(change);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return false;
    }
  };

  const cacheData = async (data) => {
    try {
      await AsyncStorage.setItem(
        `tokens_${selectedWallet?.id}`,
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const calculate24hChange = (tokenList) => {
    if (!tokenList || tokenList.length === 0) return 0;

    let totalCurrentValue = 0;
    let totalValueWithoutChange = 0;

    tokenList.forEach(token => {
      const currentValue = parseFloat(token.value_usd) || 0;
      totalCurrentValue += currentValue;

      const changePercentage = parseFloat(token.price_change_24h) || 0;
      const originalValue = currentValue / (1 + (changePercentage / 100));
      totalValueWithoutChange += originalValue;
    });

    const changePercentage = ((totalCurrentValue - totalValueWithoutChange) / totalValueWithoutChange) * 100;
    return changePercentage;
  };

  const loadTokens = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      await loadCachedData();
      
      const deviceId = await DeviceManager.getDeviceId();
      if (!selectedWallet) return;

      const chain = selectedWallet.chain.toLowerCase();
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
      console.log('Loading tokens for wallet:', selectedWallet.id);
      
      const response = await api.getTokens(deviceId, chain, selectedWallet.id);
      
      if (response?.data) {
        console.log('Token data loaded successfully');
        setTokens(response.data.tokens);
        setTotalBalance(response.data.total_value_usd);
        const change = calculate24hChange(response.data.tokens);
        setChange24h(change);
        cacheData(response.data);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
      setError(error?.message || 'Failed to load wallet data');
      if (!tokens.length) {
        await loadCachedData();
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTokens(false);
  };

  const formatChange = (change) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };

  const renderTokenItem = ({ item }) => (
    <View style={styles.tokenItem}>
      <Image 
        source={{ uri: item.logo }}
        style={styles.tokenLogo}
      />
      <View style={styles.tokenInfo}>
        <View style={styles.tokenHeader}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenValue}>${Number(item.value_usd).toFixed(2)}</Text>
        </View>
        <View style={styles.tokenDetails}>
          <Text style={styles.tokenBalance}>
            {Number(item.balance_formatted).toFixed(4)} {item.symbol}
          </Text>
          <Text style={[
            styles.priceChange,
            { color: item.price_change_24h.startsWith('+') ? '#1FC595' : '#FF4B55' }
          ]}>
            {item.price_change_24h}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderError = () => {
    if (!error) return null;
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Unable to update data. Using cached data.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => loadTokens(true)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBalanceCard = () => (
    <LinearGradient
      colors={['#1B2C41', '#1B2C41']}
      style={styles.balanceCard}
    >
      <View style={styles.balanceContent}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        {isLoading ? (
          <View style={styles.balanceAmountSkeleton}>
            <View style={styles.skeletonAnimation} />
          </View>
        ) : (
          <Text style={styles.balanceAmount}>
            ${Number(totalBalance).toFixed(2)}
          </Text>
        )}
        <View style={styles.balanceFooter}>
          {isLoading ? (
            <View style={styles.changeSkeleton}>
              <View style={styles.skeletonAnimation} />
            </View>
          ) : (
            <>
              <View style={[
                styles.changeIndicator,
                { backgroundColor: change24h >= 0 ? 'rgba(31, 197, 149, 0.1)' : 'rgba(255, 75, 85, 0.1)' }
              ]}>
                <Ionicons 
                  name={change24h >= 0 ? "trending-up" : "trending-down"} 
                  size={14} 
                  color={change24h >= 0 ? "#1FC595" : "#FF4B55"} 
                />
                <Text style={[
                  styles.changePercentage,
                  { color: change24h >= 0 ? '#1FC595' : '#FF4B55' }
                ]}>
                  {formatChange(change24h)}
                </Text>
              </View>
              <Text style={styles.changeTime}>24h Change</Text>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#1FC595', '#17A982']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.actionButtonText}>Receive</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#FF4B55', '#E63F48']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.actionButtonText}>Send</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.actionButtonText}>Swap</Text>
      </TouchableOpacity>
    </View>
  );

  const handleTokenVisibilityChanged = () => {
    console.log('Token visibility changed, refreshing wallet data...');
    loadTokens(false);  // 确保这个方法会刷新代币列表
  };

  const handleTokenManagementPress = () => {
    navigation.navigate('TokenManagement', {
      onTokenVisibilityChanged: handleTokenVisibilityChanged  // 传递回调函数
    });
  };

  const handleWalletSelect = () => {
    navigation.navigate('WalletSelector');
  };

  const renderAssetsSection = () => (
    <View style={styles.assetsSection}>
      <View style={styles.assetsHeader}>
        <Text style={styles.sectionTitle}>Assets</Text>
        <TouchableOpacity 
          style={styles.tokenManagementButton}
          onPress={handleTokenManagementPress}
        >
          <Ionicons name="options-outline" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={tokens}
        renderItem={renderTokenItem}
        keyExtractor={item => `${item.chain}_${item.address}`}
        scrollEnabled={false}
        contentContainerStyle={styles.tokenList}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171C32" />
      <SafeAreaViewContext 
        style={styles.safeArea}
        edges={['right', 'bottom', 'left']}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.walletSelector}
            onPress={() => navigation.navigate('WalletSelector')}
          >
            {selectedWallet?.avatar && (
              <Image 
                source={{ uri: selectedWallet.avatar }}
                style={styles.walletLogo}
              />
            )}
            <View style={styles.walletNameContainer}>
              <Text style={styles.walletName} numberOfLines={1} ellipsizeMode="tail">
                {selectedWallet?.name || '选择钱包'}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color="#FFFFFF" 
                style={styles.dropdownIcon}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1FC595"
              colors={['#1FC595']}
            />
          }
        >
          {renderError()}
          {renderBalanceCard()}
          {renderActionButtons()}
          {renderAssetsSection()}
        </ScrollView>
      </SafeAreaViewContext>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
    paddingTop: 0,
  },
  safeArea: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    marginBottom: 10,
    marginTop: 10,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: '70%',
  },
  walletLogo: {
    width: 30,
    height: 30,
    borderRadius: 18,
    marginRight: 8,
  },
  walletNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownIcon: {
    marginLeft: 4,
    padding: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  balanceCard: {
    borderRadius: 24,
    marginBottom: 24,
    backgroundColor: '#1B2C41',
  },
  balanceContent: {
    padding: 24,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#8E8E8E',
    marginBottom: 8,
    height: 24,
    lineHeight: 24,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    height: 48,
    lineHeight: 48,
  },
  balanceAmountSkeleton: {
    height: 48,
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  changePercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  changeTime: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  changeSkeleton: {
    height: 32,
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  skeletonAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5.46,
    elevation: 9,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  assetsSection: {
    flex: 1,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
    marginTop: 0,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#272C52',
    borderRadius: 12,
    marginBottom: 12,
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
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tokenValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tokenDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenBalance: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  tokenList: {
    paddingBottom: 0,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 75, 85, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#FF4B55',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#FF4B55',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tokenManagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    height: 32,
  },
}); 
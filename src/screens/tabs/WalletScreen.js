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
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../../contexts/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useWalletNavigation } from '../../hooks/useWalletNavigation';

const WalletScreen = ({ navigation }) => {
  const { selectedWallet, updateSelectedWallet, setWallets, setSelectedWallet } = useWallet();
  const [wallets, setWalletsState] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [totalBalance, setTotalBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [change24h, setChange24h] = useState(0);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();
  const [scrollOffset, setScrollOffset] = useState(0);

  useWalletNavigation(navigation);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      console.log('Selected wallet changed, loading data...', {
        walletId: selectedWallet.id,
        walletName: selectedWallet.name,
        avatarUrl: selectedWallet.avatar
      });
      loadTokens(true);
    }
  }, [selectedWallet]);

  useEffect(() => {
    if (!isLoading && wallets.length === 0) {
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }]
          })
        );
      }, 100);
    }
  }, [wallets.length, isLoading]);

  useEffect(() => {
    // 添加导航监听器
    const unsubscribe = navigation.addListener('focus', () => {
      // 当页面重新获得焦点时刷新代币列表
      loadTokens(false);  // false 表示不显示加载动画
    });

    // 清理监听器
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('WalletScreen focused');
      setTransparentStatusBar();
      return () => {};
    }, [])
  );

  const setTransparentStatusBar = () => {
    console.log('Setting transparent status bar');
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setTranslucent(true);
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWallets(deviceId);
      
      const walletsArray = Array.isArray(response) ? response : [];
      setWalletsState(walletsArray);
      setWallets(walletsArray); // Update the global wallet state
      
      if (walletsArray.length > 0) {
        // Check if the selected wallet still exists in the updated wallet list
        const selectedWalletExists = walletsArray.some(wallet => wallet.id === selectedWallet?.id);
        
        if (!selectedWallet || !selectedWalletExists) {
          console.log('Setting initial wallet:', walletsArray[0]);
          await updateSelectedWallet(walletsArray[0]);
        }
      } else {
        // No wallets exist, clear the selected wallet
        setSelectedWallet(null);
        updateSelectedWallet(null);
        setTokens([]);
        setTotalBalance('0.00');
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setWalletsState([]);
      setWallets([]); // Update the global wallet state
      setSelectedWallet(null);
      updateSelectedWallet(null);
      setTokens([]);
      setTotalBalance('0.00');
    } finally {
      setIsLoading(false);
      setTransparentStatusBar();  // 加载完成后再次设置状态栏
    }
  };

  const loadTokens = async (showLoading = true) => {
    console.log('Loading tokens...');
    if (!selectedWallet?.id) return;
    
    try {
      if (showLoading) {
        setIsLoading(true);
        setTransparentStatusBar();  // 加载开始时设置状态栏
      }
      setError(null);

      const deviceId = await DeviceManager.getDeviceId();
      console.log('[WalletScreen] Loading tokens:', {
        deviceId,
        walletId: selectedWallet.id,
        chain: selectedWallet.chain
      });

      const response = await api.getWalletTokens(
        deviceId,
        selectedWallet.id,
        selectedWallet.chain
      );

      console.log('[WalletScreen] Token response:', response);

      if (response?.status === 'success' && response.data?.data) {
        const { tokens, total_value_usd } = response.data.data;
        
        // 只显示 is_visible 为 true 的代币
        const visibleTokens = tokens.filter(token => token.is_visible);
        console.log('Visible tokens:', visibleTokens);
        
        // 计算24小时变化率
        let totalCurrentValue = 0;
        let total24hAgoValue = 0;
        
        visibleTokens.forEach(token => {
          const currentValue = parseFloat(token.value_usd) || 0;
          const change24h = parseFloat(token.price_change_24h) || 0;
          
          totalCurrentValue += currentValue;
          // 根据当前价值和24小时变化率，计算24小时前的价值
          const value24hAgo = currentValue / (1 + (change24h / 100));
          total24hAgoValue += value24hAgo;
        });
        
        // 计算总的24小时变化率
        const totalChange24h = totalCurrentValue > 0 ? 
          ((totalCurrentValue - total24hAgoValue) / total24hAgoValue) * 100 : 0;
        
        console.log('Portfolio 24h change:', {
          totalCurrentValue,
          total24hAgoValue,
          totalChange24h
        });
        
        setTokens(visibleTokens);
        setTotalBalance(total_value_usd || '0.00');
        setChange24h(totalChange24h);
      } else {
        console.error('Invalid token response:', response);
        setError('Failed to load tokens');
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
      setError('Failed to load tokens');
    } finally {
      console.log('Finished loading tokens');
      setIsLoading(false);
      setIsRefreshing(false);
      setTransparentStatusBar();  // 加载完成后再次设置状态栏
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // 强制刷新，不使用缓存
    loadTokens(true);
  };

  const formatChange = (change) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };

  const renderTokenItem = ({ item, index }) => {
    // 格式化代币余额
    const formatTokenBalance = (balance) => {
      if (!balance) return '0';
      
      const num = parseFloat(balance);
      if (isNaN(num)) return '0';

      // 如果数字超过8位，使用科学计数法
      if (num >= 1e8 || num <= -1e8) {
        return num.toExponential(4);
      }

      // 如果数字小于0.0001，使用特殊格式
      if (num < 0.0001 && num > 0) {
        const decimalCount = Math.abs(Math.floor(Math.log10(num))) - 1;
        return `0.(${decimalCount})${num.toFixed(decimalCount + 1).slice(-1)}`;
      }

      // 如果是整数，直接返回
      if (Number.isInteger(num)) {
        return num.toLocaleString();
      }

      // 如果是小数，最多显示4位小数
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
        useGrouping: true
      });
    };

    // 格式化代币价值
    const formatTokenValue = (value) => {
      if (!value || parseFloat(value) === 0) return '$0';
      const num = parseFloat(value);
      if (isNaN(num)) return '$0';

      // 如果价值小于 0.0001，使用特殊格式
      if (num < 0.0001 && num > 0) {
        const decimalCount = Math.abs(Math.floor(Math.log10(num))) - 1;
        return `$0.(${decimalCount})${num.toFixed(decimalCount + 1).slice(-1)}`;
      }
      // 如果价值小于 0.01，显示 8 位小数
      if (num < 0.01) {
        return `$${num.toFixed(8)}`;
      }
      // 如果价值小于 1，显示 4 位小数
      if (num < 1) {
        return `$${num.toFixed(4)}`;
      }
      // 其他情况显示 2 位小数
      return `$${num.toFixed(2)}`;
    };

    // 格式化代币名称
    const formatTokenName = (name) => {
      if (!name) return '';
      return name.length > 10 ? `${name.slice(0, 10)}...` : name;
    };

    // 格式化价格变化
    const formatPriceChange = (change) => {
      if (!change) return '+0.00%';
      const num = parseFloat(change);
      if (isNaN(num)) return '+0.00%';
      const prefix = num >= 0 ? '+' : '';
      return `${prefix}${num.toFixed(2)}%`;
    };

    const priceChange = formatPriceChange(item.price_change_24h);
    const isPositiveChange = priceChange.startsWith('+');

    return (
      <View style={styles.tokenItem}>
        <Image 
          source={item.logo ? { uri: item.logo } : require('../../../assets/default-token.png')} 
          style={styles.tokenLogo}
        />
        <View style={styles.tokenInfo}>
          <View style={styles.tokenHeader}>
            <Text style={styles.tokenName}>{formatTokenName(item.name)}</Text>
            <Text style={styles.tokenValue}>
              {formatTokenValue(item.value_usd)}
            </Text>
          </View>
          <View style={styles.tokenDetails}>
            <Text style={styles.tokenBalance}>
              {formatTokenBalance(item.balance_formatted)} {item.symbol.length > 6 ? `${item.symbol.slice(0, 6)}...` : item.symbol}
            </Text>
            <Text style={[
              styles.priceChange,
              { color: isPositiveChange ? '#1FC595' : '#FF4B55' }
            ]}>
              {priceChange}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
    <View style={styles.balanceCard}>
      <View style={styles.balanceContent}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <View style={styles.balanceRow}>
          {isLoading ? (
            <View style={styles.balanceAmountSkeleton}>
              <View style={styles.skeletonAnimation} />
            </View>
          ) : (
            <>
              <Text style={styles.balanceAmount}>
                ${Number(totalBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
              <View style={styles.changeIndicator}>
                <Ionicons 
                  name={change24h >= 0 ? "trending-up" : "trending-down"} 
                  size={18} 
                  color={change24h >= 0 ? "#1FC595" : "#FF4B55"} 
                  style={styles.changeIcon}
                />
                <Text style={[
                  styles.changePercentage,
                  { color: change24h >= 0 ? '#1FC595' : '#FF4B55' }
                ]}>
                  {formatChange(change24h)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const handleReceive = () => {
    // 直接导航到 Receive 页面，不需要先选择钱包
    navigation.navigate('Receive');
  };

  const handleSend = () => {
    // 导航到发送页面
    navigation.navigate('Send', {
      selectedWallet
    });
  };

  const handleTokenVisibilityChanged = () => {
    console.log('Token visibility changed, refreshing wallet data...');
    loadTokens(true);  // 立即重新加载代币列表
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
      <View style={styles.tokenListContainer}>
        <FlatList
          data={tokens}
          renderItem={renderTokenItem}
          keyExtractor={item => `${item.chain}_${item.address}`}
          scrollEnabled={false}
          contentContainerStyle={styles.tokenList}
        />
      </View>
    </View>
  );

  const handleWalletDeleted = async () => {
    console.log('=== Handle Wallet Deleted Start ===');
    try {
      // 先清除当前选中的钱包
      await new Promise(resolve => {
        setSelectedWallet(null);
        setWalletsState([]);
        setTimeout(resolve, 100);
      });
      
      const deviceId = await DeviceManager.getDeviceId();
      console.log('Getting updated wallet list...');
      const response = await api.getWallets(deviceId);
      const walletsArray = Array.isArray(response) ? response : [];
      console.log('Updated wallets array:', walletsArray);
      
      if (walletsArray.length === 0) {
        console.log('No wallets remaining, setting wallet created to false...');
        await DeviceManager.setWalletCreated(false);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }]
          })
        );
      } else {
        // 确保状态更新的顺序正确
        await new Promise(resolve => {
          setWalletsState(walletsArray);
          setTimeout(() => {
            setSelectedWallet(walletsArray[0]);
            resolve();
          }, 100);
        });
      }
      
      console.log('Delete wallet operation completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error after wallet deletion:', error);
      Alert.alert(
        'Error',
        'Failed to update wallet list. Please try again.'
      );
      return { success: false };
    }
  };

  const handleDeleteWallet = () => {
    navigation.navigate('PasswordVerification', {
      screen: 'PasswordInput',
      params: {
        purpose: 'delete_wallet',
        title: 'Delete Wallet',
        walletId: selectedWallet?.id,
        onSuccess: async (password) => {
          try {
            const deviceId = await DeviceManager.getDeviceId();
            const deleteResponse = await api.deleteWallet(deviceId, selectedWallet.id, password);
            if (deleteResponse?.status === 'success') {
              await handleWalletDeleted();
              return { success: true };
            }
            return { success: false };
          } catch (error) {
            console.error('Delete wallet error:', error);
            return { success: false };
          }
        }
      }
    });
  };

  const renderWalletInfo = () => {
    console.log('Rendering wallet info with avatar URL:', selectedWallet?.avatar);
    return (
      <View style={styles.walletInfo}>
        <Image 
          source={{ uri: selectedWallet?.avatar }}
          style={styles.walletAvatar}
          onError={(error) => console.error('Failed to load wallet avatar:', error)}
        />
        <Text style={styles.walletName}>{selectedWallet?.name}</Text>
      </View>
    );
  };

  const renderBackground = () => {
    const backgroundColor = change24h >= 0 
      ? 'rgba(31, 197, 149, 0.1)'  // 绿色
      : 'rgba(255, 75, 85, 0.1)';   // 红色

    return (
      <LinearGradient
        colors={[backgroundColor, '#171C32']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    );
  };

  const renderHeaderBackground = () => {
    const opacity = Math.min(scrollOffset / 100, 1);  // 根据滚动位置计算透明度
    return (
      <View 
        style={[
          styles.headerBackground, 
          { 
            backgroundColor: `rgba(23, 28, 50, ${opacity})`,
            height: Platform.OS === 'ios' ? 90 : 60 + StatusBar.currentHeight, // 包含状态栏高度
          }
        ]} 
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          change24h >= 0 
            ? 'rgba(31, 197, 149, 0.08)'  // 绿色
            : 'rgba(255, 75, 85, 0.08)',   // 红色
          '#171C32'                        // 底色
        ]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.walletSelector}
            onPress={handleWalletSelect}
          >
            <Image 
              source={{ uri: selectedWallet?.avatar }} 
              style={styles.walletAvatar} 
            />
            <Text style={styles.walletName}>{selectedWallet?.name}</Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E8E" />
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('TokenManagement')}
            >
              <Ionicons name="apps-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          onScroll={event => {
            setScrollOffset(event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1FC595"
            />
          }
        >
          {renderError()}
          {renderBalanceCard()}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleReceive}
            >
              <LinearGradient
                colors={['#1FC595', '#17A982']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
    
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSend}
            >
              <LinearGradient
                colors={['#FF4B55', '#E63F48']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
    
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                try {
                  if (!selectedWallet?.id) {
                    Alert.alert('错误', '钱包信息不完整');
                    return;
                  }
                  const deviceId = await DeviceManager.getDeviceId();
                  
                  const params = {
                    deviceId,
                    walletId: selectedWallet.id,
                    chain: selectedWallet.chain?.toLowerCase()
                  };

                  console.log('History params:', params);
                  navigation.navigate('History', params);
                } catch (error) {
                  console.error('Navigation error:', error);
                  Alert.alert('错误', '无法访问交易历史');
                }
              }}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="time" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
          </View>
          {renderAssetsSection()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 56,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  walletName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 16,
    paddingTop: 6,  // 从 16 改为 6，整体向上移动 10
  },
  balanceCard: {
    marginBottom: 24,
    paddingHorizontal: 16,
    marginTop: 0,  // 添加负的上边距
  },
  balanceContent: {
    height: 160,  // 设置固定高度
    justifyContent: 'flex-start',  // 改为从顶部开始布局
    paddingTop: 20,
  },
  balanceLabel: {
    fontSize: 20,
    color: '#A0AEC0',
    fontWeight: '600',
    letterSpacing: 0.5,
    height: 24,  // 设置固定高度
    lineHeight: 24,  // 设置行高
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',  // 让元素靠左对齐
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginRight: 12,
    height: 60,  // 设置固定高度
    lineHeight: 60,  // 设置行高
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',  // 垂直居中对齐
  },
  changeIcon: {
    marginRight: 4,  // 稍微减小图标和文字的间距
  },
  changePercentage: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceAmountSkeleton: {
    height: 60,  // 匹配 balanceAmount 的高度
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  changeSkeleton: {
    height: 40,  // 匹配 changeIndicator 的高度
    width: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  skeletonAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 30,
    marginTop: -50,  // 保持这个负边距
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
  tokenListContainer: {
    backgroundColor: '#1B2C41',
    borderRadius: 24,
    padding: 8,
    marginHorizontal: 0,  // 移除水平边距
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,  // 从 16 减少到 12
    paddingBottom: 14,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: 'transparent',
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
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,  // 确保在渐变背景之上
  },
  tokenItemSkeleton: {
    height: 64,  // 匹配 tokenItem 的实际高度
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 12,
  },
});

export default WalletScreen;
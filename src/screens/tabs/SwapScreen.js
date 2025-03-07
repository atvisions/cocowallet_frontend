import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import { useWallet } from '../../contexts/WalletContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import { useFocusEffect } from '@react-navigation/native';

export default function SwapScreen({ navigation }) {
  const { selectedWallet, backgroundGradient, updateBackgroundGradient } = useWallet();
  const insets = useSafeAreaInsets();
  const [tokens, setTokens] = useState([]);
  const [recommendedTokens, setRecommendedTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isTokenSelectorVisible, setIsTokenSelectorVisible] = useState(false);
  const [selectingTokenType, setSelectingTokenType] = useState('from');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const [fromToken, setFromToken] = useState({
    symbol: 'SOL',
    balance: '0',
    icon: '',
    address: 'So11111111111111111111111111111111111111112'
  });
  
  const [toToken, setToToken] = useState({
    symbol: 'USDC',
    balance: '0',
    icon: '',
    address: 'EAfDXdgSAAkLXbV5L7vaygHrxfJs4Y4Yu6hbP7raBZVT'
  });

  useEffect(() => {
    if (selectedWallet) {
      setIsLoadingWallet(true);
      setTokens([]);
      setRecommendedTokens([]);
      
      const loadData = async () => {
        try {
          await loadTokens();
          await loadRecommendedTokens();
        } finally {
          setIsLoadingWallet(false);
        }
      };
      
      loadData();
    }
  }, [selectedWallet?.id, selectedWallet?.chain]);

  useEffect(() => {
    if (fromToken && fromToken.price_change_24h !== undefined) {
      updateBackgroundGradient(fromToken.price_change_24h);
    }
  }, [fromToken?.price_change_24h, updateBackgroundGradient]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }, [])
  );

  const loadTokens = async () => {
    console.log('Loading tokens in SwapScreen...');
    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      if (!selectedWallet) return;

      const chain = selectedWallet.chain.toLowerCase();
      const response = await api.getWalletTokens(deviceId, selectedWallet.id, chain);
      
      if (response?.data?.tokens) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendedTokens = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      if (!selectedWallet) return;

      const chain = selectedWallet.chain.toLowerCase();
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
      const response = await api.getRecommendedTokens(deviceId, chain, chainPath);
      
      if (response?.status === 'success' && response?.data) {
        setRecommendedTokens(response.data.tokens || []);
      } else {
        setRecommendedTokens([]);
      }
    } catch (error) {
      console.log('Failed to get recommended tokens:', error);
      setRecommendedTokens([]);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      loadTokens(),
      loadRecommendedTokens()
    ]).finally(() => {
      setIsRefreshing(false);
    });
  };

  const renderRecommendedToken = ({ item }) => (
    <TouchableOpacity 
      style={styles.recommendedTokenItem}
      onPress={() => handleTokenSelect(item)}
    >
      <Image 
        source={{ uri: item.logo }} 
        style={styles.recommendedTokenIcon} 
      />
      <View style={styles.recommendedTokenInfo}>
        <Text style={styles.recommendedTokenSymbol}>{item.symbol}</Text>
        <Text style={styles.recommendedTokenPrice}>${parseFloat(item.price).toFixed(2)}</Text>
        <Text style={[
          styles.recommendedTokenChange,
          { color: item.price_change_24h >= 0 ? '#1FC595' : '#FF4B55' }
        ]}>
          {item.price_change_24h >= 0 ? '+' : ''}{item.price_change_24h}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleTokenSelect = (token) => {
    if (selectingTokenType === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setIsTokenSelectorVisible(false);
  };

  const handleSwap = () => {
    // TODO: Implement swap logic
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[backgroundGradient, '#171C32']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.walletSelector}
            onPress={() => navigation.navigate('WalletSelector')}
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
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
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
          {isLoadingWallet ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1FC595" />
            </View>
          ) : (
            <>
              {/* Swap Card */}
              <View style={styles.swapCard}>
                {/* From Token */}
                <View style={styles.tokenSection}>
                  <Text style={styles.sectionLabel}>From</Text>
                  <TouchableOpacity 
                    style={styles.tokenSelector}
                    onPress={() => {
                      setSelectingTokenType('from');
                      setIsTokenSelectorVisible(true);
                    }}>
                    <Image source={{ uri: fromToken.icon || 'https://example.com/default-token.png' }} style={styles.tokenIcon} />
                    <Text style={styles.tokenSymbol}>{fromToken.symbol}</Text>
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.amountInput}
                    value={fromAmount}
                    onChangeText={setFromAmount}
                    placeholder="0.00"
                    placeholderTextColor="#8E8E8E"
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Swap Button */}
                <TouchableOpacity style={styles.swapButton} onPress={() => {
                  const temp = fromToken;
                  setFromToken(toToken);
                  setToToken(temp);
                }}>
                  <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* To Token */}
                <View style={styles.tokenSection}>
                  <Text style={styles.sectionLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.tokenSelector}
                    onPress={() => {
                      setSelectingTokenType('to');
                      setIsTokenSelectorVisible(true);
                    }}>
                    <Image source={{ uri: toToken.icon || 'https://example.com/default-token.png' }} style={styles.tokenIcon} />
                    <Text style={styles.tokenSymbol}>{toToken.symbol}</Text>
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.amountInput}
                    value={toAmount}
                    onChangeText={setToAmount}
                    placeholder="0.00"
                    placeholderTextColor="#8E8E8E"
                    keyboardType="decimal-pad"
                    editable={false}
                  />
                </View>

                {/* Exchange Rate */}
                {exchangeRate > 0 && (
                  <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>
                      1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
                    </Text>
                  </View>
                )}

                {/* Swap Action Button */}
                <TouchableOpacity 
                  style={[styles.actionButton, (!fromAmount || isQuoteLoading) && styles.actionButtonDisabled]}
                  onPress={handleSwap}
                  disabled={!fromAmount || isQuoteLoading}
                >
                  <Text style={styles.actionButtonText}>
                    {isQuoteLoading ? 'Calculating...' : 'Swap'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Recommended Tokens Section */}
              <View style={styles.recommendedSection}>
                <Text style={styles.recommendedTitle}>推荐代币</Text>
                <FlatList
                  data={recommendedTokens}
                  renderItem={renderRecommendedToken}
                  keyExtractor={item => item.address}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendedList}
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32'
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  swapCard: {
    backgroundColor: '#1B2C41',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24
  },
  tokenSection: {
    marginBottom: 16
  },
  sectionLabel: {
    color: '#8E8E8E',
    fontSize: 14,
    marginBottom: 8
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  tokenIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1
  },
  amountInput: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600'
  },
  swapButton: {
    backgroundColor: '#272C52',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8
  },
  rateContainer: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center'
  },
  rateText: {
    color: '#8E8E8E',
    fontSize: 14
  },
  actionButton: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  actionButtonDisabled: {
    opacity: 0.5
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  rateCard: {
    backgroundColor: '#1B2C41',
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  recommendedSection: {
    marginTop: 24,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  recommendedList: {
    paddingHorizontal: 8,
    flexGrow: 0
  },
  recommendedTokenItem: {
    backgroundColor: '#1B2C41',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    width: 120,
    alignItems: 'center',
  },
  recommendedTokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  recommendedTokenInfo: {
    alignItems: 'center',
  },
  recommendedTokenSymbol: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendedTokenPrice: {
    color: '#8E8E8E',
    fontSize: 12,
    marginBottom: 4,
  },
  recommendedTokenChange: {
    fontSize: 12,
    fontWeight: '500'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
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
  safeArea: {
    flex: 1,
  },
})
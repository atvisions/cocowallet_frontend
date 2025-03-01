import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';

export default function TokenListScreen({ navigation, route }) {
  const { selectedWallet } = useWallet();
  const [tokens, setTokens] = useState(route.params?.tokens || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { onSelect } = route.params || {};

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    if (!selectedWallet?.id) return;

    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWalletTokens(
        deviceId,
        selectedWallet.id,
        selectedWallet.chain
      );

      if (response?.data?.tokens) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTokens();
  };

  const handleTokenSelect = (token) => {
    console.log('TokenListScreen - handleTokenSelect called with token:', token);
    if (onSelect && typeof onSelect === 'function') {
      console.log('TokenListScreen - Calling onSelect callback');
      onSelect(token);
      console.log('TokenListScreen - onSelect callback completed');
      navigation.goBack();
    } else {
      console.log('TokenListScreen - onSelect callback not available or not a function');
    }
  };

  const renderTokenItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tokenItem}
      onPress={() => handleTokenSelect(item)}
    >
      <Image 
        source={{ uri: item.logo }}
        style={styles.tokenLogo}
        defaultSource={require('../../../assets/default-token.png')}
      />
      <View style={styles.tokenInfo}>
        <View style={styles.tokenHeader}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenValue}>${Number(item.value_usd).toFixed(2)}</Text>
        </View>
        <View style={styles.tokenDetails}>
          <View style={styles.tokenBalanceContainer}>
            <Text style={styles.tokenBalance}>
              {Number(item.balance_formatted).toFixed(4)} {item.symbol}
            </Text>
            <View style={styles.chainBadge}>
              <Text style={styles.chainName}>{item.chain || selectedWallet?.chain}</Text>
            </View>
          </View>
          <Text style={[styles.priceChange, { color: item.price_change_24h >= 0 ? '#1FC595' : '#FF4B55' }]}>
            {item.price_change_24h >= 0 ? '+' : ''}{item.price_change_24h}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Token List"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={tokens}
        renderItem={renderTokenItem}
        keyExtractor={item => `${item.chain}_${item.address}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1FC595"
            colors={['#1FC595']}
          />
        }
      />
    </SafeAreaView>
  );
}

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
    alignItems: 'center',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
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
    color: '#FFFFFF',
    fontWeight: '600',
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
  tokenBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chainBadge: {
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  chainName: {
    color: '#1FC595',
    fontSize: 12,
    fontWeight: '500',
  },
});
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import Loading from '../../components/common/Loading';
import Header from '../../components/common/Header';

const SUPPORTED_CHAINS = ['ETH', 'BASE', 'SOL'];

// 添加链的默认 logo 映射
const DEFAULT_CHAIN_LOGOS = {
  'ETH': require('../../../assets/chains/ethereum.png'),
  'BASE': require('../../../assets/chains/base.png'),
  'SOL': require('../../../assets/chains/solana.png')
};

export default function SelectChain({ navigation, route }) {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deviceId } = route.params || {};

  useEffect(() => {
    if (!deviceId) {
      Alert.alert('Error', 'Device ID is required to load chains.');
      return;
    }
    loadChains();
  }, [deviceId]);

  const loadChains = async () => {
    try {
      setLoading(true);
      const response = await api.getSupportedChains();
      console.log('Supported chains response:', response); // 添加日志
      const filteredChains = Object.entries(response.data.supported_chains)
        .filter(([key]) => SUPPORTED_CHAINS.includes(key))
        .map(([key, value]) => ({ 
          id: key, 
          ...value
        }));
      setChains(filteredChains);
    } catch (error) {
      Alert.alert('Error', 'Failed to load supported chains');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChains();
  };

  const handleChainSelect = async (chain) => {
    const { purpose } = route.params; // 获取目的参数
    console.log('Selected chain:', chain);
    console.log('Purpose:', purpose);

    try {
      const response = await api.selectChain(deviceId, chain);
      console.log('Select chain response:', response);

      if (purpose === 'create') {
        if (!response.data.mnemonic) {
          throw new Error('No mnemonic received');
        }
        navigation.navigate('ShowMnemonic', {
          mnemonic: response.data.mnemonic,
          chain,
          deviceId,
        });
      } else if (purpose === 'import') {
        navigation.navigate('ImportWallet', {
          chain,
          deviceId
        });
      }
    } catch (error) {
      console.error('Failed to select chain:', error);
      Alert.alert('Error', 'Failed to select chain');
    }
  };

  const renderChainItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chainItem}
      onPress={() => handleChainSelect(item.id)}
    >
      <Image 
        source={
          // 如果 API 返回的 logo 无效，使用默认 logo
          item.logo ? 
            { uri: item.logo } : 
            DEFAULT_CHAIN_LOGOS[item.id] || DEFAULT_CHAIN_LOGOS['ETH']
        }
        style={styles.chainLogo}
        // 添加默认图片
        defaultSource={DEFAULT_CHAIN_LOGOS[item.id]}
      />
      <View style={styles.chainInfo}>
        <Text style={styles.chainName}>{item.name}</Text>
        <Text style={styles.chainSymbol}>{item.symbol}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Select Chain"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <FlatList
          data={chains}
          renderItem={renderChainItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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
    padding: 16,
  },
  listContainer: {
    paddingVertical: 12,
  },
  chainItem: {
    flexDirection: 'row',
    backgroundColor: '#272C52',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  chainLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  chainInfo: {
    flex: 1,
  },
  chainName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Gilroy-SemiBold',
  },
  chainSymbol: {
    fontSize: 14,
    color: '#8E8E8E',
    fontFamily: 'Gilroy-Medium',
  },
});
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
import { api } from '../services/api';
import Loading from '../components/common/Loading';
import Header from '../components/common/Header';

const SUPPORTED_CHAINS = ['ETH', 'BASE', 'SOL'];

// 添加链的默认 logo 映射
const DEFAULT_CHAIN_LOGOS = {
  'SOL': require('../../assets/chains/solana.png'),  // 确保有这个图片
  'ETH': require('../../assets/chains/ethereum.png'),
  'BASE': require('../../assets/chains/base.png')
};

export default function SelectChain({ navigation, route }) {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deviceId } = route.params;

  useEffect(() => {
    loadChains();
  }, []);

  const loadChains = async () => {
    try {
      setLoading(true);
      const response = await api.getSupportedChains();
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
    const { purpose, deviceId } = route.params;
    
    if (purpose === 'import') {
      navigation.navigate('ImportWallet', { chain });
    } else {
      try {
        const response = await api.selectChain(deviceId, chain);
        
        if (!response?.data?.mnemonic) {
          throw new Error('No mnemonic received');
        }

        // 无论是从哪里来的创建钱包，都走相同的流程
        navigation.replace('ShowMnemonic', {
          mnemonic: response.data.mnemonic,
          chain,
          deviceId
        });
      } catch (error) {
        console.error('Failed to select chain:', error);
        Alert.alert('Error', 'Failed to select chain');
      }
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
        <Text style={styles.title}>Select Chain</Text>
        <Text style={styles.subtitle}>Choose a blockchain network</Text>

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
    paddingTop: 0, // 确保没有额外的顶部间距
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 10, // 调整顶部间距
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
  },
  listContainer: {
    paddingBottom: 20,
  },
  chainItem: {
    flexDirection: 'row',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  chainLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  chainInfo: {
    flex: 1,
  },
  chainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  chainSymbol: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 
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
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import Loading from '../components/Loading';

const SUPPORTED_CHAINS = ['ETH', 'BASE', 'SOL'];

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

  const handleSelectChain = async (chainId) => {
    try {
      const response = await api.selectChain(deviceId, chainId);
      // 导航到助记词展示页面
      navigation.replace('ShowMnemonic', {
        mnemonic: response.data.mnemonic,
        chain: chainId,
        deviceId
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to select chain');
    }
  };

  const renderChainItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chainItem}
      onPress={() => handleSelectChain(item.id)}
    >
      <Image 
        source={{ uri: item.logo }}
        style={styles.chainLogo}
      />
      <View style={styles.chainInfo}>
        <Text style={styles.chainName}>{item.name}</Text>
        <Text style={styles.chainSymbol}>{item.symbol}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171C32" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Network</Text>
          <View style={styles.backButton} />
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
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
    marginRight: 15,
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
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import EmptyTransactions from '../../components/EmptyTransactions';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';

export default function HistoryScreen({ navigation, route }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (page = 1) => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      // 使用当前选中的钱包信息
      const selectedWallet = route.params?.selectedWallet;
      if (!selectedWallet) return;

      const chain = selectedWallet.chain.toLowerCase();
      const walletId = selectedWallet.id;
      
      const response = await api.getTokenTransfers(deviceId, chain, walletId, page);
      
      if (response?.data) {
        if (page === 1) {
          setTransactions(response.data.results);
        } else {
          setTransactions(prev => [...prev, ...response.data.results]);
        }
        setHasMore(response.data.next !== null);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadTransactions(currentPage + 1);
    }
  };

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={item.type === 'receive' ? 'arrow-down' : 'arrow-up'} 
          size={24} 
          color={item.type === 'receive' ? '#1FC595' : '#FF4B55'} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {item.type === 'receive' ? 'Received' : 'Sent'}
          </Text>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'receive' ? '#1FC595' : '#FF4B55' }
          ]}>
            {item.type === 'receive' ? '+' : '-'}{item.amount} {item.symbol}
          </Text>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.transactionValue}>
            ${Number(item.value_usd).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header title="History" />

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1FC595"
            colors={['#1FC595']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!isLoading && <EmptyTransactions />}
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
    flexGrow: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  transactionValue: {
    fontSize: 14,
    color: '#8E8E8E',
  },
}); 
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Clipboard,
  ToastAndroid,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function TransactionDetailScreen({ route, navigation }) {
  const { transaction } = route.params || {};
  
  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Transaction information unavailable</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const formatAddress = (address) => {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };
  
  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  };
  
  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', `${label} copied to clipboard`);
    }
  };
  
  const openExplorer = (txHash) => {
    // 根据不同链选择不同的区块浏览器
    let explorerUrl = '';
    
    // 这里假设是 Solana 链
    explorerUrl = `https://explorer.solana.com/tx/${txHash}`;
    
    Linking.openURL(explorerUrl).catch(err => {
      console.error('Unable to open browser:', err);
      Alert.alert('Error', 'Unable to open block explorer');
    });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '#1FC595';
      case 'FAILED':
        return '#FF5C5C';
      case 'PENDING':
      case 'SENDING':
      case 'CONFIRMING':
        return '#FFA500';
      default:
        return '#8E8E8E';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'FAILED':
        return 'Failed';
      case 'PENDING':
        return 'Pending';
      case 'SENDING':
        return 'Sending';
      case 'CONFIRMING':
        return 'Confirming';
      default:
        return 'Unknown';
    }
  };
  
  const getTransactionTypeText = (txType) => {
    switch (txType) {
      case 'TRANSFER':
        return 'Transfer';
      case 'SWAP':
        return 'Swap';
      default:
        return txType || 'Unknown';
    }
  };
  
  const getDirectionText = (direction) => {
    switch (direction) {
      case 'SENT':
        return 'Sent';
      case 'RECEIVED':
        return 'Received';
      default:
        return direction || 'Unknown';
    }
  };
  
  const formatAmount = (amount, direction) => {
    if (direction === 'RECEIVED') {
      return `+${amount}`;
    } else {
      return `-${amount}`;
    }
  };
  
  const getAmountColor = (direction) => {
    return direction === 'RECEIVED' ? '#1FC595' : '#FF5C5C';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.topSection}>
          <View style={styles.tokenInfoContainer}>
            {transaction.token?.logo ? (
              <Image 
                source={{ uri: transaction.token.logo }} 
                style={styles.tokenLogo} 
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.tokenLogo, styles.fallbackLogo]}>
                <Text style={styles.fallbackLogoText}>
                  {transaction.token?.symbol?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.tokenName}>{transaction.token?.name || 'Unknown Token'}</Text>
          </View>
          
          <Text style={[styles.amount, { color: getAmountColor(transaction.direction) }]}>
            {formatAmount(transaction.amount, transaction.direction)} {transaction.token?.symbol}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
            <Text style={styles.statusText}>{getStatusText(transaction.status)}</Text>
          </View>
        </View>
        
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Type</Text>
            <Text style={styles.detailValue}>
              {getTransactionTypeText(transaction.tx_type)} ({getDirectionText(transaction.direction)})
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From</Text>
            <TouchableOpacity 
              style={styles.copyContainer}
              onPress={() => copyToClipboard(transaction.from_address, 'Sender address')}
            >
              <Text style={styles.detailValue}>{formatAddress(transaction.from_address)}</Text>
              <Ionicons name="copy-outline" size={16} color="#8E8E8E" style={styles.copyIcon} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To</Text>
            <TouchableOpacity 
              style={styles.copyContainer}
              onPress={() => copyToClipboard(transaction.to_address, 'Recipient address')}
            >
              <Text style={styles.detailValue}>{formatAddress(transaction.to_address)}</Text>
              <Ionicons name="copy-outline" size={16} color="#8E8E8E" style={styles.copyIcon} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Hash</Text>
            <TouchableOpacity 
              style={styles.copyContainer}
              onPress={() => copyToClipboard(transaction.tx_hash, 'Transaction hash')}
            >
              <Text style={styles.detailValue}>{formatAddress(transaction.tx_hash)}</Text>
              <Ionicons name="copy-outline" size={16} color="#8E8E8E" style={styles.copyIcon} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Time</Text>
            <Text style={styles.detailValue}>
              {formatFullDate(transaction.block_timestamp || transaction.created_at)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gas Fee</Text>
            <Text style={styles.detailValue}>
              {transaction.gas_fee || (transaction.gas_price * transaction.gas_used)} SOL
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.explorerButton}
          onPress={() => openExplorer(transaction.tx_hash)}
        >
          <Text style={styles.explorerButtonText}>View in Block Explorer</Text>
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#272C52',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#272C52',
  },
  tokenInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    backgroundColor: '#272C52',
  },
  fallbackLogo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tokenName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1FC595',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#272C52',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#272C52',
  },
  detailLabel: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'right',
    maxWidth: '60%',
  },
  copyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyIcon: {
    marginLeft: 6,
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3F64',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  explorerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#1FC595',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
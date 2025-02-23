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
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../../components/Header';
import { BASE_URL } from '../../config/constants';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import { useWallet } from '../../contexts/WalletContext';

export default function SwapScreen({ navigation }) {
  const { selectedWallet } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);

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

  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingTokenType, setSelectingTokenType] = useState('from'); // 'from' 或 'to'

  useEffect(() => {
    if (selectedWallet) {
      loadTokens();
    }
  }, [selectedWallet?.id]);

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      if (!selectedWallet) return;

      const chain = selectedWallet.chain.toLowerCase();
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
      
      const response = await api.getTokens(deviceId, chain, selectedWallet.id);
      
      if (response?.data?.tokens) {
        setTokens(response.data.tokens);
        
        // 更新 SOL 和 USDC 代币信息
        const solToken = response.data.tokens.find(t => t.symbol === 'SOL');
        const usdcToken = response.data.tokens.find(t => t.symbol === 'USDC');

        if (solToken) {
          setFromToken(prev => ({
            ...prev,
            balance: solToken.balance_formatted,
            icon: solToken.logo
          }));
        }

        if (usdcToken) {
          setToToken(prev => ({
            ...prev,
            balance: usdcToken.balance_formatted,
            icon: usdcToken.logo
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取兑换报价
  const fetchSwapQuote = async (amount) => {
    if (!amount || parseFloat(amount) === 0) {
      setToAmount('');
      return;
    }

    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await fetch(
        `${BASE_URL}/api/v1/solana/wallets/${selectedWallet.id}/swap/quote?` +
        `device_id=${deviceId}&` +
        `from_token=${fromToken.address}&` +
        `to_token=${toToken.address}&` +
        `amount=${amount}&` +
        `slippage=0.5`
      );
      
      const data = await response.json();
      if (data.success) {
        setToAmount(data.toAmount);
        const rate = parseFloat(data.toAmount) / parseFloat(amount);
        setExchangeRate(rate);
      }
    } catch (error) {
      console.error('获取报价失败:', error);
    }
  };

  const handleFromAmountChange = (value) => {
    setFromAmount(value);
    fetchSwapQuote(value);
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setToAmount('');
  };

  const handleTokenSelect = (token) => {
    if (selectingTokenType === 'from') {
      // 如果选择的是当前to token，则交换
      if (token.symbol === toToken.symbol) {
        handleSwapTokens();
      } else {
        setFromToken({
          symbol: token.symbol,
          balance: token.balance_formatted,
          icon: token.logo,
          address: token.address
        });
      }
    } else {
      // 如果选择的是当前from token，则交换
      if (token.symbol === fromToken.symbol) {
        handleSwapTokens();
      } else {
        setToToken({
          symbol: token.symbol,
          balance: token.balance_formatted,
          icon: token.logo,
          address: token.address
        });
      }
    }
    setShowTokenSelector(false);
    setFromAmount('');
    setToAmount('');
  };

  const renderTokenItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tokenListItem}
      onPress={() => handleTokenSelect(item)}
    >
      <View style={styles.tokenListItemLeft}>
        <Image 
          source={{ uri: item.logo }} 
          style={styles.tokenListIcon} 
        />
        <View>
          <Text style={styles.tokenListSymbol}>{item.symbol}</Text>
          <Text style={styles.tokenListName}>{item.name}</Text>
        </View>
      </View>
      <Text style={styles.tokenListBalance}>
        {parseFloat(item.balance_formatted).toFixed(4)}
      </Text>
    </TouchableOpacity>
  );

  const TokenSelectorModal = () => (
    <Modal
      visible={showTokenSelector}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择代币</Text>
            <TouchableOpacity 
              onPress={() => setShowTokenSelector(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={tokens}
            renderItem={renderTokenItem}
            keyExtractor={item => item.address}
            style={styles.tokenList}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Swap" 
        rightIcon="settings-outline"
        onRightPress={() => navigation.navigate('Settings')}
      />
      
      {/* From Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.sectionLabel}>You pay</Text>
          <Text style={styles.balanceText}>
            Balance: {parseFloat(fromToken.balance).toFixed(4)}
          </Text>
        </View>
        
        <View style={styles.inputContent}>
          <TouchableOpacity 
            style={styles.tokenSelector}
            onPress={() => {
              setSelectingTokenType('from');
              setShowTokenSelector(true);
            }}
          >
            <Image 
              source={{ uri: fromToken.icon }} 
              style={styles.tokenIcon} 
            />
            <Text style={styles.tokenSymbol}>{fromToken.symbol}</Text>
            <Icon name="chevron-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.amountInput}
            value={fromAmount}
            onChangeText={handleFromAmountChange}
            placeholder="0.0"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Swap Button */}
      <View style={styles.swapButtonContainer}>
        <TouchableOpacity 
          style={styles.swapButton} 
          onPress={handleSwapTokens}
        >
          <Icon name="swap-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* To Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.sectionLabel}>You receive</Text>
          <Text style={styles.balanceText}>
            Balance: {parseFloat(toToken.balance).toFixed(4)}
          </Text>
        </View>
        
        <View style={styles.inputContent}>
          <TouchableOpacity 
            style={styles.tokenSelector}
            onPress={() => {
              setSelectingTokenType('to');
              setShowTokenSelector(true);
            }}
          >
            <Image 
              source={{ uri: toToken.icon }} 
              style={styles.tokenIcon} 
            />
            <Text style={styles.tokenSymbol}>{toToken.symbol}</Text>
            <Icon name="chevron-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.amountInput}
            value={toAmount}
            editable={false}
            placeholder="0.0"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Exchange Rate */}
      <View style={styles.rateCard}>
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Exchange Rate</Text>
          <Text style={styles.rateValue}>
            1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
          </Text>
        </View>
      </View>

      {/* Swap Button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          (!fromAmount || isLoading) && styles.submitButtonDisabled
        ]}
        disabled={!fromAmount || isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Getting Quote...' : 'Swap'}
        </Text>
      </TouchableOpacity>

      <TokenSelectorModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  inputSection: {
    backgroundColor: '#1E2338',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 5,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  balanceText: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  inputContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252A43',
    padding: 12,
    borderRadius: 8,
  },
  tokenIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  swapButtonContainer: {
    position: 'relative',
    height: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -22.5,
    borderWidth: 4,
    borderColor: '#171C32',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rateCard: {
    backgroundColor: '#1E2338',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  rateValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#171C32',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3154',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  tokenList: {
    paddingHorizontal: 16,
  },
  tokenListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3154',
  },
  tokenListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  tokenListSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenListName: {
    color: '#8E8E8E',
    fontSize: 14,
    marginTop: 2,
  },
  tokenListBalance: {
    color: '#FFFFFF',
    fontSize: 16,
  },
}); 
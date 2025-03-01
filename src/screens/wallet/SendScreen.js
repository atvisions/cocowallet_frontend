import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';
import * as Clipboard from 'expo-clipboard';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';

export default function SendScreen({ navigation, route }) {
  const { selectedWallet } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenList, setTokenList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Selected wallet changed:', selectedWallet); // 添加日志
    if (selectedWallet) {
      loadTokens();
    }
  }, [selectedWallet]);

  const loadTokens = async () => {
    if (!selectedWallet?.id) return;

    try {
      setIsLoading(true);
      console.log('Loading tokens for wallet:', selectedWallet.id); // 添加日志
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getWalletTokens(
        deviceId,
        selectedWallet.id,
        selectedWallet.chain
      );

      console.log('Token response:', response); // 添加日志

      if (response?.data?.tokens) {
        setTokenList(response.data.tokens);
        // 设置默认选中的代币为原生代币
        const nativeToken = response.data.tokens.find(token => token.is_native);
        console.log('Native token found:', nativeToken); // 添加日志
        if (nativeToken) {
          setSelectedToken(nativeToken);
        }
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setRecipientAddress(text);
  };

  const handleScan = () => {
    // TODO: Implement QR code scanning
    navigation.navigate('QRScanner', {
      onScan: (address) => {
        setRecipientAddress(address);
      }
    });
  };

  const validateAddress = (address) => {
    // TODO: Implement proper address validation based on chain type
    return address.length > 30;
  };

  const validateAmount = (value) => {
    const numberValue = parseFloat(value);
    return !isNaN(numberValue) && numberValue > 0;
  };

  const handleContinue = () => {
    if (!recipientAddress.trim()) {
      Alert.alert('Error', 'Please enter recipient address');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    if (!validateAmount(amount)) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    // Navigate to confirmation screen with selected token info
    navigation.navigate('SendConfirmation', {
      recipientAddress,
      amount,
      token: selectedToken?.symbol || selectedWallet.chain,
      tokenInfo: selectedToken
    });
  };

  const handleTokenSelect = () => {
    console.log('handleTokenSelect called');
    if (!tokenList || tokenList.length === 0) {
      console.log('No tokens available, tokenList:', tokenList);
      return;
    }
    
    try {
      console.log('TokenList available, preparing to navigate with tokens:', tokenList);
      navigation.navigate('TokenListScreen', {
        tokens: tokenList,
        onSelect: (token) => {
          console.log('Token selection callback triggered with token:', token);
          setSelectedToken(token);
          setAmount('');
        }
      });
      console.log('Navigation to TokenListScreen completed');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const formatBalance = (balance, decimals) => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    return num.toFixed(Math.min(4, decimals));
  };

  const renderTokenSection = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tokens...</Text>
        </View>
      );
    }

    return (
      <View style={styles.tokenContainer}>
        <TouchableOpacity 
          style={styles.tokenSelector}
          onPress={handleTokenSelect}
        >
          {selectedToken?.logo ? (
            <Image 
              source={{ uri: selectedToken.logo }} 
              style={styles.tokenLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.tokenLogo, styles.tokenLogoPlaceholder]} />
          )}
          <View style={styles.tokenDetails}>
            <Text style={styles.tokenSymbol} numberOfLines={1}>
              {selectedToken?.symbol || selectedWallet?.chain}
            </Text>
            {selectedToken?.price_usd && (
              <Text style={styles.tokenPrice}>
                ${parseFloat(selectedToken.price_usd).toFixed(2)}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title="Send"
        onBack={() => navigation.goBack()}
      />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.formSection}>
          <Text style={styles.label}>To Address</Text>
          <View style={styles.addressInputContainer}>
            <TextInput
              style={styles.addressInput}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder="Enter or paste address"
              placeholderTextColor="#8E8E8E"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.addressActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handlePaste}
              >
                <Ionicons name="clipboard-outline" size={20} color="#1FC595" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleScan}
              >
                <Ionicons name="scan-outline" size={20} color="#1FC595" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#8E8E8E"
                keyboardType="decimal-pad"
              />
              {renderTokenSection()}
            </View>
            <View style={styles.tokenBalanceInfo}>
              <View style={styles.tokenBalanceRow}>
                <Text style={styles.balanceText}>
                  Balance: {formatBalance(selectedToken?.balance_formatted, selectedToken?.decimals)} {selectedToken?.symbol}
                </Text>
                {selectedToken?.price_usd && parseFloat(amount) > 0 && (
                  <Text style={styles.totalValueText}>
                    ≈ ${(parseFloat(amount) * parseFloat(selectedToken.price_usd)).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.continueButton,
            (!recipientAddress || !amount) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!recipientAddress || !amount}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  addressInputContainer: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  addressInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  addressActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  amountContainer: {
    borderRadius: 12,
    backgroundColor: '#272C52',
    overflow: 'hidden',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3F58',
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    minHeight: 36,
    padding: 0,
  },
  tokenContainer: {
    flexShrink: 0,
    marginLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#3A3F58',
    paddingLeft: 16,
    justifyContent: 'center',
    minWidth: 160,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingVertical: 4,
  },
  tokenLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  tokenDetails: {
    flex: 1,
    marginRight: 8,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chainBadge: {
    display: 'none',
  },
  chainName: {
    display: 'none',
  },
  tokenPrice: {
    color: '#8E8E8E',
    fontSize: 12,
    marginTop: 2,
  },
  tokenArrow: {
    marginLeft: 8,
  },
  tokenName: {
    color: '#8E8E8E',
    fontSize: 12,
    marginTop: 2,
  },
  maxButton: {
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maxButtonText: {
    color: '#1FC595',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceInfo: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  balanceText: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  priceText: {
    color: '#8E8E8E',
    fontSize: 14,
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenLogoPlaceholder: {
    backgroundColor: '#3A3F58',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  tokenBalanceInfo: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3F58',
  },
  tokenBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValueText: {
    color: '#8E8E8E',
    fontSize: 12,
    textAlign: 'right',
    marginLeft: 8,
  },
});
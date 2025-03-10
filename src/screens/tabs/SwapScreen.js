import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import { useWallet } from '../../contexts/WalletContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import SlippageSettingModal from '../swap/SlippageSettingModal';
import { formatTokenAmount } from '../../utils/format';

const SkeletonLoader = ({ width, height, style }) => {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#2A2F45',
          borderRadius: 4,
          opacity: 0.6
        },
        style,
      ]}
    />
  );
};

// 添加防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const QuoteDetails = ({ quote, fees, toToken, fromToken, isQuoteLoading, calculateExchangeRate, formatTokenAmount, formatPriceImpact }) => {
  if (isQuoteLoading) {
    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsInner}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate</Text>
            <View style={styles.detailValueWrapper}>
              <SkeletonLoader width={80} height={14} style={styles.detailSkeleton} />
              <Text style={styles.detailUnit}>{toToken?.symbol || '--'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Min</Text>
            <View style={styles.detailValueWrapper}>
              <SkeletonLoader width={80} height={14} style={styles.detailSkeleton} />
              <Text style={styles.detailUnit}>{toToken?.symbol || '--'}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Impact</Text>
            <View style={styles.detailValueWrapper}>
              <SkeletonLoader width={60} height={14} style={styles.detailSkeleton} />
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee</Text>
            <View style={styles.detailValueWrapper}>
              <SkeletonLoader width={60} height={14} style={styles.detailSkeleton} />
              <Text style={styles.detailUnit}>SOL</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsInner}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rate</Text>
          <View style={styles.detailValueWrapper}>
            <Text style={styles.detailValue} numberOfLines={1}>
              {quote && fromToken && toToken ? `${calculateExchangeRate(quote, fromToken, toToken)}` : '--'}
            </Text>
            <Text style={styles.detailUnit}>{toToken?.symbol || '--'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Min</Text>
          <View style={styles.detailValueWrapper}>
            <Text style={styles.detailValue} numberOfLines={1}>
              {quote && toToken ? formatTokenAmount(quote.minimum_received, toToken.decimals) : '--'}
            </Text>
            <Text style={styles.detailUnit}>{toToken?.symbol || '--'}</Text>
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Impact</Text>
          <Text style={[
            styles.detailValue,
            quote && Number(quote.price_impact) > 3 ? styles.detailValueWarning : null
          ]} numberOfLines={1}>
            {quote ? `${formatPriceImpact(quote.price_impact)}%` : '--'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fee</Text>
          <View style={styles.detailValueWrapper}>
            <Text style={styles.detailValue} numberOfLines={1}>
              {fees ? `${fees.total_fee_sol}` : '--'}
            </Text>
            <Text style={styles.detailUnit}>SOL</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const SwapScreen = ({ navigation }) => {
  const { selectedWallet, backgroundGradient } = useWallet();
  const [userTokens, setUserTokens] = useState([]);
  const [swapTokens, setSwapTokens] = useState([]);
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [fees, setFees] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [tokenPrices, setTokenPrices] = useState({});
  const [slippage, setSlippage] = useState('0.5'); // 默认滑点 0.5%
  const [isSlippageModalVisible, setIsSlippageModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);
  const [priceChange, setPriceChange] = useState(0);
  const insets = useSafeAreaInsets();
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // 使用 useFocusEffect 监听页面焦点
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);

      // 离开页面时的清理工作
      return () => {
        console.log('离开 Swap 页面，重置交易状态');
        setIsScreenFocused(false);
        // 只重置交易相关的状态
        setAmount('');
        setQuote(null);
        setFees(null);
        setIsQuoteLoading(false);
        setIsInsufficientBalance(false);
        setPriceChange(0);
        // 停止定时刷新
        if (quoteRefreshInterval.current) {
          clearInterval(quoteRefreshInterval.current);
          quoteRefreshInterval.current = null;
        }
        // 不再重置 fromToken 和 toToken
      };
    }, [])
  );

  // 创建一个 ref 来存储定时器
  const quoteRefreshInterval = React.useRef(null);

  // 防抖处理的报价请求
  const debouncedGetQuote = React.useCallback(
    debounce(async () => {
      if (!isScreenFocused || !fromToken || !toToken || !amount) {
        return;
      }
      await getQuoteAndFees();
    }, 1000),
    [fromToken, toToken, amount, isScreenFocused]
  );

  // 修改报价刷新机制
  useEffect(() => {
    if (isScreenFocused && fromToken && toToken && amount) {
      debouncedGetQuote();
    }
  }, [fromToken, toToken, amount, slippage, isScreenFocused]);

  // 修改定时刷新逻辑
  useEffect(() => {
    if (isScreenFocused && fromToken && toToken && amount && quote && !isInsufficientBalance) {
      // 检查金额是否为 0 或无效
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        if (quoteRefreshInterval.current) {
          clearInterval(quoteRefreshInterval.current);
          quoteRefreshInterval.current = null;
        }
        return;
      }
      
      // 清理之前的定时器
      if (quoteRefreshInterval.current) {
        clearInterval(quoteRefreshInterval.current);
      }
      
      // 设置新的定时器，10秒刷新一次
      quoteRefreshInterval.current = setInterval(() => {
        if (isScreenFocused) {
          getQuoteAndFees();
        }
      }, 10000);
    } else {
      // 如果条件不满足，清除定时器
      if (quoteRefreshInterval.current) {
        clearInterval(quoteRefreshInterval.current);
        quoteRefreshInterval.current = null;
      }
    }

    return () => {
      if (quoteRefreshInterval.current) {
        clearInterval(quoteRefreshInterval.current);
        quoteRefreshInterval.current = null;
      }
    };
  }, [fromToken, toToken, amount, isInsufficientBalance, isScreenFocused]);

  useEffect(() => {
    loadUserTokens();
    loadSwapTokens();
  }, [selectedWallet]);

  useEffect(() => {
    if (fromToken && toToken && amount) {
      getQuoteAndFees();
    }
  }, [fromToken, toToken, amount, slippage]);

  useEffect(() => {
    // Check if amount exceeds balance
    if (fromToken && amount) {
      try {
        const balance = fromToken?.balance_formatted ? parseFloat(fromToken.balance_formatted.replace(/,/g, '')) : 0;
        const inputAmount = parseFloat(amount);
        setIsInsufficientBalance(!isNaN(balance) && !isNaN(inputAmount) && inputAmount > balance);
      } catch (error) {
        console.error('余额检查错误:', error);
        setIsInsufficientBalance(false);
      }
    } else {
      setIsInsufficientBalance(false);
    }
  }, [fromToken, amount]);

  useEffect(() => {
    if (quote) {
      // 直接使用 price_impact
      const impact = parseFloat(quote.price_impact || 0);
      console.log('价格影响数据:', {
        原始price_impact: quote.price_impact,
        解析后的impact: impact,
        当前priceChange: impact
      });
      setPriceChange(impact); // 直接使用 impact，不再取反
    }
  }, [quote]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserTokens();
    setIsRefreshing(false);
  };

  const loadUserTokens = async () => {
    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      
      console.log('加载用户代币列表:', {
        walletId: selectedWallet.id,
        deviceId
      });
      
      const response = await api.getTokensManagement(
        selectedWallet.id,
        deviceId,
        selectedWallet.chain
      );
      
      if (response?.status === 'success' && response.data?.data?.tokens) {
        const visibleTokens = response.data.data.tokens.filter(token => token.is_visible);
        console.log('用户代币列表加载成功:', {
          总数量: response.data.data.tokens.length,
          可见代币: visibleTokens.length,
          代币列表: visibleTokens.map(t => ({
            符号: t.symbol,
            余额: t.balance_formatted,
            精度: t.decimals
          }))
        });
        
        setUserTokens(visibleTokens);

        // Find SOL token
        const solToken = visibleTokens.find(token => 
          token.symbol === 'SOL' || 
          token.token_address === 'So11111111111111111111111111111111111111112'
        );

        // If SOL token is found and no payment token is selected, set it as default
        if (solToken && !fromToken) {
          setFromToken(solToken);
        }

        // If current selected token is not in visible list, clear selection
        if (fromToken && !visibleTokens.find(t => t.token_address === fromToken.token_address)) {
          setFromToken(null);
        }
        if (toToken && !visibleTokens.find(t => t.token_address === toToken.token_address)) {
          setToToken(null);
        }
      }
    } catch (error) {
      console.error('加载用户代币列表失败:', error);
      Alert.alert('Error', 'Failed to load token list');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSwapTokens = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.getSolanaSwapTokens(
        deviceId,
        selectedWallet.id
      );
      
      if (response?.status === 'success' && response.data?.tokens) {
        setSwapTokens(response.data.tokens);

        // Find USDC token
        const usdcToken = response.data.tokens.find(token => 
          token.symbol === 'USDC' || 
          token.token_address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        );

        // If USDC token is found and no receive token is selected, set it as default
        if (usdcToken && !toToken) {
          setToToken(usdcToken);
        }
      }
    } catch (error) {
      console.error('Failed to load swap tokens:', error);
    }
  };

  const handleAmountChange = (value) => {
    // 如果输入值为空或undefined，直接设置为空字符串并清空报价
    if (!value) {
      setAmount('');
      setQuote(null);
      setFees(null);
      return;
    }
    
    // 移除所有非数字和小数点字符
    value = value.replace(/[^0-9.]/g, '');
    
    // 确保只有一个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts[1];
    }
    
    // 限制小数位数
    if (parts.length === 2) {
      const maxDecimals = fromToken?.decimals || 9;
      if (parts[1].length > maxDecimals) {
        parts[1] = parts[1].slice(0, maxDecimals);
        value = parts[0] + '.' + parts[1];
      }
    }

    // 如果以小数点开始，在前面添加0
    if (value.startsWith('.')) {
      value = '0' + value;
    }

    // 如果是空字符串或只有小数点，设置为空并清空报价
    if (value === '' || value === '.') {
      value = '';
      setQuote(null);
      setFees(null);
      return;
    }

    // 移除前导零，但保留小数点后的零
    if (value.includes('.')) {
      const [integerPart, decimalPart] = value.split('.');
      // 如果整数部分是0或一系列0，保留一个0
      const formattedIntegerPart = /^0+$/.test(integerPart) ? '0' : integerPart.replace(/^0+/, '') || '0';
      value = formattedIntegerPart + '.' + decimalPart;
    } else {
      // 如果没有小数点，移除所有前导零
      value = value.replace(/^0+/, '') || '0';
    }

    // 打印日志以便调试
    console.log('金额输入处理:', {
      原始输入: value,
      代币: fromToken?.symbol,
      代币精度: fromToken?.decimals,
      处理后金额: value,
      整数部分: value.split('.')[0],
      小数部分: value.split('.')[1] || ''
    });

    setAmount(value);
  };

  const getQuoteAndFees = async () => {
    try {
      if (!fromToken || !toToken || !amount) {
        setQuote(null);
        setFees(null);
        return;
      }

      setIsQuoteLoading(true);
      const deviceId = await DeviceManager.getDeviceId();
      
      // 移除千分位分隔符，直接使用原始金额
      const cleanAmount = amount.replace(/,/g, '');
      
      console.log('发送兑换请求:', {
        fromToken: fromToken.symbol,
        fromTokenDecimals: fromToken.decimals,
        toToken: toToken.symbol,
        toTokenDecimals: toToken.decimals,
        amount: cleanAmount
      });

      // 使用 api.getSolanaSwapQuote 替代 api.get
      const response = await api.getSolanaSwapQuote(
        deviceId,
        selectedWallet.id,
        {
          from_token: fromToken.token_address || fromToken.address,
          to_token: toToken.token_address || toToken.address,
          amount: cleanAmount,
          slippage: slippage
        }
      );

      if (response?.status === 'success') {
        const quoteData = response.data;
        console.log('兑换报价结果:', {
          inputAmount: quoteData.from_token.amount,
          outputAmount: quoteData.to_token.amount,
          fromTokenDecimals: fromToken.decimals,
          toTokenDecimals: toToken.decimals,
          displayInputAmount: formatTokenAmount(quoteData.from_token.amount, fromToken.decimals),
          displayOutputAmount: formatTokenAmount(quoteData.to_token.amount, toToken.decimals)
        });
        
        setQuote(quoteData);
        setFees(quoteData.fees);
      } else {
        console.error('获取兑换报价失败:', response);
        Alert.alert('提示', '获取兑换报价失败，请重试');
        setQuote(null);
        setFees(null);
      }
    } catch (error) {
      console.error('获取兑换报价出错:', error);
      Alert.alert('提示', '获取兑换报价失败，请重试');
      setQuote(null);
      setFees(null);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  const handleSwapTokens = async () => {
    if (!fromToken || !toToken) return;

    try {
      // 保存当前选中的代币地址
      const fromTokenAddress = fromToken?.token_address || fromToken?.address;
      const toTokenAddress = toToken?.token_address || toToken?.address;
      
      // 重新加载用户代币列表和交换代币列表以获取最新余额
      await Promise.all([
        loadUserTokens(),
        loadSwapTokens()
      ]);
      
      // 从最新加载的列表中查找代币
      const newFromToken = swapTokens.find(t => 
        (t.token_address === toTokenAddress) || (t.address === toTokenAddress)
      );
      const newToToken = userTokens.find(t => 
        (t.token_address === fromTokenAddress) || (t.address === fromTokenAddress)
      );

      console.log('切换代币:', {
        原from代币: fromToken.symbol,
        原to代币: toToken.symbol,
        新from代币: newFromToken?.symbol,
        新to代币: newToToken?.symbol,
        新from代币余额: newFromToken?.balance_formatted,
        新to代币余额: newToToken?.balance_formatted
      });

      if (newFromToken && newToToken) {
        setFromToken(newFromToken);
        setToToken(newToToken);
        setAmount('');
        setQuote(null);
        setFees(null);
      } else {
        console.error('切换代币时未找到对应的代币信息:', {
          fromTokenAddress,
          toTokenAddress,
          userTokens: userTokens.map(t => ({
            symbol: t.symbol,
            address: t.token_address || t.address
          })),
          swapTokens: swapTokens.map(t => ({
            symbol: t.symbol,
            address: t.token_address || t.address
          }))
        });
      }
    } catch (error) {
      console.error('切换代币失败:', error);
      Alert.alert('提示', '切换代币失败，请重试');
    }
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount || !quote) {
      Alert.alert('提示', '请填写完整的兑换信息');
      return;
    }

    // 检查余额是否足够
    const balance = fromToken?.balance_formatted ? parseFloat(fromToken.balance_formatted.replace(/,/g, '')) : 0;
    const inputAmount = parseFloat(amount);
    
    if (isNaN(balance) || isNaN(inputAmount) || inputAmount > balance) {
      Alert.alert('提示', '余额不足');
      return;
    }

    try {
      setIsLoading(true);
      const deviceId = await DeviceManager.getDeviceId();

      // 确保代币地址的一致性
      const fromTokenAddress = fromToken.token_address || fromToken.address;
      const toTokenAddress = toToken.token_address || toToken.address;

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('代币地址不能为空');
      }

      // Navigate directly to payment password screen
      navigation.navigate('PaymentPassword', {
        transactionType: 'swap',
        transactionData: {
          quote_id: quote.quote_id,
          from_token: fromTokenAddress,
          to_token: toTokenAddress,
          amount: amount,
          slippage: slippage.toString(),
          deviceId,
          walletId: selectedWallet.id,
          chain: selectedWallet.chain,
          fromSymbol: fromToken.symbol,
          toSymbol: toToken.symbol,
          fromAmount: amount,
          toAmount: formatTokenAmount(quote.to_token.amount, toToken.decimals),
          fromToken: {
            ...fromToken,
            address: fromTokenAddress  // 确保 address 字段存在
          },
          toToken: {
            ...toToken,
            address: toTokenAddress    // 确保 address 字段存在
          },
          selectedWallet
        },
        onSuccess: (password) => {
          navigation.navigate('TransactionLoading', {
            transactionType: 'swap',
            fromToken: {
              ...fromToken,
              address: fromTokenAddress
            },
            toToken: {
              ...toToken,
              address: toTokenAddress
            },
            amount: amount,
            quote: quote.quote_id,
            slippage: slippage.toString(),
            deviceId,
            walletId: selectedWallet.id,
            chain: selectedWallet.chain,
            fromSymbol: fromToken.symbol,
            toSymbol: toToken.symbol,
            fromAmount: amount,
            toAmount: formatTokenAmount(quote.to_token.amount, toToken.decimals),
            payment_password: password,
            selectedWallet,
            onConfirmed: () => {
              // Reset form after successful swap
              setAmount('');
              setQuote(null);
              setFees(null);
              // Refresh token list and balances
              loadUserTokens();
            }
          });
        }
      });
    } catch (error) {
      console.error('Swap failed:', error);
      Alert.alert('提示', error.message || '兑换失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlippageChange = (newSlippage) => {
    setSlippage(newSlippage);
  };

  const handleTokenSelect = (type) => {
    navigation.navigate('TokenSelect', {
      tokens: type === 'from' ? userTokens : swapTokens,
      type,
      onSelect: (selectedToken) => {
        // 验证代币数据的完整性
        if (!selectedToken.decimals && selectedToken.decimals !== 0) {
          console.error('选择的代币缺少精度信息:', selectedToken);
          Alert.alert('提示', '代币数据不完整，请选择其他代币');
          return;
        }

        console.log('选择代币:', {
          类型: type,
          代币: selectedToken.symbol,
          精度: selectedToken.decimals,
          地址: selectedToken.token_address || selectedToken.address
        });

        if (type === 'from') {
          setFromToken(selectedToken);
          // 清空金额，因为代币改变后精度可能不同
          setAmount('');
          setQuote(null);
          setFees(null);
        } else {
          setToToken(selectedToken);
        }
      }
    });
  };

  const calculateExchangeRate = (quote, fromToken, toToken) => {
    if (!quote || !fromToken || !toToken || !fromToken.decimals || !toToken.decimals) return null;
    
    const fromAmount = Number(quote.from_token.amount) / Math.pow(10, fromToken.decimals);
    const toAmount = Number(quote.to_token.amount) / Math.pow(10, toToken.decimals);
    
    if (fromAmount <= 0) return null;
    
    const rate = toAmount / fromAmount;
    
    // 根据汇率值大小动态调整显示精度
    let displayDecimals;
    if (rate >= 1000000) {
      displayDecimals = 0;
    } else if (rate >= 1) {
      displayDecimals = 2;
    } else if (rate >= 0.01) {
      displayDecimals = 4;
    } else {
      displayDecimals = 6;
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
      useGrouping: true
    }).format(rate);
  };

  const formatPriceImpact = (impact) => {
    const num = Number(impact);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getBackgroundColor = () => {
    if (!fromToken) return { backgroundColor: '#1B2C41' };
    
    console.log('开始计算背景色:', {
      代币: fromToken.symbol,
      '24小时涨跌幅': fromToken.price_change_24h
    });
    
    // 使用和首页完全一样的逻辑
    if (fromToken.price_change_24h >= 0) {
      console.log('判断结果：24小时价格持平或上涨，使用默认蓝色背景');
      return {
        backgroundColor: '#1B2C41'  // 默认蓝色背景
      };
    } else {
      console.log('判断结果：24小时价格下跌，使用紫色背景');
      return {
        backgroundColor: '#2C2941'  // 紫色背景
      };
    }
  };

  const renderTokenSelector = (token, type, label) => (
    <View>
      <Text style={styles.sectionTitle}>
        {type === 'from' ? 'From' : 'To'}
      </Text>
      <TouchableOpacity 
        style={[
          styles.tokenSelector,
          {
            backgroundColor: fromToken?.price_change_24h >= 0 ? '#1E2338' : '#282541'
          }
        ]}
        onPress={() => handleTokenSelect(type)}
      >
        {token ? (
          <>
            <Image 
              source={{ uri: token.logo }} 
              style={styles.tokenLogo} 
              defaultSource={require('../../../assets/default-token.png')}
            />
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
              <Text style={styles.tokenBalance}>
                {type === 'from' 
                  ? `Balance: ${token?.balance_formatted || '0'}`
                  : isQuoteLoading 
                    ? <SkeletonLoader width={120} height={16} style={{ marginTop: 2 }} />
                    : quote && toToken
                      ? `Estimated: ${formatTokenAmount(quote.to_token.amount, toToken.decimals)}`
                      : ''
                }
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.selectTokenText}>Select {label}</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#8E8E8E" />
      </TouchableOpacity>
      {type === 'from' && (
        <>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#8E8E8E"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>
          {fromToken && (
            <View style={styles.amountButtonsContainer}>
              <TouchableOpacity
                style={styles.amountButton}
                onPress={() => {
                  if (fromToken?.balance_formatted) {
                    const balance = parseFloat(fromToken.balance_formatted.replace(/,/g, ''));
                    setAmount((balance * 0.25).toString());
                  }
                }}
              >
                <Text style={styles.amountButtonText}>MIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.amountButton}
                onPress={() => {
                  if (fromToken?.balance_formatted) {
                    const balance = parseFloat(fromToken.balance_formatted.replace(/,/g, ''));
                    setAmount((balance * 0.5).toString());
                  }
                }}
              >
                <Text style={styles.amountButtonText}>HALF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.amountButton}
                onPress={() => {
                  if (fromToken?.balance_formatted) {
                    const maxAmount = fromToken.balance_formatted.replace(/,/g, '');
                    setAmount(maxAmount);
                  }
                }}
              >
                <Text style={styles.amountButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderSwapButton = () => {
    const isDisabled = !fromToken || !toToken || !amount || isLoading || isInsufficientBalance;
    
    return (
      <TouchableOpacity
        style={[
          styles.swapButton,
          isDisabled && styles.swapButtonDisabled,
          isInsufficientBalance && styles.swapButtonWarning
        ]}
        onPress={handleSwap}
        disabled={isDisabled}
      >
        <LinearGradient
          colors={isInsufficientBalance ? ['#FFB236', '#FF9500'] : ['#1FC595', '#17A982']}
          style={styles.swapButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.swapButtonText}>
              {isInsufficientBalance ? 'Insufficient Balance' : 'Swap'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
      <View style={[
        styles.safeArea,
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 }
      ]}>
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
              style={styles.slippageButton}
              onPress={() => setIsSlippageModalVisible(true)}
            >
              <Text style={styles.slippageText}>{slippage}%</Text>
              <Ionicons name="settings-outline" size={16} color="#8E8E8E" style={styles.slippageIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          <ScrollView 
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1FC595"
                colors={['#1FC595']}
              />
            }
          >
            <View style={styles.swapCardContainer}>
              <View style={[styles.swapCard, {
                backgroundColor: fromToken?.price_change_24h >= 0 ? '#1C2135' : '#2C2941'
              }]}>
                {renderTokenSelector(fromToken, 'from', 'Payment Token')}
              </View>

              <View style={[styles.swapCard, {
                backgroundColor: fromToken?.price_change_24h >= 0 ? '#1C2135' : '#2C2941'
              }]}>
                {renderTokenSelector(toToken, 'to', 'Receive Token')}
              </View>

              <TouchableOpacity 
                style={[
                  styles.switchButton,
                  {
                    borderColor: fromToken?.price_change_24h >= 0 
                      ? 'rgba(28, 33, 53, 0.3)' 
                      : 'rgba(26, 28, 51, 0.9)'
                  }
                ]}
                onPress={handleSwapTokens}
              >
                <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.swapCard, styles.detailsCard, {
              backgroundColor: fromToken?.price_change_24h >= 0 ? '#1C2135' : '#2C2941'
            }]}>
              <QuoteDetails 
                quote={quote}
                fees={fees}
                toToken={toToken}
                fromToken={fromToken}
                isQuoteLoading={isQuoteLoading}
                calculateExchangeRate={calculateExchangeRate}
                formatTokenAmount={formatTokenAmount}
                formatPriceImpact={formatPriceImpact}
              />
            </View>
          </ScrollView>
          
          <View style={styles.bottomContainer}>
            {renderSwapButton()}
          </View>
        </View>
      </View>

      <SlippageSettingModal
        visible={isSlippageModalVisible}
        onClose={() => setIsSlippageModalVisible(false)}
        currentSlippage={slippage}
        onConfirm={handleSlippageChange}
      />
    </SafeAreaView>
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
  },
  safeArea: {
    flex: 1,
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
  slippageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  slippageText: {
    color: '#1FC595',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  slippageIcon: {
    marginLeft: 2,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    marginBottom: 80, // 为底部按钮留出空间
  },
  swapCardContainer: {
    position: 'relative',
    paddingTop: 20,
    marginHorizontal: 16,
  },
  swapCard: {
    backgroundColor: '#171C32',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailsCard: {
    marginHorizontal: 16,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  tokenLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenBalance: {
    color: '#8E8E8E',
    fontSize: 12,
  },
  selectTokenText: {
    color: '#8E8E8E',
    fontSize: 16,
  },
  amountInputContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    width: '100%',
  },
  amountInput: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '500',
    textAlign: 'right',
    width: '100%',
    padding: 0,
  },
  amountButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  amountButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    minWidth: 60,
    alignItems: 'center',
  },
  amountButtonText: {
    color: '#1FC595',
    fontSize: 12,
    fontWeight: '600',
  },
  switchButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 36,
    height: 36,
    backgroundColor: '#171C32',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    marginTop: 50,
    left: '50%',
    marginLeft: -18,
    zIndex: 1,
    borderWidth: 3,
  },
  detailsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
    position: 'relative',
    zIndex: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  detailLabel: {
    color: '#8E8E8E',
    fontSize: 14,
    flex: 1,
  },
  detailValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
    minHeight: 24,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
    marginRight: 4,
    minHeight: 20,
    lineHeight: 20,
  },
  detailValueWarning: {
    color: '#FF9500',
  },
  detailUnit: {
    color: '#8E8E8E',
    fontSize: 13,
    minWidth: 35,
    textAlign: 'right',
    minHeight: 16,
    lineHeight: 16,
  },
  detailUnitWrapper: {
    minWidth: 35,
    alignItems: 'flex-end',
  },
  quoteLoader: {
    marginLeft: 8,
  },
  swapButton: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  swapButtonGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  swapButtonDisabled: {
    opacity: 0.5,
  },
  swapButtonWarning: {
    backgroundColor: '#FF9500',
  },
  swapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  slippageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2338',
    padding: 8,
    borderRadius: 8,
  },
  multilineValueContainer: {
    alignItems: 'flex-end',
  },
  multilineValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  tokenSymbolText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  sectionTitle: {
    color: '#8E8E8E',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#171C32',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  detailsInner: {
    padding: 8,
  },
  detailSkeleton: {
    marginRight: 4,
  },
});

export default SwapScreen;

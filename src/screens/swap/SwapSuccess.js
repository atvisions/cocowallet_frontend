import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../../contexts/WalletContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SwapSuccess = ({ navigation, route }) => {
  const { backgroundGradient } = useWallet();
  const insets = useSafeAreaInsets();
  const {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    fromSymbol,
    toSymbol,
    transactionData,
  } = route.params;

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleDone = () => {
    navigation.navigate('MainStack', { screen: 'Swap' });
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
      <View style={[styles.content, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#1FC595" />
          </View>
          <Text style={styles.title}>Swap Successful</Text>
          <Text style={styles.description}>
            You have successfully swapped {fromAmount} {fromSymbol} to {toAmount} {toSymbol}
          </Text>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Hash</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                {transactionData?.transaction_hash || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>
                {transactionData?.fee || '0'} SOL
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={handleViewHistory}
          >
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <LinearGradient
              colors={['#1FC595', '#17A982']}
              style={styles.doneButtonGradient}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#8E8E8E',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsSection: {
    backgroundColor: '#1B2C41',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    maxWidth: '60%',
  },
  footer: {
    marginTop: 'auto',
    gap: 12,
  },
  historyButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1B2C41',
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#1FC595',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SwapSuccess; 
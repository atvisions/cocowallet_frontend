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

const SwapFailed = ({ navigation, route }) => {
  const { backgroundGradient } = useWallet();
  const insets = useSafeAreaInsets();
  const {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    fromSymbol,
    toSymbol,
    error,
  } = route.params;

  const handleTryAgain = () => {
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
        <View style={styles.failedContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={80} color="#FF4B55" />
          </View>
          <Text style={styles.title}>Swap Failed</Text>
          <Text style={styles.description}>
            Failed to swap {fromAmount} {fromSymbol} to {toAmount} {toSymbol}
          </Text>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Error</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {error || 'Unknown error occurred'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={handleTryAgain}
          >
            <LinearGradient
              colors={['#1FC595', '#17A982']}
              style={styles.tryAgainButtonGradient}
            >
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
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
  failedContainer: {
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
    flexDirection: 'column',
    gap: 8,
  },
  detailLabel: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  detailValue: {
    color: '#FF4B55',
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
  },
  tryAgainButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tryAgainButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SwapFailed; 
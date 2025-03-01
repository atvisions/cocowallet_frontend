import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatAddress } from '../../utils/format';

export default function TransactionSuccessScreen({ route, navigation }) {
  const { hash, amount, token, recipientAddress } = route.params;

  const handleDone = () => {
    navigation.navigate('Tabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#1FC595" />
        </View>

        <Text style={styles.title}>Transaction Successful</Text>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{amount}</Text>
          <Text style={styles.tokenSymbol}>{token}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>{formatAddress(recipientAddress)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hash:</Text>
            <Text style={styles.detailValue}>{formatAddress(hash)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  amountText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tokenSymbol: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 8,
  },
  detailsContainer: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    color: '#8E8E8E',
    fontSize: 16,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
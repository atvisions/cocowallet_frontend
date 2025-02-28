import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TokenSelectorModal({
  visible,
  onClose,
  onSelect,
  selectedToken,
  tokens = [],
  isLoading = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState(tokens);

  useEffect(() => {
    setFilteredTokens(tokens);
  }, [tokens]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = tokens.filter(token =>
      token.symbol.toLowerCase().includes(query.toLowerCase()) ||
      token.name?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTokens(filtered);
  };

  const renderTokenItem = ({ item }) => {
    const isSelected = selectedToken?.address === item.address;
    return (
      <TouchableOpacity
        style={[styles.tokenItem, isSelected && styles.selectedTokenItem]}
        onPress={() => onSelect(item)}
      >
        <Image
          source={{ uri: item.logo || 'https://example.com/default-token.png' }}
          style={styles.tokenLogo}
        />
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
          <Text style={styles.tokenBalance}>
            {Number(item.balance_formatted || 0).toFixed(4)}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#1FC595" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>选择代币</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E8E" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索代币"
              placeholderTextColor="#8E8E8E"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1FC595" />
            </View>
          ) : (
            <FlatList
              data={filteredTokens}
              renderItem={renderTokenItem}
              keyExtractor={item => item.address}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#171C32',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C52',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectedTokenItem: {
    borderColor: '#1FC595',
    borderWidth: 1,
  },
  tokenLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenBalance: {
    color: '#8E8E8E',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
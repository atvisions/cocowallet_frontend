import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';

export default function VerifyMnemonic({ navigation, route }) {
  const { mnemonic, chain, deviceId } = route.params;
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);

  useEffect(() => {
    // 打乱助记词顺序
    const words = mnemonic.split(' ').sort(() => Math.random() - 0.5);
    setAvailableWords(words);
  }, []);

  const handleSelectWord = (word, index) => {
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const handleRemoveWord = (word, index) => {
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
    setAvailableWords([...availableWords, word]);
  };

  const handleVerify = async () => {
    const verifyMnemonic = selectedWords.join(' ');
    if (verifyMnemonic !== mnemonic) {
      Alert.alert('Error', 'The backup phrase is incorrect. Please try again.');
      return;
    }

    try {
      await api.verifyMnemonic(deviceId, chain, mnemonic);
      // 设置钱包创建状态
      await DeviceManager.setWalletCreated(true);
      // 直接跳转到钱包首页
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', 'Failed to verify mnemonic');
    }
  };

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
          <Text style={styles.headerTitle}>Verify Backup Phrase</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Backup Phrase</Text>
          <Text style={styles.subtitle}>
            Select the words in the correct order to verify your backup phrase.
          </Text>

          <View style={styles.selectedContainer}>
            {Array(12).fill(0).map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.wordBox, selectedWords[index] && styles.wordBoxFilled]}
                onPress={() => selectedWords[index] && handleRemoveWord(selectedWords[index], index)}
              >
                <Text style={styles.wordText}>
                  {selectedWords[index] || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.availableContainer}>
            {availableWords.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={styles.wordButton}
                onPress={() => handleSelectWord(word, index)}
              >
                <Text style={styles.wordButtonText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[
              styles.button,
              selectedWords.length === 12 ? styles.buttonEnabled : styles.buttonDisabled
            ]}
            onPress={handleVerify}
            disabled={selectedWords.length !== 12}
          >
            <Text style={styles.buttonText}>Verify</Text>
          </TouchableOpacity>
        </View>
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
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  wordBox: {
    width: '30%',
    height: 44,
    backgroundColor: '#272C52',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  wordBoxFilled: {
    backgroundColor: '#1FC595',
  },
  wordText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  availableContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  wordButton: {
    backgroundColor: '#272C52',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 5,
  },
  wordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonEnabled: {
    backgroundColor: '#1FC595',
  },
  buttonDisabled: {
    backgroundColor: '#272C52',
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
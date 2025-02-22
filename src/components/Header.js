import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title, onBack, rightIcon, onRightPress }) {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {rightIcon ? (
        <TouchableOpacity 
          style={styles.rightButton}
          onPress={onRightPress}
        >
          <Ionicons name={rightIcon} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : <View style={styles.rightButton} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 56,
    marginTop: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight + 12,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rightButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header({ title, onBack, rightComponent }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container,
      { 
        paddingTop: Platform.OS === 'ios' 
          ? Math.max(insets.top - 20, 0)  // 增加到减少20的顶部间距
          : Math.max(StatusBar.currentHeight - 20, 0)  // 增加到减少20的顶部间距
      }
    ]}>
      <View style={styles.content}>
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        {rightComponent && (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#171C32',
  },
  content: {
    height: 44,  // 进一步减小高度
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rightComponent: {
    marginLeft: 8,
  },
}); 
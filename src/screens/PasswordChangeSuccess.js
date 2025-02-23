import React, { useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordChangeSuccess({ navigation, route }) {
  const isChange = route.params?.isChange;  // 是否是修改密码

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Settings');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#1FC595" />
        </View>
        <Text style={styles.title}>Success</Text>
        <Text style={styles.description}>
          {isChange ? 'Password changed successfully' : 'Payment password set successfully'}
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
  },
}); 
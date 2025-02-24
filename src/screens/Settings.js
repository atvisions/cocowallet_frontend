import React, { useEffect } from 'react';
import { CommonActions } from '@react-navigation/native';
import { useWalletNavigation } from '../hooks/useWalletNavigation';

export default function SettingsScreen({ navigation }) {
  useWalletNavigation(navigation);
  // ... 其他代码保持不变 ...
} 
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native/Libraries/Animated/Animated';

import WalletScreen from '../screens/tabs/WalletScreen';
import NFTScreen from '../screens/tabs/NFTScreen';
import SwapScreen from '../screens/tabs/SwapScreen';
import HistoryScreen from '../screens/tabs/HistoryScreen';
import DiscoverScreen from '../screens/tabs/DiscoverScreen';
import WalletSelector from '../screens/wallet/WalletSelector';
import EditWallet from '../screens/wallet/EditWallet';
import ShowPrivateKey from '../screens/wallet/ShowPrivateKey';
import TokenManagement from '../screens/TokenManagement';
import RenameWallet from '../screens/wallet/RenameWallet';
import DeleteWallet from '../screens/wallet/DeleteWallet';
import PaymentPasswordScreen from '../screens/wallet/PaymentPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const animatedValues = React.useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  const handlePress = (index, onPress) => {
    console.log('Tab pressed:', state.routes[index].name);
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValues[index], {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();

    onPress();
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#171C32' }}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName;
          switch (route.name) {
            case 'Wallet':
              iconName = isFocused ? 'wallet' : 'wallet-outline';
              break;
            case 'NFT':
              iconName = isFocused ? 'grid' : 'grid-outline';
              break;
            case 'Swap':
              iconName = isFocused ? 'swap-horizontal' : 'swap-horizontal-outline';
              break;
            case 'History':
              iconName = isFocused ? 'time' : 'time-outline';
              break;
            case 'Discover':
              iconName = isFocused ? 'compass' : 'compass-outline';
              break;
          }

          return (
            <Animated.View 
              key={route.key} 
              style={[
                styles.tabItem,
                { transform: [{ scale: animatedValues[index] }] }
              ]}
            >
              <TouchableOpacity
                onPress={() => handlePress(index, onPress)}
                style={styles.tabButton}
              >
                <Ionicons
                  name={iconName}
                  size={26}
                  color={isFocused ? '#1FC595' : '#8E8E8E'}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function TabScreens() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="NFT" component={NFTScreen} />
      <Tab.Screen name="Swap" component={SwapScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Tabs" component={TabScreens} />
      <Stack.Screen name="WalletSelector" component={WalletSelector} />
      <Stack.Screen name="EditWallet" component={EditWallet} />
      <Stack.Screen name="ShowPrivateKey" component={ShowPrivateKey} />
      <Stack.Screen name="TokenManagement" component={TokenManagement} />
      <Stack.Screen name="RenameWallet" component={RenameWallet} />
      <Stack.Screen name="DeleteWallet" component={DeleteWallet} />
      <Stack.Screen name="PaymentPasswordScreen" component={PaymentPasswordScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#272C52',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    height: Platform.OS === 'ios' ? 70 : 60,
    borderTopWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as SystemUI from 'expo-system-ui';
import { DeviceManager } from '../utils/device';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../../assets/boarding1.jpg'),
    title: 'Welcome to COCO Wallet',
    subtitle: 'Your Secure Digital Asset Manager'
  },
  {
    id: '2',
    image: require('../../assets/boarding2.jpg'),
    title: 'Safe & Reliable',
    subtitle: 'Advanced encryption and security protocols'
  },
  {
    id: '3',
    image: require('../../assets/boarding3.jpg'),
    title: 'Get Started',
    subtitle: 'Begin your crypto journey today'
  },
  {
    id: '4',
    type: 'create',
    title: 'Create Wallet',
    subtitle: 'Create a new wallet or import an existing one'
  }
];

export default function Onboarding({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    // 设置系统UI颜色
    SystemUI.setBackgroundColorAsync("#171C32");
  }, []);

  const handleCreateWallet = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const hasPassword = await DeviceManager.hasSetPassword();
      
      if (hasPassword) {
        // 如果已设置密码，直接进入选择链页面
        navigation.navigate('SelectChain', { deviceId });
      } else {
        // 如果未设置密码，进入设置密码页面
        navigation.navigate('SetPassword');
      }
    } catch (error) {
      console.error('Failed to check password status:', error);
      navigation.navigate('SetPassword');
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'create') {
      return (
        <View style={styles.slide}>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.option}
              onPress={handleCreateWallet}
            >
              <View style={styles.optionIcon}>
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Create New Wallet</Text>
                <Text style={styles.optionDescription}>
                  Create a new wallet and generate seed phrase
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.option}
              onPress={() => navigation.navigate('ImportWallet')}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="download-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Import Wallet</Text>
                <Text style={styles.optionDescription}>
                  Import your wallet using seed phrase
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.slide}>
        <Image 
          source={item.image} 
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#171C32" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/icon.png')}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>COCO Wallet</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          const x = e.nativeEvent.contentOffset.x;
          setCurrentIndex(Math.round(x / width));
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.paginationDots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentIndex ? '#1FC595' : '#272C52' }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  header: {
    width: '100%',
    paddingTop: 50,
    paddingBottom: 20,
    position: 'absolute',
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  slide: {
    width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.5,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  optionsContainer: {
    padding: 20,
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1FC595',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  }
}); 
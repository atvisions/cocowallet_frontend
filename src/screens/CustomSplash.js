import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';

export default function CustomSplash({ navigation }) {
  useEffect(() => {
    // 添加超时以确保启动页面不会一直显示
    const timer = setTimeout(() => {
      // 检查是否是首次启动，决定导航到 Onboarding 还是 MainStack
      checkFirstLaunch();
    }, 2000); // 2秒后自动跳转

    return () => clearTimeout(timer);
  }, []);

  const checkFirstLaunch = async () => {
    try {
      // 这里可以添加检查逻辑，比如检查是否有存储的钱包等
      // 暂时直接导航到 MainStack
      navigation.replace('MainStack');
    } catch (error) {
      console.error('Error during launch check:', error);
      // 发生错误时也导航到 MainStack
      navigation.replace('MainStack');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
}); 
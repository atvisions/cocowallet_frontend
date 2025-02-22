const WalletScreen = () => {
  // ... 其他状态和代码

  const handleTokenVisibilityChanged = () => {
    // 直接调用加载钱包数据的方法
    loadWalletData(); // 或者其他刷新数据的方法
  };

  const handleTokenManagementPress = () => {
    navigation.navigate('TokenManagement', {
      selectedWallet: selectedWallet,
      onTokenVisibilityChanged: handleTokenVisibilityChanged
    });
  };

  return (
    // ... 其他渲染代码
    <TouchableOpacity onPress={handleTokenManagementPress}>
      <Text>Token Management</Text>
    </TouchableOpacity>
    // ... 其他渲染代码
  );
}; 
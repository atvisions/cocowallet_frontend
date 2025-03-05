const loadTokens = async () => {
  console.log('开始加载tokens - 当前钱包:', selectedWallet?.id);
  if (!selectedWallet) {
    console.log('没有选中的钱包，停止加载');
    return;
  }
  
  const currentWalletId = selectedWallet.id;
  console.log('保存当前钱包ID:', currentWalletId);
  
  try {
    setLoading(true);
    setError(null);
    console.log('开始请求钱包tokens');
    
    const response = await api.getTokens(selectedWallet.id);
    console.log('获取tokens响应:', response);
    
    // 检查钱包是否已经改变
    if (currentWalletId !== selectedWallet?.id) {
      console.log('钱包已改变，停止更新状态', {
        currentWalletId,
        newWalletId: selectedWallet?.id
      });
      return;
    }
    
    if (response.status === 'success') {
      console.log('成功获取tokens，更新状态');
      setTokens(response.data.tokens || []);
      setTotalBalance(response.data.total_value_usd || 0);
    } else {
      console.error('无效的token响应:', response);
      setError('Failed to load tokens');
    }
  } catch (error) {
    if (currentWalletId === selectedWallet?.id) {
      console.error('加载tokens失败:', error);
      setError('Failed to load tokens');
    }
  } finally {
    if (currentWalletId === selectedWallet?.id) {
      console.log('完成tokens加载，更新loading状态');
      setLoading(false);
    }
  }
};

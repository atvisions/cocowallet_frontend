import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SlippageSettingModal = ({ visible, onClose, currentSlippage, onConfirm }) => {
  const [slippage, setSlippage] = useState(currentSlippage || '0.5');
  const [customSlippage, setCustomSlippage] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [warning, setWarning] = useState('');
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [opacityAnim] = useState(new Animated.Value(0));

  // 预设滑点选项
  const presetOptions = ['0.1', '0.5', '1.0', '2.0'];

  useEffect(() => {
    if (visible) {
      setSlippage(currentSlippage || '0.5');
      setCustomSlippage('');
      setIsCustom(!presetOptions.includes(currentSlippage));
      if (!presetOptions.includes(currentSlippage)) {
        setCustomSlippage(currentSlippage);
      }
      
      // 启动动画
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 重置动画值
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, currentSlippage]);

  useEffect(() => {
    validateSlippage();
  }, [slippage, customSlippage, isCustom]);

  const validateSlippage = () => {
    const value = isCustom ? customSlippage : slippage;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      setWarning('Please enter a valid number');
      return false;
    }
    
    if (numValue <= 0) {
      setWarning('Slippage must be greater than 0');
      return false;
    }
    
    if (numValue < 0.05) {
      setWarning('Low slippage may cause transaction failure');
      return true; // 允许但警告
    }
    
    if (numValue > 5) {
      setWarning('High slippage increases risk of price impact');
      return true; // 允许但警告
    }
    
    setWarning('');
    return true;
  };

  const handleSelectPreset = (value) => {
    setSlippage(value);
    setIsCustom(false);
    Keyboard.dismiss();
  };

  const handleCustomChange = (text) => {
    // 移除非数字字符，保留一个小数点
    let cleanedValue = text.replace(/[^\d.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 如果以小数点开始，添加前导零
    if (cleanedValue.startsWith('.')) {
      cleanedValue = '0' + cleanedValue;
    }
    
    // 限制小数位数为2位
    if (parts.length === 2 && parts[1].length > 2) {
      cleanedValue = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    setCustomSlippage(cleanedValue);
    setIsCustom(true);
  };

  const handleConfirm = () => {
    if (validateSlippage()) {
      const finalValue = isCustom ? customSlippage : slippage;
      onConfirm(finalValue);
      onClose();
    }
  };

  const handleClose = () => {
    // 执行关闭动画
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Slippage Tolerance</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#8E8E8E" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={18} color="#8E8E8E" />
                <Text style={styles.infoText}>
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </Text>
              </View>
              
              <View style={styles.optionsContainer}>
                {presetOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      slippage === option && !isCustom && styles.selectedOption
                    ]}
                    onPress={() => handleSelectPreset(option)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        slippage === option && !isCustom && styles.selectedOptionText
                      ]}
                    >
                      {option}%
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={[
                    styles.customButton,
                    isCustom && styles.selectedCustomButton
                  ]}
                  onPress={() => setIsCustom(true)}
                >
                  <Text 
                    style={[
                      styles.customButtonText,
                      isCustom && styles.selectedCustomText
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
              
              {isCustom && (
                <View style={styles.customInputWrapper}>
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Enter value"
                      placeholderTextColor="#8E8E8E"
                      keyboardType="decimal-pad"
                      value={customSlippage}
                      onChangeText={handleCustomChange}
                      onFocus={() => setIsCustom(true)}
                      maxLength={5}
                      autoFocus={true}
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                </View>
              )}
              
              {warning ? (
                <View style={styles.warningContainer}>
                  <Ionicons 
                    name="warning-outline" 
                    size={16} 
                    color={warning.includes('failure') ? "#FF9500" : "#FF3B30"} 
                  />
                  <Text style={[
                    styles.warningText,
                    { color: warning.includes('failure') ? "#FF9500" : "#FF3B30" }
                  ]}>
                    {warning}
                  </Text>
                </View>
              ) : (
                <View style={styles.warningPlaceholder} />
              )}
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <LinearGradient
                  colors={['#1FC595', '#17A982']}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: '#1A1E2E',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    width: '18%',
    backgroundColor: '#242838',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: 'rgba(31, 197, 149, 0.2)',
    borderWidth: 1,
    borderColor: '#1FC595',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#1FC595',
  },
  customButton: {
    width: '22%',
    backgroundColor: '#242838',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCustomButton: {
    backgroundColor: 'rgba(31, 197, 149, 0.2)',
    borderWidth: 1,
    borderColor: '#1FC595',
  },
  customButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  selectedCustomText: {
    color: '#1FC595',
  },
  customInputWrapper: {
    marginBottom: 16,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242838',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  customInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  percentSign: {
    color: '#8E8E8E',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  warningPlaceholder: {
    height: 20,
    marginBottom: 20,
  },
  warningText: {
    marginLeft: 6,
    fontSize: 13,
    flex: 1,
  },
  confirmButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SlippageSettingModal; 
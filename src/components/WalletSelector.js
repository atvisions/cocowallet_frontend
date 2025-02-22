import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  Animated,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { DeviceManager } from '../utils/device';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../contexts/WalletContext';

export default function WalletSelector({ visible, onClose, wallets, selectedWallet, onSelectWallet, onRefreshWallets }) {
  const navigation = useNavigation();
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const [isEditing, setIsEditing] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [walletToDelete, setWalletToDelete] = useState(null);
  const { updateSelectedWallet } = useWallet();

  React.useEffect(() => {
    if (visible) {
      modalOpacity.setValue(0);
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleEditName = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      await api.renameWallet(editingWallet.id, deviceId, newWalletName);
      onRefreshWallets();
      setIsEditing(false);
      setEditingWallet(null);
      setNewWalletName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to rename wallet');
    }
  };

  const handleDeleteWallet = async () => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      await api.deleteWallet(walletToDelete.id, deviceId, password);
      onRefreshWallets();
      setShowPasswordModal(false);
      setWalletToDelete(null);
      setPassword('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete wallet';
      if (errorMessage.includes('password')) {
        Alert.alert('Error', 'Incorrect payment password');
      } else {
        Alert.alert('Error', errorMessage);
      }
      setPassword('');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const renderWalletItem = ({ item }) => (
    <View style={[styles.walletItem, selectedWallet?.id === item.id && styles.selectedWallet]}>
      <TouchableOpacity 
        style={styles.walletItemContent}
        onPress={() => {
          updateSelectedWallet(item);
          onSelectWallet(item);
          handleClose();
        }}
      >
        <Image source={{ uri: item.avatar }} style={styles.walletAvatar} />
        <View style={styles.walletInfo}>
          <View style={styles.walletNameContainer}>
            <Text style={styles.walletName}>{item.name}</Text>
            <Text style={styles.chainName}>{item.chain}</Text>
          </View>
          <Text style={styles.walletAddress}>{formatAddress(item.address)}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.walletActions}>
        <TouchableOpacity 
          style={styles.actionIconButton}
          onPress={() => {
            setEditingWallet(item);
            setNewWalletName(item.name);
            setIsEditing(true);
          }}
        >
          <Ionicons name="pencil" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionIconButton, styles.deleteButton]}
          onPress={() => {
            setWalletToDelete(item);
            setShowPasswordModal(true);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#FF4B55" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, { opacity: modalOpacity }]}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[styles.content, {
          transform: [{
            translateY: modalOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [300, 0]
            })
          }]
        }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Wallet</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={wallets}
            renderItem={renderWalletItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#1FC595' }]}
              onPress={() => navigation.navigate('CreateWallet')}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Create Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#272C52' }]}
              onPress={() => navigation.navigate('ImportWallet')}
            >
              <Ionicons name="download-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Import Wallet</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 编辑名称模态框 */}
        <Modal visible={isEditing} transparent animationType="fade">
          <View style={styles.editModalContainer}>
            <View style={styles.editModal}>
              <Text style={styles.editModalTitle}>Edit Wallet Name</Text>
              <TextInput
                style={styles.input}
                value={newWalletName}
                onChangeText={setNewWalletName}
                placeholder="Enter new wallet name"
                placeholderTextColor="#8E8E8E"
              />
              <View style={styles.editModalButtons}>
                <TouchableOpacity 
                  style={styles.editModalButton}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.editModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editModalButton, styles.editModalButtonConfirm]}
                  onPress={handleEditName}
                >
                  <Text style={styles.editModalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 删除钱包密码验证模态框 */}
        <Modal visible={showPasswordModal} transparent animationType="fade">
          <View style={styles.editModalContainer}>
            <View style={styles.editModal}>
              <Text style={styles.editModalTitle}>Enter Payment Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter payment password"
                placeholderTextColor="#8E8E8E"
                secureTextEntry
              />
              <View style={styles.editModalButtons}>
                <TouchableOpacity 
                  style={styles.editModalButton}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                  }}
                >
                  <Text style={styles.editModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editModalButton, styles.editModalButtonConfirm]}
                  onPress={handleDeleteWallet}
                >
                  <Text style={styles.editModalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#171C32',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    marginTop: Platform.OS === 'ios' ? 48 : 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#272C52',
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedWallet: {
    borderColor: '#1FC595',
    borderWidth: 1,
  },
  walletAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  walletInfo: {
    flex: 1,
  },
  walletNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chainName: {
    fontSize: 12,
    color: '#1FC595',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    borderRadius: 4,
  },
  walletAddress: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  walletItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    backgroundColor: '#272C52',
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#171C32',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#171C32',
    alignItems: 'center',
  },
  editModalButtonConfirm: {
    backgroundColor: '#1FC595',
  },
  editModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#171C32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 75, 85, 0.1)',
  },
}); 
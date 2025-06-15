import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';

const deleteUserData = httpsCallable(FIREBASE_FUNCTIONS, 'deleteUserData');
const getDataTypes = httpsCallable(FIREBASE_FUNCTIONS, 'getDataTypes');

export default function DeleteDataModal({ visible, onClose }) {
  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataTypes, setDataTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchDataTypes = async () => {
      try {
        setLoadingTypes(true);
        const result = await getDataTypes();
        setDataTypes(result.data.dataTypes || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to load data types. Please try again.');
        onClose();
      } finally {
        setLoadingTypes(false);
      }
    };

    if (visible) {
      fetchDataTypes();
    }
  }, [visible]);

  const toggleSelection = (id) => {
    if (selectedData.includes(id)) {
      setSelectedData(selectedData.filter(item => item !== id));
    } else {
      setSelectedData([...selectedData, id]);
    }
  };

  const handleDelete = async () => {
    if (selectedData.length === 0) {
      Alert.alert('No Data Selected', 'Please select at least one type of data to delete.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete the selected data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUserData({ collections: selectedData });
              Alert.alert('Success', 'Selected data has been deleted successfully.');
              setSelectedData([]);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loadingTypes) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Delete Data</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Select the data you want to delete. This action cannot be undone.
          </Text>

          <View style={styles.options}>
            {dataTypes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.option,
                  selectedData.includes(item.id) && styles.optionSelected,
                ]}
                onPress={() => toggleSelection(item.id)}
              >
                <View style={styles.optionContent}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={selectedData.includes(item.id) ? COLORS.white : COLORS.textDark}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedData.includes(item.id) && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                {selectedData.includes(item.id) && (
                  <Ionicons name="checkmark" size={24} color={COLORS.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              selectedData.length === 0 && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={loading || selectedData.length === 0}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                <Text style={styles.deleteButtonText}>Delete Selected Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 20,
    lineHeight: 22,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textDark,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 
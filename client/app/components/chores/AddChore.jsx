import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';

const addChore = httpsCallable(FIREBASE_FUNCTIONS, 'addChore');

const frequencies = [
  { label: 'Daily', value: 'day', icon: 'calendar-outline' },
  { label: 'Weekly', value: 'week', icon: 'calendar-outline' },
  { label: 'Monthly', value: 'month', icon: 'calendar-outline' },
  { label: 'Yearly', value: 'year', icon: 'calendar-outline' },
];

const importanceLevels = [
  { label: 'Low', value: 'low', color: COLORS.success },
  { label: 'Medium', value: 'medium', color: '#FFB800' },
  { label: 'High', value: 'high', color: COLORS.error },
];

const icons = [
  { name: 'home-outline', label: 'Home' },
  { name: 'bed-outline', label: 'Bedroom' },
  { name: 'restaurant-outline', label: 'Kitchen' },
  { name: 'shirt-outline', label: 'Laundry' },
  { name: 'trash-outline', label: 'Trash' },
  { name: 'leaf-outline', label: 'Garden' },
  { name: 'car-outline', label: 'Car' },
  { name: 'paw-outline', label: 'Pet' },
  { name: 'briefcase-outline', label: 'Work' },
  { name: 'library-outline', label: 'Study' },
  { name: 'fitness-outline', label: 'Exercise' },
  { name: 'list-outline', label: 'Other' },
];

const AddChore = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [importance, setImportance] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('list-outline');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a chore name');
      return;
    }
    if (!frequency) {
      Alert.alert('Error', 'Please select a frequency');
      return;
    }
    if (!importance) {
      Alert.alert('Error', 'Please select an importance level');
      return;
    }

    try {
      setLoading(true);
      await addChore({
        name: name.trim(),
        description: description.trim(),
        frequency,
        importance,
        icon: selectedIcon,
      });
      
      Alert.alert(
        'Success',
        'Chore added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to add chore:', error);
      Alert.alert('Error', 'Failed to add chore. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Chore</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Chore name"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an Icon</Text>
          <View style={styles.iconGrid}>
            {icons.map(icon => (
              <TouchableOpacity
                key={icon.name}
                style={[
                  styles.iconOption,
                  selectedIcon === icon.name && styles.iconOptionSelected
                ]}
                onPress={() => setSelectedIcon(icon.name)}
              >
                <View style={styles.iconContent}>
                  <Ionicons 
                    name={icon.name} 
                    size={24} 
                    color={selectedIcon === icon.name ? COLORS.primary : COLORS.textMuted} 
                  />
                  <Text style={[
                    styles.iconLabel,
                    selectedIcon === icon.name && styles.iconLabelSelected
                  ]}>
                    {icon.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.optionsContainer}>
            {frequencies.map(({ label, value, icon }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  frequency === value && styles.optionButtonActive,
                ]}
                onPress={() => setFrequency(value)}
              >
                <Ionicons 
                  name={icon} 
                  size={20} 
                  color={frequency === value ? COLORS.white : COLORS.textMuted} 
                />
                <Text
                  style={[
                    styles.optionText,
                    frequency === value && styles.optionTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Importance</Text>
          <View style={styles.optionsContainer}>
            {importanceLevels.map(({ label, value, color }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  importance === value && {
                    backgroundColor: color,
                    borderColor: color,
                  },
                ]}
                onPress={() => setImportance(value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    importance === value && styles.optionTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Chore'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  iconContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  iconOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  iconLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: COLORS.primary,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonHighActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  optionButtonMediumActive: {
    backgroundColor: '#FFB800', // Yellow color for medium importance
    borderColor: '#FFB800',
  },
  optionButtonLowActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  optionText: {
    color: COLORS.textDark,
    fontWeight: '500',
    fontSize: 13,
  },
  optionTextActive: {
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddChore; 
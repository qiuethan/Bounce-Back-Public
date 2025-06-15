import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../contexts/onboarding_provider.jsx';
import styles from '../constants/onboardingStyles.js';
import COLORS from '../constants/colors.js';

const PersonalInfoScreen = () => {
  const router = useRouter();
  const { updateProfile } = useOnboarding();

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const { finalizeOnboarding, refetchProfile  } = useOnboarding();

  const handleNext = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
  
    setError('');
    setLoading(true);
  
    try {
      await updateProfile({
        name: name.trim(),
        birthday: birthday ? birthday.toISOString().split('T')[0] : null,
      });
  
      await finalizeOnboarding({name: name.trim(), birthday: birthday ? birthday.toISOString().split('T')[0] : null});
      await refetchProfile();
  
      router.push('/(tabs)');
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable
        style={styles.container}
        onPress={() => {
          Keyboard.dismiss();
          setShowDatePicker(false);
        }}
      >
        <Text style={styles.title}>What should I call you?</Text>
        <TextInput
          style={[
            styles.input,
            name.length > 0 && styles.inputFilled, 
          ]}
          placeholder="e.g. John Doe"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.title}>When’s your birthday?</Text>
        <Text style={styles.optionalNote}>This question is optional</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: birthday ? COLORS.textDark : COLORS.textLight }}>
              {birthday ? birthday.toDateString() : 'Select a date'}
            </Text>
          </TouchableOpacity>
          {birthday && (
            <TouchableOpacity onPress={() => setBirthday(null)} style={styles.iconButton}>
              <Ionicons name="trash-outline" style={styles.clearIcon} />
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={birthday || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                if (event.type === 'set' && selectedDate) {
                  setBirthday(selectedDate);
                }
                setShowDatePicker(false);
              } else if (selectedDate) {
                setBirthday(selectedDate);
              }
            }}
          />
        )}
        

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next →</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default PersonalInfoScreen;
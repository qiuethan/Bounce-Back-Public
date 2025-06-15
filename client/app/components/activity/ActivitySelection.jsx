import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import COLORS from '../../constants/colors';

export default function ActivitySelection() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Activity</Text>
        <View style={styles.headerIconButton} />
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push('/components/activity/WorkoutTracker')}
        >
          <Ionicons name="fitness" size={48} color="white" />
          <Text style={styles.optionTitle}>Indoor Workout</Text>
          <Text style={styles.optionDescription}>Track your gym or home workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push('/components/activity/OutdoorTracker')}
        >
          <Ionicons name="walk" size={48} color="white" />
          <Text style={styles.optionTitle}>Outdoor Activity</Text>
          <Text style={styles.optionDescription}>Track your walk, run, or bike ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    backgroundColor: COLORS.white,
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
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  optionsContainer: {
    padding: 16,
    gap: 16,
  },
  option: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 12,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
}); 
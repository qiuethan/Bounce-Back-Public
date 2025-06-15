import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';

export default function ProgressIndex() {
  const router = useRouter();

  const options = [
    {
      label: 'Journal',
      icon: 'book-outline',
      route: '../components/journal/journal',
    },
    /*{
      label: 'Avoidance Zones',
      icon: 'ban-outline',
      route: '../components/avoidance-zones/avoidance',
    },*/
    {
      label: 'Support Contacts',
      icon: 'call-outline',
      route: '../components/contacts/contacts',
    },
    {
      label: 'Mood Progress',
      icon: 'happy-outline',
      route: '../components/mood-tracker/MoodTracker',
    },
    {
      label: 'Activity',
      icon: 'fitness-outline',
      route: '../components/activity/ActivityDashboard',
    },
    {
      label: 'Chore Tracker',
      icon: 'checkbox-outline',
      route: '../components/chores/ChoreTracker',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Center</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {options
          .slice()
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((option) => (
            <TouchableOpacity
              key={option.label}
              style={styles.card}
              onPress={() => router.push(option.route)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={option.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{option.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.primaryExtraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
});


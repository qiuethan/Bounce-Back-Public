import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

import { DistressModal, XPBar, Challenges, Greeting } from '../components/home';

import { useUserProfile } from '../contexts/profile_provider';
import COLORS from '../constants/colors';

const dailyChallenges = [
  { id: 1, label: "Go outside for 10 minutes", completed: false },
  { id: 2, label: "Text a friend", completed: false },
  { id: 3, label: "Write a journal entry", completed: false },
];

const hardChallenges = [
  { id: 4, label: "Call someone and open up", completed: false },
  { id: 5, label: "Spend 1 hour away from social media", completed: false },
  { id: 6, label: "Go to a support group or therapy", completed: false },
];

const Home = () => {
  const [showDistressModal, setShowDistressModal] = useState(false);
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.homeHeader}>
          <XPBar currentXP={120} maxXP={200} />
          <TouchableOpacity
            style={styles.distressButton}
            onPress={() => setShowDistressModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.distressText}>😔 I'm Not Okay</Text>
          </TouchableOpacity>
        </View>

        <Greeting name={profile?.name} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>✅ Daily Boost</Text>
          <Challenges title="" initial={dailyChallenges} />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🔥 Deeper Growth</Text>
          <Challenges title="" initial={hardChallenges} />
        </View>
      </ScrollView>

      <DistressModal visible={showDistressModal} onClose={() => setShowDistressModal(false)} />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    flexGrow: 1,
    paddingBottom: 24,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  distressButton: {
    backgroundColor: COLORS.error,
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  distressText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

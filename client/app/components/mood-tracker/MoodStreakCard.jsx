import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const calculateMoodStreak = (entries) => {
  if (!entries.length) return { streak: 0, status: "no-data" };

  const dateSet = new Set(
    entries.map(e => {
      const date = new Date(e.timestamp);
      date.setHours(0, 0, 0, 0);
      return date.toDateString();
    })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const hasToday = dateSet.has(today.toDateString());
  const hasYesterday = dateSet.has(yesterday.toDateString());

  // Find the most recent entry date
  let mostRecentDate = hasToday ? today : hasYesterday ? yesterday : null;
  if (!mostRecentDate) {
    return { streak: 0, status: "broken" };
  }

  // Count streak starting from most recent entry
  let streak = 0;
  let current = new Date(mostRecentDate);

  while (dateSet.has(current.toDateString())) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  if (hasToday) {
    return { streak, status: "active" };
  } else if (hasYesterday) {
    return { streak, status: "expiring-soon" };
  } else {
    return { streak: 0, status: "broken" };
  }
};

const MoodStreakCard = ({ moodEntries = [], goal = 7 }) => {
  const { streak, status } = calculateMoodStreak(moodEntries);
  const completed = Math.min(streak, goal);
  const percentage = Math.round((completed / goal) * 100);

  const getStreakText = () => {
    if (status === "expiring-soon") {
      return (
        <View style={styles.streakTextContainer}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
          <View style={styles.expiringBadge}>
            <Text style={styles.expiringText}>Expiring Soon!</Text>
          </View>
        </View>
      );
    }
    if (status === "broken") {
      return (
        <View style={styles.streakTextContainer}>
          <Text style={[styles.streakNumber, styles.streakBroken]}>0</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      );
    }
    return (
      <View style={styles.streakTextContainer}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="flame" size={24} color={COLORS.primary} />
          <Text style={styles.title}>Mood Streak</Text>
        </View>
      </View>
      {getStreakText()}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${percentage}%` },
              status === "broken" && styles.progressBarBroken
            ]} 
          />
        </View>
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>Weekly Goal: {completed}/{goal} days</Text>
          {completed >= goal && (
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          )}
        </View>
      </View>
    </View>
  );
};

export default MoodStreakCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  streakTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 8,
  },
  streakBroken: {
    color: COLORS.textMuted,
  },
  streakLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  expiringBadge: {
    backgroundColor: COLORS.caution,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  expiringText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressBarBroken: {
    backgroundColor: COLORS.textMuted,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

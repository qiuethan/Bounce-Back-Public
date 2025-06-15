import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import COLORS from "../../constants/colors";

const moodLabels = {
  "😭": "Very Sad",
  "😔": "Sad",
  "😐": "Neutral",
  "🙂": "Content",
  "😄": "Happy",
};

const moodColors = {
  "😭": "#FF6B6B",  // Red
  "😔": "#FFA06B",  // Orange
  "😐": "#FFD93D",  // Yellow
  "🙂": "#6BCB77",  // Light green
  "😄": "#4D96FF",  // Blue
};

const timeRanges = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

const getFilteredEntries = (entries, range) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case "day":
      return entries.filter(entry => new Date(entry.timestamp) >= today);
    case "week":
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entries.filter(entry => new Date(entry.timestamp) >= weekAgo);
    case "month":
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return entries.filter(entry => new Date(entry.timestamp) >= monthAgo);
    case "year":
      const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      return entries.filter(entry => new Date(entry.timestamp) >= yearAgo);
    default:
      return entries;
  }
};

const getMoodEmoji = (value) => {
  if (value <= 1.25) return "😭";
  if (value <= 1.75) return "😭/😔";
  if (value <= 2.25) return "😔";
  if (value <= 2.75) return "😔/😐";
  if (value <= 3.25) return "😐";
  if (value <= 3.75) return "😐/🙂";
  if (value <= 4.25) return "🙂";
  if (value <= 4.75) return "🙂/😄";
  return "😄";
};

const shouldShowTrend = (timeRange, previousPeriodCount, total) => {
  switch (timeRange) {
    case "day":
      return previousPeriodCount >= 1; // Show if yesterday had at least 1 entry
    case "week":
      return previousPeriodCount >= 3; // Show if last week had at least 3 entries
    case "month":
      return previousPeriodCount >= 7; // Show if last month had at least 7 entries
    case "year":
      return previousPeriodCount >= 30; // Show if last year had at least 30 entries
    default:
      return false; // Don't show trend for all time
  }
};

const MoodSummaryCard = ({ moodEntries = [] }) => {
  const [timeRange, setTimeRange] = useState("week");
  const [showRangePicker, setShowRangePicker] = useState(false);

  if (!moodEntries.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Mood Summary</Text>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No mood data yet.</Text>
          <Text style={styles.emptySubtext}>Start tracking your moods to see insights!</Text>
        </View>
      </View>
    );
  }

  const filteredEntries = getFilteredEntries(moodEntries, timeRange);
  const counts = {};
  let total = 0;
  let sum = 0;
  let previousPeriodSum = 0;
  let previousPeriodCount = 0;

  // Calculate previous period dates
  const now = new Date();
  let previousPeriodStart, currentPeriodStart;
  switch (timeRange) {
    case "day":
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "year":
      previousPeriodStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      currentPeriodStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
  }

  moodEntries.forEach((entry) => {
    const { mood, timestamp } = entry;
    const entryDate = new Date(timestamp);
    
    // Only count entries in current period for main stats
    if (timeRange === "all" || entryDate >= currentPeriodStart) {
      counts[mood] = (counts[mood] || 0) + 1;
      total++;
      const moodValue = { "😭": 1, "😔": 2, "😐": 3, "🙂": 4, "😄": 5 }[mood] || 3;
      sum += moodValue;
    }
    
    // Count previous period for trend
    if (timeRange !== "all" && entryDate >= previousPeriodStart && entryDate < currentPeriodStart) {
      const moodValue = { "😭": 1, "😔": 2, "😐": 3, "🙂": 4, "😄": 5 }[mood] || 3;
      previousPeriodSum += moodValue;
      previousPeriodCount++;
    }
  });

  const average = total ? sum / total : 0;
  const previousAverage = previousPeriodCount ? previousPeriodSum / previousPeriodCount : 0;
  const trend = previousPeriodCount ? average - previousAverage : 0;
  const mostFrequentMood = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b), "");

  // Calculate percentages for the mood distribution
  const percentages = {};
  Object.entries(counts).forEach(([mood, count]) => {
    percentages[mood] = (count / total) * 100;
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood Summary</Text>
        <TouchableOpacity 
          style={styles.rangeSelector}
          onPress={() => setShowRangePicker(true)}
        >
          <Text style={styles.rangeText}>
            {timeRanges.find(r => r.value === timeRange)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Range Picker Modal */}
      <Modal
        visible={showRangePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRangePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowRangePicker(false)}
        >
          <View style={styles.modalContent}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.rangeOption,
                  range.value === timeRange && styles.rangeOptionSelected
                ]}
                onPress={() => {
                  setTimeRange(range.value);
                  setShowRangePicker(false);
                }}
              >
                <Text style={[
                  styles.rangeOptionText,
                  range.value === timeRange && styles.rangeOptionTextSelected
                ]}>
                  {range.label}
                </Text>
                {range.value === timeRange && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Overview Section */}
      <View style={styles.overviewSection}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Average Mood</Text>
          <View style={styles.averageMoodContainer}>
            <Text style={styles.overviewValue}>{getMoodEmoji(average)}</Text>
            <Text style={styles.averageNumber}>({average.toFixed(2)})</Text>
          </View>
          {shouldShowTrend(timeRange, previousPeriodCount, total) && trend !== 0 && (
            <View style={[
              styles.trendContainer, 
              { backgroundColor: trend > 0 ? COLORS.success + '20' : COLORS.error + '20' }
            ]}>
              <Ionicons 
                name={trend > 0 ? "trending-up" : "trending-down"} 
                size={16} 
                color={trend > 0 ? COLORS.success : COLORS.error} 
              />
              <Text style={[
                styles.trendText, 
                { color: trend > 0 ? COLORS.success : COLORS.error }
              ]}>
                {Math.abs(trend).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Most Frequent</Text>
          <Text style={styles.overviewValue}>{mostFrequentMood || "-"}</Text>
          <Text style={styles.overviewSubtext}>
            {mostFrequentMood ? `${counts[mostFrequentMood]} times` : "No data"}
          </Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Total Entries</Text>
          <Text style={styles.overviewValue}>{total}</Text>
          <Text style={styles.overviewSubtext}>logged</Text>
        </View>
      </View>

      {/* Mood Distribution */}
      <Text style={styles.subtitle}>Mood Distribution</Text>
      <View style={styles.distributionContainer}>
        {Object.entries(moodLabels)
          .sort(([emojiA], [emojiB]) => (counts[emojiB] || 0) - (counts[emojiA] || 0))
          .map(([emoji, label]) => (
            <View key={emoji} style={styles.distributionRow}>
              <View style={styles.distributionLeft}>
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={styles.label}>{label}</Text>
              </View>
              <View style={styles.distributionRight}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${percentages[emoji] || 0}%`,
                        backgroundColor: moodColors[emoji] + '40'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.percentage}>
                  {counts[emoji] ? `${Math.round(percentages[emoji])}%` : '0%'}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
};

export default MoodSummaryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  overviewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  overviewValue: {
    color: COLORS.textDark,
    fontSize: 24,
    fontWeight: '600',
  },
  overviewSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  distributionContainer: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
  },
  distributionRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '500',
    width: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rangeText: {
    fontSize: 14,
    color: COLORS.textDark,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    width: '80%',
    maxWidth: 300,
  },
  rangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rangeOptionSelected: {
    backgroundColor: COLORS.primaryExtraLight,
  },
  rangeOptionText: {
    fontSize: 16,
    color: COLORS.textDark,
  },
  rangeOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  averageMoodContainer: {
    alignItems: 'center',
  },
  averageNumber: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});

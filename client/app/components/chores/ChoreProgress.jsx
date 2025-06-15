import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';

const getChoreProgress = httpsCallable(FIREBASE_FUNCTIONS, 'getChoreProgress');

const timeRanges = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const ChoreProgress = ({ progress, loading }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [localProgress, setLocalProgress] = useState(progress);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (progress) {
      setLocalProgress(progress);
    }
  }, [progress]);

  const fetchProgress = async (range) => {
    try {
      setLocalLoading(true);
      const result = await getChoreProgress({ timeRange: range });
      setLocalProgress(result.data.progress);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    fetchProgress(range);
  };

  const renderProgressBar = (completed, total) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
    );
  };

  const isLoading = loading || localLoading;
  const currentProgress = localProgress || progress;

  if (!currentProgress && !isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.timeRangeContainer}>
        {timeRanges.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.timeRangeButton,
              timeRange === value && styles.timeRangeButtonActive,
            ]}
            onPress={() => handleTimeRangeChange(value)}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === value && styles.timeRangeTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Overall</Text>
            <Text style={styles.statValue}>
              {currentProgress.completed}/{currentProgress.total}
            </Text>
            {renderProgressBar(currentProgress.completed, currentProgress.total)}
          </View>

          <View style={styles.importanceStats}>
            {Object.entries(currentProgress.byImportance).map(([importance, stats]) => (
              <View key={importance} style={styles.statRow}>
                <Text style={styles.statLabel}>{importance}</Text>
                <Text style={styles.statValue}>
                  {stats.completed}/{stats.total}
                </Text>
                {renderProgressBar(stats.completed, stats.total)}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: COLORS.background,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  statsContainer: {
    gap: 16,
  },
  statRow: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  importanceStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default ChoreProgress; 
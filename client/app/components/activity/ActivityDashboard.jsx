import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';
import { httpsCallable } from 'firebase/functions';
import { useNavigation } from '@react-navigation/native';

const getActivities = httpsCallable(FIREBASE_FUNCTIONS, 'getActivities');

export default function ActivityDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation();


  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActivities();
      setActivities(result.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderActivity = ({ item }) => {
    if (item.type === 'outdoor_activity') {
      return (
        <View style={styles.activityCard}>
          <View style={[styles.activityStripe, { backgroundColor: COLORS.primary }]} />
          <View style={styles.activityContent}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="leaf-outline" size={20} color={COLORS.primary} style={styles.typeIcon} />
                <Text style={styles.activityDate}>{formatDate(item.startTime)}</Text>
              </View>
              <Text style={[styles.activityXP, { color: COLORS.primary }]}>+{item.xpGained} XP</Text>
            </View>

            <View style={styles.activityStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.textDark} />
                <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="walk-outline" size={20} color={COLORS.textDark} />
                <Text style={styles.statValue}>{(item.distance / 1000).toFixed(2)} km</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.textDark} />
                <Text style={styles.statValue}>
                  {((item.distance / item.duration) * 3.6).toFixed(1)} km/h
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    } else if (item.type === 'workout') {
      return (
        <View style={styles.activityCard}>
          <View style={[styles.activityStripe, { backgroundColor: COLORS.primary }]} />
          <View style={styles.activityContent}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="fitness-outline" size={20} color={COLORS.primary} style={styles.typeIcon} />
                <Text style={styles.activityDate}>{formatDate(item.startTime)}</Text>
              </View>
              <Text style={[styles.activityXP, { color: COLORS.primary }]}>+{item.xpGained} XP</Text>
            </View>

            <View style={styles.activityStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.textDark} />
                <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Activity</Text>

        <TouchableOpacity 
          onPress={() => router.push('/components/activity/ActivitySelection')} 
          style={styles.iconButton}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.title}>No activities yet</Text>
          <Text style={styles.subtitle}>
            Start your first activity to begin tracking
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/components/activity/ActivitySelection')}
          >
            <Text style={styles.buttonText}>+ Start New Activity</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  activityStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  activityContent: {
    flex: 1,
    marginLeft: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: 8,
  },
  activityDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  activityXP: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    color: COLORS.textDark,
    marginLeft: 4,
  },
}); 
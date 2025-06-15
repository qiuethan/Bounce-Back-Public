import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import { useRouter } from 'expo-router';
import COLORS from '../../constants/colors';

// Initialize Cloud Functions
const startWorkout = httpsCallable(FIREBASE_FUNCTIONS, 'startWorkout');
const endWorkout = httpsCallable(FIREBASE_FUNCTIONS, 'endWorkout');

export default function WorkoutTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState(null);
  const [xpGained, setXpGained] = useState(0);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const router = useRouter();

  useEffect(() => {
    // Check for any active workout in AsyncStorage
    checkForActiveWorkout();

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        isTracking
      ) {
        // App has come to foreground
        syncWorkoutDuration();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, []);

  const checkForActiveWorkout = async () => {
    try {
      const workoutData = await AsyncStorage.getItem('activeWorkout');
      if (workoutData) {
        const workout = JSON.parse(workoutData);
        setCurrentWorkoutId(workout.id);
        setIsTracking(true);
        const now = new Date();
        const storedDuration = Math.floor((now - new Date(workout.startTime)) / 1000);
        setDuration(storedDuration);
        startDurationCounter();
      }
    } catch (error) {
      console.error('Error checking active workout:', error);
    }
  };

  const syncWorkoutDuration = async () => {
    try {
      const workoutData = await AsyncStorage.getItem('activeWorkout');
      if (workoutData) {
        const workout = JSON.parse(workoutData);
        const now = new Date();
        const storedDuration = Math.floor((now - new Date(workout.startTime)) / 1000);
        setDuration(storedDuration);
      }
    } catch (error) {
      console.error('Error syncing workout duration:', error);
    }
  };

  const startDurationCounter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const startTracking = async () => {
    setLoading(true);
    try {
      const result = await startWorkout({
        type: 'workout'
      });
      
      if (!result.data.success) {
        throw new Error('Failed to start workout');
      }

      const workoutData = {
        id: result.data.workoutId,
        startTime: new Date().toISOString(),
        duration: 0,
      };

      await AsyncStorage.setItem('activeWorkout', JSON.stringify(workoutData));
      
      setCurrentWorkoutId(result.data.workoutId);
      setIsTracking(true);
      setDuration(0);
      setXpGained(0);
      startDurationCounter();
    } catch (error) {
      console.error('Start tracking error:', error);
      Alert.alert('Error', 'Failed to start workout tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopTracking = async () => {
    setLoading(true);
    try {
      if (currentWorkoutId) {
        await endWorkout({
          workoutId: currentWorkoutId,
          duration: duration,
          type: 'workout'
        });

        await AsyncStorage.removeItem('activeWorkout');
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsTracking(false);
      setCurrentWorkoutId(null);
      
      // Calculate XP (1 XP per minute)
      const earnedXP = Math.floor(duration / 60);
      setXpGained(earnedXP);
      
      Alert.alert(
        'Workout Complete',
        `Great job! You worked out for ${formatDuration(duration)} and earned ${earnedXP} XP!`
      );
    } catch (error) {
      console.error('Stop tracking error:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={styles.headerIconButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.timerCard}>
          <Text style={styles.timerText}>{formatDuration(duration)}</Text>
          <Text style={styles.timerLabel}>Duration</Text>
        </View>

        <View style={styles.xpCard}>
          <Text style={styles.xpValue}>+{Math.floor(duration / 60)}</Text>
          <Text style={styles.xpLabel}>Estimated XP</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.trackingButton,
            { backgroundColor: isTracking ? COLORS.error : COLORS.primary }
          ]}
          onPress={isTracking ? stopTracking : startTracking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : isTracking ? (
            <>
              <Ionicons name="stop" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Stop Workout</Text>
            </>
          ) : (
            <>
              <Ionicons name="play" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Start Workout</Text>
            </>
          )}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  timerCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  xpCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  xpValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primary,
  },
  xpLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 
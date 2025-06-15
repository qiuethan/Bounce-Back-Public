import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import { useAuth } from '../../contexts/auth_provider';
import { useRouter } from 'expo-router';
import MapView, { Polyline } from 'react-native-maps';
import COLORS from '../../constants/colors';
import { httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Cloud Functions
const startWorkout = httpsCallable(FIREBASE_FUNCTIONS, 'startWorkout');
const endWorkout = httpsCallable(FIREBASE_FUNCTIONS, 'endWorkout');

const XP_PER_METER = 0.1; // Base XP rate
const MAX_SPEED = 8.3; // Maximum speed in m/s (about 30 km/h - fast cycling)

export default function OutdoorTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [duration, setDuration] = useState(0);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [lastLocation, setLastLocation] = useState(null);
  const [lastLocationTime, setLastLocationTime] = useState(null);
  const mapRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef(null);

  useEffect(() => {
    const initialize = async () => {
      await requestLocationPermission();
      await checkForActiveActivity();
      await initializeLocation();
    };
    
    initialize();

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        isTracking
      ) {
        // App has come to foreground
        syncActivityDuration();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, []);

  const startDurationCounter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const initializeLocation = async () => {
    if (permissionStatus !== 'granted') {
      await requestLocationPermission();
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      setLocation(currentLocation);
      updateMapRegion(currentLocation);
    } catch (error) {
      console.error('Error getting initial location:', error);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable location services to track outdoor activity.',
        [{ text: 'OK' }]
      );
    }
    return status;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const calculateSpeed = (distance, timeDiff) => {
    return distance / (timeDiff / 1000); // Speed in meters per second
  };

  const calculateXP = (distance, speed) => {
    if (speed > MAX_SPEED) return 0; // Too fast, no XP
    return Math.floor(distance * XP_PER_METER);
  };

  const updateMapRegion = (newLocation) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });
    }
  };

  const checkForActiveActivity = async () => {
    try {
      const activityData = await AsyncStorage.getItem('activeOutdoorActivity');
      if (activityData) {
        const activity = JSON.parse(activityData);
        setCurrentActivityId(activity.id);
        setIsTracking(true);
        const now = new Date();
        const storedDuration = Math.floor((now - new Date(activity.startTime)) / 1000);
        setDuration(storedDuration);
        setPathCoordinates(activity.pathCoordinates || []);
        setTotalDistance(activity.totalDistance || 0);
        setXpGained(activity.xpGained || 0);
        startDurationCounter();
      }
    } catch (error) {
      console.error('Error checking active activity:', error);
    }
  };

  const syncActivityDuration = async () => {
    try {
      const activityData = await AsyncStorage.getItem('activeOutdoorActivity');
      if (activityData) {
        const activity = JSON.parse(activityData);
        const now = new Date();
        const storedDuration = Math.floor((now - new Date(activity.startTime)) / 1000);
        setDuration(storedDuration);
      }
    } catch (error) {
      console.error('Error syncing activity duration:', error);
    }
  };

  const startTracking = async () => {
    if (permissionStatus !== 'granted') {
      await requestLocationPermission();
      return;
    }

    setLoading(true);
    try {
      const result = await startWorkout({
        type: 'outdoor_activity'
      });
      if (!result.data.success) {
        throw new Error('Failed to start activity');
      }

      const activityData = {
        id: result.data.workoutId,
        startTime: new Date().toISOString(),
        pathCoordinates: [],
        totalDistance: 0,
        xpGained: 0,
      };

      await AsyncStorage.setItem('activeOutdoorActivity', JSON.stringify(activityData));
      
      setCurrentActivityId(result.data.workoutId);
      setPathCoordinates([]);
      setTotalDistance(0);
      setXpGained(0);
      setLastLocation(null);
      setLastLocationTime(null);
      setDuration(0);
      setIsTracking(true);
      startDurationCounter();

      // Start location tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        async (newLocation) => {
          setLocation(newLocation);
          updateMapRegion(newLocation);

          const newCoord = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            speed: newLocation.coords.speed,
            timestamp: newLocation.timestamp,
          };

          setPathCoordinates(prev => {
            const updatedPath = [...prev, newCoord];
            
            // Calculate distance, speed, and XP if we have previous location
            if (lastLocation && lastLocationTime) {
              const distance = calculateDistance(
                lastLocation.latitude,
                lastLocation.longitude,
                newCoord.latitude,
                newCoord.longitude
              );
              
              const timeDiff = newLocation.timestamp - lastLocationTime;
              const speed = calculateSpeed(distance, timeDiff);
              const newXP = calculateXP(distance, speed);
              
              setTotalDistance(d => {
                const newDistance = d + distance;
                // Update AsyncStorage with new data
                updateStoredActivity({
                  pathCoordinates: updatedPath,
                  totalDistance: newDistance,
                  xpGained: Math.floor(xpGained + newXP)
                });
                return newDistance;
              });
              setXpGained(xp => xp + newXP);
            }

            return updatedPath;
          });

          setLastLocation(newCoord);
          setLastLocationTime(newLocation.timestamp);
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Start tracking error:', error);
      Alert.alert('Error', 'Failed to start activity tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStoredActivity = async (updates) => {
    try {
      const activityData = await AsyncStorage.getItem('activeOutdoorActivity');
      if (activityData) {
        const activity = JSON.parse(activityData);
        await AsyncStorage.setItem('activeOutdoorActivity', JSON.stringify({
          ...activity,
          ...updates
        }));
      }
    } catch (error) {
      console.error('Error updating stored activity:', error);
    }
  };

  const stopTracking = async () => {
    setLoading(true);
    try {
      if (locationSubscription) {
        locationSubscription.remove();
      }

      if (currentActivityId) {
        await endWorkout({
          workoutId: currentActivityId,
          duration: duration,
          type: 'outdoor_activity',
          distance: totalDistance,
          xpGained: xpGained,
          locations: pathCoordinates,
          finalPath: pathCoordinates.map(coord => ({
            latitude: coord.latitude,
            longitude: coord.longitude
          })),
        });

        await AsyncStorage.removeItem('activeOutdoorActivity');
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsTracking(false);
      setLocation(null);
      setLocationSubscription(null);
      setCurrentActivityId(null);
      
      Alert.alert(
        'Activity Saved',
        `Great job! You spent ${formatDuration(duration)} outside and gained ${xpGained} XP!`
      );
    } catch (error) {
      console.error('Stop tracking error:', error);
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
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
        <Text style={styles.headerTitle}>Outdoor Activity</Text>
        <View style={styles.headerIconButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation
            followsUserLocation
            initialRegion={{
              latitude: location?.coords?.latitude || 0,
              longitude: location?.coords?.longitude || 0,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            {pathCoordinates.length > 0 && (
              <Polyline
                coordinates={pathCoordinates}
                strokeColor={COLORS.primary}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(totalDistance / 1000).toFixed(2)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>+{xpGained}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
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
              <Text style={styles.buttonText}>Stop Activity</Text>
            </>
          ) : (
            <>
              <Ionicons name="play" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Start Activity</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
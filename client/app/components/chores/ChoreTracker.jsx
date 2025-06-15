import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';

import ChoreProgress from './ChoreProgress';
import ChoreList from './ChoreList';
import TodayChores from './TodayChores';

const getChores = httpsCallable(FIREBASE_FUNCTIONS, 'getChores');
const getChoreProgress = httpsCallable(FIREBASE_FUNCTIONS, 'getChoreProgress');
const uncompleteChore = httpsCallable(FIREBASE_FUNCTIONS, 'uncompleteChore');

const ChoreTracker = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [chores, setChores] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingChoreId, setCompletingChoreId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [choresResult, progressResult] = await Promise.all([
        getChores(),
        getChoreProgress({ timeRange: 'week' })
      ]);
      
      setChores(choresResult.data.chores || []);
      setProgress(progressResult.data.progress);
    } catch (error) {
      console.error('Failed to fetch chore data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = useCallback(async () => {
    await fetchData();
  }, []);

  const handleUncomplete = async (choreId) => {
    try {
      setCompletingChoreId(choreId);
      await uncompleteChore({ choreId });
      await handleUpdate();
    } catch (error) {
      console.error('Failed to uncomplete chore:', error);
    } finally {
      setCompletingChoreId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chore Tracker</Text>

        <TouchableOpacity 
          onPress={() => router.push('/components/chores/AddChore')} 
          style={styles.iconButton}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <TodayChores 
            chores={chores.filter(chore => !chore.isCompleted)} 
            onUpdate={handleUpdate}
          />
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress</Text>
          <ChoreProgress progress={progress} loading={loading} />
        </View>
        
        <View style={[styles.card, styles.lastCard]}>
          <ChoreList 
            chores={chores} 
            onUpdate={handleUpdate}
            onUncomplete={handleUncomplete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lastCard: {
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 16,
  },
});

export default ChoreTracker; 
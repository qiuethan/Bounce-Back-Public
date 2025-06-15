import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';

const completeChore = httpsCallable(FIREBASE_FUNCTIONS, 'completeChore');
const uncompleteChore = httpsCallable(FIREBASE_FUNCTIONS, 'uncompleteChore');

const importanceColors = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.error,
};

const TodayChores = ({ chores, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [completingChoreId, setCompletingChoreId] = useState(null);

  const handleComplete = async (choreId) => {
    try {
      setCompletingChoreId(choreId);
      await completeChore({ choreId });
      onUpdate();
    } catch (error) {
      console.error('Failed to complete chore:', error);
      Alert.alert('Error', 'Failed to complete chore. Please try again.');
    } finally {
      setCompletingChoreId(null);
    }
  };

  const handleUncomplete = async (choreId) => {
    try {
      setCompletingChoreId(choreId);
      await uncompleteChore({ choreId });
      onUpdate();
    } catch (error) {
      console.error('Failed to uncomplete chore:', error);
    } finally {
      setCompletingChoreId(null);
    }
  };

  const activeChores = chores.filter(chore => !chore.isCompleted);
  const completedChores = chores.filter(chore => chore.isCompleted);

  if (chores.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Today's Chores</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No chores for today</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Chores</Text>
      
      <ScrollView 
        style={[
          styles.scrollContainer,
          activeChores.length <= 5 && { height: activeChores.length * 80 }
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {activeChores.map((chore) => (
          <View key={chore.id} style={styles.choreCard}>
            <View style={styles.choreInfo}>
              <View style={styles.choreHeader}>
                <Ionicons 
                  name={chore.icon || 'list-outline'} 
                  size={20} 
                  color={COLORS.textDark} 
                  style={styles.choreIcon}
                />
                <Text style={styles.choreName}>{chore.name}</Text>
              </View>
              <View style={[styles.importanceTag, { backgroundColor: importanceColors[chore.importance] }]}>
                <Text style={styles.importanceText}>{chore.importance}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleComplete(chore.id)}
              disabled={completingChoreId === chore.id}
            >
              {completingChoreId === chore.id ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Complete</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {completedChores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedChores.map((chore) => (
              <View key={chore.id} style={[styles.choreCard, styles.completedCard]}>
                <View style={styles.choreInfo}>
                  <View style={styles.choreHeader}>
                    <Ionicons 
                      name={chore.icon || 'list-outline'} 
                      size={20} 
                      color={COLORS.textMuted} 
                      style={styles.choreIcon}
                    />
                    <Text style={[styles.choreName, styles.completedText]}>{chore.name}</Text>
                  </View>
                  <View style={[styles.importanceTag, styles.completedTag]}>
                    <Text style={styles.importanceText}>{chore.importance}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.uncompleteButton]}
                  onPress={() => handleUncomplete(chore.id)}
                  disabled={completingChoreId === chore.id}
                >
                  {completingChoreId === chore.id ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <Text style={styles.uncompleteButtonText}>Undo</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  scrollContainer: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  choreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  completedCard: {
    opacity: 0.8,
    backgroundColor: COLORS.background,
  },
  choreInfo: {
    flex: 1,
    marginRight: 12,
  },
  choreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  choreIcon: {
    marginRight: 8,
  },
  choreName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
    flex: 1,
  },
  completedText: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  importanceTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedTag: {
    opacity: 0.6,
  },
  importanceText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: COLORS.primary,
  },
  uncompleteButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 12,
  },
  uncompleteButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 12,
  },
});

export default TodayChores; 
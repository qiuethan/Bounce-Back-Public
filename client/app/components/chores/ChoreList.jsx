import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import COLORS from '../../constants/colors';

const deleteChore = httpsCallable(FIREBASE_FUNCTIONS, 'deleteChore');
const completeChore = httpsCallable(FIREBASE_FUNCTIONS, 'completeChore');
const uncompleteChore = httpsCallable(FIREBASE_FUNCTIONS, 'uncompleteChore');

const frequencyIcons = {
  day: 'calendar-outline',
  week: 'calendar-outline',
  month: 'calendar-outline',
  year: 'calendar-outline',
};

const frequencyLabels = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

const importanceColors = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.error,
};

const ChoreList = ({ chores, onUpdate }) => {
  const [deletingChoreId, setDeletingChoreId] = useState(null);
  const [completingChoreId, setCompletingChoreId] = useState(null);

  const handleDelete = async (choreId) => {
    Alert.alert(
      "Delete Chore",
      "Are you sure you want to delete this chore?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingChoreId(choreId);
              await deleteChore({ choreId });
              onUpdate();
            } catch (error) {
              console.error('Failed to delete chore:', error);
              Alert.alert('Error', 'Failed to delete chore. Please try again.');
            } finally {
              setDeletingChoreId(null);
            }
          }
        }
      ]
    );
  };

  const handleComplete = async (choreId) => {
    try {
      setCompletingChoreId(choreId);
      await completeChore({ choreId });
      onUpdate();
    } catch (error) {
      console.error('Failed to complete chore:', error);
    } finally {
      setCompletingChoreId(null);
    }
  };

  const handleUncomplete = async (choreId) => {
    try {
      setCompletingChoreId(choreId);
      console.log('Uncompleting chore:', choreId);
      await uncompleteChore({ choreId });
      console.log('Chore uncompleted, calling onUpdate');
      await onUpdate();
      console.log('onUpdate completed');
    } catch (error) {
      console.error('Failed to uncomplete chore:', error);
    } finally {
      setCompletingChoreId(null);
    }
  };

  if (chores.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>All Chores</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No chores added yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Chores</Text>
      
      <ScrollView 
        style={[
          styles.scrollContainer,
          chores.length <= 5 && { height: chores.length * 80 }
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {chores.map((chore) => (
          <View key={chore.id} style={[
            styles.choreCard,
            chore.isCompleted && styles.completedCard
          ]}>
            <View style={styles.choreInfo}>
              <View style={styles.choreHeader}>
                <Ionicons 
                  name={chore.icon || 'list-outline'} 
                  size={20} 
                  color={chore.isCompleted ? COLORS.textMuted : COLORS.textDark} 
                  style={styles.choreIcon}
                />
                <Text style={[
                  styles.choreName,
                  chore.isCompleted && styles.completedText
                ]}>{chore.name}</Text>
              </View>
              <View style={styles.tags}>
                <View style={[
                  styles.tag, 
                  { backgroundColor: importanceColors[chore.importance] },
                  chore.isCompleted && styles.completedTag
                ]}>
                  <Text style={styles.tagText}>{chore.importance}</Text>
                </View>
                <View style={[
                  styles.tag,
                  chore.isCompleted && styles.completedTag
                ]}>
                  <Text style={styles.tagText}>{chore.frequency}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.actions}>
              {!chore.isCompleted ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleComplete(chore.id)}
                  disabled={completingChoreId === chore.id || deletingChoreId === chore.id}
                >
                  {completingChoreId === chore.id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Complete</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.uncompleteButton]}
                  onPress={() => handleUncomplete(chore.id)}
                  disabled={completingChoreId === chore.id || deletingChoreId === chore.id}
                >
                  {completingChoreId === chore.id ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <Text style={styles.uncompleteButtonText}>Undo</Text>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(chore.id)}
                disabled={completingChoreId === chore.id || deletingChoreId === chore.id}
              >
                {deletingChoreId === chore.id ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={16} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  completedTag: {
    opacity: 0.6,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    minWidth: 80,
  },
  uncompleteButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 80,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    width: 42,
    justifyContent: 'center',
    alignItems: 'center',
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

export default ChoreList; 
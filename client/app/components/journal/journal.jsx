import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../../../FirebaseConfig';
import { Alert } from 'react-native';

const getJournalEntries = httpsCallable(FIREBASE_FUNCTIONS, 'getJournalEntries');
const addJournalEntry = httpsCallable(FIREBASE_FUNCTIONS, 'addJournalEntry');
const deleteJournalEntry = httpsCallable(FIREBASE_FUNCTIONS, 'deleteJournalEntry');

//REPLACE WITH AI GENERATED QUOTES
const quotes = [
  "You are stronger than you think.",
  "One step at a time is still progress.",
  "This too shall pass.",
  "Your feelings are valid.",
  "Every day is a new beginning.",
  "You are not alone.",
  "Small steps lead to big changes.",
  "Healing isn't linear.",
  "Breathe in calm, breathe out stress.",
  "It's okay to ask for help.",
  "Progress, not perfection.",
  "Be kind to your mind.",
  "Rest is productive too.",
  "You've survived 100% of your worst days.",
  "Let today be the start of something new.",
  "You deserve peace.",
  "You are worthy of love and care.",
  "Storms make trees take deeper roots.",
  "You matter more than you know.",
  "Don't believe everything you think.",
  "You're doing the best you can.",
  "Be gentle with yourself today.",
  "Your pace is the right pace.",
  "Even slow progress is progress.",
  "You are allowed to feel.",
  "You're not behind, you're on your path.",
  "Celebrate tiny victories.",
  "No feeling is final.",
  "Your presence is a gift.",
  "Everything you feel is okay.",
  "You are a work in progress, and that's okay.",
  "You don't have to have it all figured out.",
  "You are more than your bad days.",
  "Choose grace over pressure.",
  "Healing takes time — and that's okay.",
  "You're not failing, you're learning.",
  "Take what you need and leave the rest.",
  "You are exactly where you need to be.",
  "It's brave to rest.",
  "You're allowed to change.",
  "Growth starts where comfort ends.",
  "Light follows even the darkest night.",
  "You are more resilient than you feel.",
  "You've got this (even if it doesn't feel like it).",
  "Speak to yourself like someone you love.",
  "Don't rush your journey.",
  "You are worthy — no conditions.",
  "It's okay to outgrow people, places, and patterns.",
  "Let yourself feel without judgment.",
  "Your softness is your strength.",
  "You don't need to be perfect to be enough.",
];




const JournalScreen = () => {
  const [entryText, setEntryText] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  const [quote, setQuote] = useState('');
  
  useEffect(() => {
    // Pick a random quote on mount
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);
  

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const result = await getJournalEntries();
      setEntries(result.data.entries || []);
    } catch (error) {
      console.error("❌ Failed to fetch journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!entryText.trim()) return;
    
    const tempEntry = {
      id: Date.now().toString(), // temporary ID
      text: entryText.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      // Optimistically add the entry to the UI
      setEntries(prev => [tempEntry, ...prev]);
      setEntryText('');

      // Then try to save it to the backend
      const result = await addJournalEntry({ 
        entry: tempEntry.text,
        timestamp: tempEntry.timestamp 
      });

      // If successful, update the temporary entry with the real one
      if (result.data.success) {
        setEntries(prev => prev.map(entry => 
          entry.id === tempEntry.id ? { ...entry, id: result.data.id } : entry
        ));
        Alert.alert("Journal Saved", "Your thoughts have been added successfully.");
      }
    } catch (error) {
      // If failed, remove the temporary entry
      setEntries(prev => prev.filter(entry => entry.id !== tempEntry.id));
      Alert.alert("Failed to add entry", "Please try again later.");
      console.error("❌ Failed to add journal entry:", error);
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      setEntries((prev) => prev.filter(entry => entry.id !== id));
      await deleteJournalEntry({ entryId: id });
    } catch (error) {
      console.error("❌ Failed to delete journal entry:", error);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Zone",
      `Are you sure you want to delete this journal entry?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteEntry(id),
        },
      ]
    );
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Your Journal</Text>

            <View style={styles.iconButton} />
          </View>
          
          <Text style={styles.quote}>{quote}</Text>

          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : (
              <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.entryCardWrapper}>
                    <View style={styles.entryStripe} />
                    <View style={styles.entryCard}>
                      <Text style={styles.entryText}>{item.text}</Text>
                      <View style={styles.entryFooter}>
                        <Text style={styles.timestamp}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                          <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              value={entryText}
              onChangeText={setEntryText}
              placeholder="Write your thoughts..."
              placeholderTextColor="#999"
              multiline
              style={styles.input}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default JournalScreen;

import COLORS from '../../constants/colors';

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
  quote: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryCardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
  },
  entryStripe: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  entryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: COLORS.border,
    padding: 16,
  },
  entryText: {
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
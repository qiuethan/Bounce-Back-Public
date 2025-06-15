import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MoodGraph from "./MoodGraph";
import MoodStreakCard from "./MoodStreakCard"; // ⬅️ import your new component
import COLORS from "../../constants/colors";
import MoodSummaryCard from "./MoodSummary";
import { httpsCallable } from "firebase/functions";
import { FIREBASE_FUNCTIONS } from "../../../FirebaseConfig";

const getMoodEntries = httpsCallable(FIREBASE_FUNCTIONS, "getMoodEntries");

const MoodDashboard = () => {
  const navigation = useNavigation();

  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const getMoodEntriesData = async () => {
    try {
      const result = await getMoodEntries();
      return result.data;
    } catch (error) {
      console.error("Error fetching mood entries:", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          const data = await getMoodEntriesData();
          setMoodEntries(data?.moods ?? []);
        } catch (error) {
          console.error("Failed to fetch mood entries:", error);
          setMoodEntries([]);
        }
        setLoading(false);
      };

      loadData();
    }, [])
  );


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mood Progress</Text>

        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <MoodStreakCard moodEntries={moodEntries}/>
        <MoodSummaryCard moodEntries={moodEntries}/>
        <MoodGraph moodEntries={moodEntries}/>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoodDashboard;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    flex: 1,
    textAlign: 'center',
  },
});

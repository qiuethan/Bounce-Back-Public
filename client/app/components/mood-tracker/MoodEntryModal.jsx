import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { httpsCallable } from "firebase/functions";
import { FIREBASE_FUNCTIONS } from "../../../FirebaseConfig";
import COLORS from "../../constants/colors";

const moods = ["😭", "😔", "😐", "🙂", "😄"]; // reversed order

const addMoodEntry = httpsCallable(FIREBASE_FUNCTIONS, "addMoodEntry");

const MoodEntryModal = ({ visible, onClose }) => {
  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) return;

    setLoading(true);
    try {
      await addMoodEntry({ mood: selectedMood, note, timestamp: new Date() });
      setSelectedMood("");
      setNote("");
      onClose(); // close after successful submission
    } catch (err) {
      console.error("Failed to log mood:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedMood("");
    setNote("");
    onClose();
  };

  const getNoteTitle = () => {
    switch (selectedMood) {
      case "😄":
      case "🙂":
        return "Want to share why you're feeling good?";
      case "😐":
        return "Want to reflect on your mood?";
      case "😔":
      case "😭":
        return "Want to talk about it?";
      default:
        return "Want to add a note?";
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>How are you feeling?</Text>

            <View style={styles.moodRow}>
              {moods.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.moodButton,
                    selectedMood === emoji && styles.selectedMood,
                  ]}
                  onPress={() => setSelectedMood(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.noteTitle}>{getNoteTitle()}</Text>
            <TextInput
              style={styles.input}
              placeholder="What's going on? (optional)"
              value={note}
              onChangeText={setNote}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
            />

            {loading ? (
              <ActivityIndicator style={{ marginTop: 16 }} color={COLORS.primary} />
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.submit,
                    !selectedMood && { backgroundColor: COLORS.border },
                  ]}
                  disabled={!selectedMood}
                >
                  <Text style={styles.submitText}>Log Mood</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default MoodEntryModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.textDark,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  moodButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedMood: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryExtraLight,
  },
  emoji: {
    fontSize: 28,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textDark,
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    fontSize: 16,
    color: COLORS.textDark,
    height: 60,
    maxHeight: 100,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  cancel: {
    marginRight: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  submit: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
});

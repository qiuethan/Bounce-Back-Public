import React, { useState, useEffect, use } from "react";
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  SafeAreaView,
  TouchableOpacity,
  Text
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageBubble, TypingBubble } from "../components/chat";
import { chatWithBounceBot } from "../../api/chatbot";
import COLORS from "../constants/colors";
import { ActivityIndicator } from 'react-native';
import { useUserProfile } from '../contexts/profile_provider';

const toMistralMessages = (messages) => {
  const history = messages
    .slice() // shallow copy
    .reverse() // reverse to go from oldest to newest
    .filter((m) => m.sender === "user" || m.sender === "assistant") // exclude typing bubbles
    .map(({ text, sender }) => ({
      role: sender, // "user" or "assistant"
      content: text,
    }));

  // Prepend a system message
  return [
    {
      role: "system",
      content:
        "You are a compassionate mental health coach named Bounce. Speak warmly, ask thoughtful questions, and help users reflect and grow.",
    },
    ...history,
  ];
};

const Chat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "intro",
      text: "Hi there, I'm BounceBot! I'm here to help you get through the day. How can I assist you?",
      sender: "assistant",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
    };

    setMessages((prev) => [userMessage, ...prev]);
    setInput("");
    setLoading(true);

    try {
      const mistralMessages = toMistralMessages([userMessage, ...messages]);
      const botReply = await chatWithBounceBot(mistralMessages);

      const botMessage = {
        id: `${Date.now()}_assistant`,
        text: botReply,
        sender: "assistant",
      };

      setMessages((prev) => [botMessage, ...prev]);
    } catch {
      setMessages((prev) => [
        {
          id: `${Date.now()}_error`,
          text: "⚠️ Failed to reach BounceBot.",
          sender: "error",
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const displayedMessages = loading
    ? [{ id: "typing", typing: true }, ...messages]
    : messages;

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Pressable style={styles.inner} onPress={Keyboard.dismiss}>
          <FlatList
            data={displayedMessages}
            renderItem={({ item }) =>
              item.typing ? (
                <TypingBubble />
              ) : (
                <MessageBubble message={item} />
              )
            }
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            inverted
          />
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Type a message..."
              style={styles.input}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              maxHeight={80}
              numberOfLines={3}
              returnKeyType="default"
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={styles.sendButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  inner: {
    flex: 1,
    justifyContent: "flex-end",
  },
  list: {
    padding: 10,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    backgroundColor: COLORS.white,
    maxHeight: 80,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

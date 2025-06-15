import React from "react";
import { View, Text, StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const MessageBubble = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "75%",
    padding: 16,
    borderRadius: 10,
    marginVertical: 5,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.secondary,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryExtraLight,
  },
  text: {
    fontSize: 16,
    color: COLORS.darkText,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const greetings = [
  "Welcome back",
  "Good to see you again",
  "Hey there",
  "Glad you're here",
  "Nice to have you back",
  "You're doing great",
  "Keep showing up",
  "Let’s take it one step at a time",
];

const subGreetings = [
  "You’re doing great. Let’s keep going 🌱",
  "Every step you take matters.",
  "Today is a fresh start.",
  "You’ve made it here — that’s worth celebrating.",
];

const reminders = [
  "🌞 Even small steps count today.",
  "🧠 Progress doesn’t have to be loud.",
  "💚 Your pace is valid.",
];

export default function Greeting({ name }) {
  const firstName = name?.split(' ')[0] || '';
  const main = greetings[Math.floor(Math.random() * greetings.length)];
  const sub = subGreetings[Math.floor(Math.random() * subGreetings.length)];
  const banner = reminders[Math.floor(Math.random() * reminders.length)];

  return (
    <View style={styles.wrapper}>
      <View style={styles.textBlock}>
        <Text style={styles.header}>
          {main}{firstName ? `, ${firstName}` : ''} 👋
        </Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>{banner}</Text>
      </View>

      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  textBlock: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 28,
  },
  sub: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  banner: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  bannerText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 16,
  },
});

// HomeComponents/Challenges.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import ChallengeItem from './ChallengeItem';
import COLORS from '../../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Challenges = ({ title, initial }) => {
  const [challenges, setChallenges] = useState(initial);

  const sortedChallenges = [...challenges].sort((a, b) =>
    a.completed === b.completed ? 0 : a.completed ? 1 : -1
  );

  const toggleChallenge = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChallenges(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.challengeContainer}>
        {sortedChallenges.map((item) => (
          <ChallengeItem
            key={item.id}
            label={item.label}
            completed={item.completed}
            onToggle={() => toggleChallenge(item.id)}
          />
        ))}
      </View>
    </View>
  );
};

export default Challenges;

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  challengeContainer: {
    gap: 4,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const XPBar = ({ currentXP = 120, maxXP = 200 }) => {
  const progress = Math.min(currentXP / maxXP, 1); // ensure it doesn't exceed 100%

  return (
    <View style={styles.container}>
      <Text style={styles.label}>XP</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.xpText}>{currentXP} / {maxXP}</Text>
    </View>
  );
};

export default XPBar;

import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  container: {
    width: 160,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 4,
  },
  barBackground: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.primaryExtraLight,
    overflow: 'hidden',
    borderRadius: 5,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  xpText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.darkText,
  },
});
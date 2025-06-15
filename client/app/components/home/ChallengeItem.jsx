import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const ChallengeItem = ({ label, completed, onToggle }) => {
  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.stripe,
          { backgroundColor: completed ? COLORS.secondary : COLORS.primary }
        ]}
      />
      <View
        style={[
          styles.card,
          { backgroundColor: COLORS.white, borderColor: COLORS.border }
        ]}
      >
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              completed && styles.labelCompleted
            ]}
          >
            {label}
          </Text>
          {completed && (
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={COLORS.success}
              style={styles.icon}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChallengeItem;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stripe: {
    width: 8,
    height: '100%',
  },
  card: {
    flex: 1,
    padding: 20,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  labelCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  icon: {
    marginLeft: 12,
  },
});

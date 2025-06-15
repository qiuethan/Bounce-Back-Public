import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const moodMap = {
  "😭": 1,
  "😔": 2,
  "😐": 3,
  "🙂": 4,
  "😄": 5,
};

const mapMoodEntriesToChartData = (moodEntries) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyMoods = {};

  moodEntries.forEach(entry => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);
    const dateKey = entryDate.toDateString();

    const daysAgo = (today - entryDate) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 6 && moodMap[entry.mood]) {
      if (!dailyMoods[dateKey]) {
        dailyMoods[dateKey] = [];
      }
      dailyMoods[dateKey].push(moodMap[entry.mood]);
    }
  });

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const key = date.toDateString();
    const label = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    });

    const moods = dailyMoods[key] || [];
    const hasEntry = moods.length > 0;

    let averageMood = 0;
    if (hasEntry) {
      averageMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
    }

    chartData.push({
      value: hasEntry ? averageMood : 0,
      label,
      frontColor: hasEntry ? COLORS.primary : '#e0e0e0',
      topLabelComponent: hasEntry ? () => (
        <Text style={styles.entryCount}>
          {moods.length > 1 ? `${moods.length}x` : ''}
        </Text>
      ) : null
    });
  }

  return chartData;
};

const MoodGraph = ({ moodEntries = [] }) => {
  const { width } = useWindowDimensions();
  const chartData = mapMoodEntriesToChartData(moodEntries);
  
  const containerWidth = width - 32;
  const yAxisWidth = 20;
  const availableWidth = containerWidth - yAxisWidth - 32;
  const numBars = chartData.length;
  
  const barWidth = Math.floor((availableWidth / numBars) * 0.6);
  const spacing = Math.floor((availableWidth / numBars) * 0.4);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Last 7 Days</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          barWidth={barWidth}
          spacing={spacing}
          barBorderRadius={4}
          maxValue={5}
          minValue={0}
          noOfSections={5}
          yAxisLabelTexts={['❌', '😭', '😔', '😐', '🙂', '😄']}
          yAxisLabelWidth={yAxisWidth}
          yAxisTextStyle={{ color: COLORS.textDark }}
          xAxisLabelTextStyle={{ color: COLORS.textMuted, fontSize: 12 }}
          xAxisColor="transparent"
          yAxisColor="transparent"
          hideRules
          scrollEnabled={false}
          horizontal={false}
          showLine={false}
          renderTooltip={() => null}
          disableScroll
          yAxisOffset={0}
          showFractionalValues={true}
          roundToDigits={2}
        />
      </View>
    </View>
  );
};

export default MoodGraph;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartContainer: {
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  entryCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  }
});

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface WeeklyChartProps {
  data: Array<{ day: string; value: number }>;
  title: string;
  unit?: string;
}

export default function WeeklyChart({ data, title, unit = '' }: WeeklyChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const chartData = data.map((item, index) => ({
    x: item.day,
    y: item.value,
    label: item.value > 0 ? `${item.value}${unit}` : '',
  }));

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <VictoryChart
        width={screenWidth - 40}
        height={200}
        padding={{ left: 50, right: 50, top: 20, bottom: 50 }}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: '#ccc' },
            grid: { stroke: '#f0f0f0' },
            tickLabels: { fontSize: 12, fill: colors.text },
          }}
        />
        <VictoryAxis
          style={{
            axis: { stroke: '#ccc' },
            tickLabels: { fontSize: 12, fill: colors.text },
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: { fill: colors.tint },
          }}
          labelComponent={
            <VictoryLabel
              dy={-10}
              style={{ fontSize: 10, fill: colors.text }}
            />
          }
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
});
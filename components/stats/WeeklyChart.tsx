import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryLabel } from 'victory-native';
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
    <View style={[styles.container, {
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
      shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
    }]}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <VictoryChart
        width={screenWidth - 40}
        height={200}
        padding={{ left: 50, right: 50, top: 20, bottom: 50 }}
        domainPadding={{ x: 20 }}
      >
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: colorScheme === 'dark' ? '#555' : '#ccc' },
            grid: { stroke: colorScheme === 'dark' ? '#333' : '#f0f0f0', strokeDasharray: '3,3' },
            tickLabels: { fontSize: 12, fill: colors.text },
          }}
        />
        <VictoryAxis
          style={{
            axis: { stroke: colorScheme === 'dark' ? '#555' : '#ccc' },
            tickLabels: { fontSize: 12, fill: colors.text, angle: 0 },
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: { fill: colors.tint },
          }}
          barRatio={0.8}
          cornerRadius={{ top: 4 }}
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
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity는 동적으로 적용됨 (다크모드 대응)
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
});
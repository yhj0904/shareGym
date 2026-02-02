import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, gradientColors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleChartProps {
  data: Array<{ day: string; value: number }>;
  title: string;
  unit?: string;
}

export default function SimpleChart({ data, title, unit = '' }: SimpleChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 150;

  return (
    <View style={[styles.container, {
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
      shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
    }]}>
      <ThemedText style={styles.title}>{title}</ThemedText>

      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <ThemedText style={styles.axisLabel}>{maxValue}{unit}</ThemedText>
          <ThemedText style={styles.axisLabel}>{Math.floor(maxValue / 2)}{unit}</ThemedText>
          <ThemedText style={styles.axisLabel}>0</ThemedText>
        </View>

        <View style={styles.bars}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            return (
              <View key={index} style={styles.barWrapper}>
                <ThemedText style={styles.valueLabel}>
                  {item.value > 0 ? `${item.value}${unit}` : ''}
                </ThemedText>
                <View style={[styles.barContainer, { height: chartHeight }]}>
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[
                      styles.bar,
                      { height: barHeight }
                    ]}
                  />
                </View>
                <ThemedText style={styles.dayLabel}>{item.day}</ThemedText>
              </View>
            );
          })}
        </View>
      </View>
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
    marginBottom: 15,
  },
  chartContainer: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
    height: 150,
  },
  axisLabel: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: 'right',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '500',
  },
  barContainer: {
    width: '80%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
});
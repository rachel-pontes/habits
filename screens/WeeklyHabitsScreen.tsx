// screens/WeeklyHabits.tsx
import { useFocusEffect } from '@react-navigation/native';
import { addDays, format, startOfWeek } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dimensions,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as Progress from 'react-native-progress';
import { fetchHabits, toggleStatus } from '../services/habits';

const WeeklyHabits: React.FC = () => {
  const userId = 'wLOSk2y7kPMpQxVWCbZ2';
  const router = useRouter();

  const [habits, setHabits] = useState<any[]>([]);
  const [week, setWeek] = useState<Date[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const habitNameWidth = 90;
  const dayCellWidth = (screenWidth - habitNameWidth - 32 - 8) / 7; // 32 = padding/margin estimate

  useEffect(() => {
    generateWeek();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (week.length > 0) {
        loadHabits();
      }
    }, [weekOffset, week])
  );
  

  const generateWeek = (offset = weekOffset) => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    const start = addDays(base, offset * 7);
    const days = [...Array(7)].map((_, i) => addDays(start, i));
    setWeek(days);
  };

  const loadHabits = async () => {
    const { habits, statusMap, completionMap } = await fetchHabits(userId, week);
    setHabits(habits);
    setStatusMap(statusMap);
    setCompletionMap(completionMap);
  };

  const handleToggle = async (habitId: string, date: string) => {
    const key = `${habitId}_${date}`;
    const current = statusMap[key] || false;

    setStatusMap(prev => ({ ...prev, [key]: !current }));
    setCompletionMap(prev => {
      const prevCount = prev[habitId] ?? 0;
      return {
        ...prev,
        [habitId]: current ? prevCount - 1 : prevCount + 1
      };
    });

    try {
      await toggleStatus(userId, habitId, date, current, week);
    } catch (err) {
      console.error('Failed to update Firestore:', err);
      setStatusMap(prev => ({ ...prev, [key]: current }));
      setCompletionMap(prev => {
        const prevCount = prev[habitId] ?? 0;
        return {
          ...prev,
          [habitId]: current ? prevCount + 1 : prevCount - 1
        };
      });
    }
  };

  return (
    <View style={{ padding: 10 }}>
      <Button title="Add Habit" onPress={() => router.push('/add')} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 10
        }}
      >
        <TouchableOpacity
          onPress={() => {
            const newOffset = weekOffset - 1;
            setWeekOffset(newOffset);
            generateWeek(newOffset);
          }}
        >
          <Text style={{ fontSize: 20, marginHorizontal: 20 }}>←</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          {weekOffset === 0
            ? 'This Week'
            : weekOffset < 0
            ? 'Past Week'
            : 'Future Week'}
        </Text>

        <TouchableOpacity
          onPress={() => {
            const newOffset = weekOffset + 1;
            setWeekOffset(newOffset);
            generateWeek(newOffset);
          }}
        >
          <Text style={{ fontSize: 20, marginHorizontal: 20 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
        <Text style={{ width: habitNameWidth }}></Text>
        {week.map(date => (
          <Text
            key={date.toISOString()}
            style={{ width: dayCellWidth, fontSize: 12, textAlign: 'center', lineHeight: 16 }}
          >
            {format(date, 'EEE') + '\n' + format(date, 'd')}
          </Text>
        ))}
        <Text style={{ width: 30 }}></Text> {/* spacer for ⋮ */}
      </View>


      {/* Habit Rows */}
      {habits.map(habit => {
        const completed = completionMap[habit.id] ?? 0;
        const total = habit.frequency || 1;
        const progress = completed / total;
        const ratio = `${completed}/${total}`;

        return (
          <View
            key={habit.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
          >
            <View style={{ width: "25%" }}>
              <Text numberOfLines={1} style={{ fontSize: 12 }}>{habit.habitName}</Text>
              <View style={{ position: 'relative', marginTop: 4 }}>
                <Progress.Bar
                  progress={progress}
                  width={habitNameWidth}
                  height={15}
                  borderRadius={4}
                  color="#4caf50"
                  unfilledColor="#e0e0e0"
                  borderWidth={0}
                />
                <Text
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 10,
                    fontSize: 10,
                    textAlign: 'center',
                    color: 'grey',
                    fontWeight: 'bold'
                  }}
                >
                  {ratio}
                </Text>
              </View>
            </View>

            {week.map(dateObj => {
              const date = format(dateObj, 'yyyy-MM-dd');
              const key = `${habit.id}_${date}`;
              const checked = statusMap[key];

              return (
                <TouchableOpacity
                  key={date}
                  onPress={() => handleToggle(habit.id, date)}
                  style={{
                    width: dayCellWidth,
                    height: 32,
                    borderWidth: 1,
                    borderRadius: 4,
                    marginHorizontal: 1,
                    backgroundColor: checked ? '#4caf50' : 'white'
                  }}
                />
              );
            })}
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/edit', params: { habitId: habit.id } })
              }
              style={{
                marginLeft: 3,
                paddingHorizontal: 2
              }}
            >
              <Text style={{ fontSize: 18 }}>⋮</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

export default WeeklyHabits;

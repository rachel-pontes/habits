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
  View,
  Alert
} from 'react-native';
import * as Progress from 'react-native-progress';
import { fetchHabits, toggleStatus } from '../services/habits';
import { getUserCreationDate } from '@/services/user';

const WeeklyHabits: React.FC = () => {
  const userId = 'wLOSk2y7kPMpQxVWCbZ2';
  const router = useRouter();

  const [habits, setHabits] = useState<any[]>([]);
  const [week, setWeek] = useState<Date[]>([]);
  const [userCreationDate, setUserCreationDate] = useState(null);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const habitNameWidth = 90;
  const dayCellWidth = (screenWidth - habitNameWidth - 32 - 8) / 7;

  useEffect(() => {
    generateWeek();
    loadUserCreationDate();
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

  const loadUserCreationDate = async () => {
    const userCreationDate = await getUserCreationDate(userId);
    setUserCreationDate(userCreationDate);
  }

  const loadHabits = async () => {
    const { habits, statusMap, completionMap } = await fetchHabits(userId, week);
    setHabits(habits);
    setStatusMap(statusMap);
    setCompletionMap(completionMap);
  };

  const handleToggle = async (habitId: string, date: string) => {
    const dateObj = new Date(date);
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  
    // Disallow checking off beyond the current week
    if (dateObj > addDays(currentWeekStart, 6)) {
      Alert.alert("Not Allowed", "You can't mark habits beyond the current week.");
      return;
    }
  
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

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const prevOffset = weekOffset - 1;
  const prevWeekStart = startOfWeek(addDays(currentWeekStart, prevOffset * 7), { weekStartsOn: 1 });
  const userWeekStart = userCreationDate ? startOfWeek(new Date(userCreationDate), { weekStartsOn: 1 }) : null;

  const isBackDisabled = userWeekStart ? prevWeekStart < userWeekStart : false;

  return (
    <View style={{ padding: 10 }}>
      <Button title="Add New Habit" onPress={() => router.push('/add')} />
      <Button
        title="Add Archived Habit"
        onPress={() =>
          router.push({
            pathname: '/restore',
            params: { weekStart: format(week[0], 'yyyy-MM-dd') }
          })
        }
      />
      <Button
        title="Go to this Week"
        onPress={() => {
          setWeekOffset(0);
          generateWeek(0);
        }}
      />


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
            if (isBackDisabled) {
              Alert.alert("Limit Reached", "You can’t view weeks before your account was created.");
              return;
            }
            const newOffset = weekOffset - 1;
            setWeekOffset(newOffset);
            generateWeek(newOffset);
          }}
        >
          <Text style={{ fontSize: 20, marginHorizontal: 20, color: isBackDisabled ? 'gray' : 'black' }}>←</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          {weekOffset === 0
            ? 'This Week'
            : weekOffset < 0
            ? 'Past Week'
            : 'Next Week'}
        </Text>

        <TouchableOpacity
          onPress={() => {
            if (weekOffset >= 1) {
              Alert.alert("Limit Reached", "You can only view one week ahead.");
              return;
            }
            const newOffset = weekOffset + 1;
            setWeekOffset(newOffset);
            generateWeek(newOffset);
          }}
        >
          <Text style={{ fontSize: 20, marginHorizontal: 20, color: weekOffset >= 1 ? 'gray' : 'black' }}>→</Text>
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
        <Text style={{ width: 30 }}></Text>
      </View>

      {/* Habit Rows */}
      {habits.map(habit => {
        const completed = completionMap[habit.id] ?? 0;
        const total = habit.frequency || 1;
        const progress = completed / total;
        const ratio = `${completed}/${total}`;
        // checks if habit is currently archived (has a range with a start but no end).
        const isArchived = (habit.archiveRanges || []).some((r: any) => !r.end);

        return (
          <View
            key={habit.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
          >
            <View style={{ width: '25%' }}>
              <Text numberOfLines={1} style={{ fontSize: 12, color: isArchived ? 'gray' : 'black' }}>
                {habit.habitName} {isArchived && '(Archived)'}
              </Text>
              <View style={{ position: 'relative', marginTop: 4 }}>
                <Progress.Bar
                  progress={progress}
                  width={habitNameWidth}
                  height={15}
                  borderRadius={4}
                  color={isArchived ? '#bdbdbd' : '#4caf50'}
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
                router.push({ 
                  pathname: '/edit',
                  params: {
                    habitId: habit.id,
                    weekStart: format(week[0], 'yyyy-MM-dd') 
                  }
                })
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

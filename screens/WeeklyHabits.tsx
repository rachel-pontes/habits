// screens/WeeklyHabits.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Button
} from 'react-native';
import { useRouter } from 'expo-router';
import { addDays, format, startOfWeek } from 'date-fns';
import * as Progress from 'react-native-progress';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import DraggableFlatList, {
  RenderItemParams
} from 'react-native-draggable-flatlist';
import { db } from '../firebaseConfig';

const WeeklyHabits: React.FC = () => {
  const userId = 'wLOSk2y7kPMpQxVWCbZ2'; // Replace with auth.currentUser.uid
  const router = useRouter();

  const [habits, setHabits] = useState<any[]>([]);
  const [week, setWeek] = useState<Date[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({});

  useEffect(() => {
    generateWeek();
  }, []);
  
  useEffect(() => {
    if (week.length > 0) {
      fetchHabits();
    }
  }, [week]);
  
  const generateWeek = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = [...Array(7)].map((_, i) => addDays(start, i));
    setWeek(days);
  };

  const fetchHabits = async () => {
    const q = query(collection(db, `users/${userId}/habits`), orderBy('order'));
    const querySnapshot = await getDocs(q);
    const habitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHabits(habitsData);

    const newStatusMap: Record<string, boolean> = {};
    const completionCounts: Record<string, number> = {};

    for (const habit of habitsData) {
      let completedCount = 0;

      for (const dateObj of week) {
        const date = format(dateObj, 'yyyy-MM-dd');
        const statusRef = doc(db, `users/${userId}/habits/${habit.id}/habitStatus/${date}`);
        const statusSnap = await getDoc(statusRef);
        const isCompleted = statusSnap.exists() ? statusSnap.data().completed : false;

        if (isCompleted) completedCount++;
        newStatusMap[`${habit.id}_${date}`] = isCompleted;
      }

      completionCounts[habit.id] = completedCount;
    }

    setStatusMap(newStatusMap);
    setCompletionMap(completionCounts);
  };

  const toggleStatus = async (habitId: string, date: string) => {
    const key = `${habitId}_${date}`;
    const current = statusMap[key] || false;
    const statusRef = doc(db, `users/${userId}/habits/${habitId}/habitStatus/${date}`);

    if (!current) {
      await setDoc(statusRef, { completed: true });
    } else {
      await deleteDoc(statusRef);
    }

    const updatedStatusMap = {
      ...statusMap,
      [key]: !current
    };
    setStatusMap(updatedStatusMap);

    let completedCount = 0;
    for (const dateObj of week) {
      const d = format(dateObj, 'yyyy-MM-dd');
      if (updatedStatusMap[`${habitId}_${d}`]) {
        completedCount++;
      }
    }

    setCompletionMap(prev => ({
      ...prev,
      [habitId]: completedCount
    }));
  };

  const handleReorder = async (data: any[]) => {
  setHabits(data);

  // 🔁 create an array of Promises — no await inside .map
  const updates = data.map((habit, index) =>
    setDoc(
      doc(db, `users/${userId}/habits/${habit.id}`),
      { order: index },
      { merge: true }
    )
  );

  try {
    await Promise.all(updates); // ✅ await all updates together
  } catch (err) {
    console.error('Failed to update order:', err);
  }
};


  const renderHabit = ({ item, drag, isActive }: RenderItemParams<any>) => {
    const completed = completionMap[item.id] ?? 0;
    const total = item.frequency || 1;
    const ratioText = `${completed}/${total}`;
    const progress = completed / total;
  
    return (
      <View
        style={{
          backgroundColor: isActive ? '#f0f0f0' : 'transparent',
          paddingVertical: 6,
          overflow: 'scroll',
        }}
      >
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minWidth: 600, // gives horizontal space to scroll
          }}
        >
          <View style={{ width: 120, paddingRight: 5 }}>
            <Text>{item.habitName}</Text>
            <View style={{ position: 'relative', marginTop: 4 }}>
              <Progress.Bar
                progress={progress}
                width={100}
                height={16}
                borderRadius={5}
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
                  height: 16,
                  textAlign: 'center',
                  fontSize: 10,
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {ratioText}
              </Text>
            </View>
          </View>
  
          {week.map(dateObj => {
            const date = format(dateObj, 'yyyy-MM-dd');
            const key = `${item.id}_${date}`;
            const checked = statusMap[key];
  
            return (
              <TouchableOpacity
                key={date}
                onPress={() => toggleStatus(item.id, date)}
                style={{
                  width: 60,
                  height: 40,
                  borderWidth: 1,
                  backgroundColor: checked ? '#4caf50' : 'white',
                }}
              />
            );
          })}
        </TouchableOpacity>
      </View>
    );
  };
  
  
  return (
    <View style={{ padding: 10 }}>
      <Button title="Add Habit" onPress={() => router.push('/add')} />
  
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <Text style={{ width: 120 }}></Text>
        {week.map(date => (
          <Text key={date.toISOString()} style={{ width: 60 }}>
            {format(date, 'EEE dd')}
          </Text>
        ))}
      </View>
  
      <DraggableFlatList
        data={habits}
        onDragEnd={({ data }) => handleReorder(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        scrollEnabled={true} // vertical scroll enabled
        activationDistance={5}
      />
    </View>
  );  
};

export default WeeklyHabits;

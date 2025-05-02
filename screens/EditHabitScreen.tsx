import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const EditHabitScreen: React.FC = () => {
  const router = useRouter();
  const { habitId } = useLocalSearchParams();
  const userId = 'wLOSk2y7kPMpQxVWCbZ2';

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');

  useEffect(() => {
    const loadHabit = async () => {
      const docRef = doc(db, `users/${userId}/habits/${habitId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.habitName || '');
        setFrequency((data.frequency || '').toString());
      }
    };
    loadHabit();
  }, [habitId]);

  const handleSave = async () => {
    const ref = doc(db, `users/${userId}/habits/${habitId}`);
    await updateDoc(ref, {
      habitName: name,
      frequency: parseInt(frequency)
    });
    Alert.alert('Updated!');
    router.back();
  };

  const handleDelete = async () => {
    const ref = doc(db, `users/${userId}/habits/${habitId}`);
    await deleteDoc(ref);
    Alert.alert('Deleted!');
    router.replace('/');
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Habit name"
        value={name}
        onChangeText={setName}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Frequency"
        value={frequency}
        keyboardType="numeric"
        onChangeText={setFrequency}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Save Changes" onPress={handleSave} />
      <View style={{ marginTop: 10 }}>
        <Button title="Delete Habit" color="red" onPress={handleDelete} />
      </View>
    </View>
  );
};

export default EditHabitScreen;

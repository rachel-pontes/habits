// screens/AddHabitScreen.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import { addHabit } from '../services/addHabit';

const AddHabitScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Habit name cannot be empty.');
      return;
    }
    const freqNum = parseInt(frequency);
    if (!frequency || isNaN(freqNum) || freqNum <= 0) {
      Alert.alert('Validation Error', 'Frequency must be a number greater than 0.');
      return;
    }
    try {
      await addHabit(name, freqNum);
      Alert.alert('Habit added!');
      router.back(); // go back to main screen
    } catch (err) {
      console.error(err);
      Alert.alert('Failed to add habit');
    }
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
        placeholder="Frequency per week"
        keyboardType="numeric"
        value={frequency}
        onChangeText={setFrequency}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Add Habit" onPress={handleSubmit} />
    </View>
  );
};

export default AddHabitScreen;

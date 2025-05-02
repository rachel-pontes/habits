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
    try {
      await addHabit(name, parseInt(frequency));
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

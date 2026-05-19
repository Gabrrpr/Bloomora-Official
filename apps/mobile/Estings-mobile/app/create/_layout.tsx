import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 220,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShown: false,
      }}>
      <Stack.Screen name="describe" />
      <Stack.Screen name="mix-and-match" />
      <Stack.Screen name="examples" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 220,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShown: false,
      }}
    />
  );
}

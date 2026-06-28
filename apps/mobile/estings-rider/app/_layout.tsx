import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(auth)',
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium: require('@/assets/fonts/Montserrat_500Medium.ttf'),
    Montserrat_600SemiBold: require('@/assets/fonts/Montserrat_600SemiBold.ttf'),
    Montserrat_700Bold: require('@/assets/fonts/Montserrat_700Bold.ttf'),
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            animationDuration: 220,
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(settings)" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="delivery/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="dispatch/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar backgroundColor="#FFFFFF" style="dark" translucent={false} />
      </View>
    </ThemeProvider>
  );
}

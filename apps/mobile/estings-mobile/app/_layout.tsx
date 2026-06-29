import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  InterTight_300Light,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} from '@expo-google-fonts/inter-tight';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ChatFloatingBubble } from '@/components/chat-floating-bubble';
import { AdvertisementPopup } from '@/components/advertisement-popup';
import { AppUpdateGate } from '@/components/app-update-gate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { scheduleAppOpenCreateReminder } from '@/utils/push-notifications';
import '@/utils/register-svg-layout-event';

export const unstable_settings = {
  anchor: '(tabs)',
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    InterTight_300Light,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
  });

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void NavigationBar.setVisibilityAsync('visible').catch(() => {});
    void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
  }, []);

  useEffect(() => {
    void scheduleAppOpenCreateReminder().catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            animationDuration: 220,
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(company)" options={{ headerShown: false }} />
          <Stack.Screen name="(support)" options={{ headerShown: false }} />
          <Stack.Screen name="(legal)" options={{ headerShown: false }} />
          <Stack.Screen name="(settings)" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false }} />
          <Stack.Screen name="addresses" options={{ headerShown: false }} />
          <Stack.Screen name="my-rating" options={{ headerShown: false }} />
          <Stack.Screen name="create" options={{ headerShown: false }} />
          <Stack.Screen name="payment" options={{ headerShown: false }} />
          <Stack.Screen name="product-list" options={{ headerShown: false }} />
          <Stack.Screen name="product-details" options={{ headerShown: false }} />
          <Stack.Screen name="order-details/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="review/[orderId]" options={{ headerShown: false }} />
          <Stack.Screen name="search-results" options={{ headerShown: false }} />
          <Stack.Screen name="(modals)/modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <AppUpdateGate />
        <ChatFloatingBubble />
        <AdvertisementPopup />
        <StatusBar backgroundColor="#FFFFFF" style="dark" translucent={false} />
      </View>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

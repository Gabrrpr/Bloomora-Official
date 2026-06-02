import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { RiderAppHeader } from '@/components/rider/rider-app-header';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <View style={{ backgroundColor: theme.colors.surfaceAlt, flex: 1 }}>
      <RiderAppHeader />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          animation: 'fade',
          headerShown: false,
          lazy: false,
          sceneStyle: {
            backgroundColor: theme.colors.surfaceAlt,
          },
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 160,
            },
          },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="deliveries" options={{ title: 'Deliveries' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}

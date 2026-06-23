import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/floating-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        animation: 'fade',
        freezeOnBlur: true,
        headerShown: false,
        lazy: true,
        sceneStyle: {
          backgroundColor: '#FFFFFF',
        },
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 160,
          },
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Shop',
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Create',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

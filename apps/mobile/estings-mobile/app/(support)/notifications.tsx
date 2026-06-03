import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { BloomScreen, EmptyState, Section } from '@/components/bloom-ui';
import { theme } from '@/constants/theme';

export default function NotificationsScreen() {
  return (
    <BloomScreen
      eyebrow="0 unread"
      headerAction={
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.md} color={theme.colors.primary} />
        </Pressable>
      }
      title="Notifications"
      subtitle="Order updates, promos, support replies, and AI bouquet activity.">
      <Section title="Recent">
        <EmptyState
          title="No notifications yet"
          description="You will see order updates, delivery reminders, and account activity here."
        />
      </Section>
    </BloomScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
});

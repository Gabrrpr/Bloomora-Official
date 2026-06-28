import { router, type Href } from 'expo-router';
import { BookOpenText, FileQuestion, FileText, MessageCircle, Search, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HelpTopBar } from '@/components/help-document-screen';
import { Fonts } from '@/constants/theme';

const pages = [
  {
    color: '#2E8B34',
    surface: '#EAF6EC',
    icon: FileQuestion,
    route: '/help-center/faq',
    title: 'Frequently Asked Questions',
  },
  {
    color: '#D99018',
    surface: '#FFF6E5',
    icon: BookOpenText,
    route: '/help-center/ordering',
    title: 'Ordering & Fulfillment Policy',
  },
  {
    color: '#2879C8',
    surface: '#EAF3FF',
    icon: ShieldCheck,
    route: '/help-center/privacy',
    title: 'Data Privacy Policy',
  },
  {
    color: '#7A59C8',
    surface: '#F1ECFF',
    icon: FileText,
    route: '/help-center/terms',
    title: 'Terms & Conditions',
  },
  {
    color: '#D85576',
    surface: '#FFF0F4',
    icon: MessageCircle,
    route: '/live-chat',
    title: 'Estings Live Chat',
  },
] as const;

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const filteredPages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pages;
    return pages.filter((page) => page.title.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <View style={styles.screen}>
      <HelpTopBar title="Help Center" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.searchField}>
          <Search color="#999999" size={25} strokeWidth={2.1} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search help"
            placeholderTextColor="#999999"
            style={styles.searchInput}
            value={query}
          />
        </View>

        <View style={styles.grid}>
          {filteredPages.map((page) => {
            const Icon = page.icon;
            return (
              <Pressable
                accessibilityRole="button"
                key={page.route}
                onPress={() => router.push(page.route as Href)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                <View style={[styles.iconBubble, { backgroundColor: page.surface }]}>
                  <Icon color={page.color} size={30} strokeWidth={2} />
                </View>
                <Text style={styles.tileText}>{page.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 15,
  },
  searchInput: {
    color: '#222222',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 17,
    paddingVertical: 9,
  },
  tile: {
    alignItems: 'center',
    aspectRatio: 1.55,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
    padding: 18,
    width: '48%',
  },
  tileText: {
    color: '#111111',
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 17,
    lineHeight: 21,
  },
});

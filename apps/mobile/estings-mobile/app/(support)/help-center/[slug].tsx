import { useLocalSearchParams } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HelpDocumentScreen, HelpTopBar } from '@/components/help-document-screen';
import { Fonts, theme } from '@/constants/theme';
import {
  fallbackDocuments,
  fallbackFaqs,
  getFaqCategories,
  getHelpDocument,
  type FaqCategory,
  type HelpDocument,
} from '@/services/help-content-api';

type HelpSlug = 'faq' | 'ordering' | 'privacy' | 'terms';

const titles: Record<HelpSlug, string> = {
  faq: 'Frequently Asked Questions',
  ordering: 'Ordering & Fulfillment Policy',
  privacy: 'Data Privacy',
  terms: 'Terms & Conditions',
};

export default function HelpPageScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = normalizeSlug(params.slug);

  if (slug === 'faq') {
    return <FaqPage />;
  }

  return <DocumentPage slug={slug} />;
}

function DocumentPage({ slug }: { slug: Exclude<HelpSlug, 'faq'> }) {
  const [document, setDocument] = useState<HelpDocument>(fallbackDocuments[slug]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDocument = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      setDocument(await getHelpDocument(slug));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Using saved fallback content.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  return (
    <HelpDocumentScreen
      document={document}
      error={error}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={() => void loadDocument(true)}
      title={titles[slug]}
    />
  );
}

function FaqPage() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<FaqCategory[]>(fallbackFaqs);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFaqs = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const nextFaqs = await getFaqCategories();
      setCategories(nextFaqs);
      setOpenItem(nextFaqs[0]?.items[0] ? `${nextFaqs[0].id}:${nextFaqs[0].items[0].id}` : null);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Using saved fallback content.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFaqs();
  }, [loadFaqs]);

  const itemCount = useMemo(() => categories.reduce((total, category) => total + category.items.length, 0), [categories]);

  function toggleItem(key: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItem((current) => (current === key ? null : key));
  }

  return (
    <View style={styles.screen}>
      <HelpTopBar title={titles.faq} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={() => void loadFaqs(true)} />}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.muted}>Loading FAQs</Text>
          </View>
        ) : null}
        {error ? <Text selectable style={styles.errorText}>{error}</Text> : null}
        {!isLoading && itemCount === 0 ? <Text style={styles.muted}>No FAQs available yet.</Text> : null}

        {!isLoading ? categories.map((category) => (
          <View key={category.id} style={styles.category}>
            <Text selectable style={styles.categoryTitle}>{category.category}</Text>
            {category.items.map((item) => {
              const key = `${category.id}:${item.id}`;
              const isOpen = openItem === key;
              return (
                <View key={key} style={styles.faqItem}>
                  <Pressable onPress={() => toggleItem(key)} style={styles.questionRow}>
                    <Text selectable style={styles.questionText}>{item.q}</Text>
                    <ChevronDown color="#777777" size={20} style={isOpen ? styles.chevronOpen : undefined} />
                  </Pressable>
                  {isOpen ? <Text selectable style={styles.answerText}>{item.a}</Text> : null}
                </View>
              );
            })}
          </View>
        )) : null}
      </ScrollView>
    </View>
  );
}

function normalizeSlug(value?: string): HelpSlug {
  if (value === 'ordering' || value === 'privacy' || value === 'terms' || value === 'faq') {
    return value;
  }
  return 'faq';
}

const styles = StyleSheet.create({
  answerText: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    color: '#444444',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    padding: 14,
    paddingTop: 12,
  },
  category: {
    gap: 10,
  },
  categoryTitle: {
    color: '#222222',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 23,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    gap: 18,
    padding: 18,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  faqItem: {
    borderColor: '#D7D7D7',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingState: {
    alignItems: 'center',
    gap: 10,
    minHeight: 240,
    justifyContent: 'center',
  },
  muted: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  questionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    padding: 14,
  },
  questionText: {
    color: '#222222',
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
});

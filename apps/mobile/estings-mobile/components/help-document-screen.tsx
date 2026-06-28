import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import type { HelpDocument } from '@/services/help-content-api';

export function HelpTopBar({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
      <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft color="#222222" size={31} strokeWidth={2.2} />
      </Pressable>
      <Text numberOfLines={1} style={styles.topBarTitle}>{title}</Text>
      <View style={styles.backButtonSpacer} />
    </View>
  );
}

export function HelpDocumentScreen({
  document,
  error,
  isLoading,
  isRefreshing,
  onRefresh,
  title,
}: {
  document: HelpDocument;
  error?: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  title: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <HelpTopBar title={title} />
      <ScrollView
        contentContainerStyle={[styles.documentContent, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.muted}>Loading document</Text>
          </View>
        ) : null}

        {error ? <Text selectable style={styles.errorText}>{error}</Text> : null}

        {!isLoading ? (
          <View style={styles.paper}>
            <Text selectable style={styles.docTitle}>{document.docTitle}</Text>
            {document.docSubtitle ? <Text selectable style={styles.docSubtitle}>{document.docSubtitle}</Text> : null}
            {(document.effectiveDate || document.lastUpdated) ? (
              <View style={styles.metaRow}>
                {document.effectiveDate ? <Text selectable style={styles.metaText}>Effective: {document.effectiveDate}</Text> : null}
                {document.lastUpdated ? <Text selectable style={styles.metaText}>Updated: {document.lastUpdated}</Text> : null}
              </View>
            ) : null}

            {document.notice ? (
              <View style={styles.notice}>
                <Text selectable style={styles.noticeText}>{document.notice}</Text>
              </View>
            ) : null}

            {document.sections.map((section, index) => (
              <View key={`${section.title}-${index}`} style={styles.section}>
                <Text selectable style={styles.sectionTitle}>{section.title}</Text>
                <Text selectable style={styles.sectionBody}>{section.content}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backButtonSpacer: {
    width: 44,
  },
  documentContent: {
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  docSubtitle: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  docTitle: {
    color: '#111111',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 24,
    lineHeight: 31,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingState: {
    alignItems: 'center',
    gap: 10,
    minHeight: 260,
    justifyContent: 'center',
  },
  metaRow: {
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  muted: {
    color: '#777777',
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  notice: {
    backgroundColor: '#F8F8F8',
    borderColor: '#DDDDDD',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  noticeText: {
    color: '#444444',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 21,
  },
  paper: {
    gap: 18,
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  section: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    gap: 9,
    paddingTop: 16,
  },
  sectionBody: {
    color: '#444444',
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 23,
  },
  sectionTitle: {
    color: '#222222',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#DDDDDD',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 86,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    color: '#111111',
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
});

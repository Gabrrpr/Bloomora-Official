import { MapPin, Search } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';
import {
  searchAddressLocations,
  type AddressSearchResult,
} from '@/services/location-api';

type AddressLocationSearchProps = {
  disabled?: boolean;
  onResultSelect: (result: AddressSearchResult) => void;
};

export function AddressLocationSearch({ disabled = false, onResultSelect }: AddressLocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [message, setMessage] = useState('Search by street, barangay, city, or landmark.');
  const [isSearching, setIsSearching] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => () => abortController.current?.abort(), []);

  async function submitSearch() {
    if (disabled || isSearching) {
      return;
    }

    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    if (normalizedQuery.length < 5) {
      setResults([]);
      setMessage('Enter at least 5 characters to search.');
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setIsSearching(true);
    setMessage('Searching OpenStreetMap addresses...');

    try {
      const nextResults = await searchAddressLocations(normalizedQuery, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setResults(nextResults);
      setMessage(
        nextResults.length
          ? 'Select a result, then adjust the pin if needed.'
          : 'No matching Philippine address was found. Try adding the city or province.',
      );
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setResults([]);
      setMessage(error instanceof Error ? error.message : 'Address search is temporarily unavailable.');
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }

  function selectResult(result: AddressSearchResult) {
    setQuery(result.label);
    setResults([]);
    setMessage('Location selected. Confirm or adjust the pin on the map.');
    onResultSelect(result);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchField, disabled && styles.disabled]}>
        <Search color={theme.colors.textMuted} size={18} strokeWidth={2} />
        <TextInput
          accessibilityLabel="Search delivery address"
          editable={!disabled && !isSearching}
          onChangeText={setQuery}
          onSubmitEditing={() => void submitSearch()}
          placeholder="Search address or landmark"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Pressable
          accessibilityLabel="Search address"
          accessibilityRole="button"
          disabled={disabled || isSearching}
          onPress={() => void submitSearch()}
          style={({ pressed }) => [
            styles.searchButton,
            (disabled || isSearching) && styles.disabled,
            pressed && styles.pressed,
          ]}>
          {isSearching ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Search color={theme.colors.white} size={17} strokeWidth={2.3} />
          )}
        </Pressable>
      </View>
      <Text style={styles.message}>{message}</Text>
      {results.length ? (
        <View style={styles.results}>
          {results.map((result) => (
            <Pressable
              accessibilityRole="button"
              key={result.id}
              onPress={() => selectResult(result)}
              style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}>
              <View style={styles.resultIcon}>
                <MapPin color={theme.colors.primary} size={16} strokeWidth={2.2} />
              </View>
              <View style={styles.resultCopy}>
                <Text numberOfLines={2} style={styles.resultLabel}>{result.label}</Text>
                {result.type ? <Text style={styles.resultType}>{formatResultType(result.type)}</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function formatResultType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.surface, gap: 7, padding: theme.spacing.md },
  searchField: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingLeft: theme.spacing.md,
    paddingRight: 5,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    minHeight: 46,
    paddingVertical: 0,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  message: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15 },
  results: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  result: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.white,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 58,
    padding: theme.spacing.sm,
  },
  resultPressed: { backgroundColor: theme.colors.surfaceAlt },
  resultIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  resultCopy: { flex: 1, gap: 2 },
  resultLabel: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 12, lineHeight: 17 },
  resultType: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});

import { router } from 'expo-router';
import {
  BellRing,
  ChevronLeft,
  FlaskConical,
  RefreshCcw,
  Server,
  TerminalSquare,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import {
  apiFetch,
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  initializeApiBaseUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
} from '@/services/api-client';
import {
  registerForPushNotifications,
  type PushRegistrationResult,
} from '@/utils/push-notifications';

const aiColors = {
  accent: '#FFFFFF',
  accentSoft: '#111111',
  border: '#2A2A2A',
  card: '#050505',
  cardAlt: '#000000',
  danger: '#D4D4D4',
  muted: '#A3A3A3',
  primary: '#FFFFFF',
  screen: '#000000',
  text: '#FFFFFF',
};

const backendStatusTones = {
  checking: {
    border: '#F4DFA3',
    dot: '#F8D879',
    glow: 'rgba(248, 216, 121, 0.26)',
    shadow: '#F8D879',
    text: '#FFF0B8',
  },
  connected: {
    border: '#A8E6C1',
    dot: '#9EE7B8',
    glow: 'rgba(158, 231, 184, 0.32)',
    shadow: '#9EE7B8',
    text: '#C9F6D8',
  },
  error: {
    border: '#F1A7A7',
    dot: '#F2A6A6',
    glow: 'rgba(242, 166, 166, 0.34)',
    shadow: '#F2A6A6',
    text: '#FFD2D2',
  },
} satisfies Record<BackendConnectionResult['status'], {
  border: string;
  dot: string;
  glow: string;
  shadow: string;
  text: string;
}>;

type BackendConnectionResult = {
  checkedAt: Date;
  latencyMs?: number;
  message: string;
  status: 'checking' | 'connected' | 'error';
};

type EndpointTestResult = {
  checkedAt: Date;
  latencyMs?: number;
  preview: string;
  status: 'idle' | 'loading' | 'success' | 'error';
};

export default function DeveloperScreen() {
  const insets = useSafeAreaInsets();
  const statusGlow = useRef(new Animated.Value(0)).current;
  const [result, setResult] = useState<PushRegistrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendResult, setBackendResult] = useState<BackendConnectionResult>({
    checkedAt: new Date(),
    message: 'Not checked yet.',
    status: 'checking',
  });
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [endpointPath, setEndpointPath] = useState('/products/');
  const [endpointResult, setEndpointResult] = useState<EndpointTestResult>({
    checkedAt: new Date(),
    preview: 'No request run yet.',
    status: 'idle',
  });
  const backendTone = backendStatusTones[backendResult.status];

  useEffect(() => {
    statusGlow.setValue(0);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(statusGlow, {
          duration: 1050,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(statusGlow, {
          duration: 850,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [backendResult.status, statusGlow]);

  const glowOpacity = statusGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.54, 0.12],
  });
  const glowScale = statusGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.15],
  });

  const loadPushToken = useCallback(async () => {
    setIsLoading(true);
    const nextResult = await registerForPushNotifications();
    setResult(nextResult);
    console.log('Push notification result:', nextResult);
    setIsLoading(false);
  }, []);

  const checkBackendConnection = useCallback(async () => {
    setIsCheckingBackend(true);
    setBackendResult({
      checkedAt: new Date(),
      message: 'Checking backend connection...',
      status: 'checking',
    });

    const startedAt = Date.now();

    try {
      await apiFetch<unknown[]>('/products/');

      setBackendResult({
        checkedAt: new Date(),
        latencyMs: Date.now() - startedAt,
        message: 'Backend is reachable.',
        status: 'connected',
      });
    } catch (error) {
      setBackendResult({
        checkedAt: new Date(),
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Backend connection failed.',
        status: 'error',
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  const applyApiUrl = useCallback(async () => {
    const nextBaseUrl = await setApiBaseUrl(apiUrlInput);
    setApiUrlInput(nextBaseUrl);
    void checkBackendConnection();
  }, [apiUrlInput, checkBackendConnection]);

  const resetApiUrl = useCallback(async () => {
    const nextBaseUrl = await resetApiBaseUrl();
    setApiUrlInput(nextBaseUrl);
    void checkBackendConnection();
  }, [checkBackendConnection]);

  const testEndpoint = useCallback(async () => {
    const path = endpointPath.trim() || '/products/';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const startedAt = Date.now();

    setEndpointResult({
      checkedAt: new Date(),
      preview: `GET ${normalizedPath}`,
      status: 'loading',
    });

    try {
      const response = await apiFetch<unknown>(normalizedPath);
      const preview = JSON.stringify(response, null, 2);

      setEndpointPath(normalizedPath);
      setEndpointResult({
        checkedAt: new Date(),
        latencyMs: Date.now() - startedAt,
        preview: preview.length > 1200 ? `${preview.slice(0, 1200)}\n...` : preview,
        status: 'success',
      });
    } catch (error) {
      setEndpointResult({
        checkedAt: new Date(),
        latencyMs: Date.now() - startedAt,
        preview: error instanceof Error ? error.message : 'Request failed.',
        status: 'error',
      });
    }
  }, [endpointPath]);

  useEffect(() => {
    void initializeApiBaseUrl().then((nextBaseUrl) => {
      setApiUrlInput(nextBaseUrl);
      void checkBackendConnection();
    });
    void loadPushToken();
  }, [checkBackendConnection, loadPushToken]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + 104,
          paddingTop: insets.top + theme.spacing.lg,
        },
      ]}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" style={styles.closeButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={aiColors.accent} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>Developer Tools</Text>
      </View>

      <View style={styles.aiPanel}>
        <View style={styles.consoleIcon}>
          <TerminalSquare size={24} color={aiColors.text} strokeWidth={2.1} />
        </View>
        <Text style={styles.aiEyebrow}>{"Esting's internal"}</Text>
        <Text style={styles.aiTitle}>Developer Console</Text>
        <Text style={styles.aiDescription}>
          Local tools for checking the flower shop API, push token registration, and route responses while testing the app.
        </Text>
      </View>

      <DeveloperSection icon={Server} title="Backend Connection">
        <View
          style={[
            styles.card,
            styles.backendStatusCard,
            {
              borderColor: backendTone.border,
              shadowColor: backendTone.shadow,
            },
          ]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusDotWrap}>
              <Animated.View
                style={[
                  styles.statusGlow,
                  {
                    backgroundColor: backendTone.glow,
                    opacity: glowOpacity,
                    transform: [{ scale: glowScale }],
                  },
                ]}
              />
              <View style={[styles.statusDot, { backgroundColor: backendTone.dot }]} />
            </View>
            <Text style={[styles.label, { color: backendTone.text }]}>
              {backendResult.status === 'connected'
                ? 'Connected'
                : backendResult.status === 'error'
                  ? 'Not connected'
                  : 'Checking'}
            </Text>
          </View>

          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>API URL</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setApiUrlInput}
              placeholder={DEFAULT_API_BASE_URL}
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="done"
              selectTextOnFocus
              style={styles.urlInput}
              value={apiUrlInput}
            />
          </View>

          <View style={styles.inlineActions}>
            <Pressable
              disabled={isCheckingBackend}
              style={[styles.secondaryButton, isCheckingBackend && styles.refreshButtonDisabled]}
              onPress={applyApiUrl}>
              <Text style={styles.secondaryButtonText}>Apply URL</Text>
            </Pressable>
            <Pressable
              disabled={isCheckingBackend}
              style={[styles.secondaryButton, isCheckingBackend && styles.refreshButtonDisabled]}
              onPress={resetApiUrl}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
          </View>

          <Text style={styles.statusText}>{backendResult.message}</Text>
          <Text style={styles.statusText}>
            Last checked: {backendResult.checkedAt.toLocaleTimeString()}
            {backendResult.latencyMs !== undefined ? ` (${backendResult.latencyMs}ms)` : ''}
          </Text>

          <Pressable
            disabled={isCheckingBackend}
            style={[styles.refreshButton, isCheckingBackend && styles.refreshButtonDisabled]}
            onPress={checkBackendConnection}>
            <RefreshCcw size={theme.icon.sm} color={aiColors.screen} />
            <Text style={styles.refreshText}>
              {isCheckingBackend ? 'Checking...' : 'Check backend'}
            </Text>
          </Pressable>
        </View>
      </DeveloperSection>

      <DeveloperSection icon={BellRing} title="Push Notifications">
        <View style={styles.card}>
          <Text style={styles.label}>Your push token:</Text>
          <Text selectable style={styles.tokenText}>
            {result?.status === 'granted'
              ? result.token
              : result
                ? result.reason
                : 'Loading...'}
          </Text>
          <Text style={styles.statusText}>
            Status: {isLoading ? 'loading' : result?.status ?? 'checking'}
          </Text>
          <Pressable
            disabled={isLoading}
            style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
            onPress={loadPushToken}>
            <RefreshCcw size={theme.icon.sm} color={aiColors.screen} />
            <Text style={styles.refreshText}>{isLoading ? 'Checking...' : 'Refresh token'}</Text>
          </Pressable>
        </View>
      </DeveloperSection>

      <DeveloperSection icon={FlaskConical} title="Endpoint Tester">
        <View style={styles.card}>
          <Text style={styles.label}>GET request</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>Path</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setEndpointPath}
              placeholder="/products/"
              placeholderTextColor={aiColors.muted}
              returnKeyType="go"
              selectTextOnFocus
              style={styles.urlInput}
              value={endpointPath}
              onSubmitEditing={testEndpoint}
            />
          </View>

          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusDot,
                endpointResult.status === 'success' && styles.statusDotConnected,
                endpointResult.status === 'error' && styles.statusDotError,
              ]}
            />
            <Text style={styles.statusText}>
              {endpointResult.status === 'loading'
                ? 'Running request...'
                : `Last run: ${endpointResult.checkedAt.toLocaleTimeString()}`}
              {endpointResult.latencyMs !== undefined ? ` (${endpointResult.latencyMs}ms)` : ''}
            </Text>
          </View>

          <Text selectable style={styles.responsePreview}>
            {endpointResult.preview}
          </Text>

          <Pressable
            disabled={endpointResult.status === 'loading'}
            style={[styles.refreshButton, endpointResult.status === 'loading' && styles.refreshButtonDisabled]}
            onPress={testEndpoint}>
            <RefreshCcw size={theme.icon.sm} color={aiColors.screen} />
            <Text style={styles.refreshText}>
              {endpointResult.status === 'loading' ? 'Testing...' : 'Run test'}
            </Text>
          </Pressable>
        </View>
      </DeveloperSection>
    </ScrollView>
  );
}

function DeveloperSection({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Icon size={16} color={aiColors.text} strokeWidth={2.2} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: aiColors.screen,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 44,
  },
  closeButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -6,
    width: 42,
  },
  headerTitle: {
    color: aiColors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
  },
  aiPanel: {
    backgroundColor: aiColors.cardAlt,
    borderColor: aiColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  consoleIcon: {
    alignItems: 'center',
    backgroundColor: aiColors.accentSoft,
    borderColor: aiColors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    width: 42,
  },
  aiEyebrow: {
    color: aiColors.accent,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  aiTitle: {
    color: aiColors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    lineHeight: 28,
  },
  aiDescription: {
    color: aiColors.muted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: aiColors.accentSoft,
    borderColor: aiColors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sectionTitle: {
    color: aiColors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  card: {
    backgroundColor: aiColors.card,
    borderColor: aiColors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  backendStatusCard: {
    elevation: 8,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  label: {
    color: aiColors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    lineHeight: 21,
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusDotWrap: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  statusGlow: {
    borderRadius: theme.radius.pill,
    height: 18,
    position: 'absolute',
    width: 18,
  },
  statusDot: {
    backgroundColor: aiColors.muted,
    borderRadius: theme.radius.pill,
    elevation: 4,
    height: 10,
    shadowColor: aiColors.text,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    shadowOpacity: 0.34,
    shadowRadius: 8,
    width: 10,
  },
  statusDotConnected: {
    backgroundColor: backendStatusTones.connected.dot,
    shadowColor: backendStatusTones.connected.shadow,
  },
  statusDotError: {
    backgroundColor: backendStatusTones.error.dot,
    shadowColor: backendStatusTones.error.shadow,
  },
  tokenText: {
    backgroundColor: aiColors.cardAlt,
    borderColor: aiColors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: aiColors.text,
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    padding: theme.spacing.md,
  },
  responsePreview: {
    backgroundColor: aiColors.cardAlt,
    borderColor: aiColors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: aiColors.text,
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    maxHeight: 220,
    padding: theme.spacing.md,
  },
  urlBox: {
    backgroundColor: aiColors.cardAlt,
    borderColor: aiColors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  urlLabel: {
    color: aiColors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  urlInput: {
    color: aiColors.text,
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 36,
    padding: 0,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: aiColors.accentSoft,
    borderColor: aiColors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButtonText: {
    color: aiColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  statusText: {
    color: aiColors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: aiColors.text,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  refreshButtonDisabled: {
    opacity: 0.64,
  },
  refreshText: {
    color: aiColors.screen,
    fontSize: 14,
    fontWeight: '800',
  },
});

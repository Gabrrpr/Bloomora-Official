import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { CloudDownload, RefreshCcw } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';

import { Fonts, theme } from '@/constants/theme';

type UpdateGateStatus = 'available' | 'downloading' | 'ready' | 'restarting' | 'error';

const canUseUpdates = Updates.isEnabled && !__DEV__ && Constants.appOwnership !== 'expo';

export function AppUpdateGate() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const [status, setStatus] = useState<UpdateGateStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCheckingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (!canUseUpdates || isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        setErrorMessage(null);
        setStatus((current) => (current === 'downloading' || current === 'restarting' ? current : 'available'));
      } else if (!isUpdatePending) {
        setStatus(null);
        setErrorMessage(null);
      }
    } catch {
      if (status) {
        setErrorMessage('Unable to check the update right now. Please try again.');
        setStatus('error');
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [isUpdatePending, status]);

  useEffect(() => {
    if (!canUseUpdates) {
      return;
    }

    void checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    if (!canUseUpdates) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void checkForUpdate();
      }
    });

    return () => subscription.remove();
  }, [checkForUpdate]);

  useEffect(() => {
    if (!canUseUpdates) {
      return;
    }

    if (isUpdatePending) {
      setErrorMessage(null);
      setStatus((current) => (current === 'restarting' ? current : 'ready'));
      return;
    }

    if (isUpdateAvailable) {
      setErrorMessage(null);
      setStatus((current) => (current === 'downloading' || current === 'restarting' ? current : 'available'));
    }
  }, [isUpdateAvailable, isUpdatePending]);

  const restartWithUpdate = useCallback(async () => {
    if (!canUseUpdates || status === 'downloading' || status === 'restarting') {
      return;
    }

    setErrorMessage(null);

    try {
      if (!isUpdatePending) {
        setStatus('downloading');
        await Updates.fetchUpdateAsync();
      }

      setStatus('restarting');
      await Updates.reloadAsync();
    } catch {
      setErrorMessage('The update could not be applied automatically.');
      setStatus('error');
    }
  }, [isUpdatePending, status]);

  if (!canUseUpdates || !status) {
    return null;
  }

  const isBusy = status === 'downloading' || status === 'restarting';
  const isError = status === 'error';

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={[styles.iconBadge, isError && styles.iconBadgeError]}>
            {isBusy ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : isError ? (
              <RefreshCcw color={theme.colors.danger} size={28} strokeWidth={2.3} />
            ) : (
              <CloudDownload color={theme.colors.primary} size={30} strokeWidth={2.2} />
            )}
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{getTitle(status)}</Text>
            <Text style={styles.description}>{getDescription(status, errorMessage)}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void restartWithUpdate()}
            style={({ pressed }) => [styles.primaryButton, isBusy && styles.primaryButtonDisabled, pressed && !isBusy && styles.pressed]}>
            {isBusy ? <ActivityIndicator color={theme.colors.white} size="small" /> : null}
            <Text style={styles.primaryButtonText}>{getButtonLabel(status)}</Text>
          </Pressable>

          {isError ? (
            <Text style={styles.fallbackText}>If this does not work, fully close and reopen the app.</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function getTitle(status: UpdateGateStatus) {
  if (status === 'downloading') return 'Downloading update';
  if (status === 'ready' || status === 'restarting') return 'Update downloaded';
  if (status === 'error') return 'Update needs a retry';
  return 'A new version is ready';
}

function getDescription(status: UpdateGateStatus, errorMessage?: string | null) {
  if (status === 'downloading') {
    return 'Please keep the app open while we prepare the newest version.';
  }

  if (status === 'restarting') {
    return 'Restarting now so the latest improvements can take effect.';
  }

  if (status === 'ready') {
    return 'The newest version has been downloaded. Restart the app to finish updating.';
  }

  if (status === 'error') {
    return errorMessage ?? 'The update could not be applied automatically.';
  }

  return 'Restart once to apply the latest fixes and improvements.';
}

function getButtonLabel(status: UpdateGateStatus) {
  if (status === 'downloading') return 'Downloading...';
  if (status === 'restarting') return 'Restarting...';
  if (status === 'error') return 'Retry update';
  return 'Restart & update';
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 24, 20, 0.48)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  sheet: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: '0 18px 48px rgba(31, 42, 36, 0.22)',
    gap: theme.spacing.lg,
    maxWidth: 420,
    padding: theme.spacing.xl,
    width: '100%',
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.14)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  iconBadgeError: {
    backgroundColor: '#FFF5F5',
    borderColor: 'rgba(180, 35, 24, 0.16)',
  },
  copy: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 318,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  primaryButtonDisabled: {
    opacity: 0.76,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  fallbackText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

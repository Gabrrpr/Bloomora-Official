import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryVehicleIcon } from '@/components/rider/delivery-vehicle-icon';
import { Fonts, theme } from '@/constants/theme';
import { loginWithPassword, refreshAuthSession } from '@/services/auth-api';
import { authenticateWithScreenLock, getBiometricsAvailability, type BiometricsAvailability } from '@/services/biometrics';
import {
  forgetDeviceAccount,
  getAuthSession,
  getRememberedRider,
  saveRememberedRider,
  type AuthSession,
  type RememberedRider,
} from '@/services/auth-session';

const logo = require('@/assets/images/branding/estings-logo.png');

type LoginMode = 'checking' | 'password' | 'remembered' | 'setup_screen_lock';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [availability, setAvailability] = useState<BiometricsAvailability | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>('checking');
  const [rememberedRider, setRememberedRider] = useState<RememberedRider | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const riderDisplayName = useMemo(() => getRiderDisplayName(rememberedRider), [rememberedRider]);
  const canLogin = username.trim().length > 0 && password.trim().length > 0 && !isSubmitting;
  const isRememberedMode = mode === 'remembered' && rememberedRider?.biometricEnabled;
  const isSetupMode = mode === 'setup_screen_lock';

  useEffect(() => {
    let isMounted = true;

    async function loadLoginState() {
      const [storedAvailability, storedRider, storedSession] = await Promise.all([
        getBiometricsAvailability(),
        getRememberedRider(),
        getAuthSession(),
      ]);

      if (!isMounted) {
        return;
      }

      setAvailability(storedAvailability);
      setRememberedRider(storedRider);

      if (storedSession?.accessToken && storedRider?.biometricEnabled) {
        // Pre-refresh the token silently so it's fresh before the user taps the biometric button.
        // We do this in the background — don't block the UI on it.
        refreshAuthSession().catch(() => {
          // Refresh failed (e.g. refresh token expired). The stored access token
          // may still be valid. The biometric button will handle the fallback.
        });
        setMode('remembered');
        setUsername(storedRider.username ?? storedRider.email);
        return;
      }

      if (storedSession?.accessToken) {
        const refreshedSession = await refreshAuthSession();

        if (!isMounted) {
          return;
        }

        if (refreshedSession) {
          router.replace('/(tabs)');
          return;
        }

        setMode('password');
        setUsername(storedRider?.username ?? storedRider?.email ?? '');
        return;
      }

      setMode('password');
      setUsername(storedRider?.username ?? storedRider?.email ?? '');
    }

    loadLoginState().catch(() => setMode('password'));

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin() {
    if (!canLogin) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      const session = await loginWithPassword(username, password);
      const nextRider = toRememberedRider(session, rememberedRider?.id === session.user.id && Boolean(rememberedRider.biometricEnabled));
      setRememberedRider(nextRider);
      setPassword('');

      if (!nextRider.biometricEnabled && availability?.isAvailable) {
        setMode('setup_screen_lock');
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleScreenLockLogin() {
    if (!rememberedRider || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      // Step 1: Biometric / screen lock challenge
      const result = await authenticateWithScreenLock(`Open ${rememberedRider.firstName ?? 'your'} rider account`);

      if (!result.success) {
        setLoginError(result.error ?? 'Screen lock was not completed.');
        return;
      }

      // Step 2: Try to get a fresh token. If the refresh fails (e.g. refresh token
      // has expired but the access token is still valid), fall back to the stored
      // session. The API client will handle a true 401 with its own retry.
      const refreshedSession = await refreshAuthSession();

      if (refreshedSession) {
        router.replace('/(tabs)');
        return;
      }

      // Refresh failed — check if there is still a stored access token.
      const storedSession = await getAuthSession();

      if (storedSession?.accessToken) {
        // Access token exists; let the app proceed. If it turns out to be
        // expired, the API client's 401 handler will attempt another refresh
        // or redirect to login automatically.
        router.replace('/(tabs)');
        return;
      }

      // No usable session at all — must re-authenticate with password.
      setLoginError('Your session has expired. Please log in with your password.');
      setMode('password');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEnableScreenLock() {
    if (!rememberedRider || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      const result = await authenticateWithScreenLock('Turn on screen lock login');

      if (!result.success) {
        setLoginError(result.error ?? 'Screen lock was not completed.');
        return;
      }

      const nextRider = {
        ...rememberedRider,
        biometricEnabled: true,
        lastLoginAt: new Date().toISOString(),
      };
      await saveRememberedRider(nextRider);
      setRememberedRider(nextRider);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkipScreenLock() {
    router.replace('/(tabs)');
  }

  async function handleSwitchAccount() {
    await forgetDeviceAccount();
    setRememberedRider(null);
    setUsername('');
    setPassword('');
    setLoginError(null);
    setMode('password');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.md,
            paddingTop: insets.top + theme.spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.logoBlock}>
            <Image contentFit="contain" source={logo} style={styles.brandLogo} tintColor={theme.colors.primary} />
            <Text style={styles.companyName}>FLOWERS INTERNATIONAL INC.</Text>
          </View>

          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
            <View style={styles.helpIcon}>
              <Feather color={theme.colors.white} name="help-circle" size={17} />
            </View>
            <Text style={styles.helpText}>Help</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.riderIdentity}>
            <DeliveryVehicleIcon height={50} width={69} />
            <Text style={styles.riderRole}>DELIVERY RIDER</Text>
            <Text style={styles.riderName}>{riderDisplayName ?? 'CURRENTLY NOT LOGGED IN'}</Text>
          </View>
        </View>

        {mode === 'checking' ? (
          <View style={styles.loadingPanel}>
            <Text style={styles.loadingText}>Checking account...</Text>
          </View>
        ) : null}

        {isSetupMode ? (
          <View style={styles.setupPanel}>
            <View style={styles.setupIcon}>
              <MaterialCommunityIcons color={theme.colors.primary} name="cellphone-lock" size={28} />
            </View>
            <Text style={styles.setupTitle}>Use screen lock next time?</Text>
            <Text style={styles.setupText}>
              Open this rider account with {availability?.label ?? 'screen lock'} on this device. You can still use your password.
            </Text>
            {loginError ? <Text selectable style={styles.setupError}>{loginError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              style={({ pressed }) => [styles.setupPrimaryButton, isSubmitting && styles.loginButtonDisabled, pressed && !isSubmitting && styles.pressed]}
              onPress={handleEnableScreenLock}>
              <Text style={styles.setupPrimaryText}>{isSubmitting ? 'Checking...' : 'Turn on screen lock'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={isSubmitting} style={({ pressed }) => [styles.setupSecondaryButton, pressed && styles.pressed]} onPress={handleSkipScreenLock}>
              <Text style={styles.setupSecondaryText}>Maybe later</Text>
            </Pressable>
          </View>
        ) : null}

        {!isSetupMode && mode !== 'checking' ? (
          <View style={styles.form}>
            {isRememberedMode ? (
              <>
                <FloatingField
                  focused={isPasswordFocused}
                  label="Password"
                  placeholder="Enter your password"
                  rightAccessory={
                    <Pressable
                      accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => setIsPasswordVisible((value) => !value)}>
                      <Feather color="#6F6F6F" name={isPasswordVisible ? 'eye' : 'eye-off'} size={18} />
                    </Pressable>
                  }
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onBlur={() => setIsPasswordFocused(false)}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                />

                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]} onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot your password?</Text>
                </Pressable>
              </>
            ) : (
              <>
                <FloatingField
                  autoCapitalize="none"
                  focused={isUsernameFocused}
                  label="Username or Email"
                  placeholder="Enter your username or email"
                  value={username}
                  onBlur={() => setIsUsernameFocused(false)}
                  onChangeText={setUsername}
                  onFocus={() => setIsUsernameFocused(true)}
                />

                <FloatingField
                  focused={isPasswordFocused}
                  label="Password"
                  placeholder="Enter your password"
                  rightAccessory={
                    <Pressable
                      accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => setIsPasswordVisible((value) => !value)}>
                      <Feather color="#6F6F6F" name={isPasswordVisible ? 'eye' : 'eye-off'} size={18} />
                    </Pressable>
                  }
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onBlur={() => setIsPasswordFocused(false)}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                />

                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]} onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot your password?</Text>
                </Pressable>
              </>
            )}

            {loginError ? (
              <View style={styles.errorPanel}>
                <Feather color={theme.colors.danger} name="alert-circle" size={17} />
                <Text selectable style={styles.errorText}>{loginError}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {!isSetupMode && mode !== 'checking' ? (
          <View style={styles.bottomArea}>
            {isRememberedMode ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                style={({ pressed }) => [styles.screenLockButton, pressed && !isSubmitting && styles.pressed]}
                onPress={handleScreenLockLogin}>
                <MaterialCommunityIcons color="#525252" name="cellphone-lock" size={17} />
                <Text style={styles.screenLockText}>{isSubmitting ? 'Checking...' : 'Log in with screen lock'}</Text>
              </Pressable>
            ) : null}

            {rememberedRider ? (
              <View style={styles.switchRow}>
                <Text style={styles.notYouText}>Not you?</Text>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={handleSwitchAccount}>
                  <Text style={styles.switchText}>Switch account</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {!isSetupMode && mode !== 'checking' ? (
        <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            disabled={!canLogin}
            style={({ pressed }) => [styles.loginButton, !canLogin && styles.loginButtonDisabled, pressed && canLogin && styles.pressed]}
            onPress={handleLogin}>
            <Text style={styles.loginButtonText}>{isSubmitting ? 'Logging in...' : 'Log in'}</Text>
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function FloatingField({
  focused,
  label,
  rightAccessory,
  value,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  focused: boolean;
  label: string;
  rightAccessory?: React.ReactNode;
  value: string;
}) {
  const isActive = focused || value.length > 0;

  return (
    <View style={[styles.field, isActive && styles.fieldActive]}>
      <View style={styles.fieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput placeholderTextColor="#BDBDBD" style={styles.input} value={value} {...inputProps} />
      </View>
      {rightAccessory ? <View style={styles.fieldAccessory}>{rightAccessory}</View> : null}
    </View>
  );
}

function getRiderDisplayName(rider: RememberedRider | null) {
  if (!rider) {
    return null;
  }

  const fullName = [rider.firstName, rider.lastName].filter(Boolean).join(' ').trim();

  return fullName || rider.username || rider.email;
}

function toRememberedRider(session: AuthSession, biometricEnabled: boolean): RememberedRider {
  return {
    biometricEnabled,
    email: session.user.email,
    firstName: session.user.first_name ?? null,
    id: session.user.id,
    lastLoginAt: new Date().toISOString(),
    lastName: session.user.last_name ?? null,
    username: session.user.username ?? null,
  };
}

const styles = StyleSheet.create({
  bottomArea: {
    alignItems: 'center',
    gap: 22,
    marginTop: 'auto',
    paddingBottom: 104,
    paddingTop: 96,
  },
  brandLogo: {
    height: 42,
    width: 132,
  },
  companyName: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 2.4,
    lineHeight: 13,
  },
  content: {
    flexGrow: 1,
    gap: 28,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
  },
  errorPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.dangerBorder,
    borderRadius: 14,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.danger,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  field: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 18,
    ...Platform.select({
      android: {
        alignItems: 'stretch',
        minHeight: 61,
        paddingBottom: 7,
        paddingTop: 9,
      },
    }),
  },
  fieldAccessory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing.md,
  },
  fieldActive: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    boxShadow: '0 6px 16px rgba(48, 141, 54, 0.08)',
  },
  fieldLabel: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    lineHeight: 14,
  },
  fieldText: {
    flex: 1,
    justifyContent: 'center',
  },
  floatingFooter: {
    backgroundColor: theme.colors.surface,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  forgotButton: {
    alignSelf: 'center',
    padding: theme.spacing.sm,
  },
  forgotText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: theme.spacing.md,
  },
  helpButton: {
    alignItems: 'center',
    backgroundColor: '#525252',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: theme.spacing.sm,
  },
  helpIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
  },
  input: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 21,
    minHeight: 30,
    padding: 0,
  },
  loadingPanel: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minHeight: 54,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#D6ECD8',
  },
  loginButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 21,
  },
  logoBlock: {
    alignItems: 'flex-start',
    gap: 1,
  },
  notYouText: {
    color: '#777777',
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  passwordFallbackButton: {
    padding: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  rememberedPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.lg,
  },
  rememberedText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  rememberedTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
    textAlign: 'center',
  },
  riderIdentity: {
    alignItems: 'center',
    gap: 5,
  },
  riderName: {
    color: '#777777',
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    lineHeight: 14,
    maxWidth: 280,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  riderRole: {
    color: '#333333',
    fontFamily: Fonts.sans,
    fontSize: 22,
    letterSpacing: 0.8,
    lineHeight: 28,
  },
  screen: {
    backgroundColor: theme.colors.surface,
    flex: 1,
  },
  screenLockButton: {
    alignItems: 'center',
    backgroundColor: '#E1E1E1',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 7,
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
  },
  screenLockText: {
    color: '#525252',
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  setupError: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  setupIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  setupPanel: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  setupPrimaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  setupPrimaryText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  setupSecondaryButton: {
    padding: theme.spacing.sm,
  },
  setupSecondaryText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  setupText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  setupTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  switchText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

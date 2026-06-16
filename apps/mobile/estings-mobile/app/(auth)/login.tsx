import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Check, ChevronLeft, CircleHelp, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstingsLogo } from '@/components/estings-logo';
import { Fonts, theme } from '@/constants/theme';
import { loginWithOAuthProvider, loginWithPassword } from '@/services/auth-api';
import { type FormErrors, isValidEmail, required } from '@/utils/auth-validation';

type LoginField = 'identifier' | 'password';
const cooldownDurationSeconds = 30;
const maxFailedSignInAttempts = 3;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors<LoginField>>({});
  const [failedSignInAttempts, setFailedSignInAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialSubmittingProvider, setSocialSubmittingProvider] = useState<'facebook' | 'google' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCooldownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [cooldownSeconds]);

  function validate() {
    const nextErrors: FormErrors<LoginField> = {};

    if (!required(identifier)) {
      nextErrors.identifier = 'Email or username is required.';
    } else if (!isValidEmail(identifier) && identifier.trim().length < 3) {
      nextErrors.identifier = 'Enter a valid email or username.';
    }

    if (!required(password)) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSignIn() {
    if (cooldownSeconds > 0) {
      setSubmitError(`Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await loginWithPassword(identifier, password);
      setFailedSignInAttempts(0);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const nextFailedSignInAttempts = failedSignInAttempts + 1;

      setFailedSignInAttempts(nextFailedSignInAttempts);

      if (nextFailedSignInAttempts >= maxFailedSignInAttempts) {
        setFailedSignInAttempts(0);
        setCooldownSeconds(cooldownDurationSeconds);
        setSubmitError(`Please wait ${cooldownDurationSeconds} seconds before trying again.`);
      } else {
        setSubmitError(
          message.toLowerCase().includes('invalid credentials')
            ? 'Incorrect email or password, please try again.'
            : 'Unable to sign in, please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialSignIn(provider: 'facebook' | 'google') {
    if (isSubmitting || socialSubmittingProvider) {
      return;
    }

    setSocialSubmittingProvider(provider);
    setSubmitError(null);

    try {
      await loginWithOAuthProvider(provider);
      setFailedSignInAttempts(0);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      setSubmitError(
        message.toLowerCase().includes('cancel')
          ? 'Social sign in was cancelled.'
          : `Unable to continue with ${provider === 'google' ? 'Google' : 'Facebook'}, please try again.`,
      );
    } finally {
      setSocialSubmittingProvider(null);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}
      style={styles.keyboardView}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 72,
            paddingTop: insets.top + theme.spacing.xl,
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ChevronLeft size={24} color={theme.colors.primary} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/contact')}
            style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
            <CircleHelp size={17} color={theme.colors.primary} strokeWidth={2.3} />
            <Text style={styles.helpText}>Help</Text>
          </Pressable>
        </View>

        <View style={styles.brandHero}>
          <EstingsLogo color={theme.colors.primary} style={styles.brandLogo} />
        </View>

        <View style={styles.formPanel}>
          <LoginFieldInput
            error={errors.identifier}
            icon={Mail}
            keyboardType="email-address"
            label="Email or username"
            onChangeText={(value) => {
              setIdentifier(value);
              setSubmitError(null);
              if (errors.identifier) {
                setErrors((current) => ({ ...current, identifier: undefined }));
              }
            }}
            placeholder="your@email.com"
            value={identifier}
          />

          <LoginFieldInput
            error={errors.password}
            icon={LockKeyhole}
            label="Password"
            onChangeText={(value) => {
              setPassword(value);
              setSubmitError(null);
              if (errors.password) {
                setErrors((current) => ({ ...current, password: undefined }));
              }
            }}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
          />

          <View style={styles.passwordActionRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              style={({ pressed }) => [styles.rememberButton, pressed && styles.pressed]}
              onPress={() => setRememberMe((current) => !current)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? <Check size={14} color={theme.colors.white} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
              onPress={() => router.push('/forgot-password')}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          </View>

          {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}

          <PrimaryButton
            disabled={isSubmitting || cooldownSeconds > 0}
            label={cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : isSubmitting ? 'Signing in...' : 'Sign In'}
            onPress={handleSignIn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton
              disabled={isSubmitting || socialSubmittingProvider !== null}
              label={socialSubmittingProvider === 'google' ? 'Signing in with Google' : 'Continue with Google'}
              onPress={() => handleSocialSignIn('google')}>
              <GoogleIcon />
            </SocialButton>
            <SocialButton
              disabled={isSubmitting || socialSubmittingProvider !== null}
              label={socialSubmittingProvider === 'facebook' ? 'Signing in with Facebook' : 'Continue with Facebook'}
              onPress={() => handleSocialSignIn('facebook')}>
              <FontAwesome name="facebook" size={22} color="#1877F2" />
            </SocialButton>
          </View>
        </View>

        <View style={styles.footerPrompt}>
          <Text style={styles.footerText}>New to Esting&apos;s?</Text>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.footerLinkButton, pressed && styles.pressed]} onPress={() => router.push('/sign-up')}>
            <Text style={styles.linkText}>Create Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LoginFieldInput({
  error,
  icon: Icon,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: {
  error?: string;
  icon: typeof Mail;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  const [isHidden, setIsHidden] = useState(secureTextEntry);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputFrame, error && styles.inputError]}>
        <Icon size={theme.icon.sm} color={theme.colors.textMuted} strokeWidth={2.1} />
        <TextInput
          autoCapitalize="none"
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isHidden}
          style={styles.input}
          value={value}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            style={styles.eyeButton}
            onPress={() => setIsHidden((current) => !current)}>
            {isHidden ? (
              <Eye size={theme.icon.sm} color={theme.colors.textMuted} strokeWidth={2.1} />
            ) : (
              <EyeOff size={theme.icon.sm} color={theme.colors.textMuted} strokeWidth={2.1} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function PrimaryButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.primaryButton, disabled && styles.primaryButtonDisabled, pressed && !disabled && styles.pressed]}
      onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SocialButton({
  children,
  disabled = false,
  label,
  onPress,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.socialButton, disabled && styles.socialButtonDisabled, pressed && !disabled && styles.pressed]}>
      {children}
    </Pressable>
  );
}

function GoogleIcon() {
  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
      style={styles.googleIcon}
    />
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  content: {
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  helpButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingLeft: 10,
    paddingRight: 14,
  },
  helpText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    lineHeight: 16,
  },
  brandHero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.sm,
  },
  brandLogo: {
    height: 72,
    width: 260,
  },
  formPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  fieldWrap: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  inputFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 52,
    padding: 0,
  },
  eyeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  passwordActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  rememberButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 40,
  },
  rememberText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  forgotButton: {
    justifyContent: 'center',
    minHeight: 40,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: theme.borderWidth,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.68,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
  submitErrorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.08)',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  socialRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'center',
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  socialButtonDisabled: {
    opacity: 0.58,
  },
  googleIcon: {
    height: 26,
    width: 26,
  },
  footerPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  footerText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  footerLinkButton: {
    justifyContent: 'center',
    minHeight: 36,
  },
  linkText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

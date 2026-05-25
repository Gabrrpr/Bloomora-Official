import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
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

import { Fonts, theme } from '@/constants/theme';
import { type FormErrors, isValidEmailOrPhone, required } from '@/utils/auth-validation';

type LoginField = 'identifier' | 'password';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors<LoginField>>({});

  function validate() {
    const nextErrors: FormErrors<LoginField> = {};

    if (!required(identifier)) {
      nextErrors.identifier = 'Email or phone is required.';
    } else if (!isValidEmailOrPhone(identifier)) {
      nextErrors.identifier = 'Enter a valid email or Philippine phone number.';
    }

    if (!required(password)) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSignIn() {
    if (validate()) {
      router.replace('/(tabs)');
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
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Sparkles size={27} color={theme.colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping and managing your Esting&apos;s orders.</Text>
          </View>
        </View>

        <View style={styles.formPanel}>
          <LoginFieldInput
            error={errors.identifier}
            icon={Mail}
            keyboardType="email-address"
            label="Email or phone"
            onChangeText={(value) => {
              setIdentifier(value);
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

          <PrimaryButton label="Sign In" onPress={handleSignIn} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton label="Continue with Google">
              <GoogleIcon />
            </SocialButton>
            <SocialButton label="Continue with Facebook">
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

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SocialButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
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
  hero: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  heroCopy: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
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
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
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

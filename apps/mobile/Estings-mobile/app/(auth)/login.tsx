import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Check, LockKeyhole, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AuthButton,
  AuthField,
  AuthScreen,
  SocialIconButton,
  authStyles,
} from '@/components/auth-ui';
import { theme } from '@/constants/theme';
import {
  type FormErrors,
  isValidEmailOrPhone,
  required,
} from '@/utils/auth-validation';

type LoginField = 'identifier' | 'password';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotChecked, setIsForgotChecked] = useState(false);
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
    <AuthScreen
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Use your Bloomora account to continue shopping and creating.">
      <View style={[authStyles.form, styles.loginForm]}>
        <AuthField
          error={errors.identifier}
          keyboardType="email-address"
          label="Username or Email"
          leftIcon={<UserRound size={theme.icon.sm} color={theme.colors.textMuted} />}
          onChangeText={setIdentifier}
          placeholder="juandelacruz"
          value={identifier}
        />
        <AuthField
          error={errors.password}
          label="Password"
          leftIcon={<LockKeyhole size={theme.icon.sm} color={theme.colors.textMuted} />}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
        />

        <View style={styles.passwordActionRow}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isForgotChecked }}
            style={styles.rememberButton}
            onPress={() => setIsForgotChecked((current) => !current)}>
            <View style={[styles.checkbox, isForgotChecked && styles.checkboxChecked]}>
              {isForgotChecked ? <Check size={14} color={theme.colors.white} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </Pressable>
          <Pressable style={styles.forgotButton} onPress={() => router.push('/forgot-password')}>
            <Text style={authStyles.linkText}>Forgot Password?</Text>
          </Pressable>
        </View>

        <AuthButton label="Sign In" onPress={handleSignIn} />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <SocialIconButton label="Continue with Google">
            <GoogleIcon />
          </SocialIconButton>
          <SocialIconButton label="Continue with Facebook">
            <FontAwesome name="facebook" size={24} color="#1877F2" />
          </SocialIconButton>
        </View>

        <Text style={styles.termsText}>
          By signing in, you agree to our{' '}
          <Text style={styles.termsLink} onPress={() => router.push('/terms-and-condition')}>
            Terms and Conditions
          </Text>
          .
        </Text>

        <Pressable style={authStyles.linkButton} onPress={() => router.push('/sign-up')}>
          <Text style={styles.accountPrompt}>{"Don't have an account yet?"}</Text>
          <Text style={authStyles.linkText}>Create Account</Text>
        </Pressable>
      </View>
    </AuthScreen>
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
  loginForm: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  passwordActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    marginTop: -theme.spacing.xs,
  },
  rememberButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 36,
  },
  rememberText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  forgotButton: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 36,
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
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  divider: {
    backgroundColor: theme.colors.border,
    flex: 1,
    height: theme.borderWidth,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  socialRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'center',
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  accountPrompt: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  termsText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.lg,
    textAlign: 'center',
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  googleIcon: {
    height: 28,
    width: 28,
  },
});

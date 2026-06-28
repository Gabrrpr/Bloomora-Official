import Feather from '@expo/vector-icons/Feather';
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

import { Fonts, theme } from '@/constants/theme';
import { resetForgotPassword, sendForgotPasswordOtp } from '@/services/auth-api';

type ResetStep = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(30);
  const [step, setStep] = useState<ResetStep>('email');

  const stepCopy = useMemo(() => getStepCopy(step), [step]);

  useEffect(() => {
    if (step !== 'otp' || resendSeconds <= 0) {
      return;
    }

    const timeout = setTimeout(() => setResendSeconds((value) => Math.max(value - 1, 0)), 1000);

    return () => clearTimeout(timeout);
  }, [resendSeconds, step]);

  async function handlePrimaryAction() {
    setError(null);

    if (step === 'email') {
      if (!email.trim()) {
        setError('Enter the email assigned by Esting\'s staff.');
        return;
      }

      setIsSubmitting(true);
      try {
        await sendForgotPasswordOtp(email);
        setOtp('');
        setResendSeconds(30);
        setStep('otp');
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to send reset code. Try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (step === 'otp') {
      if (!/^\d{6}$/.test(otp.trim())) {
        setError('Enter the 6-digit reset code.');
        return;
      }

      setStep('reset');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetForgotPassword({
        email,
        newPassword,
        otp,
      });
      router.replace('/login');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reset password. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (resendSeconds > 0 || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await sendForgotPasswordOtp(email);
      setResendSeconds(30);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend reset code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (step === 'email') {
      router.back();
      return;
    }

    setError(null);
    setStep(step === 'reset' ? 'otp' : 'email');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + theme.spacing.lg,
            paddingTop: insets.top + theme.spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={handleBack}>
            <Feather color={theme.colors.text} name="chevron-left" size={25} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${getStepNumber(step) * 33.33}%` }]} />
          </View>
          <Text style={styles.stepCount}>{getStepNumber(step)}/3</Text>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{stepCopy.title}</Text>
          <Text style={styles.subtitle}>{stepCopy.subtitle}</Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <AuthField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Assigned Email"
              placeholder="Enter your rider email"
              value={email}
              onChangeText={setEmail}
            />
          ) : null}

          {step === 'otp' ? (
            <>
              <AuthField keyboardType="number-pad" label="Reset Code" maxLength={6} placeholder="6-digit code" value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))} />
              <Pressable accessibilityRole="button" disabled={resendSeconds > 0 || isSubmitting} style={({ pressed }) => [styles.resendButton, pressed && resendSeconds === 0 && styles.pressed]} onPress={handleResendCode}>
                <Text style={[styles.resendText, resendSeconds === 0 && styles.resendTextReady]}>
                  {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend code'}
                </Text>
              </Pressable>
            </>
          ) : null}

          {step === 'reset' ? (
            <>
              <AuthField
                label="New Password"
                placeholder="Enter new password"
                rightAccessory={
                  <Pressable
                    accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setIsPasswordVisible((value) => !value)}>
                    <Feather color={theme.colors.textMuted} name={isPasswordVisible ? 'eye' : 'eye-off'} size={18} />
                  </Pressable>
                }
                secureTextEntry={!isPasswordVisible}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <AuthField
                label="Confirm Password"
                placeholder="Confirm new password"
                secureTextEntry={!isPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </>
          ) : null}

          {error ? (
            <View style={styles.errorPanel}>
              <Feather color={theme.colors.danger} name="alert-circle" size={17} />
              <Text selectable style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.adminHelp}>
          <Feather color={theme.colors.textMuted} name="info" size={17} />
          <Text style={styles.adminHelpText}>{"If you cannot access your assigned email, ask Esting's staff to help with your rider account."}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          style={({ pressed }) => [styles.primaryButton, isSubmitting && styles.primaryButtonDisabled, pressed && !isSubmitting && styles.pressed]}
          onPress={handlePrimaryAction}>
          <Text style={styles.primaryText}>{isSubmitting ? 'Please wait...' : stepCopy.action}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function AuthField({
  label,
  rightAccessory,
  value,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  rightAccessory?: React.ReactNode;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput placeholderTextColor="#BDBDBD" style={styles.input} value={value} {...inputProps} />
      </View>
      {rightAccessory ? <View style={styles.fieldAccessory}>{rightAccessory}</View> : null}
    </View>
  );
}

function getStepCopy(step: ResetStep) {
  if (step === 'otp') {
    return {
      action: 'Continue',
      subtitle: 'Enter the 6-digit code sent to your rider email.',
      title: 'Check your email',
    };
  }

  if (step === 'reset') {
    return {
      action: 'Reset password',
      subtitle: 'Set a new password for this rider account.',
      title: 'Create new password',
    };
  }

  return {
    action: 'Send reset code',
    subtitle: 'Use the email assigned by Esting\'s staff. We will send a reset code there.',
    title: 'Forgot password',
  };
}

function getStepNumber(step: ResetStep) {
  if (step === 'otp') {
    return 2;
  }

  if (step === 'reset') {
    return 3;
  }

  return 1;
}

const styles = StyleSheet.create({
  adminHelp: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.subtleBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  adminHelpText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  content: {
    flexGrow: 1,
    gap: theme.spacing.xl,
    paddingHorizontal: 24,
  },
  copyBlock: {
    gap: theme.spacing.sm,
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
    backgroundColor: '#F4F4F4',
    borderRadius: 15,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 18,
  },
  fieldAccessory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing.md,
  },
  fieldLabel: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldText: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    backgroundColor: theme.colors.surface,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 21,
    minHeight: 30,
    padding: 0,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryButtonDisabled: {
    backgroundColor: '#D6ECD8',
  },
  primaryText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.pill,
    flex: 1,
    height: 7,
    overflow: 'hidden',
  },
  resendButton: {
    alignSelf: 'center',
    padding: theme.spacing.sm,
  },
  resendText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  resendTextReady: {
    color: theme.colors.primary,
  },
  screen: {
    backgroundColor: theme.colors.surface,
    flex: 1,
  },
  stepCount: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
    minWidth: 28,
    textAlign: 'right',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    lineHeight: 35,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});

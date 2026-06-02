import { router } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
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
import { type FormErrors, isSixDigitOtp, isValidEmail, required } from '@/utils/auth-validation';

type ForgotField = 'email' | 'otp' | 'newPassword' | 'confirmPassword';
type ForgotStep = 'email' | 'otp' | 'reset';
type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordHidden, setIsNewPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const [isDiscardVisible, setIsDiscardVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors<ForgotField>>({});
  const [resendSeconds, setResendSeconds] = useState(30);
  const requirementsProgress = useState(() => new Animated.Value(0))[0];
  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const passwordStrength = useMemo(() => getPasswordStrength(passwordRules), [passwordRules]);

  const screenCopy = getStepCopy(step);
  const stepNumber = getStepNumber(step);
  const hasEnteredResetData = [email, otp, newPassword, confirmPassword].some((value) => value.trim().length > 0);

  useEffect(() => {
    Animated.timing(requirementsProgress, {
      duration: 220,
      toValue: newPassword.length > 0 ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [newPassword.length, requirementsProgress]);

  useEffect(() => {
    if (step === 'otp') {
      setResendSeconds(30);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'otp' || resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds, step]);

  function validateEmail() {
    const nextErrors: FormErrors<ForgotField> = {};

    if (!required(email)) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function validateOtp() {
    const nextErrors: FormErrors<ForgotField> = {};

    if (!required(otp)) {
      nextErrors.otp = 'Code is required.';
    } else if (!isSixDigitOtp(otp)) {
      nextErrors.otp = 'Enter the 6-digit code.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function validateReset() {
    const nextErrors: FormErrors<ForgotField> = {};

    if (!required(newPassword)) {
      nextErrors.newPassword = 'New password is required.';
    } else if (!passwordRules.every((rule) => rule.isValid)) {
      nextErrors.newPassword = 'Please meet the password requirements.';
    }

    if (!required(confirmPassword)) {
      nextErrors.confirmPassword = 'Confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleBack() {
    if (step === 'reset') {
      setStep('otp');
      return;
    }

    if (step === 'otp') {
      setStep('email');
      return;
    }

    if (hasEnteredResetData) {
      setIsDiscardVisible(true);
      return;
    }

    router.back();
  }

  function handleDiscardReset() {
    setIsDiscardVisible(false);
    router.back();
  }

  function handleNext() {
    if (step === 'email' && validateEmail()) {
      setStep('otp');
      return;
    }

    if (step === 'otp' && validateOtp()) {
      setStep('reset');
      return;
    }

    if (step === 'reset' && validateReset()) {
      router.replace('/login');
    }
  }

  function handleResendCode() {
    if (resendSeconds > 0) {
      return;
    }

    setResendSeconds(30);
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
            paddingBottom: insets.bottom + theme.spacing.xl,
            paddingTop: insets.top + theme.spacing.xl,
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ArrowLeft size={31} color={theme.colors.text} strokeWidth={2.6} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(stepNumber / 3) * 100}%` }]} />
          </View>
          <Text style={styles.stepCount}>{stepNumber}/3</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>{screenCopy.title}</Text>
            <Text style={styles.subtitle}>{screenCopy.subtitle}</Text>
          </View>

          {step === 'email' ? (
            <SimpleField
              disallowHistory
              error={errors.email}
              keyboardType="email-address"
              label="Email Address"
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors((current) => ({ ...current, email: undefined }));
                }
              }}
              placeholder="Email address"
              value={email}
            />
          ) : null}

          {step === 'otp' ? (
            <OtpPinInput
              error={errors.otp}
              onChangeText={(value) => {
                setOtp(value);
                if (errors.otp) {
                  setErrors((current) => ({ ...current, otp: undefined }));
                }
              }}
              value={otp}
            />
          ) : null}

          {step === 'reset' ? (
            <View style={styles.resetFields}>
              <SimpleField
                error={errors.newPassword}
                label="New Password"
                onChangeText={(value) => {
                  setNewPassword(value);
                  if (errors.newPassword) {
                    setErrors((current) => ({ ...current, newPassword: undefined }));
                  }
                }}
                onToggleSecure={() => setIsNewPasswordHidden((current) => !current)}
                placeholder="New password"
                secureTextEntry={isNewPasswordHidden}
                value={newPassword}
              />
              <PasswordRequirements progress={requirementsProgress} rules={passwordRules} strength={passwordStrength} />
              <SimpleField
                error={errors.confirmPassword}
                label="Confirm Password"
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (errors.confirmPassword) {
                    setErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }
                }}
                onToggleSecure={() => setIsConfirmPasswordHidden((current) => !current)}
                placeholder="Confirm password"
                secureTextEntry={isConfirmPasswordHidden}
                value={confirmPassword}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          {step === 'otp' ? (
            <View style={styles.otpFooterContent}>
              <Pressable
                accessibilityRole="button"
                disabled={resendSeconds > 0}
                onPress={handleResendCode}
                style={({ pressed }) => [styles.resendButton, pressed && resendSeconds === 0 && styles.pressed]}>
                <Text style={[styles.resendText, resendSeconds === 0 && styles.resendTextReady]}>
                  {resendSeconds > 0 ? `Resend Code in ${resendSeconds} seconds` : 'Resend Code'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/contact')}
                style={({ pressed }) => [styles.helpCard, pressed && styles.pressed]}>
                <Text style={styles.helpEmoji}>🤔</Text>
                <View style={styles.helpCopy}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <Text style={styles.helpText}>
                    Visit our <Text style={styles.helpLink}>Help Center</Text> to learn more
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextButtonText}>{screenCopy.action}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <DiscardResetModal
        visible={isDiscardVisible}
        onCancel={() => setIsDiscardVisible(false)}
        onDiscard={handleDiscardReset}
      />
    </KeyboardAvoidingView>
  );
}

function OtpPinInput({
  error,
  onChangeText,
  value,
}: {
  error?: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const activeIndex = value.length >= digits.length ? -1 : value.length;

  return (
    <View style={styles.otpBlock}>
      <View style={styles.pinInputWrap}>
        <View style={styles.pinRow} pointerEvents="none">
          {digits.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.pinBox,
                isFocused && activeIndex >= 0 && index === activeIndex && styles.pinBoxActive,
                error && styles.pinBoxError,
              ]}>
              <Text style={[styles.pinText, !digit && styles.pinPlaceholder]}>{digit || '-'}</Text>
            </View>
          ))}
        </View>
        <TextInput
          caretHidden
          keyboardType="number-pad"
          maxLength={6}
          onBlur={() => setIsFocused(false)}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setIsFocused(true)}
          selection={{ end: value.length, start: value.length }}
          style={styles.hiddenOtpInput}
          value={value}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function DiscardResetModal({
  onCancel,
  onDiscard,
  visible,
}: {
  onCancel: () => void;
  onDiscard: () => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.discardOverlay}>
        <Pressable style={styles.discardBackdrop} onPress={onCancel} />
        <View style={styles.discardCard}>
          <Text style={styles.discardTitle}>Discard password reset?</Text>
          <Text style={styles.discardMessage}>The information you entered will be lost if you leave this screen.</Text>
          <View style={styles.discardActions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.discardCancelButton, pressed && styles.pressed]}
              onPress={onCancel}>
              <Text style={styles.discardCancelText}>Keep editing</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.discardButton, pressed && styles.pressed]}
              onPress={onDiscard}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PasswordRequirements({
  progress,
  rules,
  strength,
}: {
  progress: Animated.Value;
  rules: ReturnType<typeof getPasswordRules>;
  strength: PasswordStrength;
}) {
  const activeBars = getStrengthBars(strength);
  const panelStyle = {
    maxHeight: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 190],
    }),
    marginBottom: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, theme.spacing.xs],
    }),
    marginTop: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, theme.spacing.xs],
    }),
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.requirementsPanel, panelStyle]}>
      <View style={styles.requirementsHeader}>
        <Text style={styles.requirementsTitle}>Password requirements</Text>
        <Text style={[styles.strengthText, styles[`strength${strength}`]]}>{strength}</Text>
      </View>
      <View style={styles.strengthBars}>
        {Array.from({ length: 4 }, (_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.strengthBar,
              index < activeBars && styles[`strengthBar${strength}`],
              {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, index < activeBars ? 1 : 0.42],
                }),
                transform: [
                  {
                    scaleX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.15, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      {rules.map((rule) => (
        <View key={rule.label} style={styles.requirementRow}>
          <View style={[styles.requirementIcon, rule.isValid && styles.requirementIconValid]}>
            {rule.isValid ? <Check size={11} color={theme.colors.white} strokeWidth={3} /> : null}
          </View>
          <Text style={[styles.requirementText, rule.isValid && styles.requirementTextValid]}>{rule.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

function SimpleField({
  autoFocus = false,
  disallowHistory = false,
  error,
  keyboardType = 'default',
  label,
  maxLength,
  onChangeText,
  onToggleSecure,
  placeholder,
  secureTextEntry = false,
  value,
}: {
  autoFocus?: boolean;
  disallowHistory?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  label: string;
  maxLength?: number;
  onChangeText: (value: string) => void;
  onToggleSecure?: () => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldBlock}>
      <View style={[styles.inputFrame, isFocused && styles.inputFrameFocused, error && styles.inputFrameError]}>
        <View style={styles.inputCopy}>
          <Text style={[styles.fieldLabel, error && styles.fieldLabelError]}>{label}</Text>
          <TextInput
          autoCapitalize="none"
          autoComplete={disallowHistory ? 'off' : undefined}
          autoCorrect={false}
          autoFocus={autoFocus}
          importantForAutofill={disallowHistory ? 'no' : undefined}
          keyboardType={keyboardType}
          maxLength={maxLength}
            onBlur={() => setIsFocused(false)}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          textContentType={disallowHistory ? 'none' : undefined}
          value={value}
        />
        </View>
        {onToggleSecure ? (
          <Pressable
            accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            onPress={onToggleSecure}
            style={styles.eyeButton}>
            {secureTextEntry ? (
              <Eye size={22} color={theme.colors.textMuted} strokeWidth={2.1} />
            ) : (
              <EyeOff size={22} color={theme.colors.textMuted} strokeWidth={2.1} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function getStepCopy(step: ForgotStep) {
  if (step === 'otp') {
    return {
      action: 'Verify',
      subtitle: 'Please enter the one-time PIN (OTP) that we sent to your email.',
      title: 'One-Time PIN',
    };
  }

  if (step === 'reset') {
    return {
      action: 'Reset Password',
      subtitle: 'Choose a new password for your account.',
      title: 'Reset password',
    };
  }

  return {
    action: 'Next',
    subtitle: "Please use the email address registered to your Esting's account.",
    title: 'Enter your email',
  };
}

function getStepNumber(step: ForgotStep) {
  if (step === 'otp') {
    return 2;
  }

  if (step === 'reset') {
    return 3;
  }

  return 1;
}

function getPasswordRules(value: string) {
  return [
    { label: 'At least 8 characters', isValid: value.length >= 8 },
    { label: 'At least 1 uppercase letter', isValid: /[A-Z]/.test(value) },
    { label: 'At least 1 lowercase letter', isValid: /[a-z]/.test(value) },
    { label: 'At least 1 special character', isValid: /[^A-Za-z0-9]/.test(value) },
  ];
}

function getPasswordStrength(rules: ReturnType<typeof getPasswordRules>): PasswordStrength {
  const score = rules.filter((rule) => rule.isValid).length;

  if (score <= 1) {
    return 'Weak';
  }

  if (score === 2) {
    return 'Fair';
  }

  if (score === 3) {
    return 'Good';
  }

  return 'Strong';
}

function getStrengthBars(strength: PasswordStrength) {
  if (strength === 'Weak') {
    return 1;
  }

  if (strength === 'Fair') {
    return 2;
  }

  if (strength === 'Good') {
    return 3;
  }

  return 4;
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -8,
    width: 42,
  },
  progressTrack: {
    backgroundColor: 'rgba(31, 42, 36, 0.08)',
    flex: 1,
    height: 3,
    maxWidth: 270,
  },
  progressFill: {
    backgroundColor: theme.colors.text,
    height: '100%',
  },
  stepCount: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    lineHeight: 17,
    minWidth: 28,
    textAlign: 'right',
  },
  body: {
    flex: 1,
    gap: 42,
    paddingTop: theme.spacing.xl,
  },
  copyBlock: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 40,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  fieldBlock: {
    gap: theme.spacing.sm,
  },
  inputFrame: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1.3,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  inputFrameError: {
    backgroundColor: '#F7F7F7',
    borderColor: theme.colors.danger,
  },
  inputFrameFocused: {
    borderColor: theme.colors.textMuted,
  },
  inputCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  fieldLabel: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldLabelError: {
    color: theme.colors.danger,
  },
  input: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 22,
    minHeight: 26,
    padding: 0,
  },
  eyeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  resetFields: {
    gap: theme.spacing.xs,
  },
  footer: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  otpBlock: {
    gap: theme.spacing.sm,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  pinInputWrap: {
    position: 'relative',
  },
  pinBox: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: 'transparent',
    borderRadius: 17,
    borderWidth: 1.3,
    flex: 1,
    height: 64,
    justifyContent: 'center',
  },
  pinBoxError: {
    borderColor: theme.colors.danger,
  },
  pinBoxActive: {
    borderColor: theme.colors.textMuted,
  },
  pinText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
  },
  pinPlaceholder: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
  },
  hiddenOtpInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    fontSize: 1,
  },
  requirementsPanel: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    gap: theme.spacing.sm,
    overflow: 'hidden',
    padding: theme.spacing.md,
  },
  requirementsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requirementsTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 17,
  },
  strengthText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
  },
  strengthWeak: {
    color: theme.colors.danger,
  },
  strengthFair: {
    color: '#D69E2E',
  },
  strengthGood: {
    color: theme.colors.primaryDark,
  },
  strengthStrong: {
    color: theme.colors.primary,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  strengthBar: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    flex: 1,
    height: 6,
  },
  strengthBarWeak: {
    backgroundColor: theme.colors.danger,
  },
  strengthBarFair: {
    backgroundColor: '#D69E2E',
  },
  strengthBarGood: {
    backgroundColor: theme.colors.primaryDark,
  },
  strengthBarStrong: {
    backgroundColor: theme.colors.primary,
  },
  requirementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  requirementIcon: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  requirementIconValid: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  requirementText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  requirementTextValid: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
  },
  otpFooterContent: {
    gap: theme.spacing.lg,
  },
  resendButton: {
    alignItems: 'center',
    minHeight: 24,
    justifyContent: 'center',
  },
  resendText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  resendTextReady: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
  },
  helpCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  helpEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  helpCopy: {
    flex: 1,
  },
  helpTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 19,
  },
  helpText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  helpLink: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
  },
  discardOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.28)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  discardBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  discardCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    gap: theme.spacing.md,
    maxWidth: 360,
    padding: theme.spacing.lg,
    width: '100%',
  },
  discardTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 21,
    lineHeight: 27,
    textAlign: 'center',
  },
  discardMessage: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  discardActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  discardCancelButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: theme.spacing.lg,
  },
  discardCancelText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  discardButton: {
    alignItems: 'center',
    backgroundColor: '#D96B6B',
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: theme.spacing.lg,
  },
  discardButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  nextButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});

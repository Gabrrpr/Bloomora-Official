import { Eye, EyeOff } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type PressableProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

type AuthScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

type AuthFieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  leftIcon?: React.ReactNode;
  onChangeText: (value: string) => void;
  placeholder: string;
  prefix?: string;
  secureTextEntry?: boolean;
  value: string;
};

type AuthButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'social' | 'danger';
};

export function AuthScreen({ eyebrow, title, subtitle, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, theme.spacing.xl);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboardView}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: 48 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthField({
  autoCapitalize = 'none',
  error,
  keyboardType = 'default',
  label,
  leftIcon,
  onChangeText,
  placeholder,
  prefix,
  secureTextEntry = false,
  value,
}: AuthFieldProps) {
  const [isHidden, setIsHidden] = useState(secureTextEntry);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.inputFrame, error && styles.inputFrameError]}>
        {leftIcon ? <View style={styles.inputIcon}>{leftIcon}</View> : null}
        {prefix ? <Text style={styles.prefixText}>{prefix}</Text> : null}
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isHidden}
          style={styles.input}
          value={value}
        />
        {secureTextEntry ? (
          <Pressable style={styles.eyeButton} onPress={() => setIsHidden((current) => !current)}>
            {isHidden ? (
              <Eye size={theme.icon.sm} color={theme.colors.textMuted} />
            ) : (
              <EyeOff size={theme.icon.sm} color={theme.colors.textMuted} />
            )}
          </Pressable>
        ) : null}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

export function AuthCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function OtpInput({
  error,
  onChangeText,
  value,
}: {
  error?: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length: 4 }, (_, index) => value[index] ?? '');

  function handleChange(text: string, index: number) {
    const nextDigit = text.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];

    nextDigits[index] = nextDigit;
    onChangeText(nextDigits.join('').slice(0, 4));

    if (nextDigit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.otpWrap}>
      <Text style={styles.label}>OTP</Text>
      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              refs.current[index] = ref;
            }}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            style={[styles.otpBox, error && styles.inputFrameError]}
            textAlign="center"
            value={digit}
          />
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function AuthButton({ label, style, variant = 'primary', ...props }: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      style={(state) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'social' && styles.buttonSocial,
        isDanger && styles.buttonDanger,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <Text
        style={[
          styles.buttonText,
          !isPrimary && styles.buttonTextSecondary,
          isDanger && styles.buttonTextDanger,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SocialIconButton({
  children,
  label,
  ...props
}: PressableProps & {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      style={(state) => [styles.socialIconButton, state.pressed && styles.pressed]}
      {...props}>
      {children}
    </Pressable>
  );
}

export const authStyles = StyleSheet.create({
  form: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionGroup: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  linkButton: {
    alignSelf: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: theme.spacing.md,
  },
  successText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  keyboardView: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 72,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 42,
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  inputFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    width: 22,
  },
  inputFrameError: {
    borderColor: theme.colors.danger,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 50,
  },
  prefixText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingRight: theme.spacing.sm,
  },
  eyeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  buttonSocial: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  buttonDanger: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.dangerBorder,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonTextSecondary: {
    color: theme.colors.text,
  },
  buttonTextDanger: {
    color: theme.colors.danger,
  },
  pressed: {
    opacity: 0.84,
  },
  socialIconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  otpWrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  otpRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  otpBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    height: 58,
    width: 58,
  },
});

import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { loginWithPassword } from '@/services/auth-api';

const logo = require('@/assets/images/branding/estings-logo.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const canLogin = username.trim().length > 0 && password.trim().length > 0 && !isSubmitting;

  async function handleLogin() {
    if (!canLogin) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      await loginWithPassword(username, password);
      router.replace('/(tabs)');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSwitchAccount() {
    setUsername('');
    setPassword('');
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
            <Text style={styles.riderName}>CURRENTLY NOT LOGGED IN</Text>
          </View>
        </View>

        <View style={styles.form}>
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

          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </Pressable>

          {loginError ? (
            <View style={styles.errorPanel}>
              <Feather color={theme.colors.danger} name="alert-circle" size={17} />
              <Text selectable style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomArea}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.screenLockButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons color="#525252" name="cellphone-lock" size={17} />
            <Text style={styles.screenLockText}>Log in with screen lock</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.notYouText}>Not you?</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={handleSwitchAccount}>
              <Text style={styles.switchText}>Switch account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          disabled={!canLogin}
          style={({ pressed }) => [styles.loginButton, !canLogin && styles.loginButtonDisabled, pressed && canLogin && styles.pressed]}
          onPress={handleLogin}>
          <Text style={styles.loginButtonText}>{isSubmitting ? 'Logging in...' : 'Log in'}</Text>
        </Pressable>
      </View>
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
        <TextInput
          placeholderTextColor="#BDBDBD"
          style={styles.input}
          value={value}
          {...inputProps}
        />
      </View>
      {rightAccessory ? <View style={styles.fieldAccessory}>{rightAccessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomArea: {
    alignItems: 'center',
    gap: 17,
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
  field: {
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderColor: 'transparent',
    borderRadius: 15,
    borderWidth: 1.4,
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
    borderColor: '#BBBBBB',
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
  fieldLabel: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    lineHeight: 16,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  fieldText: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    ...Platform.select({
      android: {
        gap: 3,
      },
    }),
  },
  floatingFooter: {
    backgroundColor: theme.colors.white,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  forgotButton: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  forgotText: {
    color: '#63AE68',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  form: {
    gap: 18,
    marginTop: -6,
  },
  helpButton: {
    alignItems: 'center',
    backgroundColor: '#484848',
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: 6,
    height: 34,
    paddingLeft: 9,
    paddingRight: 14,
  },
  helpIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    lineHeight: 16,
  },
  hero: {
    alignItems: 'center',
    minHeight: 172,
    justifyContent: 'center',
  },
  input: {
    color: '#555555',
    fontFamily: Fonts.sans,
    fontSize: 19,
    lineHeight: 24,
    padding: 0,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        lineHeight: 25,
        minHeight: 27,
        paddingTop: 1,
        textAlignVertical: 'center',
      },
    }),
  },
  loginButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    justifyContent: 'center',
    minHeight: 58,
  },
  loginButtonDisabled: {
    backgroundColor: '#D8EBD9',
  },
  loginButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    lineHeight: 25,
  },
  logoBlock: {
    gap: 5,
  },
  notYouText: {
    color: '#777777',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  riderIdentity: {
    alignItems: 'center',
    gap: 8,
  },
  riderName: {
    color: '#777777',
    fontFamily: Fonts.montserratBold,
    fontSize: 11,
    letterSpacing: 1,
    lineHeight: 15,
    textAlign: 'center',
  },
  riderRole: {
    color: '#202020',
    fontFamily: Fonts.montserratMedium,
    fontSize: 23,
    letterSpacing: 1,
    lineHeight: 29,
    textAlign: 'center',
  },
  screen: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  screenLockButton: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 12,
  },
  screenLockText: {
    color: '#525252',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
  },
  switchText: {
    color: '#63AE68',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

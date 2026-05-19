import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton, AuthCard, AuthField, AuthScreen, OtpInput, authStyles } from '@/components/auth-ui';
import {
  type FormErrors,
  isFourDigitOtp,
  isValidEmailOrPhone,
  required,
} from '@/utils/auth-validation';

type ForgotField = 'identifier' | 'otp' | 'newPassword' | 'confirmPassword';
type ForgotStep = 'identifier' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<ForgotStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors<ForgotField>>({});

  function validateIdentifier() {
    const nextErrors: FormErrors<ForgotField> = {};

    if (!required(identifier)) {
      nextErrors.identifier = 'Email or phone is required.';
    } else if (!isValidEmailOrPhone(identifier)) {
      nextErrors.identifier = 'Enter a valid email or Philippine phone number.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function validateOtp() {
    const nextErrors: FormErrors<ForgotField> = {};

    if (!required(otp)) {
      nextErrors.otp = 'OTP is required.';
    } else if (!isFourDigitOtp(otp)) {
      nextErrors.otp = 'OTP must be 4 digits.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function validateReset() {
    const nextErrors: FormErrors<ForgotField> = {};

    if (!required(newPassword)) {
      nextErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters.';
    }

    if (!required(confirmPassword)) {
      nextErrors.confirmPassword = 'Confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSendOtp() {
    if (validateIdentifier()) {
      setOtpMessage('OTP sent for demo purposes.');
      setStep('otp');
    }
  }

  function handleVerifyOtp() {
    if (validateOtp()) {
      setStep('reset');
    }
  }

  function handleResetPassword() {
    if (validateReset()) {
      router.replace('/login');
    }
  }

  return (
    <AuthScreen
      eyebrow="Account recovery"
      title={
        step === 'identifier'
          ? 'Forgot password'
          : step === 'otp'
            ? 'Verify OTP'
            : 'Reset password'
      }
      subtitle={
        step === 'identifier'
          ? 'Enter your email or phone number first to receive an OTP.'
          : step === 'otp'
            ? 'Enter the 4-digit code before changing your password.'
            : 'Choose a new password for your account.'
      }>
      {step === 'identifier' ? (
        <View style={authStyles.form}>
          <AuthCard title="Account Details">
            <AuthField
              error={errors.identifier}
              keyboardType="email-address"
              label="Email or phone"
              onChangeText={setIdentifier}
              placeholder="Email address or phone number"
              value={identifier}
            />
          </AuthCard>

          <View style={authStyles.actionGroup}>
            <AuthButton label="Send OTP" onPress={handleSendOtp} />

            <Pressable style={authStyles.linkButton} onPress={() => router.replace('/login')}>
              <Text style={authStyles.linkText}>Back to Sign In</Text>
            </Pressable>
          </View>
        </View>
      ) : step === 'otp' ? (
        <View style={authStyles.form}>
          {otpMessage ? <Text style={authStyles.successText}>{otpMessage}</Text> : null}
          <OtpInput error={errors.otp} onChangeText={setOtp} value={otp} />

          <View style={authStyles.actionGroup}>
            <AuthButton label="Verify OTP" onPress={handleVerifyOtp} />
            <AuthButton
              label="Change Email or Phone"
              variant="secondary"
              onPress={() => setStep('identifier')}
            />
          </View>
        </View>
      ) : (
        <View style={authStyles.form}>
          <AuthCard title="Security Details">
            <AuthField
              error={errors.newPassword}
              label="New password"
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              value={newPassword}
            />
            <AuthField
              error={errors.confirmPassword}
              label="Confirm password"
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secureTextEntry
              value={confirmPassword}
            />
          </AuthCard>

          <View style={authStyles.actionGroup}>
            <AuthButton label="Reset Password" onPress={handleResetPassword} />
            <AuthButton label="Back to OTP" variant="secondary" onPress={() => setStep('otp')} />
          </View>
        </View>
      )}
    </AuthScreen>
  );
}

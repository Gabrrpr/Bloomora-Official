import { router } from 'expo-router';
import {
  CalendarDays,
  Check,
  ArrowLeft,
  CircleHelp,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  MapPin,
  Mars,
  ShieldCheck,
  UserRound,
  Venus,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressMapPicker } from '@/components/address-map-picker';
import { Fonts, theme } from '@/constants/theme';
import {
  authenticateWithBiometrics,
  getBiometricsAvailability,
  type BiometricsAvailability,
} from '@/services/biometrics';
import { registerWithPassword, sendSignUpOtp, verifySignUpOtp } from '@/services/auth-api';
import {
  type FormErrors,
  isSixDigitOtp,
  isValidEmail,
  isValidPhilippinePhone,
  isValidPersonName,
  required,
} from '@/utils/auth-validation';

type SignUpField =
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'birthdate'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'
  | 'otp';
type SignUpPhase = 1 | 2 | 3;
type SecurityStep = 'otp' | 'privacy' | 'biometrics';
type GenderOption = 'Female' | 'Male' | 'Prefer not to say';
type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong';

const genderOptions: {
  icon: typeof UserRound;
  label: GenderOption;
}[] = [
  { icon: Venus, label: 'Female' },
  { icon: Mars, label: 'Male' },
  { icon: CircleHelp, label: 'Prefer not to say' },
];

const phaseLabels = ['Personal\nInformation', 'Set Up\nSecurity', 'Personalize\nProfile'];
const birthdateMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const strengthAnim = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState<SignUpPhase>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [securityStep, setSecurityStep] = useState<SecurityStep>('otp');
  const [address, setAddress] = useState('');
  const [profileNote, setProfileNote] = useState('');
  const [errors, setErrors] = useState<FormErrors<SignUpField>>({});
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isProtectionVisible, setIsProtectionVisible] = useState(false);
  const [isDiscardVisible, setIsDiscardVisible] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [biometricsAvailability, setBiometricsAvailability] = useState<BiometricsAvailability | null>(null);
  const [biometricsMessage, setBiometricsMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEnablingBiometrics, setIsEnablingBiometrics] = useState(false);

  const hasEnteredSignUpData = [
    firstName,
    lastName,
    gender,
    birthdate,
    email,
    phone,
    password,
    confirmPassword,
    otp,
    address,
    profileNote,
  ].some((value) => value.trim().length > 0);
  const hasPasswordInput = password.length > 0;
  const passwordRules = useMemo(() => getPasswordRules(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(passwordRules), [passwordRules]);
  const isPasswordValid = hasPasswordInput && passwordRules.every((rule) => rule.isValid);
  const canContinuePersonalInfo =
    isValidPersonName(firstName) &&
    isValidPersonName(lastName) &&
    required(gender) &&
    required(birthdate) &&
    isValidEmail(email) &&
    isValidPhilippinePhone(`+63${phone}`) &&
    isPasswordValid &&
    required(confirmPassword);

  useEffect(() => {
    Animated.timing(strengthAnim, {
      duration: 180,
      toValue: hasPasswordInput ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [hasPasswordInput, strengthAnim]);

  useEffect(() => {
    let isMounted = true;

    getBiometricsAvailability().then((availability) => {
      if (isMounted) {
        setBiometricsAvailability(availability);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (phase === 2 && securityStep === 'otp') {
      setResendSeconds(30);
    }
  }, [phase, securityStep]);

  useEffect(() => {
    if (phase !== 2 || securityStep !== 'otp' || resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, resendSeconds, securityStep]);

  function setFieldError(field: SignUpField, message?: string) {
    setErrors((current) => {
      const nextErrors = { ...current };

      if (message) {
        nextErrors[field] = message;
      } else {
        delete nextErrors[field];
      }

      return nextErrors;
    });
  }

  function validatePersonalInfo() {
    const nextErrors: FormErrors<SignUpField> = {};

    if (!required(firstName)) {
      nextErrors.firstName = 'First name is required.';
    } else if (!isValidPersonName(firstName)) {
      nextErrors.firstName = 'Use letters, spaces, hyphens, or apostrophes only.';
    }

    if (!required(lastName)) {
      nextErrors.lastName = 'Last name is required.';
    } else if (!isValidPersonName(lastName)) {
      nextErrors.lastName = 'Use letters, spaces, hyphens, or apostrophes only.';
    }

    if (!required(gender)) {
      nextErrors.gender = 'Choose one option.';
    }

    if (!required(birthdate)) {
      nextErrors.birthdate = 'Birthdate is required.';
    }

    if (!required(email)) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!required(phone)) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!isValidPhilippinePhone(`+63${phone}`)) {
      nextErrors.phone = 'Enter a valid Philippine phone number.';
    }

    if (!required(password)) {
      nextErrors.password = 'Password is required.';
    } else if (!isPasswordValid) {
      nextErrors.password = 'Complete all password requirements.';
    }

    if (!required(confirmPassword)) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleBack() {
    if (phase === 1) {
      if (hasEnteredSignUpData) {
        setIsDiscardVisible(true);
        return;
      }

      router.back();
      return;
    }

    if (phase === 2 && securityStep === 'privacy') {
      setSecurityStep('otp');
      return;
    }

    if (phase === 2 && securityStep === 'biometrics') {
      setSecurityStep('privacy');
      return;
    }

    setPhase((current) => (current - 1) as SignUpPhase);
  }

  function handleSignInPress() {
    if (hasEnteredSignUpData) {
      setIsDiscardVisible(true);
      return;
    }

    router.replace('/login');
  }

  function handleDiscardAndSignIn() {
    setIsDiscardVisible(false);
    router.replace('/login');
  }

  async function handlePersonalInfoContinue() {
    if (isSendingOtp || !validatePersonalInfo()) {
      return;
    }

    setIsSendingOtp(true);
    setSubmitError(null);

    try {
      await sendSignUpOtp(email);
      setSecurityStep('otp');
      setPhase(2);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to send the verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (isVerifyingOtp) {
      return;
    }

    if (!required(otp)) {
      setErrors({ otp: 'Enter the 6-digit code sent to your email.' });
      return;
    }

    if (!isSixDigitOtp(otp)) {
      setErrors({ otp: 'Code must be 6 digits.' });
      return;
    }

    setErrors({});
    setIsVerifyingOtp(true);
    setSubmitError(null);

    try {
      await verifySignUpOtp(email, otp);
      await registerWithPassword({
        address,
        email,
        firstName,
        lastName,
        password,
        phoneNumber: `+63${phone}`,
      });
      setSecurityStep('privacy');
      setIsProtectionVisible(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to verify and create your account.');
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendCode() {
    if (resendSeconds > 0) {
      return;
    }

    setSubmitError(null);
    try {
      await sendSignUpOtp(email);
      setResendSeconds(30);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to resend the verification code.');
    }
  }

  function handleAgreeAndContinue() {
    setIsProtectionVisible(false);
    setSecurityStep('biometrics');
  }

  async function handleEnableBiometrics() {
    if (isEnablingBiometrics) {
      return;
    }

    setIsEnablingBiometrics(true);
    setBiometricsMessage(null);

    try {
      const availability = await getBiometricsAvailability();
      setBiometricsAvailability(availability);

      if (!availability.isAvailable) {
        setBiometricsMessage(availability.unavailableReason ?? 'Biometrics are unavailable on this device.');
        return;
      }

      const result = await authenticateWithBiometrics(`Enable ${availability.label} for Esting's.`);

      if (result.success) {
        setBiometricsMessage(`${availability.label} is enabled for your Esting's account.`);
        setPhase(3);
        return;
      }

      setBiometricsMessage(result.error ?? 'Biometric setup was not completed.');
    } catch (error) {
      setBiometricsMessage(error instanceof Error ? error.message : 'Biometric setup is unavailable right now.');
    } finally {
      setIsEnablingBiometrics(false);
    }
  }

  function handleFinish() {
    router.replace('/login');
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
            paddingBottom: insets.bottom + 120,
            paddingTop: insets.top + theme.spacing.lg,
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={28} color={theme.colors.primary} strokeWidth={2.3} />
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.signInButton} onPress={handleSignInPress}>
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        </View>

        <PhaseProgress currentPhase={phase} />

        {phase === 1 ? (
          <View style={styles.phaseBody}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>{"Add your basic details to get started."}</Text>
            </View>

            <View style={styles.formPanel}>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <OnboardingField
                    autoCapitalize="words"
                    error={errors.firstName}
                    label="First name"
                    onChangeText={(value) => {
                      setFirstName(value);
                      setFieldError('firstName', getNameFieldError(value, 'First name'));
                    }}
                    placeholder="Juan"
                    value={firstName}
                  />
                </View>
                <View style={styles.nameField}>
                  <OnboardingField
                    autoCapitalize="words"
                    error={errors.lastName}
                    label="Last name"
                    onChangeText={(value) => {
                      setLastName(value);
                      setFieldError('lastName', getNameFieldError(value, 'Last name'));
                    }}
                    placeholder="Dela Cruz"
                    value={lastName}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderGrid}>
                  {genderOptions.map((option) => (
                    <GenderButton
                      key={option.label}
                      icon={option.icon}
                      isSelected={gender === option.label}
                      label={option.label}
                      onPress={() => {
                        setGender(option.label);
                        setFieldError('gender');
                      }}
                    />
                  ))}
                </View>
                {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.dateField, errors.birthdate && styles.inputError]}
                  onPress={() => setIsCalendarVisible(true)}>
                  <View style={styles.dateCopy}>
                    <Text style={[styles.onboardingFieldLabel, errors.birthdate && styles.onboardingFieldLabelError]}>
                      Birthdate
                    </Text>
                    <View style={styles.dateLine}>
                      <CalendarDays size={theme.icon.sm} color={theme.colors.textMuted} strokeWidth={2.1} />
                      <Text style={[styles.dateText, !birthdate && styles.placeholderText]}>
                        {birthdate || 'Select birthdate'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                {errors.birthdate ? <Text style={styles.errorText}>{errors.birthdate}</Text> : null}
              </View>

              <OnboardingField
                error={errors.email}
                icon={Mail}
                keyboardType="email-address"
                label="Email"
                onChangeText={(value) => {
                  setEmail(value);
                  setFieldError('email', !value || isValidEmail(value) ? undefined : 'Enter a valid email address.');
                }}
                placeholder="your@email.com"
                value={email}
              />

              <OnboardingField
                error={errors.phone}
                keyboardType="phone-pad"
                label="Phone number"
                onChangeText={(value) => {
                  const nextPhone = normalizeSignupPhoneNumber(value);

                  setPhone(nextPhone);
                  setFieldError(
                    'phone',
                    !nextPhone || isValidPhilippinePhone(`+63${nextPhone}`)
                      ? undefined
                      : 'Enter a valid Philippine phone number.',
                  );
                }}
                placeholder="917 123 4567"
                prefix="+63"
                value={formatSignupPhoneNumber(phone)}
              />

              <OnboardingField
                error={errors.password}
                icon={LockKeyhole}
                label="Password"
                onChangeText={(value) => {
                  setPassword(value);
                  setFieldError(
                    'password',
                    !value || getPasswordRules(value).every((rule) => rule.isValid)
                      ? undefined
                      : 'Complete all password requirements.',
                  );
                }}
                placeholder="Create a secure password"
                secureTextEntry
                value={password}
              />

              {hasPasswordInput ? (
                <Animated.View
                  style={[
                    styles.passwordStatus,
                    {
                      opacity: strengthAnim,
                      transform: [
                        {
                          translateY: strengthAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-8, 0],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <PasswordStrengthMeter strength={passwordStrength} />
                  <View style={styles.requirements}>
                    {passwordRules.map((rule) => (
                      <RequirementRow key={rule.label} isValid={rule.isValid} label={rule.label} />
                    ))}
                  </View>
                </Animated.View>
              ) : null}

              <OnboardingField
                error={errors.confirmPassword}
                icon={LockKeyhole}
                label="Confirm password"
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setFieldError('confirmPassword');
                }}
                placeholder="Re-enter your password"
                secureTextEntry
                value={confirmPassword}
              />
            </View>

            {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}
            <PrimaryButton
              disabled={!canContinuePersonalInfo || isSendingOtp}
              label={isSendingOtp ? 'Sending code...' : 'Continue'}
              onPress={handlePersonalInfoContinue}
            />
          </View>
        ) : null}

        {phase === 2 ? (
          <View style={styles.securityBody}>
            {securityStep === 'otp' ? (
              <>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Verify your email</Text>
                  <Text style={styles.subtitle}>We sent a 6-digit code to {email || 'your email'}.</Text>
                </View>

                <View style={styles.otpPanel}>
                  <Text style={styles.otpLabel}>Enter code</Text>
                  <OtpCodeInput error={errors.otp} value={otp} onChangeText={setOtp} />
                </View>

                <View style={styles.otpFooterContent}>
                  {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}
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
                    <View style={styles.helpIcon}>
                      <CircleHelp size={20} color={theme.colors.primary} strokeWidth={2.2} />
                    </View>
                    <View style={styles.helpCopy}>
                      <Text style={styles.helpTitle}>Need Help?</Text>
                      <Text style={styles.helpText}>
                        Visit our <Text style={styles.helpLink}>Help Center</Text> to learn more
                      </Text>
                    </View>
                  </Pressable>
                </View>

                <View style={styles.stickyActions}>
                  <PrimaryButton
                    disabled={isVerifyingOtp}
                    label={isVerifyingOtp ? 'Creating account...' : 'Verify Code'}
                    onPress={handleVerifyOtp}
                  />
                  <SecondaryButton label="Edit email" onPress={() => setPhase(1)} />
                </View>
              </>
            ) : securityStep === 'privacy' ? (
              <>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Would you like to enable biometrics?</Text>
                  <Text style={styles.subtitle}>First, review how your account data is handled.</Text>
                </View>

                <View style={styles.biometricHero}>
                  <View style={styles.biometricIcon}>
                    <Fingerprint size={74} color={theme.colors.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.biometricTitle}>Security setup continues after consent.</Text>
                </View>

                <View style={styles.stickyActions}>
                  <PrimaryButton label="Review Protection" onPress={() => setIsProtectionVisible(true)} />
                  <SecondaryButton label="Back to Code" onPress={() => setSecurityStep('otp')} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Would you like to enable biometrics?</Text>
                  <Text style={styles.subtitle}>Use your device biometrics for faster access and protected profile changes.</Text>
                </View>

                <View style={styles.biometricHero}>
                  <View style={styles.biometricIcon}>
                    <Fingerprint size={74} color={theme.colors.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.biometricTitle}>
                    Use {biometricsAvailability?.label ?? 'biometrics'} saved on this device
                  </Text>
                  {biometricsMessage ? <Text style={styles.biometricMessage}>{biometricsMessage}</Text> : null}
                </View>

                <View style={styles.stickyActions}>
                  <PrimaryButton
                    disabled={isEnablingBiometrics}
                    label={isEnablingBiometrics ? 'Waiting for fingerprint...' : 'Enable'}
                    onPress={handleEnableBiometrics}
                  />
                  <SecondaryButton label="Skip" onPress={() => !isEnablingBiometrics && setPhase(3)} />
                </View>
              </>
            )}
          </View>
        ) : null}

        {phase === 3 ? (
          <View style={styles.phaseBody}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Personalize your profile</Text>
              <Text style={styles.subtitle}>Pin your delivery area or skip for now.</Text>
            </View>

            <View style={styles.profilePanel}>
              <View style={styles.panelTitleRow}>
                <MapPin size={theme.icon.sm} color={theme.colors.primary} strokeWidth={2.1} />
                <Text style={styles.panelTitle}>Delivery location</Text>
              </View>
              <AddressMapPicker onAddressChange={setAddress} />
              <LabeledInput
                icon={MapPin}
                label="Delivery address"
                multiline
                onChangeText={setAddress}
                placeholder="Street, barangay, city, province"
                value={address}
              />
              <LabeledInput
                icon={UserRound}
                label="Profile note"
                onChangeText={setProfileNote}
                placeholder="Example: prefers pastel bouquets"
                value={profileNote}
              />
            </View>

            <View style={styles.stickyActions}>
              <PrimaryButton label="Finish Account Setup" onPress={handleFinish} />
              <SecondaryButton label="Skip for now" onPress={handleFinish} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <BirthdateModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onSelect={(value) => {
          setBirthdate(value);
          setFieldError('birthdate');
          setIsCalendarVisible(false);
        }}
      />
      <ProtectionConsentSheet
        visible={isProtectionVisible}
        onAgree={handleAgreeAndContinue}
        onDecline={() => {
          setIsProtectionVisible(false);
          setSecurityStep('otp');
        }}
      />
      <DiscardSignUpModal
        visible={isDiscardVisible}
        onCancel={() => setIsDiscardVisible(false)}
        onDiscard={handleDiscardAndSignIn}
      />
    </KeyboardAvoidingView>
  );
}

function PhaseProgress({ currentPhase }: { currentPhase: SignUpPhase }) {
  const { width } = useWindowDimensions();
  const trackWidth = Math.min(Math.max(width - theme.spacing.lg * 2, 252), 420);
  const stepCenters = [trackWidth / 6, trackWidth / 2, (trackWidth * 5) / 6];
  const connectorWidth = Math.max(stepCenters[1] - stepCenters[0] - 58, 28);
  const firstState = getPhaseState(1, currentPhase);
  const secondState = getPhaseState(2, currentPhase);
  const thirdState = getPhaseState(3, currentPhase);

  return (
    <View style={[styles.progressWrap, { width: trackWidth }]}>
      <View style={[styles.progressSteps, { width: trackWidth }]}>
        <StepCircle phaseNumber={1} state={firstState} style={{ left: stepCenters[0] - 20 }} />
        <ProgressConnector
          isActive={currentPhase === 1}
          isComplete={currentPhase > 1}
          style={{ left: stepCenters[0] + 29, width: connectorWidth }}
        />
        <StepCircle phaseNumber={2} state={secondState} style={{ left: stepCenters[1] - 20 }} />
        <ProgressConnector
          isActive={currentPhase === 2}
          isComplete={currentPhase > 2}
          style={{ left: stepCenters[1] + 29, width: connectorWidth }}
        />
        <StepCircle phaseNumber={3} state={thirdState} style={{ left: stepCenters[2] - 20 }} />
      </View>
      <View style={[styles.progressLabels, { width: trackWidth }]}>
        {phaseLabels.map((label, index) => {
          const phaseNumber = (index + 1) as SignUpPhase;
          const isActive = phaseNumber === currentPhase;

          return (
            <View key={label} style={styles.phaseLabelSlot}>
              <Text style={[styles.phaseLabel, isActive && styles.phaseLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StepCircle({
  phaseNumber,
  state,
  style,
}: {
  phaseNumber: SignUpPhase;
  state: 'active' | 'done' | 'upcoming';
  style?: object;
}) {
  const isActive = state === 'active';
  const isDone = state === 'done';

  return (
    <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isDone && styles.stepCircleDone, style]}>
      {isDone ? (
        <Check size={18} color={theme.colors.primary} strokeWidth={2.8} />
      ) : (
        <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{phaseNumber}</Text>
      )}
    </View>
  );
}

function ProgressConnector({
  isActive,
  isComplete,
  style,
}: {
  isActive: boolean;
  isComplete: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.connector, style]}>
      <View style={[styles.connectorFill, isComplete && styles.connectorFillComplete, isActive && styles.connectorFillActive]} />
    </View>
  );
}

function GenderButton({
  icon: Icon,
  isSelected,
  label,
  onPress,
}: {
  icon: typeof UserRound;
  isSelected: boolean;
  label: GenderOption;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.genderButton,
        isSelected && label === 'Female' && styles.genderButtonFemaleSelected,
        isSelected && label === 'Male' && styles.genderButtonMaleSelected,
        isSelected && label === 'Prefer not to say' && styles.genderButtonNeutralSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      <Icon size={21} color={getGenderAccentColor(label, isSelected)} strokeWidth={2.1} />
      <Text style={[styles.genderText, isSelected && styles.genderTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function RequirementRow({ isValid, label }: { isValid: boolean; label: string }) {
  return (
    <View style={styles.requirementRow}>
      <View style={[styles.requirementDot, isValid && styles.requirementDotValid]}>
        {isValid ? <Check size={10} color={theme.colors.white} strokeWidth={3} /> : null}
      </View>
      <Text style={[styles.requirementText, isValid && styles.requirementTextValid]}>{label}</Text>
    </View>
  );
}

function PasswordStrengthMeter({ strength }: { strength: PasswordStrength }) {
  const activeBars = getStrengthBars(strength);

  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthLabel}>Password strength</Text>
        <Text style={[styles.strengthValue, styles[`strength${strength}`]]}>{strength}</Text>
      </View>
      <View style={styles.strengthBars}>
        {Array.from({ length: 4 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              index < activeBars && styles.strengthBarActive,
              index < activeBars && styles[`strengthBar${strength}`],
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function OtpCodeInput({
  error,
  onChangeText,
  value,
}: {
  error?: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<TextInput | null>(null);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const activeIndex = value.length >= digits.length ? -1 : value.length;

  function handleChange(text: string) {
    onChangeText(text.replace(/\D/g, '').slice(0, 6));
  }

  return (
    <Pressable style={styles.otpWrap} onPress={() => inputRef.current?.focus()}>
      <View style={styles.otpInputWrap}>
        <View style={styles.otpRow} pointerEvents="none">
          {digits.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                isFocused && activeIndex >= 0 && index === activeIndex && styles.otpBoxActive,
                error && styles.otpBoxError,
              ]}>
              <Text style={[styles.otpDigit, !digit && styles.otpPlaceholder]}>{digit || '-'}</Text>
            </View>
          ))}
        </View>
        <TextInput
          ref={inputRef}
          caretHidden
          keyboardType="number-pad"
          maxLength={6}
          onBlur={() => setIsFocused(false)}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          selection={{ end: value.length, start: value.length }}
          style={styles.hiddenOtpInput}
          value={value}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Pressable>
  );
}

function ProtectionConsentSheet({
  onAgree,
  onDecline,
  visible,
}: {
  onAgree: () => void;
  onDecline: () => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onDecline}>
      <View style={styles.protectionOverlay}>
        <TouchableWithoutFeedback onPress={onDecline}>
          <View style={styles.protectionBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.protectionSheet}>
          <View style={styles.protectionPanel}>
            <View style={styles.protectionHero}>
              <View style={styles.protectionIconLarge}>
                <ShieldCheck size={44} color={theme.colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.protectionTitle}>You are protected</Text>
              <Text style={styles.protectionSubtitle}>Keeping your data safe</Text>
            </View>

            <View style={styles.privacyCopy}>
              <Text style={styles.privacyText}>
                By continuing, you agree to the collection and use of the information you provided for your Esting&apos;s account.
              </Text>
              <Text style={styles.privacyText}>
                This may include personal information needed to verify your account and complete flower orders.
              </Text>
              <Text style={styles.privacyText}>
                Please review our{' '}
                <Text style={styles.privacyLink} onPress={() => router.push('/terms-and-condition')}>
                  Terms and Conditions
                </Text>
                .
              </Text>
            </View>
          </View>

          <View style={styles.stickyActions}>
            <PrimaryButton label="Agree and Continue" onPress={onAgree} />
            <SecondaryButton label="No, Thanks" onPress={onDecline} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DiscardSignUpModal({
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
          <Text style={styles.discardTitle}>Discard account setup?</Text>
          <Text style={styles.discardMessage}>
            All information you entered will be lost if you go back to Sign In.
          </Text>
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
              <Text style={styles.discardButtonText}>Discard and Sign In</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OnboardingField({
  autoCapitalize = 'none',
  error,
  icon: Icon,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  prefix,
  secureTextEntry = false,
  value,
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  icon?: typeof UserRound;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  prefix?: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  const [isHidden, setIsHidden] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.onboardingFieldWrap}>
      <View style={[styles.onboardingInputFrame, isFocused && styles.inputFrameFocused, error && styles.inputError]}>
        <View style={styles.onboardingInputCopy}>
          <Text style={[styles.onboardingFieldLabel, error && styles.onboardingFieldLabelError]}>{label}</Text>
          <View style={styles.onboardingInputLine}>
            {Icon ? (
              <View style={styles.inputIcon}>
                <Icon size={theme.icon.sm} color={theme.colors.textMuted} strokeWidth={2.1} />
              </View>
            ) : null}
            {prefix ? <Text style={styles.prefixText}>{prefix}</Text> : null}
            <TextInput
              autoCapitalize={autoCapitalize}
              keyboardType={keyboardType}
              onBlur={() => setIsFocused(false)}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={isHidden}
              style={styles.onboardingInput}
              value={value}
            />
          </View>
        </View>
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

function LabeledInput({
  icon: Icon,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.labeledInputWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.profileInputFrame, multiline && styles.profileInputFrameTall]}>
        <Icon size={theme.icon.sm} color={theme.colors.textMuted} strokeWidth={2.1} />
        <TextInput
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.profileInput, multiline && styles.profileInputTall]}
          value={value}
        />
      </View>
    </View>
  );
}

function PrimaryButton({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [styles.primaryButton, disabled && styles.buttonDisabled, pressed && !disabled && styles.pressed]}
      onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function BirthdateModal({
  onClose,
  onSelect,
  visible,
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  visible: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, index) => currentYear - 12 - index);
  const [selectedYear, setSelectedYear] = useState(currentYear - 18);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const dayCount = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: dayCount }, (_, index) => index + 1);

  function handleSelectMonth(monthIndex: number) {
    setSelectedMonth(monthIndex);
    setSelectedDay((current) => Math.min(current, getDaysInMonth(selectedYear, monthIndex)));
  }

  function handleSelectYear(year: number) {
    setSelectedYear(year);
    setSelectedDay((current) => Math.min(current, getDaysInMonth(year, selectedMonth)));
  }

  function handleDone() {
    onSelect(formatBirthdateValue(selectedYear, selectedMonth, selectedDay));
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.birthdateSheet}>
          <Text style={styles.sheetTitle}>Select birthdate</Text>
          <Text style={styles.sheetSubtitle}>{formatBirthdateDisplay(selectedYear, selectedMonth, selectedDay)}</Text>

          <View style={styles.birthdatePickerGrid}>
            <View style={styles.birthdatePickerColumn}>
              <Text style={styles.pickerColumnTitle}>Month</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
                {birthdateMonths.map((month, index) => (
                  <PickerOption
                    key={month}
                    isSelected={selectedMonth === index}
                    label={month.slice(0, 3)}
                    onPress={() => handleSelectMonth(index)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.birthdatePickerColumn}>
              <Text style={styles.pickerColumnTitle}>Day</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
                {days.map((day) => (
                  <PickerOption
                    key={day}
                    isSelected={selectedDay === day}
                    label={`${day}`}
                    onPress={() => setSelectedDay(day)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.birthdatePickerColumn}>
              <Text style={styles.pickerColumnTitle}>Year</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerList}>
                {years.map((year) => (
                  <PickerOption
                    key={year}
                    isSelected={selectedYear === year}
                    label={`${year}`}
                    onPress={() => handleSelectYear(year)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.sheetActions}>
            <PrimaryButton label="Use Birthdate" onPress={handleDone} />
            <SecondaryButton label="Cancel" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PickerOption({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.pickerOption, isSelected && styles.pickerOptionSelected, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>{label}</Text>
    </Pressable>
  );
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

function getGenderAccentColor(label: GenderOption, isSelected: boolean) {
  if (!isSelected) {
    return theme.colors.textMuted;
  }

  if (label === 'Female') {
    return '#C75B8A';
  }

  if (label === 'Male') {
    return '#3478D8';
  }

  return theme.colors.primary;
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatBirthdateValue(year: number, monthIndex: number, day: number) {
  const month = `${monthIndex + 1}`.padStart(2, '0');
  const date = `${day}`.padStart(2, '0');

  return `${year}-${month}-${date}`;
}

function formatBirthdateDisplay(year: number, monthIndex: number, day: number) {
  return `${birthdateMonths[monthIndex]} ${day}, ${year}`;
}

function normalizeSignupPhoneNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}

function formatSignupPhoneNumber(value: string) {
  const digits = normalizeSignupPhoneNumber(value);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function getNameFieldError(value: string, label: 'First name' | 'Last name') {
  if (!required(value)) {
    return `${label} is required.`;
  }

  if (!isValidPersonName(value)) {
    return 'Use letters, spaces, hyphens, or apostrophes only.';
  }

  return undefined;
}

function getPhaseState(phaseNumber: SignUpPhase, currentPhase: SignUpPhase) {
  if (phaseNumber < currentPhase) {
    return 'done';
  }

  if (phaseNumber === currentPhase) {
    return 'active';
  }

  return 'upcoming';
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
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -8,
    width: 42,
  },
  signInButton: {
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: theme.spacing.sm,
  },
  signInText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  progressWrap: {
    alignSelf: 'center',
    gap: 7,
    minHeight: 82,
  },
  progressSteps: {
    height: 42,
    position: 'relative',
  },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 40,
  },
  stepCircleActive: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  stepCircleDone: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  stepNumber: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
  stepNumberActive: {
    color: theme.colors.primary,
  },
  connector: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    height: 4,
    overflow: 'hidden',
    position: 'absolute',
    top: 18,
  },
  connectorFill: {
    height: '100%',
    width: 0,
  },
  connectorFillActive: {
    backgroundColor: theme.colors.primary,
    height: '100%',
    width: '55%',
  },
  connectorFillComplete: {
    backgroundColor: theme.colors.primary,
    height: '100%',
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
  },
  phaseLabelSlot: {
    alignItems: 'center',
    flex: 1,
  },
  phaseLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    minHeight: 34,
    textAlign: 'center',
  },
  phaseLabelActive: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
  },
  phaseBody: {
    gap: theme.spacing.lg,
  },
  securityBody: {
    flex: 1,
    gap: theme.spacing.xl,
    minHeight: 560,
  },
  otpPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  otpLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  otpWrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: '100%',
  },
  otpInputWrap: {
    position: 'relative',
    width: '100%',
  },
  hiddenOtpInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    fontSize: 1,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: 'transparent',
    borderRadius: 17,
    borderWidth: 1.3,
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 22,
    height: 64,
    justifyContent: 'center',
  },
  otpBoxError: {
    borderColor: theme.colors.danger,
  },
  otpBoxActive: {
    borderColor: theme.colors.textMuted,
  },
  otpDigit: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
  },
  otpPlaceholder: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
  },
  otpFooterContent: {
    gap: theme.spacing.lg,
  },
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
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
  helpIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF8F2',
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
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
  protectionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  protectionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 42, 36, 0.52)',
  },
  protectionSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: theme.spacing.lg,
    maxHeight: '86%',
    padding: theme.spacing.lg,
  },
  protectionPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.lg,
    overflow: 'hidden',
  },
  protectionHero: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  protectionIconLarge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(46, 139, 52, 0.14)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  protectionTitle: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 25,
    textAlign: 'center',
  },
  protectionSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  privacyCopy: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  privacyText: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  privacyLink: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
  },
  discardOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  discardBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 42, 36, 0.48)',
  },
  discardCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 420,
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
  headerCopy: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  formPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  nameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  nameField: {
    flex: 1,
    minWidth: 0,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  onboardingFieldWrap: {
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  onboardingInputFrame: {
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
  inputFrameFocused: {
    borderColor: theme.colors.textMuted,
  },
  onboardingInputCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  onboardingFieldLabel: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  onboardingFieldLabelError: {
    color: theme.colors.danger,
  },
  onboardingInputLine: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  inputIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    width: 22,
  },
  onboardingInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 26,
    minWidth: 0,
    padding: 0,
  },
  prefixText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    paddingRight: theme.spacing.sm,
  },
  eyeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  genderGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  genderButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'transparent',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    minHeight: 76,
    paddingHorizontal: theme.spacing.xs,
  },
  genderButtonFemaleSelected: {
    backgroundColor: '#FDECF4',
    borderColor: '#F3B8D2',
  },
  genderButtonMaleSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#B9D7FF',
  },
  genderButtonNeutralSelected: {
    backgroundColor: '#EEF8F2',
    borderColor: '#B7DEC1',
  },
  genderText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  genderTextSelected: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  submitErrorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  dateField: {
    backgroundColor: '#F7F7F7',
    borderColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1.3,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  dateCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  dateLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  dateText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    minWidth: 0,
  },
  placeholderText: {
    color: theme.colors.textMuted,
  },
  passwordStatus: {
    gap: theme.spacing.md,
  },
  requirements: {
    gap: theme.spacing.xs,
  },
  requirementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  requirementDot: {
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  requirementDotValid: {
    backgroundColor: theme.colors.primary,
  },
  requirementText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  requirementTextValid: {
    color: theme.colors.text,
  },
  strengthWrap: {
    gap: theme.spacing.sm,
  },
  strengthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  strengthValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  strengthWeak: {
    color: theme.colors.danger,
  },
  strengthFair: {
    color: '#B7791F',
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
  strengthBarActive: {
    backgroundColor: theme.colors.primary,
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
  matchText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
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
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    borderWidth: 1.4,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  biometricHero: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  biometricIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 132,
    justifyContent: 'center',
    width: 132,
  },
  biometricTitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  biometricMessage: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  stickyActions: {
    gap: theme.spacing.md,
  },
  profilePanel: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  panelTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
  labeledInputWrap: {
    gap: theme.spacing.sm,
  },
  profileInputFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  profileInputFrameTall: {
    alignItems: 'flex-start',
    minHeight: 92,
    paddingTop: theme.spacing.md,
  },
  profileInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 48,
    padding: 0,
  },
  profileInputTall: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  birthdateSheet: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.md,
    maxHeight: 620,
    padding: theme.spacing.lg,
    width: '100%',
  },
  sheetTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  birthdatePickerGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  birthdatePickerColumn: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  pickerColumnTitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 250,
  },
  pickerOption: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  pickerOptionSelected: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
  },
  pickerOptionText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  pickerOptionTextSelected: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
  },
  sheetActions: {
    gap: theme.spacing.md,
  },
});

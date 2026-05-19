import { router } from 'expo-router';
import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton, AuthField, AuthScreen, OtpInput, authStyles } from '@/components/auth-ui';
import { theme } from '@/constants/theme';
import {
  type FormErrors,
  isFourDigitOtp,
  isValidEmail,
  isValidPhilippinePhone,
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
  | 'terms'
  | 'otp';
type SignUpStep = 'details' | 'otp';
type CalendarMode = 'day' | 'month' | 'year';
type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong';

const monthNames = [
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

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function SignUpScreen() {
  const [step, setStep] = useState<SignUpStep>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors<SignUpField>>({});
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialCalendarMonth());
  const [selectedBirthdate, setSelectedBirthdate] = useState<Date | null>(null);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('day');

  const passwordRules = useMemo(() => getPasswordRules(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(passwordRules), [passwordRules]);
  const isPasswordValid = passwordRules.every((rule) => rule.isValid);
  const isDetailsFormValid =
    required(firstName) &&
    required(lastName) &&
    required(gender) &&
    required(birthdate) &&
    isValidEmail(email) &&
    isValidPhilippinePhone(`+63${phone}`) &&
    isPasswordValid &&
    required(confirmPassword) &&
    confirmPassword === password &&
    hasAcceptedTerms;

  function validateDetails() {
    const nextErrors: FormErrors<SignUpField> = {};

    if (!required(firstName)) {
      nextErrors.firstName = 'First name is required.';
    }

    if (!required(lastName)) {
      nextErrors.lastName = 'Last name is required.';
    }

    if (!required(gender)) {
      nextErrors.gender = 'Select your gender.';
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

    if (!hasAcceptedTerms) {
      nextErrors.terms = 'Accept the Terms and Conditions to continue.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function validateOtp() {
    const nextErrors: FormErrors<SignUpField> = {};

    if (!required(otp)) {
      nextErrors.otp = 'OTP is required.';
    } else if (!isFourDigitOtp(otp)) {
      nextErrors.otp = 'OTP must be 4 digits.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSendOtp() {
    if (validateDetails()) {
      setOtpMessage('OTP sent for demo purposes.');
      setStep('otp');
    }
  }

  function handleSelectBirthdate(date: Date) {
    setSelectedBirthdate(date);
    setBirthdate(formatDateValue(date));
    setIsCalendarVisible(false);
  }

  function handleSubmit() {
    if (validateOtp()) {
      router.replace('/login');
    }
  }

  return (
    <AuthScreen
      eyebrow="Create account"
      title={step === 'details' ? 'Sign up' : 'Verify OTP'}
      subtitle={
        step === 'details'
          ? 'Create your Bloomora account in a few quick steps.'
          : 'Enter the 4-digit code sent to your contact details.'
      }>
      {step === 'details' ? (
        <View style={styles.form}>
          <FormSection title="Personal details">
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <AuthField
                  autoCapitalize="words"
                  error={errors.firstName}
                  label="First name"
                  onChangeText={setFirstName}
                  placeholder="Juan"
                  value={firstName}
                />
              </View>
              <View style={styles.nameField}>
                <AuthField
                  autoCapitalize="words"
                  error={errors.lastName}
                  label="Last name"
                  onChangeText={setLastName}
                  placeholder="Dela Cruz"
                  value={lastName}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {['Female', 'Male', 'Prefer not to say'].map((option) => (
                <Pressable
                  key={option}
                  style={[styles.genderButton, gender === option && styles.genderButtonActive]}
                  onPress={() => setGender(option)}>
                  <Text style={[styles.genderText, gender === option && styles.genderTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

            <BirthdatePickerField
              error={errors.birthdate}
              value={birthdate}
              onPress={() => {
                setCalendarMode('year');
                setIsCalendarVisible(true);
              }}
            />
          </FormSection>

          <FormSection title="Contact details">
            <AuthField
              error={errors.email}
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="juan@email.com"
              value={email}
            />
            <AuthField
              error={errors.phone}
              keyboardType="phone-pad"
              label="Phone number"
              onChangeText={setPhone}
              placeholder="9XX XXX XXXX"
              prefix="+63"
              value={phone}
            />
          </FormSection>

          <FormSection title="Security">
            <AuthField
              error={errors.password}
              label="Password"
              onChangeText={setPassword}
              placeholder="Create a secure password"
              secureTextEntry
              value={password}
            />
            <PasswordStrengthMeter strength={passwordStrength} />
            <View style={styles.requirements}>
              {passwordRules.map((rule) => (
                <RequirementRow key={rule.label} isValid={rule.isValid} label={rule.label} />
              ))}
            </View>
            <AuthField
              error={errors.confirmPassword}
              label="Confirm password"
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              value={confirmPassword}
            />
            {confirmPassword && confirmPassword === password ? (
              <Text style={styles.matchText}>Passwords match.</Text>
            ) : null}
          </FormSection>

          <View style={styles.termsWrap}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasAcceptedTerms }}
              style={styles.termsButton}
              onPress={() => setHasAcceptedTerms((current) => !current)}>
              <View style={[styles.checkbox, hasAcceptedTerms && styles.checkboxChecked]}>
                {hasAcceptedTerms ? <Check size={14} color={theme.colors.white} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/terms-and-condition')}>
                  Terms and Conditions
                </Text>
              </Text>
            </Pressable>
            {errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}
          </View>

          <View style={styles.actionGroup}>
            <AuthButton
              disabled={!isDetailsFormValid}
              label="Continue to Verification"
              onPress={handleSendOtp}
              style={!isDetailsFormValid && styles.disabledButton}
            />
            <Pressable style={authStyles.linkButton} onPress={() => router.replace('/login')}>
              <Text style={authStyles.linkText}>Already have an account? Sign In</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={authStyles.form}>
          {otpMessage ? <Text style={authStyles.successText}>{otpMessage}</Text> : null}
          <OtpInput error={errors.otp} onChangeText={setOtp} value={otp} />
          <View style={authStyles.actionGroup}>
            <AuthButton label="Submit" onPress={handleSubmit} />
            <AuthButton label="Edit Details" variant="secondary" onPress={() => setStep('details')} />
          </View>
        </View>
      )}
      <BirthdateCalendarModal
        selectedDate={selectedBirthdate}
        visible={isCalendarVisible}
        visibleMonth={visibleMonth}
        onClose={() => setIsCalendarVisible(false)}
        onSelectDate={handleSelectBirthdate}
        calendarMode={calendarMode}
        onCalendarModeChange={setCalendarMode}
        onVisibleMonthChange={setVisibleMonth}
      />
    </AuthScreen>
  );
}

function FormSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
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

function BirthdatePickerField({
  error,
  onPress,
  value,
}: {
  error?: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>Birthdate</Text>
      <Pressable style={[styles.dateField, error && styles.dateFieldError]} onPress={onPress}>
        <Text style={[styles.dateText, !value && styles.datePlaceholder]}>
          {value || 'Select birthdate'}
        </Text>
        <CalendarDays size={theme.icon.sm} color={theme.colors.primary} />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

function BirthdateCalendarModal({
  calendarMode,
  onClose,
  onCalendarModeChange,
  onSelectDate,
  onVisibleMonthChange,
  selectedDate,
  visible,
  visibleMonth,
}: {
  calendarMode: CalendarMode;
  onClose: () => void;
  onCalendarModeChange: (mode: CalendarMode) => void;
  onSelectDate: (date: Date) => void;
  onVisibleMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  visible: boolean;
  visibleMonth: Date;
}) {
  const dates = getCalendarDates(visibleMonth);
  const today = stripTime(new Date());
  const currentYear = new Date().getFullYear();
  const yearPageStart = Math.floor(visibleMonth.getFullYear() / 12) * 12;
  const years = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  function changeMonth(offset: number) {
    onVisibleMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1));
  }

  function changeYearPage(offset: number) {
    onVisibleMonthChange(new Date(visibleMonth.getFullYear() + offset * 12, visibleMonth.getMonth(), 1));
  }

  function handleSelectYear(year: number) {
    onVisibleMonthChange(new Date(year, visibleMonth.getMonth(), 1));
    onCalendarModeChange('month');
  }

  function handleSelectMonth(month: number) {
    onVisibleMonthChange(new Date(visibleMonth.getFullYear(), month, 1));
    onCalendarModeChange('day');
  }

  function renderHeaderTitle() {
    if (calendarMode === 'year') {
      return `${yearPageStart} - ${yearPageStart + 11}`;
    }

    if (calendarMode === 'month') {
      return `${visibleMonth.getFullYear()}`;
    }

    return `${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;
  }

  function handlePrevious() {
    if (calendarMode === 'year') {
      changeYearPage(-1);
      return;
    }

    if (calendarMode === 'month') {
      onVisibleMonthChange(new Date(visibleMonth.getFullYear() - 1, visibleMonth.getMonth(), 1));
      return;
    }

    changeMonth(-1);
  }

  function handleNext() {
    if (calendarMode === 'year') {
      changeYearPage(1);
      return;
    }

    if (calendarMode === 'month') {
      onVisibleMonthChange(new Date(visibleMonth.getFullYear() + 1, visibleMonth.getMonth(), 1));
      return;
    }

    changeMonth(1);
  }

  function handleTitlePress() {
    if (calendarMode === 'day') {
      onCalendarModeChange('month');
      return;
    }

    onCalendarModeChange('year');
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable style={styles.monthButton} onPress={handlePrevious}>
              <ChevronLeft size={theme.icon.md} color={theme.colors.primary} />
            </Pressable>
            <Pressable style={styles.calendarTitleButton} onPress={handleTitlePress}>
              <Text style={styles.monthTitle}>{renderHeaderTitle()}</Text>
              <Text style={styles.titleHint}>
                {calendarMode === 'day' ? 'Tap to change month/year' : 'Tap to change year'}
              </Text>
            </Pressable>
            <Pressable style={styles.monthButton} onPress={handleNext}>
              <ChevronRight size={theme.icon.md} color={theme.colors.primary} />
            </Pressable>
          </View>

          {calendarMode === 'year' ? (
            <View style={styles.yearGrid}>
              {years.map((year) => {
                const isSelectedYear = selectedDate?.getFullYear() === year;
                const isDisabledYear = year > currentYear;

                return (
                  <Pressable
                    key={year}
                    disabled={isDisabledYear}
                    style={[
                      styles.yearButton,
                      isSelectedYear && styles.yearButtonSelected,
                      isDisabledYear && styles.dayButtonDisabled,
                    ]}
                    onPress={() => handleSelectYear(year)}>
                    <Text
                      style={[
                        styles.yearText,
                        isSelectedYear && styles.dayTextSelected,
                        isDisabledYear && styles.dayTextDisabled,
                      ]}>
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {calendarMode === 'month' ? (
            <View style={styles.monthGrid}>
              {monthNames.map((month, index) => {
                const isSelectedMonth =
                  selectedDate?.getFullYear() === visibleMonth.getFullYear() &&
                  selectedDate.getMonth() === index;
                const isDisabledMonth =
                  visibleMonth.getFullYear() > currentYear ||
                  (visibleMonth.getFullYear() === currentYear && index > new Date().getMonth());

                return (
                  <Pressable
                    key={month}
                    disabled={isDisabledMonth}
                    style={[
                      styles.monthGridButton,
                      isSelectedMonth && styles.yearButtonSelected,
                      isDisabledMonth && styles.dayButtonDisabled,
                    ]}
                    onPress={() => handleSelectMonth(index)}>
                    <Text
                      style={[
                        styles.monthGridText,
                        isSelectedMonth && styles.dayTextSelected,
                        isDisabledMonth && styles.dayTextDisabled,
                      ]}>
                      {month.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {calendarMode === 'day' ? (
            <>
              <View style={styles.weekRow}>
                {weekDays.map((day, index) => (
                  <Text key={`${day}-${index}`} style={styles.weekText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.dayGrid}>
                {dates.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                  const isSelected = selectedDate ? isSameDate(date, selectedDate) : false;
                  const isDisabled = stripTime(date).getTime() > today.getTime();

                  return (
                    <Pressable
                      key={`${date.toISOString()}-${index}`}
                      disabled={isDisabled}
                      style={[
                        styles.dayButton,
                        !isCurrentMonth && styles.dayButtonMuted,
                        isSelected && styles.dayButtonSelected,
                        isDisabled && styles.dayButtonDisabled,
                      ]}
                      onPress={() => onSelectDate(date)}>
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonth && styles.dayTextMuted,
                          isSelected && styles.dayTextSelected,
                          isDisabled && styles.dayTextDisabled,
                        ]}>
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={styles.calendarActions}>
            <Pressable style={styles.calendarCancelButton} onPress={onClose}>
              <Text style={styles.calendarCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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

function getInitialCalendarMonth() {
  const date = new Date();

  return new Date(date.getFullYear() - 18, date.getMonth(), 1);
}

function getCalendarDates(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isSameDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionBody: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  nameField: {
    flex: 1,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  genderButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  genderButtonActive: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
  },
  genderText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  genderTextActive: {
    color: theme.colors.primary,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  dateField: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  dateFieldError: {
    borderColor: theme.colors.danger,
  },
  dateText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  datePlaceholder: {
    color: theme.colors.textMuted,
  },
  requirements: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
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
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  requirementTextValid: {
    color: theme.colors.text,
  },
  strengthWrap: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  strengthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '700',
  },
  termsWrap: {
    gap: theme.spacing.xs,
  },
  termsButton: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: theme.borderWidth,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  actionGroup: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.48,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  calendarCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.md,
    maxWidth: 380,
    padding: theme.spacing.lg,
    width: '100%',
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  monthTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  calendarTitleButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  titleHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  dayButtonMuted: {
    opacity: 0.48,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
  },
  dayButtonDisabled: {
    opacity: 0.25,
  },
  dayText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dayTextMuted: {
    color: theme.colors.textMuted,
  },
  dayTextSelected: {
    color: theme.colors.white,
  },
  dayTextDisabled: {
    color: theme.colors.textMuted,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  yearButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    minHeight: 46,
    width: '30%',
  },
  yearButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  monthGridButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    minHeight: 46,
    width: '30%',
  },
  monthGridText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  calendarActions: {
    alignItems: 'center',
  },
  calendarCancelButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    justifyContent: 'center',
    minHeight: 46,
    width: '100%',
  },
  calendarCancelText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});

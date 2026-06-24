import { router, useFocusEffect } from 'expo-router';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  ContactRound,
  EyeOff,
  Fingerprint,
  Globe2,
  Headset,
  KeyRound,
  Languages,
  LocateFixed,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import {
  authenticateWithBiometrics,
  getBiometricsAvailability,
  type BiometricsAvailability,
} from '@/services/biometrics';
import { clearAuthSession, getAuthSession, type AuthSession } from '@/services/auth-session';
import { resetForgotPassword, sendForgotPasswordOtp } from '@/services/auth-api';
import { isSixDigitOtp, isValidEmail, isValidPhilippinePhone, required } from '@/utils/auth-validation';

type RowIcon = typeof Pencil;
type ActiveView =
  | 'settings'
  | 'account'
  | 'security'
  | 'notifications'
  | 'preferences'
  | 'contact'
  | 'username'
  | 'displayName'
  | 'email'
  | 'phone'
  | 'password';
type EditableAccountField = 'displayName' | 'email' | 'phone' | 'username';
type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong';
type PasswordResetStep = 'email' | 'otp' | 'reset';

const pastelDanger = '#D96B6B';
const languageOptions = ['English', 'Filipino'];
const countryOptions = ['Philippines', 'United States'];

type SettingsItem = {
  danger?: boolean;
  detail?: string;
  icon: RowIcon;
  title: string;
  onPress?: () => void;
};

type SettingsGroup = {
  items: SettingsItem[];
  title: string;
};

export default function SettingsScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const isSignedIn = Boolean(session);
  const [activeView, setActiveView] = useState<ActiveView>('settings');
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailability, setBiometricsAvailability] = useState<BiometricsAvailability | null>(null);
  const [biometricsMessage, setBiometricsMessage] = useState<string | null>(null);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [contactPermissionEnabled, setContactPermissionEnabled] = useState(true);
  const [contactPrivateEnabled, setContactPrivateEnabled] = useState(false);
  const [languageIndex, setLanguageIndex] = useState(0);
  const [countryIndex, setCountryIndex] = useState(0);
  const [firstName, setFirstName] = useState('Maya');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('Santos');
  const [email, setEmail] = useState('maya@estings.app');
  const [phone, setPhone] = useState('+63 947 865 0531');
  const [username, setUsername] = useState('maya.estings');
  const [draftFirstName, setDraftFirstName] = useState(firstName);
  const [draftMiddleName, setDraftMiddleName] = useState(middleName);
  const [draftLastName, setDraftLastName] = useState(lastName);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [draftUsername, setDraftUsername] = useState(username);
  const [passwordStep, setPasswordStep] = useState<PasswordResetStep>('email');
  const [passwordEmail, setPasswordEmail] = useState(email);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const insets = useSafeAreaInsets();
  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const passwordStrength = useMemo(() => getPasswordStrength(passwordRules), [passwordRules]);
  const isPasswordValid = passwordRules.every((rule) => rule.isValid);
  const displayName = formatDisplayName(firstName, middleName, lastName);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getAuthSession()
        .then((nextSession) => {
          if (!isActive) {
            return;
          }

          setSession(nextSession);

          if (nextSession?.user) {
            const nextFirstName = nextSession.user.first_name?.trim() || '';
            const nextLastName = nextSession.user.last_name?.trim() || '';
            const nextEmail = nextSession.user.email?.trim() || '';
            const nextPhone = nextSession.user.phone_number?.trim() || '';
            const nextUsername = nextSession.user.username?.trim() || nextEmail;

            setFirstName(nextFirstName || nextUsername || 'Estings');
            setMiddleName('');
            setLastName(nextLastName);
            setEmail(nextEmail);
            setPhone(nextPhone);
            setUsername(nextUsername);
            setDraftFirstName(nextFirstName || nextUsername || 'Estings');
            setDraftMiddleName('');
            setDraftLastName(nextLastName);
            setDraftEmail(nextEmail);
            setDraftPhone(nextPhone);
            setDraftUsername(nextUsername);
            setPasswordEmail(nextEmail);
          }
        })
        .catch(() => {
          if (isActive) {
            setSession(null);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

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

  async function handleLogout() {
    setIsLogoutVisible(false);
    await clearAuthSession();
    setSession(null);
    router.replace('/(tabs)/me');
  }

  function handleBack() {
    if (isAccountEditView(activeView)) {
      resetAccountDraft(activeView);
      setActiveView('account');
      return;
    }

    if (activeView !== 'settings') {
      setActiveView('settings');
      return;
    }

    router.back();
  }

  function handleSearchChange(value: string) {
    LayoutAnimation.configureNext({
      duration: 220,
      create: {
        duration: 180,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        duration: 140,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      update: {
        duration: 220,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setSearchQuery(value);
  }

  function handleOpenUsername() {
    openAccountEdit('username');
  }

  async function openAccountEdit(field: EditableAccountField) {
    await confirmSensitiveAction(
      () => {
        resetAccountDraft(field);
        setActiveView(field);
      },
      `Confirm with ${biometricsAvailability?.label ?? 'biometrics'} to edit your account details.`,
    );
  }

  function resetAccountDraft(field: EditableAccountField | 'password') {
    if (field === 'displayName') {
      setDraftFirstName(firstName);
      setDraftMiddleName(middleName);
      setDraftLastName(lastName);
    }

    if (field === 'email') {
      setDraftEmail(email);
    }

    if (field === 'phone') {
      setDraftPhone(phone);
    }

    if (field === 'username') {
      setDraftUsername(username);
    }

    if (field === 'password') {
      setPasswordStep('email');
      setPasswordEmail(email);
      setPasswordOtp('');
      setPasswordMessage(null);
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  function handleSaveAccountField(field: EditableAccountField) {
    if (field === 'displayName' && required(draftFirstName) && required(draftLastName)) {
      setFirstName(draftFirstName.trim());
      setMiddleName(draftMiddleName.trim());
      setLastName(draftLastName.trim());
    }

    if (field === 'email' && isValidEmail(draftEmail)) {
      setEmail(draftEmail.trim());
    }

    if (field === 'phone' && isValidPhilippinePhone(draftPhone)) {
      setPhone(draftPhone.trim());
    }

    if (field === 'username' && required(draftUsername)) {
      setUsername(draftUsername.trim());
    }

    setActiveView('account');
  }

  async function handleOpenPassword() {
    await confirmSensitiveAction(
      () => {
        resetAccountDraft('password');
        setActiveView('password');
      },
      `Confirm with ${biometricsAvailability?.label ?? 'biometrics'} to change your password.`,
    );
  }

  async function handleSavePassword() {
    if (isPasswordSubmitting) {
      return;
    }

    setPasswordMessage(null);

    if (passwordStep === 'email') {
      if (!isValidEmail(passwordEmail)) {
        setPasswordMessage('Enter the email address linked to your account.');
        return;
      }

      setIsPasswordSubmitting(true);
      try {
        await sendForgotPasswordOtp(passwordEmail);
        setPasswordStep('otp');
        setPasswordMessage('We sent a 6-digit code to your email.');
      } catch (error) {
        setPasswordMessage(error instanceof Error ? error.message : 'Unable to send OTP.');
      } finally {
        setIsPasswordSubmitting(false);
      }
      return;
    }

    if (passwordStep === 'otp') {
      if (!isSixDigitOtp(passwordOtp)) {
        setPasswordMessage('Enter the 6-digit code from your email.');
        return;
      }

      setPasswordStep('reset');
      setPasswordMessage('Code accepted. Create a strong new password.');
      return;
    }

    if (!isPasswordValid || confirmPassword !== newPassword) {
      setPasswordMessage('Enter a strong password and make sure both passwords match.');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await resetForgotPassword({
        email: passwordEmail,
        newPassword,
        otp: passwordOtp,
      });
      setPasswordMessage('Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
      setPasswordStep('email');
      setActiveView('account');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Unable to change password.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  async function confirmSensitiveAction(action: () => void, promptMessage: string) {
    if (!biometricsEnabled) {
      action();
      return;
    }

    const result = await authenticateWithBiometrics(promptMessage);

    if (result.success) {
      setBiometricsMessage(null);
      action();
      return;
    }

    setBiometricsMessage(result.error ?? 'Biometric confirmation was not completed.');
  }

  async function handleToggleBiometrics(nextValue: boolean) {
    if (!nextValue) {
      setBiometricsEnabled(false);
      setBiometricsMessage('Biometric protection is off.');
      return;
    }

    const availability = await getBiometricsAvailability();
    setBiometricsAvailability(availability);

    if (!availability.isAvailable) {
      setBiometricsEnabled(false);
      setBiometricsMessage(availability.unavailableReason ?? 'Biometrics are unavailable.');
      return;
    }

    const result = await authenticateWithBiometrics(`Enable ${availability.label} for Esting's.`);

    if (result.success) {
      setBiometricsEnabled(true);
      setBiometricsMessage(`${availability.label} is enabled for sensitive account actions.`);
      return;
    }

    setBiometricsEnabled(false);
    setBiometricsMessage(result.error ?? 'Biometric setup was not completed.');
  }

  const settingsGroups: SettingsGroup[] = useMemo(
    () => [
      {
        title: 'Account',
        items: isSignedIn ? [
          {
            detail: username,
            icon: UserRound,
            title: 'Account',
            onPress: () => setActiveView('account'),
          },
          {
            detail: biometricsEnabled ? 'On' : 'Off',
            icon: Fingerprint,
            title: 'Security',
            onPress: () => setActiveView('security'),
          },
        ] : [],
      },
      {
        title: 'App Settings',
        items: [
          {
            detail: pushNotificationsEnabled ? 'On' : 'Off',
            icon: Bell,
            title: 'Notifications',
            onPress: isSignedIn ? () => setActiveView('notifications') : undefined,
          },
          {
            detail: languageOptions[languageIndex],
            icon: SlidersHorizontal,
            title: 'Location & Preferences',
            onPress: () => setActiveView('preferences'),
          },
          {
            detail: contactPrivateEnabled ? 'Private' : 'Public',
            icon: ContactRound,
            title: 'Contact',
            onPress: isSignedIn ? () => setActiveView('contact') : undefined,
          },
          {
            icon: Code2,
            title: 'Developer Tools',
            onPress: () => router.push('/developer'),
          },
        ],
      },
      {
        title: 'Help Center',
        items: [
          { icon: CircleHelp, title: 'FAQs', onPress: () => router.push('/faq') },
          { icon: RotateCcw, title: 'Return Policy', onPress: () => router.push('/return-policy') },
          { icon: Headset, title: 'Live Chat', onPress: () => router.push('/live-chat') },
          { icon: MessageCircle, title: 'Support Contact', onPress: () => router.push('/contact') },
        ],
      },
    ],
    [biometricsEnabled, contactPrivateEnabled, isSignedIn, languageIndex, pushNotificationsEnabled, username],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleSettingsGroups = settingsGroups
    .map((group) => ({
      ...group,
      items: normalizedSearch
        ? group.items.filter((item) =>
            `${group.title} ${item.title} ${item.detail ?? ''}`.toLowerCase().includes(normalizedSearch),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 104,
            paddingTop: insets.top + theme.spacing.lg,
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.closeButton} onPress={handleBack}>
            <ChevronLeft size={28} color={theme.colors.primary} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle}>{getHeaderTitle(activeView)}</Text>
        </View>

        {activeView === 'settings' ? (
          <>
            <View style={styles.searchBar}>
              <Search size={21} color={theme.colors.primary} strokeWidth={2.2} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                onChangeText={handleSearchChange}
                placeholder="Search"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
            <SettingsHome
              isSignedIn={isSignedIn}
              normalizedSearch={normalizedSearch}
              onLogoutPress={() => setIsLogoutVisible(true)}
              visibleGroups={visibleSettingsGroups}
            />
          </>
        ) : null}

        {activeView === 'account' ? (
          <AccountView
            displayName={displayName}
            email={email}
            phone={phone}
            username={username}
            onOpenDisplayName={() => openAccountEdit('displayName')}
            onOpenEmail={() => openAccountEdit('email')}
            onOpenPassword={handleOpenPassword}
            onOpenPhone={() => openAccountEdit('phone')}
            onOpenUsername={handleOpenUsername}
          />
        ) : null}

        {activeView === 'security' ? (
          <SecurityView
            availability={biometricsAvailability}
            enabled={biometricsEnabled}
            message={biometricsMessage}
            onToggleBiometrics={handleToggleBiometrics}
          />
        ) : null}

        {activeView === 'notifications' ? (
          <NotificationsView enabled={pushNotificationsEnabled} onToggle={setPushNotificationsEnabled} />
        ) : null}

        {activeView === 'preferences' ? (
          <PreferencesView
            country={countryOptions[countryIndex]}
            language={languageOptions[languageIndex]}
            locationSharingEnabled={locationSharingEnabled}
            onCycleCountry={() => setCountryIndex((current) => (current + 1) % countryOptions.length)}
            onCycleLanguage={() => setLanguageIndex((current) => (current + 1) % languageOptions.length)}
            onToggleLocation={setLocationSharingEnabled}
          />
        ) : null}

        {activeView === 'contact' ? (
          <ContactPrivacyView
            contactPermissionEnabled={contactPermissionEnabled}
            contactPrivateEnabled={contactPrivateEnabled}
            onToggleContactPermission={setContactPermissionEnabled}
            onToggleContactPrivate={setContactPrivateEnabled}
          />
        ) : null}

        {activeView === 'username' ? (
          <AccountFieldEditView
            helperText="This is only a frontend profile value for now."
            label="Username"
            maxLength={32}
            value={draftUsername}
            onChangeText={setDraftUsername}
            onSave={() => handleSaveAccountField('username')}
          />
        ) : null}

        {activeView === 'displayName' ? (
          <NameEditView
            firstName={draftFirstName}
            lastName={draftLastName}
            middleName={draftMiddleName}
            onChangeFirstName={setDraftFirstName}
            onChangeLastName={setDraftLastName}
            onChangeMiddleName={setDraftMiddleName}
            onSave={() => handleSaveAccountField('displayName')}
          />
        ) : null}

        {activeView === 'email' ? (
          <AccountFieldEditView
            autoCapitalize="none"
            errorText={draftEmail && !isValidEmail(draftEmail) ? 'Enter a valid email address.' : undefined}
            helperText="Use an email address you can access for order updates."
            keyboardType="email-address"
            label="Email"
            value={draftEmail}
            onChangeText={setDraftEmail}
            onSave={() => handleSaveAccountField('email')}
          />
        ) : null}

        {activeView === 'phone' ? (
          <AccountFieldEditView
            autoCapitalize="none"
            errorText={draftPhone && !isValidPhilippinePhone(draftPhone) ? 'Enter a valid Philippine phone number.' : undefined}
            helperText="Use a Philippine number like 09XX XXX XXXX or +639XX XXX XXXX."
            keyboardType="phone-pad"
            label="Phone"
            value={draftPhone}
            onChangeText={setDraftPhone}
            onSave={() => handleSaveAccountField('phone')}
          />
        ) : null}

        {activeView === 'password' ? (
          <PasswordEditView
            confirmPassword={confirmPassword}
            email={passwordEmail}
            isPasswordValid={isPasswordValid}
            isSubmitting={isPasswordSubmitting}
            message={passwordMessage}
            newPassword={newPassword}
            otp={passwordOtp}
            passwordRules={passwordRules}
            passwordStrength={passwordStrength}
            step={passwordStep}
            onChangeConfirmPassword={setConfirmPassword}
            onChangeEmail={setPasswordEmail}
            onChangeNewPassword={setNewPassword}
            onChangeOtp={setPasswordOtp}
            onSave={handleSavePassword}
          />
        ) : null}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isLogoutVisible}
        onRequestClose={() => setIsLogoutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <LogOut size={26} color={pastelDanger} strokeWidth={2.3} />
            </View>
            <View style={styles.modalCopy}>
              <Text style={styles.modalTitle}>{"Log out of Esting's?"}</Text>
              <Text style={styles.modalMessage}>
                You can sign back in anytime to continue managing your account and orders.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setIsLogoutVisible(false)}>
                <Text style={styles.cancelText}>Stay signed in</Text>
              </Pressable>
              <Pressable style={styles.confirmLogoutButton} onPress={handleLogout}>
                <Text style={styles.confirmLogoutText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SettingsHome({
  isSignedIn,
  normalizedSearch,
  onLogoutPress,
  visibleGroups,
}: {
  isSignedIn: boolean;
  normalizedSearch: string;
  onLogoutPress: () => void;
  visibleGroups: SettingsGroup[];
}) {
  return (
    <>
      {visibleGroups.map((group) => (
        <SettingsSection key={group.title} title={group.title}>
          <View style={styles.groupCard}>
            {group.items.map((item, index) => (
              <View key={item.title}>
                {index > 0 ? <Divider /> : null}
                <SettingsRow {...item} />
              </View>
            ))}
          </View>
        </SettingsSection>
      ))}

      {isSignedIn && !normalizedSearch ? (
        <SettingsSection danger title="Danger Zone">
          <View style={styles.groupCard}>
            <SettingsRow danger icon={LogOut} title="Logout" onPress={onLogoutPress} />
          </View>
        </SettingsSection>
      ) : null}
    </>
  );
}

function AccountView({
  displayName,
  email,
  onOpenDisplayName,
  onOpenEmail,
  onOpenPassword,
  onOpenPhone,
  onOpenUsername,
  phone,
  username,
}: {
  displayName: string;
  email: string;
  onOpenDisplayName: () => void;
  onOpenEmail: () => void;
  onOpenPassword: () => void;
  onOpenPhone: () => void;
  onOpenUsername: () => void;
  phone: string;
  username: string;
}) {
  return (
    <>
      <SettingsSection title="Account Information">
        <View style={styles.groupCard}>
          <SettingsRow detail={displayName} icon={UserRound} title="Name" onPress={onOpenDisplayName} />
          <Divider />
          <SettingsRow detail={username} icon={Pencil} title="Username" onPress={onOpenUsername} />
          <Divider />
          <SettingsRow detail={email} icon={Mail} title="Email" onPress={onOpenEmail} />
          <Divider />
          <SettingsRow detail={phone} icon={Phone} title="Phone" onPress={onOpenPhone} />
        </View>
      </SettingsSection>

      <SettingsSection title="How You Sign In">
        <View style={styles.groupCard}>
          <SettingsRow detail="Change password" icon={KeyRound} title="Password" onPress={onOpenPassword} />
        </View>
      </SettingsSection>

      <SettingsSection danger title="Account Management">
        <View style={styles.groupCard}>
          <SettingsRow danger icon={Trash2} title="Delete account" />
        </View>
      </SettingsSection>
    </>
  );
}

function SecurityView({
  availability,
  enabled,
  message,
  onToggleBiometrics,
}: {
  availability: BiometricsAvailability | null;
  enabled: boolean;
  message: string | null;
  onToggleBiometrics: (value: boolean) => void;
}) {
  const isAvailable = availability?.isAvailable ?? false;
  const biometricLabel = availability?.label ?? 'Biometrics';
  const statusText = message ?? availability?.unavailableReason ?? `${biometricLabel} can protect profile edits and password changes.`;

  return (
    <SettingsSection title="Security">
      <View style={styles.groupCard}>
        <ToggleRow
          description={`Require ${biometricLabel} before editing profile details or changing your password.`}
          disabled={!isAvailable}
          icon={Fingerprint}
          title={biometricLabel}
          value={enabled}
          onValueChange={onToggleBiometrics}
        />
        <View style={styles.statusPanel}>
          <ShieldCheck size={theme.icon.sm} color={isAvailable ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={styles.statusPanelText}>{statusText}</Text>
        </View>
      </View>
    </SettingsSection>
  );
}

function NotificationsView({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <SettingsSection title="Notification">
      <View style={styles.groupCard}>
        <ToggleRow
          description="Receive order updates, delivery reminders, and important shop notices."
          icon={Bell}
          title="Push Notification"
          value={enabled}
          onValueChange={onToggle}
        />
      </View>
    </SettingsSection>
  );
}

function PreferencesView({
  country,
  language,
  locationSharingEnabled,
  onCycleCountry,
  onCycleLanguage,
  onToggleLocation,
}: {
  country: string;
  language: string;
  locationSharingEnabled: boolean;
  onCycleCountry: () => void;
  onCycleLanguage: () => void;
  onToggleLocation: (value: boolean) => void;
}) {
  return (
    <SettingsSection title="Location & Preferences">
      <View style={styles.groupCard}>
        <ToggleRow
          description="Let Esting's use your location to suggest branches and delivery options."
          icon={LocateFixed}
          title="Location Sharing"
          value={locationSharingEnabled}
          onValueChange={onToggleLocation}
        />
        <Divider />
        <SelectorRow icon={Languages} title="Language" value={language} onPress={onCycleLanguage} />
        <Divider />
        <SelectorRow icon={Globe2} title="Country" value={country} onPress={onCycleCountry} />
      </View>
    </SettingsSection>
  );
}

function ContactPrivacyView({
  contactPermissionEnabled,
  contactPrivateEnabled,
  onToggleContactPermission,
  onToggleContactPrivate,
}: {
  contactPermissionEnabled: boolean;
  contactPrivateEnabled: boolean;
  onToggleContactPermission: (value: boolean) => void;
  onToggleContactPrivate: (value: boolean) => void;
}) {
  return (
    <SettingsSection title="Contact">
      <View style={styles.groupCard}>
        <ToggleRow
          description="Allow Esting's to use your saved contact details for delivery coordination."
          icon={ContactRound}
          title="Contact Permission"
          value={contactPermissionEnabled}
          onValueChange={onToggleContactPermission}
        />
        <Divider />
        <ToggleRow
          description={contactPrivateEnabled ? 'Your contact details are hidden from shared order views.' : 'Your contact visibility is public.'}
          icon={EyeOff}
          title="Make My Contact Private"
          value={contactPrivateEnabled}
          onValueChange={onToggleContactPrivate}
        />
        <View style={styles.statusPanel}>
          <MapPin size={theme.icon.sm} color={theme.colors.primary} />
          <Text style={styles.statusPanelText}>
            Current contact visibility: {contactPrivateEnabled ? 'Private' : 'Public'}
          </Text>
        </View>
      </View>
    </SettingsSection>
  );
}

function AccountFieldEditView({
  autoCapitalize = 'none',
  errorText,
  helperText,
  keyboardType = 'default',
  label,
  maxLength,
  value,
  onChangeText,
  onSave,
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  errorText?: string;
  helperText: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  maxLength?: number;
  value: string;
  onChangeText: (value: string) => void;
  onSave: () => void;
}) {
  const canSave = value.trim().length > 0 && !errorText;

  return (
    <SettingsSection title={label}>
      <View style={styles.formCard}>
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={styles.usernameInput}
          value={value}
        />
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        <Text style={styles.helperText}>{helperText}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={onSave}>
          <Text style={styles.saveButtonText}>Save {label.toLowerCase()}</Text>
        </Pressable>
      </View>
    </SettingsSection>
  );
}

function NameEditView({
  firstName,
  lastName,
  middleName,
  onChangeFirstName,
  onChangeLastName,
  onChangeMiddleName,
  onSave,
}: {
  firstName: string;
  lastName: string;
  middleName: string;
  onChangeFirstName: (value: string) => void;
  onChangeLastName: (value: string) => void;
  onChangeMiddleName: (value: string) => void;
  onSave: () => void;
}) {
  const canSave = required(firstName) && required(lastName);

  return (
    <SettingsSection title="Name">
      <View style={styles.formCard}>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={32}
          onChangeText={onChangeFirstName}
          placeholder="First name"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="next"
          style={styles.usernameInput}
          value={firstName}
        />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={32}
          onChangeText={onChangeMiddleName}
          placeholder="Middle name"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="next"
          style={styles.usernameInput}
          value={middleName}
        />
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={32}
          onChangeText={onChangeLastName}
          placeholder="Last name"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={styles.usernameInput}
          value={lastName}
        />
        {!required(firstName) || !required(lastName) ? (
          <Text style={styles.errorText}>First name and last name are required.</Text>
        ) : null}
        <Text style={styles.helperText}>{"This name appears on your Esting's account. Username stays separate."}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={onSave}>
          <Text style={styles.saveButtonText}>Save name</Text>
        </Pressable>
      </View>
    </SettingsSection>
  );
}

function PasswordEditView({
  confirmPassword,
  email,
  isPasswordValid,
  isSubmitting,
  message,
  newPassword,
  otp,
  passwordRules,
  passwordStrength,
  step,
  onChangeConfirmPassword,
  onChangeEmail,
  onChangeNewPassword,
  onChangeOtp,
  onSave,
}: {
  confirmPassword: string;
  email: string;
  isPasswordValid: boolean;
  isSubmitting: boolean;
  message: string | null;
  newPassword: string;
  otp: string;
  passwordRules: ReturnType<typeof getPasswordRules>;
  passwordStrength: PasswordStrength;
  step: PasswordResetStep;
  onChangeConfirmPassword: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeOtp: (value: string) => void;
  onSave: () => void;
}) {
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const canSave =
    step === 'email'
      ? isValidEmail(email)
      : step === 'otp'
        ? isSixDigitOtp(otp)
        : isPasswordValid && passwordsMatch;
  const buttonLabel = step === 'email' ? 'Send OTP' : step === 'otp' ? 'Continue' : 'Save password';

  return (
    <SettingsSection title="Password">
      <View style={styles.formCard}>
        {step === 'email' ? (
          <>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={onChangeEmail}
              placeholder="Account email"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.usernameInput}
              value={email}
            />
            {email && !isValidEmail(email) ? <Text style={styles.errorText}>Enter a valid email address.</Text> : null}
            <Text style={styles.helperText}>Confirm the email address where the password reset OTP should be sent.</Text>
          </>
        ) : null}

        {step === 'otp' ? (
          <>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(value) => onChangeOtp(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.usernameInput}
              value={otp}
            />
            {otp && !isSixDigitOtp(otp) ? <Text style={styles.errorText}>Enter the 6-digit code.</Text> : null}
            <Text style={styles.helperText}>Use the code sent to {email}.</Text>
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChangeNewPassword}
              placeholder="Create a secure password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={styles.usernameInput}
              value={newPassword}
            />
            <PasswordStrengthMeter strength={passwordStrength} />
            <View style={styles.requirements}>
              {passwordRules.map((rule) => (
                <RequirementRow key={rule.label} isValid={rule.isValid} label={rule.label} />
              ))}
            </View>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChangeConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={styles.usernameInput}
              value={confirmPassword}
            />
            {confirmPassword && !passwordsMatch ? <Text style={styles.errorText}>Passwords must match.</Text> : null}
            {passwordsMatch ? <Text style={styles.matchText}>Passwords match.</Text> : null}
          </>
        ) : null}

        {message ? <Text style={styles.helperText}>{message}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSave || isSubmitting}
          style={[styles.saveButton, (!canSave || isSubmitting) && styles.saveButtonDisabled]}
          onPress={onSave}>
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Please wait...' : buttonLabel}</Text>
        </Pressable>
      </View>
    </SettingsSection>
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

function SettingsSection({
  children,
  danger = false,
  title,
}: {
  children: ReactNode;
  danger?: boolean;
  title: string;
}) {
  const fadeAnim = useState(() => new Animated.Value(0))[0];
  const slideAnim = useState(() => new Animated.Value(8))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        duration: 180,
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        duration: 180,
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, danger && styles.sectionAccentDanger]} />
        <Text style={[styles.sectionTitle, danger && styles.dangerText]}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function SettingsRow({
  danger = false,
  detail,
  icon: Icon,
  onPress,
  title,
}: SettingsItem) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} style={styles.settingsRow} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon size={theme.icon.md} color={danger ? pastelDanger : theme.colors.textMuted} />
      </View>
      <Text style={[styles.rowTitle, styles.settingsRowTitle, danger && styles.dangerText]}>{title}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      {onPress ? <ChevronRight size={theme.icon.sm} color={danger ? pastelDanger : theme.colors.primary} /> : null}
    </Pressable>
  );
}

function ToggleRow({
  description,
  disabled = false,
  icon: Icon,
  title,
  value,
  onValueChange,
}: {
  description: string;
  disabled?: boolean;
  icon: RowIcon;
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.detailRow, disabled && styles.disabledRow]}>
      <View style={styles.rowIcon}>
        <Icon size={theme.icon.md} color={theme.colors.textMuted} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <LightToggle disabled={disabled} value={value} onValueChange={onValueChange} />
    </View>
  );
}

function LightToggle({
  disabled = false,
  value,
  onValueChange,
}: {
  disabled?: boolean;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      style={[styles.lightToggleTrack, value && styles.lightToggleTrackOn, disabled && styles.lightToggleDisabled]}
      onPress={() => onValueChange(!value)}>
      <View style={[styles.lightToggleThumb, value && styles.lightToggleThumbOn]} />
    </Pressable>
  );
}

function SelectorRow({
  icon: Icon,
  onPress,
  title,
  value,
}: {
  icon: RowIcon;
  onPress: () => void;
  title: string;
  value: string;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.detailRow} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon size={theme.icon.md} color={theme.colors.textMuted} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{value}</Text>
      </View>
      <ChevronDown size={theme.icon.md} color={theme.colors.text} />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function getHeaderTitle(activeView: ActiveView) {
  switch (activeView) {
    case 'account':
      return 'Account';
    case 'security':
      return 'Security';
    case 'notifications':
      return 'Notification';
    case 'preferences':
      return 'Preferences';
    case 'contact':
      return 'Contact';
    case 'username':
      return 'Username';
    case 'displayName':
      return 'Name';
    case 'email':
      return 'Email';
    case 'phone':
      return 'Phone';
    case 'password':
      return 'Password';
    default:
      return 'Settings';
  }
}

function isAccountEditView(activeView: ActiveView): activeView is EditableAccountField | 'password' {
  return ['displayName', 'email', 'phone', 'username', 'password'].includes(activeView);
}

function formatDisplayName(firstName: string, middleName: string, lastName: string) {
  return [firstName, middleName, lastName].map((part) => part.trim()).filter(Boolean).join(' ');
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
  screen: {
    backgroundColor: '#F4F5F7',
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 44,
  },
  closeButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -6,
    width: 42,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    padding: 0,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionAccent: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 14,
    width: 4,
  },
  sectionAccentDanger: {
    backgroundColor: pastelDanger,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(46, 139, 52, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(46, 139, 52, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: 68,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 82,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  disabledRow: {
    opacity: 0.58,
  },
  lightToggleTrack: {
    alignItems: 'center',
    backgroundColor: '#EEF1F0',
    borderColor: '#DDE4E0',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    height: 30,
    paddingHorizontal: 3,
    width: 52,
  },
  lightToggleTrackOn: {
    backgroundColor: '#E8F4ED',
    borderColor: '#C9E1D0',
  },
  lightToggleDisabled: {
    opacity: 0.48,
  },
  lightToggleThumb: {
    backgroundColor: theme.colors.white,
    borderColor: '#D2DAD6',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 24,
    width: 24,
  },
  lightToggleThumbOn: {
    backgroundColor: '#8CC89A',
    borderColor: '#7DBB8B',
    transform: [{ translateX: 20 }],
  },
  rowIcon: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  rowTextBlock: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
  settingsRowTitle: {
    flex: 1,
  },
  rowDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  rowDetail: {
    color: theme.colors.textMuted,
    flexShrink: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    textAlign: 'right',
  },
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.07)',
    height: 1,
    marginLeft: 66,
  },
  statusPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    margin: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  statusPanelText: {
    color: theme.colors.primaryDark,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  usernameInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
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
    fontFamily: Fonts.sansSemiBold,
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
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  strengthValue: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 12,
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
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 17,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  dangerText: {
    color: pastelDanger,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    width: '100%',
  },
  modalIconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(217, 107, 107, 0.22)',
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  modalCopy: {
    gap: theme.spacing.sm,
  },
  modalTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalMessage: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  confirmLogoutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmLogoutText: {
    color: pastelDanger,
    fontSize: 15,
    fontWeight: '800',
  },
});

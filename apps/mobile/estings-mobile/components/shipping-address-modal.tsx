import { Check, ChevronDown, LockKeyhole, MapPinned } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddressMapPicker } from '@/components/address-map-picker';
import { AppPageHeader } from '@/components/app-page-header';
import { Fonts, theme } from '@/constants/theme';
import { getAddressZoneLabel, type VerifiedAddress } from '@/services/location-api';

export type CountryCode = {
  code: string;
  label: string;
  name: string;
};

export type ShippingAddressFormValue = {
  addressDetails: string;
  barangay: string;
  city: string;
  formattedAddress: string;
  isDefault: boolean;
  label?: string;
  province: string;
  region: string;
  street: string;
  verificationToken: string | null;
  verifiedAddress: VerifiedAddress;
};

export const countryCodes: CountryCode[] = [
  { code: '+63', label: 'PH', name: 'Philippines' },
  { code: '+1', label: 'US', name: 'United States / Canada' },
  { code: '+44', label: 'UK', name: 'United Kingdom' },
  { code: '+61', label: 'AU', name: 'Australia' },
  { code: '+64', label: 'NZ', name: 'New Zealand' },
  { code: '+65', label: 'SG', name: 'Singapore' },
  { code: '+60', label: 'MY', name: 'Malaysia' },
  { code: '+62', label: 'ID', name: 'Indonesia' },
  { code: '+81', label: 'JP', name: 'Japan' },
  { code: '+971', label: 'AE', name: 'United Arab Emirates' },
];

export function getCountryForPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') ?? '';

  return (
    [...countryCodes]
      .sort((first, second) => second.code.length - first.code.length)
      .find((country) => digits.startsWith(country.code.replace(/\D/g, ''))) ?? countryCodes[0]
  );
}

export function normalizeLocalPhone(phone: string, countryCode: string) {
  const countryDigits = countryCode.replace(/\D/g, '');
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith(countryDigits)) {
    digits = digits.slice(countryDigits.length);
  }

  if (countryCode === '+63') {
    digits = digits.replace(/^0+/, '').slice(0, 10);
  }

  return digits;
}

export function formatPhoneForDisplay(phone: string, countryCode: string) {
  const digits = normalizeLocalPhone(phone, countryCode);

  if (countryCode === '+63') {
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');
  }

  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function toCanonicalPhone(phone: string, countryCode: string) {
  return `${countryCode}${normalizeLocalPhone(phone, countryCode)}`;
}

export function splitRecipientName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export type ShippingAddressModalProps = {
  address?: string;
  addressDetails?: string;
  country: CountryCode;
  firstName: string;
  initialAddress?: VerifiedAddress | null;
  isDefaultAddress: boolean;
  label?: string;
  lastName: string;
  onClose: () => void;
  onCountryChange: (country: CountryCode) => void;
  onFirstNameChange: (value: string) => void;
  onLabelChange?: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSave: (value: ShippingAddressFormValue) => Promise<void>;
  phone: string;
  showLabel?: boolean;
  title?: string;
  visible: boolean;
};

export function ShippingAddressModal(props: ShippingAddressModalProps) {
  const [verifiedAddress, setVerifiedAddress] = useState<VerifiedAddress | null>(props.initialAddress ?? null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState(props.addressDetails ?? '');
  const [isDefaultAddress, setIsDefaultAddress] = useState(props.isDefaultAddress);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!props.visible) {
      return;
    }

    setVerifiedAddress(props.initialAddress ?? null);
    setVerificationToken(null);
    setAddressDetails(props.addressDetails ?? '');
    setIsDefaultAddress(props.isDefaultAddress);
  }, [props.addressDetails, props.initialAddress, props.isDefaultAddress, props.visible]);

  async function saveAddress() {
    if (!props.firstName.trim() || !props.phone.trim()) {
      Alert.alert('Complete recipient details', 'First name and phone number are required.');
      return;
    }

    if (!verifiedAddress || !verifiedAddress.is_serviceable) {
      Alert.alert(
        'Pin a supported address',
        "Choose and verify a delivery pin within NCR or Pampanga before saving.",
      );
      return;
    }

    if (!verificationToken && !props.initialAddress) {
      Alert.alert('Re-pin this address', 'This address has not been verified yet. Place its pin on the map.');
      return;
    }

    setIsSaving(true);
    try {
      await props.onSave({
        addressDetails: addressDetails.trim(),
        barangay: verifiedAddress.barangay ?? '',
        city: verifiedAddress.city,
        formattedAddress: verifiedAddress.formatted_address,
        isDefault: isDefaultAddress,
        label: props.label,
        province: verifiedAddress.province,
        region: verifiedAddress.region ?? '',
        street: verifiedAddress.street,
        verificationToken,
        verifiedAddress,
      });
      props.onClose();
    } catch (error) {
      Alert.alert(
        'We could not save this address',
        getFriendlyAddressError(error),
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasLegacyAddress = Boolean(props.address?.trim()) && !props.initialAddress;

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} visible={props.visible}>
      <View style={styles.addressScreen}>
        <AppPageHeader
          onBack={props.onClose}
          title={props.title ?? (props.address?.trim() ? 'Change Shipping Address' : 'Add Shipping Address')}
        />
        <ScrollView
          contentContainerStyle={styles.addressForm}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {props.showLabel ? (
            <AddressField label="Label">
              <TextInput
                maxLength={30}
                onChangeText={props.onLabelChange}
                placeholder="Home"
                placeholderTextColor="#AAAAAA"
                style={styles.addressFieldInput}
                value={props.label}
              />
            </AddressField>
          ) : null}
          <AddressField label="Phone Number">
            <PhoneNumberField
              country={props.country}
              onCountryChange={props.onCountryChange}
              onPhoneChange={props.onPhoneChange}
              phone={props.phone}
            />
          </AddressField>
          <AddressField label="First Name">
            <TextInput
              onChangeText={props.onFirstNameChange}
              placeholder="Juana"
              placeholderTextColor="#AAAAAA"
              style={styles.addressFieldInput}
              value={props.firstName}
            />
          </AddressField>
          <AddressField label="Last Name">
            <TextInput
              onChangeText={props.onLastNameChange}
              placeholder="dela Cruz"
              placeholderTextColor="#AAAAAA"
              style={styles.addressFieldInput}
              value={props.lastName}
            />
          </AddressField>

          <View style={styles.addressSectionDivider} />
          <View style={styles.sectionHeading}>
            <MapPinned color={theme.colors.primary} size={19} />
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionTitle}>Pin the delivery location</Text>
              <Text style={styles.sectionHint}>The verified map result is the saved address.</Text>
            </View>
          </View>

          {hasLegacyAddress ? (
            <View style={styles.legacyNotice}>
              <Text style={styles.legacyNoticeTitle}>This saved address needs verification</Text>
              <Text style={styles.legacyNoticeText}>
                Its previous text remains visible, but you must place the exact pin before it can be saved or used for delivery.
              </Text>
            </View>
          ) : null}

          <AddressMapPicker
            initialAddress={props.initialAddress}
            onSelectionChange={(selection) => {
              setVerifiedAddress(selection?.address ?? null);
              setVerificationToken(selection?.verificationToken ?? null);
            }}
          />

          {verifiedAddress ? (
            <View style={styles.verifiedCard}>
              <View style={styles.verifiedTitleRow}>
                <View style={styles.verifiedIcon}>
                  <Check color={theme.colors.white} size={15} strokeWidth={3} />
                </View>
                <Text style={styles.verifiedTitle}>Verified delivery address</Text>
              </View>
              <Text style={styles.verifiedAddress}>{verifiedAddress.formatted_address}</Text>
              <Text style={styles.zoneText}>{getAddressZoneLabel(verifiedAddress)}</Text>
              <View style={styles.lockedRow}>
                <LockKeyhole color={theme.colors.textMuted} size={14} />
                <Text style={styles.lockedText}>Canonical address fields are locked to this pin.</Text>
              </View>
            </View>
          ) : null}

          <Checkbox
            checked={isDefaultAddress}
            label="Set as default shipping address"
            onPress={() => setIsDefaultAddress((current) => !current)}
          />
        </ScrollView>
        <View style={styles.addressFooter}>
          <Pressable
            disabled={isSaving || !verifiedAddress}
            onPress={() => void saveAddress()}
            style={({ pressed }) => [
              styles.addressSaveButton,
              (isSaving || !verifiedAddress) && styles.disabled,
              pressed && styles.controlPressed,
            ]}>
            <Text style={styles.addressSaveButtonText}>
              {isSaving ? 'Saving...' : props.address?.trim() ? 'Save Address' : 'Add Address'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getFriendlyAddressError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('network') || message.includes('unable to reach')) {
    return 'Check your internet connection, then try saving the address again.';
  }

  if (message.includes('pin') || message.includes('verify') || message.includes('coordinate')) {
    return 'Confirm the exact location on the map, then try saving again.';
  }

  if (message.includes('recipient') || message.includes('phone')) {
    return 'Enter the recipient’s name and phone number, then try again.';
  }

  return 'Please review the address and try again.';
}

function PhoneNumberField({
  country,
  onCountryChange,
  onPhoneChange,
  phone,
}: {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onPhoneChange: (value: string) => void;
  phone: string;
}) {
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  return (
    <>
      <View style={styles.phoneField}>
        <Pressable
          accessibilityLabel="Select country code"
          onPress={() => setIsCountryOpen(true)}
          style={({ pressed }) => [styles.countrySelector, pressed && styles.controlPressed]}>
          <Text style={styles.countryFlag}>{country.label}</Text>
          <Text style={styles.countryCode}>{country.code}</Text>
          <ChevronDown color="#777777" size={15} />
        </Pressable>
        <View style={styles.phoneDivider} />
        <TextInput
          keyboardType="phone-pad"
          maxLength={country.code === '+63' ? 12 : 20}
          onChangeText={(value) => onPhoneChange(normalizeLocalPhone(value, country.code))}
          placeholder="917 123 4567"
          placeholderTextColor="#AAAAAA"
          style={styles.phoneInput}
          value={formatPhoneForDisplay(phone, country.code)}
        />
      </View>
      <Modal animationType="slide" onRequestClose={() => setIsCountryOpen(false)} transparent visible={isCountryOpen}>
        <View style={styles.modalOverlay}>
          <View style={styles.countrySheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select country code</Text>
              <Pressable onPress={() => setIsCountryOpen(false)}>
                <Text style={styles.doneText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {countryCodes.map((option) => {
                const selected = option.code === country.code && option.name === country.name;
                return (
                  <Pressable
                    key={`${option.name}-${option.code}`}
                    onPress={() => {
                      onCountryChange(option);
                      setIsCountryOpen(false);
                    }}
                    style={[styles.countryOption, selected && styles.countryOptionSelected]}>
                    <Text style={styles.countryOptionFlag}>{option.label}</Text>
                    <Text style={styles.countryOptionName}>{option.name}</Text>
                    <Text style={styles.countryOptionCode}>{option.code}</Text>
                    {selected ? <Check color={theme.colors.primary} size={18} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Checkbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.checkboxRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Check color={theme.colors.white} size={14} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

function AddressField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.addressFieldGroup}>
      <Text style={styles.addressFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  addressScreen: { backgroundColor: '#F5F5F5', flex: 1 },
  addressForm: { gap: 12, padding: 16, paddingBottom: 118 },
  addressFieldGroup: { gap: 6 },
  addressFieldLabel: { color: '#777777', fontFamily: Fonts.sans, fontSize: 11 },
  addressFieldInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C5C5C5',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: '#444444',
    fontFamily: Fonts.sans,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  detailsInput: { minHeight: 82, paddingTop: 12 },
  characterCount: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10, textAlign: 'right' },
  addressSectionDivider: { backgroundColor: '#D7D7D7', height: StyleSheet.hairlineWidth, marginVertical: 4 },
  sectionHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: 9 },
  sectionHeadingCopy: { flex: 1, gap: 2 },
  sectionTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  sectionHint: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  legacyNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#E7C66D',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: 3,
    padding: 12,
  },
  legacyNoticeTitle: { color: '#6C5110', fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  legacyNoticeText: { color: '#6C5110', fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  verifiedCard: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 7,
    padding: 13,
  },
  verifiedTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  verifiedIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  verifiedTitle: { color: theme.colors.primaryDark, fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  verifiedAddress: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  zoneText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansSemiBold, fontSize: 11 },
  lockedRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  lockedText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10 },
  phoneField: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C5C5C5',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  countrySelector: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 46 },
  countryFlag: { color: '#555555', fontFamily: Fonts.sansSemiBold, fontSize: 12, minWidth: 22 },
  countryCode: { color: '#555555', fontFamily: Fonts.sansMedium, fontSize: 13, marginLeft: 6 },
  phoneDivider: { backgroundColor: '#D7D7D7', height: 22, marginHorizontal: 10, width: StyleSheet.hairlineWidth },
  phoneInput: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, minHeight: 46, paddingVertical: 0 },
  modalOverlay: { backgroundColor: 'rgba(18, 24, 20, 0.4)', flex: 1, justifyContent: 'flex-end' },
  countrySheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: theme.spacing.md,
    maxHeight: '75%',
    padding: theme.spacing.lg,
  },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 18 },
  doneText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 14, padding: theme.spacing.sm },
  countryOption: {
    alignItems: 'center',
    borderBottomColor: theme.colors.subtleBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 4,
  },
  countryOptionSelected: { backgroundColor: theme.colors.greenSoft },
  countryOptionFlag: { color: theme.colors.textMuted, fontFamily: Fonts.sansSemiBold, fontSize: 12, width: 28 },
  countryOptionName: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sans, fontSize: 14 },
  countryOptionCode: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 13 },
  checkboxRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48 },
  checkbox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C5C5C5',
    borderRadius: 3,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkboxLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13 },
  addressFooter: { backgroundColor: '#F5F5F5', bottom: 0, left: 0, padding: 16, position: 'absolute', right: 0 },
  addressSaveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    minHeight: 56,
  },
  addressSaveButtonText: { color: theme.colors.white, fontFamily: Fonts.sansMedium, fontSize: 14 },
  disabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});

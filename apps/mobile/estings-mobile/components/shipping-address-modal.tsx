import { ChevronDown, Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppPageHeader } from '@/components/app-page-header';
import { Fonts, theme } from '@/constants/theme';
import {
  findLocationByName,
  getPhilippineBarangays,
  getPhilippineCities,
  getPhilippineProvinces,
  getPhilippineRegions,
  type PhilippineLocationOption,
} from '@/utils/philippine-locations';

export type CountryCode = {
  code: string;
  label: string;
  name: string;
};

export type ShippingAddressFormValue = {
  barangay: string;
  city: string;
  formattedAddress: string;
  isDefault: boolean;
  label?: string;
  province: string;
  region: string;
  street: string;
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
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
      .filter(Boolean)
      .join(' ');
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

type ShippingAddressModalProps = {
  address: string;
  country: CountryCode;
  firstName: string;
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
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState('');
  const [barangayCode, setBarangayCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(props.isDefaultAddress);
  const [isSaving, setIsSaving] = useState(false);
  const regionOptions = useMemo(() => getPhilippineRegions(), []);
  const provinceOptions = useMemo(() => getPhilippineProvinces(regionCode), [regionCode]);
  const cityOptions = useMemo(
    () => getPhilippineCities(regionCode, provinceCode),
    [provinceCode, regionCode],
  );
  const barangayOptions = useMemo(() => getPhilippineBarangays(cityCode), [cityCode]);

  useEffect(() => {
    if (!props.visible) return;
    const parts = props.address.split(',').map((part) => part.trim()).filter(Boolean);
    const nextStreet = parts[0] ?? '';
    const nextBarangay = parts[1] ?? '';
    const nextCity = parts[2] ?? '';
    const nextProvince = parts[3] ?? '';
    const nextRegion = parts.slice(4).join(', ');
    const matchedRegion = findLocationByName(regionOptions, nextRegion);
    const nextProvinceOptions = matchedRegion ? getPhilippineProvinces(matchedRegion.code) : [];
    const matchedProvince = findLocationByName(nextProvinceOptions, nextProvince);
    const resolvedProvince =
      matchedProvince ??
      (nextProvinceOptions.length === 1 && nextProvinceOptions[0].code === '-NO PROVINCE-'
        ? nextProvinceOptions[0]
        : undefined);
    const nextCityOptions =
      matchedRegion && resolvedProvince
        ? getPhilippineCities(matchedRegion.code, resolvedProvince.code)
        : [];
    const matchedCity = findLocationByName(nextCityOptions, nextCity);
    const nextBarangayOptions = matchedCity ? getPhilippineBarangays(matchedCity.code) : [];
    const matchedBarangay = findLocationByName(nextBarangayOptions, nextBarangay);

    setStreet(nextStreet);
    setBarangay(matchedBarangay?.name ?? nextBarangay);
    setBarangayCode(matchedBarangay?.code ?? '');
    setCity(matchedCity?.name ?? nextCity);
    setCityCode(matchedCity?.code ?? '');
    setProvince(resolvedProvince?.name ?? nextProvince);
    setProvinceCode(resolvedProvince?.code ?? '');
    setRegion(matchedRegion?.name ?? nextRegion);
    setRegionCode(matchedRegion?.code ?? '');
    setIsDefaultAddress(props.isDefaultAddress);
  }, [props.address, props.isDefaultAddress, props.visible, regionOptions]);

  const saveAddress = async () => {
    if (!props.firstName.trim() || !props.phone.trim()) {
      Alert.alert('Complete recipient details', 'First name and phone number are required.');
      return;
    }
    if (!street.trim() || !regionCode || !provinceCode || !cityCode || !barangayCode) {
      Alert.alert('Complete the address', 'Select a region, province, city or municipality, and barangay.');
      return;
    }

    const provinceName = provinceCode === '-NO PROVINCE-' ? 'Metro Manila' : province;
    const formattedAddress = [street, barangay, city, provinceName, region]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');

    setIsSaving(true);
    try {
      await props.onSave({
        barangay,
        city,
        formattedAddress,
        isDefault: isDefaultAddress,
        label: props.label,
        province: provinceName,
        region,
        street: street.trim(),
      });
      props.onClose();
    } catch (error) {
      Alert.alert(
        'Address not saved',
        error instanceof Error ? error.message : 'Unable to save the address. Try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectRegion = (option: PhilippineLocationOption) => {
    const nextProvinces = getPhilippineProvinces(option.code);

    setRegion(option.name);
    setRegionCode(option.code);
    setProvince(nextProvinces.length === 1 && nextProvinces[0].code === '-NO PROVINCE-' ? nextProvinces[0].name : '');
    setProvinceCode(nextProvinces.length === 1 && nextProvinces[0].code === '-NO PROVINCE-' ? nextProvinces[0].code : '');
    setCity('');
    setCityCode('');
    setBarangay('');
    setBarangayCode('');
  };

  const selectProvince = (option: PhilippineLocationOption) => {
    setProvince(option.name);
    setProvinceCode(option.code);
    setCity('');
    setCityCode('');
    setBarangay('');
    setBarangayCode('');
  };

  const selectCity = (option: PhilippineLocationOption) => {
    setCity(option.name);
    setCityCode(option.code);
    setBarangay('');
    setBarangayCode('');
  };

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} visible={props.visible}>
      <View style={styles.addressScreen}>
        <AppPageHeader
          onBack={props.onClose}
          title={props.title ?? (props.address.trim() ? 'Change Shipping Address' : 'Add Shipping Address')}
        />
        <ScrollView
          contentContainerStyle={styles.addressForm}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {props.showLabel ? (
            <AddressField label="Label">
              <TextInput
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
            <TextInput onChangeText={props.onFirstNameChange} placeholder="Juana" placeholderTextColor="#AAAAAA" style={styles.addressFieldInput} value={props.firstName} />
          </AddressField>
          <AddressField label="Last Name">
            <TextInput onChangeText={props.onLastNameChange} placeholder="dela Cruz" placeholderTextColor="#AAAAAA" style={styles.addressFieldInput} value={props.lastName} />
          </AddressField>
          <View style={styles.addressSectionDivider} />
          <AddressField label="House No. / Building / Street">
            <TextInput onChangeText={setStreet} placeholder="e.g. 123 Sampaguita Street" placeholderTextColor="#AAAAAA" style={styles.addressFieldInput} value={street} />
          </AddressField>
          <AddressField label="Region">
            <LocationSelect
              onSelect={selectRegion}
              options={regionOptions}
              placeholder="Select a region"
              title="Select region"
              value={region}
            />
          </AddressField>
          {regionCode && provinceCode !== '-NO PROVINCE-' ? (
            <AddressField label="Province">
              <LocationSelect
                onSelect={selectProvince}
                options={provinceOptions}
                placeholder="Select a province"
                title="Select province"
                value={province}
              />
            </AddressField>
          ) : null}
          {provinceCode ? (
            <AddressField label="City / Municipality">
              <LocationSelect
                onSelect={selectCity}
                options={cityOptions}
                placeholder="Select a city or municipality"
                title="Select city or municipality"
                value={city}
              />
            </AddressField>
          ) : null}
          {cityCode ? (
            <AddressField label="Barangay">
              <LocationSelect
                onSelect={(option) => {
                  setBarangay(option.name);
                  setBarangayCode(option.code);
                }}
                options={barangayOptions}
                placeholder="Select a barangay"
                title="Select barangay"
                value={barangay}
              />
            </AddressField>
          ) : null}
          <Checkbox checked={isDefaultAddress} label="Set as default shipping address" onPress={() => setIsDefaultAddress((current) => !current)} />
        </ScrollView>
        <View style={styles.addressFooter}>
          <Pressable
            disabled={isSaving}
            onPress={saveAddress}
            style={({ pressed }) => [styles.addressSaveButton, isSaving && styles.disabled, pressed && styles.controlPressed]}>
            <Text style={styles.addressSaveButtonText}>
              {isSaving ? 'Saving...' : props.address.trim() ? 'Save Address' : 'Add Address'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
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
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked ? <Check color={theme.colors.white} size={14} strokeWidth={3} /> : null}</View>
      <Text style={styles.radioLabel}>{label}</Text>
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

function LocationSelect({
  disabled = false,
  onSelect,
  options,
  placeholder,
  title,
  value,
}: {
  disabled?: boolean;
  onSelect: (option: PhilippineLocationOption) => void;
  options: readonly PhilippineLocationOption[];
  placeholder: string;
  title: string;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(28)).current;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const open = () => {
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(28);
    setIsOpen(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          duration: 160,
          toValue: 1,
          useNativeDriver: false,
        }),
        Animated.timing(sheetTranslateY, {
          duration: 220,
          toValue: 0,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 140,
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.timing(sheetTranslateY, {
        duration: 180,
        toValue: 28,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsOpen(false);
        setQuery('');
      }
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => [
          styles.addressSelectField,
          disabled && styles.addressSelectDisabled,
          pressed && !disabled && styles.controlPressed,
        ]}>
        <Text numberOfLines={1} style={[styles.addressSelectText, !value && styles.addressSelectPlaceholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown color="#777777" size={18} />
      </Pressable>
      <Modal animationType="none" onRequestClose={close} transparent visible={isOpen}>
        <View style={styles.locationModalOverlay}>
          <Animated.View pointerEvents="none" style={[styles.locationBackdrop, { opacity: backdropOpacity }]} />
          <Pressable accessibilityLabel="Close location selection" onPress={close} style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.locationSheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.locationSheetHeader}>
              <Text style={styles.locationSheetTitle}>{title}</Text>
              <Pressable accessibilityRole="button" onPress={close}>
                <Text style={styles.doneText}>Cancel</Text>
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder={`Search ${title.toLowerCase().replace('select ', '')}`}
              placeholderTextColor="#999999"
              style={styles.locationSearchInput}
              value={query}
            />
            <FlatList
              contentContainerStyle={styles.locationList}
              data={filteredOptions}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(option) => option.code}
              ListEmptyComponent={<Text style={styles.locationEmptyText}>No matching location found.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}
                  style={({ pressed }) => [styles.locationOption, pressed && styles.locationOptionPressed]}>
                  <Text style={styles.locationOptionText}>{item.name}</Text>
                  {item.name === value ? <Check color={theme.colors.primary} size={18} /> : null}
                </Pressable>
              )}
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addressScreen: { backgroundColor: '#F5F5F5', flex: 1 },
  addressForm: { gap: 12, padding: 16, paddingBottom: 108 },
  addressFieldGroup: { gap: 6 },
  addressFieldLabel: { color: '#777777', fontFamily: Fonts.sans, fontSize: 11 },
  addressFieldInput: { backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, color: '#444444', fontFamily: Fonts.sans, fontSize: 14, minHeight: 48, paddingHorizontal: 12 },
  addressSectionDivider: { backgroundColor: '#D7D7D7', height: StyleSheet.hairlineWidth, marginVertical: 4, width: '100%' },
  phoneField: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', minHeight: 48, paddingHorizontal: 12 },
  countrySelector: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 46 },
  countryFlag: { color: '#555555', fontFamily: Fonts.sansSemiBold, fontSize: 12, minWidth: 22 },
  countryCode: { color: '#555555', fontFamily: Fonts.sansMedium, fontSize: 13, marginLeft: 6 },
  phoneDivider: { backgroundColor: '#D7D7D7', height: 22, marginHorizontal: 10, width: StyleSheet.hairlineWidth },
  phoneInput: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, minHeight: 46, paddingVertical: 0 },
  modalOverlay: { backgroundColor: 'rgba(18, 24, 20, 0.4)', flex: 1, justifyContent: 'flex-end' },
  countrySheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: theme.spacing.md, maxHeight: '75%', padding: theme.spacing.lg },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 18 },
  doneText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 14, padding: theme.spacing.sm },
  countryOption: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 4 },
  countryOptionSelected: { backgroundColor: theme.colors.greenSoft },
  countryOptionFlag: { color: theme.colors.textMuted, fontFamily: Fonts.sansSemiBold, fontSize: 12, width: 28 },
  countryOptionName: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sans, fontSize: 14 },
  countryOptionCode: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 13 },
  checkboxRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48 },
  checkbox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: 3, borderWidth: 1, height: 28, justifyContent: 'center', width: 28 },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  radioLabel: { color: '#555555', fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center' },
  addressSelectField: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C5C5C5', borderRadius: theme.radius.sm, borderWidth: 1, flexDirection: 'row', minHeight: 48, paddingRight: 12 },
  addressSelectDisabled: { backgroundColor: '#EEEEEE', opacity: 0.62 },
  addressSelectText: { color: '#444444', flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingHorizontal: 12 },
  addressSelectPlaceholder: { color: '#AAAAAA' },
  locationModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  locationBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  locationSheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '82%', minHeight: '55%', paddingBottom: 16 },
  locationSheetHeader: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 18 },
  locationSheetTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  locationSearchInput: { backgroundColor: '#F3F4F3', borderRadius: theme.radius.sm, color: theme.colors.text, fontFamily: Fonts.sans, fontSize: 14, marginHorizontal: 16, marginVertical: 12, minHeight: 46, paddingHorizontal: 14 },
  locationList: { paddingBottom: 16, paddingHorizontal: 16 },
  locationOption: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 4 },
  locationOptionPressed: { backgroundColor: theme.colors.greenSoft },
  locationOptionText: { color: theme.colors.text, flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingRight: 12 },
  locationEmptyText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 28, textAlign: 'center' },
  addressFooter: { backgroundColor: '#F5F5F5', bottom: 0, left: 0, padding: 16, position: 'absolute', right: 0 },
  addressSaveButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, justifyContent: 'center', minHeight: 56 },
  addressSaveButtonText: { color: theme.colors.white, fontFamily: Fonts.sansMedium, fontSize: 14 },
  disabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});

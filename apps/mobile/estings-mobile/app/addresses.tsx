import { router, useFocusEffect } from 'expo-router';
import { AlertTriangle, MapPin, Plus, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import {
  countryCodes,
  getCountryForPhone,
  normalizeLocalPhone,
  ShippingAddressModal,
  splitRecipientName,
  toCanonicalPhone,
  type CountryCode,
  type ShippingAddressFormValue,
} from '@/components/shipping-address-modal';
import { Fonts, theme } from '@/constants/theme';
import { addressesApi, type AccountAddress, type AccountAddressPayload } from '@/services/addresses-api';
import { getAuthSession } from '@/services/auth-session';
import { getAddressZoneLabel } from '@/services/location-api';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientCountry, setRecipientCountry] = useState<CountryCode>(countryCodes[0]);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [label, setLabel] = useState('Home');
  const [addressDetails, setAddressDetails] = useState('');
  const [editing, setEditing] = useState<AccountAddress | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = await getAuthSession();
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      setAddresses(await addressesApi.list(session.accessToken));
    } catch (error) {
      Alert.alert('We could not load your addresses', getFriendlyAddressError(error, 'load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  function openAddressModal(address: AccountAddress | null = null) {
    setEditing(address);

    if (address) {
      const name = splitRecipientName(address.recipient_name);
      const country = getCountryForPhone(address.phone);
      setRecipientFirstName(name.firstName);
      setRecipientLastName(name.lastName);
      setRecipientCountry(country);
      setRecipientPhone(normalizeLocalPhone(address.phone, country.code));
      setLabel(address.label || 'Home');
      setAddressDetails(address.address_details ?? '');
    } else {
      setRecipientFirstName('');
      setRecipientLastName('');
      setRecipientCountry(countryCodes[0]);
      setRecipientPhone('');
      setLabel('Home');
      setAddressDetails('');
    }

    setVisible(true);
  }

  async function save(value: ShippingAddressFormValue) {
    const recipientName = [recipientFirstName, recipientLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');

    if (!recipientName || !recipientPhone.trim()) {
      throw new Error('Recipient and phone are required.');
    }

    if (!editing && !value.verificationToken) {
      throw new Error('Place and verify the delivery pin before saving.');
    }

    const session = await getAuthSession();
    if (!session) {
      throw new Error('Your session expired. Sign in and try again.');
    }

    const payload: AccountAddressPayload = {
      is_default: value.isDefault,
      label: label.trim() || 'Home',
      phone: toCanonicalPhone(recipientPhone, recipientCountry.code),
      recipient_name: recipientName,
      verified_address: value.verifiedAddress,
    };

    if (editing) {
      await addressesApi.update(editing.id, payload, session.accessToken);
    } else {
      await addressesApi.create(payload, session.accessToken);
    }

    setVisible(false);
    setEditing(null);
    await load();
  }

  async function remove(address: AccountAddress) {
    const session = await getAuthSession();
    if (!session) return;

    try {
      await addressesApi.delete(address.id, session.accessToken);
      await load();
    } catch (error) {
      Alert.alert('Address not deleted', getFriendlyAddressError(error, 'delete'));
    }
  }

  async function makeDefault(address: AccountAddress) {
    if (!address.is_verified) {
      Alert.alert('Re-pin required', 'Verify this saved address on the map before making it your default.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Re-pin now', onPress: () => openAddressModal(address) },
      ]);
      return;
    }

    const session = await getAuthSession();
    if (!session) return;

    try {
      await addressesApi.setDefault(address.id, session.accessToken);
      await load();
    } catch (error) {
      Alert.alert('Default address not changed', getFriendlyAddressError(error, 'update'));
    }
  }

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Saved Addresses" />
      <FlatList
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        data={addresses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Loading addresses...' : 'No saved addresses yet.'}</Text>
        }
        renderItem={({ item }) => {
          const displayAddress = formatAccountAddress(item);
          return (
            <Pressable onPress={() => openAddressModal(item)} style={styles.card}>
              <MapPin color={theme.colors.primary} size={21} />
              <View style={styles.cardCopy}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  {item.is_default ? <Text style={styles.defaultTag}>Default</Text> : null}
                  {item.is_verified ? (
                    <View style={styles.statusTag}>
                      <ShieldCheck color={theme.colors.primary} size={11} />
                      <Text style={styles.verifiedTagText}>Verified</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusTag, styles.legacyTag]}>
                      <AlertTriangle color="#7A5700" size={11} />
                      <Text style={styles.legacyTagText}>Re-pin required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardText}>{item.recipient_name} · {item.phone}</Text>
                <Text style={styles.cardAddress}>{displayAddress}</Text>
                {item.address_details ? <Text style={styles.detailsText}>{item.address_details}</Text> : null}
                {item.is_verified ? <Text style={styles.zoneText}>{getAddressZoneLabel(item)}</Text> : null}
                <View style={styles.actions}>
                  {!item.is_default ? (
                    <Pressable onPress={() => void makeDefault(item)}>
                      <Text style={styles.actionText}>{item.is_verified ? 'Set default' : 'Re-pin to use'}</Text>
                    </Pressable>
                  ) : <View />}
                  <Pressable
                    accessibilityLabel="Delete address"
                    onPress={() =>
                      Alert.alert('Delete address?', 'This cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { style: 'destructive', text: 'Delete', onPress: () => void remove(item) },
                      ])
                    }>
                    <Trash2 color={theme.colors.danger} size={17} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable onPress={() => openAddressModal()} style={[styles.addButton, { bottom: insets.bottom + 20 }]}>
        <Plus color={theme.colors.white} size={19} />
        <Text style={styles.addButtonText}>Add address</Text>
      </Pressable>
      <ShippingAddressModal
        address={editing ? formatAccountAddress(editing) : ''}
        addressDetails={addressDetails}
        country={recipientCountry}
        firstName={recipientFirstName}
        initialAddress={editing?.is_verified ? editing : null}
        isDefaultAddress={editing?.is_default ?? false}
        label={label}
        lastName={recipientLastName}
        onClose={() => setVisible(false)}
        onCountryChange={setRecipientCountry}
        onFirstNameChange={setRecipientFirstName}
        onLabelChange={setLabel}
        onLastNameChange={setRecipientLastName}
        onPhoneChange={setRecipientPhone}
        onSave={save}
        phone={recipientPhone}
        showLabel
        title={editing ? (editing.is_verified ? 'Edit Address' : 'Re-pin Address') : 'Add Address'}
        visible={visible}
      />
    </View>
  );
}

function formatAccountAddress(address: AccountAddress) {
  if (address.formatted_address) {
    return address.formatted_address;
  }

  return [address.street, address.barangay, address.city, address.province].filter(Boolean).join(', ');
}

function getFriendlyAddressError(error: unknown, action: 'delete' | 'load' | 'update') {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('network') || message.includes('unable to reach')) {
    return 'Check your internet connection, then try again.';
  }

  if (action === 'delete') {
    return 'This address could not be deleted right now. Please try again.';
  }

  if (action === 'update') {
    return 'This address could not be updated right now. Please try again.';
  }

  return 'Your saved addresses are temporarily unavailable. Please try again.';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  content: { gap: 12, padding: 16 },
  empty: { color: theme.colors.textMuted, fontFamily: Fonts.sans, paddingTop: 60, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderColor: '#DDD',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cardCopy: { flex: 1, gap: 6 },
  titleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  cardText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  cardAddress: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 18 },
  detailsText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  zoneText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansSemiBold, fontSize: 10 },
  defaultTag: {
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 5,
    color: theme.colors.primary,
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusTag: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 5,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  verifiedTagText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 9 },
  legacyTag: { backgroundColor: '#FFF1C9' },
  legacyTagText: { color: '#7A5700', fontFamily: Fonts.sansMedium, fontSize: 9 },
  actions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 },
  actionText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  addButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 22,
    position: 'absolute',
  },
  addButtonText: { color: '#fff', fontFamily: Fonts.sansSemiBold, fontSize: 14 },
});

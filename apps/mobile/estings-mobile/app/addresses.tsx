import { router, useFocusEffect } from 'expo-router';
import { MapPin, Plus, Trash2 } from 'lucide-react-native';
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

const emptyForm: AccountAddressPayload = {
  city: '',
  is_default: false,
  label: 'Home',
  phone: '',
  province: '',
  recipient_name: '',
  street: '',
};

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [form, setForm] = useState<AccountAddressPayload>(emptyForm);
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientCountry, setRecipientCountry] = useState<CountryCode>(countryCodes[0]);
  const [recipientPhone, setRecipientPhone] = useState('');
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
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const openAddressModal = (address: AccountAddress | null = null) => {
    setEditing(address);
    if (address) {
      const name = splitRecipientName(address.recipient_name);
      const country = getCountryForPhone(address.phone);
      setForm({
        barangay: address.barangay ?? undefined,
        city: address.city,
        is_default: address.is_default,
        label: address.label,
        phone: address.phone,
        province: address.province,
        recipient_name: address.recipient_name,
        street: address.street,
        zip_code: address.zip_code ?? undefined,
      });
      setRecipientFirstName(name.firstName);
      setRecipientLastName(name.lastName);
      setRecipientCountry(country);
      setRecipientPhone(normalizeLocalPhone(address.phone, country.code));
    } else {
      setForm(emptyForm);
      setRecipientFirstName('');
      setRecipientLastName('');
      setRecipientCountry(countryCodes[0]);
      setRecipientPhone('');
    }
    setVisible(true);
  };

  const save = async (value: ShippingAddressFormValue) => {
    const recipientName = [recipientFirstName, recipientLastName].map((part) => part.trim()).filter(Boolean).join(' ');
    if (!recipientName || !recipientPhone.trim()) {
      Alert.alert('Complete address', 'Recipient and phone are required.');
      return;
    }
    const session = await getAuthSession();
    if (!session) return;

    const payload: AccountAddressPayload = {
      barangay: value.barangay,
      city: value.city,
      is_default: value.isDefault,
      label: form.label.trim() || 'Home',
      phone: toCanonicalPhone(recipientPhone, recipientCountry.code),
      province: value.province,
      recipient_name: recipientName,
      street: value.street,
      zip_code: form.zip_code,
    };

    if (editing) await addressesApi.update(editing.id, payload, session.accessToken);
    else await addressesApi.create(payload, session.accessToken);
    setVisible(false);
    setEditing(null);
    setForm(emptyForm);
    await load();
  };

  const remove = async (address: AccountAddress) => {
    const session = await getAuthSession();
    if (!session) return;
    await addressesApi.delete(address.id, session.accessToken);
    await load();
  };

  const makeDefault = async (address: AccountAddress) => {
    const session = await getAuthSession();
    if (!session) return;
    await addressesApi.setDefault(address.id, session.accessToken);
    await load();
  };

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Saved Addresses" />
      <FlatList
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        data={addresses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading addresses...' : 'No saved addresses yet.'}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openAddressModal(item)}
            style={styles.card}>
            <MapPin color={theme.colors.primary} size={21} />
            <View style={styles.cardCopy}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                {item.is_default ? <Text style={styles.defaultTag}>Default</Text> : null}
              </View>
              <Text style={styles.cardText}>{item.recipient_name} · {item.phone}</Text>
              <Text style={styles.cardText}>{[item.street, item.barangay, item.city, item.province].filter(Boolean).join(', ')}</Text>
              <View style={styles.actions}>
                {!item.is_default ? <Pressable onPress={() => void makeDefault(item)}><Text style={styles.actionText}>Set default</Text></Pressable> : null}
                <Pressable onPress={() => Alert.alert('Delete address?', 'This cannot be undone.', [{ text: 'Cancel' }, { style: 'destructive', text: 'Delete', onPress: () => void remove(item) }])}>
                  <Trash2 color={theme.colors.danger} size={17} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
      <Pressable onPress={() => openAddressModal()} style={[styles.addButton, { bottom: insets.bottom + 20 }]}>
        <Plus color={theme.colors.white} size={19} /><Text style={styles.addButtonText}>Add address</Text>
      </Pressable>
      <ShippingAddressModal
        address={[form.street, form.barangay, form.city, form.province].filter(Boolean).join(', ')}
        country={recipientCountry}
        firstName={recipientFirstName}
        isDefaultAddress={form.is_default}
        label={form.label}
        lastName={recipientLastName}
        onClose={() => setVisible(false)}
        onCountryChange={setRecipientCountry}
        onFirstNameChange={setRecipientFirstName}
        onLabelChange={(label) => setForm((current) => ({ ...current, label }))}
        onLastNameChange={setRecipientLastName}
        onPhoneChange={setRecipientPhone}
        onSave={save}
        phone={recipientPhone}
        showLabel
        title={editing ? 'Edit Address' : 'Add Address'}
        visible={visible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  content: { gap: 12, padding: 16 },
  empty: { color: theme.colors.textMuted, fontFamily: Fonts.sans, paddingTop: 60, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderColor: '#DDD', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  cardCopy: { flex: 1, gap: 6 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardTitle: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  cardText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  defaultTag: { backgroundColor: theme.colors.greenSoft, borderRadius: 5, color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 9, paddingHorizontal: 6, paddingVertical: 3 },
  actions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 },
  actionText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium, fontSize: 12 },
  addButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: theme.colors.primary, borderRadius: 24, flexDirection: 'row', gap: 8, minHeight: 50, paddingHorizontal: 22, position: 'absolute' },
  addButtonText: { color: '#fff', fontFamily: Fonts.sansSemiBold, fontSize: 14 },
});

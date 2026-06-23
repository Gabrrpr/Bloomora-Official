import { router, useFocusEffect } from 'expo-router';
import { Check, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
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

  const save = async () => {
    if (!form.recipient_name.trim() || !form.phone.trim() || !form.street.trim() || !form.city.trim() || !form.province.trim()) {
      Alert.alert('Complete address', 'Recipient, phone, street, city, and province are required.');
      return;
    }
    const session = await getAuthSession();
    if (!session) return;
    if (editing) await addressesApi.update(editing.id, form, session.accessToken);
    else await addressesApi.create(form, session.accessToken);
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
            onPress={() => {
              setEditing(item);
              setForm({
                barangay: item.barangay ?? undefined,
                city: item.city,
                is_default: item.is_default,
                label: item.label,
                phone: item.phone,
                province: item.province,
                recipient_name: item.recipient_name,
                street: item.street,
                zip_code: item.zip_code ?? undefined,
              });
              setVisible(true);
            }}
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
      <Pressable onPress={() => { setEditing(null); setForm(emptyForm); setVisible(true); }} style={[styles.addButton, { bottom: insets.bottom + 20 }]}>
        <Plus color={theme.colors.white} size={19} /><Text style={styles.addButtonText}>Add address</Text>
      </Pressable>
      <Modal animationType="slide" onRequestClose={() => setVisible(false)} visible={visible}>
        <View style={styles.screen}>
          <AppPageHeader onBack={() => setVisible(false)} title={editing ? 'Edit Address' : 'Add Address'} />
          <FlatList
            contentContainerStyle={styles.form}
            data={[
              ['label', 'Label'],
              ['recipient_name', 'Recipient name'],
              ['phone', 'Phone'],
              ['street', 'House / street'],
              ['barangay', 'Barangay'],
              ['city', 'City'],
              ['province', 'Province'],
              ['zip_code', 'ZIP code'],
            ] as const}
            keyExtractor={(item) => item[0]}
            renderItem={({ item: [key, label] }) => (
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
                placeholder={label}
                style={styles.input}
                value={String(form[key] ?? '')}
              />
            )}
            ListFooterComponent={
              <>
                <Pressable onPress={() => setForm((current) => ({ ...current, is_default: !current.is_default }))} style={styles.defaultRow}>
                  <View style={[styles.checkbox, form.is_default && styles.checkboxActive]}>{form.is_default ? <Check color="#fff" size={14} /> : null}</View>
                  <Text style={styles.cardText}>Set as default address</Text>
                </Pressable>
                <Pressable onPress={() => void save()} style={styles.saveButton}><Text style={styles.addButtonText}>Save address</Text></Pressable>
              </>
            }
          />
        </View>
      </Modal>
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
  form: { gap: 10, padding: 16 },
  input: { backgroundColor: '#fff', borderColor: '#CCC', borderRadius: 10, borderWidth: 1, color: theme.colors.text, minHeight: 50, paddingHorizontal: 13 },
  defaultRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 10 },
  checkbox: { alignItems: 'center', borderColor: '#AAA', borderRadius: 4, borderWidth: 1, height: 24, justifyContent: 'center', width: 24 },
  checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  saveButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 10, justifyContent: 'center', minHeight: 54 },
});

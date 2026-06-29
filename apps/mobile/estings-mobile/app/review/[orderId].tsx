import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Camera, Star } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPageHeader } from '@/components/app-page-header';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';
import { getReviewEligibility, submitProductReview, type ReviewableProduct } from '@/services/reviews-api';

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { orderId = '' } = useLocalSearchParams<{ orderId?: string }>();
  const [products, setProducts] = useState<ReviewableProduct[]>([]);
  const [selected, setSelected] = useState<ReviewableProduct | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = await getAuthSession();
    if (!session || !orderId) {
      setError('Review eligibility is unavailable.');
      setLoading(false);
      return;
    }
    try {
      const response = await getReviewEligibility(orderId, session);
      const available = response.products.filter((product) => !product.reviewed);
      setProducts(response.products);
      setSelected(available[0] ?? null);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load review products.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) setImageUri(result.assets[0]?.uri ?? null);
  };

  const submit = async () => {
    if (!selected || submitting) return;
    const session = await getAuthSession();
    if (!session) return;
    setSubmitting(true);
    try {
      await submitProductReview({ comment, imageUri, orderId, productId: selected.id, rating, session });
      Alert.alert('Review submitted', 'Thank you for sharing your experience.');
      setComment('');
      setImageUri(null);
      await load();
    } catch (nextError) {
      Alert.alert('Review unavailable', nextError instanceof Error ? nextError.message : 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppPageHeader title="Write a Review" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
        {loading ? <ActivityIndicator color={theme.colors.primary} /> : error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && !selected ? <Text style={styles.empty}>All products in this order have already been reviewed.</Text> : null}
        {products.length > 1 ? (
          <ScrollView horizontal contentContainerStyle={styles.products} showsHorizontalScrollIndicator={false}>
            {products.map((product) => (
              <Pressable disabled={product.reviewed} key={product.id} onPress={() => setSelected(product)} style={[styles.productChip, selected?.id === product.id && styles.productChipActive, product.reviewed && styles.disabled]}>
                <Text style={[styles.productChipText, selected?.id === product.id && styles.productChipTextActive]}>{product.name}{product.reviewed ? ' · Reviewed' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {selected ? (
          <View style={styles.card}>
            <View style={styles.selectedProductPanel}>
              {selected.image_url ? <Image source={{ uri: selected.image_url }} style={styles.productImage} /> : <View style={styles.productImageFallback}><Star color="#E8A928" size={28} /></View>}
              <View style={styles.selectedProductCopy}>
                <Text numberOfLines={2} style={styles.title}>{selected.name}</Text>
                <Text style={styles.productMeta}>Order {orderId}</Text>
                <Text style={styles.productMeta}>{selected.reviewed ? 'Already reviewed' : 'Ready for your review'}</Text>
              </View>
            </View>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setRating(value)}>
                  <Star color="#E8A928" fill={value <= rating ? '#E8A928' : 'transparent'} size={34} />
                </Pressable>
              ))}
            </View>
            <TextInput maxLength={500} multiline onChangeText={setComment} placeholder="Tell others about the product and delivery." style={styles.input} value={comment} />
            <Pressable onPress={() => void pickImage()} style={styles.photoButton}><Camera color={theme.colors.primary} size={18} /><Text style={styles.photoText}>{imageUri ? 'Change photo' : 'Add a photo'}</Text></Pressable>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}
            <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.submit, submitting && styles.disabled]}><Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit review'}</Text></Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F5F5', flex: 1 },
  content: { gap: 14, padding: 16 },
  products: { gap: 8 },
  productChip: { backgroundColor: '#fff', borderColor: '#CCC', borderRadius: 20, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  productChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  productChipText: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 11 },
  productChipTextActive: { color: '#fff' },
  card: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#DDD', borderRadius: 16, borderWidth: 1, gap: 16, padding: 18 },
  selectedProductPanel: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#F7F7F7', borderColor: '#E3E3E3', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  selectedProductCopy: { flex: 1, gap: 4 },
  productImage: { borderRadius: 12, height: 86, width: 86 },
  productImageFallback: { alignItems: 'center', backgroundColor: '#ECECEC', borderRadius: 12, height: 86, justifyContent: 'center', width: 86 },
  title: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  productMeta: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16 },
  stars: { flexDirection: 'row', gap: 6 },
  input: { borderColor: '#CCC', borderRadius: 12, borderWidth: 1, color: theme.colors.text, minHeight: 120, padding: 13, textAlignVertical: 'top', width: '100%' },
  photoButton: { alignItems: 'center', borderColor: theme.colors.primary, borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 46, justifyContent: 'center', width: '100%' },
  photoText: { color: theme.colors.primary, fontFamily: Fonts.sansMedium },
  preview: { borderRadius: 10, height: 130, width: '100%' },
  submit: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 10, justifyContent: 'center', minHeight: 54, width: '100%' },
  submitText: { color: '#fff', fontFamily: Fonts.sansSemiBold },
  error: { color: theme.colors.danger, fontFamily: Fonts.sans, textAlign: 'center' },
  empty: { color: theme.colors.textMuted, fontFamily: Fonts.sans, paddingTop: 80, textAlign: 'center' },
  disabled: { opacity: 0.45 },
});

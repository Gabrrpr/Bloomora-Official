import { Image } from 'expo-image';
import * as NavigationBar from 'expo-navigation-bar';
import { router, type Href, useFocusEffect } from 'expo-router';
import { setStatusBarBackgroundColor, setStatusBarStyle, setStatusBarTranslucent, StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, Search, Share2, ShoppingBag, Star } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppBrandHeader, getAppBrandHeaderLayout } from '@/components/app-brand-header';
import { Fonts, theme } from '@/constants/theme';
import { requireSignedIn } from '@/services/auth-guard';
import { addCartItem } from '@/services/cart-storage';
import { getFeedWishlistIds, setFeedWishlistId } from '@/services/feed-wishlist';
import {
  mapFeedProduct,
  mobileFeedApi,
  type FeedBranch,
  type FeedTab,
  type MobileFeedEntry,
  type ProductFeedEntry,
  type PromotionFeedEntry,
} from '@/services/mobile-feed-api';
import { getStoreBranch } from '@/services/branch-preference';

const tabs: { label: string; value: FeedTab }[] = [
  { label: 'EXPLORE', value: 'explore' },
  { label: "WHAT'S NEW", value: 'new' },
  { label: 'FOR YOU', value: 'for-you' },
];

export default function HomeScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ height, width });
  const [activeTab, setActiveTab] = useState<FeedTab>('new');
  const [branch, setBranch] = useState<FeedBranch>('manila');
  const pagerRef = useRef<FlatList<FeedTab>>(null);
  const tabScrollX = useSharedValue(0);
  const layout = useMemo(() => getLayout(viewport.width, viewport.height, insets.top), [insets.top, viewport]);
  const handleTabScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      tabScrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    void getStoreBranch().then(setBranch);
    const handleBranch = (event: Event) => {
      const next = (event as CustomEvent<FeedBranch>).detail;
      if (next === 'manila' || next === 'pampanga') {
        setBranch(next);
      }
    };
    globalThis.addEventListener?.('estings:branch-changed', handleBranch);
    return () => globalThis.removeEventListener?.('estings:branch-changed', handleBranch);
  }, []);

  const setImmersiveBars = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    setStatusBarStyle('light');
    setStatusBarTranslucent(true);
    setStatusBarBackgroundColor('transparent', false);
    void NavigationBar.setVisibilityAsync('visible').catch(() => {});
    void NavigationBar.setButtonStyleAsync('light').catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    setImmersiveBars();
    return () => {
      if (Platform.OS === 'android') {
        setStatusBarStyle('dark');
        setStatusBarTranslucent(false);
        setStatusBarBackgroundColor('#FFFFFF', false);
        void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
      }
    };
  }, [setImmersiveBars]));

  const changeTab = useCallback((tab: FeedTab) => {
    const index = tabs.findIndex((item) => item.value === tab);
    if (index < 0) {
      return;
    }
    setActiveTab(tab);
    pagerRef.current?.scrollToOffset({ animated: true, offset: index * viewport.width });
  }, [viewport.width]);
  const horizontalTabGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-38, 38])
        .failOffsetY([-14, 14])
        .onEnd((event) => {
          const currentIndex = tabs.findIndex((item) => item.value === activeTab);
          const direction = event.translationX < 0 ? 1 : -1;
          const isIntentional =
            Math.abs(event.translationX) >= 54
            || Math.abs(event.velocityX) >= 520;

          if (!isIntentional) {
            return;
          }

          const nextIndex = Math.min(Math.max(currentIndex + direction, 0), tabs.length - 1);
          if (nextIndex !== currentIndex) {
            changeTab(tabs[nextIndex].value);
          }
        })
        .runOnJS(true),
    [activeTab, changeTab],
  );

  const handleHorizontalEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / viewport.width);
    setActiveTab(tabs[index]?.value ?? 'new');
  }, [viewport.width]);

  return (
    <View
      style={styles.screen}
      onLayout={(event) => {
        const next = event.nativeEvent.layout;
        if (next.width > 0 && next.height > 0) {
          setViewport({ height: next.height, width: next.width });
        }
      }}>
      <StatusBar backgroundColor="transparent" style="light" translucent />
      <GestureDetector gesture={horizontalTabGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Reanimated.FlatList
            ref={pagerRef}
            data={tabs.map((tab) => tab.value)}
            getItemLayout={(_, index) => ({
              index,
              length: viewport.width,
              offset: index * viewport.width,
            })}
            horizontal
            initialScrollIndex={1}
            key={viewport.width}
            keyExtractor={(item) => item}
            onMomentumScrollEnd={handleHorizontalEnd}
            onScroll={handleTabScroll}
            renderItem={({ item }) => (
              <FeedColumn
                branch={branch}
                height={viewport.height}
                isActive={activeTab === item}
                layout={layout}
                tab={item}
                width={viewport.width}
              />
            )}
            scrollEnabled={false}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </GestureDetector>
      <AppBrandHeader
        absolute
        actionColor={theme.colors.white}
        logoColor={theme.colors.white}
        onSearchPress={() => router.push('/search-results')}
        shadowLogo
      />
      <FeedTabs
        activeTab={activeTab}
        layout={layout}
        onChange={changeTab}
        scrollX={tabScrollX}
        screenWidth={viewport.width}
      />
    </View>
  );
}

function FeedColumn({
  branch,
  height,
  isActive,
  layout,
  tab,
  width,
}: {
  branch: FeedBranch;
  height: number;
  isActive: boolean;
  layout: HomeLayout;
  tab: FeedTab;
  width: number;
}) {
  const [items, setItems] = useState<MobileFeedEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<ReadonlySet<string>>(() => new Set());
  const loadedBranchRef = useRef<FeedBranch | null>(null);

  const load = useCallback(async (nextCursor?: string | null, forceRefresh = false) => {
    const isAppend = Boolean(nextCursor);
    if (isAppend) {
      setLoadingMore(true);
    } else if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    if (!isAppend) {
      setError(null);
    }
    try {
      const response = await mobileFeedApi.getFeed({ branch, cursor: nextCursor, forceRefresh, limit: 10, tab });
      setItems((current) => isAppend
        ? [...current, ...response.items.filter((entry) => !current.some((existing) => existing.id === entry.id))]
        : response.items);
      setCursor(response.next_cursor);
      if (!isAppend) {
        setActiveItemId(response.items[0]?.id ?? null);
      }
    } catch (loadError) {
      if (!isAppend) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the feed.');
      } else {
        setCursor(null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [branch, tab]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const branchChanged = loadedBranchRef.current !== branch;
    if (branchChanged) {
      loadedBranchRef.current = branch;
      setItems([]);
      setCursor(null);
      setActiveItemId(null);
    }

    void Promise.all([
      branchChanged || items.length === 0 ? load(null) : Promise.resolve(),
      getFeedWishlistIds().then(setWishlistIds),
    ]).catch(() => {
      setWishlistIds(new Set());
    });
  }, [branch, isActive, items.length, load]);

  const handleWishlist = useCallback(async (entry: ProductFeedEntry) => {
    const shouldSave = !wishlistIds.has(entry.id);
    setWishlistIds((current) => {
      const next = new Set(current);
      if (shouldSave) {
        next.add(entry.id);
      } else {
        next.delete(entry.id);
      }
      return next;
    });
    try {
      await setFeedWishlistId(entry.id, shouldSave);
    } catch {
      setWishlistIds((current) => {
        const next = new Set(current);
        if (shouldSave) {
          next.delete(entry.id);
        } else {
          next.add(entry.id);
        }
        return next;
      });
      Alert.alert('Wishlist unavailable', 'Your wishlist could not be updated.');
    }
  }, [wishlistIds]);

  const handlePromotionLike = useCallback(async (entry: PromotionFeedEntry) => {
    const currentLiked = entry.promotion.is_liked;
    setItems((current) => current.map((item) => item.id === entry.id && item.type === 'promotion'
      ? {
          ...item,
          promotion: {
            ...item.promotion,
            is_liked: !currentLiked,
            like_count: Math.max(0, item.promotion.like_count + (currentLiked ? -1 : 1)),
          },
        }
      : item));
    try {
      const result = currentLiked
        ? await mobileFeedApi.unlikeCampaign(entry.id)
        : await mobileFeedApi.likeCampaign(entry.id);
      setItems((current) => current.map((item) => item.id === entry.id && item.type === 'promotion'
        ? { ...item, promotion: { ...item.promotion, ...result } }
        : item));
    } catch {
      setItems((current) => current.map((item) => item.id === entry.id && item.type === 'promotion'
        ? { ...item, promotion: { ...item.promotion, is_liked: currentLiked } }
        : item));
    }
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<MobileFeedEntry>[] }) => {
    const visible = viewableItems.find((token) => token.isViewable)?.item;
    if (!visible) {
      return;
    }
    setActiveItemId(visible.id);
  }).current;

  if (loading && items.length === 0) {
    return <FeedLoading height={height} width={width} />;
  }

  if (error && items.length === 0) {
    return <FeedError error={error} height={height} onRetry={() => void load(null)} width={width} />;
  }

  return (
    <FlatList
      data={items}
      decelerationRate="fast"
      disableIntervalMomentum
      getItemLayout={(_, index) => ({ index, length: height, offset: index * height })}
      key={`${tab}-${branch}-${width}x${height}`}
      keyExtractor={(item) => `${item.type}:${item.id}`}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.colors.white} style={styles.footerLoader} /> : null}
      onEndReached={() => {
        if (cursor && !loadingMore) {
          void load(cursor);
        }
      }}
      onEndReachedThreshold={0.7}
      onViewableItemsChanged={onViewableItemsChanged}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            if (!refreshing && !loadingMore) {
              void load(null, true);
            }
          }}
          tintColor={theme.colors.white}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.white}
        />
      )}
      renderItem={({ item }) => item.type === 'product'
        ? (
          <ProductFeedCard
            entry={item}
            height={height}
            isWishlisted={wishlistIds.has(item.id) || item.product.is_wishlisted}
            layout={layout}
            onWishlist={() => void handleWishlist(item)}
            width={width}
          />
        )
        : (
          <PromotionFeedCard
            entry={item}
            height={height}
            isActive={isActive && activeItemId === item.id}
            layout={layout}
            onLike={() => void handlePromotionLike(item)}
            width={width}
          />
        )}
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      viewabilityConfig={{ itemVisiblePercentThreshold: 65, minimumViewTime: 300 }}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      removeClippedSubviews={Platform.OS === 'android'}
      updateCellsBatchingPeriod={50}
      windowSize={3}
    />
  );
}

const ProductFeedCard = memo(function ProductFeedCard({
  entry,
  height,
  isWishlisted,
  layout,
  onWishlist,
  width,
}: {
  entry: ProductFeedEntry;
  height: number;
  isWishlisted: boolean;
  layout: HomeLayout;
  onWishlist: () => void;
  width: number;
}) {
  const product = mapFeedProduct(entry);
  const openProduct = () => {
    router.push(`/product-details?id=${encodeURIComponent(entry.id)}`);
  };
  const shareProduct = async () => {
    await Share.share({ message: `${entry.product.name} — ${formatCurrency(entry.product.price)}` });
  };
  const addProduct = async () => {
    try {
      const session = await requireSignedIn('add items to your cart');
      if (!session) {
        return;
      }
      await addCartItem(product, 1);
      Alert.alert('Added to cart', `${entry.product.name} is now in your cart.`);
    } catch (error) {
      Alert.alert('Unable to add item', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={[styles.item, { height, width }]}>
      <View style={styles.productBackdrop} />
      <BottomScreenGradient height={height} />
      <Pressable
        accessibilityLabel={`View ${entry.product.name}`}
        accessibilityRole="button"
        onPress={openProduct}
        style={[styles.productImagePanel, layout.productImagePanel]}>
        {entry.product.image_url ? (
          <Image
            contentFit="cover"
            recyclingKey={entry.id}
            source={{ uri: entry.product.image_url }}
            style={styles.productForegroundImage}
            transition={180}
          />
        ) : (
          <View style={styles.productImageFallback}>
            <Text style={styles.productImageFallbackText}>No product image</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={openProduct} style={[styles.productCopy, layout.productCopy]}>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatCurrency(entry.product.price)}</Text>
          {entry.product.original_price && entry.product.original_price > entry.product.price ? (
            <Text style={styles.originalPrice}>{formatCurrency(entry.product.original_price)}</Text>
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.productName}>{entry.product.name}</Text>
        <Text numberOfLines={layout.descriptionLines} style={styles.productDescription}>
          {entry.product.description || entry.product.category}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>{entry.product.rating.toFixed(1)}</Text>
          <Star color="#F4B740" fill="#F4B740" size={13} strokeWidth={2} />
          <Text style={styles.reviewText}>({entry.product.review_count})</Text>
        </View>
        {(entry.product.tags?.length ?? 0) > 0 ? (
          <View style={styles.tagRow}>
            {[...new Set(entry.product.tags)].slice(0, layout.tagLimit).map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text numberOfLines={1} style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
      <ActionRail
        buttonMinHeight={layout.actionButtonMinHeight}
        gap={layout.actionGap}
        top={layout.productActionTop}
        actions={[
          {
            active: isWishlisted,
            icon: Heart,
            label: isWishlisted ? 'Saved' : 'Wishlist',
            onPress: onWishlist,
          },
          { icon: Share2, label: 'Share', onPress: () => void shareProduct() },
          {
            disabled: entry.product.stock <= 0,
            icon: ShoppingBag,
            label: entry.product.stock <= 0 ? 'Sold out' : 'Add to cart',
            onPress: () => void addProduct(),
          },
        ]}
      />
    </View>
  );
});

const PromotionFeedCard = memo(function PromotionFeedCard({
  entry,
  height,
  isActive,
  layout,
  onLike,
  width,
}: {
  entry: PromotionFeedEntry;
  height: number;
  isActive: boolean;
  layout: HomeLayout;
  onLike: () => void;
  width: number;
}) {
  const promotion = entry.promotion;
  const sharePromotion = async () => {
    await Share.share({ message: [promotion.title, promotion.description, promotion.cta_destination].filter(Boolean).join('\n') });
  };
  const openPost = async () => {
    const action = promotion.action;
    if (action?.type === 'product') {
      router.push(`/product-details?id=${encodeURIComponent(action.targetId)}`);
      return;
    }
    if (action?.type === 'voucher') {
      router.push(`/(tabs)/cart?voucher=${encodeURIComponent(action.code)}` as Href);
      return;
    }
    if (action?.type === 'feature') {
      router.push(action.route as Href);
      return;
    }
    if (action?.type === 'none') {
      return;
    }
    if (promotion.linked_product_id) {
      router.push(`/product-details?id=${encodeURIComponent(promotion.linked_product_id)}`);
      return;
    }
    const destination = promotion.cta_destination?.trim();
    if (!destination) {
      return;
    }
    if (/^https?:\/\//i.test(destination)) {
      await Linking.openURL(destination);
    } else {
      router.push(destination as never);
    }
  };

  return (
    <View style={[styles.item, { height, width }]}>
      <Pressable
        accessibilityLabel={`Open ${promotion.title}`}
        accessibilityRole="button"
        onPress={() => void openPost()}
        style={StyleSheet.absoluteFill}>
        <PromotionMedia entry={entry} isActive={isActive} />
      </Pressable>
      <BottomScreenGradient height={height} />
      <View pointerEvents="none" style={[styles.promotionCopy, layout.promotionCopy]}>
        <View style={styles.badgeRow}>
          {promotion.badge ? <Text style={styles.promotionBadge}>{promotion.badge}</Text> : null}
        </View>
        <Text style={styles.promotionTitle}>{promotion.title}</Text>
        {promotion.description ? (
          <Text numberOfLines={3} style={styles.promotionDescription}>{promotion.description}</Text>
        ) : null}
      </View>
      <ActionRail
        bottom={layout.actionBottom}
        buttonMinHeight={layout.actionButtonMinHeight}
        gap={layout.actionGap}
        actions={[
          {
            active: promotion.is_liked,
            count: promotion.like_count,
            icon: Heart,
            label: promotion.is_liked ? 'Liked' : 'Like',
            onPress: onLike,
          },
          { icon: Share2, label: 'Share', onPress: () => void sharePromotion() },
        ]}
      />
    </View>
  );
});

function PromotionMedia({ entry, isActive }: { entry: PromotionFeedEntry; isActive: boolean }) {
  const promotion = entry.promotion;
  if (promotion.media_type === 'video') {
    if (!isActive) {
      return posterOrFallback(promotion.poster_url);
    }
    return <PromotionVideo active={isActive} posterUrl={promotion.poster_url} source={promotion.media_url} />;
  }
  return (
    <Image
      contentFit="cover"
      recyclingKey={`promotion-${entry.id}`}
      source={{ uri: promotion.media_url }}
      style={StyleSheet.absoluteFill}
      transition={180}
    />
  );
}

function posterOrFallback(posterUrl?: string | null) {
  return posterUrl ? (
    <Image contentFit="cover" source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} />
  ) : (
    <View style={styles.promotionVideoFallback} />
  );
}

function BottomScreenGradient({ height }: { height: number }) {
  return (
    <Svg
      height={height * 0.56}
      pointerEvents="none"
      style={styles.bottomScreenGradient}
      width="100%">
      <Defs>
        <LinearGradient id="feedBottomGradient" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.42" stopColor="#000000" stopOpacity="0.2" />
          <Stop offset="0.72" stopColor="#000000" stopOpacity="0.62" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.94" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#feedBottomGradient)" height="100%" width="100%" />
    </Svg>
  );
}

function PromotionVideo({
  active,
  posterUrl,
  source,
}: {
  active: boolean;
  posterUrl?: string | null;
  source: string;
}) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {posterUrl ? (
        <Image contentFit="cover" source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} />
      ) : null}
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        playsInline
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function ActionRail({
  actions,
  bottom,
  buttonMinHeight,
  gap,
  top,
}: {
  actions: {
    active?: boolean;
    count?: number;
    disabled?: boolean;
    icon: typeof Heart;
    label: string;
    onPress: () => void;
  }[];
  bottom?: number;
  buttonMinHeight: number;
  gap: number;
  top?: number;
}) {
  return (
    <View style={[styles.actionRail, { bottom, gap, top }]}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Pressable
            accessibilityLabel={action.label}
            accessibilityRole="button"
            disabled={action.disabled}
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.actionButton,
              { minHeight: buttonMinHeight },
              pressed && styles.pressed,
              action.disabled && styles.disabled,
            ]}>
            <Icon
              color={theme.colors.white}
              fill={action.active ? theme.colors.white : 'transparent'}
              size={30}
              strokeWidth={2.3}
            />
            {typeof action.count === 'number' ? (
              <Text style={styles.actionCount}>{formatCount(action.count)}</Text>
            ) : null}
            <Text numberOfLines={2} style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FeedTabs({
  activeTab,
  layout,
  onChange,
  screenWidth,
  scrollX,
}: {
  activeTab: FeedTab;
  layout: HomeLayout;
  onChange: (tab: FeedTab) => void;
  screenWidth: number;
  scrollX: SharedValue<number>;
}) {
  const tabsWidth = screenWidth - layout.sidePadding * 2;
  const tabWidth = tabsWidth / tabs.length;
  const indicatorWidth = tabWidth * 0.54;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        scrollX.value,
        [0, screenWidth * (tabs.length - 1)],
        [0, tabWidth * (tabs.length - 1)],
        Extrapolation.CLAMP,
      ),
    }],
  }));

  return (
    <View style={[styles.tabs, { left: layout.sidePadding, right: layout.sidePadding, top: layout.tabsTop }]}>
      {tabs.map((tab, index) => (
        <AnimatedFeedTab
          active={activeTab === tab.value}
          index={index}
          key={tab.value}
          label={tab.label}
          onPress={() => onChange(tab.value)}
          screenWidth={screenWidth}
          scrollX={scrollX}
          value={tab.value}
        />
      ))}
      <Reanimated.View
        pointerEvents="none"
        style={[
          styles.tabIndicator,
          {
            left: (tabWidth - indicatorWidth) / 2,
            width: indicatorWidth,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

function AnimatedFeedTab({
  active,
  index,
  label,
  onPress,
  screenWidth,
  scrollX,
}: {
  active: boolean;
  index: number;
  label: string;
  onPress: () => void;
  screenWidth: number;
  scrollX: SharedValue<number>;
  value: FeedTab;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: interpolate(progress, [0, 1], [0.62, 1]),
      transform: [{ scale: interpolate(progress, [0, 1], [1, 1.08]) }],
    };
  });
  const regularTextStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity: 1 - progress };
  });
  const boldTextStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity: progress };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.tabButton}>
      <Reanimated.View style={[styles.tabLabelFrame, animatedStyle]}>
        <Reanimated.Text style={[styles.tabText, regularTextStyle]}>{label}</Reanimated.Text>
        <Reanimated.Text style={[styles.tabText, styles.tabTextActive, boldTextStyle]}>{label}</Reanimated.Text>
      </Reanimated.View>
    </Pressable>
  );
}

function FeedLoading({ height, width }: { height: number; width: number }) {
  return (
    <View style={[styles.stateScreen, { height, width }]}>
      <ActivityIndicator color={theme.colors.white} size="large" />
      <Text style={styles.stateText}>Preparing your feed…</Text>
    </View>
  );
}

function FeedError({
  error,
  height,
  onRetry,
  width,
}: {
  error: string;
  height: number;
  onRetry: () => void;
  width: number;
}) {
  const customerMessage = error.toLowerCase().includes('update required')
    ? 'We could not load the latest feed right now. Please try again.'
    : error;

  return (
    <View style={[styles.stateScreen, { height, width }]}>
      <Search color={theme.colors.white} size={38} />
      <Text style={styles.stateTitle}>Feed unavailable</Text>
      <Text style={styles.stateText}>{customerMessage}</Text>
      <Pressable onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatCount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

function getLayout(width: number, height: number, topInset: number) {
  const brand = getAppBrandHeaderLayout(width, height, topInset);
  const sidePadding = brand.sidePadding;
  const tabsTop = brand.top + brand.height + 10;
  const isShortScreen = height < 760;
  const navClearance = isShortScreen ? 110 : Math.max(height * 0.12, 104);
  const imageTopGap = isShortScreen ? 18 : 24;
  const contentGap = isShortScreen ? 14 : 18;
  const productImageTop = tabsTop + 34 + imageTopGap;
  const actionButtonMinHeight = isShortScreen ? 44 : 48;
  const actionGap = isShortScreen ? 3 : 6;
  const contentBlockHeight = isShortScreen ? 196 : height < 880 ? 214 : 232;
  const productContentTop = height - navClearance - contentBlockHeight;
  const productImageHeight = Math.max(
    isShortScreen ? 226 : 270,
    productContentTop - contentGap - productImageTop,
  );
  return {
    actionBottom: navClearance + 8,
    actionButtonMinHeight,
    actionGap,
    descriptionLines: height >= 850 ? 4 : 3,
    productActionTop: productContentTop - 6,
    productCopy: {
      left: sidePadding + 8,
      right: 88,
      top: productContentTop,
    },
    productImagePanel: {
      borderRadius: 9,
      height: productImageHeight,
      left: sidePadding,
      right: sidePadding,
      top: productImageTop,
    },
    promotionCopy: {
      bottom: navClearance,
      left: sidePadding,
      right: 88,
    },
    sidePadding,
    tagLimit: width >= 410 ? 4 : 3,
    tabsTop,
  };
}

type HomeLayout = ReturnType<typeof getLayout>;

const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.55)',
  textShadowOffset: { height: 1, width: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#171717', flex: 1, overflow: 'hidden' },
  item: { backgroundColor: '#171717', overflow: 'hidden' },
  productBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1C1C1C' },
  productImagePanel: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'absolute',
  },
  productForegroundImage: { height: '100%', width: '100%' },
  productImageFallback: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  productImageFallbackText: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium },
  productCopy: { gap: 7, position: 'absolute' },
  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 8 },
  productPrice: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sansExtraBold, fontSize: 27, lineHeight: 33 },
  originalPrice: {
    color: 'rgba(255,255,255,0.56)',
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  productName: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 20 },
  productDescription: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 17 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  ratingText: { color: '#F4B740', fontFamily: Fonts.sansBold, fontSize: 12 },
  reviewText: { color: 'rgba(255,255,255,0.68)', fontFamily: Fonts.sansMedium, fontSize: 11 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 2 },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 108,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { color: 'rgba(255,255,255,0.88)', fontFamily: Fonts.sansMedium, fontSize: 10 },
  bottomScreenGradient: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  promotionCopy: { gap: 8, position: 'absolute' },
  badgeRow: { alignItems: 'flex-start' },
  promotionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    borderWidth: 1,
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  promotionTitle: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sansExtraBold, fontSize: 25, lineHeight: 30 },
  promotionDescription: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 19 },
  promotionCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  promotionCtaText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 13 },
  promotionVideoFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111111' },
  voucherButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderColor: 'rgba(255,255,255,0.48)',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voucherText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 0.5 },
  actionRail: { alignItems: 'center', position: 'absolute', right: 10, width: 66 },
  actionButton: { alignItems: 'center', gap: 2, justifyContent: 'center', width: 66 },
  actionLabel: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 10, lineHeight: 13, textAlign: 'center' },
  actionCount: { ...textShadow, color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 12 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.45 },
  tabs: { flexDirection: 'row', position: 'absolute', zIndex: 20 },
  tabButton: { alignItems: 'center', flex: 1, minHeight: 34, paddingBottom: 7 },
  tabLabelFrame: { alignItems: 'center', height: 20, justifyContent: 'center', width: '100%' },
  tabText: {
    ...textShadow,
    color: '#FFFFFF',
    fontFamily: Fonts.condensedMedium,
    fontSize: 13,
    position: 'absolute',
    textAlign: 'center',
  },
  tabTextActive: { fontFamily: Fonts.sansBold },
  tabIndicator: { backgroundColor: '#FFFFFF', borderRadius: 99, bottom: 0, height: 2, position: 'absolute', width: '54%' },
  stateScreen: { alignItems: 'center', backgroundColor: '#101512', gap: 14, justifyContent: 'center', paddingHorizontal: 36 },
  stateTitle: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 20 },
  stateText: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryButton: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 11 },
  retryText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold },
  footerLoader: { bottom: 110, position: 'absolute', right: 28 },
});

import * as NavigationBar from 'expo-navigation-bar';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarBackgroundColor, setStatusBarStyle, setStatusBarTranslucent, StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { EllipsisVertical, Heart, Search, Star, X, type LucideIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppBrandHeader, getAppBrandHeaderLayout } from '@/components/app-brand-header';
import { Fonts, theme } from '@/constants/theme';

const feedImage1 = require('@/assets/images/feed/explore/1.webp');
const feedImage2 = require('@/assets/images/feed/explore/2.webp');
const feedImage3 = require('@/assets/images/feed/explore/3.webp');
const feedImage4 = require('@/assets/images/feed/explore/4.webp');
const feedImage5 = require('@/assets/images/feed/explore/5.webp');
const mothersDayFeedImage = require('@/assets/images/feed/fyp/EstingsMothersDay.png');
const addToCartIcon = require('@/assets/images/floatingAction/addToCart-icon.png');
const shareIcon = require('@/assets/images/floatingAction/share-icon.png');

type ProductFeedItem = {
  id: string;
  name: string;
  price: number | null;
  currency: 'PHP';
  category: string;
  section: 'explore' | 'new' | 'for-you';
  description: string;
  longDescription: string;
  image: ImageSourcePropType | null;
  stock: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBestSeller: boolean;
  isAddToCartEnabled?: boolean;
  isContentOverlayHidden?: boolean;
  ctaLabel?: string;
  tags: string[];
};

type FeedSection = ProductFeedItem['section'];

const feedSections: { label: string; value: FeedSection }[] = [
  { label: 'EXPLORE', value: 'explore' },
  { label: "WHAT'S NEW", value: 'new' },
  { label: 'FOR YOU', value: 'for-you' },
];
const feedLoopCopies = 9;
const feedLoopMiddleCopy = Math.floor(feedLoopCopies / 2);
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

const productFeedData: ProductFeedItem[] = [
  {
    id: 'blush-morning',
    name: 'Blush Lily Wrap',
    price: 1990,
    currency: 'PHP',
    category: 'Pastel Wraps',
    section: 'new',
    description: 'Peach roses, white lilies, and baby blooms tucked in soft blush wrapping.',
    longDescription:
      'A delicate pastel hand bouquet with peach roses, white lily blooms, airy fillers, and layered blush paper finished with a satin ribbon.',
    image: feedImage1,
    stock: 18,
    rating: 4.8,
    reviewCount: 126,
    isNew: true,
    isBestSeller: true,
    tags: ['new', 'lilies', 'pastel', 'blush'],
  },
  {
    id: 'peony-cloud',
    name: 'Pink Kiss Roses',
    price: 3299,
    currency: 'PHP',
    category: 'Rose Bouquets',
    section: 'new',
    description: 'Cream roses edged in bright pink for a sweet, photo-ready surprise.',
    longDescription:
      'A romantic rose bunch with cream petals kissed in pink, styled for birthdays, anniversaries, and soft everyday gestures.',
    image: feedImage2,
    stock: 9,
    rating: 4.9,
    reviewCount: 84,
    isNew: true,
    isBestSeller: true,
    tags: ['new', 'roses', 'pink', 'romantic'],
  },
  {
    id: 'orchid-white',
    name: 'Red Romance Gift Set',
    price: 4299,
    currency: 'PHP',
    category: 'Gift Sets',
    section: 'explore',
    description: 'Velvet red roses paired with a ribboned gift box for grand gestures.',
    longDescription:
      'A bold red rose arrangement styled beside a crisp white gift box, made for anniversaries, proposals, and Valentine surprises.',
    image: feedImage3,
    stock: 7,
    rating: 4.7,
    reviewCount: 61,
    isNew: false,
    isBestSeller: false,
    tags: ['red roses', 'gift box', 'romance'],
  },
  {
    id: 'sunlit-tulip',
    name: 'Ivory Garden Vase',
    price: 2190,
    currency: 'PHP',
    category: 'Vase Arrangements',
    section: 'explore',
    description: "White roses, soft baby's breath, and greenery arranged in a glass vase.",
    longDescription:
      "A clean ivory vase arrangement with white roses, baby's breath, and fresh green texture for calm, elegant spaces.",
    image: feedImage4,
    stock: 14,
    rating: 4.6,
    reviewCount: 98,
    isNew: true,
    isBestSeller: false,
    tags: ['white roses', 'vase', 'minimal'],
  },
  {
    id: 'market-bloom',
    name: 'Blue Orchid Rose Wrap',
    price: 2599,
    currency: 'PHP',
    category: 'Premium Wraps',
    section: 'explore',
    description: 'Pink garden roses and white orchids wrapped in vivid blue paper.',
    longDescription:
      'A bright premium bouquet with soft pink roses, white orchid accents, and vivid blue wrapping for a fresh statement look.',
    image: feedImage5,
    stock: 22,
    rating: 4.8,
    reviewCount: 143,
    isNew: false,
    isBestSeller: true,
    tags: ['orchids', 'pink roses', 'blue wrap'],
  },
  {
    id: 'mothers-day-for-you',
    name: "Celebrate with Esting's",
    price: null,
    currency: 'PHP',
    category: "Mother's Day",
    section: 'new',
    description: "Esting's wishes every mom a beautiful Mother's Day. Order a bouquet made for her heart.",
    longDescription:
      "Esting's wishes every mom a beautiful Mother's Day. Order a bouquet made for her heart.",
    image: mothersDayFeedImage,
    stock: 0,
    rating: 5,
    reviewCount: 0,
    isNew: true,
    isBestSeller: false,
    isAddToCartEnabled: false,
    ctaLabel: "Shop now with Esting's",
    tags: ['mothers day', 'whats new'],
  },
  {
    id: 'make-it-personal-feature',
    name: 'Make It Personal',
    price: null,
    currency: 'PHP',
    category: 'Personalized Flowers',
    section: 'for-you',
    description: 'Describe a mood or build your bouquet step by step, then preview a floral idea made around your story.',
    longDescription:
      'Make It Personal helps you create a bouquet in two ways: describe the arrangement you imagine, or mix and match flowers, style, and finishing touches.',
    image: null,
    stock: 0,
    rating: 5,
    reviewCount: 0,
    isNew: true,
    isBestSeller: false,
    isAddToCartEnabled: false,
    ctaLabel: 'Create your bouquet',
    tags: ['for you', 'make it personal'],
  },
];

export default function HomeScreen() {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [feedViewport, setFeedViewport] = useState<{ height: number; width: number } | null>(null);
  const layout = getHomeLayout(feedViewport?.width ?? windowWidth, feedViewport?.height ?? windowHeight, insets);
  const [activeSection, setActiveSection] = useState<FeedSection>('new');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchBarMounted, setIsSearchBarMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [likedProductIds, setLikedProductIds] = useState<ReadonlySet<string>>(() => new Set());
  const [likeBurstProductId, setLikeBurstProductId] = useState<string | null>(null);
  const [shareProduct, setShareProduct] = useState<ProductFeedItem | null>(null);
  const likeBurstProgress = useRef(new Animated.Value(0)).current;
  const searchBarProgress = useRef(new Animated.Value(0)).current;
  const sharePanelProgress = useRef(new Animated.Value(0)).current;
  const shareDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionPagerRef = useRef<FlatList<FeedSection>>(null);
  const initialSectionIndex = feedSections.findIndex((section) => section.value === 'new');
  const sectionProducts = useMemo(
    () =>
      feedSections.reduce(
        (sections, section) => ({
          ...sections,
          [section.value]: productFeedData
            .filter((product) => product.section === section.value)
            .sort((first, second) => getFeedItemSort(section.value, first) - getFeedItemSort(section.value, second)),
        }),
        {} as Record<FeedSection, ProductFeedItem[]>,
      ),
    [],
  );
  const verticalFeedRefs = useRef<Record<FeedSection, ProductFeedListRef | null>>({
    explore: null,
    new: null,
    'for-you': null,
  });
  const sectionScrollX = useRef(new Animated.Value(initialSectionIndex * layout.screenWidth)).current;
  const requestedSectionRef = useRef<FeedSection>('new');
  const sectionScrollYs = useRef<Record<FeedSection, Animated.Value>>({
    explore: new Animated.Value(0),
    new: new Animated.Value(0),
    'for-you': new Animated.Value(0),
  }).current;

  useEffect(() => {
    feedSections.forEach((section) => {
      const initialOffset = sectionProducts[section.value].length * feedLoopMiddleCopy * layout.feedItemHeight;
      sectionScrollYs[section.value].setValue(initialOffset);
    });
  }, [layout.feedItemHeight, sectionProducts, sectionScrollYs]);

  const handleScreenLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    if (height <= 0 || width <= 0) {
      return;
    }

    setFeedViewport((current) => {
      const nextHeight = PixelRatio.roundToNearestPixel(height);
      const nextWidth = PixelRatio.roundToNearestPixel(width);

      if (current?.height === nextHeight && current.width === nextWidth) {
        return current;
      }

      return {
        height: nextHeight,
        width: nextWidth,
      };
    });
  }, []);

  const setImmersiveSystemBars = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    setStatusBarStyle('light');
    setStatusBarTranslucent(true);
    setStatusBarBackgroundColor('transparent', false);
    void SystemUI.setBackgroundColorAsync('transparent').catch(() => { });
    void NavigationBar.setPositionAsync('absolute').catch(() => { });
    void NavigationBar.setVisibilityAsync('visible').catch(() => { });
    void NavigationBar.setBackgroundColorAsync('transparent').catch(() => { });
    void NavigationBar.setBorderColorAsync('transparent').catch(() => { });
    void NavigationBar.setButtonStyleAsync('dark').catch(() => { });
  }, []);

  useEffect(() => {
    setImmersiveSystemBars();
  }, [setImmersiveSystemBars]);

  useEffect(
    () => () => {
      if (shareDismissTimer.current) {
        clearTimeout(shareDismissTimer.current);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setImmersiveSystemBars();

      return () => {
        if (Platform.OS !== 'android') {
          return;
        }

        setStatusBarStyle('dark');
        setStatusBarTranslucent(false);
        setStatusBarBackgroundColor('#FFFFFF', false);
        void SystemUI.setBackgroundColorAsync('#FFFFFF').catch(() => { });
        void NavigationBar.setPositionAsync('relative').catch(() => { });
        void NavigationBar.setBackgroundColorAsync('#FFFFFF').catch(() => { });
        void NavigationBar.setBorderColorAsync('#FFFFFF').catch(() => { });
        void NavigationBar.setButtonStyleAsync('dark').catch(() => { });
      };
    }, [setImmersiveSystemBars]),
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<ProductFeedItem> | null | undefined, index: number) => ({
      index,
      length: layout.feedItemHeight,
      offset: layout.feedItemHeight * index,
    }),
    [layout.feedItemHeight],
  );

  const getSectionLayout = useCallback(
    (_: ArrayLike<FeedSection> | null | undefined, index: number) => ({
      index,
      length: layout.screenWidth,
      offset: layout.screenWidth * index,
    }),
    [layout.screenWidth],
  );

  const handleChangeSection = useCallback(
    (section: FeedSection) => {
      if (requestedSectionRef.current === section) {
        return;
      }

      const nextIndex = feedSections.findIndex((feedSection) => feedSection.value === section);

      if (nextIndex < 0) {
        return;
      }

      requestedSectionRef.current = section;
      setActiveSection(section);
      sectionPagerRef.current?.scrollToOffset({
        animated: true,
        offset: nextIndex * layout.screenWidth,
      });
    },
    [layout.screenWidth],
  );

  const handleSectionMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / layout.screenWidth);
    const nextSection = feedSections[nextIndex]?.value;

    if (nextSection) {
      requestedSectionRef.current = nextSection;
      setActiveSection(nextSection);
    }
  }, [layout.screenWidth]);

  function handleAddToCart(productId: string) {
    setAddedProductId(productId);
    setTimeout(() => {
      setAddedProductId((current) => (current === productId ? null : current));
    }, 1400);
  }

  function handleLike(productId: string) {
    const isAlreadyLiked = likedProductIds.has(productId);

    if (isAlreadyLiked) {
      setLikedProductIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
      likeBurstProgress.stopAnimation();
      setLikeBurstProductId(null);
      return;
    }

    setLikedProductIds((current) => {
      const next = new Set(current);
      next.add(productId);
      return next;
    });
    setLikeBurstProductId(productId);
    likeBurstProgress.stopAnimation();
    likeBurstProgress.setValue(0);
    Animated.sequence([
      Animated.timing(likeBurstProgress, {
        duration: 380,
        easing: Easing.out(Easing.back(1.35)),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(760),
      Animated.timing(likeBurstProgress, {
        duration: 340,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => setLikeBurstProductId(null));
  }

  function handleShare(productId: string) {
    const nextProduct = productFeedData.find((product) => product.id === productId) ?? productFeedData[0];

    if (shareDismissTimer.current) {
      clearTimeout(shareDismissTimer.current);
    }

    setShareProduct(nextProduct);
    sharePanelProgress.stopAnimation();
    sharePanelProgress.setValue(0);
    Animated.timing(sharePanelProgress, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
    shareDismissTimer.current = setTimeout(() => {
      Animated.timing(sharePanelProgress, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setShareProduct(null));
    }, 2200);
  }

  function handleProductCta(productId: string) {
    if (productId === 'make-it-personal-feature') {
      router.push('/create/describe');
      return;
    }

    router.push('/categories');
  }

  function handleOpenSearch() {
    setIsSearchOpen(true);
    setIsSearchBarMounted(true);
    searchBarProgress.stopAnimation();
    Animated.timing(searchBarProgress, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }

  function handleCloseSearch() {
    searchBarProgress.stopAnimation();
    Animated.timing(searchBarProgress, {
      duration: 190,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsSearchOpen(false);
      setIsSearchBarMounted(false);
      setSearchQuery('');
    });
  }

  return (
    <View style={styles.screen} onLayout={handleScreenLayout}>
      <StatusBar backgroundColor="transparent" style="light" translucent />

      <HorizontalSectionPager
        addedProductId={addedProductId}
        getItemLayout={getItemLayout}
        getSectionLayout={getSectionLayout}
        initialSectionIndex={initialSectionIndex}
        layout={layout}
        likedProductIds={likedProductIds}
        onAddToCart={handleAddToCart}
        onCtaPress={handleProductCta}
        onLike={handleLike}
        onMomentumScrollEnd={handleSectionMomentumScrollEnd}
        onShare={handleShare}
        pagerRef={sectionPagerRef}
        sectionScrollX={sectionScrollX}
        sectionScrollYs={sectionScrollYs}
        sectionProducts={sectionProducts}
        verticalFeedRefs={verticalFeedRefs}
      />
      <FloatingHeader
        layout={layout}
        onOpenSearch={handleOpenSearch}
      />
      <TopTabs
        activeSection={activeSection}
        layout={layout}
        onChangeSection={handleChangeSection}
        sectionScrollX={sectionScrollX}
      />
      {isSearchBarMounted ? (
        <SearchBar
          isOpen={isSearchOpen}
          layout={layout}
          onChangeText={setSearchQuery}
          onClose={handleCloseSearch}
          progress={searchBarProgress}
          value={searchQuery}
        />
      ) : null}
      <LikeBurst layout={layout} progress={likeBurstProgress} visible={likeBurstProductId !== null} />
      <ShareFloatingPanel layout={layout} product={shareProduct} progress={sharePanelProgress} />
    </View>
  );
}

function HorizontalSectionPager({
  addedProductId,
  getItemLayout,
  getSectionLayout,
  initialSectionIndex,
  layout,
  likedProductIds,
  onAddToCart,
  onCtaPress,
  onLike,
  onMomentumScrollEnd,
  onShare,
  pagerRef,
  sectionScrollX,
  sectionScrollYs,
  sectionProducts,
  verticalFeedRefs,
}: {
  addedProductId: string | null;
  getItemLayout: (
    data: ArrayLike<ProductFeedItem> | null | undefined,
    index: number,
  ) => { index: number; length: number; offset: number };
  getSectionLayout: (
    data: ArrayLike<FeedSection> | null | undefined,
    index: number,
  ) => { index: number; length: number; offset: number };
  initialSectionIndex: number;
  layout: HomeLayout;
  likedProductIds: ReadonlySet<string>;
  onAddToCart: (productId: string) => void;
  onCtaPress: (productId: string) => void;
  onLike: (productId: string) => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onShare: (productId: string) => void;
  pagerRef: React.RefObject<FlatList<FeedSection> | null>;
  sectionScrollX: Animated.Value;
  sectionScrollYs: Record<FeedSection, Animated.Value>;
  sectionProducts: Record<FeedSection, ProductFeedItem[]>;
  verticalFeedRefs: React.MutableRefObject<Record<FeedSection, ProductFeedListRef | null>>;
}) {
  return (
    <AnimatedFlatList
      ref={pagerRef}
      bounces={false}
      data={feedSections.map((section) => section.value)}
      decelerationRate="fast"
      disableIntervalMomentum={true}
      directionalLockEnabled
      getItemLayout={getSectionLayout}
      horizontal
      initialScrollIndex={initialSectionIndex}
      key={`${layout.screenWidth}-sections`}
      keyExtractor={(section) => section}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: sectionScrollX } } }], {
        useNativeDriver: true,
      })}
      nestedScrollEnabled
      overScrollMode="never"
      renderItem={({ item: section }) => (
        <VerticalProductFeed
          addedProductId={addedProductId}
          getItemLayout={getItemLayout}
          layout={layout}
          likedProductIds={likedProductIds}
          onAddToCart={onAddToCart}
          onCtaPress={onCtaPress}
          onLike={onLike}
          onShare={onShare}
          products={sectionProducts[section]}
          scrollY={sectionScrollYs[section]}
          section={section}
          verticalFeedRefs={verticalFeedRefs}
        />
      )}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToEnd={false}
      snapToInterval={layout.screenWidth}
      scrollEventThrottle={16}
      style={styles.feedList}
    />
  );
}

function VerticalProductFeed({
  addedProductId,
  getItemLayout,
  layout,
  likedProductIds,
  onAddToCart,
  onCtaPress,
  onLike,
  onShare,
  products,
  scrollY,
  section,
  verticalFeedRefs,
}: {
  getItemLayout: (
    data: ArrayLike<ProductFeedItem> | null | undefined,
    index: number,
  ) => { index: number; length: number; offset: number };
  addedProductId: string | null;
  layout: HomeLayout;
  likedProductIds: ReadonlySet<string>;
  onAddToCart: (productId: string) => void;
  onCtaPress: (productId: string) => void;
  onLike: (productId: string) => void;
  onShare: (productId: string) => void;
  products: ProductFeedItem[];
  scrollY: Animated.Value;
  section: FeedSection;
  verticalFeedRefs: React.MutableRefObject<Record<FeedSection, ProductFeedListRef | null>>;
}) {
  const feedRef = useRef<FlatList<ProductFeedItem>>(null);
  const loopedProducts = useMemo(
    () => Array.from({ length: feedLoopCopies }, () => products).flat(),
    [products],
  );
  const middleFeedIndex = products.length * feedLoopMiddleCopy;

  const resetLoopPosition = useCallback(
    (index: number) => {
      if (products.length <= 0) {
        return;
      }

      const normalizedIndex = ((index % products.length) + products.length) % products.length;
      const resetIndex = products.length * feedLoopMiddleCopy + normalizedIndex;

      if (index < products.length * 2 || index >= products.length * (feedLoopCopies - 2)) {
        const resetOffset = resetIndex * layout.feedItemHeight;

        requestAnimationFrame(() => {
          feedRef.current?.scrollToOffset({
            animated: false,
            offset: resetOffset,
          });
          scrollY.setValue(resetOffset);
        });
      }
    },
    [layout.feedItemHeight, products.length, scrollY],
  );

  const setFeedRef = useCallback(
    (node: ProductFeedListRef | null) => {
      feedRef.current = node;
      verticalFeedRefs.current[section] = node;
    },
    [section, verticalFeedRefs],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (products.length <= 0) {
        return;
      }

      const nextIndex = Math.round(event.nativeEvent.contentOffset.y / layout.feedItemHeight);

      resetLoopPosition(nextIndex);
    },
    [layout.feedItemHeight, products.length, resetLoopPosition],
  );

  return (
    <AnimatedFlatList
      ref={setFeedRef}
      bounces={false}
      data={loopedProducts}
      decelerationRate="fast"
      disableIntervalMomentum={true}
      directionalLockEnabled
      getItemLayout={getItemLayout}
      key={`${section}-${layout.screenWidth}x${layout.feedItemHeight}`}
      initialScrollIndex={middleFeedIndex}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      })}
      nestedScrollEnabled
      overScrollMode="never"
      initialNumToRender={Math.min(loopedProducts.length, Platform.OS === 'android' ? 3 : 5)}
      maxToRenderPerBatch={Math.min(loopedProducts.length, Platform.OS === 'android' ? 3 : 5)}
      removeClippedSubviews={Platform.OS === 'android'}
      renderItem={({ item, index }) => (
        <MemoizedProductFeedImageCard
          index={index}
          isAddedToCart={addedProductId === item.id}
          isLiked={likedProductIds.has(item.id)}
          item={item}
          layout={layout}
          onAddToCart={() => onAddToCart(item.id)}
          onCtaPress={() => onCtaPress(item.id)}
          onLike={() => onLike(item.id)}
          onShare={() => onShare(item.id)}
          scrollY={scrollY}
        />
      )}
      snapToAlignment="start"
      snapToEnd={false}
      snapToInterval={layout.feedItemHeight}
      scrollEventThrottle={16}
      style={[styles.sectionFeedList, { height: layout.feedItemHeight, width: layout.screenWidth }]}
      showsVerticalScrollIndicator={false}
      updateCellsBatchingPeriod={Platform.OS === 'android' ? 80 : 50}
      windowSize={Platform.OS === 'android' ? 5 : 7}
    />
  );
}

function ProductFeedImageCard({
  index,
  isAddedToCart,
  isLiked,
  item,
  layout,
  onAddToCart,
  onCtaPress,
  onLike,
  onShare,
  scrollY,
}: {
  index: number;
  isAddedToCart: boolean;
  isLiked: boolean;
  item: ProductFeedItem;
  layout: HomeLayout;
  onAddToCart: () => void;
  onCtaPress: () => void;
  onLike: () => void;
  onShare: () => void;
  scrollY: Animated.Value;
}) {
  return (
    <View style={[styles.feedItem, { height: layout.feedItemHeight, width: layout.screenWidth }]}>
      <View style={styles.productImageContainer}>
        {item.image ? (
          <Image source={item.image} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.blankFeedImage, item.section === 'for-you' && styles.forYouFeedImage]} />
        )}
        <View style={styles.imageVeil} />
      </View>
      <BottomVignette layout={layout} />
      <ProductFeedContent
        index={index}
        isAddedToCart={isAddedToCart}
        isLiked={isLiked}
        item={item}
        layout={layout}
        onAddToCart={onAddToCart}
        onCtaPress={onCtaPress}
        onLike={onLike}
        onShare={onShare}
        scrollY={scrollY}
      />
    </View>
  );
}

const MemoizedProductFeedImageCard = memo(ProductFeedImageCard);

function ProductFeedContent({
  index,
  isAddedToCart,
  isLiked,
  item,
  layout,
  onAddToCart,
  onCtaPress,
  onLike,
  onShare,
  scrollY,
}: {
  index: number;
  isAddedToCart: boolean;
  isLiked: boolean;
  item: ProductFeedItem;
  layout: HomeLayout;
  onAddToCart: () => void;
  onCtaPress: () => void;
  onLike: () => void;
  onShare: () => void;
  scrollY: Animated.Value;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = isExpanded ? item.longDescription : item.description;
  const itemOffset = index * layout.feedItemHeight;
  const scale = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [itemOffset - layout.feedItemHeight, itemOffset, itemOffset + layout.feedItemHeight],
    outputRange: [0.94, 1, 0.955],
  });
  const translateY = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [itemOffset - layout.feedItemHeight, itemOffset, itemOffset + layout.feedItemHeight],
    outputRange: [48, 0, -30],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        height: layout.feedItemHeight,
        transform: [{ translateY }, { scale }],
        width: layout.screenWidth,
        zIndex: 3,
      }}>
      {!item.isContentOverlayHidden ? (
        <View
          style={[
            styles.productText,
            {
              bottom: layout.productTextBottom,
              left: layout.sidePadding,
              right: layout.productTextRight,
            },
          ]}>
          <View style={styles.productMetaRow}>
            {item.isNew ? (
              <View style={styles.productMetaChip}>
                <Text style={[styles.productMetaText, layout.text.meta]}>New</Text>
              </View>
            ) : null}
            <View style={styles.productMetaChip}>
              <Text style={[styles.productMetaText, layout.text.meta]}>{item.category}</Text>
            </View>
            <View style={styles.productMetaChip}>
              <Star size={layout.metaIcon} color={theme.colors.white} fill={theme.colors.white} strokeWidth={2} />
              <Text style={[styles.productMetaText, layout.text.meta]}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={[styles.productName, layout.text.productName]}>{item.name}</Text>
          <Text numberOfLines={isExpanded ? 4 : 2} style={[styles.productDescription, layout.text.productDescription]}>
            {description}{' '}
            <Text
              accessibilityRole="button"
              onPress={() => setIsExpanded((current) => !current)}
              style={styles.viewMoreText}>
              {isExpanded ? 'View less' : 'View more'}
            </Text>
          </Text>
          {item.ctaLabel ? (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.feedCta, pressed && styles.feedCtaPressed]}
              onPress={onCtaPress}>
              <Text style={styles.feedCtaText}>{item.ctaLabel}</Text>
            </Pressable>
          ) : null}
          {item.price !== null ? (
            <Text style={[styles.productPrice, layout.text.productPrice]}>{formatProductPrice(item.price, item.currency)}</Text>
          ) : null}
        </View>
      ) : null}

      <RightSideActions
        isActive
        isAddToCartEnabled={item.isAddToCartEnabled ?? true}
        isAddedToCart={isAddedToCart}
        isLiked={isLiked}
        layout={layout}
        onAddToCart={onAddToCart}
        onLike={onLike}
        onShare={onShare}
      />
    </Animated.View>
  );
}

function BottomVignette({ layout }: { layout: HomeLayout }) {
  return (
    <Svg
      height={layout.bottomVignetteHeight}
      pointerEvents="none"
      style={styles.bottomVignette}
      width="100%">
      <Defs>
        <LinearGradient id="bottomVignetteGradient" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.48" stopColor="#000000" stopOpacity="0.2" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.48" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#bottomVignetteGradient)" height="100%" width="100%" />
    </Svg>
  );
}

function FloatingHeader({
  layout,
  onOpenSearch,
}: {
  layout: HomeLayout;
  onOpenSearch: () => void;
}) {
  return (
    <AppBrandHeader
      absolute
      actionColor={theme.colors.white}
      logoColor={theme.colors.white}
      onSearchPress={onOpenSearch}
      shadowLogo
    />
  );
}

function TopTabs({
  activeSection,
  layout,
  onChangeSection,
  sectionScrollX,
}: {
  activeSection: FeedSection;
  layout: HomeLayout;
  onChangeSection: (section: FeedSection) => void;
  sectionScrollX: Animated.Value;
}) {
  const [pressedSection, setPressedSection] = useState<FeedSection | null>(null);
  const pressedSectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabsWidth = layout.screenWidth - layout.sidePadding * 2;
  const tabWidth = tabsWidth / feedSections.length;
  const indicatorWidth = tabWidth * 0.56;
  const indicatorTranslateX = sectionScrollX.interpolate({
    extrapolate: 'clamp',
    inputRange: feedSections.map((_, index) => index * layout.screenWidth),
    outputRange: feedSections.map((_, index) => index * tabWidth),
  });

  useEffect(
    () => () => {
      if (pressedSectionTimer.current) {
        clearTimeout(pressedSectionTimer.current);
      }
    },
    [],
  );

  const pulseSection = useCallback((section: FeedSection) => {
    if (pressedSectionTimer.current) {
      clearTimeout(pressedSectionTimer.current);
    }

    setPressedSection(section);
    pressedSectionTimer.current = setTimeout(() => {
      setPressedSection((current) => (current === section ? null : current));
      pressedSectionTimer.current = null;
    }, 180);
  }, []);

  return (
    <View style={[styles.topTabs, { left: layout.sidePadding, right: layout.sidePadding, top: layout.tabsTop }]}>
      {feedSections.map((tab) => {
        const isTabPressed = pressedSection === tab.value;

        return (
          <Pressable
            key={tab.value}
            android_ripple={{ borderless: false, color: 'rgba(255, 255, 255, 0.18)' }}
            accessibilityRole="button"
            accessibilityState={{ selected: tab.value === activeSection }}
            style={({ pressed }) => [styles.topTab, (pressed || isTabPressed) && styles.topTabPressed]}
            onPressIn={() => pulseSection(tab.value)}
            onPress={() => onChangeSection(tab.value)}>
            <Text style={[styles.tabText, layout.text.tab]}>{tab.label}</Text>
          </Pressable>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tabIndicator,
          {
            left: (tabWidth - indicatorWidth) / 2,
            transform: [{ translateX: indicatorTranslateX }],
            width: indicatorWidth,
          },
        ]}
      />
    </View>
  );
}

function SearchBar({
  isOpen,
  layout,
  onChangeText,
  onClose,
  progress,
  value,
}: {
  isOpen: boolean;
  layout: HomeLayout;
  onChangeText: (value: string) => void;
  onClose: () => void;
  progress: Animated.Value;
  value: string;
}) {
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.searchBar,
        {
          height: layout.searchBarHeight,
          left: layout.sidePadding,
          opacity,
          right: layout.sidePadding,
          top: layout.searchTop,
          transform: [{ translateY }, { scale }],
        },
      ]}>
      <Search size={layout.searchIcon} color={theme.colors.textMuted} strokeWidth={2} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Search bouquets, flowers, gifts..."
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"
        style={[styles.searchInput, layout.text.search]}
        value={value}
      />
      <Pressable accessibilityLabel="Close search" accessibilityRole="button" hitSlop={layout.hitSlop} onPress={onClose}>
        <X size={layout.searchIcon} color={theme.colors.text} strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}

function RightSideActions({
  isActive,
  isAddToCartEnabled,
  isAddedToCart,
  isLiked,
  layout,
  onAddToCart,
  onLike,
  onShare,
}: {
  isActive: boolean;
  isAddToCartEnabled: boolean;
  isAddedToCart: boolean;
  isLiked: boolean;
  layout: HomeLayout;
  onAddToCart: () => void;
  onLike: () => void;
  onShare: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.actionRail,
        {
          bottom: layout.actionBottom,
          gap: layout.actionGap,
          right: layout.actionRight,
          width: layout.actionColumnWidth,
        },
      ]}>
      <ActionButton label={isLiked ? 'Liked' : 'Like'} layout={layout} onPress={onLike}>
        {isLiked ? (
          <GradientHeart size={layout.actionIcon + 2} strokeWidth={1.15} />
        ) : (
          <ShadowedIcon
            icon={Heart}
            size={layout.actionIcon}
            color={theme.colors.white}
            fill={theme.colors.white}
            strokeWidth={2.1}
          />
        )}
      </ActionButton>
      <ActionButton label="Share" layout={layout} onPress={onShare}>
        <Image source={shareIcon} style={layout.shareIcon} resizeMode="contain" />
      </ActionButton>
      <ActionButton
        disabled={!isAddToCartEnabled}
        label={!isAddToCartEnabled ? 'Coming soon' : isAddedToCart && isActive ? 'Added to cart' : 'Add to cart'}
        layout={layout}
        onPress={onAddToCart}>
        <Image source={addToCartIcon} style={layout.addToCartIcon} resizeMode="contain" />
      </ActionButton>
      <ActionButton label="More" layout={layout} onPress={() => { }}>
        <EllipsisVertical size={layout.actionIcon + 1} color={theme.colors.white} strokeWidth={3} />
      </ActionButton>
    </View>
  );
}

function ActionButton({
  children,
  disabled = false,
  label,
  layout,
  onPress,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  layout: HomeLayout;
  onPress: () => void;
}) {
  return (
    <Pressable
      android_ripple={{ borderless: true, color: 'rgba(255, 255, 255, 0.16)', radius: layout.actionIconFrame.width / 2 }}
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={layout.actionHitSlop}
      style={({ pressed }) => [
        styles.actionButton,
        layout.actionButton,
        pressed && !disabled && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}>
      <View style={[styles.actionIconFrame, layout.actionIconFrame]}>{children}</View>
      <Text numberOfLines={2} style={[styles.actionLabel, layout.text.action]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ShadowedIcon({
  color,
  fill,
  icon: Icon,
  size,
  strokeWidth,
}: {
  color: string;
  fill?: string;
  icon: LucideIcon;
  size: number;
  strokeWidth: number;
}) {
  const shadowFill = fill ? 'rgba(0, 0, 0, 0.3)' : 'transparent';

  return (
    <View style={[styles.shadowedIcon, { height: size + 5, width: size + 5 }]}>
      <View style={styles.iconShadowLayer}>
        <Icon color="rgba(0, 0, 0, 0.32)" fill={shadowFill} size={size} strokeWidth={strokeWidth} />
      </View>
      <View style={styles.iconForegroundLayer}>
        <Icon color={color} fill={fill ?? 'transparent'} size={size} strokeWidth={strokeWidth} />
      </View>
    </View>
  );
}

function GradientHeart({ size, strokeWidth = 1 }: { size: number; strokeWidth?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Defs>
        <LinearGradient id="likedHeartGradient" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#FF8A3D" />
          <Stop offset="0.32" stopColor="#FF4F5F" />
          <Stop offset="0.66" stopColor="#D92E91" />
          <Stop offset="1" stopColor="#6D3BDD" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#likedHeartGradient)"
        stroke={theme.colors.white}
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

function LikeBurst({
  layout,
  progress,
  visible,
}: {
  layout: HomeLayout;
  progress: Animated.Value;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  const opacity = progress.interpolate({
    inputRange: [0, 0.16, 0.78, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.56, 1.12, 0.98],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, -28],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.likeBurst,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}>
      <GradientHeart size={layout.likeBurstSize} strokeWidth={0.8} />
      <Text style={styles.likeBurstText}>Liked</Text>
    </Animated.View>
  );
}

function ShareFloatingPanel({
  layout,
  product,
  progress,
}: {
  layout: HomeLayout;
  product: ProductFeedItem | null;
  progress: Animated.Value;
}) {
  if (!product) {
    return null;
  }

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sharePanel,
        {
          bottom: layout.sharePanelBottom,
          left: layout.sidePadding,
          opacity,
          right: layout.sidePadding,
          transform: [{ translateY }],
        },
      ]}>
      <View style={styles.sharePanelIconFrame}>
        <Image source={shareIcon} style={layout.sharePanelIcon} resizeMode="contain" />
      </View>
      <View style={styles.sharePanelText}>
        <Text numberOfLines={1} style={styles.sharePanelTitle}>
          Share {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.sharePanelSubtitle}>
          Share options are ready
        </Text>
      </View>
    </Animated.View>
  );
}

type HomeLayout = ReturnType<typeof getHomeLayout>;
type ProductFeedListRef = FlatList<ProductFeedItem> & {
  getNode?: () => FlatList<ProductFeedItem>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFeedItemSort(section: FeedSection, item: ProductFeedItem) {
  if (section === 'new' && item.id === 'mothers-day-for-you') {
    return 0;
  }

  return 1;
}

function formatProductPrice(price: number, currency: ProductFeedItem['currency']) {
  return new Intl.NumberFormat('en-PH', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(price);
}

function getHomeLayout(width: number, height: number, insets: { bottom: number; top: number }) {
  const screenWidth = PixelRatio.roundToNearestPixel(width);
  const screenHeight = PixelRatio.roundToNearestPixel(height);
  const shortSide = Math.min(width, height);
  const heightScale = clamp(height / 844, 0.82, 1.1);
  const widthScale = clamp(width / 390, 0.86, 1.1);
  const scale = Math.min(heightScale, widthScale);
  const brandHeaderLayout = getAppBrandHeaderLayout(width, height, insets.top);
  const sidePadding = brandHeaderLayout.sidePadding;
  const feedItemHeight = screenHeight;
  const headerTop = brandHeaderLayout.top;
  const headerHeight = brandHeaderLayout.height;
  const tabsTop = headerTop + headerHeight + clamp(height * 0.018, 12, 18);
  const tabHeight = clamp(height * 0.034, 28, 34);
  const searchBarHeight = clamp(height * 0.054, 44, 50);
  const searchTop = tabsTop + tabHeight + clamp(height * 0.014, 10, 14);
  const navHeight = clamp(height * 0.074, 60, 70);
  const actionIcon = clamp(shortSide * 0.082, 30, 36);
  const actionColumnWidth = clamp(actionIcon + 34, 64, 74);
  const actionRight = sidePadding + (36 - actionColumnWidth) / 2;
  const productTextBottom = clamp(height * 0.19, 136, 170);
  const navBottom = Math.max(insets.bottom + theme.spacing.sm, (productTextBottom - navHeight) / 2);
  const actionBottom = navBottom + navHeight + clamp(height * 0.006, 5, 8);

  return {
    actionBottom,
    actionButton: {
      minHeight: clamp(height * 0.062, 48, 56),
      width: actionColumnWidth,
    },
    actionHitSlop: {
      bottom: 4,
      left: 4,
      right: 4,
      top: 4,
    },
    actionColumnWidth,
    actionGap: clamp(height * 0.014, 9, 13),
    actionIcon,
    actionIconFrame: {
      height: clamp(actionIcon + 10, 40, 46),
      width: clamp(actionIcon + 10, 40, 46),
    },
    actionRight,
    addToCartIcon: {
      height: clamp(actionIcon * 1.18, 38, 44),
      marginLeft: clamp(actionIcon * 0.12, 4, 5),
      width: clamp(actionIcon * 1.22, 40, 46),
    },
    bottomVignetteHeight: clamp(height * 0.46, 330, 460),
    feedItemHeight,
    headerTop,
    hitSlop: {
      bottom: 8,
      left: 10,
      right: 10,
      top: 8,
    },
    likeBurstSize: clamp(shortSide * 0.23, 86, 108),
    navBottom,
    navHeight,
    productTextBottom,
    productTextRight: sidePadding + actionColumnWidth + clamp(width * 0.035, 12, 18),
    screenWidth,
    searchBarHeight,
    searchIcon: clamp(shortSide * 0.05, 18, 21),
    searchTop,
    shareIcon: {
      height: clamp(actionIcon * 0.86, 28, 32),
      width: clamp(actionIcon * 0.98, 32, 36),
    },
    sharePanelBottom: navBottom + navHeight + clamp(height * 0.016, 12, 16),
    sharePanelIcon: {
      height: clamp(shortSide * 0.052, 18, 22),
      width: clamp(shortSide * 0.062, 22, 26),
    },
    sidePadding,
    tabsTop,
    metaIcon: clamp(12 * scale, 11, 13),
    text: {
      action: {
        fontFamily: Fonts.sansMedium,
        fontSize: clamp(11 * scale, 10, 11.5),
        lineHeight: clamp(14 * scale, 13, 15),
      },
      meta: {
        fontFamily: Fonts.sansMedium,
        fontSize: clamp(11.5 * scale, 10.5, 12),
        lineHeight: clamp(15 * scale, 14, 16),
      },
      productDescription: {
        fontFamily: Fonts.sans,
        fontSize: clamp(15.5 * scale, 14, 16),
        lineHeight: clamp(22 * scale, 20, 24),
      },
      productName: {
        fontFamily: Fonts.sansBold,
        fontSize: clamp(25 * scale, 21, 27),
        lineHeight: clamp(31 * scale, 27, 33),
      },
      productPrice: {
        fontFamily: Fonts.sansBold,
        fontSize: clamp(34 * scale, 29, 37),
        lineHeight: clamp(42 * scale, 36, 45),
      },
      search: {
        fontFamily: Fonts.sans,
        fontSize: clamp(14 * scale, 13, 15),
      },
      tab: {
        fontFamily: Fonts.condensedMedium,
        fontSize: clamp(13.5 * scale, 12.5, 14.5),
        lineHeight: clamp(18 * scale, 16, 19),
      },
    },
  };
}

const whiteShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.24)',
  textShadowOffset: { height: 1, width: 1 },
  textShadowRadius: 1.6,
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.text,
    flex: 1,
    overflow: 'hidden',
  },
  feedList: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  sectionFeedList: {
    overflow: 'hidden',
  },
  feedItem: {
    backgroundColor: theme.colors.text,
    overflow: 'hidden',
    position: 'relative',
  },
  productImageContainer: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  blankFeedImage: {
    backgroundColor: '#111A13',
    height: '100%',
    width: '100%',
  },
  forYouFeedImage: {
    backgroundColor: '#1E8B4E',
  },
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  bottomVignette: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    zIndex: 10,
  },
  logoFrame: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
  },
  logoImage: {
    height: '100%',
    width: '100%',
  },
  logoShadowImage: {
    height: '100%',
    opacity: 0.26,
    position: 'absolute',
    transform: [{ translateX: 0.8 }, { translateY: 1.2 }],
    width: '100%',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: theme.radius.pill,
    borderWidth: 0,
    justifyContent: 'center',
    position: 'relative',
  },
  topTabs: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 9,
    position: 'absolute',
    zIndex: 10,
  },
  topTab: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 30,
    overflow: 'hidden',
  },
  topTabPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    transform: [{ scale: 0.97 }],
  },
  tabText: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.condensedMedium,
    textAlign: 'center',
  },
  tabIndicator: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    bottom: 0,
    height: 2,
    position: 'absolute',
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    position: 'absolute',
    zIndex: 11,
  },
  searchInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    paddingVertical: 0,
  },
  productText: {
    position: 'absolute',
    zIndex: 4,
  },
  productMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  productMetaChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  productMetaText: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.sansMedium,
  },
  productName: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    marginBottom: theme.spacing.sm,
  },
  productDescription: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.sans,
  },
  viewMoreText: {
    fontFamily: Fonts.sansSemiBold,
  },
  feedCta: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
  },
  feedCtaPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  feedCtaText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 17,
  },
  productPrice: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    marginTop: theme.spacing.md,
  },
  actionRail: {
    alignItems: 'center',
    position: 'absolute',
    zIndex: 5,
  },
  actionButton: {
    alignItems: 'center',
    gap: 1,
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.92 }],
  },
  actionButtonDisabled: {
    opacity: 0.48,
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: theme.radius.pill,
    borderWidth: 0,
    justifyContent: 'center',
  },
  shadowedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconShadowLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.72,
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  iconForegroundLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.sansMedium,
    textAlign: 'center',
  },
  likeBurst: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '39%',
    zIndex: 20,
  },
  likeBurstText: {
    ...whiteShadow,
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    marginTop: theme.spacing.sm,
  },
  sharePanel: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    boxShadow: '0 14px 30px rgba(20, 28, 22, 0.2)',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 64,
    paddingHorizontal: theme.spacing.lg,
    position: 'absolute',
    zIndex: 18,
  },
  sharePanelIconFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sharePanelText: {
    flex: 1,
  },
  sharePanelTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  sharePanelSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    marginTop: 2,
  },
});

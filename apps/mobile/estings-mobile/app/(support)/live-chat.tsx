import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as NavigationBar from 'expo-navigation-bar';
import {
  Camera,
  ChevronLeft,
  CircleHelp,
  Copy,
  FileText,
  Flag,
  Image as ImageIcon,
  Info,
  MoreVertical,
  Package,
  Paperclip,
  ReceiptText,
  Reply,
  Send,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { theme } from '@/constants/theme';
import {
  createChatSession,
  deleteChatMessage,
  getChatHistory,
  getChatWebSocketUrl,
  sendChatMessage,
  uploadChatImage,
  type BackendChatMessage,
} from '@/services/chat-api';
import { getAuthSession, type AuthSession } from '@/services/auth-session';
import {
  fallbackFaqs,
  getFaqCategories,
  type FaqCategory,
} from '@/services/help-content-api';
import { showLocalChatNotification } from '@/utils/push-notifications';

const supportAvatarImage = require('../../assets/images/estings-logo.svg');
const chatOutlineColor = 'rgba(31, 42, 36, 0.09)';
const chatDividerColor = 'rgba(31, 42, 36, 0.08)';
const chatOutlineWidth = 1;
const inputLineHeight = 20;
const inputMaxLines = 5;
const inputMaxHeight = inputLineHeight * inputMaxLines + 16;
const chatHistoryPollMs = 5000;
let hasAcceptedChatAgreementThisSession = false;

type SupportStatus = 'Active' | 'Inactive' | 'Connecting' | 'Sign in required';
type MessageSender = 'support' | 'customer';
type AttachmentKind = 'image' | 'file';
type EmptySheetType = 'products' | 'orders' | 'cart';
type FloatingMenuType = 'attachments' | 'chat-options';
type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last';
type SuggestedQuestion = {
  id: string;
  label: string;
};

type ChatAttachment = {
  id: string;
  kind: AttachmentKind;
  name: string;
  type?: string;
  uri?: string;
};

type ChatMessage = {
  createdAt?: string;
  id: string;
  sender: MessageSender;
  text: string;
  attachments?: ChatAttachment[];
};

type AttachmentOption = {
  id: 'gallery' | 'camera' | 'products' | 'orders';
  label: string;
  icon: typeof Paperclip;
};

const mockLatestCustomerStatus = 'Sent';
const chatPopFileName = 'esting-chat-pop-soft.wav';
const maxMessageLength = 4096;
const maxAttachmentCount = 4;
const chatPopSoundBase64 =
  'UklGRoQEAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YWAEAAAAAJARgSCkKoQulStMIgkU5gJo8RriOddW0iPUVdy26Uv6pgs9G8smpCzzK9gkYRhoCET3dudN24vUKNQt2rLlA/XfBdAVgiIeKowrnSYPHHMN7/zt7MTfXdft1MrYXeI68FYAVhDjHQYnbSqeJwof9hFQAmTyhOS22mTWKdi93wDsIvvpCgkZciOkKOEnTSHjFVIHwfdz6X7eethC2NfdY+hW9qMFDRR7H0QmbyfYIi8Z4wvq/HTunuIf2wrZqNxq5QXymwALDzobYSNVJq0j0xvxD8oBcPP75jvec9or3BzjPO7o+xwKxxYQIKAk0yPLHXITTQZO+H3ruuFu3FnceOEH65n3VgU8EmkcZSJUIxkfWhZiCvb8J38Pwl4FKUcmiDIH1MaDhFYBev4le3/5GXgbuAS5Z7tzfj5BFwQTRmAHjkfYxuSE/IIEv2w8XTotOJC4U/kYutt9fUASQzCFQEcIh7aG4UVFQzvALj1D+xe5ZniIuS56YnyQ/1SCBsSMhmRHMAb5Ba4DnMEmPm8707oYOSA5KPoJ/Dx+YwEbg4mFpcaIBu0F9cQkAc//WTzb+uH5l7lGehM7gv3CQHQCvUSSBgIGvkXbhI9CpoA8/as7vroreYW6PnsmvTY/VUHsg+2FYUYvBd/E3EMnwNW+vDxputf6I/oK+yk8gT7DgRyDPYSqhYJFwwUKA4/Bnz9J/V27mDqeenc6yvxmfgMAUkJGxCIFO0VHhRjD3QIVgA9+FXxnuzE6gXsLvCc9lz+SAY7DTISdxS8EyMQNwraAiT7MvQH72DsnOyq7xP1CPyBA2cKuw+4EvQSbRCHC/0Eyv349ofxPu6S7Zjv/fMX+v8Asgc3DcEQ0xFJEGMMugYjAJj5C/RJ8Nvu8O9Y85D40P4sBbcKpQ5nEMEP0QwLCCYCAfyB9nHyZfCl8CDzdPf7/OICTwh2DMIO4Q7WDPIIzAMo/tj4o/Qh8qvxTfPD9ob74gANBkYK9Qy4DXoMbwkPBQAAAfvM9vzz8/LU83j2dfo0/wAEJwgRC1UMyQuJCe4FggHv/N745PVt9Kv0jfbI+d79NAIoBigJyArRCkcJagaqApb+x/rJ9wn2w/X69nz55vy0AFgESwciCZ4JsgiHBnMD7v96/Jr5tfcM97T3jPlM/If/wwKKBXUHQQjXB0sG3wPvAO39R/tg+Xj4rfjx+Q78sv51AfMD0AXKBsIGwAXvA5gBFf/E/Pr69vnY+aD6Kfw2/nUAlAJFBEoFhAXwBKoD5wHs/wP+c/x0+yb7jfuW/BP+yv94AeAC0QMsBOkDGAPeAWwA+/6//eT8hfys/Ev9Rv51/6YAsQFvAskCtwJCAoIBlgCk/8/+Nf7n/ez9Pv7J/nb/JgDCADMBbAFrATYB2gBqAPr/mv9Z/zv/QP9h/5T/zP/8/x0AKgAmABUA';

const softChatPopSoundBase64 =
  'UklGRuQHAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YcAHAAAAAAwALgBYAHoAhQBvADYA4/+D/yv/8P7f/v7+Sf+0/yoAmwD1ACwBPQEqAfsAtgBjAAUAof83/8/+c/4y/iD+T/7J/o7/jACiAaECVQOQAzMDOwLBAP/+Pf3R+wb7Dfvy+5n9vv8CAv8DVwXKBUMF2gPPAYP/WP2v+8f6vPqB++b8pP5sAPwBIAPCA+EDkwPzAh4CLQEsACb/H/4l/VD8wfuf+w38H/3M/uwANwNLBcAGPgeOBq4E1wF2/hz7Zvjc9tT2YfhL+xX/GAOeBgYJ5gkaCc4GcAOf/wX8Ovmq94H3p/jQ+ov9WgDTAqUErAXoBXoFjQRQA+kBbQDr/mz9AvzM+vf5uflE+rz7B/7qAAIEzwbJCH0JrAhXBskCkf5j+v/2CfXm9Kb2A/pn/g0DJAf3CQ4LRQrSBzAEDwAp/B/5ZPci90H4bvox/QsAjQJnBHUFuAVSBXEERAPwAY4AKv/N/Yf8cPuv+nL64foU/AP+fwA1A7YFiwdNCL0H1wXUAi3/e/tp+In2OfaT92D6Jf43AuAFfgigCSAJIQcMBHYAAv1A+pn4O/gW+eX6Rf3F//8BrwOvBP0EsgT4A/gC0gGeAGn/Of4a/SH8b/sr+3r7cfwO/isAhQK8BGgGLwfVBk8FygKo/278rvnq93z3gPjN+v/9hgHDBCcHSggDCGsG1gPBALv9Qvu2+UT55fli+2X9j/+HAQsD+QNNBBoEggOqAq8BpwCc/5X+m/3B/B/82PsM/ND8Jf7t/+8B3wNhBSUG9QXBBK0CBQA9/c/6Lvmt+Gj5Rfvz/fcAzAPyBQ0H8wazBZED9ABW/ib8uvo9+q764fuR/Wv/IQF6AlQDqgOKAxADXQKJAagAxf/k/g3+T/2//Hj8mPwx/UX+wP9zAR4DdAQwBR8FMgSBAkkA6/3N+1T6yPlK+sX7+/2HAPcC3gTqBfIF/QRAAxEB1f7t/KT7I/tt+2H8xv1V/80A+wG/AhQDAwOkAhACYAGjAOT/Jv9w/s39Tv0L/Rv9kP1t/qP/DQF3AqEDUARWBKQDSQJ3AHr+qvxb+876IftJ/BT+MgBDAusD4gQBBUsE5wIaATv/mP11/Pb7Ivzf/AH+TP+JAI0BOwKLAoYCPQLGATYBmQD7/13/xf48/s79kP2V/ez9mf6T/7sA6QHoAoYDnAMaAwkCkQDu/mf9RPy8++z7zfw8/vb/rgEYA/UDIwSgA4kCFQGK/yr+Lf21/Mr8Wv1A/k7/VAAwAccBEQITAt0BfwELAYwACgCK/w3/m/4//gj+Bf5E/sn+jv98AHMBSALSAvIClgLFAZsASf8H/hD9kvyo/E/9bf7O/zUBYgIjA1kD/gIpAgMBxP+j/s39YP1k/c79gf5Y/y0A4gBhAaQBrAGEATwB4AB7ABQArf9J/+3+of5x/mr+lv76/pL/TAARAb8BNQJYAhoCfgGYAI7/i/6//VD9U/3M/aX+uP/UAMoBbQKkAmgCygHoAO3/Bf9V/vb98P07/sL+af8RAKIACwFEAU8BNAH+ALcAaQAYAMn/e/8y//b+zf7E/uH+Kv+c/ykAwgBMAa0B0AGoATcBiwDA//b+U/70/e39QP7g/rD/iwBMAdEBBALgAW4BxgAHAFP/x/53/mv+nv4B/3//AABwAMMA8gD+AOwAxQCRAFYAGQDd/6L/a/88/xz/Ev8l/1j/qv8SAIQA7QA6AVoBQgH0AHgA4v9L/83+gP50/qr+G/+y/1QA5wBPAXwBaAEZAaEAFQCP/yT/5f7W/vf+PP+X//b/SQCIAK4AuQCuAJMAbQBDABcA7P/B/5n/d/9e/1X/YP+C/7v/BABVAKIA2wD2AOoAtgBgAPf/i/8v//X+5v4I/1T/vP8uAJgA5QAJAQABzQB7ABoAu/9u/z7/Mf9E/3L/sP/y/ywAWgB2AH8AeQBnAE4AMQATAPb/2f+9/6X/lP+M/5L/qP/M//3/MwBnAJAApACfAH8ARwACALr/e/9S/0X/WP+I/8v/FgBcAJEArACpAIsAVwAYANr/pv+F/3r/hf+h/8j/8v8YADcASgBRAE4AQwAzACEADgD8/+n/2P/J/73/uP+7/8f/3f/7/xsAPABWAGQAYgBQADAABgDb/7T/mf+P/5n/tP/c/wgAMgBTAGUAZQBUADcAEgDu/8//uv+y/7f/x//d//b/CwAdACkALQAsACYAHgAUAAkA///1/+v/4//c/9n/2v/g/+z/+/8NAB4ALQA1ADUALAAbAAYA7//a/8z/xv/K/9f/6/8BABcAKAAyADMAKwAdAAsA+f/q/9//2//d/+T/7v/6/wQADQASABUAFAASAA4ACQAEAAAA/P/3//T/8f/v//D/8v/3//3/BAAMABIAFQAWABIADAADAPv/8v/s/+r/6//w//f/AAAHAA4AEgASABAACwAEAP//+f/1//T/9P/3//r//v8BAAMABQAGAAYABQAEAAIAAQAAAP///v/9//z//P/8//3//v8AAAAAAgAEAAQABAAEAAIAAAAAAP7//f/8//3//f///wAAAQACAAIAAgACAAEAAAAAAAAA//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const chatPopSoundPayload =
  softChatPopSoundBase64.length > 0 ? softChatPopSoundBase64 : chatPopSoundBase64;

const initialMessages: ChatMessage[] = [
  {
    createdAt: new Date().toISOString(),
    id: 'support-welcome',
    sender: 'support',
    text: "Hi there! \u{1F44B} Welcome to Esting's Flowers. How can we help you today? Our team is here to assist you.",
  },
];

const attachmentOptions: AttachmentOption[] = [
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ReceiptText },
];

const emptySheetContent: Record<
  EmptySheetType,
  {
    title: string;
    message: string;
  }
> = {
  products: {
    title: 'Products',
    message: "You haven't ordered anything yet.",
  },
  orders: {
    title: 'Orders',
    message: "You don't have any orders yet.",
  },
  cart: {
    title: 'Product inquiry',
    message: "You haven't ordered anything yet.",
  },
};

export default function LiveChatScreen({ onRequestClose }: { onRequestClose?: () => void } = {}) {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ productId?: string; productName?: string; productPrice?: string; quote?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const chatPopSoundRef = useRef<Audio.Sound | null>(null);
  const chatPopUriRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const sendIconSpinAnim = useRef(new Animated.Value(0)).current;
  const composerModeAnim = useRef(new Animated.Value(0)).current;
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [supportStatus, setSupportStatus] = useState<SupportStatus>('Connecting');
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>(fallbackFaqs);
  const [selectedFaqCategoryId, setSelectedFaqCategoryId] = useState<string | null>(null);
  const [activeFloatingMenu, setActiveFloatingMenu] = useState<FloatingMenuType | null>(null);
  const [composerHeight, setComposerHeight] = useState(64);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isChatAgreementVisible, setIsChatAgreementVisible] = useState(!hasAcceptedChatAgreementThisSession);
  const [emptySheetType, setEmptySheetType] = useState<EmptySheetType | null>(null);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState<ChatMessage | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [visibleDetailsMessageId, setVisibleDetailsMessageId] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const sentProductReferenceKey = useRef<string | null>(null);
  const closeChat = useCallback(() => {
    if (onRequestClose) onRequestClose();
    else router.back();
  }, [onRequestClose]);

  const isSignedIn = Boolean(session);
  const productReferenceMessage = useMemo(() => {
    const productId = typeof params.productId === 'string' ? params.productId.trim() : '';
    const productName = typeof params.productName === 'string' ? params.productName.trim() : '';
    const productPrice = typeof params.productPrice === 'string' ? params.productPrice.trim() : '';
    const quote = typeof params.quote === 'string' ? params.quote.trim() : '';

    if (quote) {
      return quote;
    }

    if (!productId || !productName) {
      return '';
    }

    return [
      "I'm interested in this product:",
      productName,
      productPrice ? `Price: ${productPrice}` : null,
      `Product ID: ${productId}`,
    ]
      .filter(Boolean)
      .join('\n');
  }, [params.productId, params.productName, params.productPrice, params.quote]);
  const canSend = useMemo(
    () =>
      isSignedIn &&
      !isSending &&
      (input.trim().length > 0 || pendingAttachments.length > 0) &&
      input.length <= maxMessageLength,
    [input, isSending, isSignedIn, pendingAttachments.length]
  );
  const hasComposerContent = isSignedIn && (input.trim().length > 0 || pendingAttachments.length > 0);
  const hasTypedMessage = input.trim().length > 0;
  const canScrollInput = inputHeight >= inputMaxHeight;
  const isActive = supportStatus === 'Active';
  const emptySheet = emptySheetType ? emptySheetContent[emptySheetType] : null;
  const selectedFaqCategory = faqCategories.find(
    (category) => category.id === selectedFaqCategoryId,
  ) ?? null;
  const suggestedQuestions = useMemo<SuggestedQuestion[]>(() => {
    if (!selectedFaqCategory) {
      return faqCategories.map((category) => ({ id: category.id, label: category.category }));
    }

    return selectedFaqCategory.items.filter((item) => item.q && item.a).map((item) => ({
      id: item.id,
      label: item.q,
    }));
  }, [faqCategories, selectedFaqCategory]);
  const latestCustomerMessageId = useMemo(() => getLatestCustomerMessageId(messages), [messages]);
  const headerTopPadding = insets.top > 0 ? insets.top + 2 : theme.spacing.lg;
  const bottomSystemInset = Math.max(insets.bottom, theme.spacing.sm);
  // KeyboardAvoidingView moves the composer once. Do not also add the keyboard
  // height here, or Android leaves a large empty gap above the keyboard.
  const composerBottomPadding = bottomSystemInset + theme.spacing.xs;
  const floatingMenuBottom = composerHeight + theme.spacing.sm;
  const chatOptionsTop = headerTopPadding + 64;

  useEffect(() => {
    scrollToLatest();
  }, [messages.length]);

  useEffect(() => {
    let active = true;

    void getFaqCategories()
      .then((categories) => {
        if (active) setFaqCategories(categories);
      })
      .catch(() => {
        // Keep the bundled FAQ content available when Help Center cannot be reached.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let historyPollTimer: ReturnType<typeof setInterval> | null = null;

    const mergeHistory = (history: BackendChatMessage[]) => {
      if (!isMounted) {
        return;
      }

      setMessages((currentMessages) => mergeBackendMessages(currentMessages, history));
    };

    getAuthSession()
      .then(async (nextSession) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setIsAuthReady(true);

        if (!nextSession) {
          setChatSessionId(null);
          setMessages(initialMessages);
          setSupportStatus('Sign in required');
          return;
        }

        setSupportStatus('Connecting');
        const nextChatSession = await createChatSession({ session: nextSession });

        if (!isMounted) {
          return;
        }

        setChatSessionId(nextChatSession.id);
        const history = await getChatHistory({ session: nextSession, userId: nextChatSession.id });

        if (!isMounted) {
          return;
        }

        mergeHistory(history);

        historyPollTimer = setInterval(() => {
          getChatHistory({ session: nextSession, userId: nextChatSession.id })
            .then(mergeHistory)
            .catch(() => {
              if (isMounted) {
                setSupportStatus((currentStatus) =>
                  currentStatus === 'Sign in required' ? currentStatus : 'Inactive'
                );
              }
            });
        }, chatHistoryPollMs);

        const websocket = new WebSocket(getChatWebSocketUrl({ session: nextSession, userId: nextChatSession.id }));
        wsRef.current = websocket;

        websocket.onopen = () => {
          setSupportStatus('Active');
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as Partial<BackendChatMessage> & {
              image_url?: string | null;
              message?: string;
              sender?: string;
            };

            if (data.sender === 'customer') {
              return;
            }

            let shouldNotify = false;
            const incomingMessage = mapBackendChatMessage({
              created_at: data.created_at ?? new Date().toISOString(),
              id: data.id ?? createId('support-ws'),
              image_url: data.image_url,
              is_read: data.is_read ?? 0,
              message: data.message ?? '',
              sender: data.sender ?? 'staff',
              user_id: data.user_id ?? nextChatSession.id,
            });

            setMessages((currentMessages) => {
              if (data.id && currentMessages.some((message) => message.id === data.id)) {
                return currentMessages;
              }

              shouldNotify = true;

              return [...currentMessages, incomingMessage];
            });
            void playChatPop();
            if (shouldNotify) {
              void showLocalChatNotification({
                body: getChatNotificationBody(incomingMessage),
                conversationId: nextChatSession.id,
                messageId: incomingMessage.id,
              });
            }
          } catch {
            // Ignore malformed websocket payloads.
          }
        };

        websocket.onclose = () => {
          if (wsRef.current === websocket) {
            wsRef.current = null;
          }
          setSupportStatus((currentStatus) => (currentStatus === 'Sign in required' ? currentStatus : 'Inactive'));
        };

        websocket.onerror = () => {
          setSupportStatus('Inactive');
        };
      })
      .catch((error) => {
        if (isMounted) {
          setIsAuthReady(true);
          setSupportStatus('Inactive');
          setValidationMessage(error instanceof Error ? error.message : 'Chat is unavailable.');
        }
      });

    return () => {
      isMounted = false;
      if (historyPollTimer) {
        clearInterval(historyPollTimer);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
    // This bootstraps chat once when the screen mounts; helper functions are stable for this screen lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeChat();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [closeChat]);

  useEffect(() => {
    Animated.timing(sendButtonAnim, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      toValue: hasComposerContent ? 1 : 0,
      useNativeDriver: false,
    }).start();

    if (hasComposerContent) {
      sendIconSpinAnim.setValue(0);
      Animated.timing(sendIconSpinAnim, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      }).start();
    }
  }, [hasComposerContent, sendButtonAnim, sendIconSpinAnim]);

  useEffect(() => {
    Animated.timing(composerModeAnim, {
      duration: 170,
      easing: Easing.out(Easing.cubic),
      toValue: hasTypedMessage ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [composerModeAnim, hasTypedMessage]);

  useEffect(() => {
    if (!productReferenceMessage) {
      return;
    }

    if (!session || !chatSessionId) {
      setInput((currentInput) => currentInput || productReferenceMessage);
      return;
    }

    if (sentProductReferenceKey.current === productReferenceMessage) {
      return;
    }

    sentProductReferenceKey.current = productReferenceMessage;
    void sendMessage(productReferenceMessage);
    // Product references should be sent once after chat session bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSessionId, productReferenceMessage, session]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      void NavigationBar.setVisibilityAsync('visible').catch(() => {});
      void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
    }

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setActiveFloatingMenu(null);
        setTimeout(scrollToLatest, 80);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setTimeout(scrollToLatest, 80);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      void chatPopSoundRef.current?.unloadAsync();
    };
  }, []);

  function scrollToLatest() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async function getChatPopSoundUri() {
    if (chatPopUriRef.current) {
      return chatPopUriRef.current;
    }

    const uri = `${FileSystem.cacheDirectory}${chatPopFileName}`;
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(uri, chatPopSoundPayload, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    chatPopUriRef.current = uri;

    return uri;
  }

  async function playChatPop() {
    try {
      const uri = await getChatPopSoundUri();

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      if (!chatPopSoundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, volume: 0.12 }
        );

        chatPopSoundRef.current = sound;
      }

      await chatPopSoundRef.current.replayAsync();
    } catch {
      // Sound is a small UX enhancement; chat should keep working if playback is unavailable.
    }
  }

  function addImageAttachment(asset: ImagePicker.ImagePickerAsset, source: 'Gallery' | 'Camera') {
    if (pendingAttachments.length >= maxAttachmentCount) {
      setValidationMessage(`You can attach up to ${maxAttachmentCount} images per message.`);
      return;
    }

    setValidationMessage('');
    setPendingAttachments((currentAttachments) => [
      ...currentAttachments,
      {
        id: createId('image'),
        kind: 'image',
        name: asset.fileName ?? `${source} image`,
        type: asset.mimeType ?? 'image/jpeg',
        uri: asset.uri,
      },
    ]);
  }

  async function pickGalleryImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Please allow photo access to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.82,
      selectionLimit: Math.max(1, maxAttachmentCount - pendingAttachments.length),
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => addImageAttachment(asset, 'Gallery'));
    }
  }

  async function captureCameraImage() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Please allow camera access to attach a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.82,
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => addImageAttachment(asset, 'Camera'));
    }
  }

  function removePendingAttachment(id: string) {
    setValidationMessage('');
    setPendingAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== id)
    );
  }

  function handleInputChange(value: string) {
    setInput(value);

    if (!value) {
      setInputHeight(36);
    }

    if (value.length <= maxMessageLength && validationMessage) {
      setValidationMessage('');
    }
  }

  async function sendMessage(text: string) {
    const trimmedText = text.trim();

    if (!session || !chatSessionId) {
      setValidationMessage('Please sign in to chat with Esting\'s support.');
      return;
    }

    if (!trimmedText && pendingAttachments.length === 0) {
      return;
    }

    if (text.length > maxMessageLength) {
      setValidationMessage('Message is too long.');
      return;
    }

    setIsSending(true);
    setValidationMessage('');
    let pendingMessageId: string | null = null;

    try {
      const firstImageAttachment = pendingAttachments.find((attachment) => attachment.kind === 'image' && attachment.uri);
      const uploadedImage = firstImageAttachment
        ? await uploadChatImage({
            image: {
              name: firstImageAttachment.name,
              type: firstImageAttachment.type,
              uri: firstImageAttachment.uri as string,
            },
            session,
          })
        : null;
      pendingMessageId = createId('pending-customer');
      const optimisticMessage: ChatMessage = {
        attachments: pendingAttachments.length ? pendingAttachments : undefined,
        createdAt: new Date().toISOString(),
        id: pendingMessageId,
        sender: 'customer',
        text: trimmedText,
      };

      // Add the customer's message before the request so a fast automated WebSocket reply
      // can never appear above the question that triggered it.
      setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
      const savedMessage = await sendChatMessage({
        imageUrl: uploadedImage?.image_url,
        session,
        text: trimmedText,
        userId: chatSessionId,
      });

      setMessages((currentMessages) => {
        const savedChatMessage = mapBackendChatMessage(savedMessage);
        const hasSavedMessage = currentMessages.some((message) => message.id === savedMessage.id);

        if (hasSavedMessage) {
          return currentMessages.filter((message) => message.id !== pendingMessageId);
        }

        return currentMessages.map((message) =>
          message.id === pendingMessageId ? savedChatMessage : message,
        );
      });
      setInput('');
      setInputHeight(36);
      setPendingAttachments([]);
      void playChatPop();
    } catch (error) {
      if (pendingMessageId) {
        setMessages((currentMessages) =>
          currentMessages.filter((message) => message.id !== pendingMessageId),
        );
      }
      setValidationMessage(error instanceof Error ? error.message : 'Message could not be sent.');
    } finally {
      setIsSending(false);
    }
  }

  function handleSuggestedQuestion(question: SuggestedQuestion) {
    if (!selectedFaqCategory) {
      const category = faqCategories.find((item) => item.id === question.id);
      if (category) setSelectedFaqCategoryId(category.id);
      return;
    }

    setSelectedFaqCategoryId(null);
    void sendMessage(question.label);
  }

  function handleBackToFaqTopics() {
    setSelectedFaqCategoryId(null);
  }

  async function handleAttachmentOption(option: AttachmentOption) {
    setActiveFloatingMenu(null);

    if (!session) {
      setValidationMessage('Please sign in to attach files.');
      return;
    }

    if (option.id === 'gallery') {
      await pickGalleryImage();
      return;
    }

    if (option.id === 'camera') {
      await captureCameraImage();
      return;
    }

    setEmptySheetType(option.id);
  }

  function handleNeedHelp() {
    setActiveFloatingMenu(null);
    void sendMessage('I need help with this chat.');
  }

  function handleReportChat() {
    setActiveFloatingMenu(null);
    void sendMessage('I want to report this chat.');
  }

  function handleShopNow() {
    setEmptySheetType(null);
    router.push('/categories');
  }

  function openImagePreview(uri: string) {
    setPreviewScale(1);
    setPreviewImageUri(uri);
  }

  function closeImagePreview() {
    setPreviewImageUri(null);
    setPreviewScale(1);
  }

  function handleDeleteForMe() {
    if (!deleteTargetMessage) {
      return;
    }

    const messageId = deleteTargetMessage.id;
    setMessages((currentMessages) => currentMessages.filter((message) => message.id !== messageId));
    setDeleteTargetMessage(null);
  }

  async function handleCopyMessage() {
    if (!deleteTargetMessage) {
      return;
    }

    const copyText = getMessageActionText(deleteTargetMessage);
    setDeleteTargetMessage(null);

    if (!copyText) {
      setValidationMessage('There is no message text to copy.');
      return;
    }

    try {
      if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
        await globalThis.navigator.clipboard.writeText(copyText);
        setValidationMessage('Message copied.');
        return;
      }

      setValidationMessage('Copy is not available on this device yet.');
    } catch {
      setValidationMessage('Message could not be copied.');
    }
  }

  function handleReplyToMessage() {
    if (!deleteTargetMessage) {
      return;
    }

    const quoteText = getMessageActionText(deleteTargetMessage) || 'Image';
    const senderLabel = deleteTargetMessage.sender === 'customer' ? 'You' : "Esting's";
    setInput((currentInput) => {
      const replyPrefix = `Replying to ${senderLabel}: "${quoteText.slice(0, 120)}"\n`;
      return currentInput ? `${replyPrefix}${currentInput}` : replyPrefix;
    });
    setDeleteTargetMessage(null);
  }

  async function handleDeleteForEveryone() {
    if (!deleteTargetMessage || !session) {
      return;
    }

    const messageId = deleteTargetMessage.id;
    setDeleteTargetMessage(null);

    try {
      await deleteChatMessage({ messageId, session });
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== messageId));
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : 'Message could not be deleted.');
    }
  }

  return (
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={styles.screen}>
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <HeaderGradient />
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          style={styles.backButton}
          onPress={closeChat}>
          <ChevronLeft size={theme.icon.md} color={theme.colors.white} />
        </Pressable>

        <SupportAvatar />

        <View style={styles.headerTextGroup}>
          <Text style={styles.title} numberOfLines={1}>
            {"Esting's Chat Support"}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, getSupportStatusDotStyle(supportStatus)]} />
            <Text style={[styles.statusText, !isActive && styles.statusTextInactive]}>
              {supportStatus}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Open chat options"
          hitSlop={10}
          style={styles.moreButton}
          onPress={() => setActiveFloatingMenu('chat-options')}>
          <MoreVertical size={theme.icon.md} color={theme.colors.white} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToLatest}>
        <Text style={styles.dateLabel}>Today</Text>

        <View style={styles.safetyTip}>
          <Info size={theme.icon.sm} color="#B7791F" />
          <Text style={styles.safetyTipText}>
            {"Esting's will never ask for passwords, OTPs, or payment details in chat."}
          </Text>
        </View>

        {messages.map((message, index) => {
          const groupPosition = getMessageGroupPosition(messages, index);
          const isConnectedToNextMessage =
            index < messages.length - 1 && messages[index + 1].sender === message.sender;

          return (
            <View
              key={message.id}
              style={[
                styles.messageBlock,
                isConnectedToNextMessage && styles.connectedMessageBlock,
              ]}>
              <ChatBubble
                groupPosition={groupPosition}
                isLatestCustomerMessage={message.id === latestCustomerMessageId}
                isDetailsVisible={visibleDetailsMessageId === message.id}
                message={message}
                onImagePress={openImagePreview}
                onPress={() =>
                  setVisibleDetailsMessageId((currentId) => (currentId === message.id ? null : message.id))
                }
                onLongPress={() => setDeleteTargetMessage(message)}
              />
            </View>
          );
        })}
        <SuggestedQuestionsCard
          onBack={selectedFaqCategory ? handleBackToFaqTopics : undefined}
          onQuestionPress={handleSuggestedQuestion}
          questions={suggestedQuestions}
          title={selectedFaqCategory ? selectedFaqCategory.category : 'Choose an inquiry'}
        />
      </ScrollView>

      {activeFloatingMenu && isSignedIn ? (
        <FloatingMenu
          bottom={floatingMenuBottom}
          top={chatOptionsTop}
          menuType={activeFloatingMenu}
          onAttachmentPress={handleAttachmentOption}
          onClose={() => setActiveFloatingMenu(null)}
          onNeedHelp={handleNeedHelp}
          onReportChat={handleReportChat}
        />
      ) : null}

      {isSignedIn ? (
        <View
          style={[
            styles.composerShell,
            {
              paddingBottom: composerBottomPadding,
            },
          ]}
          onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}>
        {pendingAttachments.length ? (
          <ScrollView
            horizontal
            contentContainerStyle={styles.previewList}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}>
            {pendingAttachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removePendingAttachment(attachment.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.composer}>
          <Animated.View
            pointerEvents={hasTypedMessage ? 'none' : 'auto'}
            style={[
              styles.composerActionsGroup,
              {
                opacity: composerModeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    scale: composerModeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.92],
                    }),
                  },
                ],
                width: composerModeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [92, 0],
                }),
              },
            ]}>
            <Pressable
              accessibilityLabel="Open attachment options"
              style={({ pressed }) => [styles.composerAction, pressed && styles.buttonPressed]}
              onPress={() => setActiveFloatingMenu('attachments')}>
              <Paperclip size={theme.icon.md} color={theme.colors.primary} />
            </Pressable>

            <Pressable
              accessibilityLabel="Select ordered product"
              style={({ pressed }) => [styles.composerAction, pressed && styles.buttonPressed]}
              onPress={() => {
                setActiveFloatingMenu(null);
                setEmptySheetType('cart');
              }}>
              <ShoppingCart size={theme.icon.md} color={theme.colors.primary} />
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={hasTypedMessage ? 'auto' : 'none'}
            style={[
              styles.collapseButtonSlot,
              {
                opacity: composerModeAnim,
                transform: [
                  {
                    scale: composerModeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.86, 1],
                    }),
                  },
                ],
                width: composerModeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 42],
                }),
              },
            ]}>
            <Pressable
              accessibilityLabel="Collapse message input"
              style={({ pressed }) => [styles.composerAction, pressed && styles.buttonPressed]}
              onPress={() => {
                setInput('');
                Keyboard.dismiss();
              }}>
              <ChevronLeft size={theme.icon.md} color={theme.colors.primary} />
            </Pressable>
          </Animated.View>

          <View style={styles.inputWrap}>
            <TextInput
              multiline
              placeholder={"Message Esting's..."}
              placeholderTextColor={theme.colors.textMuted}
              scrollEnabled={canScrollInput}
              style={[styles.input, { height: Math.min(Math.max(36, inputHeight), inputMaxHeight) }]}
              value={input}
              maxLength={maxMessageLength}
              onContentSizeChange={(event) => {
                const nextHeight = Math.min(
                  inputMaxHeight,
                  Math.max(36, event.nativeEvent.contentSize.height)
                );
                setInputHeight(nextHeight);
              }}
              onChangeText={handleInputChange}
              onFocus={() => {
                setActiveFloatingMenu(null);
                scrollToLatest();
              }}
            />
          </View>

          <Animated.View
            pointerEvents={hasComposerContent ? 'auto' : 'none'}
            style={[
              styles.sendButtonSlot,
              {
                opacity: sendButtonAnim,
                transform: [
                  {
                    scale: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.72, 1],
                    }),
                  },
                ],
                width: sendButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 42],
                }),
              },
            ]}>
            <Pressable
              accessibilityLabel="Send message"
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                pressed && canSend && styles.buttonPressed,
                !canSend && styles.sendButtonDisabled,
              ]}
              onPress={() => void sendMessage(input)}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: sendIconSpinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-90deg', '0deg'],
                      }),
                    },
                  ],
                }}>
                <Send size={theme.icon.sm} color={theme.colors.white} />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>

        {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}
        <Text style={styles.termsNote}>
          By using chat, you agree to our{' '}
          <Text style={styles.termsLink} onPress={() => router.push('/terms-and-condition')}>
            Terms
          </Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={() => router.push('/terms-and-condition')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
      ) : null}

      <OptionsSheet
        title={emptySheet?.title ?? ''}
        visible={Boolean(emptySheet)}
        onClose={() => setEmptySheetType(null)}>
        {emptySheet ? <EmptyInquiryState message={emptySheet.message} onShopNow={handleShopNow} /> : null}
      </OptionsSheet>

      <OptionsSheet
        title="Message options"
        visible={Boolean(deleteTargetMessage)}
        onClose={() => setDeleteTargetMessage(null)}>
        <View style={styles.messageOptions}>
          <Pressable style={styles.messageOptionButton} onPress={() => void handleCopyMessage()}>
            <Copy size={theme.icon.sm} color={theme.colors.textMuted} />
            <Text style={styles.messageOptionText}>Copy</Text>
          </Pressable>
          <Pressable style={styles.messageOptionButton} onPress={handleReplyToMessage}>
            <Reply size={theme.icon.sm} color={theme.colors.textMuted} />
            <Text style={styles.messageOptionText}>Reply</Text>
          </Pressable>
          <Pressable style={styles.messageOptionButton} onPress={handleDeleteForMe}>
            <Trash2 size={theme.icon.sm} color={theme.colors.textMuted} />
            <Text style={styles.messageOptionText}>Delete for you</Text>
          </Pressable>
          {deleteTargetMessage?.sender === 'customer' ? (
            <Pressable style={styles.messageOptionButton} onPress={() => void handleDeleteForEveryone()}>
              <Trash2 size={theme.icon.sm} color={theme.colors.danger} />
              <Text style={[styles.messageOptionText, styles.messageOptionDangerText]}>Delete for everyone</Text>
            </Pressable>
          ) : null}
        </View>
      </OptionsSheet>

      <Modal animationType="fade" transparent visible={Boolean(previewImageUri)} onRequestClose={closeImagePreview}>
        <View style={styles.imagePreviewOverlay}>
          <View style={styles.imagePreviewTopBar}>
            <Pressable accessibilityLabel="Close image preview" style={styles.imagePreviewButton} onPress={closeImagePreview}>
              <X size={theme.icon.md} color={theme.colors.white} />
            </Pressable>
            <View style={styles.imagePreviewZoomControls}>
              <Pressable
                accessibilityLabel="Zoom out"
                style={styles.imagePreviewButton}
                onPress={() => setPreviewScale((current) => Math.max(1, Number((current - 0.25).toFixed(2))))}>
                <Text style={styles.imagePreviewButtonText}>-</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Zoom in"
                style={styles.imagePreviewButton}
                onPress={() => setPreviewScale((current) => Math.min(3, Number((current + 0.25).toFixed(2))))}>
                <Text style={styles.imagePreviewButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            centerContent
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={styles.imagePreviewScroll}
            contentContainerStyle={styles.imagePreviewContent}>
            {previewImageUri ? (
              <Image
                resizeMode="contain"
                source={{ uri: previewImageUri }}
                style={[styles.imagePreviewImage, { transform: [{ scale: previewScale }] }]}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isAuthReady && !isSignedIn}
        onRequestClose={closeChat}>
        <View style={styles.agreementOverlay}>
          <View style={styles.agreementCard}>
            <View style={styles.agreementIcon}>
              <ShieldCheck size={28} color={theme.colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.agreementTitle}>Sign in required</Text>
            <Text style={styles.agreementText}>
              {"You need to sign in to use Esting's live chat, send messages, and view your chat history."}
            </Text>
            <View style={styles.agreementActions}>
              <Pressable style={({ pressed }) => [styles.agreementSecondaryButton, pressed && styles.buttonPressed]} onPress={closeChat}>
                <Text style={styles.agreementSecondaryText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.agreementPrimaryButton, pressed && styles.buttonPressed]}
                onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.agreementPrimaryText}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isSignedIn && isChatAgreementVisible}
        onRequestClose={closeChat}>
        <View style={styles.agreementOverlay}>
          <View style={styles.agreementCard}>
            <View style={styles.agreementIcon}>
              <ShieldCheck size={28} color={theme.colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.agreementTitle}>Use chat responsibly</Text>
            <Text style={styles.agreementText}>
              Our team can help with orders, products, delivery, and account questions. Do not share passwords, OTPs,
              full card details, or abusive messages in chat.
            </Text>
            <Text style={styles.agreementFinePrint}>
              {"By continuing, you agree to use Esting's chat for support-related concerns only."}
            </Text>
            <View style={styles.agreementActions}>
              <Pressable style={({ pressed }) => [styles.agreementSecondaryButton, pressed && styles.buttonPressed]} onPress={closeChat}>
                <Text style={styles.agreementSecondaryText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.agreementPrimaryButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  hasAcceptedChatAgreementThisSession = true;
                  setIsChatAgreementVisible(false);
                }}>
                <Text style={styles.agreementPrimaryText}>I agree</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

function SupportAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.supportAvatar, compact && styles.supportAvatarCompact]}>
      <ExpoImage source={supportAvatarImage} style={styles.supportAvatarImage} contentFit="cover" />
    </View>
  );
}

function getLatestCustomerMessageId(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.sender === 'customer')?.id ?? null;
}

function getMessageGroupPosition(messages: ChatMessage[], index: number): MessageGroupPosition {
  const message = messages[index];
  const previousMessage = messages[index - 1];
  const nextMessage = messages[index + 1];
  const isPreviousSameSender = previousMessage?.sender === message.sender;
  const isNextSameSender = nextMessage?.sender === message.sender;

  if (!isPreviousSameSender && !isNextSameSender) {
    return 'single';
  }

  if (!isPreviousSameSender && isNextSameSender) {
    return 'first';
  }

  if (isPreviousSameSender && isNextSameSender) {
    return 'middle';
  }

  return 'last';
}

function getGroupedBubbleStyle(sender: MessageSender, groupPosition: MessageGroupPosition) {
  if (sender === 'customer') {
    if (groupPosition === 'first') {
      return styles.customerBubbleFirst;
    }

    if (groupPosition === 'middle') {
      return styles.customerBubbleMiddle;
    }

    if (groupPosition === 'last') {
      return styles.customerBubbleLast;
    }

    return null;
  }

  if (groupPosition === 'first') {
    return styles.supportBubbleFirst;
  }

  if (groupPosition === 'middle') {
    return styles.supportBubbleMiddle;
  }

  if (groupPosition === 'last') {
    return styles.supportBubbleLast;
  }

  return null;
}

function FloatingMenu({
  bottom,
  menuType,
  onAttachmentPress,
  onClose,
  onNeedHelp,
  onReportChat,
  top,
}: {
  bottom: number;
  menuType: FloatingMenuType;
  onAttachmentPress: (option: AttachmentOption) => void | Promise<void>;
  onClose: () => void;
  onNeedHelp: () => void;
  onReportChat: () => void;
  top: number;
}) {
  const isAttachmentMenu = menuType === 'attachments';

  return (
    <Pressable style={styles.floatingMenuOverlay} onPress={onClose}>
      <Pressable
        style={[
          styles.floatingMenuCard,
          isAttachmentMenu ? { bottom } : { top },
          isAttachmentMenu ? styles.floatingMenuLeft : styles.floatingMenuRight,
        ]}
        onPress={(event) => event.stopPropagation()}>
        {isAttachmentMenu
          ? attachmentOptions.map((option) => {
              const Icon = option.icon;

              return (
                <Pressable
                  key={option.id}
                  style={styles.floatingMenuOption}
                  onPress={() => void onAttachmentPress(option)}>
                  <View style={styles.floatingMenuIcon}>
                    <Icon size={theme.icon.sm} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.floatingMenuText}>{option.label}</Text>
                </Pressable>
              );
            })
          : (
              <>
                <Pressable style={styles.floatingMenuOption} onPress={onNeedHelp}>
                  <View style={styles.floatingMenuIcon}>
                    <CircleHelp size={theme.icon.sm} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.floatingMenuText}>Need help</Text>
                </Pressable>
                <Pressable style={styles.floatingMenuOption} onPress={onReportChat}>
                  <View style={styles.floatingMenuIcon}>
                    <Flag size={theme.icon.sm} color={theme.colors.danger} />
                  </View>
                  <Text style={styles.floatingMenuText}>Report this chat</Text>
                </Pressable>
              </>
            )}
      </Pressable>
    </Pressable>
  );
}

function SuggestedQuestionsCard({
  onBack,
  onQuestionPress,
  questions,
  title,
}: {
  onBack?: () => void;
  onQuestionPress: (question: SuggestedQuestion) => void;
  questions: SuggestedQuestion[];
  title: string;
}) {
  return (
    <View style={styles.suggestedUnit}>
      <View style={styles.supportAvatarSpacer} />
      <View style={styles.suggestedCard}>
        <Text style={styles.suggestedTitle}>{title}</Text>
        <View style={styles.suggestedDivider} />
        {questions.map((question, index) => (
          <View key={question.id}>
            {index > 0 ? <View style={styles.suggestedDivider} /> : null}
            <Pressable style={styles.suggestedQuestion} onPress={() => onQuestionPress(question)}>
              <Text style={styles.suggestedQuestionText}>{question.label}</Text>
            </Pressable>
          </View>
        ))}
        {onBack ? (
          <>
            <View style={styles.suggestedDivider} />
            <Pressable style={styles.changeQuestionsButton} onPress={onBack}>
              <ChevronLeft size={theme.icon.sm} color={theme.colors.textMuted} />
              <Text style={styles.changeQuestionsText}>All inquiries</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

function HeaderGradient() {
  return (
    <View pointerEvents="none" style={styles.headerGradient}>
      <Svg
        height="100%"
        pointerEvents="none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        width="100%">
        <Defs>
          <LinearGradient id="chatHeaderGradient" x1="0" x2="100" y1="0" y2="100">
            <Stop offset="0" stopColor="#126F3A" />
            <Stop offset="0.58" stopColor="#1C7E3F" />
            <Stop offset="1" stopColor="#3B9B4A" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#chatHeaderGradient)" height="100" width="100" />
      </Svg>
    </View>
  );
}

function mergeBackendMessages(currentMessages: ChatMessage[], history: BackendChatMessage[]) {
  if (history.length === 0) {
    return initialMessages;
  }

  const existingIds = new Set(currentMessages.map((message) => message.id));
  const mergedMessages =
    currentMessages[0]?.id === initialMessages[0].id
      ? [...currentMessages]
      : [initialMessages[0], ...currentMessages];

  for (const backendMessage of history) {
    if (!existingIds.has(backendMessage.id)) {
      mergedMessages.push(mapBackendChatMessage(backendMessage));
      existingIds.add(backendMessage.id);
    }
  }

  return mergedMessages;
}

function mapBackendChatMessage(message: BackendChatMessage): ChatMessage {
  const imageUrl = message.image_url?.trim();

  return {
    attachments: imageUrl
      ? [
          {
            id: `${message.id}-image`,
            kind: 'image',
            name: 'Chat image',
            uri: imageUrl,
          },
        ]
      : undefined,
    id: message.id,
    createdAt: message.created_at,
    sender: message.sender === 'customer' ? 'customer' : 'support',
    text: message.message,
  };
}

function getMessageActionText(message: ChatMessage) {
  return message.text.trim() || (message.attachments?.some((attachment) => attachment.kind === 'image') ? 'Image' : '');
}

function getChatNotificationBody(message: ChatMessage) {
  const text = message.text.trim();

  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  if (message.attachments?.some((attachment) => attachment.kind === 'image')) {
    return 'Sent an image.';
  }

  return 'Sent a new message.';
}

function formatMessageTime(createdAt?: string) {
  if (!createdAt) {
    return '';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getSupportStatusDotStyle(status: SupportStatus) {
  if (status === 'Active') {
    return styles.statusDotActive;
  }

  if (status === 'Connecting') {
    return styles.statusDotConnecting;
  }

  return styles.statusDotInactive;
}

function ChatBubble({
  groupPosition,
  isLatestCustomerMessage,
  isDetailsVisible,
  message,
  onImagePress,
  onPress,
  onLongPress,
}: {
  groupPosition: MessageGroupPosition;
  isLatestCustomerMessage: boolean;
  isDetailsVisible: boolean;
  message: ChatMessage;
  onImagePress: (uri: string) => void;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const isCustomer = message.sender === 'customer';
  const isImageOnlyMessage =
    !message.text &&
    message.attachments?.length === 1 &&
    message.attachments[0].kind === 'image';
  const shouldShowSupportAvatar =
    !isCustomer && (groupPosition === 'single' || groupPosition === 'last');

  return (
    <View style={[styles.messageUnit, isCustomer && styles.messageUnitCustomer]}>
      {isDetailsVisible ? (
        <Text style={styles.messageTime}>{formatMessageTime(message.createdAt)}</Text>
      ) : null}
      <View style={[styles.bubbleRow, isCustomer && styles.bubbleRowCustomer]}>
        {!isCustomer ? (
          shouldShowSupportAvatar ? (
            <SupportAvatar compact />
          ) : (
            <View style={styles.supportAvatarSpacer} />
          )
        ) : null}
        <Pressable
          disabled={!onLongPress}
          onPress={onPress}
          onLongPress={onLongPress}
          style={[
            styles.bubble,
            isCustomer ? styles.customerBubble : styles.supportBubble,
            isImageOnlyMessage && isCustomer && styles.customerImageOnlyBubble,
            isImageOnlyMessage && styles.imageOnlyBubble,
            getGroupedBubbleStyle(message.sender, groupPosition),
          ]}>
          {message.attachments?.length ? (
            <MessageAttachmentList attachments={message.attachments} isCustomer={isCustomer} onImagePress={onImagePress} />
          ) : null}
          {message.text ? (
            <Text style={[styles.bubbleText, isCustomer && styles.customerBubbleText]}>
              {message.text}
            </Text>
          ) : null}
        </Pressable>
      </View>
      {isDetailsVisible && isCustomer ? (
        <Text style={styles.messageStatus}>{isLatestCustomerMessage ? mockLatestCustomerStatus : 'Sent'}</Text>
      ) : null}
    </View>
  );
}

function MessageAttachmentList({
  attachments,
  isCustomer,
  onImagePress,
}: {
  attachments: ChatAttachment[];
  isCustomer: boolean;
  onImagePress: (uri: string) => void;
}) {
  return (
    <View style={styles.messageAttachmentList}>
      {attachments.map((attachment) => (
        <View
          key={attachment.id}
          style={[
            styles.messageAttachment,
            isCustomer && styles.customerMessageAttachment,
            attachment.kind === 'image' && styles.messageImageAttachment,
            attachment.kind === 'image' && styles.imageOnlyMessageAttachment,
          ]}>
          {attachment.kind === 'image' ? (
            attachment.uri ? (
              <Pressable accessibilityRole="button" onPress={() => attachment.uri && onImagePress(attachment.uri)}>
                <Image source={{ uri: attachment.uri }} style={styles.messageImage} />
              </Pressable>
            ) : (
              <ImageIcon
                size={theme.icon.md}
                color={isCustomer ? theme.colors.white : theme.colors.primary}
              />
            )
          ) : (
            <FileText
              size={theme.icon.sm}
              color={isCustomer ? theme.colors.white : theme.colors.primary}
            />
          )}
          {attachment.kind !== 'image' ? (
            <Text
              numberOfLines={1}
              style={[styles.messageAttachmentText, isCustomer && styles.customerBubbleText]}>
              {attachment.name}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove: () => void;
}) {
  const isImage = attachment.kind === 'image';

  return (
    <View style={[styles.previewCard, !isImage && styles.filePreviewCard]}>
      {isImage ? (
        attachment.uri ? (
          <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewImagePlaceholder}>
            <ImageIcon size={theme.icon.md} color={theme.colors.primary} />
          </View>
        )
      ) : (
        <View style={styles.filePreviewIcon}>
          <FileText size={theme.icon.sm} color={theme.colors.primary} />
        </View>
      )}
      {!isImage ? (
        <Text numberOfLines={1} style={styles.previewName}>
          {attachment.name}
        </Text>
      ) : null}
      <Pressable accessibilityLabel="Remove attachment" style={styles.previewRemoveButton} onPress={onRemove}>
        <X size={13} color={theme.colors.white} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

function EmptyInquiryState({
  message,
  onShopNow,
}: {
  message: string;
  onShopNow: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <ShoppingCart size={theme.icon.lg} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable style={styles.shopNowButton} onPress={onShopNow}>
        <Text style={styles.shopNowText}>Shop Now</Text>
      </Pressable>
    </View>
  );
}

function OptionsSheet({
  children,
  onClose,
  title,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable accessibilityLabel="Close" style={styles.closeButton} onPress={onClose}>
              <X size={theme.icon.sm} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.sheetBody}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7F9F7',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#1B7B3E',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    overflow: 'hidden',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  headerGradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
    zIndex: 1,
  },
  moreButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
    zIndex: 1,
  },
  supportAvatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
    zIndex: 1,
  },
  supportAvatarCompact: {
    height: 30,
    marginTop: 2,
    width: 30,
  },
  supportAvatarImage: {
    height: '100%',
    width: '100%',
  },
  supportAvatarSpacer: {
    height: 30,
    width: 30,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  statusDot: {
    borderRadius: theme.radius.pill,
    height: 8,
    width: 8,
  },
  statusDotActive: {
    backgroundColor: theme.colors.success,
  },
  statusDotConnecting: {
    backgroundColor: '#D69E2E',
  },
  statusDotInactive: {
    backgroundColor: theme.colors.textMuted,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextInactive: {
    color: 'rgba(255, 255, 255, 0.76)',
  },
  messages: {
    backgroundColor: '#F7F9F7',
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  dateLabel: {
    alignSelf: 'center',
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  safetyTip: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(242, 185, 80, 0.1)',
    borderColor: 'rgba(183, 121, 31, 0.14)',
    borderRadius: theme.radius.md,
    borderWidth: chatOutlineWidth,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    marginHorizontal: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  safetyTipLead: {
    color: 'rgba(107, 78, 0, 0.76)',
    fontWeight: '600',
  },
  safetyTipText: {
    color: 'rgba(107, 78, 0, 0.68)',
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
  },
  messageBlock: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  connectedMessageBlock: {
    marginBottom: 3,
  },
  messageUnit: {
    alignItems: 'flex-start',
  },
  messageUnitCustomer: {
    alignItems: 'flex-end',
  },
  messageTime: {
    alignSelf: 'center',
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  bubbleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-start',
  },
  bubbleRowCustomer: {
    justifyContent: 'flex-end',
  },
  bubble: {
    borderRadius: theme.radius.lg,
    maxWidth: '82%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  imageOnlyBubble: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  customerImageOnlyBubble: {
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  supportBubble: {
    backgroundColor: theme.colors.surface,
    borderColor: chatOutlineColor,
    borderWidth: chatOutlineWidth,
  },
  customerBubble: {
    backgroundColor: theme.colors.primary,
  },
  customerBubbleText: {
    color: theme.colors.white,
    fontWeight: '500',
  },
  supportBubbleFirst: {
    borderBottomLeftRadius: 7,
  },
  supportBubbleMiddle: {
    borderBottomLeftRadius: 7,
    borderTopLeftRadius: 7,
  },
  supportBubbleLast: {
    borderTopLeftRadius: 7,
  },
  customerBubbleFirst: {
    borderBottomRightRadius: 7,
  },
  customerBubbleMiddle: {
    borderBottomRightRadius: 7,
    borderTopRightRadius: 7,
  },
  customerBubbleLast: {
    borderTopRightRadius: 7,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  messageStatus: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
    marginRight: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  messageAttachmentList: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  messageAttachment: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.md,
    borderWidth: chatOutlineWidth,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 36,
    paddingHorizontal: theme.spacing.sm,
  },
  customerMessageAttachment: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  messageImageAttachment: {
    minHeight: 0,
  },
  imageOnlyMessageAttachment: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  messageImage: {
    borderRadius: 18,
    height: 176,
    width: 176,
  },
  messageAttachmentText: {
    color: theme.colors.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  suggestedUnit: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: -theme.spacing.xs,
  },
  suggestedCard: {
    backgroundColor: theme.colors.surface,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.lg,
    borderTopLeftRadius: 7,
    borderWidth: chatOutlineWidth,
    flex: 1,
    maxWidth: '82%',
    overflow: 'hidden',
  },
  suggestedTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  suggestedDivider: {
    backgroundColor: chatDividerColor,
    height: 1,
    marginHorizontal: theme.spacing.lg,
  },
  suggestedQuestion: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  suggestedQuestionText: {
    color: '#2F80D9',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  },
  changeQuestionsButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  changeQuestionsText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  composerShell: {
    backgroundColor: theme.colors.surface,
    borderTopColor: chatOutlineColor,
    borderTopWidth: chatOutlineWidth,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  previewList: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  previewCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.md,
    borderWidth: chatOutlineWidth,
    height: 76,
    overflow: 'hidden',
    width: 76,
  },
  filePreviewCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 44,
    paddingHorizontal: theme.spacing.sm,
    width: 168,
  },
  messageOptions: {
    gap: theme.spacing.sm,
  },
  messageOptionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  messageOptionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '400',
  },
  messageOptionDangerText: {
    color: theme.colors.danger,
  },
  imagePreviewOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    flex: 1,
  },
  imagePreviewTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.lg,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 2,
  },
  imagePreviewZoomControls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  imagePreviewButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  imagePreviewButtonText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  imagePreviewScroll: {
    flex: 1,
  },
  imagePreviewContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  imagePreviewImage: {
    height: '82%',
    width: '100%',
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  previewImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    flex: 1,
    justifyContent: 'center',
  },
  filePreviewIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  previewName: {
    bottom: 0,
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: '600',
    left: 0,
    padding: 5,
    position: 'absolute',
    right: 0,
  },
  previewRemoveButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.82)',
    borderRadius: theme.radius.pill,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 22,
  },
  composer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  composerActionsGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    overflow: 'hidden',
  },
  composerAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  collapseButtonSlot: {
    height: 42,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.96 }],
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: chatOutlineColor,
    borderRadius: 22,
    borderWidth: chatOutlineWidth,
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: inputLineHeight,
    maxHeight: inputMaxHeight,
    minHeight: 24,
    paddingBottom: 8,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonDisabled: {
    opacity: 0.46,
  },
  sendButtonSlot: {
    height: 42,
    overflow: 'hidden',
  },
  validationText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: theme.spacing.xs,
  },
  termsNote: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
  termsLink: {
    color: theme.colors.textMuted,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  floatingMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  floatingMenuCard: {
    backgroundColor: theme.colors.surface,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: chatOutlineWidth,
    gap: theme.spacing.xs,
    minWidth: 190,
    padding: theme.spacing.sm,
    position: 'absolute',
    boxShadow: '0 2px 10px rgba(31, 42, 36, 0.08)',
  },
  floatingMenuLeft: {
    left: theme.spacing.sm,
  },
  floatingMenuRight: {
    right: theme.spacing.sm,
  },
  floatingMenuOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 42,
    paddingHorizontal: theme.spacing.sm,
  },
  floatingMenuIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  floatingMenuText: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  sheetOverlay: {
    backgroundColor: 'rgba(31, 42, 36, 0.08)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: theme.colors.surface,
    borderColor: chatOutlineColor,
    borderWidth: chatOutlineWidth,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.lg,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sheetBody: {
    gap: theme.spacing.sm,
  },
  sheetOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 54,
  },
  sheetIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  agreementOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.34)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  agreementCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: chatOutlineColor,
    borderRadius: 22,
    borderWidth: chatOutlineWidth,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    width: '100%',
  },
  agreementIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  agreementTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  agreementText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },
  agreementFinePrint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  agreementActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  agreementSecondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.md,
    borderWidth: chatOutlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  agreementPrimaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  agreementSecondaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  agreementPrimaryText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  sheetOptionText: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: chatOutlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: chatOutlineWidth,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  shopNowButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
  },
  shopNowText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

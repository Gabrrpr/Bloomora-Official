import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type PushRegistrationResult =
  | {
      status: 'granted';
      token: string;
    }
  | {
      status: 'denied' | 'unavailable';
      token: null;
      reason: string;
    };

let hasScheduledAppOpenCreateReminder = false;
let notificationsModulePromise: Promise<typeof import('expo-notifications')> | null = null;
let hasConfiguredNotificationHandler = false;

function isAndroidExpoGo() {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

function getUnavailableReason() {
  if (Platform.OS === 'web') {
    return 'Push notifications are only available on iOS and Android.';
  }

  if (isAndroidExpoGo()) {
    return 'Android push notifications are not available in Expo Go. Use a development build to test notifications.';
  }

  return null;
}

async function getNotificationsModule() {
  const unavailableReason = getUnavailableReason();

  if (unavailableReason) {
    return null;
  }

  notificationsModulePromise ??= import('expo-notifications').then((Notifications) => {
    if (!hasConfiguredNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      hasConfiguredNotificationHandler = true;
    }

    return Notifications;
  });

  return notificationsModulePromise;
}

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to get Expo push token.';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export async function configureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2E8B34',
  });
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  try {
    const unavailableReason = getUnavailableReason();

    if (unavailableReason) {
      return {
        status: 'unavailable',
        token: null,
        reason: unavailableReason,
      };
    }

    const Notifications = await getNotificationsModule();

    if (!Notifications) {
      return {
        status: 'unavailable',
        token: null,
        reason: 'Notifications are not available in this runtime.',
      };
    }

    await configureAndroidNotificationChannel();

    const projectId = getProjectId();
    if (!projectId) {
      return {
        status: 'unavailable',
        token: null,
        reason: 'Missing EAS project ID in app config.',
      };
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (existingPermission.status !== 'granted') {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== 'granted') {
      return {
        status: 'denied',
        token: null,
        reason: 'Notification permission was not granted.',
      };
    }

    const token = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      15000,
      'Getting the Expo push token timed out. Check internet connection and EAS notification credentials.',
    );

    return {
      status: 'granted',
      token: token.data,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      token: null,
      reason: getErrorMessage(error),
    };
  }
}

export async function showLocalChatNotification({
  body,
  conversationId,
  messageId,
  title = "Esting's Support",
}: {
  body: string;
  conversationId?: string;
  messageId?: string;
  title?: string;
}) {
  if (getUnavailableReason()) {
    return false;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  await configureAndroidNotificationChannel();

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      body,
      data: {
        conversationId,
        messageId,
        route: '/live-chat',
      },
      sound: true,
      title,
    },
    trigger: null,
  });

  return true;
}

export async function scheduleAppOpenCreateReminder() {
  if (hasScheduledAppOpenCreateReminder || getUnavailableReason()) {
    return false;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  await configureAndroidNotificationChannel();

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  hasScheduledAppOpenCreateReminder = true;

  await Notifications.scheduleNotificationAsync({
    content: {
      body: 'Describe your dream arrangement or build one with Mix & Match.',
      data: {
        route: '/(tabs)/generate',
      },
      sound: true,
      title: 'Make it personal',
    },
    trigger: {
      seconds: 60,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });

  return true;
}

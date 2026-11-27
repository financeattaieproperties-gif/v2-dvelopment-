import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestLeadNotification,
  syncAndNotifyAssignedLeads,
  type NotificationPermissionState,
} from '../pwa/leadNotificationService';

export interface UseLeadNotificationsResult {
  isSupported: boolean;
  permission: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermissionState>;
  sendTestNotification: () => Promise<boolean>;
  isTesting: boolean;
  testNotice: string;
}

export function useLeadNotifications(
  userId?: number | string | null,
  leads?: any[] | null,
  isSalesRole: boolean = true
): UseLeadNotificationsResult {
  const [isSupported] = useState<boolean>(() => isNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [isTesting, setIsTesting] = useState(false);
  const [testNotice, setTestNotice] = useState('');
  const lastUserIdRef = useRef<number | string | null>(null);

  // Sync permission changes when tab regains focus or visibility
  useEffect(() => {
    if (!isSupported) return;
    const update = () => {
      setPermission(getNotificationPermission());
    };
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [isSupported]);

  // Request permission prompt
  const requestPermission = useCallback(async () => {
    const next = await requestNotificationPermission();
    setPermission(next);
    return next;
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    setIsTesting(true);
    setTestNotice('');
    try {
      const ok = await sendTestLeadNotification();
      setPermission(getNotificationPermission());
      if (ok) {
        setTestNotice('Test notification sent to your device!');
        setTimeout(() => setTestNotice(''), 4000);
      } else {
        setTestNotice('Notifications are disabled or blocked in your browser.');
        setTimeout(() => setTestNotice(''), 4000);
      }
      return ok;
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Monitor leads array and notify on newly assigned leads
  useEffect(() => {
    if (!userId || !leads || permission !== 'granted') return;
    lastUserIdRef.current = userId;
    syncAndNotifyAssignedLeads(userId, leads, isSalesRole);
  }, [userId, leads, permission, isSalesRole]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendTestNotification,
    isTesting,
    testNotice,
  };
}

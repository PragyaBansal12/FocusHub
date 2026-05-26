import { useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const setupPushNotifications = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications are not supported in this browser.');
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied.');
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (!publicVapidKey) {
             console.error("VITE_VAPID_PUBLIC_KEY is not defined in frontend .env");
             return;
          }
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        // Send subscription to backend
        await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/notifications/subscribe`, {
          subscription
        });
        
        console.log('Successfully subscribed to push notifications.');

      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [user]);
}

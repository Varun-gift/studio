
'use server';

import { adminMessaging } from '@/lib/firebase-admin';
import type { Message } from 'firebase-admin/messaging';

interface NotificationPayload {
    token: string;
    title: string;
    body: string;
    data?: { [key: string]: string };
}

export async function sendFCMNotification({ token, title, body, data }: NotificationPayload): Promise<void> {
  if (!token) {
    console.error('Attempted to send notification without a token.');
    return;
  }

  const message: Message = {
    token: token,
    notification: {
      title,
      body,
    },
    data,
  };

  try {
    await adminMessaging.send(message);
    console.log('Successfully sent message to token:', token);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

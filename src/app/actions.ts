
'use server';

import { suggestGeneratorSize as suggestGeneratorSizeFlow, GeneratorSizingInput, GeneratorSizingOutput } from '@/ai/flows/generator-sizing';
import { sendFCMNotification as sendFCMNotificationService } from '@/services/notification-service';

export async function suggestGeneratorSize(input: GeneratorSizingInput): Promise<GeneratorSizingOutput> {
  try {
    const result = await suggestGeneratorSizeFlow(input);
    return result;
  } catch (error) {
    console.error('Error in suggestGeneratorSize action:', error);
    throw new Error('Failed to get generator suggestion. Please try again.');
  }
}

export async function sendFCMNotification(token: string, title: string, body: string) {
  try {
    await sendFCMNotificationService({ token, title, body });
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    // Don't throw here, as it might break client-side flows.
    // The error is logged for debugging.
  }
}


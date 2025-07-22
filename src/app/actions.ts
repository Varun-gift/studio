
'use server';

import { suggestGeneratorSize as suggestGeneratorSizeFlow, GeneratorSizingInput, GeneratorSizingOutput } from '@/ai/flows/generator-sizing';
import { auth, sendPasswordResetEmail } from '@/lib/firebase';

export async function suggestGeneratorSize(input: GeneratorSizingInput): Promise<GeneratorSizingOutput> {
  try {
    const result = await suggestGeneratorSizeFlow(input);
    return result;
  } catch (error) {
    console.error('Error in suggestGeneratorSize action:', error);
    throw new Error('Failed to get generator suggestion. Please try again.');
  }
}


export async function sendPasswordResetLink(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    // To avoid user enumeration, we don't reveal if the email exists or not.
    // The client-side will show a generic success message.
    // For debugging, we can check the error code.
    if (error.code === 'auth/user-not-found') {
      // Still resolve successfully to not leak information.
      return;
    }
    // For other errors, we might want to throw them.
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

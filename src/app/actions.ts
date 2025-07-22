
'use server';

import { suggestGeneratorSize as suggestGeneratorSizeFlow, GeneratorSizingInput, GeneratorSizingOutput } from '@/ai/flows/generator-sizing';

export async function suggestGeneratorSize(input: GeneratorSizingInput): Promise<GeneratorSizingOutput> {
  try {
    const result = await suggestGeneratorSizeFlow(input);
    return result;
  } catch (error) {
    console.error('Error in suggestGeneratorSize action:', error);
    throw new Error('Failed to get generator suggestion. Please try again.');
  }
}

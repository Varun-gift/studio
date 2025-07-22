'use server';

/**
 * @fileOverview An AI agent that suggests a generator size based on power requirements.
 *
 * - suggestGeneratorSize - A function that suggests a generator size based on power requirements.
 * - GeneratorSizingInput - The input type for the suggestGeneratorSize function.
 * - GeneratorSizingOutput - The return type for the suggestGeneratorSize function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratorSizingInputSchema = z.object({
  powerRequirements: z
    .string()
    .describe('The power requirements of the user in watts or kilowatts.'),
  application: z
    .string()
    .describe('The intended application or use case for the generator.'),
});
export type GeneratorSizingInput = z.infer<typeof GeneratorSizingInputSchema>;

const GeneratorSizingOutputSchema = z.object({
  suggestedSize: z
    .string()
    .describe('The suggested generator size in watts or kilowatts.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested generator size.'),
});
export type GeneratorSizingOutput = z.infer<typeof GeneratorSizingOutputSchema>;

export async function suggestGeneratorSize(
  input: GeneratorSizingInput
): Promise<GeneratorSizingOutput> {
  return generatorSizingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatorSizingPrompt',
  input: {schema: GeneratorSizingInputSchema},
  output: {schema: GeneratorSizingOutputSchema},
  prompt: `You are an expert in power generation and can suggest the appropriate generator size based on user requirements.

  Based on the following power requirements and application, suggest a generator size that meets the user's needs.

  Power Requirements: {{{powerRequirements}}}
  Application: {{{application}}}

  Consider providing a buffer (extra capacity) to accommodate potential surges or additional power needs.  Explain your reasoning for the size suggestion.
  `,
});

const generatorSizingFlow = ai.defineFlow(
  {
    name: 'generatorSizingFlow',
    inputSchema: GeneratorSizingInputSchema,
    outputSchema: GeneratorSizingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

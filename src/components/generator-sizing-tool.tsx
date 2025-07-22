'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { suggestGeneratorSize } from '@/app/actions';
import type { GeneratorSizingOutput } from '@/ai/flows/generator-sizing';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  powerRequirements: z.string().min(1, 'Please enter power requirements.'),
  application: z.string().min(1, 'Please describe the application.'),
});

type FormValues = z.infer<typeof formSchema>;

export function GeneratorSizingTool() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratorSizingOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      powerRequirements: '',
      application: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setResult(null);
    try {
      const response = await suggestGeneratorSize(values);
      setResult(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get suggestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Generator Sizing Tool</CardTitle>
          <CardDescription>
            Not sure what size you need? Describe your power needs and we'll
            suggest the right generator for the job.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="powerRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Power Requirements</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 5000W, or '2 refrigerators, 1 AC unit'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="application"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Home backup, construction site, outdoor event"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  'Get Suggestion'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-primary" />
              Our Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{result.suggestedSize}</h3>
              <p className="text-sm text-muted-foreground">Suggested Generator Size</p>
            </div>
            <div>
              <h3 className="font-semibold">Reasoning</h3>
              <p className="text-muted-foreground">{result.reasoning}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => console.log('View recommended generators')}>View Recommended Generators</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

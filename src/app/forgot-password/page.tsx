
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendPasswordResetLink } from '@/app/actions';
import { AmgLogo } from '@/components/amg-logo';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setSubmitted(false);
    try {
      await sendPasswordResetLink(values.email);
      toast({
        title: 'Check your email',
        description: 'A password reset link has been sent to your email address.',
      });
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
         <CardHeader className="text-center space-y-2">
           <div className="flex justify-center items-center gap-2">
             <AmgLogo className="h-12 w-12" />
             <h2 className="text-2xl font-bold tracking-wider text-foreground">AMG</h2>
           </div>
           <p className="text-xs tracking-[0.2em] text-muted-foreground">POWER ALWAYS</p>
           <CardTitle className="text-2xl pt-4">Forgot Password</CardTitle>
           <CardDescription>
            Enter your email to receive a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                If an account with that email exists, you will receive a password reset link shortly.
              </p>
              <Button asChild variant="link" className="mt-4">
                  <Link href="/login">
                      Back to Login
                  </Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 rounded-full text-lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

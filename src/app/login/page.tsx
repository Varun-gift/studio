
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AmgLogo } from '@/components/amg-logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/'); 
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg">
        <CardHeader className="text-center space-y-2">
           <div className="flex justify-center items-center gap-2">
             <h2 className="text-2xl font-bold tracking-wider">AMG</h2>
           </div>
           <p className="text-xs tracking-[0.2em] text-muted-foreground">POWER ALWAYS</p>
           <CardTitle className="text-2xl pt-4">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50 border-0 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="sr-only">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Password"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 border-0 h-12"
              />
               <div className="flex items-center justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-muted-foreground hover:text-primary"
                    >
                        Forgot Password?
                    </Link>
                </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full text-lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

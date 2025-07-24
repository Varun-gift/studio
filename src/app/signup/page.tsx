
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: user.email,
        role: 'user', 
        createdAt: new Date(),
      });

      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Please log in.",
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg">
        <CardHeader className="text-center space-y-2">
           <div className="flex justify-center items-center gap-2">
             <h2 className="text-2xl font-bold tracking-wider">Ashik Mobile Generators</h2>
           </div>
           <p className="text-xs tracking-[0.2em] text-muted-foreground">POWER ALWAYS</p>
           <CardTitle className="text-2xl pt-4">Join AMG Today</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="name" className="sr-only">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/20 border-white/30 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                 className="bg-white/20 border-white/30 h-12"
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
                 className="bg-white/20 border-white/30 h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-full text-lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

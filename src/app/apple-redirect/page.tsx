
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function AppleRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // Send the code to our Next.js API route bridge
      fetch('/api/auth/apple/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      .then(async (res) => {
          if (!res.ok) {
              const errorData = await res.json().catch(() => ({ details: 'An unknown error occurred.' }));
              throw new Error(errorData.details || 'Failed to bridge Apple sign-in.');
          }
          return res.json();
      })
      .then((data) => {
        if (!data.token || !data.user || !data.user.id || !data.user.email) {
            throw new Error('Invalid response received from server.');
        }

        // Store session info
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        
        toast({ title: 'Login Successful!', description: 'Welcome to ScanEats.' });

        // Redirect to dashboard
        router.push('/dashboard');
      })
      .catch((error) => {
        console.error("Apple Login Bridge Error:", error);
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message
        });
        router.push('/login');
      });
    } else {
        const error = searchParams.get('error');
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Apple Sign-In Cancelled',
                description: 'You cancelled the Apple Sign-In process.',
            });
        }
        router.push('/login');
    }
  }, [router, searchParams, toast]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-muted-foreground">Signing in with Apple...</p>
    </div>
  );
}

export default function AppleRedirectPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <AppleRedirectContent />
        </Suspense>
    )
}

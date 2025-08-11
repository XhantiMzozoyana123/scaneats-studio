
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BackgroundImage } from '@/app/shared/components/background-image';
import { API_BASE_URL } from '@/app/shared/lib/api';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!searchParams) {
      return; // Return early if searchParams is null
    }

    const reference = searchParams.get('reference');

    if (!reference) {
      setStatus('error');
      setMessage({
        title: 'Verification Error',
        description: 'Payment reference not found. Your transaction could not be verified.'
      });
      return;
    }

    const verifyPayment = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You are not logged in. Redirecting to login page.',
        });
        router.push('/login');
        return;
      }

      // According to the controller, the verification endpoint is at /api/subscription/verify
      const verificationUrl = `${API_BASE_URL}/api/subscription/verify?reference=${encodeURIComponent(reference)}`;

      try {
        const response = await fetch(verificationUrl, {
          method: 'GET', // The controller uses HttpGet for verification
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.');
        }
        
        const data = await response.json();

        if (!response.ok) {
            let errorMsg = data.message || 'Failed to verify your payment.';
            if (response.status === 404) {
                errorMsg = 'Could not find the payment to verify. Please contact support.';
            } else if (response.status >= 500) {
                errorMsg = 'Our servers are experiencing issues. Please try again later.';
            }
            throw new Error(errorMsg);
        }
        
        // The backend controller returns a PaystackVerifyResultDto
        const isSuccess = data.status && data.status.toLowerCase() === 'success';

        if (isSuccess) {
          setStatus('success');
          setMessage({
              title: "Payment Successful!",
              description: "Your account has been upgraded. Redirecting to dashboard...",
          });
          
          // CRITICAL: Update the auth token with the new one from the backend
          if (data.accessToken) {
            localStorage.setItem('authToken', data.accessToken);
          }

          setTimeout(() => {
              router.push('/dashboard');
          }, 3000);
        } else {
           setStatus('error');
           setMessage({
              title: 'Verification Failed',
              description: data.message || 'The transaction could not be verified or was not successful.',
           });
        }

      } catch (error: any) {
        setStatus('error');
        const errorMessage = error.message || 'An unexpected error occurred during verification.';
        setMessage({ title: 'Verification Failed', description: errorMessage });
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: errorMessage,
        });
         if (error.message.includes('session has expired')) {
            router.push('/login');
        }
      }
    };

    verifyPayment();
  }, [searchParams, router, toast]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h1 className="text-2xl font-semibold">Verifying Your Payment...</h1>
            <p className="text-gray-300">Please wait while we confirm your transaction.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-semibold">{message.title}</h1>
            <p className="text-gray-300">{message.description}</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <XCircle className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-semibold">{message.title}</h1>
            <p className="max-w-md text-gray-300">{message.description}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-5">
       <BackgroundImage
        src="https://placehold.co/1200x800.png"
        data-ai-hint="abstract purple"
        className="blur-md"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/15 bg-black/60 p-8 text-center shadow-2xl backdrop-blur-lg">
        {renderContent()}
      </div>
    </div>
  );
}


export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <PaymentSuccessContent />
        </Suspense>
    )
}

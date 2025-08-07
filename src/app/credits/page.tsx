
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { API_BASE_URL } from '@/app/shared/lib/api';

type CreditProduct = {
  id: number;
  credit: number;
  price: number; // Base price in ZAR
  description: string;
};

type GeoData = {
  currency: string;
  rate: number;
  flagUrl: string;
};

export default function CreditsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<CreditProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(true);

  useEffect(() => {
    // Check for auth token on mount
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to view the credits shop.',
      });
      router.push('/login');
      return; // Stop execution if not logged in
    }

    const fetchCreditProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/credit/shop`);

        if (response.ok) {
          const data = await response.json();
          const productsWithDescriptions = data.map((p: any) => {
            let description = 'Top-up your credits.';
            if (p.credit <= 50) description = 'Perfect for getting started.';
            else if (p.credit <= 120) description = 'Our most popular option.';
            else if (p.credit <= 250) description = 'Great value for regular users.';
            else if (p.credit <= 550) description = 'For the power user.';
            else description = 'Best value, never run out.';
            return { ...p, description };
          });
          setProducts(productsWithDescriptions);
        } else {
          let errorMessage = 'Could not load credit packages.';
          if (response.status >= 500) {
            errorMessage = 'Our servers are experiencing issues. Please try again later.';
          } else {
            try {
              const errorData = await response.json();
              if (errorData.message) errorMessage = errorData.message;
            } catch {}
          }
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error Loading Shop',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchGeoData = async () => {
      setIsGeoLoading(true);
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        if (!ipResponse.ok) throw new Error('Could not fetch location data.');
        const ipData = await ipResponse.json();

        const ratesResponse = await fetch('https://open.er-api.com/v6/latest/ZAR');
        if (!ratesResponse.ok) throw new Error('Could not fetch exchange rates.');
        const ratesData = await ratesResponse.json();

        const userCurrency = ipData.currency;
        const rate = ratesData.rates[userCurrency];
        
        if (rate) {
          setGeoData({
            currency: userCurrency,
            rate: rate,
            flagUrl: `https://flagcdn.com/w40/${ipData.country_code.toLowerCase()}.png`,
          });
        } else {
            // Fallback for currencies not in the list
             setGeoData({ currency: 'ZAR', rate: 1, flagUrl: `https://flagcdn.com/w40/za.png`});
        }
      } catch (error) {
        console.error("Geo pricing error:", error);
        // Default to ZAR on error
        setGeoData({ currency: 'ZAR', rate: 1, flagUrl: `https://flagcdn.com/w40/za.png`});
      } finally {
        setIsGeoLoading(false);
      }
    };

    fetchCreditProducts();
    fetchGeoData();
  }, [router, toast]);
  
  const getDisplayPrice = (basePrice: number) => {
    if (isGeoLoading || !geoData) {
      return <Loader2 className="h-6 w-6 animate-spin" />;
    }
    
    const localPrice = basePrice * geoData.rate;
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: geoData.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    
    const formattedLocal = formatter.format(localPrice).replace(/\s/g, '');

    return `${formattedLocal} = (ZAR ${basePrice.toFixed(0)})`;
  };


  const handlePurchase = async (product: CreditProduct) => {
    setIsPurchasing(product.id);
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');

    if (!token || !email) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to purchase credits.',
      });
      router.push('/login');
      setIsPurchasing(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/credit/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: email,
            creditInformation: product,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.authorizationUrl) {
          localStorage.setItem('paymentType', 'credit_purchase');
          window.location.href = result.authorizationUrl;
        } else {
          throw new Error('Payment URL not received.');
        }
      } else {
          let errorMessage = 'An unknown error occurred.';
          if (response.status === 401) {
              errorMessage = 'Your session has expired. Please log in again.';
          } else if (response.status >= 500) {
              errorMessage = 'Our servers are experiencing issues. Please try again later.';
          } else {
              try {
                  const errorData = await response.json();
                  if (errorData.message) {
                      errorMessage = errorData.message;
                  }
              } catch {}
          }
          throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Purchase Error',
        description: error.message,
      });
    } finally {
        setIsPurchasing(null);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-black p-5 text-gray-200">
       <Link
        href="/dashboard"
        className="absolute top-8 left-8 z-10 inline-block rounded-full border border-white/10 bg-zinc-800/60 py-2.5 px-4 text-sm font-medium text-white no-underline transition-colors hover:bg-zinc-700/80"
      >
        <div className="flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </div>
      </Link>

      <div className="absolute top-8 right-8 z-10">
          {!isGeoLoading && geoData && (
              <Image 
                src={geoData.flagUrl} 
                alt="Country flag" 
                width={40} 
                height={26}
                className="rounded-md"
              />
          )}
      </div>

      <h1 className="main-title relative z-[1]">
        Buy Credits
      </h1>

      {isLoading ? (
          <div className="flex mt-5 h-96 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : (
         <div className="relative z-[2] mt-10 w-full max-w-4xl text-center">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {products.map((product) => (
                    <div key={product.id} className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-[#2d2d2d]/45 p-8 text-left shadow-xl backdrop-blur-[8px]">
                        <div className="flex-grow">
                            <div className="text-2xl font-semibold text-white">{product.credit} Credits</div>
                            <p className="mt-1 text-sm text-gray-400">{product.description}</p>
                        </div>
                        <div>
                             <div className="text-3xl font-bold text-white">
                                {getDisplayPrice(product.price)}
                             </div>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <button
                                     disabled={isPurchasing !== null}
                                     className="cta-button mt-4 w-full"
                                  >
                                      {isPurchasing === product.id ? <Loader2 className="mx-auto animate-spin" /> : 'Purchase'}
                                  </button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                   <AlertDialogHeader>
                                       <AlertDialogTitle>Confirm Your Purchase</AlertDialogTitle>
                                       <AlertDialogDescription>
                                           You are about to make a one-time purchase of {product.credit} credits for a price equivalent to ZAR {product.price.toFixed(2)}. The final amount will be in your local currency.
                                       </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                       <AlertDialogCancel>Cancel</AlertDialogCancel>
                                       <AlertDialogAction onClick={() => handlePurchase(product)} disabled={isPurchasing !== null}>
                                           {isPurchasing === product.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                           Confirm & Pay
                                       </AlertDialogAction>
                                   </AlertDialogFooter>
                               </AlertDialogContent>
                           </AlertDialog>
                        </div>
                    </div>
                 ))}
             </div>
         </div>
      )}
    </div>
  );
}

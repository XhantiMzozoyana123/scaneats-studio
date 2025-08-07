
'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2, Info, Mic } from 'lucide-react';
import { MealApiRepository } from '../data/meal-api.repository';
import { MealService } from '../application/meal.service';
import type { ScannedFood } from '@/app/domain/scanned-food';
import { useUserData } from '@/app/shared/context/user-data-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CircleDollarSign } from 'lucide-react';


const mealRepository = new MealApiRepository();
const mealService = new MealService(mealRepository);

export const MealPlanView = () => {
  const { toast } = useToast();
  const { profile, setSubscriptionModalOpen } = useUserData();
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [isMealLoading, setIsMealLoading] = useState(true);
  const [sallyResponse, setSallyResponse] = useState<string | null>(null);
  const [isSallyLoading, setIsSallyLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();
  const [sallyProgress, setSallyProgress] = useState(0);

  const fetchMealPlan = useCallback(async () => {
    setIsMealLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'Please log in to view your meal plan.',
      });
      setIsMealLoading(false);
      return;
    }
  
    try {
      const meal = await mealService.getLastMealPlan(token);
      setScannedFood(meal);
    } catch (error: any) {
      if (error.message === 'Session Expired') {
        toast({
          variant: 'destructive',
          title: 'Session Expired',
          description: 'Please log in to continue.',
        });
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load meal plan',
          description: error.message,
        });
      }
    } finally {
      setIsMealLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);


  useEffect(() => {
    if (isSallyLoading) {
      const interval = setInterval(() => {
        setSallyProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSallyLoading]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleApiCall(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description:
              'Please allow microphone access in your browser settings to use this feature.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Speech Error',
            description: `Could not recognize speech: ${event.error}. Please try again.`,
          });
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
      });
    }
  }, [toast]);

  const handleMicClick = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    try {
      if (isSallyLoading) return;
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description:
          'Please allow microphone access in your browser settings to use this feature.',
      });
    }
  };

  const handleApiCall = async (userInput: string) => {
    if (!userInput.trim()) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to talk to Sally.' });
        router.push('/login');
        return;
    }
    
    if (!profile?.name) {
       toast({
          variant: 'destructive',
          title: 'Profile Incomplete',
          description: 'Please complete your profile before talking to Sally.',
       });
       return;
    }

    setIsSallyLoading(true);
    setSallyProgress(10);
    setSallyResponse(`Thinking about: "${userInput}"`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/sally/meal-planner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ClientName: profile.name,
            ClientDialogue: userInput,
          }),
        });
        
        if (response.status === 401) {
            toast({ variant: 'destructive', title: 'Session Expired', description: 'Please log in again.' });
            router.push('/login');
            throw new Error('Unauthorized');
        }

        if (response.status === 403) {
            setSubscriptionModalOpen(true);
            throw new Error('Subscription required');
        }
        
        if (response.status === 429) {
          toast({
              variant: 'destructive',
              title: 'Out of Credits',
              description: 'You have used all your credits. Please buy more to continue scanning.',
              action: (
                <Button onClick={() => router.push('/credits')} className="gap-2">
                  <CircleDollarSign />
                  Buy Credits
                </Button>
              )
          });
          throw new Error('Out of credits');
        }
        
        if (!response.ok) {
            let errorMsg = "Sally failed to respond";
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch {}
            throw new Error(errorMsg);
        }

        const result = await response.json();
        setSallyResponse(result.agentDialogue);
        
        const { media: audioDataUri } = await textToSpeech(result.agentDialogue);
        if (audioDataUri && audioRef.current) {
            audioRef.current.src = audioDataUri;
            audioRef.current.play();
        }

    } catch (error: any) {
      if (error.message !== 'Subscription required' && error.message !== 'Unauthorized' && error.message !== 'Out of credits') {
        setSallyResponse('Sorry, I had trouble with that. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'An error occurred while talking to Sally.',
        });
      }
    } finally {
      setSallyProgress(100);
      setTimeout(() => setIsSallyLoading(false), 500);
    }
  };
  
  const { totalCalories, totalProtein, totalCarbs, totalFat } = useMemo(() => {
    if (!scannedFood) {
      return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
    }
    return {
      totalCalories: scannedFood.total || 0,
      totalProtein: scannedFood.protein || 0,
      totalCarbs: scannedFood.carbs || 0,
      totalFat: scannedFood.fat || 0,
    };
  }, [scannedFood]);


  if (isMealLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (!scannedFood) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <Info className="h-12 w-12 text-primary" />
          <h2 className="text-xl font-bold">No food scanned yet.</h2>
          <p className="text-muted-foreground">Scan an item to get started!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-full w-full flex-grow">
      <video
        src="https://gallery.scaneats.app/images/MealPlannerPage.webm"
        className="fixed inset-0 -z-10 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      
      <div className="flex h-full w-full flex-col items-center p-5 pb-[155px] box-border overflow-y-auto">
        <header className="flex justify-between items-center mb-5 w-full max-w-[600px] px-[15px] box-sizing-border shrink-0">
          <div className="w-[150px] h-[75px] text-left">
            <Image
              src="https://gallery.scaneats.app/images/ScanEatsLogo.png"
              alt="ScanEats Logo"
              width={150}
              height={75}
              className="max-w-full max-h-full block object-contain"
            />
          </div>
        </header>
        
        <div className="text-center flex flex-col items-center mb-[25px] shrink-0">
          <div className="text-3xl md:text-4xl font-medium mb-2 text-white text-shadow-[0_0_10px_white]">
              {scannedFood.total.toFixed(0)}
          </div>
          <div className="text-sm md:text-base text-white bg-[rgba(34,34,34,0.7)] px-3 py-1.5 rounded-full tracking-wider">
              Total Calories
          </div>
        </div>

        <div className="flex justify-around items-stretch mb-[25px] w-full max-w-[550px] gap-[15px] flex-wrap shrink-0">
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">Protein</div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">{scannedFood.protein.toFixed(0)}g</div>
          </div>
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">Fat</div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">{scannedFood.fat.toFixed(0)}g</div>
          </div>
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">Carbs</div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">{scannedFood.carbs.toFixed(0)}g</div>
          </div>
        </div>

        <button onClick={handleMicClick} className="flex flex-col justify-center items-center bg-gradient-to-r from-[#4a148c] to-[#311b92] text-white rounded-full w-[120px] h-[120px] my-10 mx-auto text-base tracking-wider cursor-pointer border-2 border-[rgba(255,255,255,0.2)] transition-transform duration-200 ease-in-out shrink-0">
           <Mic className="h-16 w-16" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.8)'}} />
        </button>
        
        <div className="text-center mt-4 mb-8 text-white text-shadow-[0_0_6px_rgba(255,255,255,0.8),_0_0_3px_rgba(255,255,255,0.6)] text-lg font-normal bg-transparent px-5 py-3 rounded-2xl inline-block max-w-[85%] shadow-[0_0_15px_rgba(0,0,0,0.4),_0_0_5px_rgba(0,0,0,0.3)] border-l-4 border-[#a033ff] shrink-0">
           {isSallyLoading ? (
               <div className="space-y-2 text-center">
                 <Progress value={sallyProgress} className="w-full" />
                 <p className="text-sm text-gray-400">Sally is thinking...</p>
               </div>
            ) : (sallyResponse || "Ask me about this meal and I'll tell you everything")}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

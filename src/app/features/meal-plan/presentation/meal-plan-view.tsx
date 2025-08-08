
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { Loader2, Info, Mic, CircleDollarSign, Play } from 'lucide-react';
import { MealApiRepository } from '../data/meal-api.repository';
import { MealService } from '../application/meal.service';
import type { ScannedFood } from '@/app/domain/scanned-food';
import { useUserData } from '@/app/shared/context/user-data-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/shared/lib/utils';
import { API_BASE_URL } from '@/app/shared/lib/api';

const mealRepository = new MealApiRepository();
const mealService = new MealService(mealRepository);

export const MealPlanView = () => {
  const { toast } = useToast();
  const { profile, setSubscriptionModalOpen, fetchProfile } = useUserData();
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [isMealLoading, setIsMealLoading] = useState(true);
  const [sallyResponse, setSallyResponse] = useState<string | null>(null);
  const [isSallyLoading, setIsSallyLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
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
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
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
        if (event.error === 'network') {
          toast({
            variant: 'destructive',
            title: 'Speech Error',
            description:
              'Could not recognize speech: network error. Please check your connection.',
          });
        } else if (event.error === 'not-allowed') {
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
        setIsSallyLoading(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        // State is handled by other functions to prevent race conditions.
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
      setIsRecording(false);
      return;
    }

    if (isSallyLoading) return;
    setSallyResponse(null);

    try {
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
      setIsRecording(false);
    }
  };

  const handlePlayAudio = async (textToSpeak: string) => {
    if (!textToSpeak || isAudioLoading || !audioRef.current) return;
    setIsAudioLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/TTS/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Text: textToSpeak }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audio from server.');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = audioRef.current;
      if (audio) {
        audio.src = audioUrl;
        await new Promise<void>((resolve, reject) => {
          audio.oncanplaythrough = () => audio.play().then(resolve).catch(reject);
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl);
            reject(e);
          };
        });
      } else {
        throw new Error('Audio element not found.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Audio Error',
        description: error.message || 'Could not play audio response.',
      });
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleApiCall = async (userInput: string) => {
    if (!userInput.trim()) {
      setIsRecording(false);
      return;
    }

    if (!profile || !scannedFood) {
      toast({
        variant: 'destructive',
        title: 'Data not loaded',
        description:
          'Please wait for your profile and meal data to load.',
      });
      setIsRecording(false);
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please log in again.',
      });
      router.push('/login');
      setIsRecording(false);
      return;
    }

    setIsSallyLoading(true);
    setIsRecording(true);
    setSallyProgress(10);
    setSallyResponse(`Thinking about: "${userInput}"`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sally/meal-planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          clientDialogue: userInput,
          clientName: profile.name,
        }),
      });

      if (response.status === 403) {
        setSubscriptionModalOpen(true);
        setSallyResponse('You need a subscription for this feature.');
        return;
      }

      if (response.status === 429) {
        setSallyResponse("You're out of credits! Please buy more.");
        toast({
          variant: 'destructive',
          title: 'Out of Credits',
          description:
            'You have used all your credits. Please buy more to continue talking to Sally.',
          action: (
            <Button
              onClick={() => router.push('/credits')}
              className="gap-2"
            >
              <CircleDollarSign />
              Buy Credits
            </Button>
          ),
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `An error occurred: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.agentDialogue) {
        throw new Error("Sally didn't provide a response.");
      }

      setSallyResponse(result.agentDialogue);
      await handlePlayAudio(result.agentDialogue);
      await fetchProfile(); // Refresh credits
    } catch (error: any) {
      setSallyResponse('Sorry, I had trouble with that. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error.message || 'An error occurred while talking to Sally.',
      });
    } finally {
      setSallyProgress(100);
      setTimeout(() => {
        setIsSallyLoading(false);
        setIsRecording(false);
      }, 500);
    }
  };

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
          <p className="text-muted-foreground">
            Scan an item to get started!
          </p>
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
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">
              Protein
            </div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">
              {scannedFood.protein.toFixed(0)}g
            </div>
          </div>
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">
              Fat
            </div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">
              {scannedFood.fat.toFixed(0)}g
            </div>
          </div>
          <div className="bg-primary/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out text-white flex-1 min-w-[90px] shadow-[0_0_10px_rgba(106,27,154,0.5)] border border-[rgba(255,255,255,0.1)] hover:-translate-y-1">
            <div className="text-lg mb-2 font-normal text-shadow-[0_0_10px_white]">
              Carbs
            </div>
            <div className="text-2xl font-semibold text-shadow-[0_0_10px_white]">
              {scannedFood.carbs.toFixed(0)}g
            </div>
          </div>
        </div>

        <button
          onClick={handleMicClick}
          className={cn(
            'flex flex-col justify-center items-center text-white rounded-full w-[120px] h-[120px] my-10 mx-auto text-base tracking-wider cursor-pointer border-2 border-[rgba(255,255,255,0.2)] transition-transform duration-200 ease-in-out shrink-0',
            isRecording
              ? 'bg-red-600'
              : 'bg-gradient-to-r from-[#4a148c] to-[#311b92]'
          )}
        >
          <Mic
            className="h-16 w-16"
            style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }}
          />
        </button>

        <div className="text-center mt-4 mb-8 text-white text-shadow-[0_0_6px_rgba(255,255,255,0.8),_0_0_3px_rgba(255,255,255,0.6)] text-lg font-normal bg-transparent px-5 py-3 rounded-2xl inline-block max-w-[85%] shadow-[0_0_15px_rgba(0,0,0,0.4),_0_0_5px_rgba(0,0,0,0.3)] border-l-4 border-[#a033ff] shrink-0">
          {isSallyLoading ? (
            <div className="space-y-2 text-center">
              <Progress value={sallyProgress} className="w-full" />
              <p className="text-sm text-gray-400">Sally is thinking...</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-grow">
                {sallyResponse ||
                  "Ask me about this meal and I'll tell you everything"}
              </span>
              {sallyResponse &&
                !sallyResponse.startsWith('Thinking about:') &&
                !sallyResponse.startsWith('You need a subscription') &&
                !sallyResponse.startsWith("You're out of credits") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => handlePlayAudio(sallyResponse)}
                    disabled={isAudioLoading}
                  >
                    {isAudioLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                )}
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

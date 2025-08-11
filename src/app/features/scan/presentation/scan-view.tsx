
'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Camera, Loader2, RefreshCw, Send, Upload, CircleDollarSign } from 'lucide-react';
import { useToast } from '@/app/shared/hooks/use-toast';
import { useUserData } from '@/app/shared/context/user-data-context';
import { cn } from '@/app/shared/lib/utils';
import { API_BASE_URL } from '@/app/shared/lib/api';
import { useIsMobile } from '@/app/shared/hooks/use-mobile';
import type { View } from '@/app/features/dashboard/dashboard.types';

export const ScanView = ({ onNavigate }: { onNavigate: (view: View) => void }) => {
  const { toast } = useToast();
  const { profile, setSubscriptionModalOpen } = useUserData();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const router = useRouter();

  const [cameraState, setCameraState] = useState<
    'idle' | 'starting' | 'running' | 'denied' | 'error' | 'nocamera'
  >('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Cleanup function to stop video tracks when component unmounts or view changes
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setCameraState('nocamera');
      return;
    }
    setCameraState('starting');

    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: 'environment' } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false },
    ];

    let stream: MediaStream | null = null;
    let success = false;

    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        success = true;
        break;
      } catch (err) {
        console.warn('Constraint failed:', constraint, err);
      }
    }

    if (success && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
        setCameraState('running');
      } catch (playErr) {
        console.error('Video play failed:', playErr);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: 'Could not start the video stream.',
        });
        setCameraState('error');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description:
          'Please enable camera permissions in your browser settings.',
      });
      setCameraState('denied');
    }
  };

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'running') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUri);
    }
  }, [cameraState]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSendScan = useCallback(async () => {
    if (!capturedImage) return;

    if (!profile) {
      toast({
        variant: 'destructive',
        title: 'Profile Not Loaded',
        description: 'Please wait a moment for your profile to load and try again.',
      });
      return;
    }
    
    // Check for subscription *before* making the API call
    if (!profile.isSubscribed) {
        setSubscriptionModalOpen(true);
        return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Base64: capturedImage,
            Logging: {
                ProfileId: profile.id,
            }
          })
      });

      if (response.status === 401) {
        router.push('/login');
        throw new Error('Session Expired. Please log in again.');
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
        let errorMsg = "Scan failed";
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const scanResult = await response.json();
      
      toast({
          title: 'Success!',
          description: `Identified: ${scanResult.name}.`,
      });
      onNavigate('meal-plan');

    } catch (error: any) {
      if (
        error.message !== 'Subscription required' && 
        error.message !== 'Out of credits' &&
        !error.message.includes('Session Expired')
      ) {
        toast({
          variant: 'destructive',
          title: 'Scan Failed',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setIsSending(false);
    }
  }, [capturedImage, profile, toast, router, setSubscriptionModalOpen, onNavigate]);
  
  return (
    <>
      <div className="fixed inset-0 -z-10">
        <video
          src="https://gallery.scaneats.app/images/ScanFoodNEW.webm"
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <main className="container z-10 mx-auto flex h-full flex-col items-center justify-center overflow-y-auto p-4 pb-28">
        <div className="w-full max-w-sm space-y-4">
          <div className="relative w-full overflow-hidden rounded-2xl border-4 border-primary/50 shadow-lg bg-black aspect-[9/16]">
            {capturedImage ? (
              <Image
                src={capturedImage}
                alt="Captured food"
                fill
                className="object-contain"
              />
            ) : (
               <>
                {isMobile ? (
                  <>
                  <video
                    ref={videoRef}
                    className={cn("h-full w-full object-cover", {
                       'hidden': cameraState !== 'running'
                    })}
                    playsInline
                    muted
                    autoPlay
                  />
                  {cameraState !== 'running' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-black/50">
                      {cameraState === 'starting' && <Loader2 className="h-12 w-12 animate-spin" />}
                      {cameraState === 'idle' && (
                         <Button onClick={startCamera} size="lg">
                           <Camera className="mr-2" /> Start Camera
                         </Button>
                      )}
                      {(cameraState === 'denied' || cameraState === 'error' || cameraState === 'nocamera') && (
                         <div className="flex flex-col items-center gap-4">
                            <Alert variant="destructive" className="bg-destructive/20 border-destructive/50 text-destructive-foreground">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <AlertTitle>Camera Unavailable</AlertTitle>
                                <AlertDescription>
                                   {cameraState === 'denied'
                                     ? 'Permission was denied. Please allow camera access in your browser settings.'
                                     : 'Could not access the camera. You can try again or upload a photo.'}
                                </AlertDescription>
                            </Alert>
                            <div className="flex gap-2">
                               <Button onClick={startCamera} variant="outline" size="sm">Retry</Button>
                               <Button onClick={() => fileInputRef.current?.click()} size="sm">
                                  <Upload className="mr-2" /> Upload
                                </Button>
                            </div>
                         </div>
                      )}
                    </div>
                  )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-black/50">
                    <Upload className="h-16 w-16 text-primary" />
                    <h2 className="mt-4 text-2xl font-bold">Upload a Photo</h2>
                    <p className="mt-2 text-muted-foreground">
                      Select an image of your food to get started.
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} className="mt-6" size="lg">
                      <Upload className="mr-2" /> Select Image
                    </Button>
                  </div>
                )}
               </>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {capturedImage ? (
              <>
                <Button onClick={handleRetake} variant="outline" className="text-lg py-6 flex-1">
                  <RefreshCw className="mr-2" /> {isMobile ? 'Retake' : 'Clear'}
                </Button>
                <Button onClick={handleSendScan} disabled={isSending} className="text-lg py-6 flex-1 bg-primary">
                  {isSending ? ( <Loader2 className="animate-spin" /> ) : ( <> <Send className="mr-2" /> Analyze </> )}
                </Button>
              </>
            ) : (
              isMobile && (
              <div className="flex w-full items-center gap-2">
                 <Button onClick={handleCapture} disabled={cameraState !== 'running'} className="h-16 flex-1 rounded-full text-lg bg-primary animate-breathe-glow">
                   <Camera className="mr-2" /> Capture
                 </Button>
                  <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="secondary" className="h-16 w-16 rounded-full">
                     <Upload />
                     <span className="sr-only">Upload Photo</span>
                  </Button>
              </div>
              )
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      </main>
    </>
  );
};

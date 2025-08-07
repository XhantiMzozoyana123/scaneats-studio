
'use client';

import {
  Smartphone,
  Share,
  PlusSquare,
  CornerUpRight,
  MoreVertical,
  ArrowDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/shared/components/ui/tabs';

const AppleInstructions = () => (
  <div className="mt-2 space-y-3 text-left">
    <div className="flex w-full animate-fade-in-1 items-center gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
        1
      </span>
      <p className="text-sm">
        Tap the <strong>Share</strong> icon in your browser's menu bar.
      </p>
      <Share className="ml-auto h-6 w-6 flex-shrink-0 text-primary" />
    </div>
    <ArrowDown className="mx-auto h-4 w-4 animate-pulse text-muted-foreground" />
    <div
      className="flex w-full animate-fade-in-2 items-center gap-3"
      style={{ animationDelay: '0.2s' }}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
        2
      </span>
      <p className="text-sm">
        Scroll down and tap <strong>'Add to Home Screen'</strong>.
      </p>
      <PlusSquare className="ml-auto h-6 w-6 flex-shrink-0 text-primary" />
    </div>
    <ArrowDown className="mx-auto h-4 w-4 animate-pulse text-muted-foreground" />
    <div
      className="flex w-full animate-fade-in-2 items-center gap-3"
      style={{ animationDelay: '0.4s' }}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
        3
      </span>
      <p className="text-sm">
        Finally, tap <strong>'Add'</strong> in the top-right corner.
      </p>
      <CornerUpRight className="ml-auto h-6 w-6 flex-shrink-0 text-primary" />
    </div>
  </div>
);

const AndroidInstructions = ({
  onInstallClick,
  canInstall,
}: {
  onInstallClick: () => void;
  canInstall: boolean;
}) => (
  <div className="mt-2 space-y-3 text-left">
    {canInstall ? (
      <div className="text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Your browser supports direct installation.
        </p>
        <Button onClick={onInstallClick} className="w-full">
          Install ScanEats App
        </Button>
      </div>
    ) : (
      <>
        <div className="flex w-full animate-fade-in-1 items-center gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
            1
          </span>
          <p className="text-sm">
            Tap the <strong>three dots</strong> in the top-right corner of your
            browser.
          </p>
          <MoreVertical className="ml-auto h-6 w-6 flex-shrink-0 text-primary" />
        </div>
        <ArrowDown className="mx-auto h-4 w-4 animate-pulse text-muted-foreground" />
        <div
          className="flex w-full animate-fade-in-2 items-center gap-3"
          style={{ animationDelay: '0.2s' }}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
        2
      </span>
          <p className="text-sm">
            Tap <strong>'Install app'</strong> or{' '}
            <strong>'Add to Home screen'</strong>.
          </p>
          <Smartphone className="ml-auto h-6 w-6 flex-shrink-0 text-primary" />
        </div>
      </>
    )}
  </div>
);

export function InstallationGuide() {
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div className="w-full rounded-lg bg-zinc-900/80 p-4">
      <Tabs defaultValue="apple" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apple">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
              <path d="M10 2c1 .5 2 2 2 5" />
            </svg>
            iOS
          </TabsTrigger>
          <TabsTrigger value="android">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M14.7 4.2a.3.3 0 0 0-.4-.4l-1.3 1.3a.3.3 0 0 0 0 .4Z" />
              <path d="M6 18H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2h1c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-2" />
              <path d="M9.3 4.2a.3.3 0 0 1 .4-.4l1.3 1.3a.3.3 0 0 1 0 .4Z" />
              <path d="M17 10v4" />
              <path d="M7 10v4" />
            </svg>
            Android
          </TabsTrigger>
        </TabsList>
        <TabsContent value="apple">
          <AppleInstructions />
        </TabsContent>
        <TabsContent value="android">
          <AndroidInstructions
            onInstallClick={handleInstallClick}
            canInstall={!!deferredPrompt}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

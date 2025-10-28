import { useEffect, useState } from 'react';
import { FolderKanban, Sparkles, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const HeroVisual = () => {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const fullText = 'Launch new website';

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Start typing
      setTimeout(() => setPhase(2), 3000), // Start transform
      setTimeout(() => setPhase(3), 3500), // Show final elements
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 1) {
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
        }
      }, 80);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const isVisible = (p: number) => phase >= p;

  return (
    <div className="relative w-full max-w-2xl mx-auto transition-all duration-500 ease-out">
      <div className="relative z-10 bg-card/80 backdrop-blur-sm border border-border/70 rounded-lg shadow-lg p-4 sm:p-6 aspect-video flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-4 flex-shrink-0">
          <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-400/80"></div>
          <div className="h-3 w-3 rounded-full bg-green-400/80"></div>
        </div>

        {/* Animated Content */}
        <div className="relative flex-grow">
          {/* Phase 1: Input Box */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out',
              isVisible(2) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            )}
          >
            <div className="flex items-center w-full max-w-sm p-3 rounded-md bg-secondary/50 border">
              <Plus className="h-5 w-5 text-primary mr-2" />
              <p className="text-sm sm:text-base text-foreground/80">
                {typedText}
                <span
                  className={cn(
                    'inline-block w-0.5 h-5 bg-primary ml-0.5 transition-opacity duration-500',
                    phase === 1 && typedText.length < fullText.length
                      ? 'animate-[pulse_1s_ease-in-out_infinite]'
                      : 'opacity-0'
                  )}
                ></span>
              </p>
            </div>
          </div>

          {/* Phase 2 & 3: Organized Cards */}
          <div className="absolute inset-0">
            {/* Flow Project */}
            <div
              className={cn(
                'absolute top-2 sm:top-4 left-2 sm:left-4 w-4/5 sm:w-3/4 max-w-[300px] bg-background p-3 rounded-lg shadow-md border transition-all duration-500 ease-out',
                isVisible(2)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-4'
              )}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                <h4 className="font-sans font-medium text-sm sm:text-base">Flow</h4>
              </div>
              <div className="bg-secondary/50 p-2 rounded-md">
                <p className="text-sm font-medium">{fullText}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-4 w-4 rounded border-2 border-primary"></div>
                  <p className="text-xs text-muted-foreground">Design mockups</p>
                </div>
              </div>
            </div>

            {/* Garden Note */}
            <div
              className={cn(
                'absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-1/2 max-w-[200px] bg-background p-3 rounded-lg shadow-md border transition-all duration-500 ease-out',
                isVisible(3)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '300ms' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-sans font-medium text-sm sm:text-base">Garden</h4>
              </div>
              <p className="text-xs italic text-muted-foreground">
                "Competitor analysis for new website..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroVisual;
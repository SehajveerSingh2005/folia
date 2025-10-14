import { FolderKanban, LayoutGrid, Sparkles } from 'lucide-react';
import ScrollFadeIn from './ScrollFadeIn';

const HeroVisual = () => {
  return (
    <ScrollFadeIn delay={600}>
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative z-10 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-2xl p-4 sm:p-6">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-400/80"></div>
            <div className="h-3 w-3 rounded-full bg-green-400/80"></div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <ScrollFadeIn delay={800}>
              <div className="col-span-2 bg-secondary/50 p-3 sm:p-4 rounded-md h-24 sm:h-32 flex flex-col justify-between">
                <div>
                  <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <p className="text-sm sm:text-base font-medium text-left">Dashboard</p>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={1000}>
              <div className="col-span-1 bg-secondary/50 p-3 sm:p-4 rounded-md h-24 sm:h-32 flex flex-col justify-between">
                <div>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <p className="text-sm sm:text-base font-medium text-left">Garden</p>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={1200}>
              <div className="col-span-3 bg-secondary/50 p-3 sm:p-4 rounded-md h-20 sm:h-24 flex flex-col justify-between">
                <div>
                  <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <p className="text-sm sm:text-base font-medium text-left">Flow</p>
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </div>
    </ScrollFadeIn>
  );
};

export default HeroVisual;
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardSkeleton = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        {/* MobileHeader Skeleton */}
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-8" />
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-grow p-4 pt-20 pb-24 overflow-auto flex flex-col">
          <div className="flex justify-end items-center mb-4 gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex-grow">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24 col-span-4 rounded-lg" />
              <Skeleton className="h-24 col-span-2 rounded-lg" />
              <Skeleton className="h-48 col-span-2 row-span-2 rounded-lg" />
              <Skeleton className="h-48 col-span-2 rounded-lg" />
            </div>
          </div>
        </main>

        {/* BottomNavBar Skeleton */}
        <footer className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-t">
          <div className="grid grid-cols-5 h-16 items-center">
            <div className="flex flex-col items-center gap-1"><Skeleton className="h-5 w-5" /><Skeleton className="h-3 w-8" /></div>
            <div className="flex flex-col items-center gap-1"><Skeleton className="h-5 w-5" /><Skeleton className="h-3 w-8" /></div>
            <div className="flex justify-center items-center"><Skeleton className="h-14 w-14 rounded-full -translate-y-4" /></div>
            <div className="flex flex-col items-center gap-1"><Skeleton className="h-5 w-5" /><Skeleton className="h-3 w-8" /></div>
            <div className="flex flex-col items-center gap-1"><Skeleton className="h-5 w-5" /><Skeleton className="h-3 w-8" /></div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar Skeleton */}
      <aside className="flex-shrink-0 flex flex-col bg-secondary/40 p-4 border-r w-64">
        <div className="px-3 mb-8">
          <div className="flex items-center gap-3 h-[44px]">
            <Skeleton className="h-8 w-8" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="flex-grow space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-grow p-8 sm:p-12 overflow-auto flex flex-col">
        <div className="flex justify-end items-center mb-4 gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex-grow">
          <div className="grid grid-cols-12 gap-6">
            <Skeleton className="h-24 col-span-8 rounded-lg" />
            <Skeleton className="h-24 col-span-4 rounded-lg" />
            <Skeleton className="h-48 col-span-6 rounded-lg" />
            <Skeleton className="h-48 col-span-6 rounded-lg" />
            <Skeleton className="h-36 col-span-6 rounded-lg" />
            <Skeleton className="h-36 col-span-6 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSkeleton;
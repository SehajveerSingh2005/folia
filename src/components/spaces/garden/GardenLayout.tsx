import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface GardenLayoutProps {
    sidebar: ReactNode;
    children: ReactNode;
    isPinned: boolean;
    className?: string;
    onTogglePin?: () => void;
}

const GardenLayout = ({ sidebar, children, className, isPinned }: GardenLayoutProps) => {
    if (!isPinned) {
        return (
            <div className={cn("relative h-full w-full border rounded-lg overflow-hidden bg-background shadow-sm", className)}>
                {/* Main Content - Full Width */}
                <div className="h-full w-full overflow-y-auto bg-background">
                    {children}
                </div>

                {/* Floating Sidebar - Hover to reveal */}
                <div className="absolute top-0 right-0 h-full flex flex-row-reverse pointer-events-none z-50">
                    {/* Trigger Zone (Always interactive) */}
                    <div className="h-full w-4 bg-transparent pointer-events-auto hover:bg-transparent peer" />

                    {/* Sidebar Container */}
                    {/* We use peer-hover and hover on itself to keep it open */}
                    <div className="h-full w-[350px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-l shadow-2xl 
                                     translate-x-[120%] transition-transform duration-300 ease-in-out pointer-events-auto
                                     peer-hover:translate-x-0 hover:translate-x-0">
                        {sidebar}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("h-full w-full border rounded-lg overflow-hidden bg-background shadow-sm", className)}>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={75}>
                    <div className="h-full overflow-y-auto bg-background">
                        {children}
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="after:w-4" />
                <ResizablePanel
                    defaultSize={25}
                    minSize={15}
                    maxSize={40}
                    className={cn("min-w-[50px]")}
                >
                    <div className="h-full border-l bg-muted/10 w-full overflow-hidden">
                        {sidebar}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default GardenLayout;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Monitor, Dock, Sidebar as SidebarIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type NavigationMode = 'sidebar' | 'dock';

interface SettingsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    navigationMode: NavigationMode;
    onNavigationModeChange: (mode: NavigationMode) => void;
}

const SettingsDialog = ({
    isOpen,
    onOpenChange,
    navigationMode,
    onNavigationModeChange
}: SettingsDialogProps) => {
    const { theme, setTheme } = useTheme();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle className="text-xl font-serif">Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="appearance" className="flex-1 flex flex-col">
                    <div className="px-6 py-2 border-b bg-muted/30">
                        <TabsList className="bg-transparent p-0 gap-4">
                            <TabsTrigger value="appearance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger value="account" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">
                                Account
                            </TabsTrigger>
                            <TabsTrigger value="about" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">
                                About
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <TabsContent value="appearance" className="mt-0 space-y-8">

                            {/* Theme Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Theme</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <ThemeOption
                                        value="light"
                                        active={theme === 'light'}
                                        onClick={() => setTheme('light')}
                                        icon={Sun}
                                        label="Light"
                                    />
                                    <ThemeOption
                                        value="dark"
                                        active={theme === 'dark'}
                                        onClick={() => setTheme('dark')}
                                        icon={Moon}
                                        label="Dark"
                                    />
                                    <ThemeOption
                                        value="system"
                                        active={theme === 'system'}
                                        onClick={() => setTheme('system')}
                                        icon={Monitor}
                                        label="System"
                                    />
                                </div>
                            </div>

                            {/* Navigation Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Navigation Mode</h3>
                                <RadioGroup
                                    value={navigationMode}
                                    onValueChange={(v) => onNavigationModeChange(v as NavigationMode)}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <label className={cn(
                                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                        navigationMode === 'sidebar' && "border-primary bg-primary/5"
                                    )}>
                                        <RadioGroupItem value="sidebar" className="sr-only" />
                                        <SidebarIcon className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <div className="font-medium">Sidebar</div>
                                            <div className="text-xs text-muted-foreground mt-1">Classic navigation with labels</div>
                                        </div>
                                    </label>

                                    <label className={cn(
                                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                        navigationMode === 'dock' && "border-primary bg-primary/5"
                                    )}>
                                        <RadioGroupItem value="dock" className="sr-only" />
                                        <Dock className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <div className="font-medium">Floating Dock</div>
                                            <div className="text-xs text-muted-foreground mt-1">Minimalist bottom bar (Zen Mode)</div>
                                        </div>
                                    </label>
                                </RadioGroup>
                            </div>

                        </TabsContent>

                        <TabsContent value="account">
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                <p>Account settings coming soon.</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="about">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">About Folia</h3>
                                <p className="text-sm text-muted-foreground">
                                    Folia is your "Second Brain" OS. Designed with intentionality for visual thinkers.
                                </p>
                                <div className="text-xs text-muted-foreground">
                                    Version 0.1.0 (Alpha)
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

const ThemeOption = ({
    value,
    active,
    onClick,
    icon: Icon,
    label
}: {
    value: string;
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string
}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
            active
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted hover:border-muted-foreground/50 text-muted-foreground"
        )}
    >
        <Icon className="h-6 w-6 mb-2" />
        <span className="text-sm font-medium">{label}</span>
    </button>
);

export default SettingsDialog;

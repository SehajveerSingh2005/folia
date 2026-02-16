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
            <DialogContent className="max-w-3xl h-[600px] flex p-0 gap-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
                <Tabs defaultValue="appearance" className="flex-1 flex flex-row h-full">

                    {/* Sidebar */}
                    <div className="w-64 bg-muted/30 border-r border-border/50 p-6 flex flex-col gap-8">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-lg">⚙️</span>
                            </div>
                            <DialogTitle className="text-lg font-semibold tracking-tight">Settings</DialogTitle>
                        </div>

                        <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 gap-1 items-stretch">
                            <TabsTrigger
                                value="appearance"
                                className="justify-start px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                <span className="flex items-center gap-3">
                                    <Monitor className="h-4 w-4" />
                                    Appearance
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="account"
                                className="justify-start px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-xs">👤</span>
                                    Account
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="about"
                                className="justify-start px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-xs">ℹ️</span>
                                    About
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-auto pl-2">
                            <p className="text-[10px] text-muted-foreground font-mono">Build v0.2.0-beta</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-background p-8">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Settings Content</DialogTitle>
                        </DialogHeader>

                        <TabsContent value="appearance" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Theme Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Theme</h3>
                                    <p className="text-sm text-muted-foreground">Customize the look and feel of your workspace.</p>
                                </div>
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

                            <div className="w-full h-px bg-border/50" />

                            {/* Navigation Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Navigation</h3>
                                    <p className="text-sm text-muted-foreground">Choose how you navigate through Folia.</p>
                                </div>
                                <RadioGroup
                                    value={navigationMode}
                                    onValueChange={(v) => onNavigationModeChange(v as NavigationMode)}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    <label className={cn(
                                        "relative flex flex-col items-start justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:border-primary/50 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                        navigationMode === 'sidebar' && "border-primary bg-primary/5 shadow-sm"
                                    )}>
                                        <RadioGroupItem value="sidebar" className="sr-only" />
                                        <div className="flex items-center gap-3 w-full mb-3">
                                            <div className="p-2 bg-background rounded-md shadow-sm border">
                                                <SidebarIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="font-semibold">Sidebar</div>
                                            {navigationMode === 'sidebar' && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Traditional side navigation with clear labels. Best for desktops.
                                        </p>
                                    </label>

                                    <label className={cn(
                                        "relative flex flex-col items-start justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:border-primary/50 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                        navigationMode === 'dock' && "border-primary bg-primary/5 shadow-sm"
                                    )}>
                                        <RadioGroupItem value="dock" className="sr-only" />
                                        <div className="flex items-center gap-3 w-full mb-3">
                                            <div className="p-2 bg-background rounded-md shadow-sm border">
                                                <Dock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="font-semibold">Floating Dock</div>
                                            {navigationMode === 'dock' && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Modern, Mac-style floating dock. Maximizes screen real estate.
                                        </p>
                                    </label>
                                </RadioGroup>
                            </div>
                        </TabsContent>

                        <TabsContent value="account" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium">Account</h3>
                                    <p className="text-sm text-muted-foreground">Manage your profile and subscription.</p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-5 p-6 bg-card border rounded-xl shadow-sm">
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl border-4 border-background shadow-inner">
                                            👽
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-xl">User Profile</h3>
                                            <p className="text-sm text-muted-foreground">user@example.com</p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">Pro Plan</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px] pl-1">Actions</h4>
                                        <Button variant="outline" className="w-full justify-between h-12" disabled>
                                            Manage Subscription
                                            <span className="text-xs text-muted-foreground">Stripe Portal ↗</span>
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30">
                                            Sign Out
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="about" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col justify-center">
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-10 text-white text-center shadow-2xl">
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-2">
                                        <h2 className="text-5xl font-serif tracking-tighter drop-shadow-md">Folia</h2>
                                        <p className="text-sm font-medium opacity-90 tracking-[0.2em] uppercase text-white/80">OS for your mind</p>
                                    </div>

                                    <div className="w-16 h-1 bg-white/30 mx-auto rounded-full" />

                                    <p className="text-sm opacity-90 max-w-sm mx-auto leading-relaxed text-blue-50">
                                        Designed with intentionality for visual thinkers.
                                        Organize your chaos into a beautiful garden of ideas.
                                    </p>

                                    <div className="pt-8">
                                        <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-medium text-white/70">
                                            v0.2.0-beta
                                        </span>
                                    </div>
                                </div>

                                {/* Decor */}
                                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
                                <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
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

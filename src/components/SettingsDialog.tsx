import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Moon, Sun, Monitor, Dock, Sidebar as SidebarIcon, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

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
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(false);

    // Profile State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchUserProfile();
        }
    }, [isOpen]);

    const fetchUserProfile = async () => {
        setUserLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            // Only show error if we expected a user but got an auth error
            if (authError) showError("Failed to fetch user authentication details");
            setUserLoading(false);
            return;
        }

        setEmail(user.email || '');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "Row not found", which might happen if profile doesn't exist yet
            showError("Failed to fetch user profile data");
        }

        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
        }
        setUserLoading(false);
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            showError("No user logged in");
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            showError(error.message);
        } else {
            showSuccess("Profile updated successfully");
            // Reload to update the dashboard greeting
            window.location.reload();
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-[600px] gap-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="appearance" className="w-full">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none space-x-6 mb-6">
                        <TabsTrigger
                            value="appearance"
                            className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            Appearance
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            Account
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="rounded-none border-b-2 border-transparent px-2 py-2 text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            About
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="appearance" className="space-y-6 mt-0">
                        <div className="space-y-4">
                            <Label className="text-base">Theme</Label>
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

                        <div className="space-y-4">
                            <Label className="text-base">Navigation Layout</Label>
                            <RadioGroup
                                value={navigationMode}
                                onValueChange={(v) => onNavigationModeChange(v as NavigationMode)}
                                className="grid grid-cols-2 gap-4"
                            >
                                <label className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer",
                                    navigationMode === 'sidebar' && "border-primary bg-primary/5"
                                )}>
                                    <RadioGroupItem value="sidebar" className="sr-only" />
                                    <SidebarIcon className="mb-3 h-6 w-6 text-foreground" />
                                    <span className="text-sm font-medium">Sidebar</span>
                                </label>
                                <label className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer",
                                    navigationMode === 'dock' && "border-primary bg-primary/5"
                                )}>
                                    <RadioGroupItem value="dock" className="sr-only" />
                                    <Dock className="mb-3 h-6 w-6 text-foreground" />
                                    <span className="text-sm font-medium">Floating Dock</span>
                                </label>
                            </RadioGroup>
                        </div>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-6 mt-0">
                        {userLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
                                    </div>
                                    <Button onClick={handleUpdateProfile} disabled={loading} className="w-full sm:w-auto self-start">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Actions</h4>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                                            onClick={handleSignOut}
                                        >
                                            Sign Out
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="about" className="mt-0">
                        <div className="flex flex-col items-start justify-center space-y-6 py-4">
                            <div className="space-y-4 border-l-2 border-primary/20 pl-6 my-4">
                                <h3 className="font-serif text-4xl font-medium tracking-tight text-foreground">
                                    Folia
                                </h3>
                                <p className="text-lg text-muted-foreground font-serif leading-relaxed max-w-md italic">
                                    "A quiet operating system for the visual mind. Organizing chaos into a garden of ideas."
                                </p>
                            </div>

                            <div className="space-y-2 pl-6">
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Version</p>
                                <p className="font-mono text-sm">v0.2.0-beta</p>
                            </div>

                            <div className="space-y-2 pl-6 pt-4">
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Philosophy</p>
                                <p className="text-sm text-foreground/80 max-w-sm leading-relaxed">
                                    Designed with intentionality. Built to help you think, not just do.
                                    Everything in its place, giving you the space to breathe and create.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
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

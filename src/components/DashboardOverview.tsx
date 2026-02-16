import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast'; // Import showSuccess
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';


// Import all widgets
import WelcomeWidget from './dashboard/widgets/WelcomeWidget';
import ClockWidget from './dashboard/widgets/ClockWidget';
import DueTodayWidget from './dashboard/widgets/DueTodayWidget';
import InboxWidget from './dashboard/widgets/InboxWidget';
import NotesWidget from './dashboard/widgets/NotesWidget'; // Original Widget
import JournalWidget from './dashboard/widgets/JournalWidget';
import GoalsWidget from './dashboard/widgets/GoalsWidget';
import FlowWidget from './dashboard/widgets/FlowWidget';

// New Rich Media Widgets
import ImageWidget from './dashboard/widgets/ImageWidget';
import NoteWidget from './dashboard/widgets/NoteWidget'; // New Editable Note
import EmbedWidget from './dashboard/widgets/EmbedWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

type LayoutItem = Layout & { widget_type: string };
type CustomLayouts = { [breakpoint: string]: LayoutItem[] };
type WidgetDataMap = { [id: string]: any };

interface DashboardOverviewProps {
    firstName: string;
    onNavigate: (space: string) => void;
    isEditable: boolean;
    addWidgetTrigger: { type: string; w: number; h: number; minW: number; minH: number; mw: number; mh: number; } | null;
    onWidgetAdded: () => void;
    setSaveLayoutRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const widgetMap: { [key: string]: React.ComponentType<any> } = {
    Welcome: WelcomeWidget,
    Clock: ClockWidget,
    DueToday: DueTodayWidget,
    Inbox: InboxWidget,
    Notes: NotesWidget, // Keeping old one for backward compat if needed, but 'Note' will use new
    Journal: JournalWidget,
    Goals: GoalsWidget,
    Flow: FlowWidget,
    // New
    Image: ImageWidget,
    Note: NoteWidget, // The new one
    Embed: EmbedWidget
};

const widgetNavigationMap: { [key: string]: string } = {
    DueToday: 'Loom',
    Inbox: 'Loom',
    Notes: 'Garden',
    Journal: 'Journal',
    Goals: 'Horizon',
    Flow: 'Flow',
};

const generateDefaultLayouts = (): { layouts: CustomLayouts; widgetData: WidgetDataMap } => {
    // Generate unique IDs for each widget instance
    const welcomeId = uuidv4();
    const clockId = uuidv4();
    const dueTodayId = uuidv4();
    const flowId = uuidv4();
    const goalsId = uuidv4();
    const inboxId = uuidv4();

    // We are now only using 'lg' layout for consistency
    const layouts = {
        lg: [
            { i: welcomeId, widget_type: 'Welcome', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
            { i: flowId, widget_type: 'Flow', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
            { i: dueTodayId, widget_type: 'DueToday', x: 0, y: 4, w: 4, h: 6, minW: 3, minH: 4 },
            { i: clockId, widget_type: 'Clock', x: 4, y: 4, w: 4, h: 6, minW: 3, minH: 4 },
            { i: inboxId, widget_type: 'Inbox', x: 0, y: 10, w: 6, h: 8, minW: 3, minH: 6 },
            { i: goalsId, widget_type: 'Goals', x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 6 },
        ],
    };

    return { layouts, widgetData: {} };
};

const DashboardOverview = ({
    firstName,
    onNavigate,
    isEditable,
    addWidgetTrigger,
    onWidgetAdded,
    setSaveLayoutRef,
}: DashboardOverviewProps) => {
    const [layouts, setLayouts] = useState<CustomLayouts>({});
    const [widgetData, setWidgetData] = useState<WidgetDataMap>({});
    const [loading, setLoading] = useState(true);

    // Refs for safe access in callbacks/async
    const layoutsRef = useRef(layouts);
    const widgetDataRef = useRef(widgetData);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        layoutsRef.current = layouts;
    }, [layouts]);

    useEffect(() => {
        widgetDataRef.current = widgetData;
    }, [widgetData]);

    const createDefaultLayout = async (user_id: string) => {
        const { layouts: newLayouts, widgetData: newData } = generateDefaultLayouts();
        const payload = { layouts: newLayouts, widgetData: newData };

        const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id, layouts: payload });
        if (error) {
            showError('Could not create default layout.');
            return { layouts: newLayouts, widgetData: newData };
        }
        return { layouts: newLayouts, widgetData: newData };
    };

    const loadLayouts = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: layoutRow, error: layoutError } = await supabase
            .from('user_dashboard_layouts')
            .select('layouts')
            .eq('user_id', user.id)
            .single();

        if (layoutError && layoutError.code !== 'PGRST116') {
            showError('Could not load dashboard.');
            setLoading(false);
            return;
        }

        // Validation & Migration
        const layoutData = layoutRow?.layouts; // Extract the actual layout data from the row

        let finalLayouts: CustomLayouts = {};
        let finalWidgetData: WidgetDataMap = {};

        // 1. Check for New Structure: { layouts: { lg: [...] }, widgetData: { ... } }
        // We check for 'layouts.lg' to be sure it's the nested structure
        if (layoutData && layoutData.layouts && (layoutData.layouts.lg || layoutData.layouts.md || layoutData.layouts.sm)) {
            finalLayouts = layoutData.layouts;
            finalWidgetData = layoutData.widgetData || {};
        }
        // 2. Check for Legacy Structure: { lg: [...] } directly in the root
        else if (layoutData && (layoutData.lg || layoutData.md || layoutData.sm)) {
            console.log("Restoring legacy layout structure");
            finalLayouts = layoutData;
            finalWidgetData = {};
        }
        // 3. Fallback: Create Defaults
        else {
            console.warn("No valid layout found, creating defaults", layoutData);
            const defaults = await createDefaultLayout(user.id);
            finalLayouts = defaults.layouts;
            finalWidgetData = defaults.widgetData;
        }

        setLayouts(finalLayouts);
        setWidgetData(finalWidgetData);
        setLoading(false);
    };

    useEffect(() => {
        loadLayouts();
    }, []);

    useEffect(() => {
        if (addWidgetTrigger) {
            addNewWidget(addWidgetTrigger);
            onWidgetAdded();
            // Scroll to bottom after a short delay to allow layout to update
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [addWidgetTrigger]);

    const addNewWidget = (widget: NonNullable<DashboardOverviewProps['addWidgetTrigger']>) => {
        const newWidgetId = uuidv4();
        const newLayouts = JSON.parse(JSON.stringify(layouts));

        // Ensure we have 'lg' key
        if (!newLayouts.lg) {
            newLayouts.lg = [];
        }

        const keys = Object.keys(newLayouts).length > 0 ? Object.keys(newLayouts) : ['lg'];

        keys.forEach(breakpoint => {
            if (!newLayouts[breakpoint]) newLayouts[breakpoint] = [];
            newLayouts[breakpoint].push({
                i: newWidgetId,
                widget_type: widget.type,
                x: 0,
                y: Infinity, // Place at bottom
                w: widget.w,
                h: widget.h,
                minW: widget.minW,
                minH: widget.minH,
            });
        });

        setLayouts(newLayouts);
        // Initialize widget data if needed (optional)
        setWidgetData(prev => ({ ...prev, [newWidgetId]: {} }));
    };

    const handleRemoveWidget = useCallback((widgetId: string) => {
        const newLayouts = { ...layouts };
        for (const breakpoint in newLayouts) {
            newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetId);
        }
        setLayouts(newLayouts);

        // Clean up data
        const newData = { ...widgetData };
        delete newData[widgetId];
        setWidgetData(newData);
    }, [layouts, widgetData]);

    const handleLayoutChange = useCallback((_layout: Layout[], newLayouts: { [breakpoint: string]: Layout[] }) => {
        // We need to merge the new layout positions with the existing widget types
        setLayouts(prevLayouts => {
            const updatedLayouts: CustomLayouts = {};

            // Helper to find widget type from ANY previous breakpoint
            const getWidgetType = (id: string) => {
                for (const key in prevLayouts) {
                    const found = prevLayouts[key].find(item => item.i === id);
                    if (found) return found.widget_type;
                }
                return '';
            };

            for (const breakpoint in newLayouts) {
                updatedLayouts[breakpoint] = newLayouts[breakpoint].map(newItem => ({
                    ...newItem,
                    widget_type: getWidgetType(newItem.i)
                }));
            }
            return updatedLayouts;
        });
    }, []);

    const handleWidgetDataUpdate = (id: string, data: any) => {
        setWidgetData(prev => ({
            ...prev,
            [id]: data
        }));

        // Optional: Auto-save logic could go here if we wanted "live" saving
        // But for now we stick to "Save Layout" to persist everything
    };

    const saveLayoutToDatabase = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            layouts: layoutsRef.current,
            widgetData: widgetDataRef.current
        };

        const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id: user.id, layouts: payload });
        if (error) {
            showError('Could not save layout changes.');
            throw new Error(error.message);
        } else {
            // Usually handled by wrapper but good to log
            // showSuccess('Layout saved'); 
        }
    }, []);

    useEffect(() => {
        if (setSaveLayoutRef) {
            setSaveLayoutRef.current = saveLayoutToDatabase;
        }
    }, [saveLayoutToDatabase, setSaveLayoutRef]);

    const handleWidgetClick = (e: React.MouseEvent, widgetType: string) => {
        if (isEditable) return;

        // Don't navigate if clicking inputs/buttons inside widgets
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, label, [role="checkbox"], a, .nodrag')) return;

        const space = widgetNavigationMap[widgetType];
        if (space) onNavigate(space);
    };

    if (loading) {
        return <Skeleton className="h-[500px] w-full" />;
    }

    const activeLayoutKey = layouts.lg ? 'lg' : Object.keys(layouts)[0];
    const rawLayoutItems = layouts[activeLayoutKey];
    const activeLayoutItems = Array.isArray(rawLayoutItems) ? rawLayoutItems : [];

    return (
        <div ref={containerRef} className="w-full pb-32">
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 0 }}
                cols={{ lg: 12 }}
                rowHeight={30}
                onLayoutChange={handleLayoutChange}
                isDraggable={isEditable}
                isResizable={isEditable}
                compactType="vertical"
                preventCollision={false}
                isBounded={false}
                margin={[16, 16]}
                containerPadding={[0, 0]}
            >
                {activeLayoutItems.map(item => {
                    const WidgetComponent = item.widget_type ? widgetMap[item.widget_type] : null;
                    return (
                        <div
                            key={item.i}
                            className={cn(
                                "relative group bg-card rounded-lg border border-zinc-400/80 dark:border-zinc-600 shadow-sm overflow-hidden",
                                isEditable && "select-none cursor-move hover:border-dashed hover:border-primary/50"
                            )}
                            onClick={(e) => handleWidgetClick(e, item.widget_type)}
                        >
                            {isEditable && (
                                <div className="absolute top-2 right-2 z-50 flex gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-6 w-6 shadow-md"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveWidget(item.i); }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            {WidgetComponent ? (
                                <WidgetComponent
                                    firstName={firstName}
                                    onNavigate={onNavigate}
                                    data={widgetData[item.i] || {}}
                                    onUpdate={(newData: any) => handleWidgetDataUpdate(item.i, newData)}
                                    isEditable={isEditable} /* For ImageWidget overlay */
                                    isEditableLayout={isEditable} /* For NoteWidget drag class */
                                />
                            ) : (
                                <div className="p-4">Unknown Widget</div>
                            )}
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </div>
    );
};

export default DashboardOverview;

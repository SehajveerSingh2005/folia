import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

// Import all widgets
import WelcomeWidget from './dashboard/widgets/WelcomeWidget';
import ClockWidget from './dashboard/widgets/ClockWidget';
import DueTodayWidget from './dashboard/widgets/DueTodayWidget';
import InboxWidget from './dashboard/widgets/InboxWidget';
import NotesWidget from './dashboard/widgets/NotesWidget';
import JournalWidget from './dashboard/widgets/JournalWidget';
import GoalsWidget from './dashboard/widgets/GoalsWidget';
import FlowWidget from './dashboard/widgets/FlowWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

type LayoutItem = Layout & { widget_type: string };
type CustomLayouts = { [breakpoint: string]: LayoutItem[] };

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
    Notes: NotesWidget,
    Journal: JournalWidget,
    Goals: GoalsWidget,
    Flow: FlowWidget,
};

const widgetNavigationMap: { [key: string]: string } = {
    DueToday: 'Loom',
    Inbox: 'Loom',
    Notes: 'Garden',
    Journal: 'Journal',
    Goals: 'Horizon',
    Flow: 'Flow',
};

const generateDefaultLayouts = (): CustomLayouts => {
    // Generate unique IDs for each widget instance
    const welcomeId = uuidv4();
    const clockId = uuidv4();
    const dueTodayId = uuidv4();
    const flowId = uuidv4();
    const goalsId = uuidv4();
    const inboxId = uuidv4();

    // We are now only using 'lg' layout for consistency
    return {
        lg: [
            { i: welcomeId, widget_type: 'Welcome', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
            { i: flowId, widget_type: 'Flow', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
            { i: dueTodayId, widget_type: 'DueToday', x: 0, y: 4, w: 4, h: 6, minW: 3, minH: 4 },
            { i: clockId, widget_type: 'Clock', x: 4, y: 4, w: 4, h: 6, minW: 3, minH: 4 },
            { i: inboxId, widget_type: 'Inbox', x: 0, y: 10, w: 6, h: 8, minW: 3, minH: 6 },
            { i: goalsId, widget_type: 'Goals', x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 6 },
        ],
    };
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
    const [loading, setLoading] = useState(true);
    const layoutsRef = useRef(layouts);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        layoutsRef.current = layouts;
    }, [layouts]);

    const createDefaultLayout = async (user_id: string) => {
        const newDefaultLayouts = generateDefaultLayouts();
        const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id, layouts: newDefaultLayouts });
        if (error) {
            showError('Could not create default layout.');
            return {};
        }
        return newDefaultLayouts;
    };

    const loadLayouts = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: layoutData, error: layoutError } = await supabase
            .from('user_dashboard_layouts')
            .select('layouts')
            .eq('user_id', user.id)
            .single();

        if (layoutError && layoutError.code !== 'PGRST116') {
            showError('Could not load dashboard.');
            setLoading(false);
            return;
        }

        // Validation
        const isLayoutValid = layoutData &&
            layoutData.layouts &&
            typeof layoutData.layouts === 'object' &&
            !Array.isArray(layoutData.layouts) &&
            Object.keys(layoutData.layouts).length > 0;

        if (isLayoutValid) {
            // Ensure we just use what's there, but handle legacy multiple breakpoints if needed
            // Ideally we normalize to 'lg' if we want strictly one
            // But passing the whole object is fine as long as 'lg' exists
            setLayouts({ ...layoutData.layouts } as CustomLayouts);
        } else {
            const newLayouts = await createDefaultLayout(user.id);
            setLayouts(newLayouts);
        }
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

        // We only care about adding to 'lg' now since we locked the breakpoint
        // But we iterate just in case legacy data has others
        // Actually, let's just force add to 'lg' and any others present
        const keys = Object.keys(newLayouts).length > 0 ? Object.keys(newLayouts) : ['lg'];

        keys.forEach(breakpoint => {
            // Initialize if missing (shouldn't happen for lg if we follow pattern)
            if (!newLayouts[breakpoint]) newLayouts[breakpoint] = [];

            newLayouts[breakpoint].push({
                i: newWidgetId,
                widget_type: widget.type,
                x: 0,
                y: Infinity, // Place at bottom
                w: widget.w, // Use w from sheet (now 4 or 6)
                h: widget.h,
                minW: widget.minW,
                minH: widget.minH,
            });
        });

        setLayouts(newLayouts);
    };

    const handleRemoveWidget = useCallback((widgetId: string) => {
        const newLayouts = { ...layouts };
        for (const breakpoint in newLayouts) {
            newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetId);
        }
        setLayouts(newLayouts);
    }, [layouts]);

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

    const saveLayoutToDatabase = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id: user.id, layouts: layoutsRef.current });
        if (error) {
            showError('Could not save layout changes.');
            throw new Error(error.message);
        }
    }, []);

    useEffect(() => {
        if (setSaveLayoutRef) {
            setSaveLayoutRef.current = saveLayoutToDatabase;
        }
    }, [saveLayoutToDatabase, setSaveLayoutRef]);

    const handleWidgetClick = (e: React.MouseEvent, widgetType: string) => {
        if (isEditable) return;
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, label, [role="checkbox"], a')) return;
        const space = widgetNavigationMap[widgetType];
        if (space) onNavigate(space);
    };

    if (loading) {
        return <Skeleton className="h-[500px] w-full" />;
    }

    // Get items to render from 'lg' layout
    // We prioritize 'lg', fallback to first available key
    const activeLayoutKey = layouts.lg ? 'lg' : Object.keys(layouts)[0];
    const activeLayoutItems = layouts[activeLayoutKey] || [];

    return (
        <div ref={containerRef} className="w-full">
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
                                "relative group bg-card rounded-lg border border-border shadow-sm",
                                isEditable && "select-none cursor-move hover:border-dashed hover:border-primary/50"
                            )}
                            onClick={(e) => handleWidgetClick(e, item.widget_type)}
                        >
                            {isEditable && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveWidget(item.i); }}
                                    onMouseDown={(e) => e.stopPropagation()} // Stop drag start on button click
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            {WidgetComponent ? <WidgetComponent firstName={firstName} onNavigate={onNavigate} /> : <div>Unknown Widget</div>}
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </div>
    );
};

export default DashboardOverview;

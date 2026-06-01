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
import GoogleCalendarWidget from './dashboard/widgets/GoogleCalendarWidget';
import GitHubWidget from './dashboard/widgets/GitHubWidget';
import GitHubHeatmapWidget from './dashboard/widgets/GitHubHeatmapWidget';
import GitHubPRsWidget from './dashboard/widgets/GitHubPRsWidget';
import GitHubIssuesWidget from './dashboard/widgets/GitHubIssuesWidget';

const LOCAL_STORAGE_KEY = 'dashboard_layout_data';

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
    Embed: EmbedWidget,
    GoogleCalendar: GoogleCalendarWidget,
    GitHub: GitHubWidget,
    GitHubHeatmap: GitHubHeatmapWidget,
    GitHubPRs: GitHubPRsWidget,
    GitHubIssues: GitHubIssuesWidget
};

const widgetNavigationMap: { [key: string]: string } = {
    DueToday: 'Tasks',
    Inbox: 'Tasks',
    Notes: 'Notes',
    Journal: 'Journal',
    Goals: 'Goals',
    Flow: 'Projects',
};

const generateDefaultLayouts = (): { layouts: CustomLayouts; widgetData: WidgetDataMap } => {
    // Generate static IDs for default layout to ensure stability
    const welcomeId = 'widget-welcome-default';
    const flowId = 'widget-flow-default';
    const dueTodayId = 'widget-duetoday-default';
    const clockId = 'widget-clock-default';
    const inboxId = 'widget-inbox-default';
    const goalsId = 'widget-goals-default';
    const imageId = 'widget-image-default';
    const noteId = 'widget-note-default';
    const journalId = 'widget-journal-default';

    const layouts = {
        lg: [
            { h: 4, i: welcomeId, w: 4, x: 0, y: 0, minH: 4, minW: 3, widget_type: "Welcome" },
            { h: 6, i: flowId, w: 4, x: 4, y: 0, minH: 6, minW: 3, widget_type: "Flow" },
            { h: 6, i: dueTodayId, w: 4, x: 0, y: 11, minH: 4, minW: 3, widget_type: "DueToday" },
            { h: 4, i: clockId, w: 4, x: 4, y: 6, minH: 4, minW: 3, widget_type: "Clock" },
            { h: 7, i: inboxId, w: 4, x: 0, y: 4, minH: 6, minW: 3, widget_type: "Inbox" },
            { h: 6, i: goalsId, w: 4, x: 8, y: 0, minH: 6, minW: 3, widget_type: "Goals" },
            { h: 6, i: imageId, w: 4, x: 8, y: 6, minH: 4, minW: 2, widget_type: "Image" },
            { h: 5, i: noteId, w: 4, x: 8, y: 12, minH: 3, minW: 3, widget_type: "Note" },
            { h: 7, i: journalId, w: 4, x: 4, y: 10, minH: 6, minW: 4, widget_type: "Journal" }
        ],
    };

    const widgetData = {
        [journalId]: {},
        [noteId]: {
            "font": "serif",
            "color": "green",
            "content": "Let's Do it",
            "fontSize": 64,
            "isItalic": true,
            "textAlign": "left",
            "isVerticalCenter": true
        },
        [clockId]: {
            "fontSize": 64,
            "isItalic": true,
            "format24h": false,
            "fontFamily": "font-serif",
            "showSeconds": false
        },
        [imageId]: {
            "url": "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2674&auto=format&fit=crop",
            "scale": 1,
            "position": {
                "x": 40.666656494140625,
                "y": 100
            }
        }
    };

    return { layouts, widgetData };
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
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    // Refs for safe access in callbacks/async
    const layoutsRef = useRef(layouts);
    const widgetDataRef = useRef(widgetData);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        let hasLocal = false;
        // 1. Try to load from LocalStorage for instant render
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.layouts) {
                    setLayouts(parsed.layouts);
                    if (parsed.widgetData) setWidgetData(parsed.widgetData);
                    hasLocal = true;
                }
            } catch (e) {
                console.error("Failed to parse local layout", e);
            }
        }

        if (!hasLocal) {
            // Initial render fallback if no local storage
            const { layouts: defL, widgetData: defD } = generateDefaultLayouts();
            setLayouts(defL);
            setWidgetData(defD);
        }

        setIsLayoutReady(true);

        // 2. Then load from DB to sync (source of truth)
        loadLayouts();
    }, []);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (Object.keys(layouts).length > 0) {
            const dataToSave = { layouts, widgetData };
            console.log(">>> CURRENT LAYOUT JSON (Copy this):", JSON.stringify(dataToSave));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        }
    }, [layouts, widgetData]);

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
        setWidgetData(prev => {
            const newData = {
                ...prev,
                [id]: data
            };

            // Auto-save logic for immediate widget settings updates
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            autoSaveTimeoutRef.current = setTimeout(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const payload = {
                    layouts: layoutsRef.current,
                    widgetData: newData
                };

                const { error } = await supabase.from('user_dashboard_layouts').upsert({ user_id: user.id, layouts: payload });
                if (error) console.error("Auto-save widget data failed:", error);
            }, 1000);

            return newData;
        });
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

    const activeLayoutKey = layouts.lg ? 'lg' : Object.keys(layouts)[0];
    const rawLayoutItems = layouts[activeLayoutKey];
    const activeLayoutItems = Array.isArray(rawLayoutItems) ? rawLayoutItems : [];

    return (
        <div ref={containerRef} className={cn("w-full pb-32 transition-opacity duration-300", isLayoutReady ? "opacity-100" : "opacity-0")}>
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
                {activeLayoutItems.map((item, index) => {
                    const WidgetComponent = item.widget_type ? widgetMap[item.widget_type] : null;
                    return (
                        <div
                            key={item.i}
                            className={cn(
                                // Outer container for RGL mapping
                                "relative",
                                isEditable && "z-10" // Ensure editable items are clickable/draggable
                            )}
                            onClick={(e) => handleWidgetClick(e, item.widget_type)}
                        >
                            <div
                                className={cn(
                                    "h-full w-full bg-card rounded-lg border border-zinc-400/80 dark:border-zinc-600 shadow-sm overflow-hidden group",
                                    "animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both",
                                    isEditable && "select-none cursor-move hover:border-dashed hover:border-primary/50"
                                )}
                                style={{ animationDelay: `${index * 75}ms` }}
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
                        </div>
                    );
                })}
            </ResponsiveGridLayout >
        </div >
    );
};

export default DashboardOverview;

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
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

// Widget configuration
type WidgetSize = 'small' | 'medium' | 'large' | 'wide';
type WidgetType = 'Welcome' | 'Clock' | 'DueToday' | 'Inbox' | 'Notes' | 'Journal' | 'Goals' | 'Flow';

interface WidgetConfig {
    id: string;
    type: WidgetType;
    size: WidgetSize;
    order: number;
}

interface DashboardOverviewProps {
    firstName: string;
    onNavigate: (space: string) => void;
    isEditable: boolean;
    addWidgetTrigger: { type: string; size?: WidgetSize } | null;
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

// Default widget configurations
const generateDefaultWidgets = (): WidgetConfig[] => [
    { id: uuidv4(), type: 'Welcome', size: 'wide', order: 0 },
    { id: uuidv4(), type: 'Clock', size: 'small', order: 1 },
    { id: uuidv4(), type: 'DueToday', size: 'medium', order: 2 },
    { id: uuidv4(), type: 'Flow', size: 'large', order: 3 },
    { id: uuidv4(), type: 'Inbox', size: 'large', order: 4 },
    { id: uuidv4(), type: 'Goals', size: 'large', order: 5 },
];

const DashboardOverview = ({
    firstName,
    onNavigate,
    isEditable,
    addWidgetTrigger,
    onWidgetAdded,
    setSaveLayoutRef,
}: DashboardOverviewProps) => {
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
    const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);

    // Load widgets from database
    const loadWidgets = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: layoutData, error } = await supabase
            .from('user_dashboard_layouts')
            .select('widgets')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            showError('Could not load dashboard.');
            setLoading(false);
            return;
        }

        if (layoutData?.widgets && Array.isArray(layoutData.widgets)) {
            setWidgets(layoutData.widgets as WidgetConfig[]);
        } else {
            const defaultWidgets = generateDefaultWidgets();
            await saveWidgets(user.id, defaultWidgets);
            setWidgets(defaultWidgets);
        }
        setLoading(false);
    };

    // Save widgets to database
    const saveWidgets = async (userId: string, widgetsToSave: WidgetConfig[]) => {
        const { error } = await supabase
            .from('user_dashboard_layouts')
            .upsert({ user_id: userId, widgets: widgetsToSave });

        if (error) {
            showError('Could not save layout changes.');
            throw new Error(error.message);
        }
    };

    const saveLayoutToDatabase = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await saveWidgets(user.id, widgets);
    }, [widgets]);

    useEffect(() => {
        loadWidgets();
    }, []);

    useEffect(() => {
        if (setSaveLayoutRef) {
            setSaveLayoutRef.current = saveLayoutToDatabase;
        }
    }, [saveLayoutToDatabase, setSaveLayoutRef]);

    // Add new widget
    useEffect(() => {
        if (addWidgetTrigger) {
            const newWidget: WidgetConfig = {
                id: uuidv4(),
                type: addWidgetTrigger.type as WidgetType,
                size: addWidgetTrigger.size || 'medium',
                order: widgets.length,
            };
            setWidgets([...widgets, newWidget]);
            onWidgetAdded();
        }
    }, [addWidgetTrigger]);

    // Remove widget
    const handleRemoveWidget = useCallback((widgetId: string) => {
        setWidgets(prev => prev.filter(w => w.id !== widgetId));
    }, []);

    // Drag and drop handlers
    const handleDragStart = (widgetId: string) => {
        if (!isEditable) return;
        setDraggedWidget(widgetId);
    };

    const handleDragOver = (e: React.DragEvent, widgetId: string) => {
        e.preventDefault();
        if (!isEditable || !draggedWidget) return;
        setDragOverWidget(widgetId);
    };

    const handleDrop = (targetWidgetId: string) => {
        if (!isEditable || !draggedWidget || draggedWidget === targetWidgetId) {
            setDraggedWidget(null);
            setDragOverWidget(null);
            return;
        }

        const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
        const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

        const newWidgets = [...widgets];
        const [movedWidget] = newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(targetIndex, 0, movedWidget);

        // Update orders
        const reorderedWidgets = newWidgets.map((w, index) => ({ ...w, order: index }));
        setWidgets(reorderedWidgets);

        setDraggedWidget(null);
        setDragOverWidget(null);
    };

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

    // Sort widgets by order
    const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
            {sortedWidgets.map(widget => {
                const WidgetComponent = widgetMap[widget.type];
                if (!WidgetComponent) return null;

                return (
                    <div
                        key={widget.id}
                        draggable={isEditable}
                        onDragStart={() => handleDragStart(widget.id)}
                        onDragOver={(e) => handleDragOver(e, widget.id)}
                        onDrop={() => handleDrop(widget.id)}
                        onClick={(e) => handleWidgetClick(e, widget.type)}
                        className={cn(
                            "relative group rounded-lg border border-border bg-card overflow-hidden transition-all",
                            // Size classes
                            widget.size === 'small' && "md:col-span-1 min-h-[200px]",
                            widget.size === 'medium' && "md:col-span-1 min-h-[300px]",
                            widget.size === 'large' && "md:col-span-2 lg:col-span-1 min-h-[400px]",
                            widget.size === 'wide' && "md:col-span-2 lg:col-span-3 min-h-[200px]",
                            // Drag states
                            isEditable && "cursor-move hover:shadow-lg hover:border-primary/50",
                            draggedWidget === widget.id && "opacity-50",
                            dragOverWidget === widget.id && "ring-2 ring-primary",
                            !isEditable && widgetNavigationMap[widget.type] && "cursor-pointer hover:shadow-md hover:border-primary/30"
                        )}
                    >
                        {isEditable && (
                            <>
                                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-background/80 backdrop-blur-sm rounded p-1">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveWidget(widget.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <div className="h-full overflow-auto">
                            <WidgetComponent firstName={firstName} onNavigate={onNavigate} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DashboardOverview;

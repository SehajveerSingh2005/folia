import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Clock,
  StickyNote,
  BookOpen,
  Telescope,
  Smile,
  Inbox,
  CalendarCheck,
  FolderKanban,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';

// --- Widget Previews ---
const WelcomePreview = () => (
  <div className="p-4 text-center">
    <p className="text-lg font-serif">Good morning, User.</p>
    <p className="text-xs text-muted-foreground">It's a new day.</p>
  </div>
);

const ClockPreview = () => (
  <div className="p-4 text-center">
    <p className="text-3xl font-mono">10:30</p>
  </div>
);

const DueTodayPreview = () => (
  <div className="p-4 space-y-2">
    <div className="flex items-center gap-2"><Checkbox checked disabled /><p className="text-xs">Finalize report</p></div>
    <div className="flex items-center gap-2"><Checkbox disabled /><p className="text-xs">Call team lead</p></div>
  </div>
);

const InboxPreview = () => (
  <div className="p-4 space-y-2">
    <div className="flex items-center gap-2"><Checkbox disabled /><p className="text-xs">Buy groceries</p></div>
    <div className="flex items-center gap-2"><Checkbox disabled /><p className="text-xs">Reply to email</p></div>
  </div>
);

const NotesPreview = () => (
  <div className="p-4">
    <p className="text-xs italic text-muted-foreground">"A quick thought about..."</p>
  </div>
);

const JournalPreview = () => (
  <div className="p-4 text-center">
    <p className="text-3xl">😊</p>
    <p className="text-xs text-muted-foreground mt-1">"Had a great day..."</p>
  </div>
);

const GoalsPreview = () => (
  <div className="p-4 space-y-2">
    <p className="text-xs font-medium">Learn Rust</p>
    <p className="text-xs font-medium">Launch SaaS</p>
  </div>
);

const FlowPreview = () => (
  <div className="p-4 space-y-2">
    <div>
      <p className="text-xs font-medium">Website Redesign</p>
      <Progress value={75} className="h-2 mt-1" />
    </div>
    <div>
      <p className="text-xs font-medium">Q3 Report</p>
      <Progress value={20} className="h-2 mt-1" />
    </div>
  </div>
);

// --- Widget Definitions ---
export const availableWidgets = [
  { type: 'Welcome', name: 'Welcome Greeting', icon: Smile, description: 'A personalized greeting for your day.', w: 8, h: 2, minW: 6, minH: 2, mw: 4, mh: 2, preview: <WelcomePreview /> },
  { type: 'Clock', name: 'Clock', icon: Clock, description: 'A simple, elegant digital clock.', w: 4, h: 2, minW: 3, minH: 2, mw: 4, mh: 2, preview: <ClockPreview /> },
  { type: 'DueToday', name: 'Due Today', icon: CalendarCheck, description: 'See all tasks that are due today.', w: 6, h: 6, minW: 4, minH: 5, mw: 2, mh: 6, preview: <DueTodayPreview /> },
  { type: 'Inbox', name: 'Task Inbox', icon: Inbox, description: 'Quickly add and manage your inbox tasks.', w: 6, h: 6, minW: 4, minH: 5, mw: 2, mh: 6, preview: <InboxPreview /> },
  { type: 'Notes', name: 'Quick Note', icon: StickyNote, description: 'Jot down a quick thought for your Garden.', w: 6, h: 5, minW: 4, minH: 4, mw: 4, mh: 5, preview: <NotesPreview /> },
  { type: 'Journal', name: 'Journal', icon: BookOpen, description: 'A prompt for your daily journal entry.', w: 6, h: 5, minW: 4, minH: 4, mw: 4, mh: 5, preview: <JournalPreview /> },
  { type: 'Goals', name: 'Goals Overview', icon: Telescope, description: 'A glimpse of your long-term Horizon goals.', w: 6, h: 5, minW: 4, minH: 4, mw: 4, mh: 5, preview: <GoalsPreview /> },
  { type: 'Flow', name: 'Active Projects', icon: FolderKanban, description: 'Track the progress of your active projects.', w: 6, h: 5, minW: 4, minH: 4, mw: 4, mh: 5, preview: <FlowPreview /> },
];

interface AddWidgetSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddWidget: (widget: typeof availableWidgets[0]) => void;
}

const AddWidgetSheet = ({
  isOpen,
  onOpenChange,
  onAddWidget,
}: AddWidgetSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Widget Library</SheetTitle>
          <SheetDescription>
            Choose a widget to add to your dashboard.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 grid-cols-1 sm:grid-cols-2">
          {availableWidgets.map((widget) => (
            <Card key={widget.type} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <widget.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="font-sans font-medium text-base">{widget.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground pt-2">{widget.description}</p>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center bg-secondary/30 rounded-b-md border-t">
                <div className="w-full h-32 scale-90">{widget.preview}</div>
              </CardContent>
              <Button
                className="w-full rounded-t-none"
                onClick={() => {
                  onAddWidget(widget);
                  onOpenChange(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Dashboard
              </Button>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetSheet;
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
} from 'lucide-react';

export const availableWidgets = [
  { type: 'Welcome', name: 'Welcome Greeting', icon: Smile, w: 8, h: 2, mw: 4, mh: 2 },
  { type: 'Clock', name: 'Clock', icon: Clock, w: 4, h: 2, mw: 2, mh: 2 },
  { type: 'DueToday', name: 'Due Today', icon: CalendarCheck, w: 6, h: 4, mw: 2, mh: 4 },
  { type: 'Inbox', name: 'Task Inbox', icon: Inbox, w: 6, h: 4, mw: 2, mh: 4 },
  { type: 'Notes', name: 'Quick Note', icon: StickyNote, w: 6, h: 4, mw: 4, mh: 4 },
  { type: 'Journal', name: 'Journal Prompt', icon: BookOpen, w: 6, h: 3, mw: 4, mh: 3 },
  { type: 'Goals', name: 'Goals Overview', icon: Telescope, w: 6, h: 3, mw: 4, mh: 3 },
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a new widget</SheetTitle>
          <SheetDescription>
            Choose a widget to add to your dashboard.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {availableWidgets.map((widget) => (
            <Button
              key={widget.type}
              variant="outline"
              className="w-full justify-start h-14"
              onClick={() => {
                onAddWidget(widget);
                onOpenChange(false);
              }}
            >
              <widget.icon className="mr-4 h-6 w-6 text-primary" />
              <span className="text-lg">{widget.name}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetSheet;
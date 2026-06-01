import { useState } from 'react';
import { Calendar, RefreshCw, Settings, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  time: string;
  duration: string;
  color: string;
  calendar: string;
  link?: string;
}

const DEFAULT_EVENTS: Event[] = [
  { id: '1', title: 'Weekly Team Sync', time: '09:30 AM', duration: '45m', color: 'bg-blue-500', calendar: 'Work' },
  { id: '2', title: 'Lunch with Sarah', time: '12:30 PM', duration: '1h', color: 'bg-emerald-500', calendar: 'Personal' },
  { id: '3', title: 'Design Review & Feedback', time: '02:00 PM', duration: '1h 30m', color: 'bg-violet-500', calendar: 'Work', link: 'https://meet.google.com' },
  { id: '4', title: 'Evening Run / Gym', time: '06:30 PM', duration: '45m', color: 'bg-amber-500', calendar: 'Fitness' },
];

const GoogleCalendarWidget = ({ data, onUpdate, isEditable }: any) => {
  const isConnected = data.isConnected ?? false;
  const showCalendars = data.showCalendars ?? ['Work', 'Personal', 'Fitness'];
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate OAuth connection
    setTimeout(() => {
      onUpdate({
        ...data,
        isConnected: true,
        showCalendars: ['Work', 'Personal', 'Fitness'],
      });
      setIsConnecting(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    onUpdate({
      ...data,
      isConnected: false,
    });
    setShowSettings(false);
  };

  const toggleCalendar = (cal: string) => {
    const next = showCalendars.includes(cal)
      ? showCalendars.filter((c: string) => c !== cal)
      : [...showCalendars, cal];
    onUpdate({
      ...data,
      showCalendars: next,
    });
  };

  const filteredEvents = DEFAULT_EVENTS.filter(e => showCalendars.includes(e.calendar));

  return (
    <div className="h-full flex flex-col p-4 bg-card text-card-foreground select-none">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-serif font-medium text-sm tracking-wide">Google Calendar</span>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5 nodrag">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto pt-3">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-full">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium">Connect your Google Calendar</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                See your daily schedule and join virtual meetings directly from Folia.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnect}
              disabled={isConnecting}
              className="h-8 text-xs font-medium nodrag border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Account'
              )}
            </Button>
          </div>
        ) : showSettings ? (
          <div className="space-y-4 nodrag">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Visible Calendars</span>
              <div className="mt-2 space-y-1.5">
                {['Work', 'Personal', 'Fitness'].map(cal => {
                  const active = showCalendars.includes(cal);
                  return (
                    <button
                      key={cal}
                      onClick={() => toggleCalendar(cal)}
                      className="w-full flex items-center justify-between p-2 rounded-md border text-xs text-left bg-background/50 hover:bg-accent transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          cal === 'Work' ? 'bg-blue-500' : cal === 'Personal' ? 'bg-emerald-500' : 'bg-amber-500'
                        )} />
                        {cal}
                      </span>
                      {active && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full h-8 text-xs font-medium"
            >
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors group">
                  <div className={cn("w-1 h-8 rounded-full shrink-0 mt-0.5", event.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-normal truncate">{event.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span>{event.time}</span>
                      <span>·</span>
                      <span>{event.duration}</span>
                    </div>
                  </div>
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-accent transition-all nodrag shrink-0 self-center"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No events scheduled for today.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarWidget;

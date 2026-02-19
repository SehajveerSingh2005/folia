import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, Italic, Type } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface ClockWidgetProps {
  data: {
    fontFamily?: string;
    fontSize?: number;
    format24h?: boolean;
    showSeconds?: boolean;
    isItalic?: boolean;
  };
  onUpdate: (data: any) => void;
  isEditable: boolean;
}

const ClockWidget = ({ data, onUpdate, isEditable }: ClockWidgetProps) => {
  const [time, setTime] = useState(new Date());

  // Default values
  const fontFamily = data.fontFamily || 'font-serif';
  const fontSize = data.fontSize || 64;
  const format24h = data.format24h || false;
  const showSeconds = data.showSeconds || false;
  // Default italic to true if undefined, since it was the original style
  const isItalic = data.isItalic !== undefined ? data.isItalic : true;

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const updateSettings = (updates: any) => {
    onUpdate({ ...data, ...updates });
  };

  return (
    <Card className="w-full h-full border-none shadow-none relative group bg-transparent">
      <CardContent className="p-6 flex items-center justify-center h-full relative">
        <div
          className={cn(
            "text-center font-medium transition-all duration-300",
            fontFamily,
            isItalic && "italic"
          )}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
        >
          {time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: showSeconds ? '2-digit' : undefined,
            hour12: !format24h
          })}
        </div>

        {/* Settings Trigger */}
        <div className={cn(
          "absolute top-2 left-2 transition-opacity z-20",
          isEditable ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted/50">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
              <div className="flex flex-col gap-4">
                {/* Font Selection */}
                <ToggleGroup type="single" value={fontFamily} onValueChange={(v) => v && updateSettings({ fontFamily: v })}>
                  <ToggleGroupItem value="font-sans" aria-label="Sans-serif" className="h-8 w-8 p-0">
                    <span className="font-sans text-lg">Ag</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="font-serif" aria-label="Serif" className="h-8 w-8 p-0">
                    <span className="font-serif text-lg">Ag</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="font-mono" aria-label="Monospace" className="h-8 w-8 p-0">
                    <span className="font-mono text-sm">Ag</span>
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Size Slider */}
                <div className="flex items-center gap-3">
                  <Type className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Slider
                    defaultValue={[fontSize]}
                    max={120}
                    min={24}
                    step={4}
                    onValueChange={(vals) => updateSettings({ fontSize: vals[0] })}
                    className="flex-1"
                  />
                </div>

                {/* Toggles */}
                <div className="flex justify-between items-center gap-1">
                  <Toggle
                    size="sm"
                    pressed={isItalic}
                    onPressedChange={(v) => updateSettings({ isItalic: v })}
                    aria-label="Toggle Italic"
                    className="h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Toggle
                    size="sm"
                    pressed={format24h}
                    onPressedChange={(v) => updateSettings({ format24h: v })}
                    aria-label="Toggle 24h"
                    className="h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    <span className="text-xs font-bold leading-none">24H</span>
                  </Toggle>

                  <Toggle
                    size="sm"
                    pressed={showSeconds}
                    onPressedChange={(v) => updateSettings({ showSeconds: v })}
                    aria-label="Toggle Seconds"
                    className="h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    <span className="text-xs font-bold leading-none">:00</span>
                  </Toggle>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClockWidget;
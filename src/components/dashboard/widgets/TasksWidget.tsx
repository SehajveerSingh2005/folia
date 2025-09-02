import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { showError } from '@/utils/toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

type EnrichedLedgerItem = {
  id: string;
  content: string;
  is_done: boolean;
  loom_item_name: string | null;
};

type LoomItem = {
  id: string;
  name: string;
};

const TasksWidget = () => {
  const [tasks, setTasks] = useState<EnrichedLedgerItem[]>([]);
  const [loomItems, setLoomItems] = useState<LoomItem[]>([]);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [selectedLoomItem, setSelectedLoomItem] = useState<LoomItem | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const fetchData = async () => {
    const { data: taskData, error: taskError } = await supabase
      .from('ledger_items')
      .select('id, content, is_done, loom_item_id')
      .eq('is_done', false)
      .limit(20)
      .order('created_at', { ascending: true });

    if (taskError) console.error('Error fetching tasks:', taskError);

    const { data: loomData, error: loomError } = await supabase
      .from('loom_items')
      .select('id, name')
      .neq('status', 'Completed');
    
    if (loomError) console.error('Error fetching loom items:', loomError);
    else if (loomData) setLoomItems(loomData);

    if (taskData && loomData) {
      const enrichedTasks = taskData.map(task => {
        const loomItem = loomData.find(item => item.id === task.loom_item_id);
        return {
          ...task,
          loom_item_name: loomItem ? loomItem.name : null
        };
      });
      setTasks(enrichedTasks);
    } else if (taskData) {
      setTasks(taskData.map(t => ({...t, loom_item_name: null})));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const current = scrollContainerRef.current;
      if (current) setIsOverflowing(current.scrollHeight > current.clientHeight);
    };
    const timeoutId = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timeoutId);
  }, [tasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskContent.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('ledger_items')
      .insert({ 
        content: newTaskContent, 
        user_id: user.id, 
        type: 'Task',
        loom_item_id: selectedLoomItem?.id || null
      });

    if (error) showError(error.message);
    else {
      setNewTaskContent('');
      setSelectedLoomItem(null);
      fetchData();
    }
  };

  const handleToggleTask = async (taskId: string, isDone: boolean) => {
    const newStatus = !isDone;
    const { error } = await supabase
      .from('ledger_items')
      .update({
        is_done: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) showError(error.message);
    else fetchData();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium text-base sm:text-lg">Tasks</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your upcoming tasks.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <div className="relative flex-grow overflow-hidden">
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto pr-2 space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.is_done}
                  onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
                />
                <label htmlFor={`task-${task.id}`} className="text-xs sm:text-sm flex-grow">
                  {task.content}
                </label>
                {task.loom_item_name && <Badge variant="secondary">{task.loom_item_name}</Badge>}
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">All tasks complete!</p>}
          </div>
          {isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
        <form onSubmit={handleAddTask} className="flex-shrink-0 flex flex-col gap-2 mt-4 pt-2 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Add a task..."
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
            />
            {loomItems.length > 0 && (
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-56" onClick={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Link to..." />
                    <CommandList>
                      <CommandEmpty>No items found.</CommandEmpty>
                      <CommandGroup>
                        {loomItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name}
                            onSelect={() => {
                              setSelectedLoomItem(item);
                              setIsPopoverOpen(false);
                            }}
                          >
                            {item.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            <Button type="submit" size="icon" className="flex-shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {selectedLoomItem && (
            <div className="text-xs text-muted-foreground">
              Linking to: <Badge variant="outline">{selectedLoomItem.name}</Badge>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default TasksWidget;
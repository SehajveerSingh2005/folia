import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Check, ChevronsUpDown, CheckSquare, FolderKanban, Sparkles, Wand2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import MakePlanForm from './ai/MakePlanForm';

const priorities = ['High', 'Medium', 'Low'];
const loomItemTypes = [
  'Project',
  'Book',
  'Course',
  'Writing',
  'Open Source',
  'Habit',
  'Misc',
];

const taskSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  priority: z.string().nullable(),
  due_date: z.date().nullable(),
  loom_item_id: z.string().nullable(),
  notes: z.string().nullable(),
});

const flowItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  notes: z.string().optional(),
  link: z.string().url().or(z.literal('')).optional(),
});

type LoomItem = {
  id: string;
  name: string;
};

interface CreateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemCreated: () => void;
}

const CreateDialog = ({
  isOpen,
  onOpenChange,
  onItemCreated,
}: CreateDialogProps) => {
  const [loomItems, setLoomItems] = useState<LoomItem[]>([]);

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { content: '', priority: null, due_date: null, loom_item_id: null, notes: '' },
  });

  const flowForm = useForm<z.infer<typeof flowItemSchema>>({
    resolver: zodResolver(flowItemSchema),
    defaultValues: { name: '', type: '', notes: '', link: '' },
  });

  useEffect(() => {
    if (isOpen) {
      taskForm.reset();
      flowForm.reset();
      const fetchLoomItems = async () => {
        try {
          const response = await fetch('/api/projects');
          if (!response.ok) throw new Error('Failed to fetch projects');
          const result = await response.json();
          const data = result.data || [];
          // Filter out completed projects
          const activeProjects = data.filter((item: LoomItem & { status?: string }) => item.status !== 'Completed');
          setLoomItems(activeProjects);
        } catch (error) {
          showError('Could not fetch projects.');
        }
      };
      fetchLoomItems();
    }
  }, [isOpen, taskForm, flowForm]);

  const onTaskSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : null,
          type: 'Task',
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      showSuccess('Task created.');
      onItemCreated();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || 'Failed to create task');
    }
  };

  const onFlowSubmit = async (values: z.infer<typeof flowItemSchema>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          start_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to create loom item');

      showSuccess('New item created in Flow.');
      onItemCreated();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || 'Failed to create loom item');
    }
  };

  const handlePlanCreated = () => {
    onItemCreated();
    onOpenChange(false);
  };

  const contentWrapperClass = "pt-4 min-h-[420px] data-[state=active]:animate-in data-[state=active]:fade-in-0";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 overflow-hidden rounded-[28px] sm:rounded-[28px] max-h-[90vh] h-auto" style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary)/0.06), transparent 50%), hsl(var(--background))' }}>
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-2xl font-serif font-normal tracking-tight">Create New</DialogTitle>
          <DialogDescription className="hidden">Create tasks, projects, or use AI planning.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="task" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-border/40 bg-muted/20">
            <TabsList className="bg-transparent p-0 gap-3 w-full justify-start">
              <TabsTrigger
                value="task"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/15 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all flex items-center gap-1.5 shadow-none"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Task
              </TabsTrigger>
              <TabsTrigger
                value="flow"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/15 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all flex items-center gap-1.5 shadow-none"
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Project
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/15 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all flex items-center gap-1.5 shadow-none"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                AI Plan
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="overflow-y-auto max-h-[70vh] p-6 bg-background/30 backdrop-blur-sm">
            <TabsContent value="task" className="mt-0">
              <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-5">
                <div className="space-y-4">
                  <Input
                    {...taskForm.register('content')}
                    placeholder="What needs to be done?"
                    className="text-lg border-transparent px-0 shadow-none border-b border-border/50 rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/45 h-12 transition-all focus:border-primary/50 bg-transparent"
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={taskForm.control} name="due_date" render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={'outline'} className={cn('justify-start text-left font-normal border-border/40 hover:bg-accent/50 rounded-xl h-10 bg-transparent text-xs', !field.value && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                            {field.value ? format(field.value, 'PPP') : <span>Due Date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden border-border/40" align="start">
                          <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                          <Button variant="ghost" className="w-full rounded-t-none border-t text-xs h-9" onClick={() => field.onChange(null)}>Clear Date</Button>
                        </PopoverContent>
                      </Popover>
                    )} />

                    <Controller control={taskForm.control} name="priority" render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger className="border-border/40 hover:bg-accent/50 rounded-xl h-10 bg-transparent text-xs">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          {priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                  </div>

                  <Controller control={taskForm.control} name="loom_item_id" render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="border-border/40 hover:bg-accent/50 rounded-xl h-10 bg-transparent text-xs">
                        <SelectValue placeholder="Link to Project (Optional)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40">
                        {loomItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />

                  <Textarea
                    {...taskForm.register('notes')}
                    placeholder="Additional notes..."
                    rows={4}
                    className="resize-none bg-muted/10 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl text-xs"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-medium rounded-full shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 h-11 text-sm bg-primary mt-2" disabled={taskForm.formState.isSubmitting}>
                  {taskForm.formState.isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="flow" className="mt-0">
              <form onSubmit={flowForm.handleSubmit(onFlowSubmit)} className="space-y-5">
                <Input
                  {...flowForm.register('name')}
                  placeholder="Project Name"
                  className="text-lg border-transparent px-0 shadow-none border-b border-border/50 rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/45 h-12 transition-all focus:border-primary/50 bg-transparent"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={flowForm.control}
                    name="type"
                    render={({ field }) => {
                      const [open, setOpen] = useState(false);
                      const [inputValue, setInputValue] = useState("");

                      return (
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className={cn(
                                "w-full justify-between border-border/40 hover:bg-accent/50 font-normal rounded-xl h-10 bg-transparent text-xs",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? field.value
                                : "Select type..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl overflow-hidden border-border/40" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search or create..."
                                onValueChange={(val) => setInputValue(val)}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div
                                    className="py-2 px-4 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const val = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
                                      field.onChange(val);
                                      setOpen(false);
                                    }}
                                  >
                                    Create <span className="font-semibold">"{inputValue}"</span>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {loomItemTypes.map((type) => (
                                    <CommandItem
                                      key={type}
                                      value={type}
                                      onSelect={(currentValue) => {
                                        field.onChange(type);
                                        setOpen(false);
                                      }}
                                      className="text-xs"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3.5 w-3.5",
                                          field.value === type ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {type}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />

                  <Input
                    {...flowForm.register('link')}
                    placeholder="External Link (Optional)"
                    className="border-border/40 bg-transparent rounded-xl h-10 text-xs"
                  />
                </div>

                <Textarea
                  {...flowForm.register('notes')}
                  placeholder="Description and goals..."
                  rows={6}
                  className="resize-none bg-muted/10 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl text-xs"
                />

                <Button type="submit" size="lg" className="w-full font-medium rounded-full shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 h-11 text-sm bg-primary mt-2" disabled={flowForm.formState.isSubmitting}>
                  {flowForm.formState.isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="plan" className="mt-0">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Wand2 className="h-4 w-4 text-primary" />
                  AI Planner
                </h3>
                <p className="text-xs text-muted-foreground">Describe your goal, and we'll generate a project with actionable steps.</p>
              </div>
              <div className="border rounded-2xl bg-muted/10 p-4 border-border/40">
                <MakePlanForm onPlanCreated={handlePlanCreated} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDialog;
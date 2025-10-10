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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

const priorities = ['High', 'Medium', 'Low'];

const formSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  priority: z.string().nullable(),
  due_date: z.date().nullable(),
  loom_item_id: z.string().nullable(),
});

type LoomItem = {
  id: string;
  name: string;
};

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTaskAdded: () => void;
}

const AddTaskDialog = ({
  isOpen,
  onOpenChange,
  onTaskAdded,
}: AddTaskDialogProps) => {
  const [loomItems, setLoomItems] = useState<LoomItem[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      priority: null,
      due_date: null,
      loom_item_id: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        content: '',
        priority: null,
        due_date: null,
        loom_item_id: null,
      });
      const fetchLoomItems = async () => {
        const { data, error } = await supabase
          .from('loom_items')
          .select('id, name')
          .neq('status', 'Completed');
        if (error) {
          showError('Could not fetch projects.');
        } else {
          setLoomItems(data);
        }
      };
      fetchLoomItems();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('ledger_items').insert({
      ...values,
      due_date: values.due_date
        ? format(values.due_date, 'yyyy-MM-dd')
        : null,
      user_id: user.id,
      type: 'Task',
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Task created.');
      onTaskAdded();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your Loom. Assign it to a project or leave it in the inbox.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input {...form.register('content')} placeholder="Task content" />
          <Controller
            control={form.control}
            name="loom_item_id"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {loomItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Due Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                     <Button
                        variant="ghost"
                        className="w-full rounded-t-none"
                        onClick={() => field.onChange(null)}
                      >
                        Clear Date
                      </Button>
                  </PopoverContent>
                </Popover>
              )}
            />
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
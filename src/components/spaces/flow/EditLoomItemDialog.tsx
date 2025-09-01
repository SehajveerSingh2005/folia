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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

const loomItemTypes = [
  'Project',
  'Book',
  'Course',
  'Writing',
  'Open Source',
  'Habit',
  'Misc',
];
const statuses = ['Active', 'Paused', 'Completed'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().nullable(),
  status: z.string().nullable(),
  notes: z.string().nullable(),
  start_date: z.date().nullable(),
  deadline_date: z.date().nullable(),
});

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  notes: string | null;
  start_date: string | null;
  deadline_date: string | null;
};

interface EditLoomItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: LoomItem | null;
  onItemUpdated: () => void;
}

const EditLoomItemDialog = ({
  isOpen,
  onOpenChange,
  item,
  onItemUpdated,
}: EditLoomItemDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: item?.name || '',
      type: item?.type || null,
      status: item?.status || null,
      notes: item?.notes || null,
      start_date: item?.start_date ? new Date(item.start_date) : null,
      deadline_date: item?.deadline_date ? new Date(item.deadline_date) : null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!item) return;

    const { error } = await supabase
      .from('loom_items')
      .update({
        ...values,
        start_date: values.start_date
          ? values.start_date.toISOString().split('T')[0]
          : null,
        deadline_date: values.deadline_date
          ? values.deadline_date.toISOString().split('T')[0]
          : null,
      })
      .eq('id', item.id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Item updated successfully.');
      onItemUpdated();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Make changes to your item here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input {...form.register('name')} placeholder="Item Name" />
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {loomItemTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="start_date"
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
                        <span>Start Date</span>
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
                  </PopoverContent>
                </Popover>
              )}
            />
            <Controller
              control={form.control}
              name="deadline_date"
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
                        <span>Deadline</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          <Textarea {...form.register('notes')} placeholder="Notes..." />
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLoomItemDialog;
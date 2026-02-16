import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
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
import { CalendarIcon, Trash2, CheckSquare, Square, Plus, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const projectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.string().optional(),
    status: z.enum(['Active', 'Paused', 'Completed', 'Backlog']),
    start_date: z.date().nullable(),
    due_date: z.date().nullable(),
    notes: z.string().optional(),
    link: z.string().optional(),
});

interface ProjectDetailSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    project: any; // Ideally typed
    onProjectUpdated: () => void;
}

const ProjectDetailSheet = ({
    isOpen,
    onOpenChange,
    project,
    onProjectUpdated,
}: ProjectDetailSheetProps) => {
    const queryClient = useQueryClient();
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskContent, setNewTaskContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const form = useForm<z.infer<typeof projectSchema>>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: '',
            type: 'Project',
            status: 'Active',
            start_date: null,
            due_date: null,
            notes: '',
            link: '',
        },
    });

    useEffect(() => {
        if (project) {
            form.reset({
                name: project.name,
                type: project.type,
                status: project.status || 'Active',
                start_date: project.start_date ? new Date(project.start_date) : null,
                due_date: project.due_date ? new Date(project.due_date) : null,
                notes: project.notes || '',
                link: project.link || '',
            });
            fetchTasks();
        }
    }, [project, isOpen]);

    const fetchTasks = async () => {
        if (!project) return;
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('loom_item_id', project.id)
            .order('completed', { ascending: true })
            .order('due_date', { ascending: true }); // Then by date

        if (data) setTasks(data);
    };

    const onSubmit = async (values: z.infer<typeof projectSchema>) => {
        try {
            const { error } = await supabase
                .from('loom_items')
                .update({
                    ...values,
                    start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
                    due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : null,
                })
                .eq('id', project.id);

            if (error) throw error;

            showSuccess('Project updated');
            onProjectUpdated();
            setIsEditing(false);
        } catch (error: any) {
            showError(error.message);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskContent.trim() || !project) return;

        try {
            const { error } = await supabase.from('tasks').insert({
                content: newTaskContent,
                loom_item_id: project.id,
                user_id: (await supabase.auth.getUser()).data.user?.id
            });

            if (error) throw error;

            setNewTaskContent('');
            fetchTasks();
            onProjectUpdated(); // To update progress bar on card
        } catch (error: any) {
            showError('Failed to add task');
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', taskId);
            if (error) throw error;
            fetchTasks();
            onProjectUpdated();
        } catch (error) {
            showError('Failed to update task');
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
            fetchTasks();
            onProjectUpdated();
        } catch (error) {
            showError('Failed to delete task');
        }
    };

    if (!project) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0 overflow-hidden" side="right">
                {/* Header Area */}
                <div className="p-6 pb-2 border-b bg-background z-10">
                    <div className="flex justify-between items-start mb-4">
                        {isEditing ? (
                            <Input {...form.register('name')} className="text-2xl font-serif font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0" />
                        ) : (
                            <SheetTitle className="text-2xl font-serif font-bold">{project.name}</SheetTitle>
                        )}
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? 'Cancel' : 'Edit Details'}
                            </Button>
                            {isEditing && (
                                <Button size="sm" onClick={form.handleSubmit(onSubmit)}>Save</Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                project.status === 'Active' ? "bg-emerald-500" :
                                    project.status === 'Completed' ? "bg-blue-500" :
                                        "bg-slate-500"
                            )} />
                            {isEditing ? (
                                <Controller control={form.control} name="status" render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-6 w-[100px] text-xs border-none shadow-none p-0"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Paused">Paused</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Backlog">Backlog</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            ) : (
                                <span>{project.status}</span>
                            )}
                        </div>
                        {/* Add Due Date display here if needed */}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <Tabs defaultValue="tasks" className="w-full h-full flex flex-col">
                        <div className="px-6 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                            <TabsList className="bg-transparent p-0 w-full justify-start h-12">
                                <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    Tasks ({tasks.filter(t => !t.completed).length})
                                </TabsTrigger>
                                <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    Notes
                                </TabsTrigger>
                                <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                    Info
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="tasks" className="p-6 flex-1 mt-0 space-y-6">
                            {/* Add Task Input */}
                            <form onSubmit={handleAddTask} className="flex gap-2">
                                <Input
                                    value={newTaskContent}
                                    onChange={(e) => setNewTaskContent(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" variant="secondary">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </form>

                            {/* Task List */}
                            <div className="space-y-1">
                                {tasks.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground italic">No tasks yet.</div>
                                )}
                                {tasks.map((task) => (
                                    <div key={task.id} className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                        <button
                                            onClick={() => toggleTask(task.id, task.completed)}
                                            className={cn(
                                                "mt-0.5 transition-colors",
                                                task.completed ? "text-primary" : "text-muted-foreground hover:text-primary"
                                            )}
                                        >
                                            {task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                        </button>
                                        <span className={cn(
                                            "flex-1 text-sm pt-0.5",
                                            task.completed && "text-muted-foreground line-through decoration-muted-foreground/50"
                                        )}>
                                            {task.content}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive text-xs">
                                                    Delete Task
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="p-6 flex-1 mt-0 h-full flex flex-col">
                            {isEditing ? (
                                <Textarea
                                    {...form.register('notes')}
                                    className="flex-1 resize-none border-none focus-visible:ring-0 bg-transparent text-lg leading-relaxed"
                                    placeholder="Project notes..."
                                />
                            ) : (
                                <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/80">
                                    {project.notes || <span className="text-muted-foreground italic">No notes added.</span>}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="info" className="p-6 flex-1 mt-0">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <Input {...form.register('type')} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Link</label>
                                        <Input {...form.register('link')} placeholder="https://..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Start Date</label>
                                            <Controller control={form.control} name="start_date" render={({ field }) => (
                                                <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('justify-start text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                            )} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Due Date</label>
                                            <Controller control={form.control} name="due_date" render={({ field }) => (
                                                <Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('justify-start text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                                        <div><p className="text-muted-foreground mb-1">Type</p><p>{project.type || 'N/A'}</p></div>
                                        <div><p className="text-muted-foreground mb-1">Link</p><p>{project.link ? <a href={project.link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">{project.link}</a> : 'None'}</p></div>
                                        <div><p className="text-muted-foreground mb-1">Start Date</p><p>{project.start_date ? format(new Date(project.start_date), 'PPP') : 'N/A'}</p></div>
                                        <div><p className="text-muted-foreground mb-1">Due Date</p><p>{project.due_date ? format(new Date(project.due_date), 'PPP') : 'N/A'}</p></div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ProjectDetailSheet;

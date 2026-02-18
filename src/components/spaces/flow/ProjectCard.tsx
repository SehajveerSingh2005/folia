import { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Play, Pause, CheckCircle2, Circle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ProjectCardProps {
    project: {
        id: string;
        name: string;
        description?: string;
        status: 'Active' | 'Paused' | 'Completed' | 'Backlog';
        progress?: number;
        due_date?: string | Date;
        tasks?: {
            id: string;
            content: string;
            completed: boolean;
            due_date?: string | Date;
        }[];
    };
    onClick: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onAddTask?: (content: string) => void;
}

const ProjectCard = ({ project, onClick, onEdit, onDelete, onAddTask }: ProjectCardProps) => {
    const nextTask = project.tasks?.find(t => !t.completed);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskContent, setNewTaskContent] = useState('');

    // specific progress logic can be passed in or calculated here if we have full task list
    const progress = project.progress || 0;

    const statusColors = {
        Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
        Paused: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
        Completed: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
        Backlog: 'bg-slate-500/10 text-slate-600 border-slate-200/50',
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (newTaskContent.trim() && onAddTask) {
            onAddTask(newTaskContent);
            setNewTaskContent('');
            setIsAddingTask(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between p-5 bg-card hover:bg-accent/5 transition-all duration-300 border border-border rounded-xl hover:shadow-lg hover:border-primary/20 cursor-pointer h-[220px]"
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="font-sans text-lg font-medium leading-tight group-hover:text-primary transition-colors">
                        {project.name}
                    </h3>
                    <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        statusColors[project.status] || statusColors.Backlog
                    )}>
                        {project.status === 'Active' && <Play className="w-3 h-3 mr-1 fill-current" />}
                        {project.status === 'Paused' && <Pause className="w-3 h-3 mr-1 fill-current" />}
                        {project.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {project.status}
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Up Next / Summary */}
            <div className="mt-4 flex-grow">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Up Next</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 -mr-1 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setIsAddingTask(!isAddingTask); }}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                {isAddingTask ? (
                    <form onSubmit={handleAddTask} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <Input
                            value={newTaskContent}
                            onChange={(e) => setNewTaskContent(e.target.value)}
                            placeholder="New task..."
                            className="h-8 text-sm"
                            autoFocus
                        />
                        <Button type="submit" size="icon" variant="secondary" className="h-8 w-8 shrink-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>
                ) : nextTask ? (
                    <div className="text-sm">
                        <div className="flex items-start gap-2 text-foreground/90">
                            <Circle className="w-4 h-4 mt-0.5 text-primary/60 shrink-0" />
                            <span className="line-clamp-2">{nextTask.content}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm italic">
                        No active tasks
                    </div>
                )}
            </div>

            {/* Footer / Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-secondary" indicatorClassName={cn(
                    project.status === 'Completed' ? 'bg-blue-500' : 'bg-primary'
                )} />
                {project.due_date && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                        Due {format(new Date(project.due_date), 'MMM d')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;

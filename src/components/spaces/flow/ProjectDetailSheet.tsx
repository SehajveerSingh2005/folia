import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
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
import { CalendarIcon, Trash2, CheckCircle2, Circle, Plus, MoreHorizontal, Pencil, Calendar as CalendarIconLucide, StickyNote, X, Github, CircleDot, GitPullRequest, ExternalLink, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ItemLinker } from '@/components/spaces/garden/ItemLinker';
import { useRouter } from 'next/navigation';

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
    project: any;
    onProjectUpdated: () => void;
}

const parseGitHubRepo = (link: string | null) => {
    if (!link) return null;
    const clean = link.trim().replace(/\/$/, '');
    if (clean.split('/').length === 2) {
        const [owner, repo] = clean.split('/');
        return { owner, repo };
    }
    try {
        const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
        if (url.hostname.includes('github.com')) {
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return { owner: parts[0], repo: parts[1] };
            }
        }
    } catch (e) {}
    return null;
};

const ProjectDetailSheet = ({
    isOpen,
    onOpenChange,
    project,
    onProjectUpdated,
}: ProjectDetailSheetProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [newTaskContent, setNewTaskContent] = useState('');
    const [createAsGithubIssue, setCreateAsGithubIssue] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [githubRepoInput, setGithubRepoInput] = useState('');
    const [isLinkingRepo, setIsLinkingRepo] = useState(false);
    const [githubStatusFilter, setGithubStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
    const [githubTypeFilter, setGithubTypeFilter] = useState<'issue' | 'pr' | 'all'>('issue');

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

    const parsedRepo = parseGitHubRepo(project?.link);

    // Fetch GitHub issues & PRs
    const { data: githubData = { issues: [], prs: [] }, isLoading: isLoadingGitHub } = useQuery({
        queryKey: ['project_github_issues', project?.link],
        queryFn: async () => {
            if (!parsedRepo) return { issues: [], prs: [] };
            const { owner, repo } = parsedRepo;
            const token = localStorage.getItem('folia_github_token');
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
            };
            if (token) {
                headers['Authorization'] = `token ${token}`;
            }

            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=50`, { headers });
            if (!res.ok) {
                throw new Error(`GitHub API error: ${res.statusText}`);
            }
            const allIssues = await res.json();
            
            // Filter issues and PRs. GitHub returns PRs inside issues list with pull_request property
            const issues = allIssues.filter((item: any) => !item.pull_request);
            const prs = allIssues.filter((item: any) => item.pull_request);

            return { issues, prs };
        },
        enabled: !!parsedRepo && isOpen,
        staleTime: 1000 * 30, // Cache for 30 seconds
    });

    // Fetch tasks using React Query for caching and loading states
    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['tasks', project?.id],
        queryFn: async () => {
            if (!project?.id) return [];
            const { data, error } = await supabase
                .from('ledger_items')
                .select('*')
                .eq('loom_item_id', project.id)
                .order('is_done', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching tasks:', error);
                throw error;
            }
            return data || [];
        },
        enabled: !!project?.id && isOpen,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    useEffect(() => {
        if (project && isOpen) {
            setIsEditing(false);

            form.reset({
                name: project.name,
                type: project.type,
                status: project.status || 'Active',
                start_date: project.start_date ? new Date(project.start_date) : null,
                due_date: project.due_date ? new Date(project.due_date) : null,
                notes: project.notes || '',
                link: project.link || '',
            });
        }
    }, [project, isOpen]);

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
            let githubIssueUrl = '';
            let githubIssueNum = '';

            if (createAsGithubIssue && parsedRepo) {
                const token = localStorage.getItem('folia_github_token');
                if (!token) {
                    showError("Please add your GitHub Personal Access Token in Settings to create issues.");
                    return;
                }
                const { owner, repo } = parsedRepo;
                try {
                    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            title: newTaskContent,
                            body: 'Created from Folia OS project workspace.',
                        }),
                    });
                    if (!res.ok) throw new Error(res.statusText);
                    const issueData = await res.json();
                    githubIssueUrl = issueData.html_url;
                    githubIssueNum = issueData.number;
                    showSuccess(`Created GitHub issue #${githubIssueNum}`);
                } catch (err: any) {
                    showError(`Failed to create issue on GitHub: ${err.message}`);
                    return; // stop creation if github fails
                }
            }

            const { error } = await supabase.from('ledger_items').insert({
                content: newTaskContent,
                loom_item_id: project.id,
                user_id: (await supabase.auth.getUser()).data.user?.id,
                is_done: false,
                type: 'Task',
                notes: githubIssueUrl ? `Linked GitHub issue: ${githubIssueUrl}` : ''
            });

            if (error) throw error;

            setNewTaskContent('');
            setCreateAsGithubIssue(false);
            queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
            queryClient.invalidateQueries({ queryKey: ['project_github_issues', project.link] });
            onProjectUpdated();
        } catch (error: any) {
            showError('Failed to add task');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('ledger_items')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            showSuccess('Task deleted');
            queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
            onProjectUpdated();
        } catch (error: any) {
            showError('Failed to delete task');
        }
    };

    const handleTaskUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
        onProjectUpdated();
    };

    const handleLinkRepo = async () => {
        if (!githubRepoInput.trim() || !project) return;
        setIsLinkingRepo(true);
        try {
            let repoUrl = githubRepoInput.trim();
            if (!repoUrl.startsWith('http')) {
                repoUrl = `https://github.com/${repoUrl}`;
            }
            const { error } = await supabase
                .from('loom_items')
                .update({ link: repoUrl })
                .eq('id', project.id);

            if (error) throw error;
            showSuccess('GitHub repository linked!');
            onProjectUpdated();
            project.link = repoUrl;
        } catch (err: any) {
            showError('Failed to link GitHub repository');
        } finally {
            setIsLinkingRepo(false);
        }
    };

    const handleUnlinkRepo = async () => {
        if (!project) return;
        try {
            const { error } = await supabase
                .from('loom_items')
                .update({ link: '' })
                .eq('id', project.id);

            if (error) throw error;
            showSuccess('GitHub repository unlinked');
            onProjectUpdated();
            project.link = '';
            setGithubRepoInput('');
        } catch (err: any) {
            showError('Failed to unlink repository');
        }
    };

    const handleArchive = async () => {
        if (!project) return;
        try {
            const { error } = await supabase
                .from('loom_items')
                .update({ status: 'Completed' })
                .eq('id', project.id);

            if (error) throw error;
            showSuccess('Project moved to Archive');
            onProjectUpdated();
            onOpenChange(false);
        } catch (err: any) {
            showError(err.message || 'Failed to archive project');
        }
    };

    const localGithubUrls = tasks
        .map((t: any) => {
            const match = t.notes?.match(/https:\/\/github\.com\/[^\s]+/);
            return match ? match[0] : null;
        })
        .filter(Boolean);

    const openGitHubTasks = (githubData.issues || [])
        .filter((issue: any) => issue.state === 'open' && !localGithubUrls.includes(issue.html_url))
        .map((issue: any) => ({
            id: `github-${issue.number}`,
            content: issue.title,
            is_done: false,
            priority: 'Medium',
            due_date: null,
            notes: `GitHub Issue #${issue.number}`,
            isGitHub: true,
            githubUrl: issue.html_url,
            githubNumber: issue.number,
            githubRepo: parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : '',
        }));

    const mergedTasks = [
        ...tasks.map((t: any) => {
            const hasGh = t.notes?.includes('github.com');
            const match = t.notes?.match(/#(\d+)/) || t.notes?.match(/\/issues\/(\d+)/);
            const num = match ? match[1] : null;
            return {
                ...t,
                isGitHub: hasGh,
                githubUrl: hasGh ? t.notes.match(/https:\/\/github\.com\/[^\s]+/)?.[0] : null,
                githubNumber: num ? parseInt(num, 10) : null,
                githubRepo: parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : null
            };
        }),
        ...openGitHubTasks
    ];

    const filteredIssues = (githubData.issues || []).filter((issue: any) => {
        if (githubStatusFilter !== 'all' && issue.state !== githubStatusFilter) return false;
        return true;
    });

    const filteredPRs = (githubData.prs || []).filter((pr: any) => {
        if (githubStatusFilter !== 'all' && pr.state !== githubStatusFilter) return false;
        return true;
    });

    const hasMatches = (githubTypeFilter === 'issue' && filteredIssues.length > 0) ||
                       (githubTypeFilter === 'pr' && filteredPRs.length > 0) ||
                       (githubTypeFilter === 'all' && (filteredIssues.length > 0 || filteredPRs.length > 0));

    if (!project) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden outline-none">
                {/* ... (Header Area skipped for brevity, keeping existing) ... */}
                <div className="p-6 pb-4 bg-background z-10 shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        {isEditing ? (
                            <Input {...form.register('name')} className="text-2xl font-serif font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0" />
                        ) : (
                            <DialogTitle className="text-2xl font-serif font-bold">{project.name}</DialogTitle>
                        )}
                        <div className="flex gap-2">
                            {!isEditing && project.status !== 'Completed' && (
                                <Button variant="outline" size="sm" onClick={handleArchive}>
                                    <Archive className="h-4 w-4 mr-1.5 text-muted-foreground" /> Archive
                                </Button>
                            )}
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
                    </div>
                </div>

                {/* Tabs with Fixed List and Scrollable Content */}
                <Tabs defaultValue="tasks" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                        <TabsList className="bg-transparent p-0 w-full justify-start h-10">
                            <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-sm">
                                Tasks ({mergedTasks.filter((t: any) => !t.is_done).length})
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-sm">
                                Notes
                            </TabsTrigger>
                            <TabsTrigger value="info" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-sm">
                                Info
                            </TabsTrigger>
                            <TabsTrigger value="github" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-sm flex items-center gap-1.5">
                                <Github className="h-4 w-4" />
                                GitHub
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <TabsContent value="tasks" className="p-6 m-0 space-y-6 min-h-full">
                            {/* Add Task Input */}
                            <form onSubmit={handleAddTask} className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        value={newTaskContent}
                                        onChange={(e) => setNewTaskContent(e.target.value)}
                                        placeholder="Add a new task..."
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" variant="secondary">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {parsedRepo && (
                                    <div className="flex items-center gap-2 pl-1">
                                        <input
                                            type="checkbox"
                                            id="create-gh-issue"
                                            checked={createAsGithubIssue}
                                            onChange={(e) => setCreateAsGithubIssue(e.target.checked)}
                                            className="rounded border-muted text-primary focus:ring-primary h-3.5 w-3.5"
                                        />
                                        <label htmlFor="create-gh-issue" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer select-none">
                                            <Github className="h-3.5 w-3.5" />
                                            Also create as GitHub issue
                                        </label>
                                    </div>
                                )}
                            </form>

                            {/* Task List */}
                            <div className="space-y-1 min-h-[100px]">
                                {isLoadingTasks || (parsedRepo && isLoadingGitHub) ? (
                                    <div className="flex flex-col gap-2 py-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-10 bg-muted/30 rounded-md animate-pulse" />
                                        ))}
                                    </div>
                                ) : mergedTasks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground italic">No tasks yet.</div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {mergedTasks.map((task: any, index: number) => (
                                            <TaskItem
                                                key={task.id}
                                                index={index}
                                                task={task}
                                                onUpdate={handleTaskUpdate}
                                                onDelete={() => handleDeleteTask(task.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="p-6 m-0 h-full data-[state=active]:flex flex-col">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Linked Notes</h3>
                                    <ItemLinker itemId={project.id} itemType="Project" hideItems />
                                </div>
                                <LinkedNotesGrid projectId={project.id} />
                            </div>
                        </TabsContent>

                        <TabsContent value="info" className="p-6 m-0">
                            {isEditing ? (
                                <div className="space-y-4 max-w-lg">
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
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm max-w-lg">
                                        <div><p className="text-muted-foreground mb-1">Type</p><p>{project.type || 'N/A'}</p></div>
                                        <div><p className="text-muted-foreground mb-1">Link</p><p>{project.link ? <a href={project.link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">{project.link}</a> : 'None'}</p></div>
                                        <div><p className="text-muted-foreground mb-1">Start Date</p><p>{project.start_date ? format(new Date(project.start_date), 'PPP') : 'N/A'}</p></div>
                                        <div><p className="text-muted-foreground mb-1">Due Date</p><p>{project.due_date ? format(new Date(project.due_date), 'PPP') : 'N/A'}</p></div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="github" className="p-6 m-0 space-y-6">
                            {project.link && (project.link.includes('github.com') || parseGitHubRepo(project.link)) ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Github className="h-6 w-6 text-zinc-950 dark:text-zinc-50" />
                                            <div>
                                                <h4 className="font-serif font-semibold text-sm">Linked Repository</h4>
                                                <a
                                                    href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline truncate block max-w-xs sm:max-w-md"
                                                >
                                                    {parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : project.link}
                                                </a>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={handleUnlinkRepo} className="text-xs h-8">
                                            Disconnect
                                        </Button>
                                    </div>

                                    {/* Real Repo Issues and Pull Requests */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active GitHub Issues & PRs</h4>
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                {/* Type filter */}
                                                <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border">
                                                    <button
                                                        type="button"
                                                        onClick={() => setGithubTypeFilter('issue')}
                                                        className={cn("px-2 py-0.5 rounded-md transition-all text-[11px]", githubTypeFilter === 'issue' ? "bg-background shadow-xs text-foreground font-medium" : "text-muted-foreground")}
                                                    >
                                                        Issues
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGithubTypeFilter('pr')}
                                                        className={cn("px-2 py-0.5 rounded-md transition-all text-[11px]", githubTypeFilter === 'pr' ? "bg-background shadow-xs text-foreground font-medium" : "text-muted-foreground")}
                                                    >
                                                        PRs
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGithubTypeFilter('all')}
                                                        className={cn("px-2 py-0.5 rounded-md transition-all text-[11px]", githubTypeFilter === 'all' ? "bg-background shadow-xs text-foreground font-medium" : "text-muted-foreground")}
                                                    >
                                                        All
                                                    </button>
                                                </div>

                                                {/* Status filter */}
                                                <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border">
                                                    <button
                                                        type="button"
                                                        onClick={() => setGithubStatusFilter('open')}
                                                        className={cn("px-2 py-0.5 rounded-md transition-all text-[11px]", githubStatusFilter === 'open' ? "bg-background shadow-xs text-foreground font-medium" : "text-muted-foreground")}
                                                    >
                                                        Open
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGithubStatusFilter('closed')}
                                                        className={cn("px-2 py-0.5 rounded-md transition-all text-[11px]", githubStatusFilter === 'closed' ? "bg-background shadow-xs text-foreground font-medium" : "text-muted-foreground")}
                                                    >
                                                        Closed
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGithubStatusFilter('all')}
                                                        className={cn("px-2 py-0.5 rounded-md transition-all text-[11px]", githubStatusFilter === 'all' ? "bg-background shadow-xs text-foreground font-medium" : "text-muted-foreground")}
                                                    >
                                                        All
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isLoadingGitHub ? (
                                            <div className="space-y-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                                                ))}
                                            </div>
                                        ) : !hasMatches ? (
                                            <p className="text-xs text-muted-foreground italic py-2">No matching issues or pull requests found.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                {(githubTypeFilter === 'issue' || githubTypeFilter === 'all') && filteredIssues.map((issue: any) => (
                                                    <a
                                                        key={issue.id}
                                                        href={issue.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors block"
                                                    >
                                                        <CircleDot className={cn("h-4 w-4 mt-0.5 shrink-0", issue.state === 'open' ? "text-emerald-500" : "text-zinc-400")} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={cn("text-xs font-medium truncate", issue.state === 'closed' && "line-through text-muted-foreground")}>
                                                                {issue.title}
                                                            </p>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                #{issue.number} · {issue.state === 'open' ? 'Opened' : 'Closed'} by {issue.user?.login}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className={cn("text-[9px] font-normal shrink-0 border-none", issue.state === 'open' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500")}>
                                                            {issue.state}
                                                        </Badge>
                                                    </a>
                                                ))}
                                                {(githubTypeFilter === 'pr' || githubTypeFilter === 'all') && filteredPRs.map((pr: any) => (
                                                    <a
                                                        key={pr.id}
                                                        href={pr.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors block"
                                                    >
                                                        <GitPullRequest className={cn("h-4 w-4 mt-0.5 shrink-0", pr.state === 'open' ? "text-purple-500" : "text-zinc-400")} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={cn("text-xs font-medium truncate", pr.state === 'closed' && "line-through text-muted-foreground")}>
                                                                {pr.title}
                                                            </p>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                #{pr.number} · {pr.state === 'open' ? 'Created' : 'Closed'} by {pr.user?.login}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className={cn("text-[9px] font-normal shrink-0 border-none", pr.state === 'open' ? "bg-purple-500/10 text-purple-500" : "bg-zinc-500/10 text-zinc-500")}>
                                                            {pr.state === 'open' ? 'PR' : 'Closed PR'}
                                                        </Badge>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-60 flex flex-col items-center justify-center text-center p-6 gap-4 border border-dashed rounded-2xl max-w-md mx-auto">
                                    <div className="p-3.5 bg-muted rounded-full">
                                        <Github className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Link GitHub Repository</h4>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                            Track and view repository issues and PR status right inside this project board.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 w-full max-w-sm">
                                        <Input
                                            value={githubRepoInput}
                                            onChange={(e) => setGithubRepoInput(e.target.value)}
                                            placeholder="owner/repo (e.g. facebook/react)"
                                            className="text-xs flex-1 h-9"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleLinkRepo}
                                            disabled={isLinkingRepo || !githubRepoInput.trim()}
                                            className="text-xs h-9"
                                        >
                                            Link
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

// --- TaskItem Component ---

interface TaskItemProps {
    task: any;
    onUpdate: () => void;
    onDelete: () => void;
    index: number;
}

const TaskItem = ({ task, onUpdate, onDelete, index }: TaskItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(task.content);
    const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? new Date(task.due_date) : undefined);
    const [priority, setPriority] = useState<string>(task.priority || 'Medium');
    const [notes, setNotes] = useState(task.notes || '');

    const handleSave = async () => {
        const { error } = await supabase.from('ledger_items').update({
            content,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            priority,
            notes
        }).eq('id', task.id);

        if (error) {
            showError("Failed to update task");
        } else {
            setIsEditing(false);
            onUpdate();
        }
    };

    const toggleComplete = async () => {
        if (task.isGitHub) {
            const token = localStorage.getItem('folia_github_token');
            if (!token) {
                showError("Please add your GitHub Personal Access Token in Settings to close issues.");
                return;
            }
            try {
                const [owner, repo] = task.githubRepo.split('/');
                const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${task.githubNumber}`, {
                    method: 'PATCH',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ state: 'closed' }),
                });
                if (!res.ok) throw new Error(res.statusText);
                showSuccess(`Closed GitHub issue #${task.githubNumber}`);
                
                // If it is also a local DB task, toggle it in DB too
                if (task.id && !task.id.startsWith('github-')) {
                    await supabase.from('ledger_items').update({
                        is_done: true,
                        completed_at: new Date().toISOString()
                    }).eq('id', task.id);
                }
                
                onUpdate();
            } catch (err: any) {
                showError(`Failed to close GitHub issue: ${err.message}`);
            }
            return;
        }

        const newStatus = !task.is_done;
        const { error } = await supabase.from('ledger_items').update({
            is_done: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null
        }).eq('id', task.id);

        if (error) showError("Failed to toggle task");
        else onUpdate();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
            <button
                onClick={toggleComplete}
                className={cn(
                    "mt-0.5 transition-colors",
                    task.is_done ? "text-primary/50" : "text-muted-foreground hover:text-primary"
                )}
            >
                {task.is_done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>

            <div className="flex-1 pt-0.5">
                {isEditing ? (
                    <div className="flex flex-col gap-3 p-2 bg-background border rounded-md shadow-sm">
                        <Input
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="font-medium"
                            placeholder="Task content"
                            autoFocus
                        />
                        <div className="flex flex-wrap gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn("text-xs h-8", !dueDate && "text-muted-foreground border-dashed")}>
                                        <CalendarIconLucide className="mr-2 h-3.5 w-3.5" />
                                        {dueDate ? format(dueDate, 'MMM d') : "Due Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                                </PopoverContent>
                            </Popover>

                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                        </div>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="text-xs min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleSave}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "text-sm transition-all select-text",
                            task.is_done && "text-muted-foreground line-through decoration-muted-foreground/40"
                        )}>
                            {task.content}
                        </span>

                        {(task.due_date || task.priority || task.notes || task.isGitHub) && (
                            <div className="flex flex-wrap gap-2 items-center mt-1">
                                {task.isGitHub && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-normal border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-foreground flex items-center gap-1">
                                        <Github className="w-2.5 h-2.5 text-foreground" />
                                        GitHub #{task.githubNumber}
                                    </Badge>
                                )}
                                {task.due_date && (
                                    <span className={cn("text-xs flex items-center gap-1", task.is_done ? "text-muted-foreground/50" : "text-muted-foreground")}>
                                        <CalendarIconLucide className="w-3 h-3" />
                                        {format(new Date(task.due_date), 'MMM d')}
                                    </span>
                                )}
                                {task.priority && task.priority !== 'Medium' && (
                                    <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="h-5 px-1.5 text-[10px] font-normal">
                                        {task.priority}
                                    </Badge>
                                )}
                                {task.notes && !task.notes.includes('Linked GitHub issue') && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <StickyNote className="w-3 h-3" />
                                        Notes
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isEditing && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!task.isGitHub && (
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit Task
                            </DropdownMenuItem>
                        )}
                        {task.githubUrl && (
                            <DropdownMenuItem asChild>
                                <a href={task.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-2 py-1.5 text-xs text-foreground cursor-pointer hover:bg-muted rounded-sm">
                                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                    Open in GitHub
                                </a>
                            </DropdownMenuItem>
                        )}
                        {!task.isGitHub && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onDelete} className="text-destructive text-xs">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Task
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </motion.div>
    );
};

// --- LinkedNotesGrid Component ---

const LinkedNotesGrid = ({ projectId }: { projectId: string }) => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: notes, isLoading } = useQuery({
        queryKey: ['project_linked_notes', projectId],
        queryFn: async () => {
            const { data: links, error: linksError } = await supabase
                .from('item_links')
                .select('*')
                .or(`source_item_id.eq.${projectId},target_item_id.eq.${projectId}`);

            if (linksError) throw linksError;

            const linkedIds = links.map(l => l.source_item_id === projectId ? l.target_item_id : l.source_item_id);
            if (linkedIds.length === 0) return [];

            const { data: gardenItems, error: itemsError } = await supabase
                .from('garden_items')
                .select('id, title, content, created_at')
                .in('id', linkedIds);

            if (itemsError) throw itemsError;

            return gardenItems.map(item => {
                const link = links.find(l => l.source_item_id === item.id || l.target_item_id === item.id);
                return { ...item, link_id: link?.id };
            });
        }
    });

    const removeLinkMutation = useMutation({
        mutationFn: async (linkId: string) => {
            const { error } = await supabase.from('item_links').delete().eq('id', linkId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item_links', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project_linked_notes', projectId] });
            queryClient.invalidateQueries({ queryKey: ['constellation_data'] });
        },
        onError: (err: Error) => showError(err.message)
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-muted/40 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (!notes || notes.length === 0) {
        return <div className="text-muted-foreground italic text-sm mt-4">No garden notes linked to this project yet. Use the button above to link or create one.</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {notes.map(note => {
                const cleanContent = (note.content || '').replace(/<[^>]+>/g, ' ');
                return (
                    <div
                        key={note.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            // Also trigger the sheet to close so it navigates cleanly
                            const closeBtn = document.querySelector('[data-state="open"]')?.parentElement?.querySelector('button[aria-label="Close"]') as HTMLButtonElement | null;
                            if (closeBtn) closeBtn.click();

                            // Small delay to let sheet closing animation start
                            setTimeout(() => router.push(`/garden?noteId=${note.id}`), 150);
                        }}
                        className="group bg-card border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all flex flex-col h-40 shadow-sm hover:shadow-md relative"
                    >
                        {note.link_id && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeLinkMutation.mutate(note.link_id as string);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        <div className="flex items-center gap-2 mb-2 pr-6">
                            <StickyNote className="w-4 h-4 text-green-500 shrink-0" />
                            <h4 className="font-semibold text-sm line-clamp-1 flex-1">{note.title || 'Untitled Note'}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-4 flex-1 mt-1">{cleanContent || 'Empty note'}</p>
                        <div className="text-[10px] text-muted-foreground mt-3 font-medium opacity-60">
                            {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectDetailSheet;

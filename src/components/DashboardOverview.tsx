import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import QuickAdd from './dashboard/QuickAdd';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  FolderKanban,
  Sparkles,
  Book,
  Telescope,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';

type Task = {
  id: string;
  content: string;
  is_completed: boolean;
};

type Project = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  content: string;
};

type Space = 'Flow' | 'Garden' | 'Journal' | 'Horizon';

interface DashboardOverviewProps {
  firstName: string;
  onNavigate: (space: Space) => void;
}

const DashboardOverview = ({
  firstName,
  onNavigate,
}: DashboardOverviewProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const projectsPromise = supabase.from('projects').select('id, name').order('created_at', { ascending: false }).limit(5);
    const tasksPromise = supabase.from('tasks').select('id, content, is_completed').order('created_at', { ascending: false });
    const notesPromise = supabase.from('notes').select('id, content').order('created_at', { ascending: false }).limit(3);
    const today = new Date().toISOString().split('T')[0];
    const journalPromise = supabase.from('journal_entries').select('id').eq('entry_date', today).single();

    const [projectsResult, tasksResult, notesResult, journalResult] =
      await Promise.all([
        projectsPromise,
        tasksPromise,
        notesPromise,
        journalPromise,
      ]);

    if (projectsResult.error) showError('Could not fetch projects.');
    else setProjects(projectsResult.data);

    if (tasksResult.error) showError('Could not fetch tasks.');
    else setTasks(tasksResult.data);

    if (notesResult.error) showError('Could not fetch notes.');
    else setNotes(notesResult.data);

    setHasTodayEntry(!!journalResult.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
      .eq('id', taskId);
    if (error) showError(error.message);
    else fetchData();
  };

  const incompleteTasks = tasks.filter((task) => !task.is_completed);
  const today = new Date();

  const spaceLinks = [
    { name: 'Flow', icon: FolderKanban, onNavigate: () => onNavigate('Flow') },
    { name: 'Garden', icon: Sparkles, onNavigate: () => onNavigate('Garden') },
    { name: 'Journal', icon: Book, onNavigate: () => onNavigate('Journal') },
    { name: 'Horizon', icon: Telescope, onNavigate: () => onNavigate('Horizon') },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-serif">Good morning, {firstName}.</h2>
        <p className="text-lg text-foreground/70">
          {format(today, 'EEEE, MMMM d')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <QuickAdd onItemAdded={fetchData} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-sans font-medium">
                <CheckSquare className="h-6 w-6 text-primary" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {incompleteTasks.length > 0 ? (
                  incompleteTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`overview-task-${task.id}`}
                        checked={task.is_completed}
                        onCheckedChange={() => handleToggleTask(task.id, task.is_completed)}
                      />
                      <label htmlFor={`overview-task-${task.id}`}>{task.content}</label>
                    </div>
                  ))
                ) : (
                  <p className="text-foreground/70">Inbox is clear. Great job!</p>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-foreground/70">
                  {hasTodayEntry ? "Journal entry complete." : "Ready to reflect?"}
                </p>
                <Button variant="outline" onClick={() => onNavigate('Journal')}>
                  {hasTodayEntry ? "View Entry" : "Open Journal"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-sans font-medium">Active Projects</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('Flow')}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <ul className="space-y-2">
                  {projects.map((project) => (
                    <li key={project.id} className="p-3 rounded-md hover:bg-secondary">{project.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-foreground/70">No active projects yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans font-medium">Your Spaces</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {spaceLinks.map((link) => (
                  <li key={link.name}>
                    <button onClick={link.onNavigate} className="flex w-full items-center justify-between rounded-md p-3 text-left hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <link.icon className="h-5 w-5 text-primary" />
                        <span>{link.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-foreground/50" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans font-medium">From the Garden</CardTitle>
              <CardDescription>Recent notes and ideas.</CardDescription>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <ul className="space-y-2">
                  {notes.map((note) => (
                    <li key={note.id} className="truncate rounded-md bg-secondary/50 p-3 text-sm">{note.content}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-foreground/70">No notes yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import ProjectsWidget from './dashboard/ProjectsWidget';
import TasksWidget, { Task } from './dashboard/TasksWidget';
import GardenWidget from './dashboard/GardenWidget';
import QuickAdd from './dashboard/QuickAdd';
import { Skeleton } from '@/components/ui/skeleton';
import JournalWidget from './dashboard/JournalWidget';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const projectsPromise = supabase
      .from('projects')
      .select('id, name')
      .order('created_at', { ascending: false });

    const tasksPromise = supabase
      .from('tasks')
      .select('id, content, is_completed')
      .order('created_at', { ascending: false });

    const notesPromise = supabase
      .from('notes')
      .select('id, content')
      .order('created_at', { ascending: false });

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const journalPromise = supabase
      .from('journal_entries')
      .select('id')
      .eq('entry_date', today)
      .single();

    const [projectsResult, tasksResult, notesResult, journalResult] =
      await Promise.all([
        projectsPromise,
        tasksPromise,
        notesPromise,
        journalPromise,
      ]);

    if (projectsResult.error) {
      showError('Could not fetch projects.');
      console.error(projectsResult.error);
    } else {
      setProjects(projectsResult.data);
    }

    if (tasksResult.error) {
      showError('Could not fetch tasks.');
      console.error(tasksResult.error);
    } else {
      setTasks(tasksResult.data);
    }

    if (notesResult.error) {
      showError('Could not fetch notes.');
      console.error(notesResult.error);
    } else {
      setNotes(notesResult.data);
    }

    if (journalResult.data) {
      setHasTodayEntry(true);
    } else {
      setHasTodayEntry(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-serif mb-2">
          {getGreeting()}, {firstName}.
        </h2>
        <p className="text-foreground/70">
          Here's what's on your plate today.
        </p>
      </div>

      <div className="mb-8">
        <QuickAdd onItemAdded={fetchData} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksWidget tasks={tasks} onTaskUpdate={fetchData} />
          <ProjectsWidget
            projects={projects}
            onNavigate={() => onNavigate('Flow')}
          />
          <GardenWidget notes={notes} onNavigate={() => onNavigate('Garden')} />
          <JournalWidget
            hasTodayEntry={hasTodayEntry}
            onNavigate={() => onNavigate('Journal')}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
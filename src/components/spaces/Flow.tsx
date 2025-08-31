import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PlusCircle, FolderKanban } from 'lucide-react';
import { showError } from '@/utils/toast';

type Task = {
  id: string;
  content: string;
  is_completed: boolean;
};

type Project = {
  id: string;
  name: string;
  tasks: Task[];
};

const Flow = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskContent, setNewTaskContent] = useState<{ [key: string]: string }>({});

  const fetchFlowData = async () => {
    setLoading(true);
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .order('created_at', { ascending: false });

    if (projectsError) {
      showError('Could not fetch projects.');
      console.error(projectsError);
      setLoading(false);
      return;
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, content, is_completed, project_id')
      .order('created_at', { ascending: true });

    if (tasksError) {
      showError('Could not fetch tasks.');
      console.error(tasksError);
    }

    const projectsWithTasks = projectsData.map((project) => ({
      ...project,
      tasks: tasksData?.filter((task) => task.project_id === project.id) || [],
    }));

    setProjects(projectsWithTasks);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlowData();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .insert({ name: newProjectName, user_id: user.id });

    if (error) {
      showError(error.message);
    } else {
      setNewProjectName('');
      fetchFlowData();
    }
  };

  const handleAddTask = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    const content = newTaskContent[projectId];
    if (!content || content.trim() === '') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .insert({ content, project_id: projectId, user_id: user.id });

    if (error) {
      showError(error.message);
    } else {
      setNewTaskContent({ ...newTaskContent, [projectId]: '' });
      fetchFlowData();
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !isCompleted })
      .eq('id', taskId);

    if (error) {
      showError(error.message);
    } else {
      fetchFlowData();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <FolderKanban className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Flow</h2>
          <p className="text-foreground/70">
            Manage active projects, courses, and tasks.
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-sans font-medium">New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProject} className="flex gap-2">
            <Input
              placeholder="e.g., Launch new website"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="font-sans font-medium">{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <Checkbox
                        id={task.id}
                        checked={task.is_completed}
                        onCheckedChange={() => handleToggleTask(task.id, task.is_completed)}
                      />
                      <label
                        htmlFor={task.id}
                        className={`flex-grow ${task.is_completed ? 'line-through text-foreground/50' : ''}`}
                      >
                        {task.content}
                      </label>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => handleAddTask(e, project.id)}
                  className="flex gap-2 mt-4 pt-4 border-t"
                >
                  <Input
                    placeholder="Add a task..."
                    value={newTaskContent[project.id] || ''}
                    onChange={(e) =>
                      setNewTaskContent({
                        ...newTaskContent,
                        [project.id]: e.target.value,
                      })
                    }
                  />
                  <Button type="submit" variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Flow;
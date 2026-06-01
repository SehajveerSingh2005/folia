import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

type Task = {
  id: string;
  content: string;
  is_done: boolean;
  isGitHub?: boolean;
  githubRepo?: string;
  githubNumber?: number;
};

const InboxWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskContent, setNewTaskContent] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: dbTasks, error: dbError } = await supabase
        .from('ledger_items')
        .select('id, content, is_done')
        .is('due_date', null)
        .eq('is_done', false)
        .limit(10)
        .order('created_at', { ascending: true });

      if (dbError) {
        console.error('Error fetching tasks:', dbError);
      }

      let merged: Task[] = dbTasks || [];

      const token = localStorage.getItem('folia_github_token');
      if (token) {
        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            const login = userData.login;

            const issuesRes = await fetch(`https://api.github.com/search/issues?q=is:issue+state:open+assignee:${login}`, {
              headers: { Authorization: `token ${token}` },
            });
            if (issuesRes.ok) {
              const issuesData = await issuesRes.json();
              const githubTasks = (issuesData.items || []).map((issue: any) => {
                const repoName = issue.repository_url.split('/repos/')[1] || 'repo';
                return {
                  id: `github-${issue.number}`,
                  content: issue.title,
                  is_done: false,
                  isGitHub: true,
                  githubRepo: repoName,
                  githubNumber: issue.number,
                };
              });
              merged = [...merged, ...githubTasks];
            }
          }
        } catch (ghErr) {
          console.error('Error fetching GitHub issues for inbox:', ghErr);
        }
      }

      setTasks(merged);
    } catch (err) {
      console.error('Error in inbox fetchData:', err);
    } finally {
      setIsLoading(false);
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

    const { data: newTask, error } = await supabase
      .from('ledger_items')
      .insert({
        content: newTaskContent,
        user_id: user.id,
        type: 'Task',
      })
      .select()
      .single();

    if (error) showError(error.message);
    else if (newTask) {
      setTasks([...tasks, newTask]);
      setNewTaskContent('');
    }
  };

  const handleToggleTask = async (task: Task) => {
    const taskId = task.id;
    const isDone = task.is_done;
    const newStatus = !isDone;
    setTasks(tasks.filter(t => t.id !== taskId));

    if (taskId.startsWith('github-') || task.isGitHub) {
      const token = localStorage.getItem('folia_github_token');
      if (!token) {
        showError("Please add your GitHub Personal Access Token in Settings to close issues.");
        fetchData();
        return;
      }
      try {
        const githubRepo = task.githubRepo;
        const githubNumber = task.githubNumber;
        if (!githubRepo || !githubNumber) throw new Error("Invalid GitHub issue metadata.");
        
        const [owner, repo] = githubRepo.split('/');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${githubNumber}`, {
          method: 'PATCH',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: 'closed' }),
        });
        if (!res.ok) throw new Error(res.statusText);
        showSuccess(`Closed GitHub issue #${githubNumber}`);
      } catch (err: any) {
        showError(`Failed to close issue: ${err.message}`);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('ledger_items')
        .update({
          is_done: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        showError(error.message);
        fetchData();
      }
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader>
        <CardTitle className="font-sans font-medium text-base sm:text-lg">Inbox</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Quick tasks and ideas.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <div className="relative flex-grow overflow-hidden">
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto pr-2 space-y-2">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded opacity-50" />
                  <Skeleton className="h-4 w-3/4 opacity-50" />
                </div>
              ))
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Checkbox
                    id={`inbox-task-${task.id}`}
                    checked={task.is_done}
                    onCheckedChange={() => handleToggleTask(task)}
                  />
                  <label
                    htmlFor={`inbox-task-${task.id}`}
                    className="text-xs sm:text-sm flex-grow"
                  >
                    {task.content}
                  </label>
                </div>
              ))
            )}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">Inbox is empty!</p>}
          </div>
          {isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
        <form onSubmit={handleAddTask} className="flex-shrink-0 flex gap-2 mt-4 pt-2 border-t">
          <Input
            placeholder="Add to inbox..."
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
          />
          <Button type="submit" size="icon" className="flex-shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InboxWidget;
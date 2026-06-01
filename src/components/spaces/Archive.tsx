import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Archive as ArchiveIcon, FolderKanban, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { MoreVertical, List, LayoutGrid } from 'lucide-react';
import ArchiveSkeleton from '../skeletons/ArchiveSkeleton';
import ProjectCard from './flow/ProjectCard';
import ProjectDetailSheet from './flow/ProjectDetailSheet';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type LoomItem = {
  id: string;
  name: string;
  type: string | null;
  notes: string | null;
  link: string | null;
  status: string | null;
  start_date: string | null;
  deadline_date: string | null;
  created_at: string;
  tasks: any[];
};

const fetchCompletedItems = async (): Promise<LoomItem[]> => {
  const projectsResponse = await fetch('/api/projects');
  if (!projectsResponse.ok) throw new Error('Failed to fetch archived items');
  const projectsResult = await projectsResponse.json();
  const loomData = projectsResult.data || projectsResult;

  const tasksResponse = await fetch('/api/tasks');
  if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
  const tasksResult = await tasksResponse.json();
  const ledgerData = tasksResult.data || tasksResult;

  const completedProjects = loomData.filter((item: LoomItem) => item.status === 'Completed');

  return completedProjects.map((item: LoomItem) => ({
    ...item,
    tasks: ledgerData?.filter((task: any) => task.loom_item_id === item.id) || [],
  }));
};

const Archive = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedItem, setSelectedItem] = useState<LoomItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: completedItems, isLoading, error } = useQuery<LoomItem[]>({
    queryKey: ['archived_items'],
    queryFn: fetchCompletedItems,
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: 'Active' }),
      });
      if (!response.ok) throw new Error('Failed to unarchive item');
    },
    onSuccess: () => {
      showSuccess('Item moved back to Projects.');
      queryClient.invalidateQueries({ queryKey: ['archived_items'] });
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/projects?id=${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
    },
    onSuccess: () => {
      showSuccess('Item permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['archived_items'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const cloneMutation = useMutation({
    mutationFn: async (item: LoomItem) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${item.name} (Copy)`,
          type: item.type,
          notes: item.notes,
          link: item.link,
          deadline_date: null // Reset deadline for cloned templates
        }),
      });
      if (!response.ok) throw new Error('Failed to clone item');
    },
    onSuccess: () => {
      showSuccess('Project cloned to Projects.');
      queryClient.invalidateQueries({ queryKey: ['flow_data'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  if (error) {
    showError('Could not fetch archived items.');
  }

  // Calculate Insights
  const totalCompleted = completedItems?.length || 0;

  const mostCommonType = useMemo(() => {
    if (!completedItems || completedItems.length === 0) return 'None';
    const counts: Record<string, number> = {};
    completedItems.forEach(item => {
      if (item.type) {
        counts[item.type] = (counts[item.type] || 0) + 1;
      }
    });
    if (Object.keys(counts).length === 0) return 'None';
    return Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }, [completedItems]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <ArchiveIcon className="h-10 w-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif">Shipped</h2>
            <p className="text-foreground/70">
              Your completed projects — everything you've shipped.
            </p>
          </div>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg self-start sm:self-auto">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="px-3 shadow-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" /> List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="px-3 shadow-none"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
          </Button>
        </div>
      </div>

      {!isLoading && completedItems && completedItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-serif font-bold text-primary">{totalCompleted}</span>
            <span className="text-muted-foreground">Total Harvested</span>
          </div>
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-medium text-foreground">{mostCommonType}</span>
            <span className="text-muted-foreground">Top Category</span>
          </div>
        </div>
      )}
      {isLoading ? (
        <ArchiveSkeleton />
      ) : (
        <div className={cn(
          viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
        )}>
          {completedItems && completedItems.map((item) => {
            if (viewMode === 'grid') {
              const totalTasks = item.tasks.length;
              const completedCount = item.tasks.filter(t => t.is_done).length;
              const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

              const cardTasks = item.tasks.map(t => ({
                id: t.id,
                content: t.content,
                completed: t.is_done,
                due_date: t.due_date ? new Date(t.due_date) : undefined
              }));

              return (
                <ProjectCard
                  key={item.id}
                  project={{
                    id: item.id,
                    name: item.name,
                    status: 'Completed',
                    progress: progress,
                    due_date: item.deadline_date || undefined,
                    tasks: cardTasks
                  }}
                  onClick={() => { setSelectedItem(item); setIsSheetOpen(true); }}
                  onEdit={() => { setSelectedItem(item); setIsSheetOpen(true); }}
                  onDelete={() => deleteMutation.mutate(item.id)}
                  onAddTask={() => { }} // Disabled in archive
                  readOnly={true} // Add custom prop if ProjectCard supports it, or just pass empty handlers
                />
              );
            }

            const totalTasks = item.tasks.length;
            const completedCount = item.tasks.filter(t => t.is_done).length;
            const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5 transition-all hover:shadow-md hover:border-primary/40 cursor-pointer"
                onClick={() => { setSelectedItem(item); setIsSheetOpen(true); }}
              >
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="flex flex-row justify-between items-center relative z-10 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                        {item.type || 'Project'}
                      </span>
                      {item.created_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <CardTitle className="font-serif text-xl tracking-tight truncate">
                      {item.name}
                    </CardTitle>
                  </div>

                  <div className="hidden sm:flex flex-col items-end w-32 shrink-0 gap-1.5 opacity-80 mr-4">
                    <div className="flex justify-between w-full text-xs text-muted-foreground">
                      <span>Harvest</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-secondary" indicatorClassName="bg-primary" />
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => cloneMutation.mutate(item)}>
                          <FolderKanban className="mr-2 h-4 w-4" />
                          Clone to Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => unarchiveMutation.mutate(item.id)}>
                          <ArchiveIcon className="mr-2 h-4 w-4" />
                          Restore to Active
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
          {completedItems && completedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/70">Nothing shipped yet.</p>
              <p className="text-sm text-foreground/50">Completed projects will appear here.</p>
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <ProjectDetailSheet
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          project={selectedItem}
          onProjectUpdated={() => queryClient.invalidateQueries({ queryKey: ['archived_items'] })}
        />
      )}
    </div>
  );
};

export default Archive;
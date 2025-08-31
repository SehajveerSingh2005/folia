import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, ArrowRight } from 'lucide-react';

type Project = {
  id: string;
  name: string;
};

interface ProjectsWidgetProps {
  projects: Project[];
  onNavigate: () => void;
}

const ProjectsWidget = ({ projects, onNavigate }: ProjectsWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-primary" />
          <CardTitle className="font-sans text-xl font-medium">
            Active Projects
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onNavigate}>
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <ul className="space-y-2 pt-4">
            {projects.slice(0, 5).map((project) => (
              <li
                key={project.id}
                className="p-3 rounded-md hover:bg-secondary transition-colors"
              >
                {project.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pt-4 text-foreground/70">
            No active projects yet. Create one in the Flow space!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsWidget;
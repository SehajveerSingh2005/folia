import { FolderKanban, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type LoomItemStub = { id: string; name: string };
type HorizonItemNode = {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  link: string | null;
  children: HorizonItemNode[];
  linked_projects: LoomItemStub[];
};

interface HorizonTreeViewProps {
  items: HorizonItemNode[];
}

const HorizonTreeView = ({ items }: HorizonTreeViewProps) => {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <TreeNode key={item.id} item={item} />
      ))}
    </div>
  );
};

interface TreeNodeProps {
  item: HorizonItemNode;
}

const TreeNode = ({ item }: TreeNodeProps) => {
  const hasChildren =
    item.children.length > 0 || item.linked_projects.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="font-medium">{item.title}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          {item.type && <Badge variant="secondary">{item.type}</Badge>}
          {item.priority && <Badge>{item.priority}</Badge>}
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-6 px-2">
                <LinkIcon className="mr-1 h-3 w-3" /> Link
              </Button>
            </a>
          )}
        </div>
      </CardHeader>
      {hasChildren && (
        <CardContent>
          <div className="pl-6 border-l-2 border-dashed space-y-4">
            {item.children.map((child) => (
              <TreeNode key={child.id} item={child} />
            ))}
            {item.linked_projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2 text-sm py-1"
              >
                <FolderKanban className="h-4 w-4 text-primary" />
                <span>{project.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default HorizonTreeView;
import {
  FolderKanban,
  Sparkles,
  Book,
  Telescope,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Space = 'Flow' | 'Garden' | 'Journal' | 'Horizon';

interface DashboardOverviewProps {
  firstName: string;
  onNavigate: (space: Space) => void;
}

const spaceData = [
  {
    id: 'Flow',
    icon: FolderKanban,
    title: 'Flow',
    description: 'Manage active projects, courses, and tasks.',
  },
  {
    id: 'Garden',
    icon: Sparkles,
    title: 'Garden',
    description: 'Cultivate raw ideas and quick notes.',
  },
  {
    id: 'Journal',
    icon: Book,
    title: 'Journal',
    description: 'Reflect daily with guided entries.',
  },
  {
    id: 'Horizon',
    icon: Telescope,
    title: 'Horizon',
    description: 'Set your sights on long-term goals.',
  },
];

const DashboardOverview = ({
  firstName,
  onNavigate,
}: DashboardOverviewProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <h2 className="text-4xl font-serif mb-2">
        {getGreeting()}, {firstName}.
      </h2>
      <p className="text-foreground/70 mb-8">
        What will you create today?
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spaceData.map((space) => (
          <Card
            key={space.id}
            className="flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <space.icon className="h-6 w-6 text-primary" />
                <CardTitle className="font-sans text-2xl font-medium">
                  {space.title}
                </CardTitle>
              </div>
              <CardDescription>{space.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate(space.id as Space)}
              >
                Go to {space.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
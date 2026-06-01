import { useState } from 'react';
import { GitPullRequest, CircleDot, CheckSquare, RefreshCw, Settings, Check, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PR {
  id: string;
  title: string;
  repo: string;
  status: 'open' | 'merged' | 'draft';
  date: string;
}

interface Issue {
  id: string;
  title: string;
  repo: string;
  number: number;
}

const MOCK_PRS: PR[] = [
  { id: '1', title: 'feat: add interactive calendar integration', repo: 'folia-app/core', status: 'open', date: '2d ago' },
  { id: '2', title: 'fix: localstorage layout sync loop on mount', repo: 'folia-app/core', status: 'draft', date: '5h ago' },
];

const MOCK_ISSUES: Issue[] = [
  { id: '1', title: 'Refactor editor slash command overlay positioning', repo: 'folia-app/core', number: 104 },
  { id: '2', title: 'Theme colors clash in dark mode high contrast setting', repo: 'folia-app/core', number: 108 },
];

// Helper to render contribution squares
const ContributionGraph = () => {
  const weeks = 12;
  const days = 7;
  const intensities = [0, 0, 1, 0, 2, 0, 3, 1, 0, 2, 3, 4, 1, 0, 0, 2, 0, 1, 2, 0, 4, 0, 1, 2, 1, 0, 3, 0];

  return (
    <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
      {Array.from({ length: weeks }).map((_, wIdx) => (
        <div key={wIdx} className="flex flex-col gap-1 shrink-0">
          {Array.from({ length: days }).map((_, dIdx) => {
            const index = (wIdx * 7 + dIdx) % intensities.length;
            const level = intensities[index];
            return (
              <span
                key={dIdx}
                className={cn(
                  "w-2 h-2 rounded-[1px] transition-colors",
                  level === 0 && "bg-zinc-100 dark:bg-zinc-800",
                  level === 1 && "bg-emerald-200 dark:bg-emerald-900/40",
                  level === 2 && "bg-emerald-300 dark:bg-emerald-800/60",
                  level === 3 && "bg-emerald-400 dark:bg-emerald-600/80",
                  level === 4 && "bg-emerald-500 dark:bg-emerald-500"
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const GitHubWidget = ({ data, onUpdate }: any) => {
  const isConnected = data.isConnected ?? false;
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      onUpdate({
        ...data,
        isConnected: true,
      });
      setIsConnecting(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    onUpdate({
      ...data,
      isConnected: false,
    });
    setShowSettings(false);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-card text-card-foreground select-none">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 text-zinc-950 dark:text-zinc-50" />
          <span className="font-serif font-medium text-sm tracking-wide">GitHub Integration</span>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors nodrag"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto pt-2">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-3">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/40 rounded-full">
              <Github className="h-6 w-6 text-zinc-950 dark:text-zinc-50" />
            </div>
            <div>
              <p className="text-xs font-medium">Link your GitHub Account</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                Monitor pull requests, assigned issues, and daily contribution streak.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleConnect}
              disabled={isConnecting}
              className="h-8 text-xs font-medium nodrag"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Link GitHub'
              )}
            </Button>
          </div>
        ) : showSettings ? (
          <div className="space-y-4 pt-2 nodrag">
            <div className="p-3 border rounded-lg bg-muted/20">
              <p className="text-xs font-medium">Connected Account</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">github.com/sehajveersingh</p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full h-8 text-xs font-medium"
            >
              Disconnect GitHub
            </Button>
          </div>
        ) : (
          <div className="space-y-3 nodrag h-full flex flex-col">
            {/* Streak & contribution graph */}
            <div className="border-b pb-2">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1">
                <span>CONTRIBUTIONS</span>
                <span className="text-emerald-600 dark:text-emerald-400">12 day streak 🔥</span>
              </div>
              <ContributionGraph />
            </div>

            <Tabs defaultValue="prs" className="w-full flex-grow flex flex-col">
              <TabsList className="grid grid-cols-2 h-7 p-0.5 bg-muted/50 rounded-md mb-2 shrink-0">
                <TabsTrigger value="prs" className="text-[10px] h-6 py-0">PRs ({MOCK_PRS.length})</TabsTrigger>
                <TabsTrigger value="issues" className="text-[10px] h-6 py-0">Issues ({MOCK_ISSUES.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="prs" className="flex-grow space-y-2 mt-0">
                {MOCK_PRS.map(pr => (
                  <div key={pr.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-accent/40 transition-colors">
                    <GitPullRequest className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium leading-tight truncate">{pr.title}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{pr.repo} · {pr.date}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="issues" className="flex-grow space-y-2 mt-0">
                {MOCK_ISSUES.map(issue => (
                  <div key={issue.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-accent/40 transition-colors">
                    <CircleDot className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium leading-tight truncate">{issue.title}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{issue.repo} #{issue.number}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubWidget;

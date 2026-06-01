import { useState, useEffect } from 'react';
import { GitPullRequest, CircleDot, RefreshCw, Settings, Github, Key, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PR {
  id: string;
  title: string;
  repo: string;
  url: string;
  date: string;
}

interface Issue {
  id: string;
  title: string;
  repo: string;
  number: number;
  url: string;
}

const ContributionGraph = ({ weeks }: { weeks: any[] }) => {
  if (!weeks || weeks.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="flex flex-col gap-1 shrink-0">
          {week.contributionDays.map((day: any, dIdx: number) => (
            <span
              key={dIdx}
              title={`${day.contributionCount} contributions on ${day.date}`}
              className="w-2 h-2 rounded-[1.5px] transition-colors"
              style={{
                backgroundColor: day.contributionCount === 0
                  ? 'var(--contrib-bg-empty, rgba(228, 228, 231, 0.2))'
                  : day.color
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const GitHubWidget = ({ data, onUpdate }: any) => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live profile states
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [streak, setStreak] = useState<number>(0);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [prs, setPRs] = useState<PR[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('folia_github_token');
    setToken(storedToken);
  }, []);

  useEffect(() => {
    const handleTokenChange = () => {
      setToken(localStorage.getItem('folia_github_token'));
    };
    window.addEventListener('folia_github_token_changed', handleTokenChange);
    window.addEventListener('storage', handleTokenChange);
    return () => {
      window.removeEventListener('folia_github_token_changed', handleTokenChange);
      window.removeEventListener('storage', handleTokenChange);
    };
  }, []);

  const handleSaveToken = () => {
    const trimmed = tokenInput.trim();
    if (trimmed) {
      localStorage.setItem('folia_github_token', trimmed);
      setToken(trimmed);
      window.dispatchEvent(new Event('folia_github_token_changed'));
      setShowSettings(false);
      setTokenInput('');
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('folia_github_token');
    setToken(null);
    window.dispatchEvent(new Event('folia_github_token_changed'));
    setUsername('');
    setAvatarUrl('');
    setWeeks([]);
    setPRs([]);
    setIssues([]);
    setShowSettings(false);
  };

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        // 1. Fetch User Profile
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` },
        });
        if (!userRes.ok) throw new Error('Invalid token or GitHub API rate limit hit.');
        const userData = await userRes.json();
        const login = userData.login;
        setUsername(login);
        setAvatarUrl(userData.avatar_url);

        // 2. Fetch Contribution Graph via GraphQL
        const gqlQuery = `
          query($username: String!) {
            user(login: $username) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      color
                      contributionCount
                      date
                      weekday
                    }
                  }
                }
              }
            }
          }
        `;
        const gqlRes = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: gqlQuery, variables: { username: login } }),
        });
        if (gqlRes.ok) {
          const gqlData = await gqlRes.json();
          const calendar = gqlData.data?.user?.contributionsCollection?.contributionCalendar;
          if (calendar) {
            const calendarWeeks = calendar.weeks || [];
            // Slice last 18 weeks for compact fit
            setWeeks(calendarWeeks.slice(-18));
            
            // Calculate streak
            let currentStreak = 0;
            const allDays = calendarWeeks
              .flatMap((w: any) => w.contributionDays)
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            for (const day of allDays) {
              if (day.contributionCount > 0) {
                currentStreak++;
              } else {
                // If it's today and count is 0, check if we had contributions yesterday
                const dayDate = new Date(day.date);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - dayDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 1 && currentStreak === 0) {
                  continue;
                }
                break;
              }
            }
            setStreak(currentStreak);
          }
        }

        // 3. Fetch PRs
        const prsRes = await fetch(`https://api.github.com/search/issues?q=is:pr+state:open+author:${login}`, {
          headers: { Authorization: `token ${token}` },
        });
        if (prsRes.ok) {
          const prsData = await prsRes.json();
          const items = (prsData.items || []).slice(0, 5).map((item: any) => {
            const repoName = item.repository_url.split('/repos/')[1] || 'repo';
            return {
              id: String(item.id),
              title: item.title,
              repo: repoName,
              url: item.html_url,
              date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            };
          });
          setPRs(items);
        }

        // 4. Fetch Issues
        const issuesRes = await fetch(`https://api.github.com/search/issues?q=is:issue+state:open+assignee:${login}`, {
          headers: { Authorization: `token ${token}` },
        });
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          const items = (issuesData.items || []).slice(0, 5).map((item: any) => {
            const repoName = item.repository_url.split('/repos/')[1] || 'repo';
            return {
              id: String(item.id),
              title: item.title,
              repo: repoName,
              number: item.number,
              url: item.html_url,
            };
          });
          setIssues(items);
        }

      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading GitHub data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="h-full flex flex-col p-4 bg-card text-card-foreground select-none">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 text-zinc-950 dark:text-zinc-50" />
          <span className="font-serif font-medium text-sm tracking-wide">GitHub Integration</span>
        </div>
        {token && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors nodrag"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto pt-2 min-h-0">
        {!token ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-2 gap-3">
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/40 rounded-full">
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold">Link GitHub Token</p>
              <p className="text-[10px] text-muted-foreground max-w-[220px] leading-normal">
                Paste your Personal Access Token (PAT) below to fetch your actual streak, PRs, and issues. You can{' '}
                <a
                  href="https://github.com/settings/tokens/new?description=Folia%20App&scopes=repo,user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  generate one here
                </a>{' '}
                with <code className="px-1 py-0.5 bg-muted rounded text-[9px]">repo</code> and <code className="px-1 py-0.5 bg-muted rounded text-[9px]">user</code> scopes.
              </p>
            </div>
            <div className="flex w-full gap-1 px-2 nodrag">
              <Input
                type="password"
                placeholder="ghp_..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="h-8 text-xs bg-muted/40"
              />
              <Button size="sm" onClick={handleSaveToken} className="h-8 text-xs px-3">
                Save
              </Button>
            </div>
          </div>
        ) : showSettings ? (
          <div className="space-y-4 pt-2 nodrag">
            <div className="p-3 border rounded-xl bg-muted/20 flex items-center gap-3">
              {avatarUrl && <img src={avatarUrl} alt={username} className="w-8 h-8 rounded-full border border-border" />}
              <div>
                <p className="text-xs font-medium">Connected Account</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">github.com/{username || 'Loading...'}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full h-8 text-xs font-medium rounded-lg"
            >
              Disconnect GitHub
            </Button>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center p-8">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : errorMsg ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <p className="text-xs text-destructive font-medium">Failed to load data</p>
            <p className="text-[10px] text-muted-foreground mt-1">{errorMsg}</p>
          </div>
        ) : (
          <div className="space-y-3 nodrag h-full flex flex-col min-h-0">
            {/* Streak & contribution graph */}
            <div className="border-b pb-2">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mb-1">
                <span>CONTRIBUTIONS</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{streak} day streak 🔥</span>
              </div>
              <ContributionGraph weeks={weeks} />
            </div>

            <Tabs defaultValue="prs" className="w-full flex-grow flex flex-col min-h-0">
              <TabsList className="grid grid-cols-2 h-7 p-0.5 bg-muted/50 rounded-md mb-2 shrink-0">
                <TabsTrigger value="prs" className="text-[10px] h-6 py-0">PRs ({prs.length})</TabsTrigger>
                <TabsTrigger value="issues" className="text-[10px] h-6 py-0">Issues ({issues.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="prs" className="flex-grow space-y-1.5 mt-0 overflow-y-auto pr-1">
                {prs.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No open PRs found.</p>
                ) : (
                  prs.map(pr => (
                    <a
                      key={pr.id}
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 p-1.5 rounded hover:bg-accent/40 transition-colors group"
                    >
                      <GitPullRequest className="h-3 w-3 mt-0.5 text-purple-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium leading-tight truncate group-hover:text-primary flex items-center gap-1">
                          {pr.title}
                          <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{pr.repo} · {pr.date}</p>
                      </div>
                    </a>
                  ))
                )}
              </TabsContent>

              <TabsContent value="issues" className="flex-grow space-y-1.5 mt-0 overflow-y-auto pr-1">
                {issues.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No open issues assigned.</p>
                ) : (
                  issues.map(issue => (
                    <a
                      key={issue.id}
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 p-1.5 rounded hover:bg-accent/40 transition-colors group"
                    >
                      <CircleDot className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium leading-tight truncate group-hover:text-primary flex items-center gap-1">
                          {issue.title}
                          <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{issue.repo} #{issue.number}</p>
                      </div>
                    </a>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubWidget;

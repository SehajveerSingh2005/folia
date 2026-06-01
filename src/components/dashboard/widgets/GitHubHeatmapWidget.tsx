import { useState, useEffect } from 'react';
import { Github, RefreshCw, Key, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ContributionGraph = ({ weeks }: { weeks: any[] }) => {
  if (!weeks || weeks.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none justify-between">
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

const GitHubHeatmapWidget = ({ data, onUpdate }: any) => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [streak, setStreak] = useState<number>(0);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [weeks, setWeeks] = useState<any[]>([]);

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
    setStreak(0);
    setTotalContributions(0);
    setShowSettings(false);
  };

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` },
        });
        if (!userRes.ok) throw new Error('Invalid token or GitHub API rate limit hit.');
        const userData = await userRes.json();
        const login = userData.login;
        setUsername(login);
        setAvatarUrl(userData.avatar_url);

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
            setTotalContributions(calendar.totalContributions);
            const calendarWeeks = calendar.weeks || [];
            // Slice last 25 weeks to fit in the wide heatmap widget nicely
            setWeeks(calendarWeeks.slice(-25));

            let currentStreak = 0;
            const allDays = calendarWeeks
              .flatMap((w: any) => w.contributionDays)
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            for (const day of allDays) {
              if (day.contributionCount > 0) {
                currentStreak++;
              } else {
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
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading contributions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="h-full flex flex-col p-4 bg-card text-card-foreground select-none justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 text-zinc-950 dark:text-zinc-50" />
          <span className="font-serif font-medium text-sm tracking-wide">Contributions</span>
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

      {/* Content */}
      <div className="flex-grow flex flex-col justify-center min-h-0">
        {!token ? (
          <div className="flex flex-col items-center justify-center text-center py-2 gap-2">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800/40 rounded-full">
              <Key className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold">GitHub Heatmap</p>
              <p className="text-[10px] text-muted-foreground max-w-[240px] leading-normal">
                Configure your GitHub PAT below to display your contributions graph.
              </p>
            </div>
            <div className="flex w-full max-w-sm gap-1 px-4 nodrag">
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
          <div className="space-y-3 py-2 nodrag max-w-xs mx-auto w-full">
            <div className="p-2.5 border rounded-xl bg-muted/20 flex items-center gap-3">
              {avatarUrl && <img src={avatarUrl} alt={username} className="w-8 h-8 rounded-full border border-border" />}
              <div>
                <p className="text-xs font-medium">Connected Account</p>
                <p className="text-[10px] text-muted-foreground">github.com/{username || 'Loading...'}</p>
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
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-xs text-destructive font-medium">Failed to load graph</p>
            <p className="text-[10px] text-muted-foreground mt-1">{errorMsg}</p>
          </div>
        ) : (
          <div className="space-y-3 nodrag py-1">
            <div className="flex items-end justify-between">
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Contributions</p>
                  <p className="text-2xl font-semibold tracking-tight">{totalContributions}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Current Streak</p>
                  <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">{streak} days 🔥</p>
                </div>
              </div>
              {avatarUrl && (
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity pb-1"
                >
                  <img src={avatarUrl} alt={username} className="w-5 h-5 rounded-full border border-border" />
                  <span className="text-[10px] font-semibold text-muted-foreground">@{username}</span>
                </a>
              )}
            </div>
            <ContributionGraph weeks={weeks} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubHeatmapWidget;

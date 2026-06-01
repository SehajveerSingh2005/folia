import { useState, useEffect } from 'react';
import { CircleDot, RefreshCw, Key, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Issue {
  id: string;
  title: string;
  repo: string;
  number: number;
  url: string;
}

const GitHubIssuesWidget = ({ data, onUpdate }: any) => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
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
    setIssues([]);
    setShowSettings(false);
  };

  const filter = data.filter || 'assigned';

  const getTitle = () => {
    switch (filter) {
      case 'created':
        return 'Created Issues';
      case 'user':
        return 'Issues in My Repos';
      case 'mentioned':
        return 'Mentioned Issues';
      case 'involves':
        return 'Issues Involving Me';
      case 'assigned':
      default:
        return 'Assigned Issues';
    }
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

        let queryPart = `assignee:${login}`;
        if (filter === 'created') queryPart = `author:${login}`;
        else if (filter === 'user') queryPart = `user:${login}`;
        else if (filter === 'mentioned') queryPart = `mentions:${login}`;
        else if (filter === 'involves') queryPart = `involves:${login}`;

        const issuesRes = await fetch(`https://api.github.com/search/issues?q=is:issue+state:open+${queryPart}`, {
          headers: { Authorization: `token ${token}` },
        });
        if (!issuesRes.ok) throw new Error('Failed to fetch Issues.');
        const issuesData = await issuesRes.json();
        const items = (issuesData.items || []).slice(0, 10).map((item: any) => {
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
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading Issues.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, filter]);

  return (
    <div className="h-full flex flex-col p-4 bg-card text-card-foreground select-none relative group">
      {/* Floating Settings Button in Bottom Left */}
      {token && (
        <div className="absolute bottom-3 left-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto nodrag">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-full bg-background/80 dark:bg-zinc-900/80 border shadow-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-emerald-500" />
          <span className="font-serif font-medium text-sm tracking-wide">{getTitle()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto pt-2 pb-10 min-h-0">
        {!token ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-2 gap-3">
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/40 rounded-full">
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold">GitHub Issues</p>
              <p className="text-[10px] text-muted-foreground max-w-[220px] leading-normal">
                Paste your Personal Access Token (PAT) below to track your assigned open issues. You can{' '}
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
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Issue Filter</label>
              <select
                value={filter}
                onChange={(e) => onUpdate({ ...data, filter: e.target.value })}
                className="w-full text-xs bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="assigned">Assigned to me</option>
                <option value="created">Created by me</option>
                <option value="user">In my repositories</option>
                <option value="mentioned">Mentioned me</option>
                <option value="involves">Involving me</option>
              </select>
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
            <p className="text-xs text-destructive font-medium">Failed to load Issues</p>
            <p className="text-[10px] text-muted-foreground mt-1">{errorMsg}</p>
          </div>
        ) : (
          <div className="space-y-2 nodrag">
            {issues.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">No assigned issues found.</p>
            ) : (
              issues.map(issue => (
                <a
                  key={issue.id}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/40 transition-colors group"
                >
                  <CircleDot className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-normal truncate group-hover:text-primary flex items-center gap-1">
                      {issue.title}
                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{issue.repo} #{issue.number}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubIssuesWidget;

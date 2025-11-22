import { useEffect } from 'react';
import { useWorkspaceStore } from '@/lib/stores/workspace-store';
import { toast } from 'sonner';

export function useWorkspaces(forceRefresh = false) {
  const {
    workspaces,
    isLoading,
    error,
    setWorkspaces,
    setLoading,
    setError,
    shouldRefetch,
    markFetched,
  } = useWorkspaceStore();

  const workspaceList = Object.values(workspaces);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const cacheKey = 'workspaces-list';
      
      if (!forceRefresh && !shouldRefetch(cacheKey)) {
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/workspaces');
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data.workspaces);
          markFetched(cacheKey);
        } else {
          throw new Error('Failed to fetch workspaces');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch workspaces';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [forceRefresh]);

  return {
    workspaces: workspaceList,
    isLoading,
    error,
  };
}

export function useWorkspace(workspaceId: string, forceRefresh = false) {
  const {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    setCurrentWorkspace,
    addWorkspace,
    setLoading,
    setError,
    shouldRefetch,
    markFetched,
  } = useWorkspaceStore();

  useEffect(() => {
    const fetchWorkspace = async () => {
      const cacheKey = `workspace-${workspaceId}`;
      
      // Check if we have cached data
      if (!forceRefresh && workspaces[workspaceId] && !shouldRefetch(cacheKey)) {
        setCurrentWorkspace(workspaces[workspaceId]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          addWorkspace(data.workspace);
          setCurrentWorkspace(data.workspace);
          markFetched(cacheKey);
        } else {
          throw new Error('Failed to fetch workspace');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch workspace';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
    }
  }, [workspaceId, forceRefresh]);

  return {
    workspace: currentWorkspace,
    isLoading,
    error,
  };
}

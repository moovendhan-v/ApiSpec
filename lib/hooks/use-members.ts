import { useEffect } from 'react';
import { useMemberStore } from '@/lib/stores/member-store';
import { toast } from 'sonner';

export function useWorkspaceMembers(workspaceId: string, forceRefresh = false) {
  const {
    getWorkspaceMembers,
    setWorkspaceMembers,
    isLoading,
    error,
    setLoading,
    setError,
    shouldRefetch,
    markFetched,
  } = useMemberStore();

  const members = getWorkspaceMembers(workspaceId);

  useEffect(() => {
    const fetchMembers = async () => {
      const cacheKey = `workspace-members-${workspaceId}`;
      
      if (!forceRefresh && members.length > 0 && !shouldRefetch(cacheKey)) {
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (res.ok) {
          const data = await res.json();
          setWorkspaceMembers(workspaceId, data.members);
          markFetched(cacheKey);
        } else {
          throw new Error('Failed to fetch members');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch members';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId, forceRefresh]);

  return {
    members,
    isLoading,
    error,
  };
}

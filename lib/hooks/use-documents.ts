import { useEffect } from 'react';
import { useDocumentStore } from '@/lib/stores/document-store';
import { toast } from 'sonner';

export function useDocuments(page = 1, limit = 10, forceRefresh = false) {
  const {
    documents,
    isLoading,
    error,
    setDocuments,
    setLoading,
    setError,
    shouldRefetch,
    markFetched,
  } = useDocumentStore();

  const documentList = Object.values(documents);

  useEffect(() => {
    const fetchDocuments = async () => {
      const cacheKey = `documents-${page}-${limit}`;
      
      if (!forceRefresh && !shouldRefetch(cacheKey)) {
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/documents?page=${page}&limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents);
          markFetched(cacheKey);
        } else {
          throw new Error('Failed to fetch documents');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch documents';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [page, limit, forceRefresh]);

  return {
    documents: documentList,
    isLoading,
    error,
  };
}

export function useWorkspaceDocuments(workspaceId: string, forceRefresh = false) {
  const {
    getWorkspaceDocuments,
    setWorkspaceDocuments,
    isLoading,
    error,
    setLoading,
    setError,
    shouldRefetch,
    markFetched,
  } = useDocumentStore();

  const documents = getWorkspaceDocuments(workspaceId);

  useEffect(() => {
    const fetchDocuments = async () => {
      const cacheKey = `workspace-documents-${workspaceId}`;
      
      if (!forceRefresh && documents.length > 0 && !shouldRefetch(cacheKey)) {
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.workspace.documents) {
            setWorkspaceDocuments(workspaceId, data.workspace.documents);
            markFetched(cacheKey);
          }
        } else {
          throw new Error('Failed to fetch workspace documents');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch documents';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchDocuments();
    }
  }, [workspaceId, forceRefresh]);

  return {
    documents,
    isLoading,
    error,
  };
}

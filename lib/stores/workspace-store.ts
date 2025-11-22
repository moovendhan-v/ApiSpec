import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  avatar: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
    members: number;
  };
  members?: any[];
  documents?: any[];
  policies?: any[];
}

interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  currentWorkspace: Workspace | null;
  lastFetch: Record<string, number>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  shouldRefetch: (key: string, ttl?: number) => boolean;
  markFetched: (key: string) => void;
  clearCache: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: {},
      currentWorkspace: null,
      lastFetch: {},
      isLoading: false,
      error: null,

      setWorkspaces: (workspaces) =>
        set({
          workspaces: workspaces.reduce((acc, ws) => {
            acc[ws.id] = ws;
            return acc;
          }, {} as Record<string, Workspace>),
        }),

      setCurrentWorkspace: (workspace) =>
        set({ currentWorkspace: workspace }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [workspace.id]: workspace,
          },
        })),

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [id]: { ...state.workspaces[id], ...updates },
          },
          currentWorkspace:
            state.currentWorkspace?.id === id
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        })),

      removeWorkspace: (id) =>
        set((state) => {
          const { [id]: removed, ...rest } = state.workspaces;
          return {
            workspaces: rest,
            currentWorkspace:
              state.currentWorkspace?.id === id ? null : state.currentWorkspace,
          };
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      shouldRefetch: (key, ttl = CACHE_TTL) => {
        const lastFetch = get().lastFetch[key];
        if (!lastFetch) return true;
        return Date.now() - lastFetch > ttl;
      },

      markFetched: (key) =>
        set((state) => ({
          lastFetch: {
            ...state.lastFetch,
            [key]: Date.now(),
          },
        })),

      clearCache: () =>
        set({
          workspaces: {},
          currentWorkspace: null,
          lastFetch: {},
          error: null,
        }),
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspaces: state.workspaces,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

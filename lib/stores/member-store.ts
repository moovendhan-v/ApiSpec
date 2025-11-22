import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Member {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  attachedPolicies: string[];
  joinedAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface MemberState {
  members: Record<string, Member>; // memberId -> Member
  workspaceMembers: Record<string, string[]>; // workspaceId -> memberIds
  lastFetch: Record<string, number>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setWorkspaceMembers: (workspaceId: string, members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  removeMember: (id: string) => void;
  getWorkspaceMembers: (workspaceId: string) => Member[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  shouldRefetch: (key: string, ttl?: number) => boolean;
  markFetched: (key: string) => void;
  clearCache: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: {},
      workspaceMembers: {},
      lastFetch: {},
      isLoading: false,
      error: null,

      setWorkspaceMembers: (workspaceId, members) =>
        set((state) => {
          const newMembers = { ...state.members };
          const memberIds: string[] = [];

          members.forEach((member) => {
            newMembers[member.id] = member;
            memberIds.push(member.id);
          });

          return {
            members: newMembers,
            workspaceMembers: {
              ...state.workspaceMembers,
              [workspaceId]: memberIds,
            },
          };
        }),

      addMember: (member) =>
        set((state) => {
          const newMembers = {
            ...state.members,
            [member.id]: member,
          };

          const wsMembers = state.workspaceMembers[member.workspaceId] || [];
          if (!wsMembers.includes(member.id)) {
            wsMembers.push(member.id);
          }

          return {
            members: newMembers,
            workspaceMembers: {
              ...state.workspaceMembers,
              [member.workspaceId]: wsMembers,
            },
          };
        }),

      updateMember: (id, updates) =>
        set((state) => ({
          members: {
            ...state.members,
            [id]: { ...state.members[id], ...updates },
          },
        })),

      removeMember: (id) =>
        set((state) => {
          const { [id]: removed, ...rest } = state.members;
          
          // Remove from workspace members
          const newWorkspaceMembers = { ...state.workspaceMembers };
          Object.keys(newWorkspaceMembers).forEach((wsId) => {
            newWorkspaceMembers[wsId] = newWorkspaceMembers[wsId].filter(
              (memberId) => memberId !== id
            );
          });

          return {
            members: rest,
            workspaceMembers: newWorkspaceMembers,
          };
        }),

      getWorkspaceMembers: (workspaceId) => {
        const state = get();
        const memberIds = state.workspaceMembers[workspaceId] || [];
        return memberIds.map((id) => state.members[id]).filter(Boolean);
      },

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
          members: {},
          workspaceMembers: {},
          lastFetch: {},
          error: null,
        }),
    }),
    {
      name: 'member-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        members: state.members,
        workspaceMembers: state.workspaceMembers,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

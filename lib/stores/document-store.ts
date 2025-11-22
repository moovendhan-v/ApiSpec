import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Document {
  id: string;
  title: string;
  content: string;
  description: string | null;
  isPublic: boolean;
  status: string;
  tags: string[];
  version: number;
  workspaceId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface DocumentState {
  documents: Record<string, Document>;
  workspaceDocuments: Record<string, string[]>; // workspaceId -> documentIds
  lastFetch: Record<string, number>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setWorkspaceDocuments: (workspaceId: string, documents: Document[]) => void;
  getWorkspaceDocuments: (workspaceId: string) => Document[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  shouldRefetch: (key: string, ttl?: number) => boolean;
  markFetched: (key: string) => void;
  clearCache: () => void;
}

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: {},
      workspaceDocuments: {},
      lastFetch: {},
      isLoading: false,
      error: null,

      setDocuments: (documents) =>
        set({
          documents: documents.reduce((acc, doc) => {
            acc[doc.id] = doc;
            return acc;
          }, {} as Record<string, Document>),
        }),

      addDocument: (document) =>
        set((state) => {
          const newDocuments = {
            ...state.documents,
            [document.id]: document,
          };

          // Update workspace documents if applicable
          const newWorkspaceDocuments = { ...state.workspaceDocuments };
          if (document.workspaceId) {
            const wsDocIds = newWorkspaceDocuments[document.workspaceId] || [];
            if (!wsDocIds.includes(document.id)) {
              newWorkspaceDocuments[document.workspaceId] = [...wsDocIds, document.id];
            }
          }

          return {
            documents: newDocuments,
            workspaceDocuments: newWorkspaceDocuments,
          };
        }),

      updateDocument: (id, updates) =>
        set((state) => ({
          documents: {
            ...state.documents,
            [id]: { ...state.documents[id], ...updates },
          },
        })),

      removeDocument: (id) =>
        set((state) => {
          const { [id]: removed, ...rest } = state.documents;
          
          // Remove from workspace documents
          const newWorkspaceDocuments = { ...state.workspaceDocuments };
          Object.keys(newWorkspaceDocuments).forEach((wsId) => {
            newWorkspaceDocuments[wsId] = newWorkspaceDocuments[wsId].filter(
              (docId) => docId !== id
            );
          });

          return {
            documents: rest,
            workspaceDocuments: newWorkspaceDocuments,
          };
        }),

      setWorkspaceDocuments: (workspaceId, documents) =>
        set((state) => {
          const newDocuments = { ...state.documents };
          const documentIds: string[] = [];

          documents.forEach((doc) => {
            newDocuments[doc.id] = doc;
            documentIds.push(doc.id);
          });

          return {
            documents: newDocuments,
            workspaceDocuments: {
              ...state.workspaceDocuments,
              [workspaceId]: documentIds,
            },
          };
        }),

      getWorkspaceDocuments: (workspaceId) => {
        const state = get();
        const docIds = state.workspaceDocuments[workspaceId] || [];
        return docIds.map((id) => state.documents[id]).filter(Boolean);
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
          documents: {},
          workspaceDocuments: {},
          lastFetch: {},
          error: null,
        }),
    }),
    {
      name: 'document-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documents: state.documents,
        workspaceDocuments: state.workspaceDocuments,
        lastFetch: state.lastFetch,
      }),
    }
  )
);

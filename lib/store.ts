// lib/store.ts
import { create } from 'zustand';

interface ApiDocument {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  password?: string;
  createdAt: Date;
}

interface ApiStore {
  documents: ApiDocument[];
  addDocument: (doc: Omit<ApiDocument, 'id' | 'createdAt'>) => void;
  getDocument: (id: string) => ApiDocument | undefined;
  updateDocument: (id: string, updates: Partial<ApiDocument>) => void;
  deleteDocument: (id: string) => void;
}

export const useApiStore = create<ApiStore>((set, get) => ({
  documents: [],
  addDocument: (doc) =>
    set((state) => ({
      documents: [
        ...state.documents,
        {
          ...doc,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date(),
        },
      ],
    })),
  getDocument: (id) => get().documents.find((doc) => doc.id === id),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    })),
  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),
}));
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShareLink {
  documentId: string;
  token: string;
  shareUrl: string;
  expiresAt: string;
  expiryHours: number;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
  };
  createdAt: string;
}

interface ShareStore {
  shareLinks: Record<string, ShareLink>;
  addShareLink: (documentId: string, link: ShareLink) => void;
  getShareLink: (documentId: string) => ShareLink | null;
  removeShareLink: (documentId: string) => void;
  clearExpiredLinks: () => void;
}

export const useShareStore = create<ShareStore>()(
  persist(
    (set, get) => ({
      shareLinks: {},

      addShareLink: (documentId, link) => {
        set((state) 
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
        set((state) => ({
          shareLinks: {
            ...state.shareLinks,
            [documentId]: { ...link, createdAt: new Date().toISOString() },
          },
        }));
      },

      getShareLink: (documentId) => {
        const link = get().shareLinks[documentId];
        if (!link) return null;
        
        // Check if expired
        if (new Date(link.expiresAt) < new Date()) {
          get().removeShareLink(documentId);
          return null;
        }
        
        return link;
      },

      removeShareLink: (documentId) => {
        set((state) => {
          const { [documentId]: _, ...rest } = state.shareLinks;
          return { shareLinks: rest };
        });
      },

      clearExpiredLinks: () => {
        set((state) => {
          const now = new Date();
          const validLinks = Object.entries(state.shareLinks).reduce(
            (acc, [id, link]) => {
              if (new Date(link.expiresAt) > now) {
                acc[id] = link;
              }
              return acc;
            },
            {} as Record<string, ShareLink>
          );
          return { shareLinks: validLinks };
        });
      },
    }),
    {
      name: 'share-store',
    }
  )
);

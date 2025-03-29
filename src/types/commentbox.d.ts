// En un archivo nuevo: src/types/commentbox.d.ts
declare module 'commentbox.io' {
    export default function commentBox(
      projectId: string, 
      options?: {
        className?: string;
        defaultBoxId?: string;
        tlcParam?: string;
        sortOrder?: 'best' | 'newest' | 'oldest';
        backgroundColor?: string | null;
        textColor?: string | null;
        subtextColor?: string | null;
        createBoxUrl?: (boxId: string, pageLocation: Location) => string;
        onCommentCount?: (count: number) => void;
        singleSignOn?: any;
      }
    ): () => void;
  }
import { create } from 'zustand';

export interface BooktrovertBook {
  book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  synopsis: string | null;
  genre_tags: string[];
  source: 'api' | 'manual';
}

export interface ContextTags {
  pacing: string[];
  emotionalTone: string[];
  writingStyle: string[];
  structure: string[];
  tropes: string[];
  feelingAfterFinishing: string[];
}

export interface TaggedBook {
  book: BooktrovertBook;
  tags: ContextTags;
  shelf?: string;
  rating?: number;
}

interface OnboardingState {
  taggedBooks: TaggedBook[];
  addTaggedBook: (book: TaggedBook) => void;
  removeTaggedBook: (bookId: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  taggedBooks: [],
  addTaggedBook: (book) => set((state) => {
    // Avoid duplicates
    if (state.taggedBooks.find(b => b.book.book_id === book.book.book_id)) {
      return state;
    }
    return { taggedBooks: [...state.taggedBooks, book] };
  }),
  removeTaggedBook: (bookId) => set((state) => ({
    taggedBooks: state.taggedBooks.filter(b => b.book.book_id !== bookId)
  })),
  reset: () => set({ taggedBooks: [] }),
}));

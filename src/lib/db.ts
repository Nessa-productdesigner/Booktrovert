import { supabase } from './supabase';
import type { BooktrovertBook, ContextTags } from '../store/useOnboardingStore';

export type ShelfType = 'to_read' | 'currently_reading' | 'read' | 'rereading' | 'did_not_finish';

export const EMPTY_TAGS: ContextTags = {
  pacing: [],
  emotionalTone: [],
  writingStyle: [],
  structure: [],
  tropes: [],
  feelingAfterFinishing: [],
};

export async function ensureBookExists(book: BooktrovertBook): Promise<void> {
  const actualId = book.book_id;
  
  const { data: existing } = await supabase
    .from('books')
    .select('id')
    .eq('id', actualId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from('books').insert({
      id: actualId,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      synopsis: book.synopsis,
      genre_tags: book.genre_tags,
      source: book.source,
    });
    if (error) throw error;
  }
}

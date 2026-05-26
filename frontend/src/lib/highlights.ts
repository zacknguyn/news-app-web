import { backendApi, type BackendReaderHighlightDTO } from './api';
import type { Post } from '../types';

export type SavedHighlight = {
  id: string;
  postId: string;
  postTitle: string;
  channelName: string;
  text: string;
  start?: number;
  end?: number;
  note?: string;
  createdAt: string;
};

export const backendHighlightToSavedHighlight = (highlight: BackendReaderHighlightDTO): SavedHighlight => ({
  id: String(highlight.id),
  postId: highlight.postId ? String(highlight.postId) : '',
  postTitle: highlight.postTitle || highlight.articleTitle || 'Saved article',
  channelName: highlight.channelName || 'Articles',
  text: highlight.text,
  start: highlight.startOffset ?? undefined,
  end: highlight.endOffset ?? undefined,
  note: highlight.note || undefined,
  createdAt: highlight.createdAt,
});

export const getHighlights = async () =>
  (await backendApi.getReaderHighlights()).map(backendHighlightToSavedHighlight);

export const getHighlightsForPost = async (postId: string) =>
  (await backendApi.getReaderHighlightsByPost(postId)).map(backendHighlightToSavedHighlight);

export const saveHighlight = async (
  post: Post,
  text: string,
  range?: { start: number; end: number }
): Promise<SavedHighlight> => {
  const created = await backendApi.createReaderHighlight({
    postId: Number(post.id),
    articleId: post.backendArticleId ? Number(post.backendArticleId) : undefined,
    text: text.trim(),
    startOffset: range?.start,
    endOffset: range?.end,
  });
  return backendHighlightToSavedHighlight(created);
};

export const deleteHighlight = (id: string) => backendApi.deleteReaderHighlight(id);

export const updateHighlightNote = (id: string, note: string) =>
  backendApi.updateReaderHighlight(id, { note: note.trim() });

export const countHighlightsForPost = async (postId: string) => (await getHighlightsForPost(postId)).length;

import { backendApi, type BackendReaderHighlightDTO } from './api';
import type { Post } from '../types';

export type SavedHighlight = {
  id: string;
  postId: string;
  articleId?: string;
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
  postId: highlight.postId ? String(highlight.postId) : highlight.articleId ? `article-${highlight.articleId}` : '',
  articleId: highlight.articleId ? String(highlight.articleId) : undefined,
  postTitle: highlight.postTitle || highlight.articleTitle || 'Saved article',
  channelName: highlight.channelName || 'Articles',
  text: highlight.text,
  start: highlight.startOffset ?? undefined,
  end: highlight.endOffset ?? undefined,
  note: highlight.note || undefined,
  createdAt: highlight.createdAt,
});

export const getHighlights = async () => (await backendApi.getReaderHighlights()).map(backendHighlightToSavedHighlight);

export const getHighlightsForPost = async (postId: string, articleId?: string) => {
  if (articleId) {
    return (await backendApi.getReaderHighlightsByArticle(articleId)).map(backendHighlightToSavedHighlight);
  }

  return (await backendApi.getReaderHighlightsByPost(postId)).map(backendHighlightToSavedHighlight);
};

export const saveHighlight = async (
  post: Post,
  text: string,
  range?: { start: number; end: number },
): Promise<SavedHighlight> => {
  const numericPostId = Number(post.id);
  const numericArticleId = post.backendArticleId ? Number(post.backendArticleId) : NaN;
  const input = {
    postId: Number.isFinite(numericPostId) ? numericPostId : undefined,
    articleId: Number.isFinite(numericArticleId) ? numericArticleId : undefined,
    text: text.trim(),
    startOffset: range?.start,
    endOffset: range?.end,
  };

  if (!input.postId && !input.articleId) {
    throw new Error('This story cannot be highlighted until it is saved by the backend.');
  }

  const created = await backendApi.createReaderHighlight({
    ...input,
  });
  return backendHighlightToSavedHighlight(created);
};

export const deleteHighlight = (id: string) => backendApi.deleteReaderHighlight(id);

export const updateHighlightNote = (id: string, note: string) =>
  backendApi.updateReaderHighlight(id, { note: note.trim() });

export const countHighlightsForPost = async (postId: string, articleId?: string) =>
  (await getHighlightsForPost(postId, articleId)).length;

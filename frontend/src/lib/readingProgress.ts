import { backendApi, type BackendReadingProgressDTO } from './api';

export type ReadingProgress = {
  postId: string;
  title: string;
  channelName: string;
  trustLabel: string;
  highlightCount: number;
  progress: number;
  scrollY: number;
  updatedAt: string;
};

export const backendProgressToReadingProgress = (dto: BackendReadingProgressDTO): ReadingProgress => ({
  postId: String(dto.postId),
  title: dto.title,
  channelName: dto.channelName || 'Articles',
  trustLabel: 'Saved progress',
  highlightCount: 0,
  progress: dto.progress,
  scrollY: dto.scrollY,
  updatedAt: dto.updatedAt,
});

export const readProgress = async (): Promise<ReadingProgress | null> => {
  const progress = await backendApi.getReadingProgress();
  const latest = progress.find(item => item.progress < 98) || null;
  return latest ? backendProgressToReadingProgress(latest) : null;
};

export const saveProgress = async (input: {
  postId: string;
  articleId?: string;
  scrollY: number;
  progress: number;
}) => {
  const postId = Number(input.postId);
  const articleId = input.articleId ? Number(input.articleId) : undefined;
  if (!postId || Number.isNaN(postId)) return null;

  if (input.progress >= 98) {
    await clearProgress(input.postId);
    return null;
  }

  return backendApi.saveReadingProgress({
    postId,
    articleId: articleId && !Number.isNaN(articleId) ? articleId : undefined,
    scrollY: Math.max(0, Math.round(input.scrollY)),
    progress: Math.max(1, Math.round(input.progress)),
  });
};

export const clearProgress = async (postId: string) => {
  const numericPostId = Number(postId);
  if (!numericPostId || Number.isNaN(numericPostId)) return;
  await backendApi.clearReadingProgress(numericPostId);
};

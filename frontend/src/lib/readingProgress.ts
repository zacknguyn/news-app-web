import { backendApi, type BackendReadingProgressDTO } from './api';

const LOCAL_PROGRESS_KEY = 'tourane-news-reading-progress';

export type ReadingProgress = {
  postId: string;
  articleId?: string;
  title: string;
  channelName: string;
  trustLabel: string;
  highlightCount: number;
  progress: number;
  scrollY: number;
  updatedAt: string;
};

const readLocalProgress = (): ReadingProgress | null => {
  const stored = localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!stored) return null;

  try {
    const progress = JSON.parse(stored) as ReadingProgress;
    return progress.progress < 98 ? progress : null;
  } catch {
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return null;
  }
};

const writeLocalProgress = (progress: ReadingProgress) => {
  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
};

const backendToLocal = (dto: BackendReadingProgressDTO): ReadingProgress => ({
  postId: String(dto.postId),
  articleId: dto.articleId ? String(dto.articleId) : undefined,
  title: dto.title || 'Saved article',
  channelName: dto.channelName || 'Articles',
  trustLabel: 'Saved progress',
  highlightCount: 0,
  progress: Math.max(1, Math.min(99, dto.progress)),
  scrollY: dto.scrollY || 0,
  updatedAt: dto.updatedAt || new Date().toISOString(),
});

export const readProgress = async (): Promise<ReadingProgress | null> => {
  try {
    const results = await backendApi.getReadingProgress();
    if (results.length > 0) {
      const latest = results.reduce((a, b) =>
        new Date(a.updatedAt || 0) > new Date(b.updatedAt || 0) ? a : b,
      );
      if (latest.progress < 98) return backendToLocal(latest);
    }
  } catch {
    /* fall through to local */
  }
  return readLocalProgress();
};

export const saveProgress = async (input: {
  postId: string;
  articleId?: string;
  title?: string;
  channelName?: string;
  scrollY: number;
  progress: number;
}) => {
  const numericPostId = Number(input.postId) || undefined;
  const numericArticleId = input.articleId ? Number(input.articleId) || undefined : undefined;

  try {
    if (numericPostId) {
      await backendApi.saveReadingProgress({
        postId: numericPostId,
        articleId: numericArticleId,
        progress: Math.max(1, Math.round(input.progress)),
        scrollY: Math.max(0, Math.round(input.scrollY)),
      });
    }
  } catch {
    /* fall through to local */
  }

  writeLocalProgress({
    postId: input.postId,
    articleId: input.articleId,
    title: input.title || 'Saved article',
    channelName: input.channelName || 'Articles',
    trustLabel: 'Saved progress',
    highlightCount: 0,
    scrollY: Math.max(0, Math.round(input.scrollY)),
    progress: Math.max(1, Math.min(99, Math.round(input.progress))),
    updatedAt: new Date().toISOString(),
  });
  return null;
};

export const clearProgress = async (postId: string) => {
  const localProgress = readLocalProgress();
  if (localProgress?.postId === postId) {
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
  }

  const numericPostId = Number(postId);
  if (!numericPostId || Number.isNaN(numericPostId)) return;

  try {
    await backendApi.clearReadingProgress(numericPostId);
  } catch {
    /* best-effort */
  }
};

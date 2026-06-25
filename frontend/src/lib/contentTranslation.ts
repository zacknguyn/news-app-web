import { backendApi, type BackendContentTranslationDTO } from './api';
import type { Post } from '../types';

const STORAGE_PREFIX = 'tourane-content-translation:';

export type TranslatedContent = {
  language: 'en' | 'vi';
  title: string;
  content: string;
};

const hasVietnameseSignals = (value: string) =>
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(value);

const hasLatinWords = (value: string) => /[a-z]{3,}/i.test(value);

export const shouldTranslatePostContent = (post: Post, language: 'en' | 'vi') => {
  const sample = `${post.title}\n${post.content}`.slice(0, 5000);
  const looksVietnamese = hasVietnameseSignals(sample);
  if (language === 'vi') return hasLatinWords(sample) && !looksVietnamese;
  return looksVietnamese;
};

const hashString = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

const cacheKey = (post: Post, language: 'en' | 'vi') =>
  `${STORAGE_PREFIX}${post.id}:${language}:${hashString(`${post.title}\n${post.content}`)}`;

export const readTranslatedContentCache = (post: Post, language: 'en' | 'vi'): TranslatedContent | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const cached = localStorage.getItem(cacheKey(post, language));
    if (!cached) return null;
    return JSON.parse(cached) as TranslatedContent;
  } catch {
    return null;
  }
};

export const saveTranslatedContentCache = (
  post: Post,
  language: 'en' | 'vi',
  translation: BackendContentTranslationDTO,
) => {
  const next: TranslatedContent = {
    language,
    title: translation.title || post.title,
    content: translation.content || post.content,
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(cacheKey(post, language), JSON.stringify(next));
  }
  return next;
};

export const translatePostContent = async (post: Post, language: 'en' | 'vi') => {
  const articleId = post.backendArticleId ? Number(post.backendArticleId) : null;
  if (post.id.startsWith('article-') && articleId && !Number.isNaN(articleId)) {
    return backendApi.translateArticle(articleId, language);
  }
  const postId = Number(post.id);
  if (Number.isNaN(postId)) throw new Error('Post id is invalid.');
  return backendApi.translatePost(postId, language);
};

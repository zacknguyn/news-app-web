import type { Channel, Comment, Post, User } from '../types';
import type {
  BackendArticleDTO,
  BackendAuthorDTO,
  BackendCategoryDTO,
  BackendCommentDTO,
  BackendPostDTO,
  BackendTopicDTO,
  BackendUserDTO,
} from './api';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fallbackAvatar = (seed: string) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed || 'User')}`;

export const backendUserToUser = (dto: BackendUserDTO): User => {
  const username = slugify(dto.email?.split('@')[0] || dto.name || `user-${dto.id}`);
  const isAdmin = dto.role === 'ADMIN';

  return {
    id: String(dto.id),
    name: dto.name || username,
    username,
    email: dto.email,
    role: dto.role,
    status: dto.status || undefined,
    avatarUrl: dto.avatar || fallbackAvatar(dto.name || username),
    trustScore: isAdmin ? 1000 : 100,
    isVerified: isAdmin,
    bio: dto.bio || undefined,
    joinedDate: dto.createdAt || undefined,
  };
};

export const backendAuthorToUser = (dto: BackendAuthorDTO): User => ({
  id: `author-${dto.id}`,
  name: dto.name,
  username: dto.slug || slugify(dto.name),
  avatarUrl: dto.avatarUrl || fallbackAvatar(dto.name),
  trustScore: Math.max(100, (dto.articleCount || 0) * 25),
  isVerified: true,
  bio: dto.bio || undefined,
});

export const backendTopicToChannel = (dto: BackendTopicDTO): Channel => ({
  id: String(dto.id),
  name: dto.name,
  slug: dto.slug || slugify(dto.name),
  description: dto.description || 'Community reports and reader discussion.',
  iconName: 'Hash',
  avatarUrl: dto.avatar || undefined,
  bannerUrl: dto.banner || undefined,
  rules: dto.rules || undefined,
  ownerId: dto.ownerId ? String(dto.ownerId) : undefined,
  ownerName: dto.ownerName || undefined,
  memberCount: dto.memberCount || 0,
  postCount: dto.postCount || 0,
  joined: Boolean(dto.joined),
});

export const backendCategoryToChannel = (dto: BackendCategoryDTO): Channel => ({
  id: `category-${dto.id}`,
  name: dto.name,
  slug: dto.slug || slugify(dto.name),
  description: dto.description || `${dto.articleCount || 0} published articles.`,
  iconName: 'Hash',
});

const authorFromPost = (dto: BackendPostDTO): User => {
  const name = dto.authorName || `User ${dto.userId}`;
  const username = slugify(name) || `user-${dto.userId}`;

  return {
    id: String(dto.userId),
    name,
    username,
    avatarUrl: fallbackAvatar(name),
    trustScore: Math.max(50, 100 + Math.min(dto.score || 0, 900)),
    isVerified: false,
  };
};

export const backendPostToPost = (dto: BackendPostDTO): Post => {
  const score = dto.score || 0;

  return {
    id: String(dto.id),
    authorId: String(dto.userId),
    author: authorFromPost(dto),
    channelId: String(dto.topicId),
    channelName: dto.topicName || 'General',
    title: dto.title,
    content: dto.content,
    mediaUrl: dto.imageUrl || dto.sourceUrl || undefined,
    mediaType: dto.imageUrl ? 'image' : dto.sourceUrl || dto.articleId ? 'link' : undefined,
    upvotes: Math.max(score, 0),
    downvotes: Math.max(-score, 0),
    commentCount: dto.commentCount || 0,
    createdAt: dto.createdAt,
    userVote: dto.userVote === 1 ? 'up' : dto.userVote === -1 ? 'down' : null,
    backendArticleId: dto.articleId ? String(dto.articleId) : undefined,
  };
};

export const backendArticleToPost = (dto: BackendArticleDTO): Post => {
  const category = dto.categories?.[0];
  const channelName = category?.name || 'Articles';
  const authorName = dto.authorName || 'Newsroom';
  const author: User = {
    id: String(dto.userId || 'newsroom'),
    name: authorName,
    username: slugify(authorName) || 'newsroom',
    avatarUrl: dto.authorAvatar || fallbackAvatar(authorName),
    trustScore: 500,
    isVerified: true,
  };

  return {
    id: `article-${dto.id}`,
    authorId: author.id,
    author,
    channelId: category ? String(category.id) : 'articles',
    channelName,
    title: dto.title,
    content: dto.subtitle || dto.aiSummary || dto.content,
    mediaUrl: dto.imageUrl || undefined,
    mediaType: dto.imageUrl ? 'image' : 'link',
    upvotes: Math.max(dto.views || 0, 0),
    downvotes: 0,
    commentCount: dto.commentsCount || 0,
    createdAt: dto.publishedAt || new Date().toISOString(),
    userVote: null,
    backendArticleId: String(dto.id),
  };
};

export const backendCommentToComment = (dto: BackendCommentDTO, postId: string): Comment => {
  const authorName = dto.userName || `User ${dto.userId}`;
  const quoteMatch = dto.content.match(/^> ([\s\S]*?)(?:\n\n([\s\S]*))?$/);
  const quote = quoteMatch?.[1]?.replace(/\n> /g, '\n').trim();
  const content = quoteMatch ? quoteMatch[2]?.trim() || '' : dto.content;

  return {
    id: String(dto.id),
    postId,
    author: {
      id: String(dto.userId),
      name: authorName,
      username: slugify(authorName) || `user-${dto.userId}`,
      avatarUrl: dto.userAvatar || fallbackAvatar(authorName),
      trustScore: 100,
      isVerified: false,
    },
    content,
    quote,
    createdAt: dto.createdAt,
    parentId: dto.parentId ? String(dto.parentId) : undefined,
    replies: (dto.replies || []).map((reply) => backendCommentToComment(reply, postId)),
    upvotes: Math.max(dto.likes || 0, 0),
    downvotes: 0,
    userVote: null,
    backendArticleId: dto.articleId ? String(dto.articleId) : undefined,
  };
};

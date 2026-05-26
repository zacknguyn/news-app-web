export type User = {
  id: string;
  name: string;
  username: string;
  email?: string;
  role?: 'USER' | 'ADMIN' | string;
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | string;
  avatarUrl?: string;
  trustScore: number;
  isVerified: boolean;
  bio?: string;
  joinedDate?: string;
};

export type Post = {
  id: string;
  authorId: string;
  author: User;
  channelId: string;
  channelName: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'link';
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  userVote?: 'up' | 'down' | null;
  backendArticleId?: string;
};

export type Comment = {
  id: string;
  postId: string;
  author: User;
  content: string;
  quote?: string;
  createdAt: string;
  parentId?: string;
  replies: Comment[];
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  backendArticleId?: string;
};

export type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
};

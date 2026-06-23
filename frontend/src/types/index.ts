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
  profileHeadline?: string;
  profileBio?: string;
  profileAccent?: string;
  profileTags?: string[];
  unlockedBadges?: string[];
  selectedBadge?: string;
  subscriptionPlan?: string;
  billingCadence?: string;
  subscriptionStatus?: string;
  entitlements?: string[];
};

export type TagInfo = {
  id: number;
  name: string;
  slug: string;
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
  savedByMe?: boolean;
  aiSummary?: string;
  canModerate?: boolean;
  tags?: TagInfo[];
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
  likedByMe?: boolean;
};

export type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  rules?: string;
  ownerId?: string;
  ownerName?: string;
  memberCount?: number;
  postCount?: number;
  joined?: boolean;
  visibility?: 'PUBLIC' | 'PRIVATE';
  canPost?: boolean;
};

export type NotificationItem = {
  id: string;
  type: 'reply' | 'mention' | 'vote' | 'trust_change' | 'briefing_ready' | 'invite' | 'post_removed';
  title: string;
  body?: string;
  actorName?: string;
  actorAvatar?: string;
  refType?: 'post' | 'comment' | 'topic' | 'article' | 'invite';
  refId?: string;
  refSlug?: string;
  isRead: boolean;
  createdAt: string;
};

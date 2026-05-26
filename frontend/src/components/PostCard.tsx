import React from 'react';
import type { Post } from '../types';
import { MessageSquare, Share2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPostTrust } from '../lib/trust';
import { VoteControl } from './ui/VoteControl';
import { TrustLabel } from './ui/TrustLabel';

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, vote: 'up' | 'down') => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onVote }) => {
  const trust = getPostTrust(post);

  return (
    <article data-motion="list" className="hex-card group mb-5 transition-[box-shadow,border-color] hover:border-[var(--color-app-muted)] hover:shadow-[var(--shadow-hex-card-hover)]">
      <div className="flex gap-5 px-6 py-6">
        {/* Voting Sidebar */}
        <VoteControl
          label={post.title}
          score={post.upvotes - post.downvotes}
          vote={post.userVote}
          compact
          onVote={(vote) => onVote?.(post.id, vote)}
        />

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Header Metadata */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-app-muted)]">
            <Link to={`/app/c/${post.channelId}`} className="font-semibold text-[var(--color-app-ink)] hover:underline">
              {post.channelName}
            </Link>
            <span>•</span>
            <div className="flex min-w-0 items-center gap-1 group/author">
              <Link to={`/app/u/${post.author.username}`} className="truncate hover:underline">@{post.author.username}</Link>
              {post.author.isVerified ? (
                <ShieldCheck className="w-3 h-3 text-[var(--color-app-action)]" />
              ) : post.author.trustScore < 0 ? (
                <ShieldAlert className="w-3 h-3 text-red-600" />
              ) : null}
            </div>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <TrustLabel trust={trust} className="ml-auto hidden text-[10px] sm:inline" />
          </div>

          {/* Title & Preview */}
          <div className="space-y-1">
            <Link to={`/app/p/${post.id}`} className="block">
              <h2 className="text-xl font-semibold leading-snug text-[var(--color-app-action)] transition-colors group-hover:text-[var(--color-app-action-hover)] sm:text-2xl">
                {post.title}
              </h2>
            </Link>
            <p className="line-clamp-2 text-[15px] leading-6 text-[var(--color-app-text)]">
              {post.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Link to={`/app/p/${post.id}`} className="flex min-h-10 items-center gap-1.5 px-2 py-1 text-sm font-semibold text-[var(--color-app-muted)] transition-colors hover:bg-[var(--color-app-surface-lift)] sm:min-h-8">
              <MessageSquare className="h-3.5 w-3.5" />
              {post.commentCount} <span className="hidden sm:inline">comments</span>
            </Link>
            <button type="button" aria-label={`Share ${post.title}`} className="flex min-h-10 items-center gap-1.5 px-2 py-1 text-sm font-semibold text-[var(--color-app-muted)] transition-colors hover:bg-[var(--color-app-surface-lift)] sm:min-h-8">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <TrustLabel trust={trust} className="ml-auto flex items-center gap-1 font-mono text-[10px] sm:hidden" />
          </div>
        </div>
      </div>
    </article>
  );
};

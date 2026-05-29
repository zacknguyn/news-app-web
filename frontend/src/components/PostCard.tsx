import React from 'react';
import type { Post } from '../types';
import { Clock3, MessageSquare, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPostTrust } from '../lib/trust';
import { VoteControl } from './ui/VoteControl';
import { TrustLabel } from './ui/TrustLabel';
import { ShareButton } from './ui/ShareButton';
import { stripHtml } from '../lib/richContent';

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, vote: 'up' | 'down') => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onVote }) => {
  const trust = getPostTrust(post);
  const score = post.upvotes - post.downvotes;
  const excerpt = stripHtml(post.content);

  return (
    <article data-motion="list" className="group border-t border-[var(--color-app-border)] py-5 first:border-t-0 first:pt-0">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-widest text-[var(--color-app-muted)]">
            <Link to={`/app/c/${post.channelId}`} className="text-[var(--color-app-action)] hover:underline">
              {post.channelName}
            </Link>
            <span aria-hidden="true">/</span>
            <Link to={`/app/u/${post.author.username}`} className="inline-flex items-center gap-1 hover:text-[var(--color-app-action)]">
              @{post.author.username}
              {post.author.isVerified && <ShieldCheck className="h-3 w-3 text-[var(--color-app-action)]" />}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>

          <Link to={`/app/p/${post.id}`} className="block">
            <h2 className="font-[var(--font-display)] text-[1.35rem] font-bold leading-tight text-[var(--color-app-heading)] transition-colors group-hover:text-[var(--color-app-action)] sm:text-[1.55rem]">
              {post.title}
            </h2>
          </Link>
          <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-[var(--color-app-text)]">
            {excerpt}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--color-app-muted)]">
            <VoteControl
              label={post.title}
              score={score}
              vote={post.userVote}
              orientation="horizontal"
              compact
              onVote={(vote) => onVote?.(post.id, vote)}
            />
            <Link to={`/app/p/${post.id}#comments`} className="inline-flex min-h-10 items-center gap-2 hover:text-[var(--color-app-action)]">
              <MessageSquare className="h-4 w-4" />
              {post.commentCount} comments
            </Link>
            <ShareButton
              title={post.title}
              text={excerpt}
              url={`/app/p/${post.id}`}
              kind="post"
              successMessage="Report link copied."
            />
            <TrustLabel trust={trust} className="border border-[var(--color-app-border)] px-2 py-1 text-[10px] uppercase tracking-widest" />
          </div>
        </div>

        {post.mediaUrl && post.mediaType === 'image' ? (
          <Link to={`/app/p/${post.id}`} className="story-image-frame aspect-[16/10] sm:mt-1">
            <img src={post.mediaUrl} alt="" className="story-image grayscale-[18%] transition-all group-hover:grayscale-0" loading="lazy" />
          </Link>
        ) : (
          <Link to={`/app/p/${post.id}`} className="hidden border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3 text-xs font-bold uppercase tracking-widest text-[var(--color-app-muted)] transition-colors group-hover:border-[var(--color-app-action)] group-hover:text-[var(--color-app-action)] sm:flex sm:items-end">
            Read report
          </Link>
        )}
      </div>
    </article>
  );
};

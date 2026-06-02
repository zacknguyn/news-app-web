import React from 'react';
import type { Post } from '../types';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPostTrust } from '../lib/trust';
import { VoteControl } from './ui/VoteControl';
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
  const postDate = new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <article
      data-motion="list"
      className="group grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border-b border-app-border px-3 py-3 transition-colors duration-100 hover:bg-app-surface sm:grid-cols-[3rem_minmax(0,1fr)_8rem]"
    >
      <div className="pt-0.5">
        <VoteControl
          label={post.title}
          score={score}
          vote={post.userVote}
          orientation="vertical"
          onVote={(vote) => onVote?.(post.id, vote)}
        />
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[11px] text-app-muted">
          <Link to={`/app/c/${post.channelId}`} className="transition-colors hover:text-app-action">
            {post.channelName}
          </Link>
          <span aria-hidden="true" className="text-app-faint">
            ·
          </span>
          <Link
            to={`/app/u/${post.author.username}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-app-action"
          >
            @{post.author.username}
            {post.author.isVerified && <ShieldCheck className="h-3 w-3 text-app-action" />}
          </Link>
          <span aria-hidden="true" className="text-app-faint">
            ·
          </span>
          <span>{postDate}</span>
          <span aria-hidden="true" className="text-app-faint">
            ·
          </span>
          <span className="tabular-nums">{post.commentCount} comments</span>
          <span aria-hidden="true" className="text-app-faint">
            ·
          </span>
          <ShareButton
            title={post.title}
            text={excerpt}
            url={`/app/p/${post.id}`}
            kind="post"
            className="transition-colors hover:text-app-action"
            successMessage="Report link copied."
          />
          <span aria-hidden="true" className="text-app-faint">
            ·
          </span>
          <span className={trust.state === 'verified' ? 'text-app-action' : 'text-app-muted'}>{trust.label}</span>
        </div>

        <Link to={`/app/p/${post.id}`} className="block">
          <h2 className="truncate text-[17px] font-semibold leading-snug tracking-[-0.01em] text-app-heading transition-colors duration-150 group-hover:text-app-action group-hover:underline">
            {post.title}
          </h2>
        </Link>

        <p className="mt-1 line-clamp-2 max-w-[68ch] text-[14px] leading-6 text-app-text">{excerpt}</p>
      </div>

      {post.mediaUrl && post.mediaType === 'image' ? (
        <Link
          to={`/app/p/${post.id}`}
          className="story-image-frame hidden aspect-square overflow-hidden border border-app-border sm:block"
        >
          <img
            src={post.mediaUrl}
            alt=""
            className="story-image grayscale transition-[filter] duration-200 group-hover:grayscale-0"
            loading="lazy"
          />
        </Link>
      ) : (
        <Link
          to={`/app/p/${post.id}`}
          className="hidden items-end border border-app-border p-2 font-mono text-[11px] text-app-muted transition-colors duration-150 group-hover:border-app-action group-hover:text-app-action sm:flex"
        >
          Read report
        </Link>
      )}
    </article>
  );
};

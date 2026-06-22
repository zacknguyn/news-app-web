import React from 'react';
import type { Post } from '../types';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPostTrust } from '../lib/trust';
import { VoteControl } from './ui/VoteControl';
import { getProfilePath } from '../lib/profileLinks';
import { stripHtml } from '../lib/richContent';
import { Tooltip } from './ui/Tooltip';

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, vote: 'up' | 'down') => void;
}

const PostCardInner: React.FC<PostCardProps> = ({ post, onVote }) => {
  const trust = React.useMemo(() => getPostTrust(post), [post]);
  const score = post.upvotes - post.downvotes;
  const excerpt = React.useMemo(() => stripHtml(post.content), [post.content]);
  const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const commentCount = post.commentCount || 0;
  const isEngaged = commentCount > 5 || score > 20;
  const isHot = commentCount > 20 || score > 100;

  return (
    <article
      data-motion="list"
      style={{ contentVisibility: 'auto' }}
      className={`group grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border border-app-border px-5 py-5 transition-colors duration-150 ease-out sm:grid-cols-[3rem_minmax(0,1fr)_8rem] ${
        isHot
          ? 'bg-app-action-faint hover:bg-app-action-soft'
          : isEngaged
            ? 'hover:bg-app-action-faint'
            : 'hover:bg-app-action-faint'
      } hover:shadow-subtle -mt-px first:mt-0`}
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
        <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-app-muted">
          <Link to={`/app/c/${post.channelId}`} className="font-medium transition-colors hover:text-app-action">
            r/{post.channelName}
          </Link>
          <span aria-hidden="true" className="text-app-faint">·</span>
          <Link
            to={getProfilePath(post.author)}
            className="inline-flex items-center gap-1 transition-colors hover:text-app-action"
          >
            @{post.author.username}
            {post.author.isVerified && <ShieldCheck className="h-3 w-3 text-app-action" />}
          </Link>
          <span aria-hidden="true" className="text-app-faint">·</span>
          <span>{postDate}</span>
          {commentCount > 0 && (
            <>
              <span aria-hidden="true" className="text-app-faint">·</span>
              <span className="tabular-nums">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
            </>
          )}
          {trust.state === 'verified' && (
            <>
              <span aria-hidden="true" className="text-app-faint">·</span>
              <Tooltip label="This post has significantly more upvotes than downvotes, indicating community-verified quality." side="top">
                <span className="font-medium text-app-action">{trust.label}</span>
              </Tooltip>
            </>
          )}
        </div>

        <Link to={`/app/p/${post.id}`} className="block">
          <h2 className={`truncate leading-snug tracking-[-0.01em] text-app-heading transition-[color] duration-150 ease-out group-hover:text-app-action ${
            isHot ? 'text-[19px] font-bold' : 'text-[17px] font-semibold'
          }`}>
            {post.title}
            {isHot && <span className="ml-2.5 inline-flex items-center rounded-sm bg-app-action px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-app-on-action">Trending</span>}
          </h2>
        </Link>

        <p className={`line-clamp-2 max-w-[72ch] leading-6 text-app-text ${
          isHot ? 'mt-1.5 text-[15px]' : 'mt-1 text-[14px]'
        }`}>{excerpt}</p>

        {isHot && (
          <div className="mt-2.5 flex items-center gap-4 text-[12px] text-app-muted">
            <span className="tabular-nums font-medium">{score} votes</span>
            <span className="tabular-nums font-medium">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          </div>
        )}
      </div>

      {post.mediaUrl && post.mediaType === 'image' ? (
        <Link
          to={`/app/p/${post.id}`}
          className="story-image-frame hidden aspect-square overflow-hidden border border-app-border sm:block"
        >
          <img
            src={post.mediaUrl}
            alt=""
            className="story-image grayscale transition-[filter,transform] duration-200 ease-out group-hover:scale-105 group-hover:grayscale-0"
            loading="lazy"
          />
        </Link>
      ) : (
        <Link
          to={`/app/p/${post.id}`}
          className={`hidden items-end border p-2 text-[12px] transition-[color,background-color,border-color] duration-150 ease-out sm:flex ${
            isHot
              ? 'border-app-action text-app-action hover:bg-app-action hover:text-app-on-action'
              : 'border-app-border text-app-muted hover:border-app-action hover:text-app-action'
          }`}
        >
          Read post
        </Link>
      )}
    </article>
  );
};

export const PostCard = React.memo(PostCardInner);

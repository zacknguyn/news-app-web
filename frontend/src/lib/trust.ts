import type { Post } from '../types';

export type TrustState = 'verified' | 'disputed' | 'pending';

export type TrustMeta = {
  state: TrustState;
  label: 'Verified' | 'Disputed' | 'Pending';
  className: string;
};

export const getPostTrust = (post: Post): TrustMeta => {
  if (post.upvotes > post.downvotes * 10) {
    return { state: 'verified', label: 'Verified', className: 'text-green-600' };
  }

  if (post.downvotes > post.upvotes) {
    return { state: 'disputed', label: 'Disputed', className: 'text-red-600' };
  }

  return { state: 'pending', label: 'Pending', className: 'text-zinc-500' };
};

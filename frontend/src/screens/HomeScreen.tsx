import React from 'react';
import { PostFeed } from '../components/PostFeed';
import { usePageMotion } from '../hooks/usePageMotion';

export const HomeScreen: React.FC = () => {
  const pageRef = usePageMotion<HTMLDivElement>();

  return (
    <div ref={pageRef} className="min-h-full">
      <PostFeed />
    </div>
  );
};

export default HomeScreen;

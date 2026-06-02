import { useEffect, useState } from 'react';
import { backendApi } from './api';
import { backendTopicToChannel } from './backendAdapters';
import type { Channel } from '../types';

type ChannelsState = {
  channels: Channel[];
  isLoading: boolean;
  error: string | null;
};

let cached: Channel[] | null = null;
let inflight: Promise<Channel[]> | null = null;
const subscribers = new Set<(state: ChannelsState) => void>();

const fetchChannels = (): Promise<Channel[]> => {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = backendApi
    .getTopics()
    .then((topics) => topics.map(backendTopicToChannel))
    .then((channels) => {
      cached = channels;
      inflight = null;
      notify();
      return channels;
    })
    .catch((error) => {
      inflight = null;
      notify(error instanceof Error ? error.message : 'Failed to load topics');
      return cached ?? [];
    });
  return inflight;
};

const notify = (errorMessage: string | null = null) => {
  const state: ChannelsState = {
    channels: cached ?? [],
    isLoading: !cached && !!inflight,
    error: errorMessage,
  };
  subscribers.forEach((cb) => cb(state));
};

export const useChannels = (): ChannelsState => {
  const [state, setState] = useState<ChannelsState>(() => ({
    channels: cached ?? [],
    isLoading: !cached,
    error: null,
  }));

  useEffect(() => {
    const cb = (next: ChannelsState) => setState(next);
    subscribers.add(cb);
    if (!cached) fetchChannels();
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  return state;
};

export const refreshChannels = async (): Promise<Channel[]> => {
  cached = null;
  inflight = null;
  return fetchChannels();
};

export const _resetChannelsForTests = () => {
  cached = null;
  inflight = null;
  subscribers.clear();
};

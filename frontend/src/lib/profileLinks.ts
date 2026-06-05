import type { User } from '../types';

export const getProfilePath = (user: Pick<User, 'id' | 'username'>) =>
  `/app/u/${/^\d+$/.test(user.id) ? user.id : user.username}`;

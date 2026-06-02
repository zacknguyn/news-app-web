import type { Post, User, Channel, Comment } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Elena Vance',
    username: 'evance_news',
    trustScore: 1240,
    isVerified: true,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    bio: 'Former chief correspondent at Global Times. Now independent, uncovering the truths they want to bury. Specialized in conflict zones and geopolitical shifts.',
    joinedDate: '2025-01-12',
  },
  {
    id: 'u2',
    name: 'Marcus Thorne',
    username: 'thorne_reports',
    trustScore: 850,
    isVerified: true,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    bio: 'Tech whistleblower and digital privacy advocate. Exposing the algorithms that shape our reality.',
    joinedDate: '2025-03-05',
  },
  {
    id: 'u3',
    name: 'Sarah Jenkins',
    username: 'sjenk_truth',
    trustScore: 420,
    isVerified: false,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Local investigative reporter focusing on municipal corruption and environmental justice.',
    joinedDate: '2026-02-20',
  },
];

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'c1',
    name: 'War Correspondence',
    slug: 'war',
    description: 'Raw reports from the frontlines.',
    iconName: 'Sword',
  },
  { id: 'c2', name: 'Tech Whistleblowing', slug: 'tech', description: 'The truth behind big tech.', iconName: 'Cpu' },
  {
    id: 'c3',
    name: 'Local Governance',
    slug: 'local',
    description: 'Exposing city hall secrets.',
    iconName: 'Building',
  },
  {
    id: 'c4',
    name: 'Climate Crisis',
    slug: 'climate',
    description: 'Independent environmental data.',
    iconName: 'CloudRain',
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c7',
    postId: 'p1',
    author: MOCK_USERS[1],
    content:
      'The displacement numbers match the satellite damage estimates. The ministry summary leaves out the eastern corridor entirely.',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    upvotes: 28,
    downvotes: 1,
    replies: [
      {
        id: 'c8',
        postId: 'p1',
        author: MOCK_USERS[0],
        parentId: 'c7',
        content: 'I have field notes from that corridor. The school and clinic were both operating as shelters.',
        createdAt: new Date(Date.now() - 3900000).toISOString(),
        upvotes: 19,
        downvotes: 0,
        replies: [
          {
            id: 'c9',
            postId: 'p1',
            author: MOCK_USERS[2],
            parentId: 'c8',
            content:
              'Can confirm the clinic. Local council minutes mention emergency medical supply requests from the same date.',
            createdAt: new Date(Date.now() - 2400000).toISOString(),
            upvotes: 11,
            downvotes: 0,
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: 'c1',
    postId: 'p2',
    author: MOCK_USERS[2],
    content: 'This matches what I saw at the data center last month. The encryption bypass is real.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    upvotes: 45,
    downvotes: 2,
    replies: [
      {
        id: 'c2',
        postId: 'p2',
        author: MOCK_USERS[0],
        parentId: 'c1',
        content:
          'Did you manage to get any logs? We need harder proof to flip the Trust Score on the official rebuttal.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        upvotes: 12,
        downvotes: 0,
        replies: [
          {
            id: 'c3',
            postId: 'p2',
            author: MOCK_USERS[2],
            parentId: 'c2',
            content: 'Working on it. Security is tight but there is a gap in the nightly backup cycle.',
            createdAt: new Date(Date.now() - 900000).toISOString(),
            upvotes: 8,
            downvotes: 1,
            replies: [
              {
                id: 'c5',
                postId: 'p2',
                author: MOCK_USERS[1],
                parentId: 'c3',
                content: 'That backup window lines up with the contractor badges from the visitor logs.',
                createdAt: new Date(Date.now() - 600000).toISOString(),
                upvotes: 6,
                downvotes: 0,
                replies: [
                  {
                    id: 'c6',
                    postId: 'p2',
                    author: MOCK_USERS[0],
                    parentId: 'c5',
                    content:
                      'Send the timestamps privately. If they match the procurement leak, we have a clean chain.',
                    createdAt: new Date(Date.now() - 420000).toISOString(),
                    upvotes: 9,
                    downvotes: 0,
                    replies: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'c4',
    postId: 'p2',
    author: MOCK_USERS[1],
    content: 'Big if true. Following this closely.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    upvotes: 5,
    downvotes: 10,
    replies: [],
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    author: MOCK_USERS[0],
    channelId: 'c1',
    channelName: 'War Correspondence',
    title: 'The Hidden Cost of the Border Skirmish: What the Ministry Isnt Telling You',
    content: `I spent three days in the restricted zone. Contrary to official reports, the infrastructure damage is significant and civilian displacement is rising faster than the ministry bulletin admits.

What the official summary says

The morning statement describes the skirmish as contained, with limited damage to transport routes and no confirmed pressure on civilian shelters. That description does not match the road conditions, the intake logs, or the repair crews I observed between the west checkpoint and the eastern corridor.

Two bridges remain passable only by light vehicle. The clinic outside Maren village has moved triage into a school basement because the original emergency wing lost power after the second night of shelling. The school is still listed as operational in the ministry spreadsheet.

What changed on the ground

The displacement pattern is now concentrated around small settlements that do not appear in the public map layer. Families are moving at night to avoid the checkpoint queue, which means the official count misses people who never register at the intake tent.

A local coordinator shared handwritten supply requests from three shelter sites. The requests line up with satellite damage estimates published by independent monitors, especially around the eastern corridor. The most consistent gap is medical transport: drivers are making two-hour detours around roads marked clear in the ministry feed.

Why the numbers matter

The ministry can still call the incident contained if it counts only direct strike damage. That framing hides the secondary collapse: blocked roads, fuel shortages, and shelters absorbing more people than they were built for.

Source notes

This report is based on field notes from three shelter visits, two repair crew interviews, one clinic intake sheet, and geolocated photos reviewed before publication. Names are withheld because local volunteers are still moving supplies through contested routes.`,
    upvotes: 450,
    downvotes: 12,
    commentCount: 89,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    userVote: null,
  },
  {
    id: 'p2',
    authorId: 'u2',
    author: MOCK_USERS[1],
    channelId: 'c2',
    channelName: 'Tech Whistleblowing',
    title: 'Data Leaks: How Your "Private" Chats Are Feeding the Next Large Language Model',
    content: `Leaked internal memos from the top three cloud providers reveal a scraping operation that routes private chat fragments into model evaluation queues under the label "research quality review."

The bypass

The system does not appear to break end-to-end encryption directly. Instead, it captures message fragments after they are decrypted on synced devices, then sends selected snippets into a vendor analytics layer. In the documents, engineers call this path "post-delivery sampling."

That wording matters. It lets providers say encrypted transport remains intact while avoiding the more important user question: whether private text is being reused after it reaches the client.

What the memo shows

One implementation note describes a nightly batch that strips account identifiers and keeps conversation fragments that match safety, commerce, health, or political keywords. Another memo warns that removal of identifiers "does not eliminate reconstruction risk" when timestamps, device regions, and rare phrases remain attached.

The sharpest line comes from a risk review: internal reviewers were told to avoid the word training in customer-facing language. The preferred phrase was "research and service quality."

What is still unproven

I have not verified that the sampled text entered production training runs. The documents show movement into evaluation stores, reviewer queues, and prompt-quality datasets. That is enough to contradict the public claim that private chats are never reused outside delivery and abuse prevention.

Why users should care

The issue is not only model training. A private message copied into a review pipeline can be searched, retained, transferred to a contractor, or joined with other metadata. The privacy harm starts before a model ever sees it.

Source notes

The documents include two architecture diagrams, four policy review comments, and a vendor ticket export. I am publishing excerpts only where language can be verified without exposing employee names or customer identifiers.`,
    upvotes: 890,
    downvotes: 5,
    commentCount: 142,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    userVote: 'up',
  },
];

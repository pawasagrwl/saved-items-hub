import { SavedItem, RedditPost, RedditComment } from '@/types/reddit';

const subreddits = ['javascript', 'typescript', 'reactjs', 'webdev', 'programming', 'learnprogramming', 'cscareerquestions', 'AskReddit', 'todayilearned', 'science', 'technology', 'gaming', 'movies', 'music', 'books', 'dataisbeautiful', 'InternetIsBeautiful', 'LifeProTips', 'Showerthoughts', 'mildlyinteresting'];

const authors = ['code_wizard', 'dev_guru', 'react_fan', 'ts_master', 'web_explorer', 'data_nerd', 'curious_mind', 'pixel_artist', 'algo_smith', 'stack_overflow_refugee'];

const postTitles = [
  "TIL that TypeScript's type system is Turing complete",
  "I built a full-stack app in a weekend using React and Supabase",
  "What are some underrated JavaScript libraries you use daily?",
  "The best VS Code extensions for 2025",
  "How I reduced my bundle size by 60% with tree shaking",
  "A deep dive into React Server Components",
  "Why I switched from REST to GraphQL and back again",
  "The most elegant sorting algorithm visualization I've ever seen",
  "PSA: This one CSS trick will save you hours of debugging",
  "My journey from bootcamp to senior engineer in 3 years",
  "An interactive guide to modern CSS layouts",
  "The hidden costs of microservices nobody talks about",
  "I analyzed 10,000 GitHub repos to find the most common patterns",
  "Why every developer should learn Rust in 2025",
  "A visual explanation of how React Fiber works",
  "The surprising performance impact of console.log in production",
  "How we handle 1M requests/second with Node.js",
  "The complete guide to Web Workers and SharedArrayBuffer",
  "I created a programming language in TypeScript",
  "What's the most mind-blowing code you've ever written?",
];

const commentBodies = [
  "This is incredibly helpful! I've been struggling with this exact issue for weeks. The key insight about memoization really clicked for me.",
  "Great explanation. One thing I'd add is that you should also consider the impact on bundle size when choosing between these approaches.",
  "I disagree with the premise here. In my experience, the simpler approach works 90% of the time and is much easier to maintain.",
  "Bookmarking this for later. The section about performance optimization is gold.",
  "As someone who's been in the industry for 15 years, I can confirm this is one of the best writeups on the topic.",
  "The real LPT is always in the comments. Thanks for sharing your experience!",
  "I implemented this in my project and saw a 40% improvement in load times. Highly recommend.",
  "This deserves way more upvotes. Clear, concise, and actionable advice.",
];

const flairs = [null, 'Discussion', 'Tutorial', 'News', 'Project', 'Help', 'Humor', 'Resource', 'AMA', null, null];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePost(index: number): RedditPost {
  const sub = randomItem(subreddits);
  const createdUtc = Math.floor(Date.now() / 1000) - randomInt(86400, 86400 * 365 * 3);
  const savedOffset = randomInt(0, 86400 * 30);
  const isNsfw = Math.random() < 0.08;
  const hasImage = Math.random() < 0.3;
  const hasSelftext = !hasImage && Math.random() < 0.5;

  return {
    kind: 't3',
    id: `post_${index}`,
    name: `t3_post_${index}`,
    subreddit: sub,
    subreddit_name_prefixed: `r/${sub}`,
    author: randomItem(authors),
    title: randomItem(postTitles),
    selftext: hasSelftext ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." : '',
    selftext_html: null,
    url: hasImage ? `https://picsum.photos/seed/${index}/800/600` : `https://reddit.com/r/${sub}/comments/post_${index}`,
    permalink: `/r/${sub}/comments/post_${index}/`,
    thumbnail: hasImage ? `https://picsum.photos/seed/${index}/140/100` : 'self',
    preview: hasImage ? {
      images: [{
        source: { url: `https://picsum.photos/seed/${index}/800/600`, width: 800, height: 600 },
        resolutions: [{ url: `https://picsum.photos/seed/${index}/320/240`, width: 320, height: 240 }],
      }],
    } : undefined,
    is_video: false,
    post_hint: hasImage ? 'image' : hasSelftext ? 'self' : 'link',
    link_flair_text: randomItem(flairs),
    link_flair_background_color: '',
    score: randomInt(-5, 15000),
    num_comments: randomInt(0, 2000),
    over_18: isNsfw,
    created_utc: createdUtc,
    saved: true,
    saved_at: createdUtc + savedOffset,
  };
}

function generateComment(index: number): RedditComment {
  const sub = randomItem(subreddits);
  const createdUtc = Math.floor(Date.now() / 1000) - randomInt(86400, 86400 * 365 * 3);
  const savedOffset = randomInt(0, 86400 * 30);

  return {
    kind: 't1',
    id: `comment_${index}`,
    name: `t1_comment_${index}`,
    subreddit: sub,
    subreddit_name_prefixed: `r/${sub}`,
    author: randomItem(authors),
    body: randomItem(commentBodies),
    body_html: '',
    link_title: randomItem(postTitles),
    link_permalink: `/r/${sub}/comments/parent_${index}/`,
    link_author: randomItem(authors),
    permalink: `/r/${sub}/comments/parent_${index}/comment_${index}/`,
    score: randomInt(-2, 5000),
    over_18: Math.random() < 0.05,
    created_utc: createdUtc,
    saved: true,
    saved_at: createdUtc + savedOffset,
  };
}

export function generateMockData(count: number = 150): SavedItem[] {
  const items: SavedItem[] = [];
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.65) {
      items.push(generatePost(i));
    } else {
      items.push(generateComment(i));
    }
  }
  return items.sort((a, b) => (b.saved_at || b.created_utc) - (a.saved_at || a.created_utc));
}

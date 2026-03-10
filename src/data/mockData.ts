import { SavedDataFile } from '@/types/reddit';

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
];
const commentBodies = [
  "This is incredibly helpful! I've been struggling with this exact issue for weeks.",
  "Great explanation. One thing I'd add is that you should also consider the impact on bundle size.",
  "I disagree with the premise here. In my experience, the simpler approach works 90% of the time.",
  "Bookmarking this for later. The section about performance optimization is gold.",
  "As someone who's been in the industry for 15 years, I can confirm this is one of the best writeups.",
];
const flairOptions = ['Discussion', 'Tutorial', 'News', 'Project', 'Help', 'Humor', 'Resource'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDatetime(): string {
  const year = randomInt(2023, 2026);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  const h = randomInt(0, 23);
  const m = randomInt(0, 59);
  const s = randomInt(0, 59);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} IST`;
}

export function generateMockData(count: number = 150): SavedDataFile {
  const posts = [];
  const comments = [];
  const subCounts: Record<string, { posts: number; comments: number; icon: string }> = {};

  for (let i = 0; i < count; i++) {
    const sub = randomItem(subreddits);
    if (!subCounts[sub]) subCounts[sub] = { posts: 0, comments: 0, icon: '' };

    if (Math.random() < 0.65) {
      subCounts[sub].posts++;
      const hasImage = Math.random() < 0.3;
      posts.push({
        title: randomItem(postTitles),
        author: randomItem(authors),
        url: `https://reddit.com/r/${sub}/comments/abc${i}/post_${i}`,
        subreddit: sub,
        body: Math.random() < 0.5 ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." : '',
        media: hasImage ? `https://picsum.photos/seed/${i}/800/600` : null,
        datetime: randomDatetime(),
        votes: randomInt(-5, 15000),
        nsfw: Math.random() < 0.08,
        flairs: Math.random() < 0.5 ? [randomItem(flairOptions)] : [],
        archived: Math.random() < 0.1,
      });
    } else {
      subCounts[sub].comments++;
      comments.push({
        post_title: randomItem(postTitles),
        post_subreddit: sub,
        post_url: `/r/${sub}/comments/parent_${i}/`,
        comment_url: `https://reddit.com/r/${sub}/comments/parent_${i}/comment_${i}`,
        comment_text: randomItem(commentBodies),
        author: randomItem(authors),
        datetime: randomDatetime(),
        votes: randomInt(-2, 5000),
        nsfw: Math.random() < 0.05,
        archived: Math.random() < 0.1,
      });
    }
  }

  return {
    last_fetched_on: new Date().toISOString(),
    last_fetch_duration: 42.5,
    counts: {
      subreddits: subCounts,
      votes: {},
      dates: {},
    },
    content: { posts, comments },
  };
}

import os
import sys
import json
import time
import shutil
import threading
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
import praw
import inquirer

load_dotenv()

utc_zone = ZoneInfo('UTC')
ist_zone  = ZoneInfo('Asia/Kolkata')

IMAGE_EXT = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
VIDEO_EXT = ('.mp4', '.webm', '.mov', '.m4v')

# ─── Colours ──────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RED    = "\033[91m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

def clr(text, colour): return f"{colour}{text}{RESET}"
def ok(msg):   print(clr(f"  ✔  {msg}", GREEN))
def warn(msg): print(clr(f"  ⚠  {msg}", YELLOW))
def err(msg):  print(clr(f"  ✖  {msg}", RED))
def info(msg): print(clr(f"  ›  {msg}", CYAN))

# ─── Spinner ──────────────────────────────────────────────────────────────────
class Spinner:
    FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]

    def __init__(self, label="Working"):
        self.label   = label
        self._stop   = threading.Event()
        self._thread = threading.Thread(target=self._spin, daemon=True)

    def _spin(self):
        i = 0
        while not self._stop.is_set():
            frame = self.FRAMES[i % len(self.FRAMES)]
            print(f"\r  {CYAN}{frame}{RESET}  {self.label}…", end="", flush=True)
            time.sleep(0.1)
            i += 1

    def start(self):
        self._thread.start()
        return self

    def stop(self, success_msg=None):
        self._stop.set()
        self._thread.join()
        print("\r" + " " * (len(self.label) + 14) + "\r", end="")
        if success_msg:
            ok(success_msg)

# ─── API Limits ───────────────────────────────────────────────────────────────
def show_api_limits(reddit, label="API limits"):
    try:
        limits    = reddit.auth.limits
        remaining = limits.get("remaining")
        used      = limits.get("used")
        reset_ts  = limits.get("reset_timestamp")

        if remaining is None:
            _ = reddit.user.me()
            limits    = reddit.auth.limits
            remaining = limits.get("remaining")
            used      = limits.get("used")
            reset_ts  = limits.get("reset_timestamp")

        reset_str = "?"
        if reset_ts:
            secs      = max(0, int(reset_ts - time.time()))
            reset_str = f"{secs // 60}m {secs % 60}s"

        r_str = f"{int(remaining)}" if remaining is not None else "?"
        u_str = f"{int(used)}"      if used      is not None else "?"
        total  = (remaining or 0) + (used or 0)
        pct    = int((remaining or 0) / max(total, 1) * 100)

        bar_len   = 16
        filled    = int(bar_len * pct / 100)
        bar_col   = RED if pct < 20 else (YELLOW if pct < 50 else GREEN)
        bar       = clr("█" * filled, bar_col) + clr("░" * (bar_len - filled), DIM)

        print()
        print(clr(f"  ── {label} {'─' * max(0, 38 - len(label))}", CYAN))
        print(f"  [{bar}] {BOLD}{r_str}{RESET} requests left  "
              f"({u_str} used · resets in {reset_str})")
        print()
        return remaining
    except Exception as e:
        warn(f"Could not read API limits: {e}")
        return None

# ─── Banner ───────────────────────────────────────────────────────────────────
def banner():
    print()
    print(clr("  ┌──────────────────────────────────────────┐", CYAN))
    print(clr("  │   Reddit Saved Items Fetcher  v2.0       │", CYAN))
    print(clr("  └──────────────────────────────────────────┘", CYAN))
    print()

# ─── Helpers (unchanged logic, same output) ───────────────────────────────────
def format_time(seconds):
    td = timedelta(seconds=seconds)
    hours, remainder = divmod(td.seconds, 3600)
    minutes, secs    = divmod(remainder, 60)
    secs = round(secs + td.microseconds / 1_000_000)
    return f"{hours} hours, {minutes} minutes, {secs} seconds"

def get_readable_datetime(utc_timestamp):
    utc_time = datetime.fromtimestamp(utc_timestamp, tz=utc_zone)
    ist_time  = utc_time.astimezone(ist_zone)
    return ist_time.strftime('%Y-%m-%d %H:%M:%S IST')

def initialize_counts(vote_ranges):
    return {
        "subreddits": {},
        "votes": {f"{r[0]}-{r[1]}": {"posts": 0, "comments": 0} for r in vote_ranges},
        "dates": {}
    }

def fetch_subreddit_icon(subreddit, counts):
    name = subreddit.display_name
    if name in counts['subreddits'] and 'icon' in counts['subreddits'][name]:
        return counts['subreddits'][name]['icon']
    try:
        icon_url = getattr(subreddit, 'icon_img', '') or getattr(subreddit, 'community_icon', '') or ''
        if icon_url and '?' in icon_url:
            icon_url = icon_url.split('?')[0]
        counts['subreddits'].setdefault(name, {})['icon'] = icon_url
        return icon_url
    except Exception:
        return ''

def _safe_thumb(item):
    thumb = getattr(item, 'thumbnail', '') or ''
    return thumb if isinstance(thumb, str) and thumb.startswith('http') else None

def _safe_preview(item):
    try:
        preview = getattr(item, 'preview', None)
        if not preview:
            return None
        images = preview.get('images') if isinstance(preview, dict) else None
        if images:
            src = images[0].get('source', {}).get('url', '')
            return src.replace('&amp;', '&') if src else None
    except Exception:
        pass
    return None

def extract_media(item):
    result = {"type": "link", "gallery": [], "thumbnail": _safe_thumb(item), "preview": _safe_preview(item)}
    try:
        url    = (getattr(item, 'url', '') or '').lower()
        domain = (getattr(item, 'domain', '') or '').lower()

        if getattr(item, 'is_self', False):
            result["type"] = "text"; return result

        if getattr(item, 'is_gallery', False):
            try:
                meta          = getattr(item, 'media_metadata', {}) or {}
                gallery_order = []
                gallery_data  = getattr(item, 'gallery_data', None)
                if gallery_data and isinstance(gallery_data, dict):
                    gallery_order = [g.get('media_id') for g in gallery_data.get('items', [])]
                if not gallery_order:
                    gallery_order = list(meta.keys())
                urls = []
                for media_id in gallery_order:
                    inf = meta.get(media_id)
                    if not inf: continue
                    ext = inf.get('m', 'image/jpeg').split('/')[-1]
                    if ext == 'jpeg': ext = 'jpg'
                    urls.append(f"https://i.redd.it/{media_id}.{ext}")
                result["type"]    = "gallery"
                result["gallery"] = urls
                return result
            except Exception:
                pass

        if getattr(item, 'is_video', False) or 'v.redd.it' in url or url.endswith(VIDEO_EXT):
            result["type"] = "video"; return result
        if 'youtube.com' in domain or 'youtu.be' in domain:
            result["type"] = "youtube"; return result
        if url.endswith('.gif') or url.endswith('.gifv'):
            result["type"] = "gif"; return result
        if url.endswith(IMAGE_EXT) or domain in ('i.redd.it', 'i.imgur.com'):
            result["type"] = "image"; return result

        result["type"] = "link"
    except Exception:
        result["type"] = "link"
    return result

# ─── JSON file ────────────────────────────────────────────────────────────────
def get_saved_items_file():
    base_dir    = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.abspath(os.path.join(base_dir, "..", "public", "saved_items.json"))
    data        = None

    if os.path.exists(target_path):
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'content' not in data:
                    data = None
        except Exception:
            data = None

    if data is None:
        data = {
            "last_fetched_on":    "Never",
            "last_fetch_duration": 0,
            "counts":  {},
            "content": {"posts": [], "comments": []}
        }
    return data, target_path

def recompute_counts(data):
    vote_ranges = [(0,100),(100,1000),(1000,10000),(10000,100000),(100000,1000000)]
    counts      = initialize_counts(vote_ranges)

    old_subs = data.get("counts", {}).get("subreddits", {})
    for sub, info in old_subs.items():
        counts["subreddits"][sub] = {"posts": 0, "comments": 0, "icon": info.get("icon", "")}

    def process_items(items, is_post):
        t = "posts" if is_post else "comments"
        for item in items:
            sub = item.get("subreddit") if is_post else item.get("post_subreddit")
            if not sub: continue
            counts["subreddits"].setdefault(sub, {"posts": 0, "comments": 0, "icon": ""})[t] += 1
            score = item.get("votes", 0)
            for r in vote_ranges:
                if r[0] <= score < r[1]:
                    counts["votes"][f"{r[0]}-{r[1]}"][t] += 1
                    break
            if item.get("datetime"):
                parts = item["datetime"].split("-")
                if len(parts) >= 2:
                    ym = f"{parts[0]}-{parts[1]}"
                    counts["dates"].setdefault(ym, {"posts": 0, "comments": 0})[t] += 1

    process_items(data["content"]["posts"],    True)
    process_items(data["content"]["comments"], False)
    return counts

# ─── Sync type prompt ─────────────────────────────────────────────────────────
def prompt_sync_type():
    questions = [
        inquirer.List(
            'sync_type',
            message="Which type of sync do you want to perform?",
            choices=['Fast Sync (New items only)', 'Full Sync (Sync deletions)', 'Cancel'],
            default='Fast Sync (New items only)'
        )
    ]
    answer = inquirer.prompt(questions)
    if answer is None:          # Ctrl-C
        print(); sys.exit(0)
    return answer['sync_type']

# ─── Main fetch ───────────────────────────────────────────────────────────────
def fetch_saved_items():
    banner()

    # ── Load existing data ───────────────────────────────────────────────────
    data, json_file_path = get_saved_items_file()
    posts_count    = len(data['content']['posts'])
    comments_count = len(data['content']['comments'])

    if posts_count > 0 or comments_count > 0:
        last_dur = format_time(data.get('last_fetch_duration', 0))
        print(clr("  ── Existing Data ──────────────────────────", CYAN))
        info(f"Last fetched on  : {data.get('last_fetched_on')}")
        info(f"Saved items      : {posts_count + comments_count:,}  "
             f"({posts_count:,} posts · {comments_count:,} comments)")
        info(f"Last fetch took  : {last_dur}")
        print()
        sync_type = prompt_sync_type()
        if sync_type == 'Cancel':
            info("Cancelled. Nothing was changed.")
            return
    else:
        warn("No existing data found — starting fresh (Full Sync).")
        sync_type = 'Full Sync (Sync deletions)'

    print()

    # ── Authenticate ─────────────────────────────────────────────────────────
    client_id     = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    password      = os.getenv("REDDIT_PASSWORD")
    username      = os.getenv("REDDIT_USERNAME")

    if not all([client_id, client_secret, password, username]):
        err("Missing Reddit API credentials in your .env file.")
        for k in ["REDDIT_CLIENT_ID","REDDIT_CLIENT_SECRET","REDDIT_PASSWORD","REDDIT_USERNAME"]:
            if not os.getenv(k):
                print(f"      {YELLOW}→ {k}{RESET}")
        return

    spin = Spinner("Authenticating with Reddit").start()
    try:
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            password=password,
            username=username,
            user_agent=f"fetch_saved/2.0 by /u/{username}",
        )
        me = reddit.user.me()
        if me is None:
            raise Exception("Authentication returned None — check credentials.")
        spin.stop(f"Authenticated as u/{me.name}")
    except Exception as e:
        spin.stop()
        err(f"Authentication failed: {e}")
        return

    # ── API limits BEFORE fetch ───────────────────────────────────────────────
    remaining_before = show_api_limits(reddit, "API limits before fetch")
    if remaining_before is not None and remaining_before < 50:
        warn(f"Only {int(remaining_before)} requests remaining — a full sync uses many requests.")
        try:
            go = input(f"  {BOLD}Continue anyway? (y/n){RESET}: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print(); return
        if go not in {"y","yes"}:
            info("Aborted. Re-run when your limit resets.")
            return

    # ── Build lookup sets for dedup ───────────────────────────────────────────
    existing_posts    = {p["url"]:           p for p in data["content"]["posts"]    if p.get("url")}
    existing_comments = {c["comment_url"]:   c for c in data["content"]["comments"] if c.get("comment_url")}
    existing_urls     = set(existing_posts) | set(existing_comments)

    counts = data.get("counts", {})
    if "subreddits" not in counts:
        counts["subreddits"] = {}

    new_posts    = []
    new_comments = []
    skipped      = 0   # items reused from cache

    # ── Fetch loop ────────────────────────────────────────────────────────────
    print(clr("  ── Fetching saved items ──────────────────", CYAN))
    start_time  = time.time()
    total_count = 0

    try:
        for item in reddit.user.me().saved(limit=None):
            is_post = hasattr(item, 'title')
            url     = f"https://reddit.com{item.permalink}" if hasattr(item, 'permalink') else ''

            # Fast Sync: stop at first item we already have
            if sync_type == 'Fast Sync (New items only)' and url in existing_urls:
                print(f"\r  {GREEN}✔{RESET}  Reached existing item — stopping early (Fast Sync).   ")
                break

            total_count += 1
            new_c = len(new_comments)
            new_p = len(new_posts)
            elapsed = time.time() - start_time
            rate    = total_count / elapsed if elapsed > 0 else 0
            print(
                f"\r  {CYAN}⟳{RESET}  {BOLD}{total_count}{RESET} fetched  "
                f"({new_p} new posts · {new_c} new comments · {skipped} cached)"
                f"  {elapsed:.0f}s  {rate:.1f}/s   ",
                end="", flush=True
            )

            # Full Sync: reuse cached parse if URL matches (saves API calls for media/icon)
            if is_post and url in existing_posts:
                new_posts.append(existing_posts[url])
                skipped += 1
                continue
            elif not is_post and url in existing_comments:
                new_comments.append(existing_comments[url])
                skipped += 1
                continue

            author        = item.author.name if item.author else "[deleted]"
            subreddit_obj = item.subreddit if hasattr(item, 'subreddit') else item.submission.subreddit
            subreddit_name = str(subreddit_obj)

            # Cache icon only if missing — avoid redundant API calls
            sub_entry = counts["subreddits"].get(subreddit_name, {})
            if not sub_entry.get("icon"):
                fetch_subreddit_icon(subreddit_obj, counts)

            if is_post:
                post_flairs = (
                    [f.get('t', '') for f in getattr(item, 'link_flair_richtext', [])]
                    if getattr(item, 'link_flair_richtext', []) else []
                )
                media_info = extract_media(item)
                new_posts.append({
                    "title":         item.title,
                    "author":        author,
                    "url":           url,
                    "subreddit":     subreddit_name,
                    "body":          getattr(item, 'selftext', ""),
                    "media":         getattr(item, 'url', ""),
                    "media_type":    media_info["type"],
                    "gallery":       media_info["gallery"],
                    "thumbnail":     media_info["thumbnail"],
                    "preview_image": media_info["preview"],
                    "domain":        getattr(item, "domain", ""),
                    "datetime":      get_readable_datetime(item.created_utc) if hasattr(item, 'created_utc') else "",
                    "votes":         getattr(item, 'score', 0),
                    "nsfw":          getattr(item, 'over_18', False),
                    "flairs":        post_flairs,
                    "archived":      getattr(item, 'archived', False),
                })
            else:
                new_comments.append({
                    "post_title":    getattr(item, 'link_title', ''),
                    "post_subreddit": subreddit_name,
                    "post_url":      getattr(item, 'link_permalink', ''),
                    "comment_url":   url,
                    "comment_text":  getattr(item, 'body', ''),
                    "author":        author,
                    "datetime":      get_readable_datetime(item.created_utc) if hasattr(item, 'created_utc') else "",
                    "votes":         getattr(item, 'score', 0),
                    "nsfw":          getattr(item.submission, 'over_18', False) if hasattr(item, 'submission') else False,
                    "archived":      getattr(item.submission, 'archived', False) if hasattr(item, 'submission') else False,
                })

        print()  # newline after live counter

    except KeyboardInterrupt:
        print()
        warn("Interrupted by user — saving whatever was fetched so far.")
    except Exception as e:
        print()
        err(f"Error during fetch: {e}")
        if not new_posts and not new_comments:
            err("Nothing fetched — exiting without saving.")
            return
        warn("Saving partial results…")

    elapsed_time = time.time() - start_time
    fetched_on   = datetime.now(ist_zone).strftime('%Y-%m-%d %H:%M:%S IST')

    # ── Merge results ─────────────────────────────────────────────────────────
    if sync_type == 'Fast Sync (New items only)':
        # Prepend truly new items (not the cached reuses, those aren't "new")
        truly_new_posts    = [p for p in new_posts    if p["url"]         not in existing_posts]
        truly_new_comments = [c for c in new_comments if c["comment_url"] not in existing_comments]
        data["content"]["posts"]    = truly_new_posts    + data["content"]["posts"]
        data["content"]["comments"] = truly_new_comments + data["content"]["comments"]
        added_p = len(truly_new_posts)
        added_c = len(truly_new_comments)
    else:
        data["content"]["posts"]    = new_posts
        data["content"]["comments"] = new_comments
        added_p = len(new_posts)
        added_c = len(new_comments)

    data["counts"]              = recompute_counts(data)
    data["last_fetched_on"]     = fetched_on
    data["last_fetch_duration"] = elapsed_time

    # ── API limits AFTER fetch ────────────────────────────────────────────────
    show_api_limits(reddit, "API limits after fetch")

    # ── Safe save ─────────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(json_file_path), exist_ok=True)
    temp_path = json_file_path + ".tmp"
    spin2 = Spinner("Saving to disk").start()
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        if os.path.exists(json_file_path):
            os.remove(json_file_path)
        shutil.move(temp_path, json_file_path)
        spin2.stop(f"Saved → {json_file_path}")
    except Exception as e:
        spin2.stop()
        err(f"Could not save file: {e}")
        return

    # ── Summary ───────────────────────────────────────────────────────────────
    total_now = len(data["content"]["posts"]) + len(data["content"]["comments"])
    print()
    print(clr("  ┌─── Summary ──────────────────────────────────────────┐", GREEN))
    print(clr(f"  │  Sync type      : {sync_type:<35} │", GREEN))
    print(clr(f"  │  Items fetched  : {total_count:<35,} │", GREEN))
    print(clr(f"  │  New posts      : {added_p:<35,} │", GREEN))
    print(clr(f"  │  New comments   : {added_c:<35,} │", GREEN))
    print(clr(f"  │  Cached (reused): {skipped:<35,} │", GREEN))
    print(clr(f"  │  Total in file  : {total_now:<35,} │", GREEN))
    print(clr(f"  │  Time taken     : {elapsed_time:<34.1f}s │", GREEN))
    print(clr("  └──────────────────────────────────────────────────────┘", GREEN))
    print()

if __name__ == "__main__":
    fetch_saved_items()
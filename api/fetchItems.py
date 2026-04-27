import os
import json
import time
import shutil
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
import praw
import inquirer

# Load environment variables
load_dotenv()

# Define the UTC and IST time zones
utc_zone = ZoneInfo('UTC')
ist_zone = ZoneInfo('Asia/Kolkata')

IMAGE_EXT = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
VIDEO_EXT = ('.mp4', '.webm', '.mov', '.m4v')

def format_time(seconds):
    td = timedelta(seconds=seconds)
    hours, remainder = divmod(td.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    seconds = round(seconds + td.microseconds / 1_000_000)
    return f"{hours} hours, {minutes} minutes, {seconds} seconds"

def get_readable_datetime(utc_timestamp):
    utc_time = datetime.fromtimestamp(utc_timestamp, tz=utc_zone)
    ist_time = utc_time.astimezone(ist_zone)
    return ist_time.strftime('%Y-%m-%d %H:%M:%S IST')

def initialize_counts(vote_ranges):
    return {
        "subreddits": {},
        "votes": {f"{range_[0]}-{range_[1]}": {"posts": 0, "comments": 0} for range_ in vote_ranges},
        "dates": {}
    }

def fetch_subreddit_icon(subreddit, counts):
    subreddit_name = subreddit.display_name
    if subreddit_name in counts['subreddits'] and 'icon' in counts['subreddits'][subreddit_name]:
        return counts['subreddits'][subreddit_name]['icon']
    try:
        icon_url = getattr(subreddit, 'icon_img', '') or getattr(subreddit, 'community_icon', '') or ''
        # Sometimes community_icon has query parameters, strip them
        if icon_url and '?' in icon_url:
            icon_url = icon_url.split('?')[0]
        counts['subreddits'].setdefault(subreddit_name, {})['icon'] = icon_url
        return icon_url
    except Exception:
        return ''

def _safe_thumb(item):
    thumb = getattr(item, 'thumbnail', '') or ''
    if isinstance(thumb, str) and thumb.startswith('http'):
        return thumb
    return None

def _safe_preview(item):
    try:
        preview = getattr(item, 'preview', None)
        if not preview:
            return None
        images = preview.get('images') if isinstance(preview, dict) else None
        if images and len(images) > 0:
            src = images[0].get('source', {}).get('url', '')
            return src.replace('&amp;', '&') if src else None
    except Exception:
        pass
    return None

def extract_media(item):
    result = {"type": "link", "gallery": [], "thumbnail": _safe_thumb(item), "preview": _safe_preview(item)}
    try:
        url = (getattr(item, 'url', '') or '').lower()
        domain = (getattr(item, 'domain', '') or '').lower()

        if getattr(item, 'is_self', False):
            result["type"] = "text"
            return result

        if getattr(item, 'is_gallery', False):
            try:
                meta = getattr(item, 'media_metadata', {}) or {}
                gallery_order = []
                gallery_data = getattr(item, 'gallery_data', None)
                if gallery_data and isinstance(gallery_data, dict):
                    gallery_order = [g.get('media_id') for g in gallery_data.get('items', [])]
                if not gallery_order:
                    gallery_order = list(meta.keys())
                urls = []
                for media_id in gallery_order:
                    info = meta.get(media_id)
                    if not info:
                        continue
                    ext = info.get('m', 'image/jpeg').split('/')[-1]
                    if ext == 'jpeg':
                        ext = 'jpg'
                    urls.append(f"https://i.redd.it/{media_id}.{ext}")
                result["type"] = "gallery"
                result["gallery"] = urls
                return result
            except Exception:
                pass

        if getattr(item, 'is_video', False) or 'v.redd.it' in url or url.endswith(VIDEO_EXT):
            result["type"] = "video"
            return result

        if 'youtube.com' in domain or 'youtu.be' in domain:
            result["type"] = "youtube"
            return result

        if url.endswith('.gif') or url.endswith('.gifv'):
            result["type"] = "gif"
            return result

        if url.endswith(IMAGE_EXT) or domain in ('i.redd.it', 'i.imgur.com'):
            result["type"] = "image"
            return result

        result["type"] = "link"
    except Exception:
        result["type"] = "link"
    return result

def prompt_user_to_fetch():
    questions = [
        inquirer.List('sync_type',
                      message="Which type of sync do you want to perform?",
                      choices=['Fast Sync (New items only)', 'Full Sync (Sync deletions)', 'Cancel'],
                      default='Fast Sync (New items only)'
        )
    ]
    answer = inquirer.prompt(questions)
    return answer['sync_type']

def get_saved_items_file():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.abspath(os.path.join(base_dir, "..", "src", "data", "saved_items.json"))
    api_path = os.path.abspath(os.path.join(base_dir, "saved_items.json"))
    
    data = None
    if os.path.exists(target_path):
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'content' not in data:
                    data = None # Invalid data
        except Exception:
            data = None
            
    # If target is invalid or missing, try the fallback one in api/
    if data is None and os.path.exists(api_path):
        try:
            with open(api_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'content' in data:
                    print(f"Recovered valid data from {api_path}")
                else:
                    data = None
        except Exception:
            data = None
            
    if data is None:
        data = {
            "last_fetched_on": "Never",
            "last_fetch_duration": 0,
            "counts": {},
            "content": {"posts": [], "comments": []}
        }
    return data, target_path

def recompute_counts(data):
    vote_ranges = [(0, 100), (100, 1000), (1000, 10000), (10000, 100000), (100000, 1000000)]
    counts = initialize_counts(vote_ranges)
    
    # Maintain icons
    old_subreddits = data.get("counts", {}).get("subreddits", {})
    for sub, info in old_subreddits.items():
        counts["subreddits"][sub] = {"posts": 0, "comments": 0, "icon": info.get("icon", "")}

    def process_items(items, is_post):
        type_ = "posts" if is_post else "comments"
        for item in items:
            subreddit_name = item.get("subreddit") if is_post else item.get("post_subreddit")
            if not subreddit_name:
                continue
            counts["subreddits"].setdefault(subreddit_name, {"posts": 0, "comments": 0, "icon": ""})[type_] += 1
            
            score = item.get("votes", 0)
            for range_ in vote_ranges:
                range_key = f"{range_[0]}-{range_[1]}"
                if range_[0] <= score < range_[1]:
                    counts["votes"][range_key][type_] += 1
                    break
                    
            if item.get("datetime"):
                parts = item["datetime"].split("-")
                if len(parts) >= 2:
                    year_month = f"{parts[0]}-{parts[1]}"
                    counts["dates"].setdefault(year_month, {"posts": 0, "comments": 0})[type_] += 1

    process_items(data["content"]["posts"], True)
    process_items(data["content"]["comments"], False)
    return counts

def fetch_saved_items():
    data, json_file_path = get_saved_items_file()
    
    posts = len(data['content']['posts'])
    comments = len(data['content']['comments'])
    
    if posts > 0 or comments > 0:
        last_fetch_duration = format_time(data.get('last_fetch_duration', 0))
        print(f"Last Fetched on: {data.get('last_fetched_on')}")
        print(f"Number of Items: {posts + comments} ({posts} Posts, {comments} Comments)")
        print(f"Last Fetch Duration: {last_fetch_duration}")
        print(" ")
        sync_type = prompt_user_to_fetch()
        if sync_type == 'Cancel':
            return
    else:
        print("No valid saved_items.json found, starting fresh (Full Sync).")
        sync_type = 'Full Sync (Sync deletions)'
        print(" ")

    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    password = os.getenv("REDDIT_PASSWORD")
    username = os.getenv("REDDIT_USERNAME")

    if not all([client_id, client_secret, password, username]):
        print("Error: Missing Reddit API credentials in .env file.")
        print("Please ensure REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_PASSWORD, and REDDIT_USERNAME are set.")
        return

    try:
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            password=password,
            user_agent=f"Fetch Saved Posts and Comments by /u/{username}",
            username=username,
        )
        me = reddit.user.me()
        if me is None:
            raise Exception("Authentication failed. Check your credentials.")
        print(f"Successfully authenticated as {me.name}")
    except Exception as e:
        print(f"Reddit Authentication Error: {e}")
        return

    # Extract existing items to avoid duplicates and save time
    existing_urls = set()
    existing_posts = {}
    existing_comments = {}
    
    for p in data["content"]["posts"]:
        url = p.get("url")
        if url:
            existing_urls.add(url)
            existing_posts[url] = p
            
    for c in data["content"]["comments"]:
        url = c.get("comment_url")
        if url:
            existing_urls.add(url)
            existing_comments[url] = c

    new_posts = []
    new_comments = []
    
    # We will need the counts dict to fetch missing icons
    counts = data.get("counts", {})
    if "subreddits" not in counts:
        counts["subreddits"] = {}

    try:
        count = 0
        start_time = time.time()
        print("Fetching saved items from Reddit...")
        
        # limit=None pulls everything, but we will break early
        items = reddit.user.me().saved(limit=None)
        
        for item in items:
            is_post = hasattr(item, 'title')
            
            # Check if we already have it
            url = f"https://reddit.com{item.permalink}" if hasattr(item, 'permalink') else ''
            
            if sync_type == 'Fast Sync (New items only)':
                if url in existing_urls:
                    print(f"\nFound existing item, stopping fetch early (Fast Sync).")
                    break

            count += 1
            print(f"Items processed: {count}", end='\r', flush=True)

            # Optimization for Full Sync: Reuse already parsed data to save time
            if is_post and url in existing_posts:
                new_posts.append(existing_posts[url])
                continue
            elif not is_post and url in existing_comments:
                new_comments.append(existing_comments[url])
                continue

            author = item.author.name if item.author else "[deleted]"
            subreddit_obj = item.subreddit if hasattr(item, 'subreddit') else item.submission.subreddit
            subreddit_name = str(subreddit_obj)
            
            # Cache icon if not present
            if subreddit_name not in counts["subreddits"] or not counts["subreddits"][subreddit_name].get("icon"):
                fetch_subreddit_icon(subreddit_obj, counts)

            if is_post:
                post_flairs = [flair.get('t', '') for flair in getattr(item, 'link_flair_richtext', [])] if getattr(item, 'link_flair_richtext', []) else []
                media_info = extract_media(item)
                post_data = {
                    "title": item.title,
                    "author": author,
                    "url": url,
                    "subreddit": subreddit_name,
                    "body": getattr(item, 'selftext', ""),
                    "media": getattr(item, 'url', ""),
                    "media_type": media_info["type"],
                    "gallery": media_info["gallery"],
                    "thumbnail": media_info["thumbnail"],
                    "preview_image": media_info["preview"],
                    "domain": getattr(item, "domain", ""),
                    "datetime": get_readable_datetime(item.created_utc) if hasattr(item, 'created_utc') else "",
                    "votes": getattr(item, 'score', 0),
                    "nsfw": getattr(item, 'over_18', False),
                    "flairs": post_flairs,
                    "archived": getattr(item, 'archived', False)
                }
                new_posts.append(post_data)
            else:
                comment_data = {
                    "post_title": getattr(item, 'link_title', ''),
                    "post_subreddit": subreddit_name,
                    "post_url": getattr(item, 'link_permalink', ''),
                    "comment_url": url,
                    "comment_text": getattr(item, 'body', ''),
                    "author": author,
                    "datetime": get_readable_datetime(item.created_utc) if hasattr(item, 'created_utc') else "",
                    "votes": getattr(item, 'score', 0),
                    "nsfw": getattr(item.submission, 'over_18', False) if hasattr(item, 'submission') else False,
                    "archived": getattr(item.submission, 'archived', False) if hasattr(item, 'submission') else False
                }
                new_comments.append(comment_data)

        elapsed_time = time.time() - start_time
        fetched_on = datetime.now(ist_zone).strftime('%Y-%m-%d %H:%M:%S IST')
        
        if sync_type == 'Fast Sync (New items only)':
            # Prepend new items to the top
            data["content"]["posts"] = new_posts + data["content"]["posts"]
            data["content"]["comments"] = new_comments + data["content"]["comments"]
        else:
            # Replace entirely for full sync
            data["content"]["posts"] = new_posts
            data["content"]["comments"] = new_comments
        
        # Recompute counts
        data["counts"] = recompute_counts(data)
        data["last_fetched_on"] = fetched_on
        data["last_fetch_duration"] = elapsed_time

        print(f"\nCompleted fetching items at {fetched_on} in {elapsed_time:.2f} seconds.")
        print(f"Added {len(new_posts)} new posts and {len(new_comments)} new comments.")

    except Exception as e:
        print(f"\nAn error occurred while fetching items: {e}")
        if len(new_posts) == 0 and len(new_comments) == 0:
            print("No new data to save, exiting.")
            return
        print("Saving whatever was successfully processed so far...")

    # Safe save
    os.makedirs(os.path.dirname(json_file_path), exist_ok=True)
    temp_path = json_file_path + ".tmp"
    
    try:
        with open(temp_path, "w", encoding="utf-8") as outfile:
            json.dump(data, outfile, indent=4)
        # Rename to target
        if os.path.exists(json_file_path):
            os.remove(json_file_path)
        shutil.move(temp_path, json_file_path)
        print(f"Successfully saved to {json_file_path}.")
    except Exception as e:
        print(f"Error saving file: {e}")

    print("\nFinished processing items.")

if __name__ == "__main__":
    fetch_saved_items()

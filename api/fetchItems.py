from datetime import datetime, timedelta
import pytz  # Ensure this is installed or add it to your project requirements
from dotenv import load_dotenv
import os, praw, json, time, inquirer

# Load environment variables from .env file
load_dotenv()

# Define the UTC and IST time zones
utc_zone = pytz.utc
ist_zone = pytz.timezone('Asia/Kolkata')

def format_time(seconds):
    td = timedelta(seconds=seconds)
    hours, remainder = divmod(td.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    seconds = round(seconds + td.microseconds / 1_000_000)
    return f"{hours} hours, {minutes} minutes, {seconds} seconds"

def get_readable_datetime(utc_timestamp):
    utc_time = datetime.utcfromtimestamp(utc_timestamp).replace(tzinfo=utc_zone)
    ist_time = utc_time.astimezone(ist_zone)
    return ist_time.strftime('%Y-%m-%d %H:%M:%S IST')

def initialize_counts(vote_ranges):
    counts = {
        "subreddits": {},
        "votes": {f"{range_[0]}-{range_[1]}": {"posts": 0, "comments": 0} for range_ in vote_ranges},
        "dates": {}
    }
    return counts

def update_counts(counts, item, is_post, vote_ranges):
    type_ = "posts" if is_post else "comments"
    subreddit_name = str(item.subreddit if hasattr(item, 'subreddit') else item.submission.subreddit)
    subreddit_counts = counts["subreddits"].setdefault(subreddit_name, {"posts": 0, "comments": 0})
    subreddit_counts[type_] += 1

    for range_ in vote_ranges:
        range_key = f"{range_[0]}-{range_[1]}"
        if range_[0] <= item.score < range_[1]:
            counts["votes"][range_key][type_] += 1
            break

    year_month = get_readable_datetime(item.created_utc).split()[0][:7]
    date_counts = counts["dates"].setdefault(year_month, {"posts": 0, "comments": 0})
    date_counts[type_] += 1

def fetch_subreddit_icon(subreddit, counts):
    subreddit_name = subreddit.display_name
    if subreddit_name in counts['subreddits'] and 'icon' in counts['subreddits'][subreddit_name]:
        return counts['subreddits'][subreddit_name]['icon']
    try:
        icon_url = subreddit.icon_img if hasattr(subreddit, 'icon_img') else ''
        counts['subreddits'][subreddit_name]['icon'] = icon_url
        return icon_url
    except Exception as e:
        print(f"Could not fetch icon for subreddit {subreddit_name}: {e}")
        return ''

def prompt_user_to_fetch():
    question = [
        inquirer.Confirm('refetch', message="Do you want to fetch the data again?", default=False)
    ]
    answer = inquirer.prompt(question)
    return answer['refetch']

def fetch_saved_items():
    json_file_path = "src/data/saved_items.json"
    if os.path.exists(json_file_path):
        with open(json_file_path, 'r') as file:
            data = json.load(file)
            posts = len(data['content']['posts'])
            comments = len(data['content']['comments'])
            items = posts + comments
            last_fetch_duration = format_time(data['last_fetch_duration'])
            print(f"Last Fetched on: {data['last_fetched_on']}")
            print(f"Number of Items: {posts + comments} ({posts} Posts, {comments} Comments)")
            print(f"Last Fetch Duration: {last_fetch_duration}")
            print(" ")
        if not prompt_user_to_fetch():
            return
    else:
        print("No saved_items.json found, fetching now.")
        print(" ")

    reddit = praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        password=os.getenv("REDDIT_PASSWORD"),
        user_agent=f"Fetch Saved Posts and Comments by /u/{os.getenv('REDDIT_USERNAME')}",
        username=os.getenv("REDDIT_USERNAME"),
    )
    saved_items = {"posts": [], "comments": []}
    vote_ranges = [(0, 100), (100, 1000), (1000, 10000), (10000, 100000), (100000, 1000000)]
    counts = initialize_counts(vote_ranges)

    try:
        count = 0
        start_time = time.time()
        items = reddit.user.me().saved(limit=None)
        for item in items:
            count += 1
            print(f"{count} items processed", end='\r', flush=True)

            is_post = hasattr(item, 'title')
            update_counts(counts, item, is_post, vote_ranges)

            author = item.author.name if item.author else "[deleted]"

            subreddit_name = str(item.subreddit if hasattr(item, 'subreddit') else item.submission.subreddit)
            subreddit_icon = fetch_subreddit_icon(item.subreddit, counts)

            if is_post:
                post_flairs = [flair.get('t', '') for flair in item.link_flair_richtext] if item.link_flair_richtext else []
                post_data = {
                    "title": item.title,
                    "author": author,
                    "url": f"https://reddit.com{item.permalink}",
                    "subreddit": subreddit_name,
                    "body": item.selftext if item.selftext else "",
                    "media": item.url,
                    "datetime": get_readable_datetime(item.created_utc),
                    "votes": item.score,
                    "nsfw": item.over_18,
                    "flairs": post_flairs,
                    "archived": item.archived
                }
                saved_items["posts"].append(post_data)
            else:
                comment_data = {
                    "post_title": item.link_title,
                    "post_subreddit": subreddit_name,
                    "post_url": f"{item.link_permalink}",
                    "comment_url": f"https://reddit.com{item.permalink}",
                    "comment_text": item.body,
                    "author": author,
                    "datetime": get_readable_datetime(item.created_utc),
                    "votes": item.score,
                    "nsfw": item.submission.over_18,
                    "archived": item.submission.archived
                }
                saved_items["comments"].append(comment_data)

        elapsed_time = time.time() - start_time
        fetched_on = datetime.now(ist_zone).strftime('%Y-%m-%d %H:%M:%S IST')
        final_output = {
            "last_fetched_on": fetched_on,
            "last_fetch_duration": elapsed_time,
            "counts": counts,
            "content": saved_items
        }

        print(f"Completed fetching items at {fetched_on} in {elapsed_time:.2f} seconds.")

    except Exception as e:
        print(f"An error occurred: {e}")
        final_output = {}

    os.makedirs(os.path.dirname(json_file_path), exist_ok=True)

    with open(json_file_path, "w") as outfile:
        json.dump(final_output, outfile, indent=4)

    print("\nFinished processing items.")

if __name__ == "__main__":
    fetch_saved_items()

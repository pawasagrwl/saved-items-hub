# Reddit Saved Items Fetcher

This Python script fetches your saved posts and comments from Reddit and organizes them based on subreddits, vote ranges, and dates. It uses PRAW (Python Reddit API Wrapper) to securely access Reddit's API and is designed to support a frontend application by providing JSON formatted data.

## Setup

### Prerequisites

- Python 3.6 or higher
- A Reddit account with API access

### Dependencies

To run the script, you need to install a few Python packages. Use pip to install the required packages:

```bash
pip install praw python-dotenv inquirer pytz
```

### Reddit API Credentials

1. Go to [Reddit's App Preferences](https://www.reddit.com/prefs/apps) to create a new application.
2. Click on "Create App" or "Create Another App".
3. Fill out the form:
   - name: Your application's name
   - application type: Script
   - description: (Optional)
   - about url: (Optional)
   - permissions: (Optional)
   - redirect uri: http://localhost:8080 (or any valid URI)
4. After creation, note your `client_id` (below the application name) and `client_secret`.

### Environment File

Create a `.env` file in the root directory of your script containing your Reddit API credentials and account details:

```plaintext
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

## Usage

Run the script using Python to fetch all your saved posts and comments from Reddit. The script prompts whether to fetch new data if previous data exists:

```bash
python fetchItems.py
```

The script processes and categorizes the items, then saves them in a JSON file, making it easy to integrate with a frontend application to display the data.

## JSON File Format

The JSON output (`saved_items.json`) includes detailed categorization, allowing for efficient data visualization:

```json
{
  "last_fetched_on": "Last fetch timestamp in IST",
  "last_fetch_duration": "Fetch duration in seconds",
  "counts": {
    "subreddits": {
      "SubredditName": {
        "posts": 0,
        "comments": 0,
        "icon": "Subreddit icon URL"
      }
    },
    "votes": {
      "0-100": {
        "posts": 0,
        "comments": 0
      },
      "100-1000": {
        "posts": 0,
        "comments": 0
      },
      "1000-10000": {
        "posts": 0,
        "comments": 0
      },
      "10000-100000": {
        "posts": 0,
        "comments": 0
      },
      "100000-1000000": {
        "posts": 0,
        "comments": 0
      }
    },
    "dates": {
      "YYYY-MM": {
        "posts": 0,
        "comments": 0
      }
    }
  },
  "content": {
    "posts": [
      {
        "title": "Post Title",
        "url": "https://reddit.com/post_permalink",
        "subreddit": "SubredditName",
        "body": "Post Body",
        "media": "Post Media URL",
        "datetime": "Post Creation UTC",
        "votes": "Number of Upvotes",
        "nsfw": true/false,
        "flairs": ["Flair1", "Flair2"],
        "archived": true/false
      }
    ],
    "comments": [
      {
        "post_title": "Post Title",
        "post_subreddit": "SubredditName",
        "post_url": "https://reddit.com/post_permalink",
        "comment_url": "https://reddit.com/comment_permalink",
        "comment_text": "Comment Body",
        "datetime": "Comment Creation UTC",
        "votes": "Number of Upvotes",
        "nsfw": true/false,
        "archived": true/false
      }
    ]
  }
}
```

## Note

This script includes interactive elements that require user input during execution. Make sure to run it in an environment that supports stdin, such as a command-line interface. Adhere to Reddit's API usage rules and guidelines to avoid any restrictions on your account.

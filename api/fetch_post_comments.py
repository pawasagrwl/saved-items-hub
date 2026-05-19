import os
import argparse
from dotenv import load_dotenv
import praw

# Load environment variables
load_dotenv()

def fetch_comments(url):
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    password = os.getenv("REDDIT_PASSWORD")
    username = os.getenv("REDDIT_USERNAME")
    
    # Check for credentials
    if not all([client_id, client_secret, password, username]):
        print("Error: Missing Reddit API credentials in .env file.")
        print("Please ensure REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_PASSWORD, and REDDIT_USERNAME are set.")
        return None

    try:
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            password=password,
            user_agent=f"Fetch Post Comments by /u/{username}",
            username=username,
        )
    except Exception as e:
        print(f"Reddit Authentication Error: {e}")
        return None

    try:
        print(f"Fetching submission for URL: {url}...")
        submission = reddit.submission(url=url)
        
        # Load all comments, replacing "More comments" links
        print("Fetching all comments and replies (this may take a moment for large posts)...")
        submission.comments.replace_more(limit=None)
    except Exception as e:
        print(f"Error fetching submission: {e}")
        return None

    output = []
    output.append("=== REDDIT POST SUMMARY ===")
    output.append(f"Title: {submission.title}")
    author_name = submission.author.name if submission.author else "[deleted]"
    output.append(f"Author: {author_name}")
    output.append(f"Score: {submission.score}")
    output.append(f"URL: {submission.url}")
    
    if submission.selftext:
        output.append("\n=== POST BODY ===")
        output.append(submission.selftext)
    
    output.append("\n" + "="*40)
    output.append("COMMENTS AND REPLIES")
    output.append("="*40 + "\n")

    def process_comments(comments, depth=0):
        indent = "    " * depth
        for comment in comments:
            c_author = comment.author.name if comment.author else "[deleted]"
            # Indent multi-line comments appropriately
            c_body = comment.body.replace("\n", f"\n{indent}")
            output.append(f"{indent}[Author: {c_author} | Score: {comment.score}]")
            output.append(f"{indent}{c_body}\n")
            
            # Recursively process replies
            if hasattr(comment, 'replies') and comment.replies:
                process_comments(comment.replies, depth + 1)

    process_comments(submission.comments)

    return "\n".join(output), submission.id

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch comments and replies from a Reddit post formatted for LLMs.")
    parser.add_argument("url", help="The Reddit post URL")
    parser.add_argument("-o", "--output", help="Output file path (optional)", default=None)
    args = parser.parse_args()

    result_tuple = fetch_comments(args.url)
    if result_tuple:
        result, sub_id = result_tuple
        output_file = args.output if args.output else f"reddit_comments_{sub_id}.txt"
        
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(result)
            print(f"Successfully saved structured comments to: {output_file}")
        except Exception as e:
            print(f"Error writing to file: {e}")

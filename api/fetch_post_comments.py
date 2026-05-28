import os
import sys
import time
import argparse
import threading
from dotenv import load_dotenv
import praw

load_dotenv()

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
        print("\r" + " " * (len(self.label) + 12) + "\r", end="")
        if success_msg:
            ok(success_msg)

# ─── API Limits ───────────────────────────────────────────────────────────────
def show_api_limits(reddit, label="API limits"):
    """Read and display Reddit rate-limit info from PRAW's auth.limits dict."""
    try:
        limits = reddit.auth.limits
        remaining = limits.get("remaining")
        used      = limits.get("used")
        reset_ts  = limits.get("reset_timestamp")

        # PRAW only populates limits after the first API call.
        # If still None, make a cheap call to hydrate them.
        if remaining is None:
            _ = reddit.user.me()
            limits    = reddit.auth.limits
            remaining = limits.get("remaining")
            used      = limits.get("used")
            reset_ts  = limits.get("reset_timestamp")

        reset_in = ""
        if reset_ts:
            secs = max(0, int(reset_ts - time.time()))
            reset_in = f"{secs // 60}m {secs % 60}s"

        remaining_str = f"{int(remaining)}" if remaining is not None else "?"
        used_str      = f"{int(used)}"      if used      is not None else "?"
        reset_str     = reset_in            if reset_in              else "?"

        total = (remaining or 0) + (used or 0)
        pct   = int((remaining or 0) / max(total, 1) * 100)
        bar_len = 16
        filled  = int(bar_len * pct / 100)
        # Colour the bar red when low
        bar_colour = RED if pct < 20 else (YELLOW if pct < 50 else GREEN)
        bar = clr("█" * filled, bar_colour) + clr("░" * (bar_len - filled), DIM)

        print()
        print(clr(f"  ── {label} ──────────────────────────────", CYAN))
        print(f"  [{bar}] {BOLD}{remaining_str}{RESET} requests left  "
              f"({used_str} used · resets in {reset_str})")
        print()

        return remaining
    except Exception as e:
        warn(f"Could not read API limits: {e}")
        return None

# ─── Credentials ──────────────────────────────────────────────────────────────
def get_reddit_client():
    keys = {
        "REDDIT_CLIENT_ID":     os.getenv("REDDIT_CLIENT_ID"),
        "REDDIT_CLIENT_SECRET": os.getenv("REDDIT_CLIENT_SECRET"),
        "REDDIT_PASSWORD":      os.getenv("REDDIT_PASSWORD"),
        "REDDIT_USERNAME":      os.getenv("REDDIT_USERNAME"),
    }
    missing = [k for k, v in keys.items() if not v]
    if missing:
        err("Missing Reddit API credentials in your .env file:")
        for k in missing:
            print(f"      {YELLOW}→ {k}{RESET}")
        print()
        info("Create a .env file with those keys and re-run.")
        return None

    try:
        reddit = praw.Reddit(
            client_id=keys["REDDIT_CLIENT_ID"],
            client_secret=keys["REDDIT_CLIENT_SECRET"],
            password=keys["REDDIT_PASSWORD"],
            username=keys["REDDIT_USERNAME"],
            user_agent=f"fetch_reddit/2.1 by /u/{keys['REDDIT_USERNAME']}",
        )
        return reddit
    except Exception as e:
        err(f"Authentication failed: {e}")
        return None

# ─── Progress bar printer ─────────────────────────────────────────────────────
def print_progress(current, total_est, elapsed):
    pct     = min(100, int(current / max(total_est, 1) * 100))
    bar_len = 20
    filled  = int(bar_len * pct / 100)
    bar     = "█" * filled + "░" * (bar_len - filled)
    eta_str = ""
    if current > 0 and pct < 100 and elapsed > 0:
        rate    = current / elapsed
        remain  = (total_est - current) / max(rate, 0.001)
        eta_str = f"  ETA ~{remain:.0f}s"
    print(
        f"\r  {CYAN}[{bar}]{RESET} {pct:3d}%  "
        f"{BOLD}{current:,}{RESET}/{total_est:,} comments"
        f"  {elapsed:.0f}s elapsed{eta_str}   ",
        end="", flush=True
    )

# ─── Core fetch ───────────────────────────────────────────────────────────────
def fetch_comments(url, reddit):
    t0 = time.time()

    # ── Fetch submission metadata ────────────────────────────────────────────
    spin = Spinner("Fetching post").start()
    try:
        submission = reddit.submission(url=url)
        _ = submission.title   # trigger network call
        title_preview = submission.title[:70] + ("…" if len(submission.title) > 70 else "")
        spin.stop(f'Post found: "{title_preview}"')
    except Exception as e:
        spin.stop()
        err(f"Could not fetch post: {e}")
        return None

    num_reported = submission.num_comments
    author_str   = submission.author.name if submission.author else "[deleted]"
    info(f"Post by u/{author_str} · Score {submission.score:,} · ~{num_reported:,} comments (Reddit's count)")

    # ── Pass 1: expand all MoreComments ──────────────────────────────────────
    print()
    print(clr("  Pass 1/2 — expanding comment tree…", CYAN))
    start = time.time()

    done_event = threading.Event()
    error_box  = [None]

    def expand():
        try:
            submission.comments.replace_more(limit=None)
        except Exception as e:
            error_box[0] = e
        finally:
            done_event.set()

    threading.Thread(target=expand, daemon=True).start()

    last_count = 0
    while not done_event.is_set():
        try:
            current = len(submission.comments.list())
        except Exception:
            current = last_count
        print_progress(current, num_reported, time.time() - start)
        last_count = current
        done_event.wait(timeout=0.5)

    # Final bar update after thread finishes
    try:
        last_count = len(submission.comments.list())
    except Exception:
        pass
    print_progress(last_count, num_reported, time.time() - start)
    print()

    if error_box[0]:
        err(f"Error during expansion: {error_box[0]}")
        return None

    pass1_count = last_count
    pass1_time  = time.time() - start

    # ── Check for remaining MoreComments objects ──────────────────────────────
    all_items   = submission.comments.list()
    more_left   = [c for c in all_items if hasattr(c, "count")]
    real_comments = [c for c in all_items if not hasattr(c, "count")]

    if more_left:
        warn(f"Pass 1 fetched {len(real_comments):,} comments. "
             f"{len(more_left)} unexpanded MoreComments objects remain.")
        print()
        print(clr("  Pass 2/2 — retrying remaining MoreComments…", CYAN))
        start2 = time.time()

        done2   = threading.Event()
        error2  = [None]

        def expand2():
            try:
                submission.comments.replace_more(limit=None)
            except Exception as e:
                error2[0] = e
            finally:
                done2.set()

        threading.Thread(target=expand2, daemon=True).start()

        last2 = len(real_comments)
        while not done2.is_set():
            try:
                current2 = len([c for c in submission.comments.list()
                                 if not hasattr(c, "count")])
            except Exception:
                current2 = last2
            print_progress(current2, num_reported, time.time() - start2)
            last2 = current2
            done2.wait(timeout=0.5)

        try:
            last2 = len([c for c in submission.comments.list() if not hasattr(c, "count")])
        except Exception:
            pass
        print_progress(last2, num_reported, time.time() - start2)
        print()

        if error2[0]:
            warn(f"Pass 2 hit an error: {error2[0]}")

        all_items     = submission.comments.list()
        more_left     = [c for c in all_items if hasattr(c, "count")]
        real_comments = [c for c in all_items if not hasattr(c, "count")]
    else:
        print(clr("  Pass 2/2 — no remaining MoreComments, skipping.", DIM))

    fetched   = len(real_comments)
    missing   = num_reported - fetched
    elapsed_t = time.time() - t0

    ok(f"Done — {fetched:,} comments fetched in {elapsed_t:.1f}s")

    if missing > 0:
        warn(f"{missing:,} comments unrecoverable (deleted/removed by Reddit, not an API issue).")
    if more_left:
        warn(f"{len(more_left)} MoreComments objects still unexpanded — Reddit is hiding these threads.")

    # ── Build output ─────────────────────────────────────────────────────────
    output = []
    output.append("=== REDDIT POST SUMMARY ===")
    output.append(f"Title:    {submission.title}")
    output.append(f"Author:   {author_str}")
    output.append(f"Score:    {submission.score:,}")
    output.append(f"URL:      {submission.url}")
    output.append(f"Fetched:  {fetched:,} / ~{num_reported:,} comments")

    if submission.selftext:
        output.append("\n=== POST BODY ===")
        output.append(submission.selftext)

    output.append("\n" + "=" * 40)
    output.append("COMMENTS AND REPLIES")
    output.append("=" * 40 + "\n")

    def process_comments(comments, depth=0):
        indent = "    " * depth
        for comment in comments:
            if hasattr(comment, "count"):
                continue   # skip any residual MoreComments
            c_author = comment.author.name if comment.author else "[deleted]"
            c_body   = comment.body.replace("\n", f"\n{indent}")
            output.append(f"{indent}[Author: {c_author} | Score: {comment.score}]")
            output.append(f"{indent}{c_body}\n")
            if hasattr(comment, "replies") and comment.replies:
                process_comments(comment.replies, depth + 1)

    process_comments(submission.comments)
    return "\n".join(output), submission.id, fetched, num_reported, elapsed_t

# ─── Prompt helper ────────────────────────────────────────────────────────────
YES_WORDS = {"y", "yes", "yeah", "yep", "sure", "ok", "okay", "1", "true"}

def prompt(label, default=None):
    suffix = f" [{default}]" if default else ""
    try:
        val = input(f"  {BOLD}{label}{RESET}{CYAN}{suffix}{RESET}: ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        sys.exit(0)
    return val if val else default

def prompt_filename(sub_id):
    """Ask for output filename, re-prompting if user types a yes/no word."""
    default = f"reddit_comments_{sub_id}.txt"
    while True:
        val = prompt("Save to file", default=default)
        if not val:
            return default
        if val.lower() in YES_WORDS:
            info(f'Looks like you said yes — using default filename: {default}')
            return default
        return val

def banner():
    print()
    print(clr("  ┌─────────────────────────────────────┐", CYAN))
    print(clr("  │   Reddit Comment Fetcher  v2.1      │", CYAN))
    print(clr("  └─────────────────────────────────────┘", CYAN))
    print()

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Fetch all comments from a Reddit post, formatted for LLMs.",
        epilog="Omit any argument to be prompted interactively."
    )
    parser.add_argument("url",  nargs="?", help="Reddit post URL")
    parser.add_argument("-o", "--output", help="Output file path")
    args = parser.parse_args()

    banner()

    # ── Get URL ──────────────────────────────────────────────────────────────
    url = args.url
    if not url:
        url = prompt("Paste the Reddit post URL")
        if not url:
            err("No URL provided. Exiting.")
            sys.exit(1)

    output_path = args.output  # None if not passed via CLI

    print()

    # ── Authenticate ─────────────────────────────────────────────────────────
    reddit = get_reddit_client()
    if not reddit:
        sys.exit(1)
    ok("Authenticated with Reddit API")

    # ── Show API limits BEFORE fetch ─────────────────────────────────────────
    remaining_before = show_api_limits(reddit, label="API limits before fetch")

    if remaining_before is not None and remaining_before < 50:
        warn(f"Only {int(remaining_before)} requests remaining. A large post can use hundreds.")
        try:
            go = input(f"  {BOLD}Continue anyway? (y/n){RESET}: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            sys.exit(0)
        if go not in YES_WORDS:
            info("Aborted. Re-run when your limit resets.")
            sys.exit(0)

    # ── Fetch ─────────────────────────────────────────────────────────────────
    result = fetch_comments(url, reddit)
    if not result:
        sys.exit(1)

    text, sub_id, fetched, reported, elapsed = result

    # ── Show API limits AFTER fetch ───────────────────────────────────────────
    show_api_limits(reddit, label="API limits after fetch")

    # ── Resolve output filename ───────────────────────────────────────────────
    if not output_path:
        output_path = prompt_filename(sub_id)

    # ── Write file ────────────────────────────────────────────────────────────
    print()
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
    except Exception as e:
        err(f"Could not write file: {e}")
        sys.exit(1)

    # ── Summary ───────────────────────────────────────────────────────────────
    missing = reported - fetched
    print()
    print(clr("  ┌─── Summary ──────────────────────────────────────┐", GREEN))
    print(clr(f"  │  Comments fetched : {fetched:>8,} / {reported:,}", GREEN))
    if missing > 0:
        print(clr(f"  │  Unrecoverable    : {missing:>8,}  (deleted/removed by Reddit)", YELLOW))
    print(clr(f"  │  Time taken       : {elapsed:>7.1f}s", GREEN))
    print(clr(f"  │  Saved to         : {output_path}", GREEN))
    print(clr("  └──────────────────────────────────────────────────┘", GREEN))
    print()

if __name__ == "__main__":
    main()
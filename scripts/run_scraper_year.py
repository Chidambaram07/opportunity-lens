"""
Backfill the last ~12 months of Reddit posts (does not change the normal scraper).
Run from the project root:  python scripts/run_scraper_year.py
"""
import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.reddit_scraper import RedditScraper, TARGET_SUBREDDITS
from database.operations import save_posts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=1000, help="posts per listing (Reddit max ~1000)")
    ap.add_argument("--subs", type=str, default="", help="comma-separated subreddits (default: all targets)")
    args = ap.parse_args()

    subs = [s.strip() for s in args.subs.split(",") if s.strip()] or TARGET_SUBREDDITS
    scraper = RedditScraper()
    reddit = scraper.reddit
    total = 0
    print(f"Backfilling {len(subs)} subreddits, limit={args.limit} per listing\n")

    for i, name in enumerate(subs, 1):
        print(f"[{i}/{len(subs)}] r/{name}")
        sub = reddit.subreddit(name)
        posts = []
        feeds = [
            ("top/year", sub.top(time_filter="year", limit=args.limit)),
            ("top/month", sub.top(time_filter="month", limit=args.limit)),
            ("top/week", sub.top(time_filter="week", limit=args.limit)),
            ("new", sub.new(limit=args.limit)),
            ("hot", sub.hot(limit=args.limit)),
        ]
        for label, gen in feeds:
            try:
                got = scraper._fetch_with_backoff(gen, f"r/{name}/{label}")
                print(f"   {label:10s} {len(got)} posts")
                posts.extend(got)
            except Exception as e:
                print(f"   {label:10s} failed: {e}")
        if posts:
            save_posts(posts)
            total += len(posts)
        time.sleep(1)

    print(f"\nDone. {total} posts processed (duplicates were upserted, not double-counted).")


if __name__ == "__main__":
    main()
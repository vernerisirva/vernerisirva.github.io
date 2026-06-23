#!/usr/bin/env python3
import argparse
import html
import json
import re
import ssl
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path


DEFAULT_FEED_URL = "https://verneri.substack.com/feed"
DEFAULT_ARCHIVE_URL = (
    "https://verneri.substack.com/api/v1/archive?sort=new&search=&offset=0&limit=3"
)
DEFAULT_PROXY_URL = (
    "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fverneri.substack.com%2Ffeed"
)
FEED_HEADERS = {
    "User-Agent": "VerneriSirvaProfileRSSUpdater/1.0 (+https://vernerisirva.github.io/)",
    "Accept": "application/json, application/rss+xml;q=0.9, application/xml;q=0.8, */*;q=0.5",
}
CERTIFICATE_BUNDLE_CANDIDATES = [
    Path("/etc/ssl/cert.pem"),
    Path("/opt/homebrew/etc/openssl@3/cert.pem"),
    Path("/usr/local/etc/openssl@3/cert.pem"),
]
START_MARKER = "<!-- latest-posts:start -->"
END_MARKER = "<!-- latest-posts:end -->"
MAX_DESCRIPTION_LENGTH = 92


def build_ssl_context():
    default_paths = ssl.get_default_verify_paths()

    if default_paths.cafile and Path(default_paths.cafile).exists():
        return ssl.create_default_context()

    for cafile in CERTIFICATE_BUNDLE_CANDIDATES:
        if cafile.exists():
            return ssl.create_default_context(cafile=str(cafile))

    return ssl.create_default_context()


def read_url(url):
    request = urllib.request.Request(url, headers=FEED_HEADERS)

    with urllib.request.urlopen(request, timeout=20, context=build_ssl_context()) as response:
        return response.read().decode("utf-8")


def read_feed(args):
    if args.feed_file:
        return Path(args.feed_file).read_text(encoding="utf-8")

    return read_url(args.feed_url)


def read_archive(args):
    if args.archive_file:
        return Path(args.archive_file).read_text(encoding="utf-8")

    return read_url(args.archive_url)


def read_proxy(args):
    if args.proxy_file:
        return Path(args.proxy_file).read_text(encoding="utf-8")

    return read_url(args.proxy_url)


def child_text(item, tag):
    child = item.find(tag)
    if child is None or child.text is None:
        return ""
    return child.text.strip()


def format_date(value):
    parsed = parsedate_to_datetime(value)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc)
    return f"{parsed.day} {parsed:%b %Y}"


def format_iso_date(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc)
    return f"{parsed.day} {parsed:%b %Y}"


def strip_html(value):
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", value)).strip()
    return html.unescape(text)


def compact_description(value):
    if len(value) <= MAX_DESCRIPTION_LENGTH:
        return value

    trimmed = value[:MAX_DESCRIPTION_LENGTH].rsplit(" ", 1)[0]
    return f"{trimmed}..."


def parse_posts(feed_xml, count):
    root = ET.fromstring(feed_xml)
    posts = []

    for item in root.findall("./channel/item"):
        title = child_text(item, "title")
        link = child_text(item, "link")
        description = compact_description(strip_html(child_text(item, "description")))
        pub_date = child_text(item, "pubDate")

        if not title or not link or not description or not pub_date:
            continue

        posts.append({
            "title": title,
            "link": link,
            "description": description,
            "date": format_date(pub_date),
        })

        if len(posts) == count:
            return posts

    raise ValueError(f"Expected at least {count} complete posts in feed, found {len(posts)}")


def parse_archive_posts(archive_json, count):
    posts = []

    for item in json.loads(archive_json):
        title = item.get("title", "").strip()
        link = item.get("canonical_url", "").strip()
        description = compact_description(strip_html(item.get("subtitle", "").strip()))
        post_date = item.get("post_date", "").strip()

        if not title or not link or not description or not post_date:
            continue

        posts.append({
            "title": title,
            "link": link,
            "description": description,
            "date": format_iso_date(post_date),
        })

        if len(posts) == count:
            return posts

    raise ValueError(f"Expected at least {count} complete posts in archive, found {len(posts)}")


def parse_proxy_posts(proxy_json, count):
    data = json.loads(proxy_json)

    if data.get("status") != "ok":
        raise ValueError(f"RSS proxy returned status {data.get('status', 'unknown')}")

    posts = []

    for item in data.get("items", []):
        title = item.get("title", "").strip()
        link = item.get("link", "").strip()
        description = compact_description(strip_html(item.get("description", "").strip()))
        pub_date = item.get("pubDate", "").strip()

        if not title or not link or not description or not pub_date:
            continue

        parsed_date = datetime.strptime(pub_date, "%Y-%m-%d %H:%M:%S").replace(
            tzinfo=timezone.utc
        )
        posts.append({
            "title": title,
            "link": link,
            "description": description,
            "date": f"{parsed_date.day} {parsed_date:%b %Y}",
        })

        if len(posts) == count:
            return posts

    raise ValueError(f"Expected at least {count} complete posts in proxy, found {len(posts)}")


def render_posts(posts):
    rendered = [f"            {START_MARKER}"]

    for post in posts:
        rendered.extend([
            f'            <a class="post-card" href="{html.escape(post["link"], quote=True)}">',
            f"              <span>{html.escape(post['date'])}</span>",
            f"              <strong>{html.escape(post['title'])}</strong>",
            f"              <small>{html.escape(post['description'])}</small>",
            "            </a>",
        ])

    rendered.append(f"            {END_MARKER}")
    return "\n".join(rendered)


def replace_posts(index_html, rendered_posts):
    pattern = re.compile(
        rf"            {re.escape(START_MARKER)}.*?            {re.escape(END_MARKER)}",
        re.DOTALL,
    )
    updated, count = pattern.subn(rendered_posts, index_html)

    if count != 1:
        raise ValueError("Could not find exactly one latest-posts marker block")

    return updated


def main():
    parser = argparse.ArgumentParser(description="Update latest Substack posts in index.html")
    parser.add_argument("--proxy-url", default=DEFAULT_PROXY_URL)
    parser.add_argument("--proxy-file")
    parser.add_argument("--archive-url", default=DEFAULT_ARCHIVE_URL)
    parser.add_argument("--archive-file")
    parser.add_argument("--feed-url")
    parser.add_argument("--feed-file")
    parser.add_argument("--index", default="index.html")
    parser.add_argument("--count", type=int, default=3)
    args = parser.parse_args()

    index_path = Path(args.index)
    if args.feed_file or args.feed_url:
        feed_xml = read_feed(args)
        posts = parse_posts(feed_xml, args.count)
    elif args.archive_file or args.archive_url != DEFAULT_ARCHIVE_URL:
        archive_json = read_archive(args)
        posts = parse_archive_posts(archive_json, args.count)
    else:
        proxy_json = read_proxy(args)
        posts = parse_proxy_posts(proxy_json, args.count)
    current_html = index_path.read_text(encoding="utf-8")
    updated_html = replace_posts(current_html, render_posts(posts))
    index_path.write_text(updated_html, encoding="utf-8")

    for post in posts:
        print(f"{post['date']} - {post['title']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Failed to update Substack posts: {error}", file=sys.stderr)
        sys.exit(1)

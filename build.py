import json
import random
import re
import sys
import urllib.request
from datetime import date


def fetch_wikipedia_sentence(today: date, seed: int) -> str:
    url = (
        f"https://en.wikipedia.org/api/rest_v1/feed/featured/"
        f"{today.year}/{today.month:02d}/{today.day:02d}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "sandrobraidotti.com/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        extract = data.get("tfa", {}).get("extract", "")
    except Exception as e:
        print(f"Warning: could not fetch Wikipedia article: {e}", file=sys.stderr)
        extract = ""

    if not extract:
        return "Something remarkable occurred, though the details remain unclear."

    sentences = re.split(r'(?<=[.!?])\s+', extract.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 40 and len(s.strip()) < 300]

    if not sentences:
        return "Something remarkable occurred, though the details remain unclear."

    rng = random.Random(seed)
    return rng.choice(sentences)


def build(today: date = None):
    if today is None:
        today = date.today()

    seed = int(today.strftime("%Y%j"))
    rng = random.Random(seed)

    with open("quotes.json") as f:
        quotes = json.load(f)

    opening = rng.choice(quotes["opening"])
    middle = fetch_wikipedia_sentence(today, seed + 1)
    closing = rng.choice(quotes["closing"])

    story = f"{opening} {middle} {closing}"

    with open("index.template.html") as f:
        template = f.read()

    html = template.replace("{{STORY}}", story).replace("{{DATE}}", today.isoformat())

    with open("index.html", "w") as f:
        f.write(html)

    print(f"Built index.html for {today}")
    print(f"  Opening: {opening}")
    print(f"  Middle:  {middle[:80]}...")
    print(f"  Closing: {closing}")


if __name__ == "__main__":
    build()

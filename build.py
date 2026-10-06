#!/usr/bin/env python3
"""
Rebuild index.html from the question pages in the subject folders.

Usage (run inside this folder):

    python3 build.py

What it does:
  1. Lists every .html file in math/, gk/, bengali/ and english/ on index.html.
  2. Adds a "← হোম" link to any question page that does not have one yet.

Files are listed in file-name order. To control the order, start the file
name with a number, e.g. "01 বীজগণিত.html", "02 জ্যামিতি.html".
"""
import html
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent

# (folder, Bengali name, English name), in the order shown on index.html.
SUBJECTS = [
    ("math", "গণিত", "Math"),
    ("gk", "সাধারণ জ্ঞান", "General Knowledge"),
    ("bengali", "বাংলা", "Bengali"),
    ("english", "ইংরেজি", "English"),
]

HOME_START = "<!-- home-link -->"
HOME_END = "<!-- /home-link -->"
# Pages built like the existing ones get a chip in their sticky top bar;
# anything else gets a plain link at the top of the body.
HOME_CHIP = HOME_START + '<a class="chip" href="../index.html">← হোম</a>' + HOME_END
HOME_PLAIN = (
    HOME_START
    + '<p style="margin:16px 20px 0;font:600 14px/1.4 sans-serif">'
    + '<a href="../index.html" style="color:var(--accent,#14624A);text-decoration:none">← হোম</a></p>'
    + HOME_END
)

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")


def bn(n):
    return str(n).translate(BN_DIGITS)


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def first(pattern, text):
    m = re.search(pattern, text, re.S)
    return strip_tags(m.group(1)) if m else ""


def natural_key(path):
    # "2 x" sorts before "10 x"; works for Bengali digits too.
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def read_page(path):
    try:
        return path.read_bytes().decode("utf-8")
    except UnicodeDecodeError:
        return ""


def add_home_link(path, text):
    if not text or HOME_START in text:
        return False
    if '<div class="bar-row">' in text:
        text = text.replace('<div class="bar-row">', '<div class="bar-row">' + HOME_CHIP, 1)
    else:
        m = re.search(r"<body[^>]*>", text, re.I)
        if not m:
            return False
        text = text[: m.end()] + HOME_PLAIN + text[m.end() :]
    path.write_bytes(text.encode("utf-8"))
    return True


def page_info(path, text):
    title = first(r"<title[^>]*>(.*?)</title>", text) or path.stem
    # "বিষয় <b>…</b>" in the page's meta line; য় may be stored as য + nukta.
    subject = first(r"বিষ(?:য়|য়)\s*<b>(.*?)</b>", text) or first(r"<h1[^>]*>(.*?)</h1>", text)
    questions = len(re.findall(r'<article class="q"', text))
    detail = [s for s in (subject if subject != title else "", f"{bn(questions)}টি প্রশ্ন" if questions else "") if s]
    return title, " · ".join(detail), questions


def render_subject(folder, name_bn, name_en, files):
    items = []
    for i, (rel, title, detail) in enumerate(files, 1):
        sub = f'<span class="file-meta">{html.escape(detail)}</span>' if detail else ""
        items.append(
            f'<li><a class="file" href="{html.escape(quote(rel))}">'
            f'<span class="file-n">{bn(i)}</span>'
            f'<span class="file-text"><span class="file-name">{html.escape(title)}</span>{sub}</span>'
            f'<span class="file-go" aria-hidden="true">→</span></a></li>'
        )
    body = f'<ol class="files">{"".join(items)}</ol>' if items else '<p class="empty">এখনো কোনো ফাইল নেই</p>'
    count = f"{bn(len(files))}টি ফাইল" if files else "খালি"
    return (
        f'<section class="subject" id="{folder}" aria-labelledby="{folder}-h">'
        f'<header class="subject-head"><div><p class="eyebrow">{name_en}</p>'
        f'<h2 id="{folder}-h">{name_bn}</h2></div><span class="count">{count}</span></header>'
        f"{body}</section>"
    )


def main():
    sections, total_files, total_q, linked = [], 0, 0, []
    for folder, name_bn, name_en in SUBJECTS:
        d = ROOT / folder
        d.mkdir(exist_ok=True)
        files = []
        for path in sorted(d.glob("*.html"), key=natural_key):
            text = read_page(path)
            if add_home_link(path, text):
                linked.append(f"{folder}/{path.name}")
            title, detail, q = page_info(path, text)
            files.append((f"{folder}/{path.name}", title, detail))
            total_q += q
        total_files += len(files)
        sections.append(render_subject(folder, name_bn, name_en, files))
        print(f"  {folder:<8} {len(files)} file(s)")

    meta = f"<span>বিষয় <b>{bn(len(SUBJECTS))}</b></span><span>ফাইল <b>{bn(total_files)}</b></span>"
    if total_q:
        meta += f"<span>প্রশ্ন <b>{bn(total_q)}</b></span>"
    page = TEMPLATE.replace("{{META}}", meta).replace("{{SECTIONS}}", "\n".join(sections))
    (ROOT / "index.html").write_text(page, encoding="utf-8")

    for name in linked:
        print(f"  + home link added: {name}")
    print(f"index.html updated: {total_files} file(s)")


TEMPLATE = """<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>প্রশ্নব্যাংক</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@500;700&family=Hind+Siliguri:wght@400;500;600&display=swap">
<!-- Generated by build.py. Edit build.py, not this file: changes here are overwritten. -->
<style>
/* Same palette and type as the question pages. */
:root{
  --paper:#F5F8F4; --card:#FFFFFF; --ink:#18231C; --muted:#5B6D61;
  --accent:#14624A; --accent-soft:#E4EFE7; --gold:#8A6212; --gold-soft:#F6EFDD;
  --line:#D9E3DB; --shadow:0 1px 2px rgba(20,60,45,.06),0 8px 22px rgba(20,60,45,.05);
  --display:"Noto Serif Bengali",Georgia,serif;
  --body:"Hind Siliguri","Noto Sans Bengali",system-ui,sans-serif;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#0E1411; --card:#151E19; --ink:#E5EDE7; --muted:#95A89C;
  --accent:#63C49A; --accent-soft:#18271F; --gold:#D6A94A; --gold-soft:#241F13;
  --line:#26332B; --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 22px rgba(0,0,0,.28);
  color-scheme:dark}}
:root[data-theme="dark"]{
  --paper:#0E1411; --card:#151E19; --ink:#E5EDE7; --muted:#95A89C;
  --accent:#63C49A; --accent-soft:#18271F; --gold:#D6A94A; --gold-soft:#241F13;
  --line:#26332B; --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 22px rgba(0,0,0,.28);
  color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);
  font-size:16px;line-height:1.6;-webkit-text-size-adjust:100%}
.wrap{max-width:980px;margin:0 auto;padding:0 20px 64px}

.top{padding-block:40px 24px;border-bottom:1px solid var(--line);margin-bottom:28px}
.kicker{font-size:12px;letter-spacing:.12em;color:var(--accent);font-weight:600;margin:0 0 10px}
h1{font-family:var(--display);font-weight:700;font-size:clamp(28px,6vw,40px);line-height:1.25;margin:0}
.lede{color:var(--muted);margin:10px 0 0;max-width:56ch}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;margin:18px 0 0;font-size:14px;color:var(--muted)}
.meta b{color:var(--ink);font-weight:600}

.subjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));
  gap:16px;align-items:start}
.subject{background:var(--card);border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--shadow);padding:18px}
.subject-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;
  padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);
  font-weight:600;margin:0 0 2px}
.subject h2{font-family:var(--display);font-size:22px;font-weight:700;margin:0;line-height:1.3}
.count{font-size:13px;color:var(--muted);white-space:nowrap}

.files{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.file{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:8px;
  border:1px solid transparent;text-decoration:none;color:var(--ink)}
.file:hover{border-color:var(--accent);background:var(--accent-soft)}
.file-n{color:var(--accent);font-weight:700;min-width:1.4em;flex:none}
.file-text{display:flex;flex-direction:column;min-width:0;flex:1}
.file-name{font-weight:600;line-height:1.45}
.file-meta{font-size:13.5px;color:var(--muted);line-height:1.45}
.file-go{color:var(--muted);flex:none}
.file:hover .file-go{color:var(--accent)}
.empty{margin:0;padding:16px;text-align:center;font-size:14px;color:var(--muted);
  border:1px dashed var(--line);border-radius:8px}

.foot{margin-top:40px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}
.foot p{margin:0}
.author{margin-top:10px!important}
.author b{color:var(--ink);font-weight:600}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;background:var(--accent-soft);
  color:var(--ink);padding:1px 6px;border-radius:4px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:420px){.subject{padding:14px}.file{padding-inline:8px}}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <p class="kicker">শিক্ষক নিবন্ধন প্রস্তুতি</p>
    <h1>প্রশ্নব্যাংক</h1>
    <p class="lede">বিষয় বেছে নিন, তারপর যে ফাইলটি পড়তে চান তার নামে ক্লিক করুন। প্রতিটি ফাইলে অনুশীলন মোড আছে।</p>
    <p class="meta">{{META}}</p>
  </header>

  <main class="subjects">
{{SECTIONS}}
  </main>

  <footer class="foot">
    <p>নতুন ফাইল যোগ করতে: ফাইলটি সঠিক ফোল্ডারে রাখুন, তারপর এই ফোল্ডারে <code>python3 build.py</code> চালান।</p>
    <p class="author">তৈরি করেছেন <b>Chayan Roy</b></p>
  </footer>
</div>
</body>
</html>
"""

if __name__ == "__main__":
    main()

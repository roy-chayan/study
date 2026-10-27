#!/usr/bin/env python3
"""
Rebuild index.html from the question pages in the subject folders.

Usage (run inside this folder):

    python3 build.py

What it does:
  1. Lists the pages on index.html in three parts:
       MCQ অনুশীলন       every .html file in math/, gk/, bengali/ and english/
       নোট                every .html file in notes/math/, notes/gk/, notes/bengali/
                          and notes/english/
       বিগত বছরের প্রশ্ন   one card per folder previous/ntrca-*/ (e.g. previous/ntrca-18/),
                          newest exam first, listing that exam's papers
       বিসিএস প্রিলিমিনারি one card per folder previous/bcs-*/ (e.g. previous/bcs-50/)
  2. Adds the home button and a back-to-top button to every page, or brings
     existing ones up to the current design.

A previous-year page's <title> is "<exam> — <paper>", e.g.
"১৮তম শিক্ষক নিবন্ধন — স্কুল পর্যায়": the part before " — " names the card and
the part after it names the row.

A notes page can be designed any way you like. If it has a
<meta name="description" content="..."> tag, that text is shown under its
name on index.html.

Files are listed in file-name order. To control the order, start the file
name with a number, e.g. "01 বীজগণিত.html", "02 জ্যামিতি.html". Notes follow
NOTE_ORDER below instead (study order); a new note not named there goes last.
On index.html a note shows one line of its description (the part before " — ")
and its exercise count; subjects with no notes are left out of the নোট part.
"""
import html
import re
import unicodedata
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

# The notes part shows English second, where most of the notes are; other parts use SUBJECTS as is.
SUBJECT_ORDER = {"notes": ["math", "english", "bengali", "gk"]}

# Notes are listed in study order (file names without .html); notes not named here follow in file-name order.
NOTE_ORDER = {
    "math": ["সংখ্যা ও ভগ্নাংশ", "বীজগণিতের সূত্র ও উৎপাদক", "সূচক ও করণী", "লগারিদম", "শতকরা, লাভ-ক্ষতি ও সুদ",
             "অনুপাত, ল.সা.গু-গ.সা.গু ও ঐকিক নিয়ম", "গড়", "জ্যামিতি ও বৃত্ত", "পরিমিতি", "ত্রিকোণমিতি"],
    "english": ["Parts of Speech", "Article ও Preposition", "Right Form of Verbs", "Voice ও Narration",
                "Transformation of Sentences", "Synonym ও Antonym", "Idioms ও Phrases"],
    "bengali": ["বাংলা ভাষা ও সাহিত্য", "ধ্বনি ও বর্ণ", "সন্ধি ও সমাস", "শব্দ, পদ ও বাক্য", "কারক, প্রত্যয় ও উপসর্গ", "বানান ও শুদ্ধ প্রয়োগ",
                "বাগধারা, সমার্থক ও বিপরীত শব্দ", "ভাষারীতি, যতিচিহ্ন ও নির্মিতি"],
    "gk": ["বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ", "বাংলাদেশের ভূগোল ও অর্থনীতি", "সংবিধান, শাসনব্যবস্থা ও সংস্কৃতি",
           "আন্তর্জাতিক সংস্থা, চুক্তি ও দিবস", "বিশ্ব পরিচিতি ও সমসাময়িক ঘটনা", "সাধারণ বিজ্ঞান", "কম্পিউটার ও তথ্যপ্রযুক্তি"],
}

# The two parts of index.html, in order:
# (id, heading, one-line description, folder for each subject, text for an empty
# subject, word used in each card's count).
GROUPS = [
    ("mcq", "MCQ অনুশীলন", "প্রশ্ন, উত্তর ও ব্যাখ্যা — প্রতিটি ফাইলে অনুশীলন মোড আছে।", "{}", "এখনো কোনো ফাইল নেই", "ফাইল"),
    ("notes", "নোট", "বিষয়ভিত্তিক সূত্র, নিয়ম আর সমাধান করা উদাহরণ।", "notes/{}", "এখনো কোনো নোট নেই", "নোট"),
]

# Last parts: previous years' question papers, one card per exam folder in previous/.
# (id, heading, one-line description, folder prefix, card label, word used in each card's count)
PREVIOUS = "previous"
PREVIOUS_GROUPS = [
    ("previous", "বিগত বছরের প্রশ্ন", "শিক্ষক নিবন্ধনের পুরো প্রশ্নপত্র — সঠিক উত্তরসহ, পড়ার জন্য সাজানো।",
     "ntrca-", "NTRCA", "প্রশ্নপত্র"),
    ("bcs", "বিসিএস প্রিলিমিনারি", "বিসিএস প্রিলিমিনারির যেসব বিষয় NTRCA-র কাজে লাগে — সঠিক উত্তরসহ, পড়ার জন্য সাজানো।",
     "bcs-", "BCS", "প্রশ্নপত্র"),
]

HOME_START = "<!-- home-link -->"
HOME_END = "<!-- /home-link -->"
# The home button carries its own styles, so it looks the same on every page.
# It uses the page's colour tokens (light and dark) and falls back to the
# site's green on pages that don't define them.
HOME_STYLE = (
    "<style>"
    ".home-link{display:inline-flex;align-items:center;gap:6px;padding:5px 14px 5px 11px;"
    "border-radius:999px;font-family:inherit;font-size:13px;font-weight:600;text-decoration:none;"
    "color:var(--accent,#14624A);background:var(--accent-soft,#E4EFE7);"
    "border:1px solid var(--accent,#14624A);"
    "border-color:color-mix(in srgb,var(--accent,#14624A) 35%,transparent);"
    "transition:background .15s,color .15s}"
    ".home-link:hover{background:var(--accent,#14624A);color:var(--card,#fff);"
    "border-color:var(--accent,#14624A)}"
    ".home-link:focus-visible{outline:2px solid var(--accent,#14624A);outline-offset:2px}"
    ".home-link svg{width:15px;height:15px;flex:none}"
    ".home-sep{width:1px;height:22px;background:var(--line,#D9E3DB);margin-inline:2px}"
    "</style>"
)
HOME_ICON = (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>'
)
HOME_BLOCK = re.compile(re.escape(HOME_START) + ".*?" + re.escape(HOME_END), re.S)

TOP_START = "<!-- top-button -->"
TOP_END = "<!-- /top-button -->"
# A round "↑" button fixed at the bottom right. It appears after about one and a
# half screens of scrolling and scrolls smoothly back to the top. Like the home
# button, it uses the page's colour tokens with the site's green as fallback.
TOP_HTML = (
    TOP_START + "<style>"
    ".to-top{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));"
    "z-index:50;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;"
    "border:1px solid var(--line,#D9E3DB);background:var(--card,#fff);color:var(--accent,#14624A);"
    "box-shadow:0 2px 10px rgba(0,0,0,.14);opacity:0;visibility:hidden;transform:translateY(8px);"
    "transition:opacity .2s,transform .2s,visibility .2s,background .15s,color .15s}"
    ".to-top.show{opacity:1;visibility:visible;transform:none}"
    ".to-top:hover{background:var(--accent,#14624A);color:var(--card,#fff);border-color:var(--accent,#14624A)}"
    ".to-top:focus-visible{outline:2px solid var(--accent,#14624A);outline-offset:2px}"
    ".to-top svg{width:20px;height:20px}"
    "@media print{.to-top{display:none}}"
    "</style>"
    '<button class="to-top" type="button" aria-label="উপরে যান" title="উপরে যান">'
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
    'stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg></button>'
    "<script>(function(){var b=document.currentScript.previousElementSibling;"
    "function f(){b.classList.toggle('show',window.scrollY>window.innerHeight*1.5)}"
    "window.addEventListener('scroll',f,{passive:true});f();"
    "b.addEventListener('click',function(){var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;"
    "window.scrollTo({top:0,behavior:r?'auto':'smooth'})})})();</script>" + TOP_END
)
TOP_BLOCK = re.compile(re.escape(TOP_START) + ".*?" + re.escape(TOP_END), re.S)


def with_top_button(text):
    """The page with the back-to-top button just before </body> (replacing an older one)."""
    if TOP_START in text:
        return TOP_BLOCK.sub(lambda _: TOP_HTML, text, count=1)
    i = text.lower().rfind("</body>")
    return text if i < 0 else text[:i] + TOP_HTML + "\n" + text[i:]


def home_block(text, href):
    """The home button for a page. Pages with a sticky top bar get it first in
    the bar, with a divider before the section chips; anything else gets it at
    the top of the body."""
    link = f'<a class="home-link" href="{href}">{HOME_ICON}<span>হোম</span></a>'
    if '<div class="bar-row">' in text:
        return HOME_START + HOME_STYLE + link + '<span class="home-sep" aria-hidden="true"></span>' + HOME_END
    return HOME_START + HOME_STYLE + '<p style="margin:16px 20px 0">' + link + "</p>" + HOME_END

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


def note_key(folder):
    """Sort key for a notes folder: NOTE_ORDER first, then the rest in file-name order."""
    order = [unicodedata.normalize("NFC", s) for s in NOTE_ORDER.get(folder, [])]
    def key(path):
        stem = unicodedata.normalize("NFC", path.stem)
        return (order.index(stem) if stem in order else len(order), natural_key(path))
    return key


def read_page(path):
    try:
        return path.read_bytes().decode("utf-8")
    except UnicodeDecodeError:
        return ""


def add_home_link(path, text):
    """Insert the home and back-to-top buttons, or replace older ones. Returns what changed."""
    if not text:
        return None
    # "../index.html" from math/x.html, "../../index.html" from notes/math/x.html.
    depth = len(path.relative_to(ROOT).parts) - 1
    block = home_block(text, "../" * depth + "index.html")
    if HOME_START in text:
        new, status = HOME_BLOCK.sub(lambda _: block, text, count=1), "updated"
    elif '<div class="bar-row">' in text:
        new, status = text.replace('<div class="bar-row">', '<div class="bar-row">' + block, 1), "added"
    else:
        m = re.search(r"<body[^>]*>", text, re.I)
        if not m:
            return None
        new, status = text[: m.end()] + block + text[m.end() :], "added"
    new = with_top_button(new)
    if new == text:
        return None
    path.write_bytes(new.encode("utf-8"))
    return status


def page_info(path, text):
    title = first(r"<title[^>]*>(.*?)</title>", text) or path.stem
    questions = len(re.findall(r'<article class="q"', text))
    # A page's own description wins (notes pages use this).
    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', text, re.I)
    if m:
        return title, html.unescape(m.group(1)).strip(), questions
    # "বিষয় <b>…</b>" in the page's meta line; য় may be stored as য + nukta.
    subject = first(r"বিষ(?:য়|য়)\s*<b>(.*?)</b>", text) or first(r"<h1[^>]*>(.*?)</h1>", text)
    detail = [s for s in (subject if subject != title else "", f"{bn(questions)}টি প্রশ্ন" if questions else "") if s]
    return title, " · ".join(detail), questions


def render_subject(sid, name_bn, name_en, files, empty, noun):
    items = []
    for i, (rel, title, detail, *badge) in enumerate(files, 1):
        sub = f'<span class="file-meta">{html.escape(detail)}</span>' if detail else ""
        tag = f'<span class="file-q">{badge[0]}</span>' if badge and badge[0] else ""
        items.append(
            f'<li><a class="file" href="{html.escape(quote(rel))}">'
            f'<span class="file-n">{bn(i)}</span>'
            f'<span class="file-text"><span class="file-name">{html.escape(title)}{tag}</span>{sub}</span>'
            f'<span class="file-go" aria-hidden="true">→</span></a></li>'
        )
    body = f'<ol class="files">{"".join(items)}</ol>' if items else f'<p class="empty">{empty}</p>'
    count = f"{bn(len(files))}টি {noun}" if files else "খালি"
    return (
        f'<section class="subject" id="{sid}" aria-labelledby="{sid}-h">'
        f'<header class="subject-head"><div><p class="eyebrow">{name_en}</p>'
        f'<h3 id="{sid}-h">{name_bn}</h3></div><span class="count">{count}</span></header>'
        f"{body}</section>"
    )


def render_group(gid, heading, blurb, cards):
    return (
        f'<section class="group" id="{gid}" aria-labelledby="{gid}-h">'
        f'<header class="group-head"><h2 id="{gid}-h">{heading}</h2><p>{blurb}</p></header>'
        f'<div class="subjects">\n{"".join(cards)}\n</div></section>'
    )


def main():
    groups, counts, total_q, linked = [], {}, 0, []
    for gid, heading, blurb, folder_pattern, empty, noun in GROUPS:
        cards, count = [], 0
        order = SUBJECT_ORDER.get(gid)
        subjects = sorted(SUBJECTS, key=lambda s: order.index(s[0])) if order else SUBJECTS
        for folder, name_bn, name_en in subjects:
            rel = folder_pattern.format(folder)
            d = ROOT / rel
            d.mkdir(parents=True, exist_ok=True)
            files = []
            for path in sorted(d.glob("*.html"), key=note_key(folder) if gid == "notes" else natural_key):
                text = read_page(path)
                status = add_home_link(path, text)
                if status:
                    linked.append(f"{status}: {rel}/{path.name}")
                title, detail, q = page_info(path, text)
                if gid == "notes":
                    # One line of topics (the part before " — "), plus a badge with the page's exercise count.
                    exercises = len(re.findall(r'<article class="ex"', text))
                    files.append((f"{rel}/{path.name}", title, detail.split(" — ")[0], f"{bn(exercises)}টি প্রশ্ন" if exercises else ""))
                else:
                    files.append((f"{rel}/{path.name}", title, detail))
                total_q += q
            count += len(files)
            print(f"  {rel:<14} {len(files)} file(s)")
            if gid == "notes" and not files:
                continue   # an empty notes subject would only say "no notes yet"
            # MCQ cards keep their old ids (#math, #gk, …); notes cards get #notes-math, …
            sid = folder if gid == "mcq" else f"{gid}-{folder}"
            cards.append(render_subject(sid, name_bn, name_en, files, empty, noun))
        counts[gid] = count
        groups.append(render_group(gid, heading, blurb, cards))

    pid = PREVIOUS
    (ROOT / pid).mkdir(exist_ok=True)
    exam_dirs = sorted((d for d in (ROOT / pid).iterdir() if d.is_dir()), key=natural_key, reverse=True)
    for gid, heading, blurb, prefix, label, noun in PREVIOUS_GROUPS:
        cards, papers = [], 0
        for exam_dir in (d for d in exam_dirs if d.name.startswith(prefix)):
            files, name, year = [], exam_dir.name, ""
            for path in sorted(exam_dir.glob("*.html"), key=natural_key):
                text = read_page(path)
                status = add_home_link(path, text)
                if status:
                    linked.append(f"{status}: {pid}/{exam_dir.name}/{path.name}")
                title, detail, _ = page_info(path, text)
                card_name, _, paper = title.partition(" — ")
                name = card_name if paper else name
                years = re.findall(r"[০-৯]{4}|\d{4}", detail)
                year = year or (years[-1].translate(str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")) if years else "")
                files.append((f"{pid}/{exam_dir.name}/{path.name}", paper or title, detail))
            papers += len(files)
            cards.append(render_subject(f"{pid}-{exam_dir.name}", name, label + (f" · {year}" if year else ""), files, "", noun))
            print(f"  {pid}/{exam_dir.name:<8} {len(files)} file(s)")
        counts[gid] = papers
        if cards:
            groups.append(render_group(gid, heading, blurb, cards))

    meta = f"<span>বিষয় <b>{bn(len(SUBJECTS))}</b></span><span>MCQ ফাইল <b>{bn(counts['mcq'])}</b></span>"
    if total_q:
        meta += f"<span>প্রশ্ন <b>{bn(total_q)}</b></span>"
    meta += f"<span>নোট <b>{bn(counts['notes'])}</b></span>"
    meta += f"<span>বিগত প্রশ্নপত্র <b>{bn(counts['previous'])}</b></span>"
    jump = "".join(f'<a href="#{gid}">{heading} <span>↓</span></a>' for gid, heading, *_ in PREVIOUS_GROUPS if counts[gid])
    if counts["bcs"]:
        meta += f"<span>বিসিএস <b>{bn(counts['bcs'])}</b></span>"
    page = TEMPLATE.replace("{{META}}", meta).replace("{{JUMP}}", jump).replace("{{GROUPS}}", "\n".join(groups))
    (ROOT / "index.html").write_text(page, encoding="utf-8")

    for change in linked:
        print(f"  home button {change}")
    print(f"index.html updated: {counts['mcq']} MCQ file(s), {counts['notes']} note(s), "
          f"{counts['previous']} previous-year paper(s), {counts['bcs']} BCS paper(s)")


TEMPLATE = """<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>পড়াশোনা</title>
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
h1{font-family:var(--display);font-weight:700;font-size:clamp(28px,6vw,40px);line-height:1.25;margin:0}
.lede{color:var(--muted);margin:10px 0 0;max-width:56ch}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;margin:18px 0 0;font-size:14px;color:var(--muted)}
.meta b{color:var(--ink);font-weight:600}
.jump{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.jump a{display:inline-flex;gap:6px;align-items:center;font-size:13px;font-weight:600;text-decoration:none;
  color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 14px}
.jump a:hover{border-color:var(--accent);color:var(--accent)}
.jump span{color:var(--muted)}

/* Two parts (MCQ, notes), each a grid of subject cards. */
.group+.group{margin-top:48px}
.group-head{margin-bottom:16px}
.group-head h2{font-family:var(--display);font-size:clamp(22px,4.5vw,28px);font-weight:700;margin:0;line-height:1.3}
.group-head p{margin:4px 0 0;color:var(--muted);font-size:15px}
/* Notes use gold instead of green, so the two parts are easy to tell apart. */
#notes .eyebrow{color:var(--accent)}
#notes .file-n{color:var(--gold)}
#notes .file:hover{border-color:var(--gold);background:var(--gold-soft)}
#notes .file:hover .file-go{color:var(--gold)}
#notes .file-meta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#notes .files li{min-width:0}
.file-q{display:inline-block;margin-left:8px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:600;
  line-height:1.6;color:var(--gold);background:var(--gold-soft);vertical-align:1px;white-space:nowrap}

.subjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));
  gap:16px;align-items:start}
.subject{background:var(--card);border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--shadow);padding:18px}
.subject-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;
  padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);
  font-weight:600;margin:0 0 2px}
.subject h3{font-family:var(--display);font-size:22px;font-weight:700;margin:0;line-height:1.3}
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

.foot{margin-top:40px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font-size:14px;
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}
.foot p{margin:0}
.author{color:var(--ink);font-weight:600}
/* Reminder for the maintainer: the command that rebuilds this page. */
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;color:var(--muted);
  background:var(--accent-soft);padding:1px 7px;border-radius:4px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:420px){.subject{padding:14px}.file{padding-inline:8px}}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <h1>পড়াশোনা</h1>
    <p class="lede">বিষয় বেছে নিন, তারপর যে ফাইলটি পড়তে চান তার নামে ক্লিক করুন। প্রতিটি ফাইলে অনুশীলন মোড আছে।</p>
    <p class="meta">{{META}}</p>
    <nav class="jump" aria-label="অংশ"><a href="#mcq">MCQ অনুশীলন <span>↓</span></a><a href="#notes">নোট <span>↓</span></a>{{JUMP}}</nav>
  </header>

  <main>
{{GROUPS}}
  </main>

  <footer class="foot">
    <p class="author">Chayan Roy</p>
    <code>python3 build.py</code>
  </footer>
</div>
</body>
</html>
"""

if __name__ == "__main__":
    main()

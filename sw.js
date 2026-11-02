/* Offline support for পড়াশোনা.
   Keeps every page of the site on the device, so it opens and reads without internet.
   build.py writes FILES below: each file with a fingerprint of its contents. When a build
   changes any file, this script changes too, the browser installs it in the background,
   and only the files whose fingerprint changed are downloaded again. Open pages that
   changed are then told, so they can offer a "Refresh". */
const CACHE = "study-pages";
const FONTS = "study-fonts";   // names start with "study-": other sites on this address share the storage

/* <files> written by build.py, don't edit by hand */
const FILES = {
"bengali/NTRCA বাংলা — ২০০ বাগধারা MCQ.html": "8f72971533",
"bengali/এক কথায় প্রকাশ — ২০০ MCQ.html": "774ac175b7",
"bengali/কারক ও বিভক্তি — ২০০ MCQ.html": "09552938bd",
"bengali/যতিচিহ্ন — ২০০ MCQ.html": "8691593ac8",
"bengali/সন্ধি বিচ্ছেদ — ২০০ MCQ.html": "1c087b70ed",
"english/Article ও Preposition — ২০০ MCQ.html": "252f26aa48",
"english/Idioms ও Phrases — ২০০ MCQ.html": "577e6266cd",
"gk/NTRCA প্রশ্নব্যাংক.html": "211b036f58",
"gk/আন্তর্জাতিক প্রশ্নব্যাংক.html": "dc06e95efd",
"gk/বিজ্ঞান প্রশ্নব্যাংক.html": "b55bec0c78",
"gk/ভূগোল ও অর্থনীতি প্রশ্নব্যাংক.html": "2c0e8ea16b",
"gk/সাম্প্রতিক প্রশ্নব্যাংক.html": "103626673f",
"icons/apple-touch-icon.png": "40d55762fe",
"icons/icon-192.png": "fbba24f8de",
"icons/icon-512.png": "debc915847",
"icons/icon-maskable-512.png": "9f63cb53bf",
"index.html": "e12fcd06ce",
"manifest.webmanifest": "07b37c9c70",
"math/NTRCA গণিত — সব সূত্র MCQ.html": "cca2af5b67",
"notes/bengali/কারক, প্রত্যয় ও উপসর্গ.html": "a0775e61f6",
"notes/bengali/ধ্বনি ও বর্ণ.html": "39a29c91f5",
"notes/bengali/বাংলা ভাষা ও সাহিত্য.html": "dcd2d87410",
"notes/bengali/বাগধারা, সমার্থক ও বিপরীত শব্দ.html": "53f85bf46c",
"notes/bengali/বানান ও শুদ্ধ প্রয়োগ.html": "85c0c930ac",
"notes/bengali/ভাষারীতি, যতিচিহ্ন ও নির্মিতি.html": "2bd1e49d17",
"notes/bengali/শব্দ, পদ ও বাক্য.html": "6a7f869161",
"notes/bengali/সন্ধি ও সমাস.html": "cca890423f",
"notes/english/Article ও Preposition.html": "e0adcb12c3",
"notes/english/Idioms ও Phrases.html": "5d98e206e4",
"notes/english/Parts of Speech.html": "691b1121fe",
"notes/english/Right Form of Verbs.html": "2947f6d993",
"notes/english/Synonym ও Antonym.html": "a297ed56fb",
"notes/english/Transformation of Sentences.html": "e93e50de75",
"notes/english/Voice ও Narration.html": "7ea3332621",
"notes/gk/আন্তর্জাতিক সংস্থা, চুক্তি ও দিবস.html": "258a607ec2",
"notes/gk/কম্পিউটার ও তথ্যপ্রযুক্তি.html": "a39ef1c5ff",
"notes/gk/বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ.html": "0d46817215",
"notes/gk/বাংলাদেশের ভূগোল ও অর্থনীতি.html": "1faefbc0b8",
"notes/gk/বিশ্ব পরিচিতি ও সমসাময়িক ঘটনা.html": "3263d59146",
"notes/gk/সংবিধান, শাসনব্যবস্থা ও সংস্কৃতি.html": "caa3b9fda1",
"notes/gk/সাধারণ বিজ্ঞান.html": "ae0eb47847",
"notes/math/অনুপাত, ল.সা.গু-গ.সা.গু ও ঐকিক নিয়ম.html": "f7e902da22",
"notes/math/গড়.html": "631ca0fa2c",
"notes/math/জ্যামিতি ও বৃত্ত.html": "19518d812b",
"notes/math/ত্রিকোণমিতি.html": "02c9680bb2",
"notes/math/পরিমিতি.html": "c7718474b9",
"notes/math/বীজগণিতের সূত্র ও উৎপাদক.html": "197150f785",
"notes/math/লগারিদম.html": "faf2e4b86e",
"notes/math/শতকরা, লাভ-ক্ষতি ও সুদ.html": "7ed20fd90c",
"notes/math/সংখ্যা ও ভগ্নাংশ.html": "9c2c48adc1",
"notes/math/সূচক ও করণী.html": "5d49c9e7ce",
"offline.js": "e747e0fd15",
"previous/bcs-41/1 প্রিলিমিনারি.html": "eb26e818d9",
"previous/bcs-42/1 প্রিলিমিনারি.html": "a37593bd0f",
"previous/bcs-43/1 প্রিলিমিনারি.html": "ed7cd593e7",
"previous/bcs-44/1 প্রিলিমিনারি.html": "7e19c34483",
"previous/bcs-45/1 প্রিলিমিনারি.html": "87f3e41be5",
"previous/bcs-46/1 প্রিলিমিনারি.html": "8383ffd8ce",
"previous/bcs-47/1 প্রিলিমিনারি.html": "7667b60e97",
"previous/bcs-50/1 প্রিলিমিনারি.html": "ea1b5355b8",
"previous/ntrca-10/1 স্কুল পর্যায়.html": "e44df6e086",
"previous/ntrca-10/2 স্কুল পর্যায়-২.html": "249660adb5",
"previous/ntrca-10/3 কলেজ পর্যায়.html": "84a10d96e7",
"previous/ntrca-11/1 স্কুল পর্যায়.html": "66434f149e",
"previous/ntrca-11/2 স্কুল পর্যায়-২.html": "37d8264443",
"previous/ntrca-11/3 কলেজ পর্যায়.html": "50957d0f0b",
"previous/ntrca-12/1 স্কুল পর্যায়.html": "272c7f6323",
"previous/ntrca-12/2 স্কুল পর্যায়-২.html": "4a84115ed1",
"previous/ntrca-12/3 কলেজ পর্যায়.html": "e1504e63c6",
"previous/ntrca-13/1 স্কুল পর্যায়.html": "09bd7b3595",
"previous/ntrca-13/2 স্কুল পর্যায়-২.html": "bd8eac4824",
"previous/ntrca-13/3 কলেজ পর্যায়.html": "7b823639de",
"previous/ntrca-14/1 স্কুল পর্যায়.html": "809d3a7380",
"previous/ntrca-14/2 স্কুল পর্যায়-২.html": "cc8ba74f61",
"previous/ntrca-14/3 কলেজ পর্যায়.html": "de8c73870f",
"previous/ntrca-15/1 স্কুল পর্যায়.html": "ae4792378e",
"previous/ntrca-15/2 স্কুল পর্যায়-২.html": "449c64dfdd",
"previous/ntrca-15/3 কলেজ পর্যায়.html": "f02326d7ea",
"previous/ntrca-16/1 স্কুল পর্যায়.html": "07f5972e76",
"previous/ntrca-16/2 স্কুল পর্যায়-২.html": "9e29f4b985",
"previous/ntrca-16/3 কলেজ পর্যায়.html": "b0714476eb",
"previous/ntrca-17/1 স্কুল পর্যায়.html": "9392702025",
"previous/ntrca-17/2 স্কুল পর্যায়-২.html": "b0fe166a0f",
"previous/ntrca-17/3 কলেজ পর্যায়.html": "19897dbadf",
"previous/ntrca-18/1 স্কুল পর্যায়.html": "e5bf723bca",
"previous/ntrca-18/2 স্কুল পর্যায়-২.html": "d2e697ed72",
"previous/ntrca-18/3 কলেজ পর্যায়.html": "d58f4112da",
"previous/ntrca-7/1 স্কুল পর্যায়.html": "a902ba8cb8",
"previous/ntrca-7/3 কলেজ পর্যায়.html": "b7a81b6816",
"previous/ntrca-8/1 স্কুল পর্যায়.html": "f42fe403c5",
"previous/ntrca-8/3 কলেজ পর্যায়.html": "2d0888f87d",
"previous/ntrca-9/1 স্কুল পর্যায়.html": "a10e3c36a5",
"previous/ntrca-9/3 কলেজ পর্যায়.html": "b509532c7c",
"search-index.js": "af14f17b72"
};
/* </files> */

const scoped = path => new URL(path, self.registration.scope).href;
const HASHES = scoped(".saved-files");   // which version of each file is saved (not a real file)

/* One cache entry per file: "?q=…" and "#…" are ignored, the folder address means index.html,
   and "%2C" and "," (or any other escaped letter) count as the same address. */
function keyFor(url) {
  const u = new URL(url);
  u.search = ""; u.hash = "";
  if (u.pathname.endsWith("/")) u.pathname += "index.html";
  try { u.pathname = decodeURIComponent(u.pathname); } catch (e) { /* keep it as it is */ }
  return u.href;
}

async function tell(message) {
  for (const client of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) client.postMessage(message);
}

let changed = [];   // pages a newer build replaced, for the "Refresh" offer once this version takes over

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(HASHES).then(r => (r ? r.json() : {})).catch(() => ({}));
    const names = Object.keys(FILES), todo = names.filter(p => saved[p] !== FILES[p]);
    let done = names.length - todo.length, failed = 0;
    // Six downloads at a time. "?v=" makes sure a new version isn't answered from an old copy on the way.
    const queue = todo.slice();
    await Promise.all(Array.from({ length: 6 }, async () => {
      for (let p; (p = queue.shift()) !== undefined;) {
        try {
          const res = await fetch(scoped(p) + "?v=" + FILES[p], { cache: "no-cache" });
          if (!res.ok) throw new Error(res.status);
          await cache.put(keyFor(scoped(p)), res);
          if (saved[p]) changed.push(keyFor(scoped(p)));
          saved[p] = FILES[p]; done++;
        } catch (e) { failed++; }
        await tell({ type: "progress", done, total: names.length });
      }
    }));
    for (const p of Object.keys(saved)) {
      if (!(p in FILES)) { await cache.delete(keyFor(scoped(p))); delete saved[p]; }
    }
    await cache.put(HASHES, new Response(JSON.stringify(saved)));
    await saveFonts(cache);
    if (failed) {
      // What was saved stays saved; the browser tries again on a later visit and only fetches the rest.
      await tell({ type: "failed", done, total: names.length });
      throw new Error(`${failed} file(s) could not be saved`);
    }
    await tell({ type: "saved", total: names.length });
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("study-") && k !== CACHE && k !== FONTS) await caches.delete(k);
    await self.clients.claim();
    if (changed.length) await tell({ type: "updated", files: changed });
    changed = [];
  })());
});

/* The Google Fonts stylesheet named in index.html, plus its Bengali and Latin font files.
   The browser only downloads a font file once text needs it, so without this, a page could
   show a fallback font the first time it is opened offline. */
async function saveFonts(cache) {
  try {
    const page = await cache.match(keyFor(scoped("index.html")));
    const link = page && (await page.text()).match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/);
    if (!link) return;
    const fonts = await caches.open(FONTS), cssUrl = link[1].replace(/&amp;/g, "&");
    if (await fonts.match(cssUrl)) return;
    const res = await fetch(cssUrl);
    if (!res.ok) return;
    const files = new Set();
    for (const [, subset, body] of (await res.clone().text()).matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g)) {
      const src = body.match(/url\(([^)]+)\)/);
      if (src && (subset === "bengali" || subset === "latin")) files.add(src[1]);
    }
    await Promise.all([...files].map(async url => {
      if (await fonts.match(url)) return;
      const font = await fetch(url).catch(() => null);
      if (font && font.ok) await fonts.put(url, font);
    }));
    await fonts.put(cssUrl, res);   // last, so an interrupted run is tried again
  } catch (e) { /* fonts are a nice-to-have; pages still read fine in the phone's own Bengali font */ }
}

const OFFLINE_PAGE = `<!doctype html><html lang="bn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>অফলাইন</title><body style="font-family:'Hind Siliguri',system-ui,sans-serif;background:#F5F8F4;color:#18231C;padding:40px 20px;text-align:center">
<p style="font-size:18px">এই পাতাটি এখনো এই ফোনে সংরক্ষিত হয়নি।<br>ইন্টারনেট চালু করে আবার খুলুন।</p>
<p><a href="${scoped("./")}" style="color:#14624A;font-weight:600">হোমে যান</a></p></body></html>`;

/* Site pages: answer from the saved copy at once. When online, a page you open is also checked
   quietly for a newer copy (for a page edited without running build.py); the next visit shows it.
   GitHub's servers may hand out an older copy for a few minutes after a push, so a copy only
   replaces the saved one when it is newer (Last-Modified). */
const newer = (a, b) => Date.parse(a.headers.get("last-modified")) > Date.parse(b.headers.get("last-modified"));
async function fromCache(event) {
  const cache = await caches.open(CACHE), key = keyFor(event.request.url), saved = await cache.match(key);
  if (saved) {
    if (event.request.mode === "navigate") {
      event.waitUntil(fetch(key, { cache: "no-cache" }).then(res => (res.ok && newer(res, saved) ? cache.put(key, res) : null)).catch(() => {}));
    }
    return saved;
  }
  try {
    return await fetch(event.request);
  } catch (e) {
    if (event.request.mode !== "navigate") return Response.error();
    return new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

/* Google Fonts never change at a given address, so the saved copy is always fine. */
async function cacheFirst(request) {
  const cache = await caches.open(FONTS), saved = await cache.match(request, { ignoreVary: true });
  if (saved) return saved;
  try {
    const res = await fetch(request);
    if (res.ok || res.type === "opaque") await cache.put(request, res.clone());
    return res;
  } catch (e) { return Response.error(); }
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(fromCache(event));
  else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") event.respondWith(cacheFirst(request));
});

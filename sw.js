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
"bengali/NTRCA বাংলা — ২০০ বাগধারা MCQ.html": "8e56675cc5",
"bengali/এক কথায় প্রকাশ — ২০০ MCQ.html": "4af340b15f",
"bengali/কারক ও বিভক্তি — ২০০ MCQ.html": "8ca270d5c8",
"bengali/যতিচিহ্ন — ২০০ MCQ.html": "5d4753500b",
"bengali/সন্ধি বিচ্ছেদ — ২০০ MCQ.html": "da881e9562",
"english/Article ও Preposition — ২০০ MCQ.html": "445cb4f0f8",
"english/Idioms ও Phrases — ২০০ MCQ.html": "a39f404b11",
"gk/NTRCA প্রশ্নব্যাংক.html": "2c201efbdc",
"gk/আন্তর্জাতিক প্রশ্নব্যাংক.html": "275bcc941b",
"gk/বিজ্ঞান প্রশ্নব্যাংক.html": "244a8b55e5",
"gk/ভূগোল ও অর্থনীতি প্রশ্নব্যাংক.html": "04158af3f5",
"gk/সাম্প্রতিক প্রশ্নব্যাংক.html": "77f522aeea",
"icons/apple-touch-icon.png": "40d55762fe",
"icons/icon-192.png": "fbba24f8de",
"icons/icon-512.png": "debc915847",
"icons/icon-maskable-512.png": "9f63cb53bf",
"index.html": "1a4e7804a6",
"manifest.webmanifest": "82d904c676",
"math/NTRCA গণিত — সব সূত্র MCQ.html": "16d245d253",
"notes/bengali/কারক, প্রত্যয় ও উপসর্গ.html": "5224670f33",
"notes/bengali/ধ্বনি ও বর্ণ.html": "7b760ee917",
"notes/bengali/বাংলা ভাষা ও সাহিত্য.html": "27b850936a",
"notes/bengali/বাগধারা, সমার্থক ও বিপরীত শব্দ.html": "1c926c56f8",
"notes/bengali/বানান ও শুদ্ধ প্রয়োগ.html": "5ee5bc6ac7",
"notes/bengali/ভাষারীতি, যতিচিহ্ন ও নির্মিতি.html": "4a325c4427",
"notes/bengali/শব্দ, পদ ও বাক্য.html": "56aa215c53",
"notes/bengali/সন্ধি ও সমাস.html": "e4d0966066",
"notes/english/Article ও Preposition.html": "1375386305",
"notes/english/Idioms ও Phrases.html": "9652ae887c",
"notes/english/Parts of Speech.html": "0db03bd151",
"notes/english/Right Form of Verbs.html": "2cf98148f0",
"notes/english/Synonym ও Antonym.html": "de5fdbfcf4",
"notes/english/Transformation of Sentences.html": "728a28e697",
"notes/english/Voice ও Narration.html": "b2172e34aa",
"notes/gk/আন্তর্জাতিক সংস্থা, চুক্তি ও দিবস.html": "a937285525",
"notes/gk/কম্পিউটার ও তথ্যপ্রযুক্তি.html": "e93c93e2fd",
"notes/gk/বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ.html": "06aea3e652",
"notes/gk/বাংলাদেশের ভূগোল ও অর্থনীতি.html": "00bc69ed0d",
"notes/gk/বিশ্ব পরিচিতি ও সমসাময়িক ঘটনা.html": "1f8cce73c7",
"notes/gk/সংবিধান, শাসনব্যবস্থা ও সংস্কৃতি.html": "7fe1481e4f",
"notes/gk/সাধারণ বিজ্ঞান.html": "31b8ab0514",
"notes/math/অনুপাত, ল.সা.গু-গ.সা.গু ও ঐকিক নিয়ম.html": "4f51a2b9a2",
"notes/math/গড়.html": "9e0357809a",
"notes/math/জ্যামিতি ও বৃত্ত.html": "d2e930d4b2",
"notes/math/ত্রিকোণমিতি.html": "77b8663ff9",
"notes/math/পরিমিতি.html": "3af926c1bf",
"notes/math/বীজগণিতের সূত্র ও উৎপাদক.html": "3b0275dbce",
"notes/math/লগারিদম.html": "1d1d7819ee",
"notes/math/শতকরা, লাভ-ক্ষতি ও সুদ.html": "f18bf490a7",
"notes/math/সংখ্যা ও ভগ্নাংশ.html": "9b9445d819",
"notes/math/সূচক ও করণী.html": "375e68251a",
"offline.js": "1b37e17413",
"previous/bcs-41/1 প্রিলিমিনারি.html": "99359e5a9a",
"previous/bcs-42/1 প্রিলিমিনারি.html": "bc489de9e2",
"previous/bcs-43/1 প্রিলিমিনারি.html": "a0c1e8d5bd",
"previous/bcs-44/1 প্রিলিমিনারি.html": "7fca9bf2b3",
"previous/bcs-45/1 প্রিলিমিনারি.html": "175868d4ce",
"previous/bcs-46/1 প্রিলিমিনারি.html": "a663d38bb1",
"previous/bcs-47/1 প্রিলিমিনারি.html": "894f7577b5",
"previous/bcs-50/1 প্রিলিমিনারি.html": "aebddf2470",
"previous/ntrca-10/1 স্কুল পর্যায়.html": "0aeb9d6f5d",
"previous/ntrca-10/2 স্কুল পর্যায়-২.html": "1be6d2006f",
"previous/ntrca-10/3 কলেজ পর্যায়.html": "beebf6601c",
"previous/ntrca-11/1 স্কুল পর্যায়.html": "18b2855b28",
"previous/ntrca-11/2 স্কুল পর্যায়-২.html": "87a835d8ee",
"previous/ntrca-11/3 কলেজ পর্যায়.html": "c1590483a6",
"previous/ntrca-12/1 স্কুল পর্যায়.html": "6bc9277dda",
"previous/ntrca-12/2 স্কুল পর্যায়-২.html": "959a25cc9a",
"previous/ntrca-12/3 কলেজ পর্যায়.html": "7b7525147b",
"previous/ntrca-13/1 স্কুল পর্যায়.html": "87400e6693",
"previous/ntrca-13/2 স্কুল পর্যায়-২.html": "40fc4462a7",
"previous/ntrca-13/3 কলেজ পর্যায়.html": "ba65d9f413",
"previous/ntrca-14/1 স্কুল পর্যায়.html": "c7eb09ab3d",
"previous/ntrca-14/2 স্কুল পর্যায়-২.html": "7a8b10b04e",
"previous/ntrca-14/3 কলেজ পর্যায়.html": "4d680433e8",
"previous/ntrca-15/1 স্কুল পর্যায়.html": "b5d8757dd4",
"previous/ntrca-15/2 স্কুল পর্যায়-২.html": "110efd26a7",
"previous/ntrca-15/3 কলেজ পর্যায়.html": "569f20d21a",
"previous/ntrca-16/1 স্কুল পর্যায়.html": "37e5b67370",
"previous/ntrca-16/2 স্কুল পর্যায়-২.html": "cf9c5fe0b0",
"previous/ntrca-16/3 কলেজ পর্যায়.html": "25d746a765",
"previous/ntrca-17/1 স্কুল পর্যায়.html": "2ff35b9bdc",
"previous/ntrca-17/2 স্কুল পর্যায়-২.html": "15506730d6",
"previous/ntrca-17/3 কলেজ পর্যায়.html": "448b112198",
"previous/ntrca-18/1 স্কুল পর্যায়.html": "95f0da7d33",
"previous/ntrca-18/2 স্কুল পর্যায়-২.html": "b1021c0efa",
"previous/ntrca-18/3 কলেজ পর্যায়.html": "ca6aa7c2ae",
"previous/ntrca-7/1 স্কুল পর্যায়.html": "34e7e5fd45",
"previous/ntrca-7/3 কলেজ পর্যায়.html": "95695c8ed5",
"previous/ntrca-8/1 স্কুল পর্যায়.html": "536c2f6b1d",
"previous/ntrca-8/3 কলেজ পর্যায়.html": "d259ab5d47",
"previous/ntrca-9/1 স্কুল পর্যায়.html": "d5b95224ef",
"previous/ntrca-9/3 কলেজ পর্যায়.html": "7a36cc2c4a",
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

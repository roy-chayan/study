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
"bengali/NTRCA বাংলা — ২০০ বাগধারা MCQ.html": "f785314426",
"bengali/এক কথায় প্রকাশ — ২০০ MCQ.html": "f32be8beba",
"bengali/কারক ও বিভক্তি — ২০০ MCQ.html": "45ce63ae1c",
"bengali/যতিচিহ্ন — ২০০ MCQ.html": "349e367293",
"bengali/সন্ধি বিচ্ছেদ — ২০০ MCQ.html": "8ceabc04a5",
"english/Article ও Preposition — ২০০ MCQ.html": "569596cfac",
"english/Idioms ও Phrases — ২০০ MCQ.html": "083c1ca03e",
"gk/NTRCA প্রশ্নব্যাংক.html": "3537572b4f",
"gk/আন্তর্জাতিক প্রশ্নব্যাংক.html": "8419560b1b",
"gk/বিজ্ঞান প্রশ্নব্যাংক.html": "5e3e25ae67",
"gk/ভূগোল ও অর্থনীতি প্রশ্নব্যাংক.html": "103ebf8b94",
"gk/সাম্প্রতিক প্রশ্নব্যাংক.html": "996b7c3406",
"icons/apple-touch-icon.png": "40d55762fe",
"icons/icon-192.png": "fbba24f8de",
"icons/icon-512.png": "debc915847",
"icons/icon-maskable-512.png": "9f63cb53bf",
"index.html": "56802063ea",
"listen.js": "429301effb",
"manifest.webmanifest": "07b37c9c70",
"math/NTRCA গণিত — সব সূত্র MCQ.html": "12d2c26d05",
"notes/bengali/কারক, প্রত্যয় ও উপসর্গ.html": "b6580b4497",
"notes/bengali/ধ্বনি ও বর্ণ.html": "a5f62bf6fe",
"notes/bengali/বাংলা ভাষা ও সাহিত্য.html": "3f8539c89a",
"notes/bengali/বাগধারা, সমার্থক ও বিপরীত শব্দ.html": "9ba20d4eec",
"notes/bengali/বানান ও শুদ্ধ প্রয়োগ.html": "5527420bc2",
"notes/bengali/ভাষারীতি, যতিচিহ্ন ও নির্মিতি.html": "c5dffc3e16",
"notes/bengali/শব্দ, পদ ও বাক্য.html": "c9b4b50295",
"notes/bengali/সন্ধি ও সমাস.html": "1e23377429",
"notes/english/Article ও Preposition.html": "f98077751f",
"notes/english/Idioms ও Phrases.html": "eeab8a3974",
"notes/english/Parts of Speech.html": "6d8818b537",
"notes/english/Right Form of Verbs.html": "ae57bd7beb",
"notes/english/Synonym ও Antonym.html": "8b9956ef68",
"notes/english/Transformation of Sentences.html": "0e6bdb8f34",
"notes/english/Voice ও Narration.html": "6c427d7770",
"notes/gk/আন্তর্জাতিক সংস্থা, চুক্তি ও দিবস.html": "7f488d5ef4",
"notes/gk/কম্পিউটার ও তথ্যপ্রযুক্তি.html": "4429f2cf7f",
"notes/gk/বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ.html": "ffd937883d",
"notes/gk/বাংলাদেশের ভূগোল ও অর্থনীতি.html": "b6bbef0816",
"notes/gk/বিশ্ব পরিচিতি ও সমসাময়িক ঘটনা.html": "128b0c4858",
"notes/gk/সংবিধান, শাসনব্যবস্থা ও সংস্কৃতি.html": "42d9c079ec",
"notes/gk/সাধারণ বিজ্ঞান.html": "5a053910b7",
"notes/math/অনুপাত, ল.সা.গু-গ.সা.গু ও ঐকিক নিয়ম.html": "0b7cbf459c",
"notes/math/গড়.html": "8fec60d782",
"notes/math/জ্যামিতি ও বৃত্ত.html": "db2c0d358f",
"notes/math/ত্রিকোণমিতি.html": "b8bbe34feb",
"notes/math/পরিমিতি.html": "9f9bd0a501",
"notes/math/বীজগণিতের সূত্র ও উৎপাদক.html": "a728d92b24",
"notes/math/লগারিদম.html": "67391493ae",
"notes/math/শতকরা, লাভ-ক্ষতি ও সুদ.html": "3f665a3218",
"notes/math/সংখ্যা ও ভগ্নাংশ.html": "d0e67328aa",
"notes/math/সূচক ও করণী.html": "e43ae9f7bb",
"offline.js": "e747e0fd15",
"previous/bcs-33/1 প্রিলিমিনারি.html": "65e68444cc",
"previous/bcs-34/1 প্রিলিমিনারি.html": "44e38db768",
"previous/bcs-35/1 প্রিলিমিনারি.html": "c26e9e929e",
"previous/bcs-36/1 প্রিলিমিনারি.html": "4d12dce71c",
"previous/bcs-37/1 প্রিলিমিনারি.html": "d90b735421",
"previous/bcs-38/1 প্রিলিমিনারি.html": "be23182c22",
"previous/bcs-39/1 প্রিলিমিনারি.html": "2b5d68ab95",
"previous/bcs-40/1 প্রিলিমিনারি.html": "433e8d8f32",
"previous/bcs-41/1 প্রিলিমিনারি.html": "9137eec8b1",
"previous/bcs-42/1 প্রিলিমিনারি.html": "10d6b6a117",
"previous/bcs-43/1 প্রিলিমিনারি.html": "90267a4c6f",
"previous/bcs-44/1 প্রিলিমিনারি.html": "f1652c2ca4",
"previous/bcs-45/1 প্রিলিমিনারি.html": "fead9cd9d4",
"previous/bcs-46/1 প্রিলিমিনারি.html": "8a6d73c463",
"previous/bcs-47/1 প্রিলিমিনারি.html": "621f95be8a",
"previous/bcs-50/1 প্রিলিমিনারি.html": "5bb9be34d2",
"previous/ntrca-10/1 স্কুল পর্যায়.html": "43d5323fed",
"previous/ntrca-10/2 স্কুল পর্যায়-২.html": "bac9e9fa0a",
"previous/ntrca-10/3 কলেজ পর্যায়.html": "0bde56c492",
"previous/ntrca-11/1 স্কুল পর্যায়.html": "63926ff54b",
"previous/ntrca-11/2 স্কুল পর্যায়-২.html": "1b1cfb0737",
"previous/ntrca-11/3 কলেজ পর্যায়.html": "cbc9f256f0",
"previous/ntrca-12/1 স্কুল পর্যায়.html": "6be823d5f7",
"previous/ntrca-12/2 স্কুল পর্যায়-২.html": "b48d00991e",
"previous/ntrca-12/3 কলেজ পর্যায়.html": "d28ef57fde",
"previous/ntrca-13/1 স্কুল পর্যায়.html": "611e1140e1",
"previous/ntrca-13/2 স্কুল পর্যায়-২.html": "d2429d0c42",
"previous/ntrca-13/3 কলেজ পর্যায়.html": "15caa8607d",
"previous/ntrca-14/1 স্কুল পর্যায়.html": "542ad8aa74",
"previous/ntrca-14/2 স্কুল পর্যায়-২.html": "c231f73de9",
"previous/ntrca-14/3 কলেজ পর্যায়.html": "15177d535f",
"previous/ntrca-15/1 স্কুল পর্যায়.html": "b6947a665a",
"previous/ntrca-15/2 স্কুল পর্যায়-২.html": "60923216e4",
"previous/ntrca-15/3 কলেজ পর্যায়.html": "5720866e3c",
"previous/ntrca-16/1 স্কুল পর্যায়.html": "966cd1580d",
"previous/ntrca-16/2 স্কুল পর্যায়-২.html": "a07b46be7e",
"previous/ntrca-16/3 কলেজ পর্যায়.html": "3d564c1935",
"previous/ntrca-17/1 স্কুল পর্যায়.html": "585ccab248",
"previous/ntrca-17/2 স্কুল পর্যায়-২.html": "5b8e68ca5c",
"previous/ntrca-17/3 কলেজ পর্যায়.html": "6e606ea86d",
"previous/ntrca-18/1 স্কুল পর্যায়.html": "3d51fc5b2e",
"previous/ntrca-18/2 স্কুল পর্যায়-২.html": "41ae617c54",
"previous/ntrca-18/3 কলেজ পর্যায়.html": "688bf8c417",
"previous/ntrca-7/1 স্কুল পর্যায়.html": "7b3c2493d8",
"previous/ntrca-7/3 কলেজ পর্যায়.html": "c2b5bfe264",
"previous/ntrca-8/1 স্কুল পর্যায়.html": "601c803337",
"previous/ntrca-8/3 কলেজ পর্যায়.html": "263ff11945",
"previous/ntrca-9/1 স্কুল পর্যায়.html": "077d114e9f",
"previous/ntrca-9/3 কলেজ পর্যায়.html": "d71d0e3ddf",
"search-index.js": "58af48d930"
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
<title>অফলাইন</title><body style="font-family:'Noto Sans Bengali',system-ui,sans-serif;background:#F5F8F4;color:#18231C;padding:40px 20px;text-align:center">
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

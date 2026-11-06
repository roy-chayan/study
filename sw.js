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
"bengali/NTRCA বাংলা — ২০০ বাগধারা MCQ.html": "b5873ca01b",
"bengali/এক কথায় প্রকাশ — ২০০ MCQ.html": "a2abe96c1b",
"bengali/কারক ও বিভক্তি — ২০০ MCQ.html": "01b0fdfb8f",
"bengali/যতিচিহ্ন — ২০০ MCQ.html": "009cdc2a75",
"bengali/সন্ধি বিচ্ছেদ — ২০০ MCQ.html": "7357bcaaff",
"english/Article ও Preposition — ২০০ MCQ.html": "2e69dc2027",
"english/Idioms ও Phrases — ২০০ MCQ.html": "a51ba21eb4",
"gk/NTRCA প্রশ্নব্যাংক.html": "a6039c8416",
"gk/আন্তর্জাতিক প্রশ্নব্যাংক.html": "bc1c4e4de7",
"gk/বিজ্ঞান প্রশ্নব্যাংক.html": "80ac6f51d8",
"gk/ভূগোল ও অর্থনীতি প্রশ্নব্যাংক.html": "7b2157a367",
"gk/সাম্প্রতিক প্রশ্নব্যাংক.html": "cd6c3a3f7c",
"icons/apple-touch-icon.png": "40d55762fe",
"icons/icon-192.png": "fbba24f8de",
"icons/icon-512.png": "debc915847",
"icons/icon-maskable-512.png": "9f63cb53bf",
"index.html": "e12fcd06ce",
"listen.js": "429301effb",
"manifest.webmanifest": "07b37c9c70",
"math/NTRCA গণিত — সব সূত্র MCQ.html": "e152b85596",
"notes/bengali/কারক, প্রত্যয় ও উপসর্গ.html": "9db2ffe72e",
"notes/bengali/ধ্বনি ও বর্ণ.html": "60b3cd4d5a",
"notes/bengali/বাংলা ভাষা ও সাহিত্য.html": "ae12304dd0",
"notes/bengali/বাগধারা, সমার্থক ও বিপরীত শব্দ.html": "4c4d6e3c1e",
"notes/bengali/বানান ও শুদ্ধ প্রয়োগ.html": "b287a2087a",
"notes/bengali/ভাষারীতি, যতিচিহ্ন ও নির্মিতি.html": "6b172f3e3d",
"notes/bengali/শব্দ, পদ ও বাক্য.html": "dc6459f95f",
"notes/bengali/সন্ধি ও সমাস.html": "617d2793e3",
"notes/english/Article ও Preposition.html": "5ec0c09d64",
"notes/english/Idioms ও Phrases.html": "1a5e9f3480",
"notes/english/Parts of Speech.html": "48fefde655",
"notes/english/Right Form of Verbs.html": "43d3edbb47",
"notes/english/Synonym ও Antonym.html": "d15fd74c50",
"notes/english/Transformation of Sentences.html": "13657dd280",
"notes/english/Voice ও Narration.html": "468d288fb9",
"notes/gk/আন্তর্জাতিক সংস্থা, চুক্তি ও দিবস.html": "540cb39ad9",
"notes/gk/কম্পিউটার ও তথ্যপ্রযুক্তি.html": "7ccb058406",
"notes/gk/বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ.html": "1efcd88a48",
"notes/gk/বাংলাদেশের ভূগোল ও অর্থনীতি.html": "0650b0a9c7",
"notes/gk/বিশ্ব পরিচিতি ও সমসাময়িক ঘটনা.html": "6afdea8eef",
"notes/gk/সংবিধান, শাসনব্যবস্থা ও সংস্কৃতি.html": "daa9aeffe8",
"notes/gk/সাধারণ বিজ্ঞান.html": "2ed7f6899a",
"notes/math/অনুপাত, ল.সা.গু-গ.সা.গু ও ঐকিক নিয়ম.html": "1c9a89ded6",
"notes/math/গড়.html": "944b1d02ff",
"notes/math/জ্যামিতি ও বৃত্ত.html": "15376b2b43",
"notes/math/ত্রিকোণমিতি.html": "58785c1c2a",
"notes/math/পরিমিতি.html": "d82db89913",
"notes/math/বীজগণিতের সূত্র ও উৎপাদক.html": "ff4c10a684",
"notes/math/লগারিদম.html": "ccb283e3ba",
"notes/math/শতকরা, লাভ-ক্ষতি ও সুদ.html": "bd8f0e752b",
"notes/math/সংখ্যা ও ভগ্নাংশ.html": "4e9787b575",
"notes/math/সূচক ও করণী.html": "77413ba71d",
"offline.js": "e747e0fd15",
"previous/bcs-41/1 প্রিলিমিনারি.html": "14059d693d",
"previous/bcs-42/1 প্রিলিমিনারি.html": "1610ff8597",
"previous/bcs-43/1 প্রিলিমিনারি.html": "5f9789508e",
"previous/bcs-44/1 প্রিলিমিনারি.html": "2a9aaba649",
"previous/bcs-45/1 প্রিলিমিনারি.html": "3bea79ca5f",
"previous/bcs-46/1 প্রিলিমিনারি.html": "12c111d256",
"previous/bcs-47/1 প্রিলিমিনারি.html": "1913b9b9c3",
"previous/bcs-50/1 প্রিলিমিনারি.html": "5a8e05e16d",
"previous/ntrca-10/1 স্কুল পর্যায়.html": "0e1a1d2972",
"previous/ntrca-10/2 স্কুল পর্যায়-২.html": "35ccc4e647",
"previous/ntrca-10/3 কলেজ পর্যায়.html": "5125921084",
"previous/ntrca-11/1 স্কুল পর্যায়.html": "84e96693b8",
"previous/ntrca-11/2 স্কুল পর্যায়-২.html": "b610424bcf",
"previous/ntrca-11/3 কলেজ পর্যায়.html": "0b0a4f609c",
"previous/ntrca-12/1 স্কুল পর্যায়.html": "98dac00ab8",
"previous/ntrca-12/2 স্কুল পর্যায়-২.html": "db61315e35",
"previous/ntrca-12/3 কলেজ পর্যায়.html": "d8ecf0d580",
"previous/ntrca-13/1 স্কুল পর্যায়.html": "e6f4d34f2a",
"previous/ntrca-13/2 স্কুল পর্যায়-২.html": "5bf2761a59",
"previous/ntrca-13/3 কলেজ পর্যায়.html": "4d1858b045",
"previous/ntrca-14/1 স্কুল পর্যায়.html": "d339b01ef1",
"previous/ntrca-14/2 স্কুল পর্যায়-২.html": "d60eb1ba70",
"previous/ntrca-14/3 কলেজ পর্যায়.html": "d3cb107f37",
"previous/ntrca-15/1 স্কুল পর্যায়.html": "86b5fb1058",
"previous/ntrca-15/2 স্কুল পর্যায়-২.html": "dee40d0041",
"previous/ntrca-15/3 কলেজ পর্যায়.html": "7622dcd619",
"previous/ntrca-16/1 স্কুল পর্যায়.html": "a6ce883904",
"previous/ntrca-16/2 স্কুল পর্যায়-২.html": "65333ea303",
"previous/ntrca-16/3 কলেজ পর্যায়.html": "0fe2c85d0e",
"previous/ntrca-17/1 স্কুল পর্যায়.html": "ae9006fff7",
"previous/ntrca-17/2 স্কুল পর্যায়-২.html": "92680434ea",
"previous/ntrca-17/3 কলেজ পর্যায়.html": "804c8dbb55",
"previous/ntrca-18/1 স্কুল পর্যায়.html": "f33b91478e",
"previous/ntrca-18/2 স্কুল পর্যায়-২.html": "5e7287a27a",
"previous/ntrca-18/3 কলেজ পর্যায়.html": "13ac91969d",
"previous/ntrca-7/1 স্কুল পর্যায়.html": "d65dece25b",
"previous/ntrca-7/3 কলেজ পর্যায়.html": "de46fc4f6b",
"previous/ntrca-8/1 স্কুল পর্যায়.html": "f894ee45c3",
"previous/ntrca-8/3 কলেজ পর্যায়.html": "1f3db7c7ef",
"previous/ntrca-9/1 স্কুল পর্যায়.html": "7e96a021d5",
"previous/ntrca-9/3 কলেজ পর্যায়.html": "b6382d2a18",
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

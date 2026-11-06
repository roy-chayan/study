/* Listen (শুনুন): reads a page aloud with the voices built into the reader's own browser (the Web Speech API),
   so it is free and needs no server. build.py links this file from every page except index.html.
   - The round speaker button at the bottom left reads from the top of the screen, and turns into a small player:
     previous, play/pause, next, speed, close. While the player is open, tapping a line reads from there.
   - Only what is on screen is read: answers that practice mode hides are skipped until they are revealed.
     Exam-tag chips, buttons, links to other pages and the top bar are skipped too.
   - Bangla gets a Bangla voice and English sentences an English voice. Maths symbols are read as words
     (2³ → "২ এর ঘাত ৩"), and forms shown crossed out or with ✗/✓ are announced as "ভুল:" / "ঠিক:".
   - The voices come from the device: Android (Google), Microsoft Edge and others have Bangla ones. Where there
     is none, the player says how to get one. */
(function () {
  var synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance || !document.body) return;
  var root = document.querySelector(".wrap") || document.body;

  /* ---- What to read ---------------------------------------------------------------------------- */
  // Never read: controls, the top bar, exam-tag chips, the stats line under the title, links to other pages, this player.
  var SKIP = "script,style,noscript,template,svg,button,input,select,textarea,nav,.bar,.to-top,.exam-cta,#sw-bar,.tts," +
    "[aria-hidden='true'],.xt,.exams,.top .meta,.find-n,a.more,.sec-links";
  // Text is read (and highlighted) one block at a time: the nearest of these around it.
  var BLOCK = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,td,th,caption,figcaption,blockquote,pre,.w";
  // Said before and after an element's text: labels that touch the next word, and what the page shows only
  // with colour, a ✗/✓ or strike-through.
  var SAY = [[".num,.ex-n", "প্রশ্ন ", "। "], [".q-tag,.dl", "", ": "], [".bad,s,del", "ভুল: ", ""], [".good", "ঠিক: ", ""]];
  // Markers while collecting text: superscript, subscript, "English here", "=" that means "means", line break.
  var SUP = "\uE001", SUP_END = "\uE002", SUB = "\uE003", SUB_END = "\uE004", EN = "\uE005", MEANS = "\uE006", BREAK = "\n";

  function shown(el) {
    return el.checkVisibility ? el.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })
      : el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  }
  function readable(t) {
    var el = t.parentElement;
    return !!el && /[^\s\u200B-\u200D]/.test(t.nodeValue) && !el.closest(SKIP) && shown(el);
  }
  function walker(at) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    if (at) w.currentNode = at;
    return w;
  }
  // The next (or previous) readable text after t; from the top of the page when t is null.
  function step(t, back) {
    var w = walker(t), n;
    while ((n = back ? w.previousNode() : w.nextNode())) if (readable(n)) return n;
    return null;
  }
  function blockOf(t) { return t.parentElement.closest(BLOCK) || t.parentElement; }
  function inside(el, sel, block) { var x = el.closest(sel); return x && block.contains(x) ? x : null; }

  // A segment is the run of readable texts around t that share one block.
  function segmentAt(t) {
    var b = blockOf(t), first = t, last = t, n;
    for (n = step(t, true); n && blockOf(n) === b; n = step(n, true)) first = n;
    for (n = step(t); n && blockOf(n) === b; n = step(n)) last = n;
    return { block: b, first: first, last: last };
  }
  function after(seg) { var n = root.contains(seg.last) && step(seg.last); return n ? segmentAt(n) : null; }
  function before(seg) { var n = root.contains(seg.first) && step(seg.first, true); return n ? segmentAt(n) : null; }

  // The box a text sits in: a pause is said where one box ends and the next begins (chips, stacked lines).
  function boxOf(el, block) {
    var f = inside(el, ".frac", block);   // a stacked fraction reads inline: top ÷ bottom
    for (var x = f ? f.parentElement : el; x && x !== block; x = x.parentElement) {
      if (!/^(inline|contents)$/.test(getComputedStyle(x).display)) return x;
    }
    return block;
  }

  function textOf(seg) {
    var out = "", box = null, sup = null, sub = null, frac = null, half = 0, said = [], open = [], prev = null, b = seg.block;
    function close(el) {   // the "after" words of labels the text has now left
      open = open.filter(function (o) { if (el && o[0].contains(el)) return true; out += o[1]; return false; });
    }
    var w = walker(seg.first);
    for (var t = seg.first; t; t = t === seg.last ? null : w.nextNode()) {
      if (!readable(t)) { out += " "; continue; }   // the space between two tags, or a skipped chip
      var el = t.parentElement, sp = inside(el, "sup", b), sb = inside(el, "sub", b), fr = inside(el, ".frac", b);
      var part = fr && fr.children[1] && fr.children[1].contains(el) ? 2 : 1, nb = boxOf(el, b);
      close(el);
      if (sup && sp !== sup) out += SUP_END;
      if (sub && sb !== sub) out += SUB_END;
      if (out && nb !== box) out += BREAK;
      else if (el !== prev && !(sp && sp !== sup) && !(sb && sb !== sub) && touching(out, t.nodeValue)) out += " ";
      prev = el;
      if (sp && sp !== sup) out += SUP;
      if (sb && sb !== sub) out += SUB;
      if (fr && fr === frac && part === 2 && half === 1) out += " ÷ ";   // a stacked fraction: top ÷ bottom
      box = nb; sup = sp; sub = sb; frac = fr; half = part;
      for (var i = 0; i < SAY.length; i++) {
        var x = inside(el, SAY[i][0], b);
        if (x && said.indexOf(x) < 0) { said.push(x); out += SAY[i][1]; if (SAY[i][2]) open.push([x, SAY[i][2]]); }
      }
      if (el.closest(".en")) out += EN;
      out += t.nodeValue;
    }
    close(null);
    if (sup) out += SUP_END;
    if (sub) out += SUB_END;
    return means(out.normalize("NFC"))
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣ]+/g, function (m) {
        return SUP + m.replace(/./g, function (c) { return "0123456789+−nx".charAt("⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣ".indexOf(c)); }) + SUP_END;
      })
      .replace(/[₀-₉]+/g, function (m) {
        return SUB + m.replace(/./g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x2050); }) + SUB_END;
      })
      // What is left: ℕ ℝ → N R, ᶜ ᵣ ₙ → c r n, ⁄ → / (so no voice reads out a symbol's long name).
      .normalize("NFKC").replace(/⁄/g, "/")
      .replace(/[ \t\r\f\v\u00A0]+/g, " ");
  }

  // "look into = তদন্ত করা", "CNG = Compressed Natural Gas": between two words, with no numbers or maths
  // signs around, "=" means "মানে". In maths ("জিদান = ২০ + ১৫", "x = log …", "AB = CD", "ad = bc") it is "সমান".
  function word(tok) {
    tok = (tok || "").replace(/^[‘’“”"'(\[]+|[‘’“”"')\]:,।]+$/g, "");
    return /^[\u0980-\u09E5\u09F0-\u09FF\u200C\u200DA-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F'’-]{2,}$/.test(tok) ? tok : "";
  }
  function means(text) {
    return text.replace(/=/g, function (m, i) {
      var left = text.slice(0, i).split(/[।.;,·\n]/).pop().replace(/\uE005/g, ""),
          right = text.slice(i + 1).split(/[।.;,·\n]/)[0].replace(/\uE005/g, "");
      var a = word((left.match(/(\S+)\s*$/) || [])[1]), b = word((right.match(/^\s*(\S+)/) || [])[1]), both = left + right;
      if (!a || !b || /[×÷+−√0-9০-৯\uE001-\uE004]/.test(both)) return m;
      if (/^[A-Z]{1,3}$/.test(a) && /^[A-Z]{1,3}$/.test(b)) return m;           // AB = CD
      return /[\u0980-\u09FF]|[A-Za-z]{4,}/.test(both) ? MEANS : m;            // not ad = bc
    });
  }
  // Two texts from different tags that touch on screen (kept apart by a margin): "N" + "হলে", "81" + "4".
  function touching(out, s) {
    var x = out.replace(/[\uE000-\uE00F]+$/, "").slice(-1), y = s.charAt(0);
    function script(c) { return /[\u0980-\u09FF]/.test(c) ? "bn" : /[A-Za-z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]/.test(c) ? "en" : ""; }
    return script(x) && script(y) && (script(x) !== script(y) || (/[0-9০-৯]/.test(x) && /[0-9০-৯]/.test(y)));
  }
  // "/" between words is "or" (and/or, a / an, সে/তিনি); in a fraction (3/4, (a + b)/ab, hc/λ) it is "over".
  function slash(t, w) {
    var letters = /^[‘’“”"'(]*[\u0980-\u09E5\u09F0-\u09FFA-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F'’-]+[‘’“”"'),:]*$/;
    return t.replace(/([^\s\/]*)(\s*)\/(\s*)([^\s\/]*)/g, function (m, a, s1, s2, b) {
      var or = s1 || s2 ? letters.test(a) && letters.test(b) : word(a) === a && word(b) === b && !!a && !!b;
      return a + (or ? w.or : w.over) + b;
    });
  }

  /* ---- Which voice, and how symbols are said -------------------------------------------------- */
  var BN_L = /[\u0980-\u09E5\u09F0-\u09FF]/, EN_L = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]/;   // not × or ÷

  // Splits a text into Bangla and English parts. English words inside a Bangla sentence stay with the Bangla
  // voice (it reads them well enough); English gets its own voice for a phrase of 3+ words, text marked
  // English on the page, or text that is mostly English (an English option after "ক").
  function parts(text) {
    var runs = [], cur = null, lead = "", bnCount = 0, hint = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i), k = BN_L.test(ch) ? "bn" : EN_L.test(ch) ? "en" : "";
      if (ch === EN) { if (cur && cur.k === "en") cur.hint = true; else hint = true; continue; }
      if (k === "bn") bnCount++;
      if (!k) { if (cur) cur.t += ch; else lead += ch; }
      else if (cur && cur.k === k) cur.t += ch;
      else {
        // An opening bracket or quote belongs to the part it opens: "ক। (" + "a + b)" → "ক।" + "(a + b)".
        var opener = cur && cur.t.match(/[(\[‘“"]+\s*$/);
        if (opener) { cur.t = cur.t.slice(0, -opener[0].length); lead = opener[0] + lead; }
        runs.push(cur = { k: k, t: lead + ch, hint: k === "en" && hint }); lead = ""; if (k === "en") hint = false;
      }
    }
    if (!runs.length) runs.push({ k: "bn", t: lead });
    var out = [];
    runs.forEach(function (r) {
      if (r.k === "en" && bnCount) {
        var words = r.t.match(/[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]{2,}/g) || [], letters = words.join("").length;
        if (!(r.hint || words.length >= 3 || (words.length === 2 && letters >= 6) || letters > bnCount)) r.k = "bn";
      }
      var last = out[out.length - 1];
      if (last && last.k === r.k) last.t += r.t;
      else out.push({ k: r.k, t: r.t });
    });
    return out;
  }

  var WORDS = {
    bn: { pow: " এর ঘাত ", base: " ভিত্তি ", neg: "ঋণাত্মক ", minus: " বিয়োগ ", over: " ভাগ ", or: " অথবা ", ratio: " অনুপাত ",
          to: " থেকে ", deg: " ডিগ্রি", c: " ডিগ্রি সেলসিয়াস", f: " ডিগ্রি ফারেনহাইট", min: " মিনিট", sec: " সেকেন্ড",
          stop: "। ", means: " মানে ", blank: " শূন্যস্থান ",
          sym: { "×": "গুণ", "÷": "ভাগ", "=": "সমান", "+": "যোগ", "≠": "সমান নয়", "≈": "প্রায়", "∝": "সমানুপাতিক",
                 "≤": "ছোট বা সমান", "≥": "বড় বা সমান", "<": "ছোট", ">": "বড়", "π": "পাই", "θ": "থিটা", "∠": "কোণ",
                 "△": "ত্রিভুজ", "∆": "ত্রিভুজ", "∴": "সুতরাং", "∵": "যেহেতু", "∞": "অসীম", "%": "শতাংশ", "√": "বর্গমূল", "∛": "ঘনমূল",
                 "✓": "ঠিক", "✔": "ঠিক", "✗": "ভুল", "✘": "ভুল", "✕": "বিপরীত", "±": "যোগ-বিয়োগ", "∓": "বিয়োগ-যোগ", "∜": "চতুর্থমূল",
                 "∩": "ছেদ", "∪": "সংযোগ", "∈": "অন্তর্ভুক্ত", "⊂": "উপসেট", "⊆": "উপসেট", "∅": "ফাঁকা সেট", "∥": "সমান্তরাল", "⊥": "লম্ব" } },
    en: { pow: " to the power ", base: " base ", neg: "minus ", minus: " minus ", over: " over ", or: " or ", ratio: " is to ",
          to: " to ", deg: " degrees", c: " degrees Celsius", f: " degrees Fahrenheit", min: " minutes", sec: " seconds",
          stop: ". ", means: " means ", blank: " blank ",
          sym: { "×": "times", "÷": "divided by", "=": "equals", "+": "plus", "≠": "is not equal to", "≈": "is about",
                 "∝": "is proportional to", "≤": "is at most", "≥": "is at least", "<": "is less than", ">": "is greater than",
                 "π": "pi", "θ": "theta", "∠": "angle", "△": "triangle", "∆": "triangle", "∴": "therefore", "∵": "because",
                 "∞": "infinity", "%": "percent", "√": "square root of", "∛": "cube root of",
                 "✓": "right", "✔": "right", "✗": "wrong", "✘": "wrong", "✕": "opposite", "±": "plus or minus",
                 "∓": "minus or plus", "∜": "fourth root of", "∩": "intersection", "∪": "union", "∈": "belongs to",
                 "⊂": "subset of", "⊆": "subset of", "∅": "empty set", "∥": "parallel to", "⊥": "perpendicular to" } }
  };
  var SYMBOLS = new RegExp("[" + Object.keys(WORDS.bn.sym).join("").replace(/[\]\\^-]/g, "\\$&") + "]", "g");
  var D = "0-9০-৯";
  var RANGE = new RegExp("([" + D + "][\\u0980-\\u09E5a-z]*)\\s*–\\s*(?=[" + D + "])", "g");
  var RATIO = new RegExp("([" + D + "A-Za-z)])\\s+:\\s+(?=[" + D + "A-Za-z(])", "g");

  function speakable(t, lang) {
    var w = WORDS[lang];
    t = t
      .replace(/(^|[\s(])\uE001([^\uE002]*)\uE002?/g, "$1$2 ")   // nothing before it, so not a power: ²³⁸U
      .replace(/\uE001([^\uE002]*)\uE002?/g, function (m, x) { return w.pow + x + ", "; })
      .replace(/\blog\s*\uE003([^\uE004]*)\uE004?/gi, function (m, x) { return "log" + w.base + x + ", "; })
      .replace(/\uE003([^\uE004]*)\uE004?/g, " $1 ")
      .replace(/\uE006/g, w.means)
      .replace(/[\uE000-\uE00F]/g, "")
      // Bangla grammar: √দৃশ্ is the root ("ধাতু") দৃশ্, not a square root.
      .replace(/√\s*([\u0985-\u09B9ৎ\u09DC-\u09DF][\u0980-\u09E5]*)/g, "$1 ধাতু")
      .replace(/°\s*(সেলসিয়াস|সে|C)(?![A-Za-z\u0985-\u09B9])/g, w.c)
      .replace(/°\s*(ফারেনহাইট|ফা|F)(?![A-Za-z\u0985-\u09B9])/g, w.f)
      .replace(/°/g, w.deg + " ")
      .replace(/([0-9০-৯])\s*(″|′′)/g, "$1" + w.sec).replace(/([0-9০-৯])\s*′/g, "$1" + w.min)   // 23°30′
      .replace(/(^|[\s(\[=,:])−(?=\S)/g, "$1" + w.neg)   // −1 is negative; x − 3 is a subtraction
      .replace(/\s*−\s*/g, w.minus)
      .replace(RANGE, "$1" + w.to)
      .replace(RATIO, "$1" + w.ratio);
    return slash(t, w)
      .replace(/\s*\^\s*/g, w.pow)   // ar^(n − 1)
      .replace(/_{2,}/g, w.blank).replace(/_/g, " ")   // "looking ____ the mother"
      .replace(SYMBOLS, function (c) { return " " + w.sym[c] + " "; })
      .replace(/[`★☆]/g, "")
      .replace(/\s*[→⇒↔⇔⟶←]\s*/g, ", ")
      .replace(/\s*[·•|]\s*/g, w.stop)
      .replace(/([।.!?,;:—–])?\s*\n\s*/g, function (m, p) { return p ? p + " " : w.stop; })
      .replace(/\s+/g, " ")
      .replace(/\s+([,।.!?;:)])/g, "$1")
      .replace(/,(\s*[,)])+/g, function (m) { return m.slice(-1) === ")" ? ")" : ","; })
      .replace(/,\s*([।.!?;:])/g, "$1")
      .replace(/([।.])(\s*[।.])+/g, "$1")
      .replace(/^[\s,।.;:]+/, "")
      .trim();
  }

  // Short pieces, a few sentences each: some browsers stop a long utterance part-way.
  function pieces(text) {
    var out = [], cur = "";
    function push(s) {
      s = s.trim();
      if (!s) return;
      if (cur && cur.length + s.length < 150) cur += " " + s;
      else { if (cur) out.push(cur); cur = s; }
    }
    text.replace(/([।!?;]+|\.)\s+/g, "$1\u0001").split("\u0001").forEach(function (s) {
      while (s.length > 200) {
        var cut = s.lastIndexOf(", ", 160);
        if (cut < 60) cut = s.lastIndexOf(" ", 160);
        if (cut < 60) cut = 160;
        push(s.slice(0, cut + 1));
        s = s.slice(cut + 1);
      }
      push(s);
    });
    if (cur) out.push(cur);
    return out.filter(function (s) { return /[\p{L}\p{N}]/u.test(s); });
  }

  function speechOf(seg) {
    var out = [];
    parts(textOf(seg)).forEach(function (p) {
      pieces(speakable(p.t, p.k)).forEach(function (s) { out.push({ lang: p.k, text: s }); });
    });
    return out;
  }

  /* ---- Voices --------------------------------------------------------------------------------- */
  var voices = [], broken = [];
  function loadVoices() { try { voices = synth.getVoices() || []; } catch (e) { voices = []; } }
  loadVoices();
  if (synth.addEventListener) synth.addEventListener("voiceschanged", loadVoices);
  else synth.onvoiceschanged = loadVoices;

  function voiceFor(lang) {
    var best = null, top = -1;
    voices.forEach(function (v) {
      var tag = (v.lang || "").replace(/_/g, "-").toLowerCase(), base = tag.split("-")[0];
      if ((base === "ben" ? "bn" : base === "eng" ? "en" : base) !== lang || broken.indexOf(v) >= 0) return;
      var score = (/natural|neural|online|enhanced|premium/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) +
        (tag === (lang === "bn" ? "bn-bd" : "en-us") ? 2 : tag === "en-gb" ? 1 : 0) + (v["default"] ? 1 : 0) +
        (!navigator.onLine && v.localService ? 8 : 0);   // online voices fail without internet
      if (score > top) { top = score; best = v; }
    });
    return best;
  }
  function noBangla() { return voices.length > 0 && !voiceFor("bn"); }

  /* ---- Player --------------------------------------------------------------------------------- */
  var RATES = [1, 1.25, 1.5, 0.75], RATE_KEY = "study_listen_rate", HINT_KEY = "study_listen_hint";
  var state = "off", seg = null, list = [], at = 0, gen = 0, utt = null, begun = false, started = 0, errors = 0, retried = false, quiet = 0;
  var rate = 1, lit = null, msgTimer = 0;
  try { rate = RATES.indexOf(+localStorage.getItem(RATE_KEY)) >= 0 ? +localStorage.getItem(RATE_KEY) : 1; } catch (e) {}

  function bn(n) { return String(n).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); }
  function svg(body, filled) {
    return '<svg viewBox="0 0 24 24" fill="' + (filled ? "currentColor" : "none") + '" stroke="' + (filled ? "none" : "currentColor") +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }
  var ICON = {
    listen: svg('<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.4 18.4a9 9 0 0 0 0-12.7"/>'),
    play: svg('<path d="M8 5.1v13.8a1 1 0 0 0 1.5.86l11-6.9a1 1 0 0 0 0-1.72l-11-6.9A1 1 0 0 0 8 5.1z"/>', true),
    pause: svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>', true),
    prev: svg('<path d="M18 19 9 12l9-7v14z"/><path d="M5 19V5"/>'),
    next: svg('<path d="m6 5 9 7-9 7V5z"/><path d="M19 5v14"/>'),
    close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')
  };

  var ui = document.createElement("div");
  ui.className = "tts";
  // Its own styles, with the page's colour tokens and the site's green as fallback (like the home button).
  ui.innerHTML = "<style>" +
    ".tts{position:fixed;z-index:55;left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));" +
    "display:flex;flex-direction:column;align-items:flex-start;gap:8px;max-width:calc(100vw - 92px);font-family:inherit}" +
    "body:has(#sw-bar) .tts{bottom:calc(max(16px,env(safe-area-inset-bottom)) + 56px)}" +
    ".tts button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".tts svg{width:20px;height:20px;display:block}" +
    ".tts-open{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;padding:0;" +
    "border:1px solid var(--line,#D9E3DB);background:var(--card,#fff);color:var(--accent,#14624A);box-shadow:0 2px 10px rgba(0,0,0,.14)}" +
    ".tts-open:hover{background:var(--accent,#14624A);color:var(--card,#fff);border-color:var(--accent,#14624A)}" +
    ".tts-bar{display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:var(--card,#fff);" +
    "border:1px solid var(--line,#D9E3DB);box-shadow:0 4px 18px rgba(0,0,0,.18)}" +
    ".tts-bar button{width:40px;height:40px;flex:none;border-radius:50%;display:grid;place-items:center;padding:0;border:0;" +
    "background:none;color:var(--ink,#18231C)}" +
    ".tts-bar button:hover{background:var(--accent-soft,#E4EFE7)}" +
    ".tts-bar .tts-play,.tts-bar .tts-play:hover{background:var(--accent,#14624A);color:var(--card,#fff)}" +
    ".tts-bar .tts-rate{width:auto;min-width:48px;padding:0 8px;border-radius:999px;font-size:14px;font-weight:600;color:var(--accent,#14624A)}" +
    ".tts button:focus-visible{outline:2px solid var(--accent,#14624A);outline-offset:2px}" +
    ".tts-msg{margin:0;max-width:300px;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;" +
    "background:var(--ink,#18231C);color:var(--paper,#F5F8F4);box-shadow:0 4px 18px rgba(0,0,0,.2)}" +
    ".tts [hidden]{display:none}" +
    ".tts-on{background:rgba(20,98,74,.12)!important;background:color-mix(in srgb,var(--accent,#14624A) 14%,transparent)!important;" +
    "box-shadow:0 0 0 4px color-mix(in srgb,var(--accent,#14624A) 14%,transparent);border-radius:4px}" +
    "@media print{.tts{display:none}}" +
    "</style>" +
    '<p class="tts-msg" role="status" hidden></p>' +
    '<button class="tts-open" type="button" aria-label="পাতাটি শুনুন" title="পাতাটি শুনুন">' + ICON.listen + "</button>" +
    '<div class="tts-bar" role="group" aria-label="শোনা" hidden>' +
    '<button class="tts-prev" type="button" aria-label="আগের অংশ" title="আগের অংশ">' + ICON.prev + "</button>" +
    '<button class="tts-play" type="button"></button>' +
    '<button class="tts-next" type="button" aria-label="পরের অংশ" title="পরের অংশ">' + ICON.next + "</button>" +
    '<button class="tts-rate" type="button" title="পড়ার গতি"></button>' +
    '<button class="tts-close" type="button" aria-label="বন্ধ করুন" title="বন্ধ করুন">' + ICON.close + "</button>" +
    "</div>";
  document.body.appendChild(ui);
  var $ = function (c) { return ui.querySelector(".tts-" + c); };
  var openBtn = $("open"), bar = $("bar"), playBtn = $("play"), rateBtn = $("rate"), msg = $("msg");

  function render() {
    openBtn.hidden = state !== "off";
    bar.hidden = state === "off";
    var on = state === "on", label = on ? "থামান" : "চালান";
    playBtn.innerHTML = on ? ICON.pause : ICON.play;
    playBtn.setAttribute("aria-label", label);
    playBtn.title = label;
    rateBtn.textContent = bn(rate) + "×";
    rateBtn.setAttribute("aria-label", "পড়ার গতি " + bn(rate) + " গুণ");
  }
  function say(text, ms) {
    clearTimeout(msgTimer);
    msg.textContent = text || "";
    msg.hidden = !text;
    if (text && ms) msgTimer = setTimeout(function () { msg.hidden = true; }, ms);
  }

  /* Highlight the block being read. The page follows along only while the reader does: if they have
     scrolled away from the highlighted block, it is left where it is (unless asked, e.g. on play). */
  function topEdge() {
    var b = document.querySelector(".bar");
    return b && getComputedStyle(b).position === "sticky" ? Math.max(0, b.getBoundingClientRect().bottom) : 0;
  }
  function visible(el) { var r = el.getBoundingClientRect(); return r.bottom > topEdge() && r.top < innerHeight; }
  function mark(s, follow) {
    var following = follow || !lit || visible(lit);
    if (lit) lit.classList.remove("tts-on");
    lit = s.block;
    lit.classList.add("tts-on");
    var r = lit.getBoundingClientRect(), top = topEdge() + 12, bottom = innerHeight - 80;
    if (!following || (r.top >= top && r.bottom <= bottom)) return;
    var by = r.height > bottom - top ? r.top - top : r.top - (top + bottom - r.height) / 2;
    window.scrollBy({ top: by, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function unmark() { if (lit) lit.classList.remove("tts-on"); lit = null; }

  function speak() {
    var p = list[at];
    if (!p) return;
    var v = voiceFor(p.lang), u = new SpeechSynthesisUtterance(p.text), g = ++gen;
    u.lang = v ? v.lang : p.lang === "bn" ? "bn-BD" : "en-US";
    if (v) u.voice = v;
    u.rate = rate;
    u.onstart = function () { if (g === gen) { begun = true; errors = 0; } };
    u.onend = function () { if (g === gen) advance(); };
    u.onerror = function (e) { if (g === gen) failed(e.error, v); };
    utt = u;   // kept, or some browsers drop it before it ends
    begun = false; started = Date.now(); quiet = 0;
    synth.speak(u);
  }
  function advance() {
    retried = false;
    if (++at < list.length) return speak();
    var n = seg && after(seg);
    if (n) load(n, true);
    else stop("পাতা শেষ।");
  }
  // Read segment s (or, when paused, only move there).
  function load(s, go, follow) {
    seg = s; list = speechOf(s); at = 0;
    mark(s, follow);
    if (go) current();
  }
  function current() { if (list.length) speak(); else advance(); }
  function failed(why, v) {
    if (why === "interrupted" || why === "canceled") return;
    if (why === "not-allowed") { pause(); return; }   // the browser wants a tap first
    if (v && broken.indexOf(v) < 0 && /network|synthesis|voice/.test(why || "")) { broken.push(v); return speak(); }
    if (list[at] && list[at].lang === "bn" && noBangla()) { pause(); return say(NO_BANGLA); }
    if (++errors >= 3) { pause(); return say("এই ব্রাউজারে পড়া যাচ্ছে না। Chrome বা Edge-এ খুলে চেষ্টা করুন।"); }
    advance();
  }

  var NO_BANGLA = "এই ব্রাউজারে বাংলা কণ্ঠ নেই। ফোনে: Settings-এ “Text-to-speech” খুঁজে বাংলা (Bengali) ভয়েস নামিয়ে নিন। কম্পিউটারে: Microsoft Edge-এ খুলুন।";

  // The first readable text on screen, below the sticky top bar; the very first one near the top of the page.
  function firstOnScreen() {
    if (window.scrollY < 40) return step(null);
    var top = topEdge() + 4, w = walker(), n, r = document.createRange();
    while ((n = w.nextNode())) {
      r.selectNodeContents(n);
      var box = r.getBoundingClientRect();
      if (box.bottom > top && (box.width || box.height) && readable(n)) return n;
    }
    return null;
  }

  /* Stops what is being said, then runs fn. Safari can drop a new utterance queued right after cancel(), so
     fn waits a moment then; with nothing playing it runs at once, inside the tap (iPhone needs the first
     utterance to start from a tap). */
  var later = 0;
  function hush() { gen++; clearTimeout(later); if (synth.speaking || synth.pending) { synth.cancel(); return true; } return false; }
  function restart(fn) { if (hush()) later = setTimeout(fn, 80); else fn(); }

  function play(from) {
    if (noBangla()) { state = "paused"; render(); return say(NO_BANGLA); }
    var t = from || (seg && root.contains(seg.first) ? null : firstOnScreen());
    if (!t && !seg) return stop();
    state = "on"; render(); say("");
    restart(function () {
      if (t) load(segmentAt(t), true, true);
      else { mark(seg, true); current(); }
    });
  }
  function pause() { state = "paused"; hush(); render(); }
  function stop(text) {
    state = "off"; hush(); unmark(); seg = null; list = [];
    render(); say(text || "", 3000);
  }
  // Moves at once, so quick taps add up; when playing, the new part is said after the same short wait as restart().
  function skip(back) {
    var n = seg && (back ? before(seg) : after(seg));
    if (!n) return;
    var on = state === "on", wait = on && hush();
    load(n, false, true);
    if (wait) later = setTimeout(current, 80);
    else if (on) current();
  }

  openBtn.onclick = function () {
    play(firstOnScreen());
    var hinted = false;
    try { hinted = localStorage.getItem(HINT_KEY) === "1"; localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
    if (!hinted && state === "on") say("যেকোনো লাইনে চাপ দিলে সেখান থেকে পড়বে।", 5000);
  };
  playBtn.onclick = function () { if (state === "on") pause(); else play(); };
  $("prev").onclick = function () { skip(true); };
  $("next").onclick = function () { skip(false); };
  $("close").onclick = function () { stop(); };
  rateBtn.onclick = function () {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    try { localStorage.setItem(RATE_KEY, String(rate)); } catch (e) {}
    render();
    if (state === "on") restart(speak);   // the current piece again, at the new speed
  };

  // While the player is open, a tap on any text reads from there (links, buttons and selecting text work as usual).
  function textAt(x, y, el) {
    var n = null, p;
    if (document.caretPositionFromPoint) { p = document.caretPositionFromPoint(x, y); n = p && p.offsetNode; }
    else if (document.caretRangeFromPoint) { p = document.caretRangeFromPoint(x, y); n = p && p.startContainer; }
    if (n && n.nodeType === 3 && el.contains(n) && readable(n)) return n;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while ((n = w.nextNode())) if (readable(n)) return n;
    return null;
  }
  document.addEventListener("click", function (e) {
    var el = e.target;
    if (state === "off" || e.defaultPrevented || !el.closest || !root.contains(el) ||
        el.closest("a,button,input,select,textarea,label,summary,nav,.bar,.tts")) return;
    var s = window.getSelection && getSelection();
    if (s && !s.isCollapsed) return;
    var t = textAt(e.clientX, e.clientY, el);
    if (t) play(t);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && state !== "off") stop(); });

  // Some browsers miss an "end" event now and then; if nothing is being said for 2 seconds, move on.
  setInterval(function () {
    if (state !== "on" || document.hidden || synth.speaking || synth.pending) { quiet = 0; return; }
    if (++quiet < 2) return;
    quiet = 0;
    if (begun) advance();
    else if (Date.now() - started > 4000) { if (retried) advance(); else { retried = true; speak(); } }
  }, 1000);

  addEventListener("pagehide", function () { synth.cancel(); });
  addEventListener("pageshow", function (e) { if (e.persisted && state === "on") pause(); });
  render();
})();

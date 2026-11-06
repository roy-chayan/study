/* Listen (শুনুন): reads a page aloud with the voices built into the reader's own browser (the Web Speech API),
   so it is free and needs no server. build.py links this file from every page except index.html.
   - The round speaker button at the bottom left reads from the top of the screen, and turns into a small player:
     previous, play/pause, next, speed, close. While the player is open, tapping a line reads from there.
   - Only what is on screen is read: answers that practice mode hides are skipped until they are revealed.
     Exam-tag chips, buttons, links to other pages and the top bar are skipped too.
   - Bangla gets a Bangla voice and English sentences an English voice. Maths symbols are read as words
     (2³ → "২ এর ঘাত ৩"), and forms shown crossed out or with ✗/✓ are announced as "ভুল:" / "ঠিক:".
   - The voices come from the device: Android (Google), Microsoft Edge and others have Bangla ones. Where there
     is none, the player says how to get one.
   - Quiz (কুইজ, the switch above the player on pages with questions): each question and its options are read
     with the answer hidden, a countdown gives time to think, then the answer is said. Tapping an option answers
     and is scored. Settings (thinking time, explanation, shuffle) are kept on the device. */
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
      .replace(/[¼-¾⅐-⅞]/g, " $&")   // ৩৩⅓ → ৩৩ 1/3, not "৩৩1/3"
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

  function speechText(text) {
    var out = [];
    parts(text).forEach(function (p) {
      pieces(speakable(p.t, p.k)).forEach(function (s) { out.push({ lang: p.k, text: s }); });
    });
    return out;
  }
  function speechOf(seg) { return speechText(textOf(seg)); }

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
  var RATES = [1, 1.25, 1.5, 0.75], TIMES = [5, 10, 3];
  var RATE_KEY = "study_listen_rate", HINT_KEY = "study_listen_hint", QUIZ_KEY = "study_quiz", QUIZ_HINT_KEY = "study_quiz_hint";
  var state = "off", mode = "read", seg = null, list = [], at = 0, gen = 0, utt = null, begun = false, started = 0, errors = 0,
      retried = false, quiet = 0, waiting = false, rate = 1, lit = null, msgTimer = 0, gearOpen = false;
  var opts = { time: 5, explain: false, mix: false };   // the quiz settings, kept on the device
  try {
    if (RATES.indexOf(+localStorage.getItem(RATE_KEY)) >= 0) rate = +localStorage.getItem(RATE_KEY);
    var kept = JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}") || {};
    if (TIMES.indexOf(kept.time) >= 0) opts.time = kept.time;
    opts.explain = kept.explain === true;
    opts.mix = kept.mix === true;
  } catch (e) {}
  function keep(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function firstTime(key) { var s = false; try { s = localStorage.getItem(key) === "1"; } catch (e) {} keep(key, "1"); return !s; }
  var QSEL = "article.q,article.ex", hasQuiz = !!root.querySelector(QSEL);

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
    close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    gear: svg('<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>')
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
    ".tts-bar,.tts-card{background:var(--card,#fff);border:1px solid var(--line,#D9E3DB);box-shadow:0 4px 18px rgba(0,0,0,.18)}" +
    ".tts-bar{display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px}" +
    ".tts-bar button{width:40px;height:40px;flex:none;border-radius:50%;display:grid;place-items:center;padding:0;border:0;" +
    "background:none;color:var(--ink,#18231C)}" +
    ".tts-bar button:hover{background:var(--accent-soft,#E4EFE7)}" +
    ".tts-bar .tts-play,.tts-bar .tts-play:hover{background:var(--accent,#14624A);color:var(--card,#fff)}" +
    ".tts-bar .tts-rate{width:auto;min-width:48px;padding:0 8px;border-radius:999px;font-size:14px;font-weight:600;color:var(--accent,#14624A)}" +
    ".tts button:focus-visible{outline:2px solid var(--accent,#14624A);outline-offset:2px}" +
    ".tts-msg{margin:0;max-width:300px;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;" +
    "background:var(--ink,#18231C);color:var(--paper,#F5F8F4);box-shadow:0 4px 18px rgba(0,0,0,.2)}" +
    /* The card above the bar: read / quiz switch, the quiz's progress and countdown, and its settings. */
    ".tts-card{display:flex;flex-direction:column;gap:8px;padding:6px;border-radius:18px;font-size:14px;line-height:1.4;" +
    "color:var(--ink,#18231C);max-width:100%;box-sizing:border-box}" +
    ".tts-row{display:flex;align-items:center;gap:6px}" +
    ".tts-modes{display:flex;padding:3px;border-radius:999px;background:var(--accent-soft,#E4EFE7)}" +
    ".tts-modes button{border:0;background:none;padding:4px 14px;border-radius:999px;font-size:14px;font-weight:600;color:var(--muted,#5B6D61)}" +
    ".tts-modes button[aria-pressed=true]{background:var(--card,#fff);color:var(--accent,#14624A);box-shadow:0 1px 3px rgba(0,0,0,.14)}" +
    ".tts-gear{margin-left:auto;width:34px;height:34px;flex:none;border-radius:50%;border:0;background:none;padding:0;" +
    "display:grid;place-items:center;color:var(--muted,#5B6D61)}" +
    ".tts-gear:hover,.tts-gear[aria-expanded=true]{background:var(--accent-soft,#E4EFE7);color:var(--accent,#14624A)}" +
    ".tts-status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:0 6px 2px}" +
    ".tts-prog{font-weight:600}" +
    ".tts-think{display:flex;align-items:center;gap:8px}" +
    ".tts-ring{position:relative;width:30px;height:30px;flex:none}" +
    ".tts-ring svg{width:30px;height:30px;transform:rotate(-90deg)}" +
    ".tts-ring circle{fill:none;stroke-width:3}" +
    ".tts-ring .tts-track{stroke:var(--line,#D9E3DB)}" +
    ".tts-ring .tts-arc{stroke:var(--accent,#14624A);stroke-dasharray:94.25;stroke-linecap:round}" +
    ".tts-ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:13px}" +
    ".tts-now{border:1px solid var(--accent,#14624A);background:none;color:var(--accent,#14624A);border-radius:999px;" +
    "padding:3px 12px;font-size:13px;font-weight:600}" +
    ".tts-set{display:flex;flex-wrap:wrap;gap:6px;padding:0 2px 2px}" +
    ".tts-set button{border:1px solid var(--line,#D9E3DB);background:none;border-radius:999px;padding:3px 10px;font-size:13px;" +
    "color:var(--ink,#18231C)}" +
    ".tts-set button[aria-pressed=true]{border-color:var(--accent,#14624A);color:var(--accent,#14624A);background:var(--accent-soft,#E4EFE7)}" +
    ".tts [hidden]{display:none}" +
    ".tts-on{background:rgba(20,98,74,.12)!important;background:color-mix(in srgb,var(--accent,#14624A) 14%,transparent)!important;" +
    "box-shadow:0 0 0 4px color-mix(in srgb,var(--accent,#14624A) 14%,transparent);border-radius:4px}" +
    /* Quiz marks on the page: options can be tapped while a question is asked; the tapped one is ringed. */
    ".tts-asking li{cursor:pointer}" +
    ".tts-right,.tts-wrong{outline:2px solid var(--accent,#14624A)!important;outline-offset:2px;border-radius:6px}" +
    ".tts-wrong{outline-color:var(--bad,#C0392B)!important}" +
    "@media print{.tts{display:none}}" +
    "</style>" +
    '<p class="tts-msg" role="status" hidden></p>' +
    '<button class="tts-open" type="button" aria-label="পাতাটি শুনুন" title="পাতাটি শুনুন">' + ICON.listen + "</button>" +
    '<div class="tts-card" hidden>' +
    '<div class="tts-row"><div class="tts-modes" role="group" aria-label="ধরন">' +
    '<button type="button" data-mode="read">শুনুন</button><button type="button" data-mode="quiz">কুইজ</button></div>' +
    '<button class="tts-gear" type="button" aria-label="কুইজের নিয়ম" title="কুইজের নিয়ম">' + ICON.gear + "</button></div>" +
    '<div class="tts-status" aria-live="polite"><span class="tts-prog"></span>' +
    '<span class="tts-think" hidden><span class="tts-ring"><svg viewBox="0 0 36 36" aria-hidden="true">' +
    '<circle class="tts-track" cx="18" cy="18" r="15"/><circle class="tts-arc" cx="18" cy="18" r="15"/></svg><b></b></span>' +
    '<button class="tts-now" type="button">উত্তর দেখাও</button></span></div>' +
    '<div class="tts-set"><button class="tts-time" type="button"></button>' +
    '<button class="tts-exp" type="button"></button><button class="tts-mix" type="button"></button></div>' +
    "</div>" +
    '<div class="tts-bar" role="group" aria-label="শোনা" hidden>' +
    '<button class="tts-prev" type="button"></button>' +
    '<button class="tts-play" type="button"></button>' +
    '<button class="tts-next" type="button"></button>' +
    '<button class="tts-rate" type="button" title="পড়ার গতি"></button>' +
    '<button class="tts-close" type="button" aria-label="বন্ধ করুন" title="বন্ধ করুন">' + ICON.close + "</button>" +
    "</div>";
  document.body.appendChild(ui);
  var $ = function (c) { return ui.querySelector(".tts-" + c); };
  var openBtn = $("open"), bar = $("bar"), playBtn = $("play"), prevBtn = $("prev"), nextBtn = $("next"), rateBtn = $("rate"),
      msg = $("msg"), card = $("card"), gearBtn = $("gear"), statusRow = $("status"), prog = $("prog"), think = $("think"),
      ring = ui.querySelector(".tts-ring b"), arc = $("arc"), setRow = $("set"), timeBtn = $("time"), expBtn = $("exp"),
      mixBtn = $("mix"), modeBtns = [].slice.call(ui.querySelectorAll(".tts-modes button"));

  function render() {
    var on = state === "on", quiz = mode === "quiz", label = on ? "থামান" : "চালান";
    openBtn.hidden = state !== "off";
    bar.hidden = state === "off";
    card.hidden = state === "off" || !hasQuiz;
    playBtn.innerHTML = on ? ICON.pause : ICON.play;
    playBtn.setAttribute("aria-label", label);
    playBtn.title = label;
    prevBtn.innerHTML = ICON.prev;
    nextBtn.innerHTML = ICON.next;
    prevBtn.title = quiz ? "আগের প্রশ্ন" : "আগের অংশ";
    nextBtn.title = quiz ? "পরের প্রশ্ন" : "পরের অংশ";
    prevBtn.setAttribute("aria-label", prevBtn.title);
    nextBtn.setAttribute("aria-label", nextBtn.title);
    rateBtn.textContent = bn(rate) + "×";
    rateBtn.setAttribute("aria-label", "পড়ার গতি " + bn(rate) + " গুণ");
    modeBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode)); });
    gearBtn.hidden = !quiz;
    gearBtn.setAttribute("aria-expanded", String(gearOpen));
    statusRow.hidden = !quiz || !Q;
    setRow.hidden = !quiz || !gearOpen;
    if (Q) prog.textContent = Q.phase === "done"
      ? "শেষ! " + (Q.answered ? "ঠিক " + bn(Q.right) + "/" + bn(Q.answered) + " · " : "") + bn(Q.asked) + "টি প্রশ্ন"
      : "প্রশ্ন " + bn(Q.i + 1) + "/" + bn(Q.list.length) + (Q.answered ? " · ঠিক " + bn(Q.right) + "/" + bn(Q.answered) : "");
    timeBtn.textContent = "ভাবার সময়: " + bn(opts.time) + " সে.";
    expBtn.textContent = "ব্যাখ্যা: " + (opts.explain ? "চালু" : "বন্ধ");
    mixBtn.textContent = "এলোমেলো: " + (opts.mix ? "চালু" : "বন্ধ");
    expBtn.setAttribute("aria-pressed", String(opts.explain));
    mixBtn.setAttribute("aria-pressed", String(opts.mix));
    keepAwake(on);
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
  // Scrolls el into the space between the top bar and the player (its top, if it is taller than that).
  function fit(el) {
    var r = el.getBoundingClientRect(), top = topEdge() + 12, bottom = innerHeight - 80;
    if (state !== "off") { var p = ui.getBoundingClientRect().top - 12; if (p - top > 160) bottom = Math.min(bottom, p); }
    if (r.top >= top && r.bottom <= bottom) return;
    var by = r.height > bottom - top ? r.top - top : r.top - (top + bottom - r.height) / 2;
    // A long jump (e.g. from the top of a note to its exercises) is made at once, not as a long glide.
    var glide = Math.abs(by) < innerHeight * 2 && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollBy({ top: by, behavior: glide ? "smooth" : "auto" });
  }
  // follow: true scrolls to it, false never does, unset follows only if the last highlight was on screen.
  function mark(s, follow) {
    var following = follow === true || (follow !== false && (!lit || visible(lit)));
    if (lit) lit.classList.remove("tts-on");
    lit = s.block;
    lit.classList.add("tts-on");
    if (following) fit(lit);
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
    begun = false; started = Date.now(); quiet = 0; waiting = false;
    synth.speak(u);
  }
  function advance() {
    retried = false;
    if (++at < list.length) return speak();
    if (mode === "quiz") return quizNext();
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
    if (mode === "quiz") { state = "on"; render(); say(""); return quizResume(); }
    var t = from || (seg && root.contains(seg.first) ? null : firstOnScreen());
    if (!t && !seg) return stop();
    state = "on"; render(); say("");
    restart(function () {
      if (t) load(segmentAt(t), true, true);
      else { mark(seg, true); current(); }
    });
  }
  function pause() {
    state = "paused"; hush(); waiting = false;
    if (Q) { clearQ(); think.hidden = true; }
    render();
  }
  function stop(text) {
    state = "off"; hush(); quizStop(); unmark(); seg = null; list = [];
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

  /* ---- Quiz ------------------------------------------------------------------------------------
     Each question in turn: its text and options are read with the answer hidden ("ask"), a countdown
     gives time to think ("think"), then the answer is shown and said ("answer"), with the explanation
     if that setting is on ("explain"), and a short pause ("gap") before the next. Tapping an option
     answers at once and is scored. Answers are hidden with the page's own practice mode, which the
     quiz turns on and, when it ends, back off. */
  var Q = null, pageMode = document.getElementById("mode"), turnedOn = false, audio = null, lock = null, locking = false;

  function questions() { return [].slice.call(root.querySelectorAll(QSEL)).filter(function (a) { return shown(a); }); }
  function firstQuestionOnScreen(all) {
    if (window.scrollY < 40) return 0;
    var top = topEdge() + 4;
    for (var i = 0; i < all.length; i++) if (all[i].getBoundingClientRect().bottom > top) return i;
    return 0;
  }
  // From the start question to the end of the page; shuffled ("এলোমেলো"): the start question, then all the rest at random.
  function order(all, start) {
    if (!opts.mix) return all.slice(start);
    var rest = all.filter(function (a, i) { return i !== start; });
    for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = rest[i]; rest[i] = rest[j]; rest[j] = x; }
    return [all[start]].concat(rest);
  }
  function segmentsIn(el, skip) {
    var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (!readable(n)) continue;
      var s = segmentAt(n);
      if (!(skip && skip.contains(s.block))) out.push(s);
      if (el.contains(s.last)) w.currentNode = s.last;
    }
    return out;
  }
  function firstSeg(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (readable(n)) return segmentAt(n);
    return null;
  }
  function answerLine(art) { return art.querySelector(".ans-line,.sol .ans"); }
  function okOptions(art) {
    return [].slice.call(art.querySelectorAll("li.ok")).filter(function (li) { return !li.closest(".ans,.sol"); });
  }
  // "উত্তর: গ, ৩.৩২ কি.মি." from the correct option(s); without one, the page's own answer line.
  function answerText(art) {
    var said = okOptions(art).map(function (li) {
      var s = firstSeg(li), t = s ? textOf(s) : "", i = t.indexOf(BREAK), rest = t.slice(i + 1);
      // An English option after the Bangla letter keeps its English voice.
      return i < 0 ? t : t.slice(0, i) + BREAK + (EN_L.test(rest) && !BN_L.test(rest) ? EN : "") + rest;
    }).filter(Boolean);
    if (said.length) return "উত্তর: " + said.join(" অথবা ");
    var line = answerLine(art), s = line && firstSeg(line), t = s ? textOf(s).replace(/^\s*উত্তর[\s:।]*/, "") : "";
    return t ? "উত্তর: " + t : "";
  }
  function explanation(art) {
    var area = art.querySelector(".ans,.sol");
    return area ? segmentsIn(area, answerLine(art)) : [];
  }
  function practice(on) {
    if (!pageMode) return;
    var isOn = document.body.classList.contains("practice");
    if (on && !isOn) { pageMode.click(); turnedOn = true; }
    else if (!on && turnedOn) { if (isOn) pageMode.click(); turnedOn = false; }
  }
  function clearQ() { if (Q) { clearInterval(Q.timer); clearTimeout(Q.timer); } }
  function clearMarks() {
    [].forEach.call(document.querySelectorAll(".tts-right,.tts-wrong,.tts-asking"), function (x) {
      x.classList.remove("tts-right", "tts-wrong", "tts-asking");
    });
  }

  // A soft tick each second of the countdown, made by the browser (no sound file).
  function unlockAudio() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch (e) { audio = null; }
  }
  function tick() {
    if (!audio) return;
    try {
      var t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + 0.15);
    } catch (e) {}
  }
  // While reading or quizzing, the screen stays on: most phones stop speaking when the screen locks.
  function keepAwake(on) {
    try {
      if (on && !lock && !locking && navigator.wakeLock && document.visibilityState === "visible") {
        locking = true;
        navigator.wakeLock.request("screen").then(function (l) {
          locking = false; lock = l;
          l.addEventListener("release", function () { if (lock === l) lock = null; });
          if (state !== "on") { lock = null; l.release(); }
        }, function () { locking = false; });
      } else if (!on && lock) { var l = lock; lock = null; l.release(); }
    } catch (e) { locking = false; }
  }

  function quizStart(art) {
    var all = questions();
    if (!all.length) return stop();
    clearMarks();
    var start = art ? all.indexOf(art) : firstQuestionOnScreen(all);
    Q = { list: order(all, start < 0 ? 0 : start), i: 0, phase: "", segs: [], si: -1, right: 0, answered: 0, asked: 0, timer: 0 };
    unlockAudio();
    if (firstTime(QUIZ_HINT_KEY)) say("অপশনে চাপ দিয়ে উত্তর দিন। না দিলে সময় শেষে উত্তর বলে দেবে।", 6000);
    render();
    restart(quizAsk);
  }
  function quizAsk() {
    var art = Q.list[Q.i];
    practice(true);
    art.classList.remove("shown");
    art.classList.add("tts-asking");
    [].forEach.call(art.querySelectorAll(".tts-right,.tts-wrong"), function (x) { x.classList.remove("tts-right", "tts-wrong"); });
    Q.phase = "ask"; Q.segs = segmentsIn(art); Q.si = -1;
    render();
    fit(art);
    if (state === "on") quizNext();
    else if (Q.segs[0]) { seg = Q.segs[0]; list = []; at = 0; mark(seg, false); }
  }
  // Called whenever a piece of speech ends in quiz mode: the next segment, or the next step.
  function quizNext() {
    if (!Q || state !== "on") return;
    var p = Q.phase;
    if (p === "ask" || p === "explain") {
      if (++Q.si < Q.segs.length) return load(Q.segs[Q.si], true, p === "ask" ? false : undefined);
      return p === "ask" ? quizThink() : quizGap();
    }
    if (p === "answer") {
      if (!opts.explain) return quizGap();
      Q.phase = "explain"; Q.segs = explanation(Q.list[Q.i]); Q.si = -1;
      return quizNext();
    }
    if (p === "done") { state = "paused"; render(); }
  }
  function quizThink() {
    var left = opts.time;
    Q.phase = "think"; waiting = true;
    think.hidden = false;
    ring.textContent = bn(left);
    arc.style.transition = "none";
    arc.style.strokeDashoffset = "0";
    arc.getBoundingClientRect();
    arc.style.transition = "stroke-dashoffset " + left + "s linear";
    arc.style.strokeDashoffset = "94.25";
    tick();
    clearQ();
    Q.timer = setInterval(function () {
      if (--left > 0) { ring.textContent = bn(left); tick(); return; }
      quizReveal(null);
    }, 1000);
  }
  // Shows and says the answer; pick is the option tapped (or null when the time ran out or "উত্তর দেখাও").
  function quizReveal(pick) {
    if (!Q || (Q.phase !== "ask" && Q.phase !== "think")) return;
    clearQ(); waiting = false; think.hidden = true;
    var art = Q.list[Q.i], ok = okOptions(art), text = "";
    art.classList.add("shown");
    art.classList.remove("tts-asking");
    Q.asked++;
    if (pick) {
      var right = pick.classList.contains("ok");
      Q.answered++;
      if (right) Q.right++;
      pick.classList.add(right ? "tts-right" : "tts-wrong");
      text = right ? "ঠিক! " : "হয়নি। ";
    }
    text += answerText(art);
    Q.phase = "answer";
    render();
    var show = ok[0] || answerLine(art);
    restart(function () {
      list = speechText(text); at = 0;
      if (show) mark({ block: show }, true);
      if (state === "on") current();
    });
  }
  function quizGap() {
    Q.phase = "gap"; waiting = true;
    clearQ();
    Q.timer = setTimeout(function () { quizGo(Q.i + 1); }, 900);
  }
  function quizGo(i) {
    if (!Q) return;
    clearQ(); waiting = false; think.hidden = true;
    var art = Q.list[Q.i];
    if (art) art.classList.remove("tts-asking");
    if (i >= Q.list.length) return restart(quizDone);
    Q.i = Math.max(0, i);
    if (state === "on") restart(quizAsk);
    else { hush(); quizAsk(); }
  }
  function quizDone() {
    Q.phase = "done";
    practice(false);
    unmark();
    render();
    list = speechText(Q.answered ? "কুইজ শেষ। " + bn(Q.answered) + "টির মধ্যে " + bn(Q.right) + "টি ঠিক।" : "কুইজ শেষ।");
    at = 0;
    if (state === "on") current();
  }
  function quizResume() {
    if (!Q) return quizStart(null);
    if (Q.phase === "done") return quizStart(questions()[0]);
    var p = Q.phase;
    if (p === "think") return restart(quizThink);
    if (p === "gap") return quizGo(Q.i + 1);
    if (p === "ask" && Q.si < 0) return restart(quizNext);
    restart(function () { if (lit) mark({ block: lit }, true); current(); });
  }
  function quizStop() {
    if (!Q) return;
    clearQ(); waiting = false; think.hidden = true;
    Q = null;
    practice(false);
    clearMarks();
  }
  // In quiz mode a tap on an option of the question being asked answers it; a tap on another question goes there.
  function quizTap(el) {
    var art = el.closest(QSEL), now = Q.list[Q.i];
    if (!art) return;
    if (art === now) {
      if (Q.phase !== "ask" && Q.phase !== "think") return;
      var li = el.closest(".reveal") ? null : el.closest("li");
      if (li === null && !el.closest(".reveal")) return;
      if (li && (li.closest(".ans,.sol") || el.closest("a"))) return;
      if (state !== "on") { state = "on"; render(); }
      return quizReveal(li);
    }
    if (el.closest("a,button")) return;
    var s = window.getSelection && getSelection();
    if (s && !s.isCollapsed) return;
    var i = Q.list.indexOf(art);
    if (i < 0) { var all = questions(); Q.list = order(all, Math.max(0, all.indexOf(art))); i = 0; }
    state = "on"; render(); say("");
    quizGo(i);
  }
  function setMode(m) {
    if (m === mode) return;
    var art = (Q && Q.list[Q.i]) || (lit && lit.closest(QSEL)) || null;
    quizStop();
    mode = m; gearOpen = false; seg = null; list = [];
    if (noBangla()) { state = "paused"; render(); return say(NO_BANGLA); }
    state = "on"; render(); say("");
    if (m === "quiz") return quizStart(art);
    var first = art && firstSeg(art);
    play(first ? first.first : firstOnScreen());
  }

  openBtn.onclick = function () {
    play(mode === "quiz" ? null : firstOnScreen());
    if (mode === "read" && state === "on" && firstTime(HINT_KEY)) say("যেকোনো লাইনে চাপ দিলে সেখান থেকে পড়বে।", 5000);
  };
  playBtn.onclick = function () { if (state === "on") pause(); else play(); };
  prevBtn.onclick = function () { if (mode === "quiz" && Q) quizGo(Q.phase === "done" ? Q.i : Q.i - 1); else skip(true); };
  nextBtn.onclick = function () { if (mode === "quiz" && Q) { if (Q.phase !== "done") quizGo(Q.i + 1); } else skip(false); };
  $("close").onclick = function () { stop(); };
  $("now").onclick = function () { if (state !== "on") { state = "on"; render(); } quizReveal(null); };
  rateBtn.onclick = function () {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    keep(RATE_KEY, String(rate));
    render();
    if (state === "on" && !waiting) restart(speak);   // the current piece again, at the new speed
  };
  modeBtns.forEach(function (b) { b.onclick = function () { setMode(b.getAttribute("data-mode")); }; });
  gearBtn.onclick = function () { gearOpen = !gearOpen; render(); };
  function saveOpts() { keep(QUIZ_KEY, JSON.stringify(opts)); render(); }
  timeBtn.onclick = function () { opts.time = TIMES[(TIMES.indexOf(opts.time) + 1) % TIMES.length]; saveOpts(); };
  expBtn.onclick = function () { opts.explain = !opts.explain; saveOpts(); };
  mixBtn.onclick = function () {
    opts.mix = !opts.mix;
    if (Q && Q.phase !== "done") {   // the question being asked stays; the rest follow the new order
      var all = questions(), now = all.indexOf(Q.list[Q.i]);
      Q.list = order(all, now < 0 ? 0 : now); Q.i = 0;
    }
    saveOpts();
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
    if (state === "off" || e.defaultPrevented || !el.closest || !root.contains(el)) return;
    if (mode === "quiz" && Q) return quizTap(el);
    if (el.closest("a,button,input,select,textarea,label,summary,nav,.bar,.tts")) return;
    var s = window.getSelection && getSelection();
    if (s && !s.isCollapsed) return;
    var t = textAt(e.clientX, e.clientY, el);
    if (t) play(t);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && state !== "off") stop(); });

  // Some browsers miss an "end" event now and then; if nothing is being said for 2 seconds, move on.
  setInterval(function () {
    if (state !== "on" || waiting || document.hidden || synth.speaking || synth.pending) { quiet = 0; return; }
    if (++quiet < 2) return;
    quiet = 0;
    if (begun) advance();
    else if (Date.now() - started > 4000) { if (retried) advance(); else { retried = true; speak(); } }
  }, 1000);

  document.addEventListener("visibilitychange", function () { if (!document.hidden) keepAwake(state === "on"); });
  // Leaving the page ends a quiz, so the page's practice mode is not left on for next time.
  addEventListener("pagehide", function () { synth.cancel(); if (Q) stop(); });
  addEventListener("pageshow", function (e) { if (e.persisted && state === "on") pause(); });
  render();
})();

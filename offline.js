/* Offline and install support. build.py links this file from every page.
   - Starts sw.js, which keeps the whole site on the device.
   - On index.html: shows whether the site is saved for reading without internet (#offline-state)
     and offers to install it like an app (#install).
   - On any page: offers a "Refresh" when a newer version of that page has just been saved. */
(function () {
  if (location.protocol === "file:" || !("serviceWorker" in navigator)) return;
  var sw = navigator.serviceWorker, root = new URL(".", document.currentScript.src).href;
  var state = document.getElementById("offline-state"), install = document.getElementById("install");
  var saving = null, failed = false, prompt = null, HIDE = "study_install_hidden";

  function bn(n) { return String(n).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); }
  // Same address rules as sw.js: no ?… or #…, "/" means index.html, "%2C" and "," are the same.
  function keyFor(url) {
    var u = new URL(url);
    u.search = ""; u.hash = "";
    if (u.pathname.slice(-1) === "/") u.pathname += "index.html";
    try { u.pathname = decodeURIComponent(u.pathname); } catch (e) {}
    return u.href;
  }

  function showState() {
    if (!state) return;
    var text = !navigator.onLine ? "অফলাইন — ফোনে রাখা কপি দেখাচ্ছে"
      : saving ? "অফলাইনের জন্য রাখা হচ্ছে…" + (saving.total ? " " + bn(saving.done) + "/" + bn(saving.total) : "")
      : failed ? "সব পাতা রাখা যায়নি — পরের বার আবার চেষ্টা হবে"
      : sw.controller ? "✓ ইন্টারনেট ছাড়াও পড়া যাবে" : "";
    state.textContent = text;
    state.hidden = !text;
    state.classList.toggle("off", !navigator.onLine || (failed && !saving));
  }

  function showUpdate() {
    if (document.getElementById("sw-bar")) return;
    var bar = document.createElement("div");
    bar.id = "sw-bar";
    bar.setAttribute("role", "status");
    // Its own styles, with the page's colours and the site's green as fallback (like the home button).
    bar.innerHTML = "<style>#sw-bar{position:fixed;z-index:60;left:50%;transform:translateX(-50%);" +
      "bottom:max(16px,env(safe-area-inset-bottom));max-width:calc(100% - 136px);display:flex;align-items:center;gap:12px;" +
      "padding:8px 8px 8px 16px;border-radius:999px;background:var(--ink,#18231C);color:var(--paper,#F5F8F4);" +
      "font-family:inherit;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.2)}#sw-bar span{white-space:nowrap}" +
      "#sw-bar button{font:inherit;font-weight:600;border:0;border-radius:999px;padding:5px 14px;cursor:pointer;" +
      "color:var(--paper,#fff);background:var(--accent,#14624A);white-space:nowrap}</style>" +
      "<span>নতুন সংস্করণ এসেছে</span><button type=\"button\">রিফ্রেশ</button>";
    bar.querySelector("button").onclick = function () { location.reload(); };
    document.body.appendChild(bar);
  }

  sw.onmessage = function (e) {
    var d = e.data || {};
    if (d.type === "progress") { saving = d; failed = false; }
    else if (d.type === "saved") saving = null;
    else if (d.type === "failed") { saving = null; failed = true; }
    else if (d.type === "updated" && d.files.indexOf(keyFor(location.href)) >= 0) showUpdate();
    showState();
  };
  sw.addEventListener("controllerchange", showState);
  addEventListener("online", showState);
  addEventListener("offline", showState);
  sw.register(root + "sw.js").then(function (reg) {
    if (!sw.controller && reg.installing && !saving) { saving = { done: 0, total: 0 }; showState(); }
  }).catch(function () {});
  showState();

  /* Install offer, on index.html only. Android Chrome lets the page show its own button;
     on iPhone, Safari's Share menu is the only way, so the card says how. */
  if (!install) return;
  function hidden() { try { return localStorage.getItem(HIDE) === "1"; } catch (e) { return false; } }
  function hide() { try { localStorage.setItem(HIDE, "1"); } catch (e) {} }
  var standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function showInstall() {
    var on = !standalone && !hidden() && !!(prompt || ios);
    install.hidden = !on;
    if (!on) return;
    install.querySelector(".install-hint").textContent = prompt
      ? "হোম স্ক্রিন থেকে এক চাপে খুলবে, ইন্টারনেট ছাড়াও।"
      : "Safari-তে Share বোতাম চাপুন, তারপর “Add to Home Screen”। হোম স্ক্রিন থেকে এক চাপে খুলবে, ইন্টারনেট ছাড়াও।";
    install.querySelector(".install-go").hidden = !prompt;
  }
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); prompt = e; showInstall(); });
  addEventListener("appinstalled", function () { prompt = null; hide(); showInstall(); });
  install.querySelector(".install-go").onclick = function () {
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice.then(function (c) { if (c.outcome === "accepted") hide(); prompt = null; showInstall(); });
  };
  install.querySelector(".install-later").onclick = function () { hide(); showInstall(); };
  showInstall();
})();

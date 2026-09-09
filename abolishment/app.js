const UNLOCK_KEY = "king.unlock.v1";
const B = window.KING_META;
const cache = {};

function unlocked() {
  try {
    return localStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function unlock() {
  try {
    localStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    /* quota */
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}

function mdToHtml(md) {
  const parts = md.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return parts
    .map((raw) => {
      const chunk = raw.trim();
      if (!chunk) return "";
      if (chunk.startsWith("# ")) return `<h1>${esc(chunk.slice(2).trim())}</h1>`;
      if (chunk.startsWith("## ")) return `<h2>${esc(chunk.slice(3).trim())}</h2>`;
      if (chunk.startsWith("### ")) return `<h3>${esc(chunk.slice(4).trim())}</h3>`;
      if (chunk.startsWith(">")) {
        const t = chunk
          .split("\n")
          .map((l) => l.replace(/^>\s?/, ""))
          .join(" ")
          .trim();
        return `<blockquote>${esc(t)}</blockquote>`;
      }
      return `<p>${esc(chunk.replace(/\n/g, " "))}</p>`;
    })
    .join("");
}

async function loadChapter(slug) {
  if (cache[slug]) return cache[slug];
  const r = await fetch(`./book/${slug}.md`);
  const t = await r.text();
  cache[slug] = t;
  return t;
}

function sampleFront(md) {
  return md.split(/\n## Preface\n/)[0].trim();
}

function venmoWeb() {
  const note = encodeURIComponent(B.note);
  return `https://account.venmo.com/pay?audience=private&amount=${B.price}&note=${note}&recipients=${encodeURIComponent(B.venmo)}`;
}

function venmoApp() {
  return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(B.venmo)}&amount=${B.price}&note=${encodeURIComponent(B.note)}`;
}

function coverImg() {
  return "./cover.jpg";
}
function wideImg() {
  return "./cover-wide.jpg";
}

function route() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.replace(/^\//, "").split("/");
  const page = parts[0] || "";
  const slug = parts[1] || "front";
  if (page === "buy") return { page: "buy" };
  if (page === "read") return { page: "read", slug };
  return { page: "cover" };
}

function nav(active) {
  const items = [
    ["#/", "Cover", active === "cover"],
    ["#/read/front", "Read", active === "read"],
    ["#/buy", "Buy", active === "buy"],
  ];
  return items
    .map(
      ([href, label, on]) =>
        `<a href="${href}" class="${on ? "on" : ""}">${label}</a>`,
    )
    .join("");
}

function cover() {
  return `
    <section class="hero">
      <img class="bleed" src="${wideImg()}" alt="">
      <div class="veil"></div>
      <div class="hero-grid">
        <img class="jacket" src="${coverImg()}" alt="Jacket. A United States flag before the White House at night.">
        <div>
          <p class="kicker">${esc(B.subtitle)} · $${esc(B.price)}</p>
          <h1>${esc(B.title)}</h1>
          <p class="author">${esc(B.author)}</p>
          <p class="blurb">${esc(B.blurb)}</p>
          <blockquote class="epi">${esc(B.epigraph)}<cite>${esc(B.epigraphBy)}</cite></blockquote>
          <div class="row">
            <a class="btn" href="#/buy">${esc(B.cta)} · $${esc(B.price)}</a>
            <a class="btn ghost" href="#/read/front">Free sample</a>
          </div>
        </div>
      </div>
    </section>
    <section class="pad">
      <h2>Contents</h2>
      <ol class="toc">
        ${B.toc
          .map(
            (t, i) =>
              `<li><a href="#/read/${t.slug}"><span>${String(i).padStart(2, "0")}</span> ${esc(t.title)}</a>${t.sample ? "<em>Sample</em>" : ""}</li>`,
          )
          .join("")}
      </ol>
      <p class="fine">Not a call to violence. A political critique. Sample is the Author's Note.</p>
    </section>`;
}

function buy() {
  return `
    <section class="pad narrow">
      <p class="kicker">Digital edition · $${esc(B.price)}</p>
      <h1>${esc(B.cta)}</h1>
      <ol class="steps">
        <li><b>1</b><span>Pay $${esc(B.price)} to Venmo @${esc(B.venmo)}. The link fills amount and note.</span></li>
        <li><b>2</b><span>Note must read ${esc(B.note)} so the copy can be found.</span></li>
        <li><b>3</b><span>Come back here. Tap I paid. Unlock this device. Full book is in Read.</span></li>
      </ol>
      <div class="card buycard">
        <img src="${coverImg()}" alt="">
        <div>
          <p class="author">${esc(B.author)}</p>
          <p>${esc(B.title)}</p>
          <p class="mono">Venmo @${esc(B.venmo)} · $${esc(B.price)} · ${esc(B.note)}</p>
          <div class="row">
            <a class="btn" href="${venmoApp()}">Pay in Venmo app</a>
            <a class="btn ghost" href="${venmoWeb()}" target="_blank" rel="noreferrer">Pay in browser</a>
            <button class="btn ghost" type="button" id="copy-note">Copy note</button>
          </div>
        </div>
      </div>
      ${
        unlocked()
          ? `<p class="ok">This device is unlocked.</p><a class="btn" href="#/read/front">Open the book</a>`
          : `<button class="btn wide" id="unlock">I paid · unlock the book</button>`
      }
      <p class="fine">Not a call to violence. A political critique.</p>
    </section>`;
}

async function readView(slug) {
  const item = B.toc.find((t) => t.slug === slug) || B.toc[0];
  const full = unlocked();
  let md = await loadChapter(item.slug);
  let gated = false;
  if (!full) {
    if (item.slug === "front") md = sampleFront(md);
    else {
      const paras = md.split(/\n{2,}/).filter((p) => p.trim());
      md = paras.slice(0, 2).join("\n\n");
    }
    gated = true;
  }
  const idx = B.toc.findIndex((t) => t.slug === item.slug);
  const prev = B.toc[idx - 1];
  const next = B.toc[idx + 1];
  return `
    <section class="paper">
      <aside>
        ${B.toc
          .map(
            (t) =>
              `<a href="#/read/${t.slug}" class="${t.slug === item.slug ? "on" : ""}">${esc(t.title)}</a>`,
          )
          .join("")}
      </aside>
      <article>
        ${mdToHtml(md)}
        ${
          gated
            ? `<div class="gate"><p>${esc(B.cta)}</p><p>Sample ends here. $${esc(B.price)} on Venmo.</p><a class="btn" href="#/buy">${esc(B.cta)} · $${esc(B.price)}</a></div>`
            : ""
        }
        <nav class="turn">
          ${prev ? `<a href="#/read/${prev.slug}">← ${esc(prev.title)}</a>` : "<span></span>"}
          ${next ? `<a href="#/read/${next.slug}">${esc(next.title)} →</a>` : "<span></span>"}
        </nav>
      </article>
    </section>`;
}

async function render() {
  const r = route();
  document.getElementById("nav").innerHTML = nav(r.page);
  const main = document.getElementById("main");
  if (r.page === "buy") main.innerHTML = buy();
  else if (r.page === "read") main.innerHTML = await readView(r.slug);
  else main.innerHTML = cover();
  const u = document.getElementById("unlock");
  if (u) {
    u.onclick = () => {
      unlock();
      location.hash = "#/read/front";
      render();
    };
  }
  const copy = document.getElementById("copy-note");
  if (copy) {
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(B.note);
        copy.textContent = "Copied";
      } catch {
        copy.textContent = B.note;
      }
    };
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();

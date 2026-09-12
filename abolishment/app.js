const UNLOCK_KEY = "king.unlock.v1";
const B = window.BOOK_META;
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
    ["#/", "Book", active === "cover"],
    ["#/read/front", "Sample", active === "read"],
    ["#/buy", "Buy", active === "buy"],
  ];
  return items
    .map(
      ([href, label, on]) =>
        `<a href="${href}" class="${on ? "on" : ""}">${label}</a>`,
    )
    .join("");
}

function buyButtons() {
  return `
    <div class="row">
      <a class="btn" href="${esc(B.payhip)}" target="_blank" rel="noreferrer">${esc(B.cta)} · $${esc(B.price)}</a>
      <a class="btn ghost" href="#/read/front">Free sample</a>
    </div>`;
}

function cover() {
  return `
    <section class="hero">
      <img class="bleed" src="${wideImg()}" alt="">
      <div class="veil"></div>
      <div class="hero-grid">
        <img class="jacket" src="${coverImg()}" alt="Book cover. A United States flag before the White House at night.">
        <div>
          <p class="kicker">${esc(B.subtitle)} · $${esc(B.price)}</p>
          <p class="headline">${esc(B.headline)}</p>
          <h1>${esc(B.title)}</h1>
          <p class="author">${esc(B.author)}</p>
          <p class="blurb">${esc(B.blurb)}</p>
          <blockquote class="epi">${esc(B.epigraph)}<cite>${esc(B.epigraphBy)}</cite></blockquote>
          ${buyButtons()}
        </div>
      </div>
    </section>
    <section class="pad split">
      <div>
        <h2>Who it is for</h2>
        <p class="blurb">${esc(B.who)}</p>
      </div>
      <div>
        <h2>What you get</h2>
        <p class="blurb">${esc(B.what)}</p>
        <p class="fine">${esc(B.stance)} Instant download on Payhip.</p>
      </div>
    </section>
    <section class="pad buy-strip">
      ${buyButtons()}
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
      <p class="fine">Sample is the Author's Note and the opening of Chapter 1. The rest unlocks after payment.</p>
      ${buyButtons()}
    </section>`;
}

function venmoWeb() {
  const note = encodeURIComponent(B.note);
  return `https://account.venmo.com/pay?audience=private&amount=${B.price}&note=${note}&recipients=${encodeURIComponent(B.venmo)}`;
}

function venmoApp() {
  return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(B.venmo)}&amount=${B.price}&note=${encodeURIComponent(B.note)}`;
}

function buy() {
  return `
    <section class="pad narrow">
      <p class="kicker">Digital edition · $${esc(B.price)}</p>
      <h1>${esc(B.cta)}</h1>
      <ol class="steps">
        <li><b>1</b><span>Pay $${esc(B.price)} on Payhip. Card or PayPal. The file downloads to you.</span></li>
        <li><b>2</b><span>Want to read it here too? Come back and tap I paid. Unlock this device.</span></li>
        <li><b>3</b><span>Venmo still works: @${esc(B.venmo)}, note ${esc(B.note)}.</span></li>
      </ol>
      <div class="card buycard">
        <img src="${coverImg()}" alt="">
        <div>
          <p class="author">${esc(B.author)}</p>
          <p>${esc(B.title)}</p>
          <p class="mono">Payhip · $${esc(B.price)} · instant download</p>
          <div class="row">
            <a class="btn" href="${esc(B.payhip)}" target="_blank" rel="noreferrer">Buy on Payhip · $${esc(B.price)}</a>
            <a class="btn ghost" href="${esc(B.payhipPage)}" target="_blank" rel="noreferrer">Product page</a>
          </div>
          <div class="row">
            <a class="btn ghost" href="${venmoApp()}">Venmo app</a>
            <a class="btn ghost" href="${venmoWeb()}" target="_blank" rel="noreferrer">Venmo browser</a>
            <button class="btn ghost" type="button" id="copy-note">Copy note</button>
          </div>
        </div>
      </div>
      ${
        unlocked()
          ? `<p class="ok">This device is unlocked.</p><a class="btn" href="#/read/front">Open the book</a>`
          : `<button class="btn wide" id="unlock">I paid · unlock on this device</button>`
      }
      <p class="fine">Digital edition. Instant download on Payhip. ${esc(B.stance)}</p>
    </section>`;
}

async function readView(slug) {
  const item = B.toc.find((t) => t.slug === slug) || B.toc[0];
  const full = unlocked();
  let md = await loadChapter(item.slug);
  let gated = false;
  if (!full) {
    if (item.slug === "front") {
      md = sampleFront(md);
      try {
        const ch1 = await loadChapter("ch1");
        const paras = ch1
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .slice(0, 3)
          .join("\n\n");
        md = `${md}\n\n## From Chapter 1\n\n${paras}`;
      } catch {
        /* missing chapter file */
      }
    } else {
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
            ? `<div class="gate"><p>${esc(B.cta)}</p><p>Sample ends here. $${esc(B.price)} on Payhip. Instant download.</p><a class="btn" href="${esc(B.payhip)}" target="_blank" rel="noreferrer">${esc(B.cta)} · $${esc(B.price)}</a></div>`
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

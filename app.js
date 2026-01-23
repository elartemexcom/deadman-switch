// === CONFIG: change these only ===
const BASE = "images/";
const PREFIX = "100";     // "5 (n).ext"
const MAX = 44;         // <-- change this number anytime

// What we will try for each number.
// These are the common web-friendly formats that GitHub Pages will happily host.
const EXTS = [
  // Images (still + animated)
  "png",   // also covers APNG if your PNG is animated
  "jpg",
  "jpeg",
  "gif",
  "webp",  // can be animated too
  "avif",
  "svg",
  "bmp",   // supported by browsers, but usually huge

  // Video / motion
  "mp4",
  "webm",
  "ogv"    // Ogg/Theora video (less common, but web-native)
];

// If you ever add audio too, you can include: "mp3", "wav", "ogg", "m4a"
// But your current UI is "gallery", so we keep it images + video for now.

// Performance: how many existence-checks to run at once
const CONCURRENCY = 10;

// ====== UI refs ======
const grid = document.getElementById("grid");
const q = document.getElementById("q");
const empty = document.getElementById("empty");
const countPill = document.getElementById("countPill");

const lightbox = document.getElementById("lightbox");
const lbTitle = document.getElementById("lbTitle");
const lbOpen = document.getElementById("lbOpen");
const lbClose = document.getElementById("lbClose");

// We'll swap between these dynamically:
let lbImg = null;
let lbVid = null;

function filenameFromPath(p){
  return p.split("/").pop();
}

function isVideo(src){
  return /\.(mp4|webm|ogv)$/i.test(src);
}
function isImage(src){
  return /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(src);
}

// ====== Lightbox content mount ======
function ensureLightboxMediaNodes(){
  // Create once, reuse
  const body = lightbox.querySelector(".lb-body");

  if(!lbImg){
    lbImg = document.createElement("img");
    lbImg.id = "lbImg";
    lbImg.alt = "";
    body.appendChild(lbImg);
  }
  if(!lbVid){
    lbVid = document.createElement("video");
    lbVid.id = "lbVid";
    lbVid.controls = true;
    lbVid.playsInline = true;
    lbVid.preload = "metadata";
    body.appendChild(lbVid);
  }
}

function openLightbox(src){
  ensureLightboxMediaNodes();

  const name = filenameFromPath(src);
  lbTitle.textContent = name;
  lbOpen.href = src;

  // Show the right element
  if(isVideo(src)){
    lbImg.style.display = "none";
    lbVid.style.display = "block";
    lbVid.src = src;
    lbVid.currentTime = 0;
    lbVid.play().catch(() => {});
  } else {
    lbVid.pause();
    lbVid.removeAttribute("src");
    lbVid.load();
    lbVid.style.display = "none";

    lbImg.style.display = "block";
    lbImg.src = src;
    lbImg.alt = name;
  }

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  lbClose.focus();
}

function closeLightbox(){
  ensureLightboxMediaNodes();

  // Clean up video so audio doesn’t keep going
  lbVid.pause();
  lbVid.removeAttribute("src");
  lbVid.load();

  lbImg.removeAttribute("src");

  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
}

lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if(e.target === lightbox) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
});

// ====== Render cards ======
function makeThumbElement(src){
  if(isVideo(src)){
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;         // animated preview
    v.preload = "metadata";
    v.style.width = "100%";
    v.style.height = "100%";
    v.style.objectFit = "cover";
    return v;
  }

  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = src;
  img.alt = filenameFromPath(src);
  return img;
}

function render(items){
  grid.innerHTML = "";
  empty.style.display = items.length ? "none" : "block";
  countPill.textContent = `${items.length} item${items.length===1 ? "" : "s"}`;

  for(const src of items){
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.appendChild(makeThumbElement(src));

    const meta = document.createElement("div");
    meta.className = "meta";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = filenameFromPath(src);

    const path = document.createElement("div");
    path.className = "path";
    path.textContent = src;

    meta.appendChild(name);
    meta.appendChild(path);

    card.appendChild(thumb);
    card.appendChild(meta);

    const open = () => openLightbox(src);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " ") open();
    });

    grid.appendChild(card);
  }
}

// ====== Search filter ======
let ALL = [];

function applyFilter(){
  const term = q.value.trim().toLowerCase();
  if(!term){
    render(ALL);
    return;
  }
  const filtered = ALL.filter(p =>
    filenameFromPath(p).toLowerCase().includes(term) || p.toLowerCase().includes(term)
  );
  render(filtered);
}
q.addEventListener("input", applyFilter);

// ====== Existence probing ======
// Fast check: HEAD request. (Same-origin, works on GitHub Pages.)
async function headExists(url){
  try{
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  }catch{
    return false;
  }
}

function urlFor(i, ext){
  return `${BASE}${PREFIX} (${i}).${ext}`;
}

async function findFirstExistingForIndex(i){
  for(const ext of EXTS){
    const candidate = urlFor(i, ext);
    const ok = await headExists(candidate);
    if(ok) return candidate;
  }
  return null;
}

// Concurrency helper
async function mapLimit(arr, limit, fn){
  const out = [];
  let idx = 0;

  async function worker(){
    while(idx < arr.length){
      const cur = idx++;
      out[cur] = await fn(arr[cur], cur);
    }
  }

  const workers = Array.from({ length: limit }, worker);
  await Promise.all(workers);
  return out;
}

async function buildGallery(){
  const indices = Array.from({ length: MAX }, (_, k) => k + 1);

  countPill.textContent = "Scanning…";

  const results = await mapLimit(indices, CONCURRENCY, async (i) => {
    return await findFirstExistingForIndex(i);
  });

  return results.filter(Boolean);
}

// Start
(async () => {
  ALL = await buildGallery();
  render(ALL);
})();

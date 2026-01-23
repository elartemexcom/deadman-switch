// === CONFIG: change these only ===
const BASE = "images/";
const PREFIX = "100";     // "100 (n).ext"
const MAX = 44;           // <-- change this number anytime

// What we will try for each number.
const EXTS = [
  // Images (still + animated)
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "svg",
  "bmp",

  // Video / motion
  "mp4",
  "webm",
  "ogv"
];

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

// For navigation + key controls:
let ALL = [];          // full list
let CURRENT = [];      // current list (filtered or full)
let currentIndex = -1; // index within CURRENT

// Fit toggle:
let FIT_MODE = true;   // true = fit, false = full-size native

function filenameFromPath(p){
  return p.split("/").pop();
}

function isVideo(src){
  return /\.(mp4|webm|ogv)$/i.test(src);
}

// ====== Lightbox content mount ======
function ensureLightboxMediaNodes(){
  const body = lightbox.querySelector(".lb-body");

  if(!lbImg){
    lbImg = document.createElement("img");
    lbImg.id = "lbImg";
    lbImg.alt = "";

    // Optional: click to toggle fit/full-size
    lbImg.addEventListener("click", () => {
      FIT_MODE = !FIT_MODE;
      applyFitMode();
    });

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

function lbBody(){
  return lightbox.querySelector(".lb-body");
}

function applyFitMode(){
  // When FIT_MODE is false, we enable "fullsize" mode (native pixels + scroll)
  lightbox.classList.toggle("fullsize", !FIT_MODE);
}

function openLightbox(src, idx){
  ensureLightboxMediaNodes();

  // Determine index for left/right navigation
  if(typeof idx === "number"){
    currentIndex = idx;
  } else {
    currentIndex = CURRENT.indexOf(src);
  }

  const name = filenameFromPath(src);
  lbTitle.textContent = name;
  lbOpen.href = src;

  // Reset scroll to top whenever opening an item
  lbBody().scrollTop = 0;

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

  applyFitMode();
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

function showAt(i){
  if(!CURRENT.length) return;
  const n = CURRENT.length;
  const wrapped = (i + n) % n;
  openLightbox(CURRENT[wrapped], wrapped);
}

function nextItem(){ showAt(currentIndex + 1); }
function prevItem(){ showAt(currentIndex - 1); }

// Close on click outside the panel
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if(e.target === lightbox) closeLightbox();
});

// Keyboard controls
window.addEventListener("keydown", (e) => {
  if(!lightbox.classList.contains("open")) return;

  // Escape closes
  if(e.key === "Escape"){
    e.preventDefault();
    closeLightbox();
    return;
  }

  // F toggles fit/full-size
  if(e.key === "f" || e.key === "F"){
    e.preventDefault();
    FIT_MODE = !FIT_MODE;
    applyFitMode();
    return;
  }

  // Left/Right navigation
  if(e.key === "ArrowRight"){
    e.preventDefault();
    nextItem();
    return;
  }
  if(e.key === "ArrowLeft"){
    e.preventDefault();
    prevItem();
    return;
  }

  // Up/Down scroll inside lightbox
  const scroller = lbBody();
  const step = e.shiftKey ? 280 : 140;

  if(e.key === "ArrowDown"){
    e.preventDefault();
    scroller.scrollBy({ top: step, left: 0, behavior: "smooth" });
    return;
  }
  if(e.key === "ArrowUp"){
    e.preventDefault();
    scroller.scrollBy({ top: -step, left: 0, behavior: "smooth" });
    return;
  }
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
  CURRENT = items; // <-- critical for navigation after filtering

  grid.innerHTML = "";
  empty.style.display = items.length ? "none" : "block";
  countPill.textContent = `${items.length} item${items.length===1 ? "" : "s"}`;

  items.forEach((src, idx) => {
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

    const open = () => openLightbox(src, idx);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        open();
      }
    });

    grid.appendChild(card);
  });
}

// ====== Search filter ======
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

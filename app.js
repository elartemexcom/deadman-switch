// === CONFIG: change these only ===
const BASE = "images/";
const PREFIX = "100";     // "100 (n).ext"
const MAX = 44;           // <-- change this number anytime

const EXTS = [
  "png","jpg","jpeg","gif","webp","avif","svg","bmp",
  "mp4","webm","ogv"
];

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

// Make lightbox focusable (helps keyboard reliability)
lightbox.tabIndex = -1;

let lbImg = null;
let lbVid = null;

let ALL = [];
let CURRENT = [];
let currentIndex = -1;

let FIT_MODE = true; // true = fit, false = fullsize

function filenameFromPath(p){ return p.split("/").pop(); }
function isVideo(src){ return /\.(mp4|webm|ogv)$/i.test(src); }

function lbBody(){ return lightbox.querySelector(".lb-body"); }

function ensureLightboxMediaNodes(){
  const body = lbBody();

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

  // Click-to-toggle zoom: attach once on the container
  if(!body.dataset.clickToggleBound){
    body.dataset.clickToggleBound = "1";
    body.addEventListener("click", (e) => {
      // Only toggle when clicking the image itself (not blank area, not video)
      if(e.target && e.target.id === "lbImg" && lbImg.style.display !== "none"){
        FIT_MODE = !FIT_MODE;
        applyFitMode();
      }
    });
  }
}

function applyFitMode(){
  lightbox.classList.toggle("fullsize", !FIT_MODE);
}

function openLightbox(src, idx){
  ensureLightboxMediaNodes();

  // Set index for navigation
  if(typeof idx === "number"){
    currentIndex = idx;
  } else {
    currentIndex = CURRENT.indexOf(src);
  }
  if(currentIndex < 0) currentIndex = 0;

  const name = filenameFromPath(src);
  lbTitle.textContent = name;
  lbOpen.href = src;

  // Reset scroll when opening a new item
  lbBody().scrollTop = 0;

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

  // Focus the lightbox so arrow keys always work
  lightbox.focus();
}

function closeLightbox(){
  ensureLightboxMediaNodes();

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

// Close controls
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if(e.target === lightbox) closeLightbox();
});

// KEYBOARD: capture = true so it works even if search input has focus
window.addEventListener("keydown", (e) => {
  if(!lightbox.classList.contains("open")) return;

  // Escape closes
  if(e.key === "Escape"){
    e.preventDefault();
    closeLightbox();
    return;
  }

  // F toggles fit/fullsize
  if(e.key === "f" || e.key === "F"){
    e.preventDefault();
    FIT_MODE = !FIT_MODE;
    applyFitMode();
    return;
  }

  // Left/Right navigation
  if(e.key === "ArrowRight"){
    e.preventDefault();
    e.stopPropagation();
    nextItem();
    return;
  }
  if(e.key === "ArrowLeft"){
    e.preventDefault();
    e.stopPropagation();
    prevItem();
    return;
  }

  // Up/Down scroll inside lightbox
  const scroller = lbBody();
  const step = e.shiftKey ? 300 : 150;

  if(e.key === "ArrowDown"){
    e.preventDefault();
    e.stopPropagation();
    scroller.scrollBy({ top: step, left: 0, behavior: "smooth" });
    return;
  }
  if(e.key === "ArrowUp"){
    e.preventDefault();
    e.stopPropagation();
    scroller.scrollBy({ top: -step, left: 0, behavior: "smooth" });
    return;
  }
}, true);

// ====== Render cards ======
function makeThumbElement(src){
  if(isVideo(src)){
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.autoplay = true;
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
  CURRENT = items;

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

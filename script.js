/* ============================================
   PROJECT DATA
   Each project points at a folder. The script
   auto-discovers every image/video inside it.
   ============================================ */

const PROJECTS = {
  1: { name: "Lunar Excavator Robot", folder: "media/lunar"  },
  2: { name: "Hip Exoskeleton",       folder: "media/exo"    },
  3: { name: "Combat Robot",          folder: "media/combat" },
  4: { name: "FRC Robot",             folder: "media/first"  },
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;

const CROSSFADE_MS = 400; // keep in sync with .carousel-track transition

/* ============================================
   STATE
   ============================================ */

let selectedProject = 1; // changes ONLY on click; drives .active
let shownProject    = 1; // what's currently on screen (selected or hovered)
let activeIndex = 0;
let media = [];

const mediaCache = {};
let hoverTimeout = null;
let isCrossfading = false;

/* ---- two stacked carousel layers ---- */

const viewport = document.querySelector(".carousel-viewport");
const trackA = document.getElementById("carousel-track");
const trackB = document.createElement("div");
trackB.className = "carousel-track hidden";
viewport.appendChild(trackB);

let activeTrack = trackA;

const projectNav = document.querySelector(".project-nav");
const projectLinks = document.querySelectorAll(".project-link");
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

/* ============================================
   MEDIA DISCOVERY
   ============================================ */

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function toMediaItem(folder, filename) {
  const isVideo = VIDEO_EXT.test(filename);
  return {
    type: isVideo ? "video" : "image",
    src: `${folder}/${filename}`,
    label: decodeURIComponent(filename),
  };
}

async function discoverMedia(folder) {
  try {
    const res = await fetch(folder + "/");
    if (res.ok) {
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const files = [...doc.querySelectorAll("a")]
        .map((a) => a.getAttribute("href"))
        .filter((href) => href && (IMAGE_EXT.test(href) || VIDEO_EXT.test(href)))
        .map((href) => decodeURIComponent(href.split("/").pop().split("?")[0]))
        .filter((name, i, arr) => arr.indexOf(name) === i);

      if (files.length) {
        return files.sort(naturalSort).map((name) => toMediaItem(folder, name));
      }
    }
  } catch (_) {
    /* fall through to manifest */
  }

  try {
    const res = await fetch(`${folder}/manifest.json`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length) {
        return list.sort(naturalSort).map((name) => toMediaItem(folder, name));
      }
    }
  } catch (_) {
    /* nothing found */
  }

  return [];
}

async function getMedia(folder) {
  if (!mediaCache[folder]) {
    mediaCache[folder] = await discoverMedia(folder);
  }
  return mediaCache[folder];
}

/* ============================================
   VIDEO ELEMENT — muted + looping + autoplay
   ============================================ */

function createVideo(item, slide) {
  const video = document.createElement("video");

  // Set attributes BEFORE src so the browser picks them up on first load.
  video.muted = true;                             // JS property (what browsers actually check)
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("muted", "");                // attribute fallback
  video.setAttribute("autoplay", "");
  video.setAttribute("loop", "");
  video.setAttribute("playsinline", "");          // modern iOS
  video.setAttribute("webkit-playsinline", "");   // legacy iOS

  video.addEventListener("error", () => showPlaceholder(slide, item.label));

  // Explicit play() — autoplay attribute alone is unreliable for
  // elements inserted into the DOM after the page has loaded.
  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };
  video.addEventListener("loadeddata", tryPlay);
  video.addEventListener("canplay", tryPlay);

  video.src = item.src;
  return video;
}

/* ============================================
   RENDER
   ============================================ */

function buildSlides(targetTrack) {
  targetTrack.innerHTML = "";

  if (!media.length) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.style.transform = "translate(-50%, -50%)";
    showPlaceholder(slide, "no media found");
    targetTrack.appendChild(slide);
    return;
  }

  media.forEach((item, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.index = i;

    if (item.type === "video") {
      slide.appendChild(createVideo(item, slide));
    } else {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.label;
      img.addEventListener("error", () => showPlaceholder(slide, item.label));
      slide.appendChild(img);
    }

    slide.addEventListener("click", () => {
      if (isCrossfading) return;
      if (i !== activeIndex) {
        activeIndex = i;
        updatePositions();
      }
    });

    targetTrack.appendChild(slide);
  });

  updatePositions(targetTrack);
}

function showPlaceholder(slide, label) {
  slide.innerHTML = "";
  const span = document.createElement("span");
  span.className = "placeholder-label";
  span.textContent = label;
  slide.appendChild(span);
}

/* ============================================
   POSITIONING
   ============================================ */

function updatePositions(targetTrack = activeTrack) {
  const slides = targetTrack.querySelectorAll(".slide");
  const mobile = isMobile();
  const spacing = mobile
    ? window.innerHeight * 0.42
    : window.innerWidth * 0.26;
  const count = media.length;

  slides.forEach((slide, i) => {
    let offset = i - activeIndex;
    offset = ((offset % count) + count) % count;
    if (offset > count / 2) offset -= count;

    const abs = Math.abs(offset);
    const scale = Math.max(1 - abs * 0.22, 0.4);
    const opacity = Math.max(1 - abs * 0.3, 0.15);
    const shift = offset * spacing;

    slide.style.transform = mobile
      ? `translate(-50%, -50%) translateY(${shift}px) scale(${scale})`
      : `translate(-50%, -50%) translateX(${shift}px) scale(${scale})`;
    slide.style.opacity = opacity;
    slide.style.zIndex = 100 - abs;
    slide.style.pointerEvents = abs > 3 ? "none" : "auto";
  });
}

/* ============================================
   NAVIGATION
   ============================================ */

function goTo(index) {
  const count = media.length;
  if (!count || isCrossfading) return;
  activeIndex = ((index % count) + count) % count;
  updatePositions();
}

async function showProject(id) {
  if (id === shownProject || isCrossfading) return;

  const incomingTrack = activeTrack === trackA ? trackB : trackA;
  const outgoingTrack = activeTrack;

  isCrossfading = true;
  shownProject = id;
  activeIndex = 0;

  media = await getMedia(PROJECTS[id].folder);
  buildSlides(incomingTrack);

  void incomingTrack.offsetWidth;

  incomingTrack.classList.remove("hidden");
  outgoingTrack.classList.add("hidden");

  setTimeout(() => {
    // Removing from the DOM stops playback on browsers that don't
    // auto-pause detached media elements.
    outgoingTrack.querySelectorAll("video").forEach((v) => v.pause());
    outgoingTrack.innerHTML = "";
    activeTrack = incomingTrack;
    isCrossfading = false;
  }, CROSSFADE_MS + 20);
}

/* ============================================
   MOBILE MENU
   ============================================ */

function closeMobileMenu() {
  mobileMenu.classList.remove("open");
  hamburger.classList.remove("open");
  hamburger.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu() {
  const isOpen = mobileMenu.classList.toggle("open");
  hamburger.classList.toggle("open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
  hamburger.blur();
}

hamburger.addEventListener("click", toggleMobileMenu);

/* ============================================
   EVENTS
   ============================================ */

projectLinks.forEach((link) => {
  const id = Number(link.dataset.project);

  link.addEventListener("click", () => {
    selectedProject = id;
    projectLinks.forEach((l) => {
      l.classList.toggle("active", Number(l.dataset.project) === selectedProject);
    });
    showProject(id);
    closeMobileMenu();
  });

  link.addEventListener("mouseenter", () => {
    if (isMobile()) return;

    clearTimeout(hoverTimeout);

    if (id === shownProject) return;

    hoverTimeout = setTimeout(() => {
      if (id !== shownProject && !isCrossfading) showProject(id);
    }, 150);
  });
});

projectNav.addEventListener("mouseleave", () => {
  if (isMobile()) return;

  clearTimeout(hoverTimeout);

  if (shownProject === selectedProject) return;

  hoverTimeout = setTimeout(() => {
    if (shownProject !== selectedProject && !isCrossfading) {
      showProject(selectedProject);
    }
  }, 150);
});

let wheelLocked = false;
viewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (wheelLocked) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 8) return;

    wheelLocked = true;
    goTo(activeIndex + (delta > 0 ? 1 : -1));
    setTimeout(() => (wheelLocked = false), 350);
  },
  { passive: false }
);

let touchStartX = null;
let touchStartY = null;

viewport.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  },
  { passive: true }
);

viewport.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

viewport.addEventListener("touchend", (e) => {
  if (touchStartX === null || touchStartY === null) return;

  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const delta = isMobile() ? touchStartY - endY : touchStartX - endX;

  if (Math.abs(delta) > 30) {
    goTo(activeIndex + (delta > 0 ? 1 : -1));
  }

  touchStartX = null;
  touchStartY = null;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(activeIndex + 1);
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(activeIndex - 1);
});

window.addEventListener("resize", updatePositions);

/* ============================================
   INIT
   ============================================ */

(async function init() {
  await Promise.all(Object.values(PROJECTS).map((p) => getMedia(p.folder)));

  media = mediaCache[PROJECTS[selectedProject].folder] || [];
  shownProject = selectedProject;
  buildSlides(activeTrack);
})();
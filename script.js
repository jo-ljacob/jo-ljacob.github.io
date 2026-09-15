/* ============================================
   PROJECT DATA
   Media is hardcoded per project. type is
   'image' or 'video'; src is the full path.
   ============================================ */

const PROJECTS = {
  1: {
    name: "Lunar Excavator Robot",
    media: [
      { type: "video", src: "media/lunar/1.mp4",  label: "Lunar Excavator Robot — 1" },
      { type: "image", src: "media/lunar/2.png",  label: "Lunar Excavator Robot — 2" },
      { type: "image", src: "media/lunar/3.jpg",  label: "Lunar Excavator Robot — 3" },
      { type: "image", src: "media/lunar/4.jpg",  label: "Lunar Excavator Robot — 4" },
      { type: "image", src: "media/lunar/5.jpg",  label: "Lunar Excavator Robot — 5" },
      { type: "image", src: "media/lunar/6.jpeg", label: "Lunar Excavator Robot — 6" },
      { type: "image", src: "media/lunar/7.png",  label: "Lunar Excavator Robot — 7" },
      { type: "image", src: "media/lunar/8.png",  label: "Lunar Excavator Robot — 8" },
      { type: "image", src: "media/lunar/9.jpg",  label: "Lunar Excavator Robot — 9" },
    ],
  },
  2: {
    name: "Hip Exoskeleton",
    media: [
      { type: "image", src: "media/exo/1.png", label: "Hip Exoskeleton — 1" },
      { type: "image", src: "media/exo/2.jpg", label: "Hip Exoskeleton — 2" },
      { type: "image", src: "media/exo/3.png", label: "Hip Exoskeleton — 3" },
      { type: "image", src: "media/exo/4.jpg", label: "Hip Exoskeleton — 4" },
      { type: "image", src: "media/exo/5.png", label: "Hip Exoskeleton — 5" },
      { type: "image", src: "media/exo/6.png", label: "Hip Exoskeleton — 6" },
    ],
  },
  3: {
    name: "Combat Robot",
    media: [
      { type: "video", src: "media/combat/1.mp4",  label: "Combat Robot — 1" },
      { type: "image", src: "media/combat/2.jpg",  label: "Combat Robot — 2" },
      { type: "image", src: "media/combat/3.png",  label: "Combat Robot — 3" },
      { type: "image", src: "media/combat/4.jpg",  label: "Combat Robot — 4" },
      { type: "image", src: "media/combat/5.jpg",  label: "Combat Robot — 5" },
      { type: "image", src: "media/combat/6.png",  label: "Combat Robot — 6" },
      { type: "image", src: "media/combat/7.jpeg", label: "Combat Robot — 7" },
    ],
  },
  4: {
    name: "FRC Robot",
    media: [
      { type: "image", src: "media/first/1.png", label: "FRC Robot — 1" },
      { type: "image", src: "media/first/2.jpg", label: "FRC Robot — 2" },
      { type: "image", src: "media/first/3.jpg", label: "FRC Robot — 3" },
    ],
  },
};

const CROSSFADE_MS = 400; // keep in sync with .carousel-track transition

/* ============================================
   STATE
   ============================================ */

let selectedProject = 1; // changes ONLY on click; drives .active
let shownProject    = 1; // what's currently on screen (selected or hovered)
let activeIndex = 0;
let media = PROJECTS[selectedProject].media;

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

function showProject(id) {
  if (id === shownProject || isCrossfading) return;

  const incomingTrack = activeTrack === trackA ? trackB : trackA;
  const outgoingTrack = activeTrack;

  isCrossfading = true;
  shownProject = id;
  activeIndex = 0;
  media = PROJECTS[id].media;

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

media = PROJECTS[selectedProject].media;
buildSlides(activeTrack);
const projectLinks = document.querySelectorAll(".project-link");
const projectContent = document.getElementById("project-content");
let clickedPage = null;
let currentHoverPage = null;
let displayedPage = null;

const projectCache = {};
const imageCache = {};

async function preloadProjects() {
    const pages = Array.from(projectLinks).map((link) =>
        link.getAttribute("data-page")
    );

    await Promise.all(
        pages.map(async (page) => {
            try {
                const response = await fetch(`${page}.html`);
                if (response.ok) {
                    const html = await response.text();
                    projectCache[page] = html;

                    const imgSrcRegex = /src=["']([^"']+)["']/g;
                    let match;
                    const imagePromises = [];

                    while ((match = imgSrcRegex.exec(html)) !== null) {
                        const imgSrc = match[1];
                        if (!imageCache[imgSrc]) {
                            imagePromises.push(
                                new Promise((resolve) => {
                                    const img = new Image();
                                    img.onload = () => {
                                        imageCache[imgSrc] = img;
                                        resolve();
                                    };
                                    img.onerror = resolve;
                                    img.src = imgSrc;
                                })
                            );
                        }
                    }

                    await Promise.all(imagePromises);
                } else {
                    projectCache[page] =
                        "<p>Project content coming soon...</p>";
                }
            } catch {
                projectCache[page] = "<p>Project content coming soon...</p>";
            }
        })
    );
}

preloadProjects();

async function loadProject(page) {
    if (displayedPage === page) return;

    const previousPage = displayedPage;
    displayedPage = page;

    const html = projectCache[page] || "<p>Loading...</p>";

    if (previousPage === null) {
        projectContent.innerHTML = html;
        setTimeout(() => projectContent.classList.add("visible"), 10);
    } else {
        projectContent.classList.remove("visible");
        setTimeout(() => {
            if (displayedPage === page) {
                projectContent.innerHTML = html;
                projectContent.classList.add("visible");
            }
        }, 200);
    }
}

function clearContent() {
    if (displayedPage === null) return;
    displayedPage = null;
    projectContent.classList.remove("visible");
    setTimeout(() => {
        if (displayedPage === null) {
            projectContent.innerHTML = "";
        }
    }, 200);
}

function updateDisplay() {
    const targetPage =
        currentHoverPage !== null ? currentHoverPage : clickedPage;

    if (targetPage !== null) {
        loadProject(targetPage);
    } else {
        clearContent();
    }
}

projectLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
        currentHoverPage = link.getAttribute("data-page");
        updateDisplay();
    });

    link.addEventListener("mouseleave", () => {
        currentHoverPage = null;
        setTimeout(updateDisplay, 50);
    });

    link.addEventListener("click", (e) => {
        e.preventDefault();
        projectLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        clickedPage = link.getAttribute("data-page");
        updateDisplay();
    });
});

document.addEventListener("click", (e) => {
    const img = e.target.closest(".image-grid img");
    const portraitContainer = e.target.closest(".portrait-container");

    if (!img && !portraitContainer) return;

    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");

    if (portraitContainer) {
        const portrait = document.getElementById("portrait");
        const portraitMobile = document.getElementById("portrait-mobile");
        modalImg.src = portrait ? portrait.src : portraitMobile.src;
    } else {
        modalImg.src = img.src;
    }

    modal.classList.add("active");
});

document.addEventListener("click", (e) => {
    if (
        e.target.classList.contains("modal") ||
        e.target.classList.contains("modal-close")
    ) {
        document.getElementById("image-modal").classList.remove("active");
    }
});

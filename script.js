const projectLinks = document.querySelectorAll(".project-link");
const projectContent = document.getElementById("project-content");
let clickedPage = null;
let currentHoverPage = null;
let displayedPage = null;

async function loadProject(page) {
    if (displayedPage === page) return;
    displayedPage = page;

    try {
        const response = await fetch(`${page}.html`);
        const html = response.ok
            ? await response.text()
            : "<p>Project content coming soon...</p>";

        projectContent.classList.remove("visible");
        setTimeout(() => {
            projectContent.innerHTML = html;
            projectContent.classList.add("visible");
        }, 300);
    } catch {
        projectContent.innerHTML = "<p>Project content coming soon...</p>";
        projectContent.classList.add("visible");
    }
}

function clearContent() {
    if (displayedPage === null) return;
    displayedPage = null;
    projectContent.classList.remove("visible");
    setTimeout(() => {
        projectContent.innerHTML = "";
    }, 300);
}

function updateDisplay() {
    if (currentHoverPage !== null) loadProject(currentHoverPage);
    else if (clickedPage !== null) loadProject(clickedPage);
    else clearContent();
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
        // Check if it's the mobile or desktop portrait
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

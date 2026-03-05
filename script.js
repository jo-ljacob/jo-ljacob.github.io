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

const preloadPromise = preloadProjects().then(() => buildPrintPages());

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

function parseProjectFromHTML(page, html) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = document.querySelector(`.project-link[data-page="${page}"]`).textContent.trim();
    const roleEl = doc.querySelector(".project-role");
    const role = roleEl?.querySelector("span:first-child")?.textContent.trim() ?? "";
    const timeframe = roleEl?.querySelector(".project-timeframe")?.textContent.trim() ?? "";
    const images = [...doc.querySelectorAll(".image-grid img[data-print='true']")].map(img => img.getAttribute("src"));

    const sections = {};
    const subheadings = doc.querySelectorAll(".subheading");
    subheadings.forEach(heading => {
        const key = heading.textContent.trim();
        const next = heading.nextElementSibling;
        if (next && next.tagName === "P") {
            sections[key] = next.textContent.trim();
        }
    });

    return { title, role, timeframe, images, sections };
}

function buildPrintPages() {
    const container = document.getElementById("print-pages");
    container.innerHTML = "";

    const pages = Array.from(projectLinks).map(l => l.getAttribute("data-page"));
    const projects = pages.map(page => parseProjectFromHTML(page, projectCache[page] || ""));

    const cd = document.getElementById("print-cover-data").dataset;
    const nameEl = document.querySelector("h1 a").cloneNode(true);
    nameEl.querySelectorAll("br").forEach(br => br.replaceWith(" "));
    const name = nameEl.textContent.trim().replace(/\s+/g, " ");
    const emailEl = document.querySelector('a[href^="mailto:"]');
    const email = emailEl.getAttribute("href").replace("mailto:", "");
    const linkedinEl = document.querySelector('a[href*="linkedin.com"]');
    const linkedinHref = linkedinEl.getAttribute("href");
    const linkedinLabel = linkedinEl.textContent.trim().replace("↗", "").trim();

    const cover = document.createElement("div");
    cover.className = "print-page print-cover";
    cover.innerHTML = `
        <div>
            <div class="print-cover-eyebrow">${cd.eyebrow}</div>
            <div class="print-cover-name">${name}</div>
            <div class="print-divider print-divider-half"></div>
            <div class="print-cover-contact">
                <div class="print-cover-contact-line">${cd.institution}</div>
                <div class="print-cover-contact-line">${cd.education}</div>
                <div class="print-cover-contact-line">${cd.graduation}</div>
            </div>
            <div style="margin-top:1em;"></div>
            <div class="print-divider print-divider-half"></div>
            <div class="print-cover-contact">
                <div class="print-cover-contact-line"><a href="mailto:${email}">${email}</a></div>
                <div class="print-cover-contact-line">${cd.phone}</div>
                <div class="print-cover-contact-line"><a href="${linkedinHref}" target="_blank">${linkedinLabel}</a></div>
                <div class="print-cover-contact-line"><a href="${cd.website}" target="_blank">${cd.websiteLabel}</a></div>
            </div>
        </div>
    `;
    container.appendChild(cover);

    const toc = document.createElement("div");
    toc.className = "print-page";
    toc.innerHTML = `
        <div class="print-section-title">TABLE OF CONTENTS</div>
        <div class="print-divider"></div>
        ${projects.map((p, i) => `
            <div class="print-toc-row">
                <span>${p.title}</span>
                <span>${i + 3}</span>
            </div>
            <div class="print-divider"></div>
        `).join("")}
        <div class="print-footer"><span class="print-footer-name">JOEL JACOB</span> <span class="print-footer-num">2</span></div>
    `;
    container.appendChild(toc);

    projects.forEach((proj, i) => {
        const page = document.createElement("div");
        page.className = "print-page";

        const imgHTML = proj.images.map(src => `<img src="${src}" />`).join("");

        const sectionHTML = Object.entries(proj.sections).map(([heading, text], si) => `
            <div class="print-divider"></div>
            <div class="print-section">
                <div class="print-subheading">${heading}</div>
                <p>${text}</p>
            </div>
        `).join("");

        page.innerHTML = `
            <div class="print-section-title">${proj.title.toUpperCase()}</div>
            <div class="print-project-role"><span>${proj.role}</span><span>${proj.timeframe}</span></div>
            <div class="print-divider"></div>
            <div class="print-image-grid">${imgHTML}</div>
            ${sectionHTML}
            <div class="print-footer"><span class="print-footer-name">JOEL JACOB</span> <span class="print-footer-num">${i + 3}</span></div>
        `;
        container.appendChild(page);
    });
}

window.addEventListener("beforeprint", () => {
    document.title = "Joel_Jacob_Portfolio";
});

window.addEventListener("afterprint", () => {
    document.title = "Joel Jacob";
});

document.getElementById("download-pdf-btn").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.title = "Joel_Jacob_Portfolio";
    preloadPromise.then(() => {
        buildPrintPages();
        window.print();
        setTimeout(() => { document.title = "Joel Jacob"; }, 1000);
    });
});
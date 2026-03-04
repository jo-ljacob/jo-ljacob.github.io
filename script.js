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

const PROJECT_IMAGES = {
    "lunabotics":     { nums: [1, 2, 5], ext: { 1: "jpeg", 2: "jpg", 5: "jpg" } },
    "hip-exo":        { nums: [1, 2, 5], ext: { 1: "png",  2: "jpg", 5: "png" } },
    "combat-robot":   { nums: [1, 3, 4], ext: { 1: "jpg",  3: "png", 4: "jpg" } },
    "first-robotics": { nums: [1, 2, 3], ext: { 1: "jpg",  2: "png", 3: "jpg" } },
};

function getImages(page) {
    const { nums, ext } = PROJECT_IMAGES[page];
    return nums.map(n => `./images/${page}-${n}.${ext[n]}`);
}

const PROJECT_META = [
    {
        page: "lunabotics",
        title: "NASA Lunabotics Challenge",
        images: getImages("lunabotics"),
        problem: "Create an excavation system that maintains consistent regolith throughput despite unpredictable terrain interaction and strict subsystem coupling constraints.",
        method: "Explored multiple intake geometries and converged on a dual-channel architecture to decouple material flow from local terrain variance. Used simulation results to guide geometric tradeoffs between stiffness, manufacturability, and serviceability rather than purely maximizing safety factor.",
        result: "The final design demonstrated stable simulated flow behavior across varying load cases instead of peak-only optimization. Subsystem interfaces remained robust to alignment and mounting tolerance changes, reducing integration risk at the rover level.",
        role: "Mechanical Team Member @ CMU Moon Miners",
        skills: "SolidWorks, ANSYS Discovery, 3D Printing",
    },
    {
        page: "hip-exo",
        title: "Hip Exoskeleton",
        images: getImages("hip-exo"),
        problem: "Improve assistive device effectiveness without increasing user fatigue or reducing long-term wearability.",
        method: "Redesigned mechanical interfaces to prioritize anatomical alignment and load path efficiency before actuator selection. Iterated hardware with fast prototyping to validate human-in-the-loop constraints that are not captured in simulation alone.",
        result: "Hardware revisions improved comfort and motion naturalness in addition to reducing mass. The platform became better suited for extended user trials and data-driven assistance development.",
        role: "Research Assistant @ CMU MetaMobility Lab",
        skills: "SolidWorks, Git, Python, Microcontrollers, 3D Printing",
    },
    {
        page: "combat-robot",
        title: "National Havoc Robot League",
        images: getImages("combat-robot"),
        problem: "Develop a weaponized robot architecture that remains controllable and survivable under asymmetric impacts and repeated shock loading.",
        method: "Designed the robot around energy management rather than raw weapon power, using compliance and mass distribution to protect critical components. Evaluated weapon geometry and inertia to shape impact impulse and spin-up behavior instead of maximizing tip speed alone.",
        result: "The robot maintained drivability and weapon consistency after high-energy collisions where rigid designs typically degrade. Design choices reduced failure modes related to shock transmission and post-impact instability.",
        role: "Team Member @ CMU Combat Robotics",
        skills: "Onshape, MATLAB, 3D Printing, Soldering",
    },
    {
        page: "first-robotics",
        title: "FIRST Robotics Competition",
        images: getImages("first-robotics"),
        problem: "Enable consistent autonomous and teleoperated performance in an environment dominated by sensor noise, latency, and driver variability.",
        method: "Structured control software to isolate sensing, state estimation, and actuation, allowing independent tuning and rapid iteration. Treated vision as a probabilistic input rather than a ground truth signal and compensated for delay at the control level.",
        result: "Autonomous behavior became predictable and repeatable across matches rather than condition-dependent. Drivers reported increased confidence due to smoother control response and reduced correction workload.",
        role: "Control Department Director @ FRC Team 5123",
        skills: "Java, Git, Raspberry Pi, Soldering",
    },
];

function buildPrintPages() {
    const container = document.getElementById("print-pages");
    container.innerHTML = "";

    const cover = document.createElement("div");
    cover.className = "print-page print-cover";
    cover.innerHTML = `
        <div>
            <div class="print-cover-eyebrow">ENGINEERING PORTFOLIO</div>
            <div class="print-cover-name">JOEL JACOB</div>
            <div style="margin-top:3em;"></div>
            <div class="print-divider print-divider-half"></div>
            <div class="print-cover-contact">
                <div class="print-cover-contact-line">Carnegie Mellon University</div>
                <div class="print-cover-contact-line">BS in Mechanical Engineering</div>
                <div class="print-cover-contact-line">Expected May 2027</div>
            </div>
            <div style="margin-top:1.5em;"></div>
            <div class="print-divider print-divider-half"></div>
            <div class="print-cover-contact">
                <div class="print-cover-contact-line"><a href="mailto:joelj@andrew.cmu.edu">joelj@andrew.cmu.edu</a></div>
                <div class="print-cover-contact-line">914-350-0775</div>
                <div class="print-cover-contact-line"><a href="https://www.linkedin.com/in/joeljacob2006/" target="_blank">linkedin.com/in/joeljacob2006</a></div>
                <div class="print-cover-contact-line"><a href="https://joel-jacob.com" target="_blank">joel-jacob.com</a></div>
            </div>
        </div>
    `;
    container.appendChild(cover);

    const toc = document.createElement("div");
    toc.className = "print-page";
    toc.innerHTML = `
        <div class="print-section-title">TABLE OF CONTENTS</div>
        <div class="print-divider"></div>
        ${PROJECT_META.map((p, i) => `
            <div class="print-toc-row">
                <span>${p.title}</span>
                <strong>${i + 3}</strong>
            </div>
            <div class="print-divider"></div>
        `).join("")}
        <div class="print-footer">Joel Jacob <strong>2</strong></div>
    `;
    container.appendChild(toc);

    PROJECT_META.forEach((proj, i) => {
        const page = document.createElement("div");
        page.className = "print-page";

        const imgHTML = proj.images
            .map(src => `<img src="${src}" />`)
            .join("");

        page.innerHTML = `
            <div class="print-section-title">${proj.title.toUpperCase()}</div>
            <div class="print-project-role">${proj.role}</div>
            <div class="print-divider"></div>
            <div class="print-image-grid">${imgHTML}</div>
            <div class="print-divider"></div>
            <div class="print-section">
                <div class="print-subheading">PROBLEM</div>
                <p>${proj.problem}</p>
            </div>
            <br>
            <div class="print-divider"></div>
            <div class="print-section">
                <div class="print-subheading">METHOD</div>
                <p>${proj.method}</p>
            </div>
            <br>
            <div class="print-divider"></div>
            <div class="print-section">
                <div class="print-subheading">RESULT</div>
                <p>${proj.result}</p>
            </div>
            <br>
            <div class="print-divider"></div>
            <div class="print-section">
                <div class="print-subheading">SKILLS USED</div>
                <p>${proj.skills}</p>
            </div>
            <div class="print-footer">Joel Jacob <strong>${i + 3}</strong></div>
        `;
        container.appendChild(page);
    });
}

window.addEventListener("beforeprint", () => {
    buildPrintPages();
    document.title = "Joel_Jacob_Portfolio";
});

window.addEventListener("afterprint", () => {
    document.title = "Joel Jacob";
});

document.getElementById("download-pdf-btn").addEventListener("click", (e) => {
    e.preventDefault();
    buildPrintPages();
    document.title = "Joel_Jacob_Portfolio";
    setTimeout(() => {
        window.print();
        setTimeout(() => { document.title = "Joel Jacob"; }, 1000);
    }, 300);
});
const revealItems = document.querySelectorAll(".reveal-section");
const trackSections = document.querySelectorAll("header[id], section[id], header.hero, .content-card[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const contentRevealItems = document.querySelectorAll(".content .reveal-section");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-links");
const aboutPanels = document.querySelectorAll(".about-panel");
const aboutPanelFrame = new WeakMap();

contentRevealItems.forEach((item, index) => {
    const direction = index % 2 === 0 ? "left" : "right";
    item.setAttribute("data-reveal-direction", direction);
});

const setAboutPanelSwing = (panel, clientX, clientY) => {
    const rect = panel.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const relativeX = x / rect.width - 0.5;
    const relativeY = y / rect.height - 0.5;
    const rotate = `${relativeX * 4}deg`;
    const shiftX = `${relativeX * 6}px`;
    const shiftY = `${relativeY * 4 - 1}px`;

    panel.style.setProperty("--swing-rotate", rotate);
    panel.style.setProperty("--swing-shift-x", shiftX);
    panel.style.setProperty("--swing-shift-y", shiftY);
    panel.style.setProperty("--swing-origin-x", `${(x / rect.width) * 100}%`);
    panel.style.setProperty("--swing-origin-y", `${(y / rect.height) * 100}%`);
};

const queueAboutPanelSwing = (panel, clientX, clientY) => {
    const activeFrame = aboutPanelFrame.get(panel);

    if (activeFrame) {
        cancelAnimationFrame(activeFrame);
    }

    const nextFrame = requestAnimationFrame(() => {
        setAboutPanelSwing(panel, clientX, clientY);
        aboutPanelFrame.delete(panel);
    });

    aboutPanelFrame.set(panel, nextFrame);
};

const resetAboutPanelSwing = (panel) => {
    const activeFrame = aboutPanelFrame.get(panel);

    if (activeFrame) {
        cancelAnimationFrame(activeFrame);
        aboutPanelFrame.delete(panel);
    }

    panel.style.setProperty("--swing-rotate", "0deg");
    panel.style.setProperty("--swing-shift-x", "0px");
    panel.style.setProperty("--swing-shift-y", "0px");
    panel.style.setProperty("--swing-origin-x", "50%");
    panel.style.setProperty("--swing-origin-y", "50%");
};

aboutPanels.forEach((panel) => {
    panel.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
            queueAboutPanelSwing(panel, event.clientX, event.clientY);
        }
    });

    panel.addEventListener("pointermove", (event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
            queueAboutPanelSwing(panel, event.clientX, event.clientY);
        }
    });

    panel.addEventListener("pointerleave", () => {
        resetAboutPanelSwing(panel);
    });

    panel.addEventListener(
        "touchstart",
        (event) => {
            const touch = event.touches[0];

            if (!touch) {
                return;
            }

            queueAboutPanelSwing(panel, touch.clientX, touch.clientY);
        },
        { passive: true }
    );

    panel.addEventListener(
        "touchmove",
        (event) => {
            const touch = event.touches[0];

            if (!touch) {
                return;
            }

            queueAboutPanelSwing(panel, touch.clientX, touch.clientY);
        },
        { passive: true }
    );

    panel.addEventListener("touchend", () => {
        resetAboutPanelSwing(panel);
    });
});

if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        navMenu.classList.toggle("is-open", !isOpen);
    });

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth > 640) {
                return;
            }

            menuToggle.setAttribute("aria-expanded", "false");
            navMenu.classList.remove("is-open");
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 640) {
            menuToggle.setAttribute("aria-expanded", "false");
            navMenu.classList.remove("is-open");
        }
    });
}

if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    trackSections.forEach((section) => section.classList.add("is-active"));
} else {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.18,
            rootMargin: "0px 0px -10% 0px",
        }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    const activeObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-active", entry.isIntersecting);
            });

            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting && entry.target.id)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (!visibleEntries.length) {
                return;
            }

            const activeId = visibleEntries[0].target.id;

            navLinks.forEach((link) => {
                const matches = link.getAttribute("href") === `#${activeId}`;
                link.classList.toggle("is-current", matches);
            });
        },
        {
            threshold: [0.3, 0.5, 0.7],
            rootMargin: "-15% 0px -35% 0px",
        }
    );

    trackSections.forEach((section) => activeObserver.observe(section));
}

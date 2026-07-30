(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const storedTheme = localStorage.getItem("domain-surveys-theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (themeButton) {
      themeButton.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      );
      themeButton.setAttribute("title", theme === "dark" ? "Light mode" : "Dark mode");
    }
  };

  setTheme(storedTheme || (systemDark ? "dark" : "light"));

  themeButton?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("domain-surveys-theme", nextTheme);
    setTheme(nextTheme);
  });

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const progress = document.querySelector("[data-reading-progress]");
  const updateReadingProgress = () => {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
    progress.style.width = `${percent}%`;
  };

  updateReadingProgress();
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);

  const rail = document.querySelector("[data-survey-rail]");
  const railToggle = document.querySelector("[data-rail-toggle]");
  const railLinks = [...document.querySelectorAll("[data-scrollspy] a[href^='#']")];

  const closeRail = () => {
    if (!rail || !railToggle) return;
    rail.classList.remove("is-open");
    railToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  };

  railToggle?.addEventListener("click", () => {
    if (!rail) return;
    const willOpen = !rail.classList.contains("is-open");
    rail.classList.toggle("is-open", willOpen);
    railToggle.setAttribute("aria-expanded", String(willOpen));
    document.body.classList.toggle("is-locked", willOpen);
  });

  railLinks.forEach((link) => {
    link.addEventListener("click", closeRail);
  });

  const observedSections = railLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActiveSection = (id) => {
    let activeLink = null;
    railLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      link.classList.remove("is-ancestor");
      if (isActive) {
        activeLink = link;
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const parentTarget = activeLink?.dataset.navParent;
    if (parentTarget) {
      const parentLink = railLinks.find((link) => link.getAttribute("href") === parentTarget);
      parentLink?.classList.add("is-ancestor");
    }
  };

  if (observedSections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      {
        rootMargin: "-20% 0px -68% 0px",
        threshold: [0, 0.08, 0.3],
      },
    );

    observedSections.forEach((section) => observer.observe(section));
  }

  const lightbox = document.querySelector("[data-lightbox-dialog]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxTitle = lightbox?.querySelector("[data-lightbox-title]");
  const zoomButton = lightbox?.querySelector("[data-lightbox-zoom]");

  document.querySelectorAll("[data-lightbox-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const source = trigger.dataset.imageSrc;
      if (!lightbox || !lightboxImage || typeof lightbox.showModal !== "function") {
        window.open(source, "_blank", "noopener,noreferrer");
        return;
      }
      lightboxImage.src = source;
      lightboxImage.alt = trigger.dataset.imageAlt || "";
      if (lightboxTitle) {
        lightboxTitle.textContent = trigger.dataset.imageTitle || "Diagram";
      }
      lightbox.classList.remove("is-zoomed");
      zoomButton?.setAttribute("aria-pressed", "false");
      lightbox.showModal();
      document.body.classList.add("is-locked");
    });
  });

  lightbox?.querySelector("[data-lightbox-close]")?.addEventListener("click", () => {
    lightbox.close();
  });

  lightbox?.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    lightbox.classList.remove("is-zoomed");
  });

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  zoomButton?.addEventListener("click", () => {
    const isZoomed = lightbox.classList.toggle("is-zoomed");
    zoomButton.setAttribute("aria-pressed", String(isZoomed));
    zoomButton.textContent = isZoomed ? "Fit" : "Zoom";
  });

  lightboxImage?.addEventListener("click", () => {
    if (!lightbox.classList.contains("is-zoomed")) return;
    lightbox.classList.remove("is-zoomed");
    zoomButton?.setAttribute("aria-pressed", "false");
    if (zoomButton) zoomButton.textContent = "Zoom";
  });

  const nodeDialog = document.querySelector("[data-node-dialog]");
  const nodeDialogIndex = nodeDialog?.querySelector("[data-node-dialog-index]");
  const nodeDialogTitle = nodeDialog?.querySelector("[data-node-dialog-title]");
  const nodeDialogDescription = nodeDialog?.querySelector("[data-node-dialog-description]");
  const nodeDialogImage = nodeDialog?.querySelector("[data-node-dialog-image]");
  const nodeDialogPlaceholder = nodeDialog?.querySelector("[data-node-dialog-placeholder]");
  const nodeDialogFile = nodeDialog?.querySelector("[data-node-dialog-file]");

  document.querySelectorAll("[data-visual-node]").forEach((node) => {
    node.addEventListener("click", () => {
      if (!nodeDialog || typeof nodeDialog.showModal !== "function") return;

      const title = node.dataset.nodeTitle || "Visual node";
      const description = node.dataset.nodeDescription || "";
      const imageSource = node.dataset.nodeImage || "";
      const expectedFile = imageSource.replace(/^\.\//, "");

      if (nodeDialogIndex) nodeDialogIndex.textContent = node.dataset.nodeIndex || "Node";
      if (nodeDialogTitle) nodeDialogTitle.textContent = title;
      if (nodeDialogDescription) nodeDialogDescription.textContent = description;
      if (nodeDialogFile) nodeDialogFile.textContent = expectedFile || "assets/node.png";

      if (nodeDialogImage && nodeDialogPlaceholder) {
        nodeDialogImage.hidden = true;
        nodeDialogPlaceholder.hidden = false;
        nodeDialogImage.alt = `${title} visual`;
        nodeDialogImage.onload = () => {
          nodeDialogImage.hidden = false;
          nodeDialogPlaceholder.hidden = true;
        };
        nodeDialogImage.onerror = () => {
          nodeDialogImage.hidden = true;
          nodeDialogPlaceholder.hidden = false;
        };
        nodeDialogImage.src = imageSource;
      }

      nodeDialog.showModal();
      document.body.classList.add("is-locked");
    });
  });

  nodeDialog?.querySelector("[data-node-dialog-close]")?.addEventListener("click", () => {
    nodeDialog.close();
  });

  nodeDialog?.addEventListener("click", (event) => {
    if (event.target === nodeDialog) nodeDialog.close();
  });

  nodeDialog?.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    if (nodeDialogImage) {
      nodeDialogImage.onload = null;
      nodeDialogImage.onerror = null;
      nodeDialogImage.removeAttribute("src");
    }
  });

  document.querySelectorAll("[data-copy-section]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.copySection;
      const url = new URL(window.location.href);
      url.hash = id;
      try {
        await navigator.clipboard.writeText(url.toString());
        const original = button.textContent;
        button.textContent = "Copied";
        setTimeout(() => {
          button.textContent = original;
        }, 1400);
      } catch {
        window.location.hash = id;
      }
    });
  });
})();

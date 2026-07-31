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
  const nodeDialogDiagram = nodeDialog?.querySelector("[data-node-dialog-diagram]");
  const nodeDialogImageViewport = nodeDialog?.querySelector("[data-node-dialog-image-viewport]");
  const nodeDialogImageStage = nodeDialog?.querySelector("[data-node-dialog-image-stage]");
  const nodeDialogPlaceholder = nodeDialog?.querySelector("[data-node-dialog-placeholder]");
  const nodeDialogPlaceholderTitle = nodeDialog?.querySelector(
    "[data-node-dialog-placeholder-title]",
  );
  const nodeDialogPlaceholderDetail = nodeDialog?.querySelector(
    "[data-node-dialog-placeholder-detail]",
  );
  const nodeDialogGesture = nodeDialog?.querySelector("[data-node-dialog-gesture]");
  const nodeDialogControls = nodeDialog?.querySelector("[data-node-dialog-controls]");
  const nodeDialogAssetLabel = nodeDialog?.querySelector("[data-node-dialog-asset-label]");
  const nodeDialogFile = nodeDialog?.querySelector("[data-node-dialog-file]");
  let nodeDialogLoadController = null;
  let nodeDialogLoadId = 0;
  let nodeDialogViewer = null;
  let nodeDialogMediaType = null;
  const nodeImageView = {
    scale: 1,
    x: 0,
    y: 0,
    pointerId: null,
    pointerX: 0,
    pointerY: 0,
    originX: 0,
    originY: 0,
  };

  const renderNodeImageView = () => {
    if (!nodeDialogImageStage) return;
    nodeDialogImageStage.style.transform =
      `translate(${nodeImageView.x}px, ${nodeImageView.y}px) scale(${nodeImageView.scale})`;
  };

  const fitNodeImageBoard = () => {
    if (!nodeDialogImageViewport || !nodeDialogImageStage) return;

    const stageWidth = nodeDialogImageStage.offsetWidth;
    const stageHeight = nodeDialogImageStage.offsetHeight;
    if (!stageWidth || !stageHeight) return;

    const inset = 32;
    const availableWidth = Math.max(1, nodeDialogImageViewport.clientWidth - inset * 2);
    const availableHeight = Math.max(1, nodeDialogImageViewport.clientHeight - inset * 2);
    nodeImageView.scale = Math.min(
      1,
      availableWidth / stageWidth,
      availableHeight / stageHeight,
    );
    nodeImageView.x =
      (nodeDialogImageViewport.clientWidth - stageWidth * nodeImageView.scale) / 2;
    nodeImageView.y =
      (nodeDialogImageViewport.clientHeight - stageHeight * nodeImageView.scale) / 2;
    renderNodeImageView();
  };

  const zoomNodeImageBoard = (factor) => {
    if (!nodeDialogImageViewport || !nodeDialogImageStage) return;

    const previousScale = nodeImageView.scale;
    const nextScale = Math.min(3, Math.max(0.15, previousScale * factor));
    const centerX = nodeDialogImageViewport.clientWidth / 2;
    const centerY = nodeDialogImageViewport.clientHeight / 2;
    const boardX = (centerX - nodeImageView.x) / previousScale;
    const boardY = (centerY - nodeImageView.y) / previousScale;

    nodeImageView.scale = nextScale;
    nodeImageView.x = centerX - boardX * nextScale;
    nodeImageView.y = centerY - boardY * nextScale;
    renderNodeImageView();
  };

  const setNodeDialogViewerState = (state, title, detail = "", mediaType = "diagram") => {
    const showsDiagram = state === "ready" && mediaType === "diagram";
    const showsImage = state === "ready" && mediaType === "image";
    const hasMedia = showsDiagram || showsImage;

    if (hasMedia) nodeDialogMediaType = mediaType;
    if (nodeDialogDiagram) nodeDialogDiagram.hidden = !showsDiagram;
    if (nodeDialogImageViewport) nodeDialogImageViewport.hidden = !showsImage;
    if (nodeDialogPlaceholder) {
      nodeDialogPlaceholder.hidden = hasMedia;
      nodeDialogPlaceholder.classList.toggle("is-loading", state === "loading");
    }
    if (nodeDialogGesture) {
      nodeDialogGesture.hidden = !hasMedia;
      nodeDialogGesture.textContent = showsImage
        ? "Drag to pan · Use − / Fit / + to zoom the research board"
        : "Drag to pan · Use the viewer controls to zoom";
    }
    if (nodeDialogControls) {
      nodeDialogControls.hidden = !hasMedia;
      nodeDialogControls.setAttribute(
        "aria-label",
        showsImage ? "Research board zoom controls" : "Diagram zoom controls",
      );
    }
    if (nodeDialogPlaceholderTitle) nodeDialogPlaceholderTitle.textContent = title;
    if (nodeDialogPlaceholderDetail) nodeDialogPlaceholderDetail.textContent = detail;
  };

  const destroyNodeDialogViewer = () => {
    nodeDialogLoadController?.abort();
    nodeDialogLoadController = null;
    nodeDialogLoadId += 1;

    try {
      nodeDialogViewer?.graph?.destroy?.();
    } catch {
      // The viewer may already have removed its graph while the dialog was closing.
    }

    const viewerToolbar = nodeDialogViewer?.toolbar;
    if (viewerToolbar?.parentNode && !nodeDialogDiagram?.contains(viewerToolbar)) {
      viewerToolbar.remove();
    }

    nodeDialogViewer = null;
    nodeDialogMediaType = null;
    nodeDialogDiagram?.replaceChildren();
    nodeDialogDiagram?.removeAttribute("data-mxgraph");
    nodeDialogImageStage?.replaceChildren();
    if (nodeDialogImageStage) {
      nodeDialogImageStage.style.removeProperty("--node-image-columns");
      nodeDialogImageStage.style.removeProperty("transform");
    }
    nodeDialogImageViewport?.classList.remove("is-dragging");
    nodeImageView.scale = 1;
    nodeImageView.x = 0;
    nodeImageView.y = 0;
    nodeImageView.pointerId = null;
  };

  const loadNodeDiagram = async (source, title, expectedFile) => {
    if (!nodeDialogDiagram) return;

    destroyNodeDialogViewer();
    const loadId = nodeDialogLoadId;
    const controller = new AbortController();
    nodeDialogLoadController = controller;

    setNodeDialogViewerState("loading", "Loading diagram", expectedFile);

    if (!source) {
      setNodeDialogViewerState(
        "missing",
        "No diagram added yet",
        "Add a .drawio asset to this visual node.",
      );
      return;
    }

    try {
      const response = await fetch(source, { signal: controller.signal });
      if (response.status === 404) {
        setNodeDialogViewerState(
          "missing",
          "No diagram added yet",
          `Add ${expectedFile} to render it here.`,
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`The diagram request returned ${response.status}.`);
      }

      const xml = await response.text();
      const xmlDocument = new DOMParser().parseFromString(xml, "application/xml");
      const rootName = xmlDocument.documentElement?.localName;
      const hasParseError = xmlDocument.querySelector("parsererror");

      if (hasParseError || !["mxfile", "mxGraphModel"].includes(rootName)) {
        throw new Error("This file is not valid draw.io XML.");
      }
      if (loadId !== nodeDialogLoadId || !nodeDialog?.open) return;
      if (typeof window.GraphViewer?.createViewerForElement !== "function") {
        throw new Error("The draw.io viewer could not be loaded. Reload while online.");
      }

      nodeDialogDiagram.style.width = "100%";
      nodeDialogDiagram.style.height = "100%";
      nodeDialogDiagram.setAttribute("aria-label", `${title} interactive draw.io diagram`);
      nodeDialogDiagram.setAttribute(
        "data-mxgraph",
        JSON.stringify({
          xml,
          toolbar: "pages layers",
          "toolbar-position": "inline",
          "auto-fit": true,
          "allow-zoom-in": true,
          "check-visible-state": false,
          center: true,
          resize: false,
          lightbox: false,
          nav: true,
          border: 24,
          "dark-mode": "light",
          title,
        }),
      );

      // The canvas must be measurable before draw.io calculates its fit scale.
      nodeDialogDiagram.hidden = false;
      nodeDialogPlaceholder.hidden = true;

      window.GraphViewer.createViewerForElement(nodeDialogDiagram, (viewer) => {
        if (loadId !== nodeDialogLoadId || !nodeDialog?.open) {
          viewer.graph?.destroy?.();
          viewer.toolbar?.remove?.();
          return;
        }

        nodeDialogViewer = viewer;
        nodeDialogLoadController = null;
        nodeDialogDiagram.removeAttribute("data-mxgraph");
        setNodeDialogViewerState(
          "ready",
          "Interactive diagram ready",
          "Drag to pan and use the viewer controls to zoom.",
        );
      });
    } catch (error) {
      if (error.name === "AbortError" || loadId !== nodeDialogLoadId) return;
      setNodeDialogViewerState(
        "error",
        "Couldn’t open diagram",
        error.message || "Check the draw.io file and try again.",
      );
    }
  };

  const loadNodeImages = (items) => {
    if (!nodeDialogImageStage || !nodeDialogImageViewport) return;

    destroyNodeDialogViewer();
    const loadId = nodeDialogLoadId;
    const assetCount = items.length;
    setNodeDialogViewerState(
      "loading",
      assetCount === 1 ? "Loading research figure" : "Loading research board",
      `${assetCount} image asset${assetCount === 1 ? "" : "s"}`,
      "image",
    );

    const columns = assetCount > 1 ? 2 : 1;
    nodeDialogImageStage.style.setProperty("--node-image-columns", String(columns));

    const imageLoads = items.map((item) => {
      const card = document.createElement("figure");
      card.className = "node-dialog-image-card";

      const image = document.createElement("img");
      image.alt = item.alt;
      image.draggable = false;

      const caption = document.createElement("figcaption");
      const label = document.createElement("span");
      label.textContent = item.label;
      caption.append(label);

      card.append(image, caption);
      nodeDialogImageStage.append(card);

      return new Promise((resolve) => {
        image.onload = () => {
          image.onload = null;
          image.onerror = null;
          card.style.setProperty(
            "--node-image-card-width",
            `${Math.min(960, Math.max(320, image.naturalWidth))}px`,
          );
          resolve(true);
        };
        image.onerror = () => {
          image.onload = null;
          image.onerror = null;
          card.classList.add("has-error");
          image.remove();
          label.textContent = `${item.label} · Couldn’t load ${item.file}`;
          resolve(false);
        };
        image.src = item.source;
      });
    });

    Promise.all(imageLoads).then((results) => {
      if (loadId !== nodeDialogLoadId || !nodeDialog?.open) return;

      const loadedCount = results.filter(Boolean).length;
      if (!loadedCount) {
        setNodeDialogViewerState(
          "error",
          "Couldn’t open research figures",
          "Check the image assets listed in the details and try again.",
          "image",
        );
        return;
      }

      setNodeDialogViewerState(
        "ready",
        assetCount === 1 ? "Research figure ready" : "Research board ready",
        `${loadedCount} of ${assetCount} image assets loaded.`,
        "image",
      );
      requestAnimationFrame(fitNodeImageBoard);
    });
  };

  nodeDialog?.querySelector("[data-node-dialog-zoom-out]")?.addEventListener("click", () => {
    if (nodeDialogMediaType === "image") {
      zoomNodeImageBoard(0.8);
      return;
    }
    nodeDialogViewer?.graph?.zoomOut();
    if (nodeDialogViewer && nodeDialogDiagram) nodeDialogDiagram.style.overflow = "auto";
  });

  nodeDialog?.querySelector("[data-node-dialog-zoom-in]")?.addEventListener("click", () => {
    if (nodeDialogMediaType === "image") {
      zoomNodeImageBoard(1.25);
      return;
    }
    nodeDialogViewer?.graph?.zoomIn();
    if (nodeDialogViewer && nodeDialogDiagram) nodeDialogDiagram.style.overflow = "auto";
  });

  nodeDialog?.querySelector("[data-node-dialog-fit]")?.addEventListener("click", () => {
    if (nodeDialogMediaType === "image") {
      fitNodeImageBoard();
      return;
    }

    const graph = nodeDialogViewer?.graph;
    const initialView = graph?.initialViewState;
    if (!graph || !initialView) return;

    graph.view.scaleAndTranslate(
      initialView.scale,
      initialView.translate.x,
      initialView.translate.y,
    );
    if (nodeDialogDiagram) nodeDialogDiagram.style.overflow = "hidden";
  });

  nodeDialogImageViewport?.addEventListener("pointerdown", (event) => {
    if (nodeDialogMediaType !== "image" || (event.button !== 0 && event.pointerType === "mouse")) {
      return;
    }

    event.preventDefault();
    nodeImageView.pointerId = event.pointerId;
    nodeImageView.pointerX = event.clientX;
    nodeImageView.pointerY = event.clientY;
    nodeImageView.originX = nodeImageView.x;
    nodeImageView.originY = nodeImageView.y;
    nodeDialogImageViewport.setPointerCapture(event.pointerId);
    nodeDialogImageViewport.classList.add("is-dragging");
  });

  nodeDialogImageViewport?.addEventListener("pointermove", (event) => {
    if (event.pointerId !== nodeImageView.pointerId) return;

    nodeImageView.x = nodeImageView.originX + event.clientX - nodeImageView.pointerX;
    nodeImageView.y = nodeImageView.originY + event.clientY - nodeImageView.pointerY;
    renderNodeImageView();
  });

  const endNodeImageDrag = (event) => {
    if (event.pointerId !== nodeImageView.pointerId) return;
    nodeImageView.pointerId = null;
    nodeDialogImageViewport?.classList.remove("is-dragging");
  };

  nodeDialogImageViewport?.addEventListener("pointerup", endNodeImageDrag);
  nodeDialogImageViewport?.addEventListener("pointercancel", endNodeImageDrag);

  const getNodeImageItems = (node) => {
    const items = [...node.querySelectorAll("[data-node-image-item]")].map((item) => {
      const source = item.dataset.imageSrc || "";
      return {
        source,
        file: source.replace(/^\.\//, ""),
        label: item.dataset.imageLabel || "Research figure",
        alt: item.dataset.imageAlt || item.dataset.imageLabel || "Research figure",
      };
    });

    if (!items.length && node.dataset.nodeImage) {
      const source = node.dataset.nodeImage;
      items.push({
        source,
        file: source.replace(/^\.\//, ""),
        label: node.dataset.nodeImageLabel || node.dataset.nodeTitle || "Research figure",
        alt: node.dataset.nodeImageAlt || node.dataset.nodeDescription || "Research figure",
      });
    }

    return items.filter((item) => item.source);
  };

  document.querySelectorAll("[data-visual-node]").forEach((node) => {
    node.addEventListener("click", () => {
      if (!nodeDialog || typeof nodeDialog.showModal !== "function") return;

      const title = node.dataset.nodeTitle || "Visual node";
      const description = node.dataset.nodeDescription || "";
      const diagramSource = node.dataset.nodeDiagram || "";
      const imageItems = getNodeImageItems(node);
      const expectedFile = diagramSource.replace(/^\.\//, "") || "assets/node.drawio";

      if (nodeDialogIndex) nodeDialogIndex.textContent = node.dataset.nodeIndex || "Node";
      if (nodeDialogTitle) nodeDialogTitle.textContent = title;
      if (nodeDialogDescription) nodeDialogDescription.textContent = description;
      if (nodeDialogAssetLabel) {
        nodeDialogAssetLabel.textContent = imageItems.length
          ? `Image asset${imageItems.length === 1 ? "" : "s"}`
          : "Draw.io asset";
      }
      if (nodeDialogFile) {
        nodeDialogFile.textContent = imageItems.length
          ? imageItems.map((item) => item.file).join("\n")
          : expectedFile;
      }

      nodeDialog.showModal();
      document.body.classList.add("is-locked");
      if (imageItems.length) {
        loadNodeImages(imageItems);
      } else {
        loadNodeDiagram(diagramSource, title, expectedFile);
      }
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
    destroyNodeDialogViewer();
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

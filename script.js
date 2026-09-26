    const fontStylesheet = document.getElementById("googleFonts");
    if (fontStylesheet) fontStylesheet.rel = "stylesheet";

    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    root.dataset.theme = "dark";
    try {
      localStorage.removeItem("devion-theme");
    } catch (_) { }

    function updateThemeButton() {
      const light = root.dataset.theme === "light";
      themeToggle.querySelector(".theme-icon").textContent = light ? "☀" : "☾";
      themeToggle.querySelector(".theme-label").textContent = light ? "Dark" : "Light";
      themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    }
    updateThemeButton();

    themeToggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      updateThemeButton();
    });

    document.getElementById("year").textContent = new Date().getFullYear();


    // Responsive mobile navigation
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    if (menuToggle && navLinks) {
      menuToggle.addEventListener("click", () => {
        const open = navLinks.classList.toggle("nav-open");
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      });
      navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
        navLinks.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
      }));
    }

    // Live digital clock
    const digitalClock = document.getElementById("digitalClock");
    const clockTime = digitalClock.querySelector(".clock-time");
    const clockDate = digitalClock.querySelector(".clock-date");

    const clockPositionKey = "devion-clock-position";
    let clockDrag = null;

    function clampClockPosition(left, top) {
      const maxLeft = Math.max(0, window.innerWidth - digitalClock.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - digitalClock.offsetHeight);
      return {
        left: Math.min(Math.max(0, left), maxLeft),
        top: Math.min(Math.max(0, top), maxTop)
      };
    }

    function setClockPosition(left, top) {
      const position = clampClockPosition(left, top);
      digitalClock.style.left = `${position.left}px`;
      digitalClock.style.top = `${position.top}px`;
      digitalClock.style.right = "auto";
    }

    try {
      const savedPosition = JSON.parse(localStorage.getItem(clockPositionKey) || "null");
      if (Number.isFinite(savedPosition?.left) && Number.isFinite(savedPosition?.top)) {
        setClockPosition(savedPosition.left, savedPosition.top);
      }
    } catch (_) { }

    digitalClock.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      const bounds = digitalClock.getBoundingClientRect();
      clockDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: bounds.left,
        top: bounds.top,
        moved: false
      };
      digitalClock.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    digitalClock.addEventListener("pointermove", event => {
      if (!clockDrag || event.pointerId !== clockDrag.pointerId) return;
      const deltaX = event.clientX - clockDrag.startX;
      const deltaY = event.clientY - clockDrag.startY;
      if (!clockDrag.moved && Math.hypot(deltaX, deltaY) < 3) return;
      clockDrag.moved = true;
      digitalClock.classList.add("clock-dragging");
      setClockPosition(clockDrag.left + deltaX, clockDrag.top + deltaY);
    });

    function finishClockDrag(event) {
      if (!clockDrag || event.pointerId !== clockDrag.pointerId) return;
      const moved = clockDrag.moved;
      clockDrag = null;
      digitalClock.classList.remove("clock-dragging");
      if (!moved) return;
      const bounds = digitalClock.getBoundingClientRect();
      try {
        localStorage.setItem(clockPositionKey, JSON.stringify({ left: bounds.left, top: bounds.top }));
      } catch (_) { }
    }

    digitalClock.addEventListener("pointerup", finishClockDrag);
    digitalClock.addEventListener("pointercancel", finishClockDrag);
    window.addEventListener("resize", () => {
      if (digitalClock.style.left) {
        const bounds = digitalClock.getBoundingClientRect();
        setClockPosition(bounds.left, bounds.top);
      }
    });

    function updateClock() {
      const now = new Date();
      clockTime.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      clockDate.textContent = now.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).toUpperCase();
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Pause decorative wallpaper motion during mobile scrolls so the browser
    // can prioritize page movement, then resume at scrollend when supported.
    let scrollIdleTimer;
    if (window.matchMedia("(max-width: 700px)").matches) {
      const resumeWallpaper = () => {
        clearTimeout(scrollIdleTimer);
        document.body.classList.remove("is-scrolling");
      };
      const supportsScrollEnd = "onscrollend" in document;
      if (supportsScrollEnd) {
        document.addEventListener("scrollend", resumeWallpaper, { passive: true });
      }
      window.addEventListener("scroll", () => {
        document.body.classList.add("is-scrolling");
        if (!supportsScrollEnd) {
          clearTimeout(scrollIdleTimer);
          scrollIdleTimer = setTimeout(resumeWallpaper, 60);
        }
      }, { passive: true });
    }

    // Startup terminal sequence: system ready -> developer online.......... -> welcome to devion
    const bootScreen = document.getElementById("bootScreen");
    const bootText = document.getElementById("bootText");
    const bootStatus = document.getElementById("bootStatus");
    const bootLines = [
      ["system ready", "Core interface initialized."],
      ["developer online..........", "Connection established."],
      ["welcome to devion", "Entering portfolio."]
    ];

    let lineIndex = 0;
    let charIndex = 0;

    function typeBootLine() {
      if (lineIndex >= bootLines.length) {
        bootStatus.textContent = "Launching Devion...";
        setTimeout(() => {
          bootScreen.classList.add("boot-complete");
          document.body.classList.add("site-ready");
        }, 180);
        return;
      }

      const [line, status] = bootLines[lineIndex];
      if (charIndex < line.length) {
        bootText.textContent += line[charIndex++];
        setTimeout(typeBootLine, 45);
      } else {
        bootStatus.textContent = status;
        lineIndex++;
        charIndex = 0;
        setTimeout(() => {
          bootText.textContent = "";
          typeBootLine();
        }, 500);
      }
    }

    // The script is at the end of the document, so start without waiting for
    // remote fonts or other resources to finish loading.
    setTimeout(typeBootLine, 0);

    // Section reveal animation
    const revealItems = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02 });

    revealItems.forEach(item => observer.observe(item));
  

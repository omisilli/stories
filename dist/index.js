/*
 * stories — Instagram-like stories, from markup.
 *
 *   <button data-pg-stories-open="ada"><img src="ada.jpg" alt=""> ada</button>
 *   <button data-pg-stories-open="mert">…</button>
 *
 *   <div data-pg-stories hidden>
 *       <div data-pg-stories-user="ada" data-pg-stories-name="ada" data-pg-stories-avatar="ada.jpg">
 *           <div data-pg-stories-item data-pg-stories-time="2h"><img src="1.jpg" alt=""></div>
 *           <div data-pg-stories-item><video src="2.mp4" muted playsinline></video></div>
 *           <div data-pg-stories-item data-pg-stories-duration="8000">…any HTML…</div>
 *       </div>
 *       <div data-pg-stories-user="mert" …>…</div>
 *   </div>
 *
 * A click on data-pg-stories-open="<user>" opens the viewer on that user;
 * the users after it in the same data-pg-stories group follow. The viewer is
 * built here, on <body>, from copies of the items — the page's own markup is
 * never touched, so React may render it.
 *
 * In the viewer:
 *   - A bar per story fills as it plays: an image or HTML for
 *     data-pg-stories-duration ms (on the item, or the group; default 5000),
 *     a video for its own length. It waits while a picture or video loads.
 *   - Tap the right two-thirds: the next story; the left third: the one
 *     before. Hold anywhere: paused, while held (the bars and header hide).
 *   - Drag sideways: to the next or previous user, on a 3D cube —
 *     --pg-stories-transition: cube (default) · slide · fade, in CSS.
 *     With reduced motion, fade.
 *   - Drag down, Escape or the ×: closed. The arrow keys go on and back.
 *   - Videos play muted; the speaker turns the sound on for all of them.
 *   - A user whose last story was seen gets data-pg-stories-seen="true" on
 *     their data-pg-stories-open buttons — kept in this browser.
 *
 * While it is open the page does not scroll (index.css; with Lenis, give it
 * autoToggle: true). Focus goes to the viewer, and back to the button that
 * opened it.
 */
const OPEN = "data-pg-stories-open";
const GROUP = "data-pg-stories";
const USER = "data-pg-stories-user";
const ITEM = "data-pg-stories-item";
const SEEN = "data-pg-stories-seen";
const DEFAULT_DURATION = 5000;
const SEEN_KEY = "pg-stories-seen";
const HOLD = 220;
/* ---------- Seen, kept in this browser ---------- */
function seenSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
    }
    catch {
        return new Set();
    }
}
function markSeen(id) {
    const set = seenSet();
    if (set.has(id))
        return;
    set.add(id);
    try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
    }
    catch {
        // Private mode, or storage full: seen for this visit only.
    }
    paintSeen();
}
function paintSeen() {
    const set = seenSet();
    document.querySelectorAll(`[${OPEN}]`).forEach((el) => {
        const value = String(set.has(el.getAttribute(OPEN) || ""));
        if (el.getAttribute(SEEN) !== value)
            el.setAttribute(SEEN, value);
    });
}
/* ---------- Small helpers ---------- */
function el(tag, attrs = {}) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs))
        node.setAttribute(k, v);
    return node;
}
function reducedMotion() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function usersOf(group) {
    const groupDuration = Number(group.getAttribute("data-pg-stories-duration")) || DEFAULT_DURATION;
    return [...group.querySelectorAll(`[${USER}]`)].map((source) => ({
        id: source.getAttribute(USER) || "",
        name: source.getAttribute("data-pg-stories-name") || source.getAttribute(USER) || "",
        avatar: source.getAttribute("data-pg-stories-avatar") || "",
        source,
        items: [...source.querySelectorAll(`[${ITEM}]`)],
        duration: Number(source.getAttribute("data-pg-stories-duration")) || groupDuration,
    }));
}
const SOUND_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function buildFace(user, label) {
    const root = el("section", { "data-pg-stories-face": "", "aria-label": label });
    const barsBox = el("div", { "data-pg-stories-bars": "", "aria-hidden": "true" });
    const bars = user.items.map(() => {
        const bar = el("span", { "data-pg-stories-bar": "" });
        barsBox.append(bar);
        return bar;
    });
    const head = el("header", { "data-pg-stories-head": "" });
    if (user.avatar) {
        const img = el("img", { src: user.avatar, alt: "", "data-pg-stories-head-avatar": "" });
        head.append(img);
    }
    const name = el("span", { "data-pg-stories-head-name": "" });
    name.textContent = user.name;
    const time = el("span", { "data-pg-stories-head-time": "" });
    head.append(name, time);
    const sound = el("button", { type: "button", "data-pg-stories-sound": "", "aria-label": "Sound on" });
    sound.innerHTML = SOUND_OFF;
    const close = el("button", { type: "button", "data-pg-stories-close": "", "aria-label": "Close stories" });
    close.innerHTML = CLOSE;
    head.append(sound, close);
    const box = el("div", { "data-pg-stories-slides": "" });
    const slides = user.items.map((item) => {
        const slide = el("div", { "data-pg-stories-slide": "", "data-pg-stories-active": "false" });
        const time = item.getAttribute("data-pg-stories-time");
        if (time)
            slide.setAttribute("data-pg-stories-time", time);
        const duration = item.getAttribute("data-pg-stories-duration");
        if (duration)
            slide.setAttribute("data-pg-stories-duration", duration);
        for (const child of item.childNodes)
            slide.append(child.cloneNode(true));
        // Videos here are played by the viewer, not by themselves.
        slide.querySelectorAll("video").forEach((v) => {
            v.muted = true;
            v.playsInline = true;
            v.autoplay = false;
            v.loop = false;
            v.preload = "metadata";
            v.removeAttribute("controls");
        });
        box.append(slide);
        return slide;
    });
    root.append(box, barsBox, head);
    return { root, bars, slides, sound };
}
/* The only open viewer, if any. */
let viewer = null;
function openViewer(users, start, opener) {
    viewer?.close(true);
    if (!users.length || !users[start])
        return;
    const root = el("div", {
        "data-pg-stories-viewer": "",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Stories",
        "data-pg-stories-state": "opening",
    });
    const stage = el("div", { "data-pg-stories-stage": "" });
    const cube = el("div", { "data-pg-stories-cube": "" });
    stage.append(cube);
    root.append(stage);
    document.body.append(root);
    const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
    const transition = () => {
        if (reducedMotion())
            return "fade";
        const t = css("--pg-stories-transition");
        return t === "slide" || t === "fade" ? t : "cube";
    };
    let u = start; // user
    let s = 0; // story
    let faces = [null, null, null]; // prev, current, next
    let elapsed = 0;
    let last = 0;
    let held = false;
    let frame = 0;
    let muted = true;
    let closed = false;
    let turning = false;
    // ---- Faces: the current user, and one each side for the cube ----
    const layout = () => {
        root.style.setProperty("--pg-stories-half", `${stage.clientWidth / 2}px`);
        root.setAttribute("data-pg-stories-transition", transition());
        cube.replaceChildren();
        faces = [u - 1, u, u + 1].map((i, k) => {
            if (!users[i])
                return null;
            const face = buildFace(users[i], users[i].name);
            face.root.setAttribute("data-pg-stories-side", ["prev", "current", "next"][k]);
            // The first story of each face shows, so the cube turns onto a
            // picture, not black: a video there loads its first frame.
            face.slides[0].setAttribute("data-pg-stories-active", "true");
            const first = face.slides[0].querySelector("video");
            if (first)
                first.preload = "auto";
            cube.append(face.root);
            return face;
        });
        cube.style.transform = "";
        cube.style.transition = "";
    };
    const current = () => faces[1];
    // ---- One story shown ----
    const media = () => {
        const slide = current().slides[s];
        return slide?.querySelector("video") || slide?.querySelector("img") || null;
    };
    const show = () => {
        const face = current();
        face.slides.forEach((slide, i) => {
            const on = i === s;
            slide.setAttribute("data-pg-stories-active", String(on));
            const video = slide.querySelector("video");
            if (!video)
                return;
            if (on) {
                video.muted = muted;
                video.currentTime = 0;
                video.play().catch(() => { });
            }
            else {
                video.pause();
            }
        });
        face.bars.forEach((bar, i) => bar.style.setProperty("--pg-stories-progress", i < s ? "1" : "0"));
        const time = face.slides[s].getAttribute("data-pg-stories-time") || "";
        const timeBox = face.root.querySelector("[data-pg-stories-head-time]");
        if (timeBox)
            timeBox.textContent = time;
        const hasVideo = !!face.slides[s].querySelector("video");
        face.sound.hidden = !hasVideo;
        elapsed = 0;
        // Load the next one in the meantime.
        const next = face.slides[s + 1]?.querySelector("video");
        if (next)
            next.preload = "auto";
        if (s === face.slides.length - 1)
            markSeen(users[u].id);
    };
    const durationOf = () => {
        const own = Number(current().slides[s].getAttribute("data-pg-stories-duration"));
        return own || users[u].duration;
    };
    // ---- The clock: fills the bar, moves on ----
    const tick = (now) => {
        frame = requestAnimationFrame(tick);
        const dt = last ? now - last : 0;
        last = now;
        if (closed || turning)
            return;
        const face = current();
        const m = media();
        let progress;
        if (m instanceof HTMLVideoElement) {
            if (held || document.hidden) {
                if (!m.paused)
                    m.pause();
                return;
            }
            if (m.paused && !m.ended && m.readyState >= 2)
                m.play().catch(() => { });
            progress = m.duration ? m.currentTime / m.duration : 0;
            if (m.ended)
                progress = 1;
        }
        else {
            // A picture counts once it is there.
            const waiting = m instanceof HTMLImageElement && !m.complete;
            if (!held && !document.hidden && !waiting)
                elapsed += dt;
            progress = elapsed / durationOf();
        }
        face.bars[s]?.style.setProperty("--pg-stories-progress", String(Math.min(1, progress)));
        if (progress >= 1)
            next();
    };
    // ---- Moving on ----
    const next = () => {
        if (s < current().slides.length - 1) {
            s++;
            show();
        }
        else if (users[u + 1]) {
            turn(1);
        }
        else {
            close();
        }
    };
    const prev = () => {
        if (s > 0) {
            s--;
            show();
        }
        else if (users[u - 1]) {
            turn(-1);
        }
        else {
            show(); // the first story again, from its start
        }
    };
    // ---- From user to user: cube, slide or fade ----
    const width = () => stage.clientWidth;
    const pose = (offset) => {
        // offset: -1 … 1 of a turn; negative goes on to the next user.
        // The faces are placed by index.css around the cube's centre, half
        // a width behind the screen; turning it is turning that centre.
        const t = transition();
        if (t === "cube")
            return `translateZ(calc(var(--pg-stories-half) * -1)) rotateY(${offset * -90}deg)`;
        if (t === "slide")
            return `translateX(${offset * -100}%)`;
        return "";
    };
    const turn = (dir, from = 0) => {
        if (turning || !users[u + dir])
            return;
        turning = true;
        current().slides.forEach((slide) => slide.querySelector("video")?.pause());
        const t = transition();
        const done = () => {
            u += dir;
            s = 0;
            layout();
            show();
            turning = false;
            if (t === "fade") {
                cube.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
            }
        };
        if (t === "fade") {
            cube.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-in" }).finished.then(done, done);
            return;
        }
        cube.style.transition = "none";
        cube.style.transform = pose(from);
        void cube.offsetWidth;
        cube.style.transition = `transform ${Math.round(420 * (1 - Math.abs(from)) + 120)}ms cubic-bezier(0.25, 0.8, 0.3, 1)`;
        cube.style.transform = pose(dir);
        let finished = false;
        const end = () => {
            if (finished)
                return;
            finished = true;
            done();
        };
        cube.addEventListener("transitionend", end, { once: true });
        setTimeout(end, 700);
    };
    // ---- Pointer: tap, hold, drag sideways, drag down ----
    let down = null;
    let holdTimer = 0;
    const onDown = (e) => {
        if (turning || e.button > 0)
            return;
        if (e.target.closest("button, a, input, textarea, select"))
            return;
        down = { x: e.clientX, y: e.clientY, t: performance.now(), axis: "", id: e.pointerId };
        stage.setPointerCapture(e.pointerId);
        holdTimer = window.setTimeout(() => {
            held = true;
            root.setAttribute("data-pg-stories-held", "true");
        }, HOLD);
    };
    const onMove = (e) => {
        if (!down || e.pointerId !== down.id)
            return;
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (!down.axis && Math.hypot(dx, dy) > 8) {
            down.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            clearTimeout(holdTimer);
            held = true; // nothing plays on while it is dragged
        }
        if (down.axis === "x" && transition() !== "fade") {
            let offset = -dx / width();
            // No user that way: it gives a little, then stops.
            if ((offset > 0 && !users[u + 1]) || (offset < 0 && !users[u - 1]))
                offset *= 0.15;
            cube.style.transition = "none";
            cube.style.transform = pose(Math.max(-1, Math.min(1, offset)));
        }
        else if (down.axis === "y" && dy > 0) {
            stage.style.transition = "none";
            stage.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy / 2000, 0.15)})`;
            root.style.setProperty("--pg-stories-drag", String(Math.min(dy / 400, 1)));
        }
    };
    const onUp = (e) => {
        if (!down || e.pointerId !== down.id)
            return;
        clearTimeout(holdTimer);
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        const dt = Math.max(1, performance.now() - down.t);
        const axis = down.axis;
        const wasHeld = root.getAttribute("data-pg-stories-held") === "true";
        down = null;
        held = false;
        root.setAttribute("data-pg-stories-held", "false");
        last = 0;
        if (axis === "x") {
            const offset = -dx / width();
            const fast = Math.abs(dx) / dt > 0.5;
            const dir = offset > 0 ? 1 : -1;
            if ((Math.abs(offset) > 0.25 || fast) && users[u + dir]) {
                turn(dir, transition() === "fade" ? 0 : Math.max(-1, Math.min(1, offset)));
            }
            else if (transition() !== "fade") {
                cube.style.transition = "transform 260ms cubic-bezier(0.25, 0.8, 0.3, 1)";
                cube.style.transform = pose(0);
            }
            return;
        }
        if (axis === "y") {
            if (dy > 120 || (dy > 30 && dy / dt > 0.6))
                return close();
            stage.style.transition = "transform 220ms ease-out";
            stage.style.transform = "";
            root.style.setProperty("--pg-stories-drag", "0");
            return;
        }
        // A tap, not a hold: back on the left third, on otherwise.
        if (!wasHeld) {
            const box = stage.getBoundingClientRect();
            if (e.clientX - box.left < box.width / 3)
                prev();
            else
                next();
        }
    };
    // ---- Buttons and keys ----
    const onClick = (e) => {
        const target = e.target;
        if (target.closest("[data-pg-stories-close]"))
            return close();
        const sound = target.closest("[data-pg-stories-sound]");
        if (sound) {
            muted = !muted;
            const v = current().slides[s].querySelector("video");
            if (v)
                v.muted = muted;
            document.querySelectorAll("[data-pg-stories-sound]").forEach((b) => {
                b.innerHTML = muted ? SOUND_OFF : SOUND_ON;
                b.setAttribute("aria-label", muted ? "Sound on" : "Sound off");
            });
            return;
        }
        // A click on the dark around the card closes it.
        if (target === root)
            close();
    };
    const onKey = (e) => {
        if (e.key === "Escape")
            return close();
        if (e.key === "ArrowRight")
            return next();
        if (e.key === "ArrowLeft")
            return prev();
        if (e.key === "Tab") {
            // Focus stays in the viewer.
            const items = [...root.querySelectorAll("button:not([hidden]), a[href]")].filter((n) => current().root.contains(n));
            if (!items.length)
                return;
            const i = items.indexOf(document.activeElement);
            e.preventDefault();
            items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
        }
    };
    // ---- Closing ----
    const onResize = () => {
        root.style.setProperty("--pg-stories-half", `${stage.clientWidth / 2}px`);
    };
    const close = (instant = false) => {
        if (closed)
            return;
        closed = true;
        removeEventListener("resize", onResize);
        cancelAnimationFrame(frame);
        clearTimeout(holdTimer);
        root.querySelectorAll("video").forEach((v) => v.pause());
        document.removeEventListener("keydown", onKey, true);
        root.setAttribute("data-pg-stories-state", "closing");
        const remove = () => {
            root.remove();
            if (viewer === api)
                viewer = null;
            opener?.focus({ preventScroll: true });
        };
        if (instant || reducedMotion())
            return remove();
        root.addEventListener("animationend", remove, { once: true });
        setTimeout(remove, 400);
    };
    const api = { close };
    viewer = api;
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    root.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey, true);
    addEventListener("resize", onResize);
    layout();
    show();
    requestAnimationFrame(() => root.setAttribute("data-pg-stories-state", "open"));
    current().root.querySelector("[data-pg-stories-close]")?.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
}
/* Only the newest call answers clicks — a late cleanup from an older one
   (React remounting) cannot switch it off. Same rule as the other packages. */
let live = null;
/* Start listening; returns the cleanup for a React effect. */
export function initStories() {
    if (typeof document === "undefined")
        return () => { };
    const self = {};
    live = self;
    const onClick = (e) => {
        if (live !== self)
            return;
        const opener = e.target?.closest(`[${OPEN}]`);
        if (!opener)
            return;
        const id = opener.getAttribute(OPEN) || "";
        const source = [...document.querySelectorAll(`[${USER}]`)].find((n) => n.getAttribute(USER) === id);
        const group = source?.closest(`[${GROUP}]`);
        if (!source || !group)
            return;
        e.preventDefault();
        const users = usersOf(group).filter((user) => user.items.length);
        openViewer(users, users.findIndex((user) => user.id === id), opener);
    };
    // Openers rendered later get their seen mark too.
    let pending = 0;
    const mo = new MutationObserver(() => {
        if (pending)
            return;
        pending = requestAnimationFrame(() => {
            pending = 0;
            paintSeen();
        });
    });
    document.addEventListener("click", onClick);
    mo.observe(document.body, { childList: true, subtree: true });
    paintSeen();
    return () => {
        document.removeEventListener("click", onClick);
        mo.disconnect();
        if (pending)
            cancelAnimationFrame(pending);
        if (live === self) {
            live = null;
            viewer?.close(true);
        }
    };
}
/* Open a user's stories from code: openStories("ada"). */
export function openStories(id) {
    const source = [...document.querySelectorAll(`[${USER}]`)].find((n) => n.getAttribute(USER) === id);
    const group = source?.closest(`[${GROUP}]`);
    if (!group)
        return;
    const users = usersOf(group).filter((user) => user.items.length);
    openViewer(users, users.findIndex((user) => user.id === id), null);
}

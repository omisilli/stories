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
 *   - Tap the right 70%: the next story; the left 30%: the one before — a
 *     shade comes in on that side while pressed. Hold anywhere: paused,
 *     while held (the bars and header hide).
 *   - Two layouts, --pg-stories-layout in CSS. carousel (default): the
 *     current user's card in the middle, two each side, smaller, with their
 *     avatar, name and time — press one to bring it to the middle; arrows
 *     by the card, a × in the corner, the site's logo (data-pg-stories-logo
 *     in the group) — from 64rem; below, one card, sliding. cube: one card,
 *     the next user on a 3D cube. Drag sideways in either. With reduced
 *     motion, at once.
 *   - A pause button in the header holds it until pressed again.
 *   - After a user's last story: data-pg-stories-end, on the user or the
 *     group — next (default): the next user, closed after the last one;
 *     close: closed; stay: the next user, and the last one stays open.
 *   - Escape, the × or the browser's Back: closed; on a touch screen, a
 *     drag down too. A click beside the card does nothing — a press that
 *     wanders off the card does not close it. The arrow keys go on and back.
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
/* The left part of a story that goes back; the rest goes on. */
const PREV_ZONE = 0.3;

type End = "next" | "close" | "stay";
const endOf = (el: Element): End | null => {
    const v = el.getAttribute("data-pg-stories-end");
    return v === "next" || v === "close" || v === "stay" ? v : null;
};

/* ---------- Seen, kept in this browser ---------- */

function seenSet(): Set<string> {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") as string[]);
    } catch {
        return new Set();
    }
}

function markSeen(id: string): void {
    const set = seenSet();
    if (set.has(id)) return;
    set.add(id);
    try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
    } catch {
        // Private mode, or storage full: seen for this visit only.
    }
    paintSeen();
}

function paintSeen(): void {
    const set = seenSet();
    document.querySelectorAll<HTMLElement>(`[${OPEN}]`).forEach((el) => {
        const value = String(set.has(el.getAttribute(OPEN) || ""));
        if (el.getAttribute(SEEN) !== value) el.setAttribute(SEEN, value);
    });
}

/* ---------- Small helpers ---------- */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
}

function reducedMotion(): boolean {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------- The viewer ---------- */

type User = {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    source: HTMLElement;
    items: HTMLElement[];
    duration: number;
    end: End;
};

function usersOf(group: Element): User[] {
    const groupDuration = Number(group.getAttribute("data-pg-stories-duration")) || DEFAULT_DURATION;
    const groupEnd = endOf(group) || "next";
    return [...group.querySelectorAll<HTMLElement>(`[${USER}]`)].map((source) => ({
        id: source.getAttribute(USER) || "",
        name: source.getAttribute("data-pg-stories-name") || source.getAttribute(USER) || "",
        avatar: source.getAttribute("data-pg-stories-avatar") || "",
        source,
        items: [...source.querySelectorAll<HTMLElement>(`[${ITEM}]`)],
        duration: Number(source.getAttribute("data-pg-stories-duration")) || groupDuration,
        end: endOf(source) || groupEnd,
        verified: source.hasAttribute("data-pg-stories-verified"),
    }));
}

const SOUND_ON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const SOUND_OFF =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const CLOSE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/* Play and pause, their corners rounded — as a feed's are. */
const PAUSE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="3.6" height="15" rx="1.2" fill="currentColor"/><rect x="14.4" y="4.5" width="3.6" height="15" rx="1.2" fill="currentColor"/></svg>';
const PLAY =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.4-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const CHEVRON_LEFT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_RIGHT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* How the people sit in the viewer — --pg-stories-layout, in CSS. */
type Layout = "carousel" | "cube";

/* One user's card: bars, header, the stories — and, beside the current one
   in the carousel, a preview: their avatar, name and time. */
type Face = {
    root: HTMLElement;
    bars: HTMLElement[];
    slides: HTMLElement[];
    sound: HTMLButtonElement;
    pause: HTMLButtonElement;
};

/* A badge beside a verified account's name: a blue seal, a white tick. */
const VERIFIED = (() => {
    const points: string[] = [];
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 ? 9.2 : 11;
        points.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
    }
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="${points.join(" ")}" fill="#0095f6" stroke="#0095f6" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.6 12.3l3 3 5.8-6.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
})();

/*
 * A story's time. The text written on it (data-pg-stories-time) comes
 * first, so nothing is ever blank; with the moment it was shared
 * (data-pg-stories-at, an ISO date) the viewer counts from then — "now",
 * "5m", "2h", "1d", "3w" — and keeps counting while it is open.
 */
function timeOf(item: Element | undefined, units: string[]): string {
    const written = item?.getAttribute("data-pg-stories-time") || "";
    const at = Date.parse(item?.getAttribute("data-pg-stories-at") || "");
    if (!Number.isFinite(at)) return written;
    const [now, m, h, d, w] = units;
    const minutes = Math.max(0, Math.floor((Date.now() - at) / 60000));
    if (minutes < 1) return now;
    if (minutes < 60) return `${minutes}${m}`;
    if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}${h}`;
    if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / 1440)}${d}`;
    return `${Math.floor(minutes / 10080)}${w}`;
}

const MUSIC =
    '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4h1.6v4H2zM5.2 2h1.6v8H5.2zM8.4 3.5H10v5H8.4z" fill="currentColor"/></svg>';

/* A speech bubble, filled — its tail at the bottom left. */
const TRANSLATE =
    '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 .8a5.2 5.2 0 1 1-2.4 9.8L.8 11.2l.7-2.6A5.2 5.2 0 0 1 6 .8z" fill="currentColor"/></svg>';

/* The words a viewer shows, from the group — in the site's language. */
type Texts = {
    translate: string;
    original: string;
    translation: string;
    reactions: string;
    ago: string[];
    copied: string;
};

function textsOf(group: Element | null): Texts {
    const text = (name: string, fallback: string) => group?.getAttribute(`data-pg-stories-text-${name}`) || fallback;
    return {
        translate: text("translate", "See translation"),
        original: text("original", "Original"),
        translation: text("translation", "Translation"),
        reactions: text("reactions", "Quick reactions"),
        copied: text("copied", "Link copied"),
        // now, minutes, hours, days, weeks — as a feed writes them.
        ago: text("ago", "now m h d w").split(/\s+/),
    };
}

/* A copy of the site's own markup for one person's card: {name} becomes
   their name — in text, and in a placeholder, aria-label, title or value. */
function copyFor(source: Element, user: User): Element {
    const copy = source.cloneNode(true) as Element;
    const named = (value: string) => value.split("{name}").join(user.name);
    [copy, ...copy.querySelectorAll("*")].forEach((node) => {
        for (const attr of ["placeholder", "aria-label", "title", "value"]) {
            const value = node.getAttribute(attr);
            if (value && value.includes("{name}")) node.setAttribute(attr, named(value));
        }
        if (node.hasAttribute("data-pg-stories-footer-name")) node.textContent = user.name;
        for (const text of node.childNodes) {
            if (text.nodeType === 3 && text.textContent?.includes("{name}")) text.textContent = named(text.textContent);
        }
    });
    return copy;
}

/*
 * Loading when its turn comes. A story's pictures and video are held back
 * — their address kept aside — until wake() puts it back: the story shown
 * and the next, the first story of a person waiting beside. Nothing else
 * loads, however many stories there are.
 */
const HELD = "data-pg-stories-held-src";
function hold(slide: HTMLElement): void {
    slide.querySelectorAll<HTMLElement>("img, video, source").forEach((media) => {
        for (const attr of ["src", "srcset"]) {
            const value = media.getAttribute(attr);
            if (value === null) continue;
            media.setAttribute(`${HELD}-${attr}`, value);
            media.removeAttribute(attr);
        }
        if (media instanceof HTMLImageElement) media.loading = "eager";
        if (media instanceof HTMLVideoElement) media.preload = "none";
    });
}
function wake(slide: HTMLElement | undefined): void {
    if (!slide || slide.hasAttribute("data-pg-stories-awake")) return;
    slide.setAttribute("data-pg-stories-awake", "");
    slide.querySelectorAll<HTMLElement>("img, video, source").forEach((media) => {
        for (const attr of ["srcset", "src"]) {
            const value = media.getAttribute(`${HELD}-${attr}`);
            if (value === null) continue;
            media.setAttribute(attr, value);
            media.removeAttribute(`${HELD}-${attr}`);
        }
        if (media instanceof HTMLVideoElement) {
            media.preload = "auto";
            media.load();
        }
    });
}

function buildFace(
    user: User,
    label: string,
    seen: boolean,
    footer: Element | null,
    more: Element | null,
    texts: Texts,
    reactions: string[],
): Face {
    const root = el("section", { "data-pg-stories-face": "", "aria-label": label, "data-pg-stories-for": user.id });
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
    const badge = user.verified ? el("span", { "data-pg-stories-verified": "", role: "img", "aria-label": "Verified" }) : null;
    if (badge) badge.innerHTML = VERIFIED;
    const time = el("span", { "data-pg-stories-head-time": "" });
    // Under the name: the story's music, if it has one — shown, not played.
    const music = el("span", { "data-pg-stories-head-music": "" });
    const who = el("span", { "data-pg-stories-head-who": "" });
    const line = el("span", { "data-pg-stories-head-line": "" });
    line.append(name);
    if (badge) line.append(badge);
    line.append(time);
    // A story with a translation: a line to see it.
    const translate = el("button", { type: "button", "data-pg-stories-translate": "", hidden: "" });
    translate.innerHTML = TRANSLATE;
    translate.append(texts.translate);
    who.append(line, music, translate);
    // Filled now from the first story, not when it starts to play: a card
    // coming to the middle, or turning in on the cube, has its time and
    // music from the first moment.
    const opening = user.items[0];
    time.textContent = timeOf(opening, texts.ago);
    const openingTune = opening?.getAttribute("data-pg-stories-music") || "";
    if (openingTune) {
        music.innerHTML = MUSIC;
        music.append(openingTune);
    }
    music.hidden = !openingTune;
    translate.hidden = !opening?.hasAttribute("data-pg-stories-translation");
    head.append(who);
    const sound = el("button", { type: "button", "data-pg-stories-sound": "", "aria-label": "Sound on" });
    sound.innerHTML = SOUND_OFF;
    const pause = el("button", { type: "button", "data-pg-stories-pause": "", "aria-label": "Pause" });
    pause.innerHTML = PAUSE;
    const close = el("button", { type: "button", "data-pg-stories-close": "", "aria-label": "Close stories" });
    close.innerHTML = CLOSE;
    head.append(sound, pause);
    // The site's "⋯": its own button, and whatever it opens — a menu, a
    // window. Copied into the header, before the ×. While its button says
    // aria-expanded="true", the story holds and the keys are the site's.
    if (more) head.append(copyFor(more, user));
    head.append(close);

    const box = el("div", { "data-pg-stories-slides": "" });
    const slides = user.items.map((item) => {
        const slide = el("div", { "data-pg-stories-slide": "", "data-pg-stories-active": "false" });
        const time = item.getAttribute("data-pg-stories-time");
        if (time) slide.setAttribute("data-pg-stories-time", time);
        const duration = item.getAttribute("data-pg-stories-duration");
        if (duration) slide.setAttribute("data-pg-stories-duration", duration);
        const music = item.getAttribute("data-pg-stories-music");
        if (music) slide.setAttribute("data-pg-stories-music", music);
        const tune = item.getAttribute("data-pg-stories-music-src");
        if (tune) slide.setAttribute("data-pg-stories-music-src", tune);
        for (const name of ["data-pg-stories-original", "data-pg-stories-translation", "data-pg-stories-at", "data-pg-stories-liked"]) {
            const value = item.getAttribute(name);
            if (value !== null) slide.setAttribute(name, value); // a bare one too: liked
        }
        for (const child of item.childNodes) slide.append(child.cloneNode(true));
        // Videos here are played by the viewer, not by themselves.
        slide.querySelectorAll("video").forEach((v) => {
            v.muted = true;
            v.playsInline = true;
            v.autoplay = false;
            v.loop = false;
            v.removeAttribute("controls");
        });
        hold(slide);
        box.append(slide);
        return slide;
    });

    // The preview, shown while the card waits beside the current one.
    const preview = el("div", { "data-pg-stories-preview": "", "aria-hidden": "true" });
    if (seen) preview.setAttribute("data-pg-stories-seen", "true");
    if (user.avatar) {
        const ring = el("span", { "data-pg-stories-preview-ring": "" });
        ring.append(el("img", { src: user.avatar, alt: "" }));
        preview.append(ring);
    }
    const previewName = el("strong", { "data-pg-stories-preview-name": "" });
    previewName.textContent = user.name;
    const previewTime = el("span", { "data-pg-stories-preview-time": "" });
    previewTime.textContent = timeOf(user.items[0], texts.ago);
    preview.append(previewName, previewTime);

    // Darkens the card: turned away on the cube, waiting beside in the carousel.
    const shade = el("div", { "data-pg-stories-shade": "", "aria-hidden": "true" });
    // The speaker only for a video: a card shown beside the current one shows
    // its first story — no speaker unless that is one.
    sound.hidden = !slides[0]?.querySelector("video") && !slides[0]?.hasAttribute("data-pg-stories-music-src");
    root.append(box, barsBox, head, shade, preview);
    // Quick reactions: shown over the story while the footer's box is
    // pressed into and still empty — data-pg-stories-reactions on the group.
    if (reactions.length) {
        const box = el("div", { "data-pg-stories-quick": "" });
        const title = el("strong", {});
        title.textContent = texts.reactions;
        const grid = el("div", { "data-pg-stories-quick-grid": "" });
        for (const reaction of reactions) {
            const button = el("button", { type: "button", "data-pg-stories-reaction": reaction, "aria-label": reaction });
            button.textContent = reaction;
            grid.append(button);
        }
        box.append(title, grid);
        root.append(box);
    }
    // The site's footer — a reply box, a like, a send — copied under each
    // card, the person's name put in for {name}. What it does is the
    // site's: data-pg-stories-for on the card says whose card it is.
    if (footer) root.append(copyFor(footer, user));
    return { root, bars, slides, sound, pause };
}

/*
 * Where the viewer moves the focus itself — its × when it opens, the button
 * that opened it when it closes, a button after the share sheet — it draws
 * no focus ring, by mouse, finger or key alike. Tab still shows the ring
 * on whatever it reaches: that is the browser's, not the viewer's.
 */
function focusing(): FocusOptions {
    return { preventScroll: true, focusVisible: false } as FocusOptions;
}

/* The only open viewer, if any. */
let viewer: { close: (instant?: boolean) => void; notice: (text: string) => void } | null = null;

/* Where each card sits in the carousel, by its distance from the current one. */
const SLOTS: Record<string, string> = { "-2": "prev2", "-1": "prev", "0": "current", "1": "next", "2": "next2" };
/* How dark a card waiting beside the current one is. */
const SIDE_SHADE = 0.35;
/* A carousel move, in ms — as the transition in index.css. */
const MOVE = 350;

/*
 * A story's address: the page's, and after a # which person and which story
 * — #stories=mert/2. A # is never sent to the server nor indexed by search
 * engines: no new page, no copy of this one. Opened, the page goes straight
 * to that story. Only the share button gives it — the address bar stays
 * the page's while stories are watched.
 */
const HASH = /^#stories=([^/]+)(?:\/(\d+))?$/;
function storyAddress(id: string, story: number): string {
    return `${location.pathname}${location.search}#stories=${encodeURIComponent(id)}/${story + 1}`;
}

function openViewer(
    users: User[],
    start: number,
    opener: HTMLElement | null,
    group: Element | null,
    startStory = 0,
    instant = false,
): void {
    viewer?.close(true);
    if (!users.length || !users[start]) return;

    const root = el("div", {
        "data-pg-stories-viewer": "",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Stories",
        "data-pg-stories-state": "opening",
    });
    // Opened from a link: at once, on the cover early.js put up.
    if (instant) root.setAttribute("data-pg-stories-instant", "");
    const stage = el("div", { "data-pg-stories-stage": "" });
    const cube = el("div", { "data-pg-stories-cube": "" });
    // The carousel's arrows, beside the card; the corner × and the site's
    // logo, on a wide screen. Hidden by index.css where they do not belong.
    const back = el("button", { type: "button", "data-pg-stories-arrow": "prev", "aria-label": "Previous story" });
    back.innerHTML = CHEVRON_LEFT;
    const on = el("button", { type: "button", "data-pg-stories-arrow": "next", "aria-label": "Next story" });
    on.innerHTML = CHEVRON_RIGHT;
    stage.append(cube, back, on);
    const corner = el("button", {
        type: "button",
        "data-pg-stories-close": "",
        "data-pg-stories-corner": "",
        "aria-label": "Close stories",
    });
    corner.innerHTML = CLOSE;
    root.append(stage, corner);
    const logo = group?.querySelector("[data-pg-stories-logo]");
    const footer = group?.querySelector("[data-pg-stories-footer]") || null;
    const more = group?.querySelector("[data-pg-stories-more]") || null;
    // A footer takes room under the story on narrow screens (index.css).
    if (footer) root.setAttribute("data-pg-stories-footed", "true");
    const texts = textsOf(group);
    const reactions = (group?.getAttribute("data-pg-stories-reactions") || "").split(/\s+/).filter(Boolean);
    if (logo) {
        const brand = el("div", { "data-pg-stories-brand": "" });
        brand.append(logo.cloneNode(true));
        root.append(brand);
    }
    document.body.append(root);

    const css = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
    const layoutOf = (): Layout => (css("--pg-stories-layout") === "cube" ? "cube" : "carousel");
    let mode: Layout = layoutOf();

    let u = start; // user
    let s = Math.max(0, Math.min(startStory, (users[start]?.items.length || 1) - 1)); // story
    let faces = new Map<number, Face>(); // by user
    let elapsed = 0;
    let last = 0;
    let held = false;
    let paused = false;
    let typing = false;
    let sharing = false; // the system's share sheet is open
    // Where each person was left: back to them, the story left on — not
    // their first again. A person not yet opened starts at their first.
    const visited = new Map<number, number>();
    const resumeAt = (i: number): number => Math.min(visited.get(i) ?? 0, users[i].items.length - 1);
    // Liked stories, while open: "user:story". The first state is the
    // markup's (data-pg-stories-liked, from the CMS).
    const liked = new Set<string>();
    const likedKey = (): string => `${users[u].id}:${s}`;
    const isLiked = (): boolean =>
        liked.has(likedKey()) || (!liked.has(`!${likedKey()}`) && current().slides[s].hasAttribute("data-pg-stories-liked"));
    const paintLike = (): void => {
        current().root.querySelectorAll("[data-pg-stories-like]").forEach((b) => b.setAttribute("aria-pressed", String(isLiked())));
    };
    // One player for the stories' music, the viewer's own.
    const tune = new Audio();
    tune.preload = "auto";
    let tuneOn = false; // the story shown has music
    // The next story's music, fetched ahead so it starts at once.
    const ahead = new Audio();
    ahead.preload = "auto";
    let reading: HTMLElement | null = null; // the translation, open
    let frame = 0;
    let muted = true;
    let closed = false;
    let turning = false;
    let tween = 0;
    let resting = false;

    const current = () => faces.get(u) as Face;
    // The site's "⋯" says it is open: aria-expanded="true" on its button.
    const menuOpen = (): boolean =>
        !!faces.get(u)?.root.querySelector('[data-pg-stories-more] [aria-expanded="true"]');

    // ---- The cards: the current user, and those beside — one each side
    //      for the cube, two for the carousel ----
    const makeFace = (i: number): Face => {
        const face = buildFace(users[i], users[i].name, seenSet().has(users[i].id), footer, more, texts, reactions);
        // The first story of each card shows, so a card beside is a picture,
        // not black: a video there loads its first frame.
        face.slides[0].setAttribute("data-pg-stories-active", "true");
        wake(face.slides[0]);
        face.pause.innerHTML = paused ? PLAY : PAUSE;
        cube.append(face.root);
        return face;
    };

    // Each card to its place, by its distance from the current one.
    const arrange = (): void => {
        faces.forEach((face, i) => {
            const off = i - u;
            if (mode === "cube") {
                face.root.setAttribute("data-pg-stories-side", ["prev", "current", "next"][off + 1] || "gone");
                return;
            }
            face.root.setAttribute("data-pg-stories-side", SLOTS[off] || (off < 0 ? "gone-prev" : "gone-next"));
            face.root.style.setProperty("--pg-stories-shade", off === 0 ? "0" : String(SIDE_SHADE));
        });
    };

    const layout = (): void => {
        mode = layoutOf();
        root.setAttribute("data-pg-stories-layout", mode);
        root.style.setProperty("--pg-stories-half", `${stage.clientWidth / 2}px`);
        cube.replaceChildren();
        cube.style.transition = "";
        cube.style.transform = "";
        faces = new Map();
        const span = mode === "cube" ? 1 : 2;
        for (let i = u - span; i <= u + span; i++) if (users[i]) faces.set(i, makeFace(i));
        arrange();
        if (mode === "cube") place(0);
    };

    // ---- One story shown ----
    const media = (): HTMLVideoElement | HTMLImageElement | null => {
        const slide = current().slides[s];
        return slide?.querySelector("video") || slide?.querySelector("img") || null;
    };

    const show = (): void => {
        // Another story plays from its start, even after the pause button.
        if (paused) setPaused(false);
        const face = current();
        wake(face.slides[s]); // its picture or video, before it plays
        visited.set(u, s);
        face.slides.forEach((slide, i) => {
            const now = i === s;
            slide.setAttribute("data-pg-stories-active", String(now));
            const video = slide.querySelector("video");
            if (!video) return;
            if (now) {
                video.muted = muted;
                video.currentTime = 0;
                if (!paused) video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
        face.bars.forEach((bar, i) => bar.style.setProperty("--pg-stories-progress", i < s ? "1" : "0"));
        const time = timeOf(face.slides[s], texts.ago);
        const timeBox = face.root.querySelector<HTMLElement>("[data-pg-stories-head-time]");
        if (timeBox) timeBox.textContent = time;
        const musicBox = face.root.querySelector<HTMLElement>("[data-pg-stories-head-music]");
        const tuneName = face.slides[s].getAttribute("data-pg-stories-music") || "";
        if (musicBox) {
            musicBox.innerHTML = tuneName ? MUSIC : "";
            musicBox.append(tuneName);
            musicBox.hidden = !tuneName;
        }
        const translateButton = face.root.querySelector<HTMLElement>("[data-pg-stories-translate]");
        if (translateButton) translateButton.hidden = !face.slides[s].hasAttribute("data-pg-stories-translation");
        const hasVideo = !!face.slides[s].querySelector("video");
        // The story's music: from its start, as the story starts; muted
        // until the speaker is pressed, as a video is.
        const tuneSrc = face.slides[s].getAttribute("data-pg-stories-music-src") || "";
        tuneOn = !!tuneSrc;
        if (tuneSrc) {
            if (tune.getAttribute("src") !== tuneSrc) tune.src = tuneSrc;
            tune.currentTime = 0;
            tune.muted = muted;
            if (!paused) tune.play().catch(() => {});
        } else {
            tune.pause();
        }
        face.sound.hidden = !hasVideo && !tuneSrc;
        paintLike();
        // No story before the very first one: no arrow back.
        back.hidden = u === 0 && s === 0;
        elapsed = 0;
        resting = false;
        // The next one in the meantime — its music too.
        wake(face.slides[s + 1]);
        const nextTune = (face.slides[s + 1] || faces.get(u + 1)?.slides[0])?.getAttribute("data-pg-stories-music-src");
        if (nextTune && ahead.getAttribute("src") !== nextTune) ahead.src = nextTune;
        if (s === face.slides.length - 1) markSeen(users[u].id);
    };

    const durationOf = (): number => {
        const own = Number(current().slides[s].getAttribute("data-pg-stories-duration"));
        return own || users[u].duration;
    };

    // ---- The clock: fills the bar, moves on ----
    const tick = (now: number): void => {
        frame = requestAnimationFrame(tick);
        const dt = last ? now - last : 0;
        last = now;
        if (closed || turning) return;
        const face = current();
        const m = media();
        const still = held || paused || typing || sharing || !!reading || menuOpen() || document.hidden;
        // The music holds with the story, and goes on with it.
        if (tuneOn) {
            if (still && !tune.paused) tune.pause();
            else if (!still && tune.paused && !tune.ended && !resting) tune.play().catch(() => {});
        }
        let progress: number;
        if (m instanceof HTMLVideoElement) {
            if (still) {
                if (!m.paused) m.pause();
                return;
            }
            if (m.paused && !m.ended && m.readyState >= 2) m.play().catch(() => {});
            progress = m.duration ? m.currentTime / m.duration : 0;
            if (m.ended) progress = 1;
        } else {
            // A picture counts once it is there.
            const waiting = m instanceof HTMLImageElement && !m.complete;
            if (!still && !waiting) elapsed += dt;
            progress = elapsed / durationOf();
        }
        face.bars[s]?.style.setProperty("--pg-stories-progress", String(Math.min(1, progress)));
        if (progress >= 1 && !resting) {
            const at = s;
            next();
            // Still on the same story: stay keeps it there, bar full.
            if (s === at && !turning && !closed) resting = true;
        }
    };

    // ---- Moving on ----
    // After a user's last story, by the clock or a tap: data-pg-stories-end.
    const next = (): void => {
        if (turning) return;
        if (s < current().slides.length - 1) {
            s++;
            show();
            return;
        }
        const end = users[u].end;
        if (end !== "close" && users[u + 1]) turn(1);
        else if (end !== "stay") close();
        // stay, on the last user: it rests on its last story.
    };
    const prev = (): void => {
        if (turning) return;
        if (s > 0) {
            s--;
            show();
        } else if (users[u - 1]) {
            turn(-1);
        } else {
            show(); // the first story again, from its start
        }
    };

    // ---- From user to user ----
    const width = () => stage.clientWidth;

    // The cube: its faces are placed by index.css around its centre, half a
    // width behind the screen; turning it is turning that centre. offset:
    // -1 … 1 of a turn; positive goes on to the next user.
    const pose = (offset: number): string =>
        `translateZ(calc(var(--pg-stories-half) * -1)) rotateY(${offset * -90}deg)`;

    // The cube at an offset — and its shading: the face turning away
    // darkens, the one coming in comes out of the dark.
    const SHADE = 0.75;
    const place = (offset: number): void => {
        cube.style.transform = pose(offset);
        const away = Math.abs(offset);
        faces.forEach((face, i) => {
            const k = i - u;
            let dark = SHADE;
            if (k === 0) dark = away * SHADE;
            else if ((k === 1 && offset > 0) || (k === -1 && offset < 0)) dark = (1 - away) * SHADE;
            face.root.style.setProperty("--pg-stories-shade", dark.toFixed(3));
        });
    };

    // From one offset to another, frame by frame, easing out.
    const glide = (from: number, to: number, ms: number, done?: () => void): void => {
        cancelAnimationFrame(tween);
        const t0 = performance.now();
        const step = (now: number): void => {
            const t = Math.min(1, (now - t0) / ms);
            const e = 1 - Math.pow(1 - t, 3);
            place(from + (to - from) * e);
            if (t < 1) tween = requestAnimationFrame(step);
            else done?.();
        };
        tween = requestAnimationFrame(step);
    };

    // The carousel: every card moves to its new place at once — the one
    // coming to the middle grows, the one leaving it shrinks to the side
    // (index.css animates both). Cards that come into reach slide in from
    // beyond the edge; those that leave it slide out, then go.
    const slide = (dir: number): void => {
        u += dir;
        s = resumeAt(u);
        for (let i = u - 2; i <= u + 2; i++) {
            if (!users[i] || faces.has(i)) continue;
            const face = makeFace(i);
            face.root.setAttribute("data-pg-stories-side", i < u ? "gone-prev" : "gone-next");
            faces.set(i, face);
        }
        void cube.offsetWidth; // the new cards sit at the edge before they move
        cube.style.transition = "";
        cube.style.transform = "";
        arrange();
        const done = (): void => {
            faces.forEach((face, i) => {
                if (Math.abs(i - u) <= 2) return;
                face.root.remove();
                faces.delete(i);
            });
            turning = false;
            show();
        };
        if (reducedMotion()) return done();
        window.setTimeout(done, MOVE);
    };

    const turn = (dir: number, from = 0): void => {
        if (turning || !users[u + dir]) return;
        turning = true;
        current().slides.forEach((one) => one.querySelector("video")?.pause());
        tuneOn = false;
        tune.pause();
        if (mode === "carousel") return slide(dir);
        const done = () => {
            u += dir;
            s = resumeAt(u);
            layout();
            show();
            turning = false;
        };
        if (reducedMotion()) return done();
        glide(from, dir, Math.round(480 * (1 - Math.abs(from)) + 160), done);
    };

    // ---- Pointer: tap, hold, drag sideways, drag down — and, in the
    //      carousel, a card beside pressed to bring it to the middle ----
    let down: {
        x: number;
        y: number;
        t: number;
        axis: "" | "x" | "y";
        id: number;
        touch: boolean;
        side: number;
    } | null = null;
    let holdTimer = 0;

    const onDown = (e: PointerEvent): void => {
        // The site's "⋯" open: a press beside it only closes it (the site's).
        if (turning || e.button > 0 || menuOpen()) return;
        const target = e.target as Element;
        if (target.closest("button, a, input, textarea, select, [data-pg-stories-quick], [data-pg-stories-more]")) return;
        const faceRoot = target.closest("[data-pg-stories-face]");
        let side = 0;
        faces.forEach((face, i) => {
            if (face.root === faceRoot) side = i - u;
        });
        down = { x: e.clientX, y: e.clientY, t: performance.now(), axis: "", id: e.pointerId, touch: e.pointerType !== "mouse", side };
        stage.setPointerCapture(e.pointerId);
        if (side) return; // a card beside: no shade, no hold
        // A shade on the side pressed: the left third goes back, the rest on.
        const box = stage.getBoundingClientRect();
        root.setAttribute("data-pg-stories-press", e.clientX - box.left < box.width * PREV_ZONE ? "prev" : "next");
        holdTimer = window.setTimeout(() => {
            held = true;
            root.setAttribute("data-pg-stories-held", "true");
        }, HOLD);
    };

    const onMove = (e: PointerEvent): void => {
        if (!down || e.pointerId !== down.id) return;
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (!down.axis && Math.hypot(dx, dy) > 8) {
            down.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            clearTimeout(holdTimer);
            held = true; // nothing plays on while it is dragged — the press shade stays till release
        }
        // The carousel moves with a finger only: with a mouse, its arrows,
        // its cards beside and a tap do it — as on a feed's own. The cube
        // turns with either.
        const follows = mode === "cube" || down.touch;
        if (down.axis === "x" && follows && !reducedMotion()) {
            let offset = -dx / width();
            // No user that way: it gives a little, then stops.
            if ((offset > 0 && !users[u + 1]) || (offset < 0 && !users[u - 1])) offset *= 0.15;
            offset = Math.max(-1, Math.min(1, offset));
            if (mode === "cube") {
                cancelAnimationFrame(tween);
                place(offset);
            } else {
                // The whole row follows the finger.
                cube.style.transition = "none";
                cube.style.transform = `translateX(${-offset * width()}px)`;
            }
        } else if (down.axis === "y" && dy > 0 && down.touch) {
            // Pulled down to close — a finger's gesture; a mouse never moves the card.
            stage.style.transition = "none";
            stage.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy / 2000, 0.15)})`;
            root.style.setProperty("--pg-stories-drag", String(Math.min(dy / 400, 1)));
        }
    };

    const onUp = (e: PointerEvent): void => {
        if (!down || e.pointerId !== down.id) return;
        clearTimeout(holdTimer);
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        const dt = Math.max(1, performance.now() - down.t);
        const { axis, touch, side } = down;
        const wasHeld = root.getAttribute("data-pg-stories-held") === "true";
        down = null;
        held = false;
        root.setAttribute("data-pg-stories-held", "false");
        root.removeAttribute("data-pg-stories-press");
        last = 0;

        if (axis === "x" && mode === "carousel" && !touch) return; // a mouse dragged sideways: nothing
        if (axis === "x") {
            const offset = -dx / width();
            const fast = Math.abs(dx) / dt > 0.5;
            const dir: 1 | -1 = offset > 0 ? 1 : -1;
            const at = Math.max(-1, Math.min(1, offset));
            if ((Math.abs(offset) > 0.25 || fast) && users[u + dir]) {
                turn(dir, at);
            } else if (mode === "cube") {
                glide(at, 0, reducedMotion() ? 1 : 260);
            } else {
                cube.style.transition = "";
                cube.style.transform = "";
            }
            return;
        }
        if (axis === "y" && touch) {
            if (dy > 120 || (dy > 30 && dy / dt > 0.6)) return close();
            stage.style.transition = "transform 220ms ease-out";
            stage.style.transform = "";
            root.style.setProperty("--pg-stories-drag", "0");
            return;
        }
        if (axis === "y") return; // a mouse dragged up or down: nothing
        // A card beside, pressed: it comes to the middle.
        if (side) return turn(side);
        // A tap, not a hold: back on the left third, on otherwise.
        if (!wasHeld) {
            const box = stage.getBoundingClientRect();
            if (e.clientX - box.left < box.width * PREV_ZONE) prev();
            else next();
        }
    };

    // ---- The translation: the story's words, and theirs in the site's
    //      language, in a box over the viewer; the story holds meanwhile ----
    const openTranslation = (): void => {
        const slideNow = current().slides[s];
        const original = slideNow.getAttribute("data-pg-stories-original") || "";
        const translation = slideNow.getAttribute("data-pg-stories-translation") || "";
        if (!translation) return;
        closeTranslation();
        reading = el("div", { "data-pg-stories-dialog": "" });
        const box = el("div", { "data-pg-stories-dialog-box": "", role: "dialog", "aria-modal": "true", "aria-label": texts.translation });
        const row = (words: string, label: string) => {
            const p = el("p", {});
            const strong = el("span", {});
            strong.textContent = words;
            const small = el("small", {});
            small.textContent = label;
            p.append(strong, small);
            return p;
        };
        if (original) box.append(row(original, texts.original));
        box.append(row(translation, texts.translation));
        box.tabIndex = -1;
        reading.append(box);
        root.append(reading);
        root.setAttribute("data-pg-stories-reading", "true");
        box.focus(focusing());
    };
    const closeTranslation = (): void => {
        if (!reading) return;
        reading.remove();
        reading = null;
        root.removeAttribute("data-pg-stories-reading");
        last = 0;
        current().root.querySelector<HTMLElement>("[data-pg-stories-translate]")?.focus(focusing());
    };

    // A press the browser took away (a scroll, a drag of its own): nothing
    // happens — the cube or the row goes back, the card back in place.
    const onCancel = (e: PointerEvent): void => {
        if (!down || e.pointerId !== down.id) return;
        clearTimeout(holdTimer);
        down = null;
        held = false;
        last = 0;
        root.setAttribute("data-pg-stories-held", "false");
        root.removeAttribute("data-pg-stories-press");
        if (mode === "cube") glide(0, 0, 1);
        cube.style.transition = "";
        cube.style.transform = mode === "cube" ? pose(0) : "";
        stage.style.transition = "transform 220ms ease-out";
        stage.style.transform = "";
        root.style.setProperty("--pg-stories-drag", "0");
    };

    // ---- Buttons and keys ----
    const setPaused = (value: boolean): void => {
        paused = value;
        root.setAttribute("data-pg-stories-paused", String(paused));
        faces.forEach((face) => {
            face.pause.innerHTML = paused ? PLAY : PAUSE;
            face.pause.setAttribute("aria-label", paused ? "Play" : "Pause");
        });
        last = 0;
    };

    const onClick = (e: MouseEvent): void => {
        const target = e.target as Element;
        if (target.closest("[data-pg-stories-close]")) return close();
        const arrow = target.closest("[data-pg-stories-arrow]");
        if (arrow) return arrow.getAttribute("data-pg-stories-arrow") === "prev" ? prev() : next();
        if (target.closest("[data-pg-stories-pause]")) return setPaused(!paused);
        if (target.closest("[data-pg-stories-translate]")) return openTranslation();
        // Share (data-pg-stories-share in the footer): the system's own share
        // sheet — or, where there is none, the link copied and said so. The
        // site may take it over: pg-stories-share, cancelable.
        if (target.closest("[data-pg-stories-share]")) {
            const url = new URL(storyAddress(users[u].id, s), location.href).href;
            const told = new CustomEvent("pg-stories-share", {
                bubbles: true,
                cancelable: true,
                detail: { user: users[u].id, story: s, url, notice },
            });
            current().root.dispatchEvent(told);
            if (told.defaultPrevented) return;
            sharing = true;
            const button = target.closest<HTMLElement>("[data-pg-stories-share]");
            const done = (): void => {
                sharing = false;
                last = 0;
                // The sheet gone, the focus back on the button — no ring.
                button?.focus(focusing());
            };
            if (typeof navigator.share === "function") {
                navigator.share({ title: users[u].name, url }).catch(() => {}).finally(done);
            } else {
                (navigator.clipboard?.writeText(url) ?? Promise.reject())
                    .then(() => notice(texts.copied))
                    .catch(() => {})
                    .finally(done);
            }
            return;
        }
        // The heart in the site's footer: filled with a little jump, empty
        // again on a second press — told to the site, which keeps it.
        const like = target.closest<HTMLElement>("[data-pg-stories-like]");
        if (like) {
            const now = !isLiked();
            liked.delete(likedKey());
            liked.delete(`!${likedKey()}`);
            liked.add(now ? likedKey() : `!${likedKey()}`);
            paintLike();
            if (now && !reducedMotion()) {
                like.removeAttribute("data-pg-stories-jump");
                void like.offsetWidth;
                like.setAttribute("data-pg-stories-jump", "");
                like.addEventListener("animationend", () => like.removeAttribute("data-pg-stories-jump"), { once: true });
            }
            current().root.dispatchEvent(
                new CustomEvent("pg-stories-like", {
                    bubbles: true,
                    detail: { user: users[u].id, story: s, liked: now, notice },
                }),
            );
            return;
        }
        // A quick reaction: told to the site, which sends it — or, for a
        // visitor not signed in, does what it likes instead. Then the box
        // lets go, and the story goes on.
        const reaction = target.closest("[data-pg-stories-reaction]");
        if (reaction) {
            current().root.dispatchEvent(
                new CustomEvent("pg-stories-reaction", {
                    bubbles: true,
                    detail: {
                        user: users[u].id,
                        story: s,
                        reaction: reaction.getAttribute("data-pg-stories-reaction"),
                        // The site, once sent: e.detail.notice("Sent").
                        notice,
                    },
                }),
            );
            (document.activeElement as HTMLElement | null)?.blur();
            return;
        }
        // Beside the reactions: the box lets go.
        if (target.closest("[data-pg-stories-quick]")) {
            (document.activeElement as HTMLElement | null)?.blur();
            return;
        }
        // Beside the translation's box: it closes.
        if (reading && !target.closest("[data-pg-stories-dialog-box]")) return closeTranslation();
        const sound = target.closest<HTMLButtonElement>("[data-pg-stories-sound]");
        if (sound) {
            muted = !muted;
            tune.muted = muted;
            const v = current().slides[s].querySelector("video");
            if (v) v.muted = muted;
            document.querySelectorAll<HTMLButtonElement>("[data-pg-stories-sound]").forEach((b) => {
                b.innerHTML = muted ? SOUND_OFF : SOUND_ON;
                b.setAttribute("aria-label", muted ? "Sound on" : "Sound off");
            });
            return;
        }
        // A click beside the card does nothing: only the ×, Escape, Back
        // and a finger's pull down close it.
    };

    // The buttons that can be reached now: the current card's, and the
    // viewer's own (arrows, the corner ×) — those shown.
    const reachable = (): HTMLElement[] =>
        [...root.querySelectorAll<HTMLElement>("button")].filter((n) => {
            const face = n.closest("[data-pg-stories-face]");
            if (face && face !== current().root) return false;
            return !n.hidden && n.getClientRects().length > 0;
        });

    const onKey = (e: KeyboardEvent): void => {
        // The site's "⋯" open: the keys are its own.
        if (menuOpen()) return;
        if (e.key === "Escape") return reading ? closeTranslation() : close();
        if (reading) return;
        // Typing in the footer: the arrows move the caret, not the stories.
        if ((e.target as Element).closest?.("input, textarea, [contenteditable]")) return;
        if (e.key === "ArrowRight") return next();
        if (e.key === "ArrowLeft") return prev();
        if (e.key === "Tab") {
            // Focus stays in the viewer.
            const items = reachable();
            if (!items.length) return;
            const i = items.indexOf(document.activeElement as HTMLElement);
            e.preventDefault();
            items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
        }
    };

    // ---- Resizing, closing ----
    const onResize = (): void => {
        root.style.setProperty("--pg-stories-half", `${stage.clientWidth / 2}px`);
        // A media query switched the layout: built again, where it was.
        if (layoutOf() !== mode && !turning) {
            layout();
            show();
        }
    };

    // The browser's Back closes it: one history entry while it is open.
    const onPop = (): void => {
        if (!(history.state && history.state.pgStories)) close(false, true);
    };

    const close = (instant = false, fromBack = false): void => {
        if (closed) return;
        closed = true;
        removeEventListener("resize", onResize);
        removeEventListener("popstate", onPop);
        cancelAnimationFrame(tween);
        // Closed by its own buttons: take back the entry it added. Not when
        // closed from code (a page change, React cleaning up) — that would
        // take the visitor back a page.
        if (!fromBack && !instant && history.state && history.state.pgStories) history.back();
        cancelAnimationFrame(frame);
        clearTimeout(holdTimer);
        clearInterval(clock);
        root.querySelectorAll("video").forEach((v) => v.pause());
        tune.pause();
        tune.removeAttribute("src");
        ahead.removeAttribute("src");
        document.removeEventListener("keydown", onKey, true);
        root.setAttribute("data-pg-stories-state", "closing");
        const remove = () => {
            root.remove();
            if (viewer === api) viewer = null;
            opener?.focus(focusing());
        };
        if (instant || reducedMotion()) return remove();
        root.addEventListener("animationend", remove, { once: true });
        setTimeout(remove, 400);
    };
    // A short word over the story — "Sent" — said by the site, shown a
    // moment in the middle of the card, then gone.
    let noticeTimer = 0;
    const notice = (text: string): void => {
        if (closed) return;
        root.querySelector("[data-pg-stories-notice]")?.remove();
        const box = el("div", { "data-pg-stories-notice": "", role: "status" });
        box.textContent = text;
        current().root.append(box);
        clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(() => {
            box.setAttribute("data-pg-stories-notice", "out");
            window.setTimeout(() => box.remove(), 250);
        }, 1500);
    };
    // The times keep counting while it is open — "now" becomes "1m".
    const clock = window.setInterval(() => {
        faces.forEach((face, i) => {
            const head = face.root.querySelector<HTMLElement>("[data-pg-stories-head-time]");
            if (head) head.textContent = timeOf(face.slides[i === u ? s : 0], texts.ago);
            const preview = face.root.querySelector<HTMLElement>("[data-pg-stories-preview-time]");
            if (preview) preview.textContent = timeOf(users[i].items[0], texts.ago);
        });
    }, 30000);
    const api = { close, notice };
    viewer = api;

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onCancel);
    // The browser's own drag of a picture or a link would cancel the swipe.
    root.addEventListener("dragstart", (e) => e.preventDefault());
    root.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey, true);
    addEventListener("resize", onResize);
    history.pushState({ ...(history.state || {}), pgStories: true }, "");
    addEventListener("popstate", onPop);

    // Typing in the footer holds the story, as a finger does.
    // Reactions show while the box is pressed into and still empty.
    const field = (node: EventTarget | null) =>
        (node as Element | null)?.closest?.("[data-pg-stories-footer] input, [data-pg-stories-footer] textarea") as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null;
    const react = (node: EventTarget | null): void => {
        const box = field(node);
        root.setAttribute("data-pg-stories-reacting", String(!!box && !box.value));
    };
    // Pressed into, the footer's box dims the story behind it.
    root.addEventListener("focusin", (e) => {
        typing = !!(e.target as Element).closest("input, textarea, [contenteditable]");
        root.setAttribute("data-pg-stories-typing", String(!!field(e.target)));
        react(e.target);
    });
    root.addEventListener("focusout", () => {
        typing = false;
        last = 0;
        root.setAttribute("data-pg-stories-typing", "false");
        root.setAttribute("data-pg-stories-reacting", "false");
    });
    root.addEventListener("input", (e) => react(e.target));
    // A press on the reactions keeps the box's focus till the click lands.
    root.addEventListener("mousedown", (e) => {
        if ((e.target as Element).closest("[data-pg-stories-quick]")) e.preventDefault();
    });
    root.setAttribute("data-pg-stories-paused", "false");
    layout();
    show();
    requestAnimationFrame(() => root.setAttribute("data-pg-stories-state", "open"));
    // The viewer is there: the cover goes.
    document.documentElement.removeAttribute("data-pg-stories-linked");
    reachable()
        .find((n) => n.hasAttribute("data-pg-stories-close"))
        ?.focus(focusing());
    frame = requestAnimationFrame(tick);
}

/* Only the newest call answers clicks — a late cleanup from an older one
   (React remounting) cannot switch it off. Same rule as the other packages. */
let live: object | null = null;

/* Start listening; returns the cleanup for a React effect. */
export function initStories(): () => void {
    if (typeof document === "undefined") return () => {};
    const self = {};
    live = self;

    const onClick = (e: MouseEvent): void => {
        if (live !== self) return;
        const opener = (e.target as Element | null)?.closest<HTMLElement>(`[${OPEN}]`);
        if (!opener) return;
        const id = opener.getAttribute(OPEN) || "";
        const source = [...document.querySelectorAll<HTMLElement>(`[${USER}]`)].find(
            (n) => n.getAttribute(USER) === id,
        );
        const group = source?.closest(`[${GROUP}]`);
        if (!source || !group) return;
        e.preventDefault();
        const users = usersOf(group).filter((user) => user.items.length);
        openViewer(users, users.findIndex((user) => user.id === id), opener, group);
    };

    // Openers rendered later get their seen mark too.
    let pending = 0;
    const mo = new MutationObserver(() => {
        if (pending) return;
        pending = requestAnimationFrame(() => {
            pending = 0;
            paintSeen();
        });
    });

    // An address with #stories=… opens that story — on load, and when it
    // changes. The # is taken off first, so closing leaves the page's own.
    const fromHash = (): void => {
        if (live !== self) return;
        const match = HASH.exec(location.hash);
        if (!match) return;
        history.replaceState(history.state, "", `${location.pathname}${location.search}`);
        const id = decodeURIComponent(match[1]);
        const story = Number(match[2] || 1) - 1;
        const source = [...document.querySelectorAll<HTMLElement>(`[${USER}]`)].find((n) => n.getAttribute(USER) === id);
        const group = source?.closest(`[${GROUP}]`);
        const users = group ? usersOf(group).filter((user) => user.items.length) : [];
        const at = users.findIndex((user) => user.id === id);
        if (at >= 0) openViewer(users, at, null, group || null, story, true);
        // No such story: the page, uncovered.
        document.documentElement.removeAttribute("data-pg-stories-linked");
    };

    document.addEventListener("click", onClick);
    addEventListener("hashchange", fromHash);
    mo.observe(document.body, { childList: true, subtree: true });
    paintSeen();
    fromHash();

    return () => {
        document.removeEventListener("click", onClick);
        removeEventListener("hashchange", fromHash);
        mo.disconnect();
        if (pending) cancelAnimationFrame(pending);
        if (live === self) {
            live = null;
            viewer?.close(true);
        }
    };
}

/* A short word over the open story — "Sent", "Thanks" — for a moment:
   showStoriesNotice("Sent"). Nothing open: nothing shown. */
export function showStoriesNotice(text: string): void {
    viewer?.notice(text);
}

/* Open a user's stories from code: openStories("ada") — or at a story of
   theirs, from 0: openStories("ada", 1). */
export function openStories(id: string, story = 0): void {
    const source = [...document.querySelectorAll<HTMLElement>(`[${USER}]`)].find((n) => n.getAttribute(USER) === id);
    const group = source?.closest(`[${GROUP}]`);
    if (!group) return;
    const users = usersOf(group).filter((user) => user.items.length);
    openViewer(users, users.findIndex((user) => user.id === id), null, group, story);
}

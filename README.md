# stories

Instagram-like stories, from markup: a row of avatars that open a viewer —
a bar per story filling as it plays, tap to go on, hold to pause, the people
beside in a carousel (or on a 3D cube), videos with sound on a tap. Full
screen on a phone, a card on a computer. No dependencies,
framework-agnostic.

```sh
npm install github:omisilli/stories#v3.0.0
```

```ts
import { initStories } from "@plusguard/stories";
import "@plusguard/stories/index.css";

initStories();
```

```html
<!-- The avatars: any button, anywhere, opens a person by id. -->
<button data-pg-stories-open="ada"><img src="ada.jpg" alt="" /> ada</button>
<button data-pg-stories-open="mert"><img src="mert.jpg" alt="" /> mert</button>

<!-- The stories, written once and hidden. -->
<div data-pg-stories hidden>
    <div data-pg-stories-user="ada" data-pg-stories-name="ada" data-pg-stories-avatar="ada.jpg">
        <div data-pg-stories-item data-pg-stories-time="2h"><img src="1.jpg" loading="lazy" alt="…" /></div>
        <div data-pg-stories-item data-pg-stories-time="1h"><video src="2.mp4" muted playsinline preload="none"></video></div>
    </div>
    <div data-pg-stories-user="mert" data-pg-stories-name="mert" data-pg-stories-avatar="mert.jpg">
        <div data-pg-stories-item data-pg-stories-duration="8000">…any HTML…</div>
    </div>
</div>
```

### Without a build step

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/omisilli/stories@v3.0.0/index.css" />
<script type="module">
    import { initStories } from "https://cdn.jsdelivr.net/gh/omisilli/stories@v3.0.0/dist/index.js";

    initStories();
</script>
```

Pin the version on a live site. A pinned URL never changes; `@3` follows
the newest 3.x release.

## In the viewer

| Do                                   | Happens                                               |
| ------------------------------------ | ----------------------------------------------------- |
| Wait                                 | The bar fills; the next story, then the next person   |
| Tap the right 70% · →                | The next story — a shade comes in from the right while pressed |
| Tap the left 30% · ←                 | The story before — or the person before; the shade from the left |
| Hold anywhere                        | Paused while held; the bars and the name step back    |
| Drag sideways                        | The next or the person before — it follows the finger, and goes on past a quarter, or with a flick. The carousel moves with a finger only; with a mouse, its arrows, cards beside and taps do it. The cube turns with a mouse too |
| Press a card beside (carousel)       | That person comes to the middle — growing, the one there shrinking to the side |
| The arrows by the card (carousel)    | The story before, the next one |
| The pause button                     | Paused until pressed again — or until another story, which plays from its start |
| Escape · × · the browser's Back      | Closed — on a wide carousel, the × is in the corner   |
| Pull down, on a touch screen         | Closed                                                |
| The speaker                          | Sound on for every video, until closed                |

- **How long.** A picture or HTML stays `data-pg-stories-duration` ms — on
  the item, the person or the group; default `5000`. A video, its own
  length. The bar waits while a picture or a video loads.
- **After a person's last story** — by the clock or a tap — what comes is
  `data-pg-stories-end`, on the person or the whole group:

  | `data-pg-stories-end` | After a person's last story                         |
  | --------------------- | --------------------------------------------------- |
  | `next` (default)      | The next person; after the last one, it closes      |
  | `close`               | It closes — one person at a time                    |
  | `stay`                | The next person; the last one stays open, its bar full — closed only by hand |
- **Nothing closes it by accident.** A click beside the card does nothing,
  and a press that wanders off the card — a drag that ends outside it —
  does not close it either. Pulling down to close is a finger's gesture:
  with a mouse, the card never moves down.
- **Back closes it.** Opening it adds one entry to the history, so a
  phone's Back gesture closes the stories instead of leaving the page;
  closing it any other way takes that entry back.
- **Seen.** A person whose last story was shown gets
  `data-pg-stories-seen="true"` on every `data-pg-stories-open` button for
  them — kept in this browser (localStorage), so the ring can go grey.
- **The speaker** shows only on a video — on the faces beside too, as the
  cube turns.
- **Loaded when its turn comes.** Write the hidden stories' pictures
  `loading="lazy"` and their videos `preload="none"`: hidden, the browser
  then loads none of them — without it, it loads every one with the page.
  The viewer loads, as it goes, the story shown and the next one (its
  music too), and the first story of each person waiting beside — a card
  beside shows it, seen or not. Nothing else, however many stories there
  are.

## Two layouts

`--pg-stories-layout`, in CSS — per screen size in a media query:

| Value                | The viewer                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| `carousel` (default) | From 64rem (`lg`): the current card in the middle, two each side at 40% with the person's avatar, name and time, dimmed; arrows by the card; a × in the corner; the site's logo top left. Below: one card at a time, sliding, the × in its header |
| `cube`               | One card; the next person on a 3D cube — the face turning away darkens, the one coming in comes out of the dark |

### By screen size

A CSS variable, so a media query picks it. The package's own breakpoints
are Tailwind's, and so are these — `sm` 40rem (640px), `md` 48rem
(768px), `lg` 64rem (1024px), `xl` 80rem (1280px), `2xl` 96rem (1536px):

```css
/* The cube on a tablet and a phone, the carousel above — below lg. */
@media (width < 64rem) {
    :root {
        --pg-stories-layout: cube;
    }
}

/* The cube on a phone only — below md. */
@media (width < 48rem) {
    :root {
        --pg-stories-layout: cube;
    }
}

/* By what the screen can do: the cube wherever there is no mouse. */
@media (pointer: coarse) {
    :root {
        --pg-stories-layout: cube;
    }
}
```

The viewer reads it as it opens and again when the window changes — a
tablet turned, a window narrowed: it rebuilds in the other layout and goes
on from the story it was on. The example's "by screen" switch does the
first of these; narrow the window with a story open.

**The same for everything in The look.** Every setting that may differ by
screen is a CSS variable — the aspect, the corners, the colours, the
shades — so any of them goes in a media query the same way:

```css
@media (width < 40rem) {
    :root {
        --pg-stories-press-shade: 0.15; /* lighter on a phone — below sm */
    }
}
```

What is the same on every screen stays an attribute on the markup — how
long a picture stays, what comes after a person, the reactions.

The logo is yours: an element with `data-pg-stories-logo` in the group is
copied to the corner.

```html
<div data-pg-stories hidden>
    <span data-pg-stories-logo>stories</span>
    …
</div>
```

## Under the card

A footer of your own — a reply box, a like, a send — put once in the group
with `data-pg-stories-footer`, is copied under every card, on a shade.
`{name}` in a `placeholder`, `aria-label`, `title` or `value` becomes the
person's name, and so does the text of a `data-pg-stories-footer-name`
element. Typing in it holds the story; the arrow keys move the caret there.

What it does is yours: every card carries `data-pg-stories-for="<id>"`, so
your own script knows whose story was answered — to send the reply, or,
for a visitor not signed in, to take them to sign in first.

```html
<div data-pg-stories hidden>
    <form data-pg-stories-footer class="reply">
        <input placeholder="Reply to {name}…" aria-label="Reply to {name}" />
        <button type="button" aria-label="Like">…</button>
        <button type="button" aria-label="Send">…</button>
    </form>
    …
</div>
```

### A "⋯" of your own

The header has room for one: an element with `data-pg-stories-more` in the
group is copied into every card's header, before the × — your own button,
and whatever it opens: a menu, a window to report the story, one about the
account. `{name}` in it becomes the person's name, as in the footer.

```html
<div data-pg-stories hidden>
    <div data-pg-stories-more class="more">
        <button type="button" aria-label="More" aria-haspopup="menu" aria-expanded="false">⋯</button>
        <div role="menu" hidden>
            <button role="menuitem" data-open="report">Report</button>
            <button role="menuitem" data-open="about">About this account</button>
        </div>
    </div>
    …
</div>
```

While its button says `aria-expanded="true"` — the menu open, or a window
it opened — the story holds, a press on the card only lets the menu go,
and the keys are yours (Escape too). What the items do is yours entirely:
the card's `data-pg-stories-for` says whose story it is.

**We'd build it with targetFunctions** — the PlusGuard package for
menus, drawers and windows opened by a button: the menu opens and closes
by its commands, the windows lock the page and close on Escape. The
example does without it only so that it needs no other package: a few
lines of its own for the menu, and `<dialog>` opened with `showModal()`
for the report and "about this account" windows — a `<dialog>` sits above
the viewer, in the browser's top layer.

### A heart

Mark the footer's heart `data-pg-stories-like` (and `aria-pressed`): a
press fills it red with a little jump, a second empties it — each story its
own, remembered while the viewer is open. A story the visitor liked before
comes with `data-pg-stories-liked`, written by the CMS, and opens filled.
What a like does is the site's:

```js
document.addEventListener("pg-stories-like", (e) => {
    const { user, story, liked } = e.detail; // whose, which story (from 0), liked or not
    // keep it — or, for a visitor not signed in, take them to sign in
});
```

The red is `--pg-stories-like` (`#ff3040`).

### Sharing a story

Mark the footer's plane `data-pg-stories-share`: a press opens the
system's own share sheet — AirDrop, Mail, Messages on a Mac, the phone's on
a phone, Windows' on Windows. Where a browser has none, the link is copied
and "Link copied" shows over the story (`data-pg-stories-text-copied`).
The story holds while the sheet is open.

The link is the page's, with the story after a `#`:

```
https://example.com/news#stories=mert/2
```

Opened, the page goes straight to that story — mert's second, not his
first — and closing it leaves the page's own address. With `early.js` in
`<head>` (see The avatars), the page never shows first: it is covered by
the viewer's dark before it is drawn, and the story opens on it at once,
without its fade.

**Only the share button gives this link.** Watching stories leaves the
address bar alone — it stays the page's.

**Search engines.** Nothing to hide, nothing to add: what follows a `#` is
never sent to the server, and search engines read the link as the page
itself — no new URL, no copy of the page in their index. (A `?story=` would
make one page per story.) Do not mark the page `noindex` for it — that
would hide the page, not the link.

To share your own way — a window of your own, a short link from your
server — cancel the event and take its link:

```js
document.addEventListener("pg-stories-share", (e) => {
    e.preventDefault();
    const { user, story, url, notice } = e.detail;
    // …your own; then perhaps notice("Link copied")
});
```

`openStories("mert", 1)` opens the same from code.

### Quick reactions

`data-pg-stories-reactions` on the group — the reactions, space between —
shows them over the story while the footer's box is pressed into and still
empty, the story dimmed behind; leave it out for none. A press on one tells
the page, and the box lets go:

```html
<div data-pg-stories hidden data-pg-stories-reactions="😂 😮 😍 😢 👏 🔥 🎉 💯">…</div>
```

```js
document.addEventListener("pg-stories-reaction", async (e) => {
    const { user, story, reaction, notice } = e.detail; // whose, which story (from 0), which
    // send it — or, for a visitor not signed in, take them to sign in
    await fetch("/api/reactions", { method: "POST", body: JSON.stringify({ user, story, reaction }) });
    notice("Sent"); // a short word over the story, a moment
});
```

**A short word over the story.** `notice(text)` — on a reaction's event —
or `showStoriesNotice(text)` from anywhere shows a few words in the middle
of the open story for a moment, as a feed says "Sent": after a reply went
out, a report was taken. When and what is the site's; the look is
`[data-pg-stories-notice]`.

The title is `data-pg-stories-text-reactions` ("Quick reactions"). The
viewer only shows them and says which was pressed; what follows is yours.

## The time

`data-pg-stories-time` is shown as written — the server writes it, so it is
there from the first moment. Give a story `data-pg-stories-at` too, the
moment it was shared, and the viewer counts from it as a feed does — `now`,
`5m`, `2h`, `1d`, `3w` — and keeps counting while it is open: a page left
open an hour does not still say "now".

```html
<div data-pg-stories-item data-pg-stories-time="2h" data-pg-stories-at="2026-11-08T14:30:00Z">…</div>
```

The units are the group's, in the site's language — now, minutes, hours,
days, weeks: `data-pg-stories-text-ago="now m h d w"` (the default);
Turkish, as a feed writes it, `"şimdi dk s g h"`.

**No server needed.** Every 30 seconds while the viewer is open, it reads
the browser's own clock against `data-pg-stories-at` — nothing is fetched;
closed, it stops.

**Write the time zone.** The count is the visitor's clock minus the moment
shared, so the moment must say where it was: an ISO date ending in `Z`
(UTC) or an offset (`+03:00`) — `2026-11-08T14:30:00Z`,
`2026-11-08T17:30:00+03:00`. Then it is right for a visitor in any country,
whatever language the site is in. A date without either is read in the
visitor's own zone, and is off by the difference. (A visitor whose computer
clock is wrong sees it off by as much.)

## Music

A story can play music: its name under the person's
(`data-pg-stories-music`), the file itself in `data-pg-stories-music-src`.

```html
<div
    data-pg-stories-item
    data-pg-stories-music="Chopin · Étude in A-flat major"
    data-pg-stories-music-src="/media/story-12.m4a"
    data-pg-stories-duration="15000"
>…</div>
```

It starts from its beginning as the story starts, holds when the story
holds (a finger, the pause button, typing, a window) and stops when the
story changes. Like a video it starts muted: the speaker shows on a story
with music, and turns the sound on for all of them until closed. A picture
stays its `data-pg-stories-duration` — give it the clip's length.

**The file: AAC in `.m4a`.** AAC is the sound, `.m4a` the box it comes in
— the same as a video's sound in `.mp4`. It plays in every browser and on
every phone, Safari included, and at 128 kbps sounds as good as an MP3 a
third larger. A bare `.aac` file holds the same sound without the box:
browsers play it less surely and cannot seek in it well — use `.m4a`. An
MP3 plays everywhere too, if that is what there is.

**From an upload — the server's work.** The CMS lets the author pick the
song and the part of it that plays, as a story app does; the server cuts
that part and makes the `.m4a`:

```sh
# 15 seconds from 0:30, AAC 128 kbps, ready to start before it is all in
ffmpeg -ss 30 -t 15 -i song.mp3 -c:a aac -b:a 128k -movflags +faststart story-12.m4a
```

On a Mac without ffmpeg, the system's own tool does the same:

```sh
avconvert --source song.mp3 --preset PresetAppleM4A --start 30 --duration 15 --output story-12.m4a
```

Re-encoding an MP3 loses a little each time — start from the best copy
there is, a WAV or the original upload, and encode once.

## A translation

Words on a story in another language — a sticker, a caption — and their
translation: written on the story, the viewer puts "See translation" under
the name, and a press opens both in a box over the story, which holds
meanwhile. A press beside the box, or Escape, closes it.

```html
<div
    data-pg-stories-item
    data-pg-stories-original="Bugün battaniyeden çıkmıyorum ❤️"
    data-pg-stories-translation="Not leaving the blanket today ❤️"
>…</div>
```

Which stories get one is the CMS's to decide — those not in the site's
language. The words the viewer shows are the group's, in the site's
language: `data-pg-stories-text-translate` ("See translation"),
`data-pg-stories-text-original` ("Original"),
`data-pg-stories-text-translation` ("Translation").

## The markup

| Attribute                    | On                       | Meaning                                                   |
| ---------------------------- | ------------------------ | --------------------------------------------------------- |
| `data-pg-stories-open`       | anything clickable       | Opens that person — by the `data-pg-stories-user` id      |
| `data-pg-stories`            | a hidden box             | A group: its people follow one another in the viewer      |
| `data-pg-stories-user`       | a box in the group       | One person: their id                                      |
| `data-pg-stories-name`       | the person               | The name shown at the top                                 |
| `data-pg-stories-avatar`     | the person               | The picture beside the name                               |
| `data-pg-stories-item`       | a box in the person      | One story: a picture, a video, or any HTML                |
| `data-pg-stories-time`       | a story                  | Shown beside the name, as written: `2h`, `yesterday`      |
| `data-pg-stories-at`         | a story                  | When it was shared, an ISO date — the time counts from it; see The time |
| `data-pg-stories-verified`   | the person               | A blue badge after their name                             |
| `data-pg-stories-liked`      | a story                  | Liked before — the footer's heart opens filled            |
| `data-pg-stories-like`       | a button in the footer   | The heart: filled and emptied by a press — see A heart    |
| `data-pg-stories-share`      | a button in the footer   | Shares the story's link — see Sharing a story             |
| `data-pg-stories-duration`   | a story, person or group | Milliseconds for a picture or HTML. Default `5000`        |
| `data-pg-stories-end`        | a person or group        | After a person's last story: `next` · `close` · `stay`    |
| `data-pg-stories-logo`       | anything in the group    | Copied to the viewer's corner, on a wide carousel         |
| `data-pg-stories-music`      | a story                  | Its music's name, under the name: `Artist · Song`         |
| `data-pg-stories-music-src`  | a story                  | Its music, to play with it — see Music                    |
| `data-pg-stories-original` · `-translation` | a story   | Its words, and their translation — see A translation      |
| `data-pg-stories-reactions`  | the group                | Quick reactions, space between — see Under the card       |
| `data-pg-stories-text-*`     | the group                | The viewer's words, in the site's language                |
| `data-pg-stories-footer`     | anything in the group    | Copied under each card — see Under the card               |
| `data-pg-stories-more`       | anything in the group    | Copied into each card's header — see A "⋯" of your own    |
| `data-pg-stories-seen`       | an open button           | `"true"` once that person was seen to the end — written here |

**The viewer is built from copies.** When it opens, it is made on `<body>`
from copies of the stories; the page's own markup is never changed — React,
or a CMS template, renders it as it likes. A video in a story is written
`muted playsinline`; the viewer plays it and pauses it.

`openStories("ada")` opens a person from code — `openStories("ada", 1)` at
their second story; `showStoriesNotice("Sent")` says a few words over the
open story.

## The look

CSS variables, on `:root` or anywhere above — per screen size in a media
query (see By screen size):

| Variable                  | Default            | Meaning                                         |
| ------------------------- | ------------------ | ----------------------------------------------- |
| `--pg-stories-layout`     | `carousel`         | `carousel` or `cube` — see Two layouts          |
| `--pg-stories-aspect`     | `0.5625` (9:16)    | The card's width ÷ height                       |
| `--pg-stories-radius`     | `0.5rem`; `0` on a phone | Its corners                               |
| `--pg-stories-backdrop`   | `#1a1a1a`          | Behind the card                                 |
| `--pg-stories-bar`        | white              | A bar, filled                                   |
| `--pg-stories-bar-track`  | white, 35%         | A bar, empty                                    |
| `--pg-stories-press-shade`| `0.25`             | How dark the side pressed gets, at its edge     |
| `--pg-stories-typing-shade`| `0.55`            | How dark the story gets while the footer's box is pressed into |
| `--pg-stories-ring`       | Instagram's colours | The ring of a waiting card's avatar            |
| `--pg-stories-ring-seen`  | white, 60%         | The same, once seen                             |

The viewer takes the page's font — it is built on `<body>`. Below 40rem the
card fills the screen. It opens and closes with a fade.
With reduced motion asked for, the cube turns at once.

States, for your own CSS: `data-pg-stories-state` on the viewer —
`opening`, `open`, `closing`; `data-pg-stories-held="true"` while held,
`data-pg-stories-paused="true"` while paused; `data-pg-stories-layout`.
The parts are plain to style: `[data-pg-stories-head]`,
`[data-pg-stories-bars]`, `[data-pg-stories-bar]`, `[data-pg-stories-close]`,
`[data-pg-stories-sound]`, `[data-pg-stories-pause]`, `[data-pg-stories-arrow]`,
`[data-pg-stories-preview]`.

## The avatars

Your own markup — the package only marks them. A ring as Instagram draws
it: a band of colour, a gap the page's colour, the photo — a thinner grey
band once seen, the photo the same size. A grey disc behind the photo holds
its place while it loads:

```html
<button data-pg-stories-open="ada">
    <span class="ring"><img src="ada.jpg" width="160" height="160" alt="" /></span> ada
</button>
```

```css
.ring {
    --ring: 3px; /* the band */
    --gap: 3px;
    display: block;
    width: 4.5rem;
    aspect-ratio: 1;
    padding: var(--ring);
    border-radius: 50%;
    background: linear-gradient(45deg, #ffd600, #ff7a00 25%, #ff0069 55%, #d300c5 80%, #7638fa);
}
.ring img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: var(--gap) solid var(--page-background);
    background: #efefef; /* until the photo is there */
    object-fit: cover;
}
[data-pg-stories-seen="true"] .ring {
    padding: 1px;
    background: #dbdbdb;
}
[data-pg-stories-seen="true"] .ring img {
    border-width: calc(var(--ring) + var(--gap) - 1px);
}
```

An avatar anywhere else — on a post, beside a comment — is one more
`data-pg-stories-open` button; the example's posts open their person's
stories so.

**Before the page is drawn** — for the seen marks, and for a link to a
story (see Sharing a story). `initStories()` marks the buttons once
its module is in — a moment after the page is drawn, so a ring seen before
would show as new for that moment, then turn grey. `early.js`, a small
classic script in `<head>` before the markup, marks each button as the
browser reads it:

```html
<head>
    …
    <script src="https://cdn.jsdelivr.net/gh/omisilli/stories@v3.0.0/early.js"></script>
</head>
```

Not deferred, not a module — or its text written inline there.

A row of them that scrolls sideways: give it `overflow-x: auto` — and the
anchor package's `data-pg-anchor-strip` if it should keep the one opened in
view.

## Alongside

- **The PlusGuard image package** — not needed, and not loaded by this
  one; with it, a story's picture that fails keeps a grey ground instead
  of the browser's broken-image icon, and can fade in. Give the hidden
  pictures `data-pg-image` as well as `loading="lazy"`; it listens on the
  document, so it sees the viewer's copies. The loading order stays this
  package's: only it knows which story comes next.
- **The PlusGuard skeleton package** — for the row of avatars while the
  stories are still being fetched (React, a CMS's API): grey circles in
  their place, then the avatars.
- **The page stays still** while it is open: `index.css` clips `<html>`,
  as targetFunctions' lock does. With **Lenis**, give it `autoToggle: true`
  — it stops by itself while the page cannot scroll.
- **Focus** goes to the viewer's × when it opens, Tab stays inside it, and
  it goes back to the button that opened it.
- **One viewer at a time.** Opening another closes the first.

## React (Next)

```tsx
useEffect(() => initStories(), []);
```

Mount it once, high in the tree; avatars rendered later work too. Render
the hidden `data-pg-stories` group from your data — see
[`examples/react/Example.tsx`](examples/react/Example.tsx). If
`initStories` is called again before the first cleanup runs (React
remounting in development), only the newest call answers.

## Example

[`examples/static/index.html`](examples/static/index.html) — open it by
double-clicking. A feed laid out as a social feed is, black: five people in a row of
avatars, three posts below whose avatars open stories too; photos, a video
with sound, HTML stories, music under the name, a story with a
translation, a reply box under every card, a landscape picture cropped to
the card. The font is SF Pro Text, inline in `sf-pro.css`. Switches for the
layout (by screen — the cube below 64rem, the default here — carousel or cube), what comes after a person
(`data-pg-stories-end`), how long a picture stays, and forgetting what was
seen.

The photos are from [Lorem Picsum](https://picsum.photos) — Unsplash
photos, free to use, loaded from there. The video was made for this example. The music is Chopin's Étude in
A-flat major, played for [Musopen](https://musopen.org) and in the public
domain — from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Frederic_Chopin_-_etude_no._in_a_flat_major,_woo.ogg),
its first 15 seconds made into `.m4a` as above.

## Upgrading from 2.x

- **The default is the carousel now** — the current card in the middle,
  the people beside it on a wide screen. For the cube as before, set
  `--pg-stories-layout: cube` — on every screen, or by screen size.
- **Write the hidden stories lazy:** `loading="lazy"` on their pictures,
  `preload="none"` on their videos — or the browser loads them all with
  the page. The viewer loads each when its turn comes.
- **Add `early.js`** in `<head>`, for the seen marks and story links before
  the page is drawn.
- New, all optional: music (`data-pg-stories-music`, `-music-src`), the
  time counted from `data-pg-stories-at`, a verified badge, a translation,
  a footer of your own with a heart, quick reactions and sharing, a "⋯" of
  your own, a pause button, `showStoriesNotice()`, links to a story.

## Upgrading from 1.x

From person to person is always the cube now: `--pg-stories-transition`
(and its `slide` and `fade`) is gone — delete it. Everything else works as
before; new is `data-pg-stories-end`, and opening is a plain fade, without
the slight growing.

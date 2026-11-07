# stories

Instagram-like stories, from markup: a row of avatars that open a viewer —
a bar per story filling as it plays, tap to go on, hold to pause, a 3D cube
from one person to the next, videos with sound on a tap. Full screen on a
phone, a card on a computer. No dependencies, framework-agnostic.

```sh
npm install github:omisilli/stories#v2.0.0
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
        <div data-pg-stories-item data-pg-stories-time="2h"><img src="1.jpg" alt="…" /></div>
        <div data-pg-stories-item data-pg-stories-time="1h"><video src="2.mp4" muted playsinline></video></div>
    </div>
    <div data-pg-stories-user="mert" data-pg-stories-name="mert" data-pg-stories-avatar="mert.jpg">
        <div data-pg-stories-item data-pg-stories-duration="8000">…any HTML…</div>
    </div>
</div>
```

### Without a build step

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/omisilli/stories@v2.0.0/index.css" />
<script type="module">
    import { initStories } from "https://cdn.jsdelivr.net/gh/omisilli/stories@v2.0.0/dist/index.js";

    initStories();
</script>
```

Pin the version on a live site. A pinned URL never changes; `@2` follows
the newest 2.x release.

## In the viewer

| Do                                   | Happens                                               |
| ------------------------------------ | ----------------------------------------------------- |
| Wait                                 | The bar fills; the next story, then the next person   |
| Tap the right 70% · →                | The next story — a shade comes in from the right while pressed |
| Tap the left 30% · ←                 | The story before — or the person before; the shade from the left |
| Hold anywhere                        | Paused while held; the bars and the name step back    |
| Drag sideways                        | The next or the person before, on a cube — it follows the finger, and goes on past a quarter, or with a flick; the face turning away darkens, the one coming in comes out of the dark |
| Escape · × · the browser's Back      | Closed                                                |
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
- **Ready ahead.** The next video loads while the one before plays; the
  first story of the person on each side is there before the cube turns.

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
| `data-pg-stories-duration`   | a story, person or group | Milliseconds for a picture or HTML. Default `5000`        |
| `data-pg-stories-end`        | a person or group        | After a person's last story: `next` · `close` · `stay`    |
| `data-pg-stories-seen`       | an open button           | `"true"` once that person was seen to the end — written here |

**The viewer is built from copies.** When it opens, it is made on `<body>`
from copies of the stories; the page's own markup is never changed — React,
or a CMS template, renders it as it likes. A video in a story is written
`muted playsinline`; the viewer plays it and pauses it.

`openStories("ada")` opens a person from code.

## The look

CSS variables, on `:root` or anywhere above — per screen size in a media
query:

| Variable                  | Default            | Meaning                                         |
| ------------------------- | ------------------ | ----------------------------------------------- |
| `--pg-stories-aspect`     | `0.5625` (9:16)    | The card's width ÷ height                       |
| `--pg-stories-radius`     | `0.75rem`; `0` on a phone | Its corners                              |
| `--pg-stories-backdrop`   | near black         | Behind the card                                 |
| `--pg-stories-bar`        | white              | A bar, filled                                   |
| `--pg-stories-bar-track`  | white, 35%         | A bar, empty                                    |
| `--pg-stories-press-shade`| `0.25`             | How dark the side pressed gets, at its edge     |

Below 40rem the card fills the screen. It opens and closes with a fade.
With reduced motion asked for, the cube turns at once.

States, for your own CSS: `data-pg-stories-state` on the viewer —
`opening`, `open`, `closing`; `data-pg-stories-held="true"` while held.
The parts are plain to style: `[data-pg-stories-head]`,
`[data-pg-stories-bars]`, `[data-pg-stories-bar]`, `[data-pg-stories-close]`,
`[data-pg-stories-sound]`.

## The avatars

Your own markup — the package only marks them. A ring that is bright until
seen:

```css
.ring {
    background: conic-gradient(from 200deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75);
    border-radius: 50%;
}
[data-pg-stories-seen="true"] .ring {
    background: #ddd;
}
```

A row of them that scrolls sideways: give it `overflow-x: auto` — and the
anchor package's `data-pg-anchor-strip` if it should keep the one opened in
view.

## Alongside

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
double-clicking. Five people: photos, two videos with sound, HTML stories,
a landscape picture cropped to the card. Switches for what comes after a
person (`data-pg-stories-end`), how long a picture stays, and forgetting
what was seen.

The photos are from [Lorem Picsum](https://picsum.photos) — Unsplash
photos, free to use, loaded from there. The two videos were made for this
example.

## Upgrading from 1.x

From person to person is always the cube now: `--pg-stories-transition`
(and its `slide` and `fade`) is gone — delete it. Everything else works as
before; new is `data-pg-stories-end`, and opening is a plain fade, without
the slight growing.

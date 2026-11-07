"use client";

import { useEffect } from "react";
import { initStories } from "@plusguard/stories";
import "@plusguard/stories/index.css";

/* Mount once, high in the tree: one listener answers every avatar, those
   rendered later too. With Lenis, give it autoToggle: true — the page then
   stays still while the viewer is open. */
export function Stories() {
    useEffect(() => initStories(), []);
    return null;
}

/*
 * The data — from your CMS, say. Each story is a picture, a video, or any
 * HTML; time is shown as it is written, duration (ms) overrides the default.
 */
type Story = { time?: string; duration?: number } & (
    | { image: string; alt: string }
    | { video: string }
    | { html: React.ReactNode }
);
type Person = { id: string; name: string; avatar: string; stories: Story[] };

const people: Person[] = [
    {
        id: "ada",
        name: "ada",
        avatar: "/avatars/ada.jpg",
        stories: [
            { image: "/stories/ada-1.jpg", alt: "A canoe on a lake", time: "2h" },
            { video: "/stories/ada-2.mp4", time: "1h" },
        ],
    },
    {
        id: "mert",
        name: "mert",
        avatar: "/avatars/mert.jpg",
        stories: [{ html: <div className="card">Any HTML is a story</div>, time: "5h", duration: 8000 }],
    },
];

/*
 * The avatars: any button, anywhere, opens a person by id. Style the ring
 * on data-pg-stories-seen — "true" once that person was seen to the end:
 *
 *   .ring { background: conic-gradient(#feda75, #d62976, #4f5bd5, #feda75); }
 *   [data-pg-stories-seen="true"] .ring { background: #ddd; }
 */
export function Avatars() {
    return (
        <div className="avatars">
            {people.map((p) => (
                <button key={p.id} type="button" data-pg-stories-open={p.id}>
                    <span className="ring">
                        <img src={p.avatar} alt="" />
                    </span>
                    {p.name}
                </button>
            ))}
        </div>
    );
}

/*
 * The stories themselves, written once and hidden. The viewer is built from
 * copies of them, on <body> — React's markup is never touched. A video is
 * written muted and playsInline; the viewer plays it, and the speaker turns
 * the sound on.
 */
export function StorySources() {
    // data-pg-stories-end: after a person's last story — next (default; the
    // last person closes it), close, or stay. Here, or on one person.
    return (
        <div data-pg-stories hidden data-pg-stories-end="next">
            {people.map((p) => (
                <div key={p.id} data-pg-stories-user={p.id} data-pg-stories-name={p.name} data-pg-stories-avatar={p.avatar}>
                    {p.stories.map((s, i) => (
                        <div
                            key={i}
                            data-pg-stories-item
                            data-pg-stories-time={s.time}
                            data-pg-stories-duration={s.duration}
                        >
                            {"image" in s && <img src={s.image} alt={s.alt} />}
                            {"video" in s && <video src={s.video} muted playsInline />}
                            {"html" in s && s.html}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

/* Together, on a page. */
export function Example() {
    return (
        <>
            <Stories />
            <Avatars />
            <StorySources />
        </>
    );
}

"use client";

import { useEffect } from "react";
import { initStories, showStoriesNotice, forgetStoriesSeen } from "@plusguard/stories";
import "@plusguard/stories/index.css";

/* Mount once, high in the tree: one listener answers every avatar, those
   rendered later too. With Lenis, give it autoToggle: true — the page then
   stays still while the viewer is open. */
export function Stories() {
    useEffect(() => initStories(), []);

    // What the viewer leaves to the site: a quick reaction — sent here, or
    // a visitor not signed in sent to sign in — then "Sent" over the story.
    useEffect(() => {
        const onReaction = async (e: Event) => {
            const { user, story, reaction, notice } = (e as CustomEvent).detail;
            const res = await fetch("/api/stories/reactions", {
                method: "POST",
                body: JSON.stringify({ user, story, reaction }),
            });
            if (res.status === 401) return void (location.href = "/sign-in");
            notice("Sent");
        };
        document.addEventListener("pg-stories-reaction", onReaction);
        return () => document.removeEventListener("pg-stories-reaction", onReaction);
    }, []);

    return null;
}

/* Every ring bright again, at once — no reload. */
export function ForgetSeen() {
    return (
        <button type="button" onClick={forgetStoriesSeen}>
            Forget what was seen
        </button>
    );
}

/* Anywhere else — a reply sent from your own footer, say. */
export function sayReplySent() {
    showStoriesNotice("Sent");
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
 * The avatars: any button, anywhere, opens a person by id. The ring — a
 * band of colour, a gap, the photo on a grey disc that holds its place —
 * goes grey and thinner on data-pg-stories-seen="true". Its CSS is in the
 * README ("The avatars") and the static example.
 */
export function Avatars() {
    return (
        <div className="avatars">
            {people.map((p) => (
                <button key={p.id} type="button" data-pg-stories-open={p.id}>
                    <span className="ring">
                        <img src={p.avatar} width={160} height={160} alt="" />
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

/*
 * A post: its avatar is one more button that opens the person's stories.
 * Portrait, 4:5 — Instagram's tallest feed post (1080 × 1350); the grey
 * behind the picture holds its place while it loads.
 */
export function Post({ person, image, caption }: { person: Person; image: string; caption: string }) {
    return (
        <article className="post">
            <header>
                <button type="button" data-pg-stories-open={person.id} aria-label={`${person.name}'s stories`}>
                    <span className="ring">
                        <img src={person.avatar} width={80} height={80} alt="" />
                    </span>
                </button>
                <strong>{person.name}</strong>
            </header>
            <img
                src={image}
                width={1080}
                height={1350}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "auto", aspectRatio: "4 / 5", objectFit: "cover", background: "#efefef" }}
            />
            <p>
                <strong>{person.name}</strong> {caption}
            </p>
        </article>
    );
}

/* Together, on a page. */
export function Example() {
    return (
        <>
            <Stories />
            <Avatars />
            <Post person={people[0]} image="/posts/ada-1.jpg" caption="A lake at dawn — the stories have the rest." />
            <StorySources />
        </>
    );
}

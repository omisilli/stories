/*
 * stories — early.js: before the page is first drawn, the seen marks —
 * and, for a link to a story, a cover so the story opens on it.
 *
 * initStories() marks data-pg-stories-seen="true" once the module has
 * loaded — a moment after the page is drawn, so a ring seen before shows as
 * new first, then turns grey. This little script marks each button as the
 * browser reads it, before anything is drawn; initStories() takes over
 * after.
 *
 * A classic script, in <head>, before the page's markup — not deferred, not
 * a module:
 *
 *   <script src="https://cdn.jsdelivr.net/gh/omisilli/stories@v3.0.0/early.js"></script>
 *
 * or its text written inline there. No dependencies; nothing to call.
 */
(function () {
    // A link to a story (#stories=mert/2): the page is covered, before it
    // is drawn, by the viewer's own dark — the story opens on it, the page
    // never shows first. initStories() takes the cover off.
    if (/^#stories=/.test(location.hash)) document.documentElement.setAttribute("data-pg-stories-linked", "");

    var seen;
    try {
        seen = JSON.parse(localStorage.getItem("pg-stories-seen") || "[]");
    } catch (e) {
        return;
    }
    if (!seen || !seen.length) return;
    var ids = {};
    for (var i = 0; i < seen.length; i++) ids[seen[i]] = true;

    var mark = function (el) {
        if (ids[el.getAttribute("data-pg-stories-open")]) el.setAttribute("data-pg-stories-seen", "true");
    };
    // Each element the browser adds while reading the page: a button, or
    // buttons inside it. The callback runs before the page is drawn.
    var observer = new MutationObserver(function (records) {
        for (var r = 0; r < records.length; r++) {
            var added = records[r].addedNodes;
            for (var n = 0; n < added.length; n++) {
                var node = added[n];
                if (node.nodeType !== 1) continue;
                if (node.hasAttribute("data-pg-stories-open")) mark(node);
                var inner = node.querySelectorAll("[data-pg-stories-open]");
                for (var k = 0; k < inner.length; k++) mark(inner[k]);
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // The page is read: initStories() keeps the marks from here on.
    document.addEventListener("DOMContentLoaded", function () {
        observer.disconnect();
    });
})();

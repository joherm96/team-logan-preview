// The maze's rings: one per build, Build 1 outside to Build 8 at the center.
// Status is computed from the due dates, so nothing needs editing as the semester moves:
//   reached = the due date has passed, near = the next upcoming due date, locked = later.
// Preview another day with ?today=YYYY-MM-DD (e.g. index.html?today=2026-12-19 opens the center).
const RINGS = [
  { n: 1, name: "Build 1", kind: "Individual", due: "Sep 11", date: "2026-09-11", note: "Each member’s Build 1 lives on their Path.", link: "index.html#paths", linkText: "See the Paths" },
  { n: 2, name: "Build 2", kind: "Team · Recognition", due: "Sep 25", date: "2026-09-25", note: "Hegel and Fanon on why consciousness needs another.", link: "team.html#build-2" },
  { n: 3, name: "Build 3", kind: "Individual", due: "Oct 9", date: "2026-10-09", link: "index.html#paths", linkText: "See the Paths" },
  { n: 4, name: "Build 4", kind: "Individual", due: "Oct 23", date: "2026-10-23", link: "index.html#paths", linkText: "See the Paths" },
  { n: 5, name: "Build 5", kind: "Individual", due: "Nov 6", date: "2026-11-06", link: "index.html#paths", linkText: "See the Paths" },
  { n: 6, name: "Build 6", kind: "Team", due: "Nov 20", date: "2026-11-20", link: "team.html#build-6" },
  { n: 7, name: "Build 7", kind: "Individual", due: "Dec 11", date: "2026-12-11", link: "index.html#paths", linkText: "See the Paths" },
  { n: 8, name: "Build 8", kind: "The center", due: "Dec 18", date: "2026-12-18", note: "The center of the maze." },
];

const LABELS = { reached: "Reached", near: "Approaching", locked: "Not yet reached" };

// "Today", with an optional ?today=YYYY-MM-DD override for previewing future states.
function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
let TODAY = ymd(new Date());
let PREVIEW = false;
try {
  const p = new URLSearchParams(location.search).get("today");
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p) && !isNaN(new Date(p + "T12:00:00"))) { TODAY = p; PREVIEW = true; }
} catch (e) {}

function computeStatuses() {
  let nearSet = false;
  RINGS.forEach(r => {
    if (TODAY > r.date) r.status = "reached";       // ISO strings compare correctly
    else if (!nearSet) { r.status = "near"; nearSet = true; }
    else r.status = "locked";
    if (r.status !== "reached") r.note = r.n === 8 ? "The center of the maze." : r.status === "near" ? "The next ring opens soon." : "Not yet reached.";
    else if (!r.note) r.note = r.kind === "Team" ? "Reached. The team’s work is on the team page." : "Reached. Each member’s build is on their Path.";
  });
}
computeStatuses();

function showRing(n) {
  const r = RINGS.find(x => x.n === n);
  if (!r) return;
  const $ = id => document.getElementById(id);
  $("ri-num").textContent = n === 8 ? "The center" : "Ring " + n;
  $("ri-name").textContent = r.name;
  $("ri-kind").textContent = r.kind;
  $("ri-note").textContent = r.note;
  $("ri-due").textContent = "Due " + r.due;
  const badge = $("ri-badge");
  badge.textContent = LABELS[r.status];
  badge.className = "badge " + r.status;
  const link = $("ri-link");
  const open = r.link && r.status === "reached";
  link.hidden = !open;
  if (open) { link.href = r.link; link.textContent = r.linkText || "Enter this ring"; }
  document.querySelectorAll(".ring").forEach(el => el.classList.toggle("sel", +el.dataset.ring === n));
}

function renderLocks() {
  const box = document.getElementById("locks");
  if (!box) return;
  const ahead = RINGS.filter(r => r.n < 8 && r.status !== "reached");
  box.innerHTML = ahead.map(r =>
    `<div class="lock ${r.status}"><b>${r.n}</b><span>${r.name}</span><span>${r.kind}</span><small>${r.due}${r.status === "near" ? " · Approaching" : ""}</small></div>`
  ).join("") || "<p>Every outer ring is reached.</p>";
  const center = RINGS[RINGS.length - 1];
  const note = document.getElementById("center-note");
  if (note) note.textContent = center.status === "reached" ? "Reached." : "Not yet reached.";
}

document.querySelectorAll(".ring").forEach(el => {
  const r = RINGS.find(x => x.n === +el.dataset.ring);
  if (r) {
    el.classList.remove("reached", "near", "locked");
    el.classList.add(r.status);
    el.setAttribute("aria-label", `Ring ${r.n}: ${r.name}, ${LABELS[r.status].toLowerCase()}`);
  }
  el.addEventListener("click", () => showRing(+el.dataset.ring));
  el.addEventListener("keydown", ev => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); showRing(+el.dataset.ring); }
  });
});
renderLocks();
showRing(1);

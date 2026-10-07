const $ = (id) => document.getElementById(id);
const load = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* ---------- To-do and Shoplist (same logic, different ids/keys) ---------- */
function makeList(prefix, key) {
    const form = $(prefix + "-form"), input = $(prefix + "-input");
    const ul = $(prefix + "-items"), empty = $(prefix + "-empty"), count = $(prefix + "-count");
    // old data was plain strings; upgrade it to {text, done}
    let items = load(key).map((x) => (typeof x === "string" ? { text: x, done: false } : x));

    function draw() {
        ul.innerHTML = "";
        items.forEach((item, i) => {
            const li = document.createElement("li");
            li.className = item.done ? "done" : "";

            const label = document.createElement("label");
            const box = document.createElement("input");
            box.type = "checkbox";
            box.checked = item.done;
            box.addEventListener("change", () => { item.done = box.checked; save(key, items); draw(); });
            const span = document.createElement("span");
            span.textContent = item.text;
            label.append(box, span);

            const del = document.createElement("button");
            del.type = "button";
            del.className = "del";
            del.textContent = "×";
            del.setAttribute("aria-label", "Delete " + item.text);
            del.addEventListener("click", () => { items.splice(i, 1); save(key, items); draw(); });

            li.append(label, del);
            ul.append(li);
        });
        const left = items.filter((x) => !x.done).length;
        count.textContent = items.length ? left + " left" : "";
        empty.hidden = items.length > 0;
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        items.push({ text, done: false });
        save(key, items);
        draw();
        input.value = "";
        input.focus();
    });
    draw();
}
makeList("todo", "todolist");
makeList("shop", "shoplist");

/* ---------- Dates ---------- */
const datesForm = $("dates-form"), datesTitle = $("dates-title"), datesDate = $("dates-date");
const datesYearly = $("dates-yearly"), datesList = $("dates-items"), datesEmpty = $("dates-empty");

let dateItems = load("dates");
if (!dateItems.some((x) => x.id === "jirka-birthday")) {
    dateItems.push({ id: "jirka-birthday", title: "Birthday Jirka", date: "2026-10-07", yearly: true });
    save("dates", dateItems);
}

function nextOccurrence(item, today) {
    const [y, m, d] = item.date.split("-").map(Number);
    let target = new Date(y, m - 1, d);
    if (item.yearly) {
        target = new Date(today.getFullYear(), m - 1, d);
        if (target < today) target = new Date(today.getFullYear() + 1, m - 1, d);
    }
    return target;
}

function daysLabel(days) {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days > 1) return "in " + days + " days";
    return Math.abs(days) + (days === -1 ? " day ago" : " days ago");
}

// all dates with days-until, upcoming first, past ones last
function upcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateItems
        .map((item) => {
            const target = nextOccurrence(item, today);
            return { item, target, days: Math.round((target - today) / 86400000) };
        })
        .sort((a, b) => ((a.days < 0) !== (b.days < 0) ? (a.days < 0 ? 1 : -1) : a.days - b.days));
}

function renderDates() {
    datesList.innerHTML = "";
    upcoming().forEach(({ item, target, days }) => {
        const li = document.createElement("li");
        if (days >= 0 && days <= 7) li.classList.add("soon");
        if (days < 0) li.classList.add("past");

        const chip = document.createElement("div");
        chip.className = "chip";
        chip.innerHTML = "<b></b><span></span>";
        chip.firstChild.textContent = target.getDate();
        chip.lastChild.textContent = target.toLocaleDateString("en-GB", { month: "short" });

        const info = document.createElement("div");
        info.className = "info";
        const name = document.createElement("strong");
        name.textContent = item.title;
        const small = document.createElement("small");
        small.textContent = item.yearly ? "Every year" : target.getFullYear();
        info.append(name, small);

        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = daysLabel(days);

        const del = document.createElement("button");
        del.type = "button";
        del.className = "del";
        del.textContent = "×";
        del.setAttribute("aria-label", "Delete " + item.title);
        del.addEventListener("click", () => {
            dateItems = dateItems.filter((x) => x.id !== item.id);
            save("dates", dateItems);
            refreshDates();
        });

        li.append(chip, info, badge, del);
        datesList.append(li);
    });
    datesEmpty.hidden = dateItems.length > 0;
}

datesForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = datesTitle.value.trim();
    if (!text || !datesDate.value) return;
    dateItems.push({ id: Date.now(), title: text, date: datesDate.value, yearly: datesYearly.checked });
    save("dates", dateItems);
    refreshDates();
    datesForm.reset();
    datesTitle.focus();
});

/* ---------- Hero ---------- */
function renderHero() {
    $("hero-date").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const next = upcoming().find((r) => r.days >= 0);
    const el = $("hero-next");
    el.textContent = "";
    if (!next) { el.textContent = "No upcoming dates."; return; }
    const strong = document.createElement("strong");
    strong.textContent = next.item.title;
    el.append("Next: ", strong, " · " + daysLabel(next.days).toLowerCase());
}

/* ---------- Calendar (marks days that have a saved date) ---------- */
const now = new Date();
let current = new Date(now.getFullYear(), now.getMonth(), 1);

function hasDate(year, month, day) {
    return dateItems.some((item) => {
        const [y, m, d] = item.date.split("-").map(Number);
        return m - 1 === month && d === day && (item.yearly || y === year);
    });
}

function renderCalendar() {
    const year = current.getFullYear(), month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

    $("month-title").textContent = current.toLocaleString("en-US", { month: "long", year: "numeric" });
    const list = $("days");
    list.innerHTML = "";
    for (let i = 0; i < offset; i++) list.append(document.createElement("li"));
    for (let day = 1; day <= daysInMonth; day++) {
        const li = document.createElement("li");
        li.textContent = day;
        if (day === now.getDate() && month === now.getMonth() && year === now.getFullYear()) li.classList.add("active");
        if (hasDate(year, month, day)) li.classList.add("has");
        list.append(li);
    }
}

$("prev").addEventListener("click", () => { current = new Date(current.getFullYear(), current.getMonth() - 1, 1); renderCalendar(); });
$("next").addEventListener("click", () => { current = new Date(current.getFullYear(), current.getMonth() + 1, 1); renderCalendar(); });

function refreshDates() {
    renderDates();
    renderHero();
    renderCalendar();
}
refreshDates();

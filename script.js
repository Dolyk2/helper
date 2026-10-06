const daysList = document.getElementById("days");
const title = document.getElementById("month-title");

const now = new Date();
let current = new Date(now.getFullYear(), now.getMonth(), 1); // month being shown

function render() {
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

    title.textContent = current.toLocaleString("en-US", { month: "long", year: "numeric" });
    daysList.innerHTML = "";

    // empty cells before the 1st
    for (let i = 0; i < offset; i++) {
        daysList.appendChild(document.createElement("li"));
    }

    // the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const li = document.createElement("li");
        li.textContent = day;

        const isToday =
            day === now.getDate() &&
            month === now.getMonth() &&
            year === now.getFullYear();
        if (isToday) li.classList.add("active");

        daysList.appendChild(li);
    }
}

document.getElementById("prev").addEventListener("click", () => {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    render();
});

document.getElementById("next").addEventListener("click", () => {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    render();
});

render();
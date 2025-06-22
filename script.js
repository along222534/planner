// ธีมจาก localStorage
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// toggle ธีม
document.getElementById("toggle-theme").addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});

let internData = JSON.parse(localStorage.getItem("internData")) || [];
let editingIndex = -1;

function saveData() {
  localStorage.setItem("internData", JSON.stringify(internData));
}

function renderTable() {
  const tableBody = document.querySelector("#intern-table tbody");
  tableBody.innerHTML = "";

  const filter = document.getElementById("filter-status").value;

  internData
    .filter(item => filter === "all" || item.status === filter)
    .forEach((item, index) => {
      const row = document.createElement("tr");
      row.classList.add("text-center");
      row.innerHTML = `
        <td class="border border-gray-300 p-2">${item.date}</td>
        <td class="border border-gray-300 p-2">${item.status}</td>
        <td class="border border-gray-300 p-2 space-x-1">
          <button data-index="${index}" class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded">แก้ไข</button>
          <button data-index="${index}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">ลบ</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = e.target.getAttribute("data-index");
      internData.splice(idx, 1);
      saveData();
      renderAll();
    });
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = e.target.getAttribute("data-index");
      const item = internData[idx];
      document.getElementById("date").value = item.date;
      document.getElementById("status").value = item.status;
      editingIndex = idx;
    });
  });
}

function renderSummary() {
  const hoursPerDay = 8.5;
  const summary = {};

  internData.forEach(item => {
    summary[item.status] = (summary[item.status] || 0) + 1;
  });

  let html = "";
  for (const [status, count] of Object.entries(summary)) {
    if (status === "ทำงาน") {
      const workHours = (count * hoursPerDay).toFixed(1);
      html += `<p>✔️ ${status}: ${count} วัน (${workHours} ชม.)</p>`;
    } else {
      html += `<p>📌 ${status}: ${count} วัน</p>`;
    }
  }

  if (summary["ทำงาน"]) {
    html += `<hr class="my-2" />
    <p>🕒 <strong>ชั่วโมงทำงานรวม: ${(summary["ทำงาน"] * hoursPerDay).toFixed(1)} ชม.</strong></p>`;
  }
  document.getElementById("summary-box").innerHTML = html;
}

function renderSimpleCalendar() {
  const calendarEl = document.getElementById("simple-calendar");
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  function render() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    let html = `<div class="text-center font-bold text-lg mb-2">${monthNames[currentMonth]} ${currentYear}</div><div class="grid grid-cols-7 gap-1">`;
    const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    weekdays.forEach(day => html += `<div class="text-center font-semibold">${day}</div>`);

    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const matched = internData.find(i => i.date === dateStr);
      html += `<div class="text-center p-1 rounded ${matched ? 'bg-green-300 dark:bg-green-500' : ''}">${d}</div>`;
    }
    html += `</div>`;
    calendarEl.innerHTML = html;
  }

  document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    render();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    render();
  });

  render();
}

function renderAll() {
  renderTable();
  renderSummary();
  renderSimpleCalendar();
}

document.getElementById("log-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const status = document.getElementById("status").value;

  if (!date || !status) return alert("กรุณาเลือกวันที่และสถานะให้ครบ");
  if (editingIndex >= 0) {
    internData[editingIndex] = { date, status };
    editingIndex = -1;
  } else {
    const existingIndex = internData.findIndex(item => item.date === date);
    if (existingIndex !== -1) return alert("มีรายการในวันนี้แล้ว");
    internData.push({ date, status });
  }

  internData.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveData();
  renderAll();
  this.reset();
});

document.getElementById("filter-status").addEventListener("change", renderAll);

document.getElementById("download-json").addEventListener("click", () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(internData, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "intern-data.json");
  document.body.appendChild(a);
  a.click();
  a.remove();
});

document.getElementById("download-csv").addEventListener("click", () => {
  const header = ["วันที่", "สถานะ"];
  const rows = internData.map(d => [d.date, d.status]);
  let csvContent = header.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "intern-data.csv");
  document.body.appendChild(a);
  a.click();
  a.remove();
});

renderAll();

// ตัวแปรเก็บข้อมูลและสถานะแก้ไข
let internData = JSON.parse(localStorage.getItem("internData")) || [];
let editingIndex = -1;  // -1 = ไม่ได้แก้ไข

function saveData() {
  localStorage.setItem("internData", JSON.stringify(internData));
}

function renderTable() {
  const tableBody = document.querySelector("#intern-table tbody");
  tableBody.innerHTML = "";

  const selectedFilter = document.getElementById("filter-status")?.value || "all";
  const filteredData = internData.filter(item => selectedFilter === "all" || item.status === selectedFilter);

  filteredData.forEach((item, index) => {
    const statusClassMap = {
      "ทำงาน": "bg-green-100 text-green-700",
      "ลาตามแผน": "bg-red-100 text-red-700",
      "ลาป่วย": "bg-pink-100 text-pink-700",
      "ลากิจ": "bg-purple-100 text-purple-700",
      "หยุดพิเศษ": "bg-blue-100 text-blue-700",
      "วันหยุดนักขัตฤกษ์": "bg-yellow-100 text-yellow-700",
    };
    const statusClass = statusClassMap[item.status] || "";

    const row = document.createElement("tr");
    row.classList.add("transition-all", "hover:bg-gray-100");
    row.innerHTML = `
      <td class="p-2">${item.date}</td>
      <td class="p-2 ${statusClass}">${item.status}</td>
      <td class="p-2 space-x-1">
        <button data-index="${index}" class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded">แก้ไข</button>
        <button data-index="${index}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">ลบ</button>
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
      document.getElementById("log-form").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function renderSummary() {
  const hoursPerDay = 8.5;
  const summary = {};

  internData.forEach(item => {
    summary[item.status] = (summary[item.status] || 0) + 1;
  });

  let html = '';
  for (const [status, count] of Object.entries(summary)) {
    if (status === 'ทำงาน') {
      const workHours = (count * hoursPerDay).toFixed(1);
      html += `<p>✔️ ${status}: ${count} วัน (${workHours} ชม.)</p>`;
    } else {
      html += `<p>📌 ${status}: ${count} วัน</p>`;
    }
  }
  html += `<hr class="my-2" />`;
  if (summary["ทำงาน"]) {
    html += `<p>🕒 <strong>ชั่วโมงทำงานรวม: ${(summary["ทำงาน"] * hoursPerDay).toFixed(1)} ชม.</strong></p>`;
  }

  document.getElementById("summary-box").innerHTML = html;
}

function renderCalendar() {
  const calEl = document.getElementById("simple-calendar");
  calEl.innerHTML = "";

  const monthOffset = Number(calEl.getAttribute("data-month-offset") || 0);
  const today = new Date();
  const showMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  const title = showMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  calEl.innerHTML += `<div class="text-center text-lg font-semibold mb-2">${title}</div>`;

  const firstDay = new Date(showMonth.getFullYear(), showMonth.getMonth(), 1);
  const lastDay = new Date(showMonth.getFullYear(), showMonth.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();

  let html = '<div class="grid grid-cols-7 gap-1 text-center">';
  ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(d => {
    html += `<div class="font-semibold">${d}</div>`;
  });

  for (let i = 0; i < firstDay.getDay(); i++) html += '<div></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(showMonth.getFullYear(), showMonth.getMonth(), d);
    const dateStr = dateObj.toLocaleDateString('en-CA');
    const status = internData.find(i => i.date === dateStr)?.status || "";
    const colorMap = {
      "ทำงาน": "bg-green-400",
      "ลาตามแผน": "bg-red-400",
      "ลาป่วย": "bg-pink-400",
      "ลากิจ": "bg-purple-400",
      "หยุดพิเศษ": "bg-blue-400",
      "วันหยุดนักขัตฤกษ์": "bg-yellow-300",
    };
    const statusColor = colorMap[status] || "bg-gray-200";
    html += `<div class="rounded p-1 ${statusColor} text-white text-xs sm:text-sm">${d}</div>`;
  }

  html += '</div>';
  calEl.innerHTML += html;
}

function renderAll() {
  renderTable();
  renderSummary();
  renderCalendar();
}

document.getElementById("log-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const status = document.getElementById("status").value;

  if (!date || !status) return alert("กรุณาเลือกวันที่และสถานะให้ครบ");

  const duplicateIndex = internData.findIndex(item => item.date === date);
  if (editingIndex === -1 && duplicateIndex !== -1) {
    alert("📅 คุณได้บันทึกวันที่นี้ไปแล้ว!");
    return;
  }

  if (editingIndex >= 0) {
    internData[editingIndex] = { date, status };
    editingIndex = -1;
  } else {
    internData.push({ date, status });
  }

  internData.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveData();
  renderAll();
  this.reset();
});

document.getElementById("filter-status").addEventListener("change", renderTable);

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
  let csvContent = header.join(",") + "\n";
  rows.forEach(r => {
    csvContent += r.join(",") + "\n";
  });
  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "intern-data.csv");
  document.body.appendChild(a);
  a.click();
  a.remove();
});

document.getElementById("prev-month").addEventListener("click", () => {
  const calEl = document.getElementById("simple-calendar");
  const currentOffset = Number(calEl.getAttribute("data-month-offset") || 0);
  calEl.setAttribute("data-month-offset", currentOffset - 1);
  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  const calEl = document.getElementById("simple-calendar");
  const currentOffset = Number(calEl.getAttribute("data-month-offset") || 0);
  calEl.setAttribute("data-month-offset", currentOffset + 1);
  renderCalendar();
});

renderAll();

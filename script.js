let internData = JSON.parse(localStorage.getItem("internData")) || [];
let editingIndex = -1;

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
    const row = document.createElement("tr");
    row.classList.add("transition-all", "hover:bg-gray-100");
    row.innerHTML = `
      <td class="p-2">${item.date}</td>
      <td class="p-2 ${statusClassMap[item.status] || ""}">${item.status}</td>
      <td class="p-2 space-x-1">
        <button data-index="${index}" class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded">แก้ไข</button>
        <button data-index="${index}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">ลบ</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", e => {
      const idx = e.target.getAttribute("data-index");
      internData.splice(idx, 1);
      saveData();
      renderAll();
    })
  );

  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", e => {
      const idx = e.target.getAttribute("data-index");
      const item = internData[idx];
      document.getElementById("date").value = item.date;
      document.getElementById("status").value = item.status;
      editingIndex = idx;
      document.getElementById("log-form").scrollIntoView({ behavior: "smooth" });
    })
  );
}

function renderSummary() {
  const summary = {};
  internData.forEach(item => {
    summary[item.status] = (summary[item.status] || 0) + 1;
  });

  let html = '';
  for (const [status, count] of Object.entries(summary)) {
    if (status === 'ทำงาน') {
      const hours = (count * 8.5).toFixed(1);
      html += `<p>✔️ ${status}: ${count} วัน (${hours} ชม.)</p>`;
    } else {
      html += `<p>📌 ${status}: ${count} วัน</p>`;
    }
  }
  if (summary["ทำงาน"]) {
    html += `<hr class="my-2" /><p>🕒 <strong>ชั่วโมงทำงานรวม: ${(summary["ทำงาน"] * 8.5).toFixed(1)} ชม.</strong></p>`;
  }

  document.getElementById("summary-box").innerHTML = html;
}

function renderCalendar() {
  const calEl = document.getElementById("simple-calendar");
  calEl.innerHTML = "";

  const monthOffset = Number(calEl.getAttribute("data-month-offset") || 0);
  const today = new Date();
  const showMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  const firstDay = new Date(showMonth.getFullYear(), showMonth.getMonth(), 1);
  const lastDay = new Date(showMonth.getFullYear(), showMonth.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();

  const title = showMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  calEl.innerHTML += `<div class="text-center text-lg font-semibold mb-2">${title}</div>`;

  let html = '<div class="grid grid-cols-7 gap-1 text-center">';
  ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(d => {
    html += `<div class="font-semibold">${d}</div>`;
  });

  const blankDays = (firstDay.getDay() + 7) % 7;
  for (let i = 0; i < blankDays; i++) {
    html += `<div class="p-3 min-h-[40px]"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(showMonth.getFullYear(), showMonth.getMonth(), d);
    const dateStr = dateObj.toLocaleDateString('en-CA');
    const item = internData.find(i => i.date === dateStr);
    const status = item?.status || "";

    const colorMap = {
      "ทำงาน": "bg-green-400",
      "ลาตามแผน": "bg-red-400",
      "ลาป่วย": "bg-pink-400",
      "ลากิจ": "bg-purple-400",
      "หยุดพิเศษ": "bg-blue-400",
      "วันหยุดนักขัตฤกษ์": "bg-yellow-300",
    };
    const statusColor = colorMap[status] || "bg-gray-200";

    html += `
      <div class="rounded p-2 sm:p-3 text-white text-xs sm:text-sm ${statusColor} min-h-[40px] flex items-center justify-center">
        ${d}
      </div>
    `;
  }

  html += '</div>';
  calEl.innerHTML += html;
}


function syncAllDataToGoogleSheets() {
  if (internData.length === 0) return alert("ไม่มีข้อมูลให้ซิงก์");

  let successCount = 0;
  let failCount = 0;

  Promise.all(internData.map(item =>
    fetch("https://script.google.com/macros/s/AKfycbyIA_Wh_Spwmz2NSi2Gh0lkQwJdOU_47tGc-DJn-NN7-0U72bMXaXNfbqfZEX8N1rdw/exec", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(item)
    })
    .then(res => res.ok ? successCount++ : failCount++)
    .catch(() => failCount++)
  )).then(() => {
    alert(`✅ ซิงก์เสร็จแล้ว: สำเร็จ ${successCount} / ล้มเหลว ${failCount}`);
  });
}

function renderAll() {
  renderTable();
  renderSummary();
  renderCalendar();
}

document.getElementById("log-form").addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const status = document.getElementById("status").value;
  if (!date || !status) return alert("กรุณากรอกข้อมูลให้ครบ");

  const duplicateIndex = internData.findIndex(item => item.date === date);
  if (editingIndex === -1 && duplicateIndex !== -1) return alert("📅 วันที่นี้มีข้อมูลอยู่แล้ว");

  if (editingIndex >= 0) {
    internData[editingIndex] = { date, status };
    editingIndex = -1;
  } else {
    internData.push({ date, status });
  }

  internData.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveData();
  renderAll();
  e.target.reset();
});

document.getElementById("filter-status").addEventListener("change", renderTable);
document.getElementById("download-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(internData, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "intern-data.json";
  a.click();
});
document.getElementById("download-csv").addEventListener("click", () => {
  const header = ["วันที่", "สถานะ"];
  const rows = internData.map(d => [d.date, d.status]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "intern-data.csv";
  a.click();
});
document.getElementById("prev-month").addEventListener("click", () => {
  const cal = document.getElementById("simple-calendar");
  cal.setAttribute("data-month-offset", Number(cal.getAttribute("data-month-offset") || 0) - 1);
  renderCalendar();
});
document.getElementById("next-month").addEventListener("click", () => {
  const cal = document.getElementById("simple-calendar");
  cal.setAttribute("data-month-offset", Number(cal.getAttribute("data-month-offset") || 0) + 1);
  renderCalendar();
});
document.getElementById("sync-google-sheets").addEventListener("click", () => {
  if (confirm("คุณแน่ใจว่าต้องการซิงก์ข้อมูลเก่าไป Google Sheets?")) syncAllDataToGoogleSheets();
});

renderAll();

// script.js
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let internData = [];
let editingId = null;
let currentUID = null;
let dbRef = null;

export function initFirestore(uid, db) {
  currentUID = uid;
  dbRef = collection(db, "logs");

  const q = query(dbRef, where("uid", "==", uid));
  onSnapshot(q, snapshot => {
    internData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => new Date(a.date) - new Date(b.date));
    renderAll();
  });

  document.getElementById("log-form").addEventListener("submit", submitForm);
  document.getElementById("status").addEventListener("change", toggleHourInput);
  document.getElementById("hours-select").addEventListener("change", toggleCustomHours);
}

async function submitForm(e) {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const status = document.getElementById("status").value;
  let hours = null;

  if (!date || !status) return alert("กรุณาเลือกวันที่และสถานะให้ครบ");

  if (status === "ทำงาน") {
    const selected = document.getElementById("hours-select").value;
    hours = selected === "custom" ? parseFloat(document.getElementById("custom-hours").value) : parseFloat(selected);
    if (isNaN(hours) || hours <= 0) return alert("กรุณากรอกชั่วโมงให้ถูกต้อง");
  }

  const existing = internData.find(i => i.date === date);
  if (!editingId && existing) return alert("📅 วันที่นี้มีข้อมูลอยู่แล้ว!");

  const data = { uid: currentUID, date, status };
  if (status === "ทำงาน") data.hours = hours;

  try {
    if (editingId) {
      await updateDoc(doc(dbRef, editingId), data);
      editingId = null;
      alert("แก้ไขข้อมูลสำเร็จ");
    } else {
      await addDoc(dbRef, data);
      alert("เพิ่มข้อมูลสำเร็จ");
    }
    e.target.reset();
    toggleHourInput();
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
}

function toggleHourInput() {
  const status = document.getElementById("status").value;
  const wrapper = document.getElementById("hours-wrapper");
  const custom = document.getElementById("custom-hours");

  wrapper.classList.toggle("hidden", status !== "ทำงาน");
  if (status !== "ทำงาน") custom.classList.add("hidden");
}

function toggleCustomHours() {
  const custom = document.getElementById("custom-hours");
  custom.classList.toggle("hidden", document.getElementById("hours-select").value !== "custom");
}

window.editLogById = function (id) {
  const item = internData.find(i => i.id === id);
  if (!item) return;

  document.getElementById("date").value = item.date;
  document.getElementById("status").value = item.status;
  if (item.status === "ทำงาน") {
    document.getElementById("hours-wrapper").classList.remove("hidden");
    if (item.hours === 8.5 || item.hours === 4.5) {
      document.getElementById("hours-select").value = item.hours;
      document.getElementById("custom-hours").classList.add("hidden");
    } else {
      document.getElementById("hours-select").value = "custom";
      document.getElementById("custom-hours").value = item.hours;
      document.getElementById("custom-hours").classList.remove("hidden");
    }
  } else {
    document.getElementById("hours-wrapper").classList.add("hidden");
    document.getElementById("custom-hours").classList.add("hidden");
  }

  editingId = id;
  document.getElementById("log-form").scrollIntoView({ behavior: "smooth" });
};

window.deleteLogFromFirestore = function (id) {
  if (confirm("❌ ต้องการลบข้อมูลนี้หรือไม่?")) {
    deleteDoc(doc(dbRef, id));
  }
}

function renderTable() {
  const tableBody = document.querySelector("#intern-table tbody");
  tableBody.innerHTML = "";

  const filteredData = internData; // กรองถ้าต้องการเพิ่ม filter ได้

  filteredData.forEach(item => {
    const statusClassMap = {
      "ทำงาน": "bg-green-100 text-green-700",
      "ลาป่วย": "bg-pink-100 text-pink-700",
      "ลากิจ": "bg-purple-100 text-purple-700",
      "หยุดพิเศษ": "bg-blue-100 text-blue-700",
      "วันหยุดนักขัตฤกษ์": "bg-yellow-100 text-yellow-700",
    };
    const statusClass = statusClassMap[item.status] || "";
    const displayStatus = item.status === "ทำงาน" && item.hours ? `${item.status} (${item.hours} ชม.)` : item.status;

    const row = document.createElement("tr");
    row.classList.add("transition-all", "hover:bg-gray-100");
    row.innerHTML = `
      <td class="p-2">${item.date}</td>
      <td class="p-2 ${statusClass}">${displayStatus}</td>
      <td class="p-2 space-x-1">
        <button onclick="editLogById('${item.id}')" class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded">แก้ไข</button>
        <button onclick="deleteLogFromFirestore('${item.id}')" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">ลบ</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function renderSummary() {
  const summary = {};
  let totalHours = 0;

  internData.forEach(item => {
    summary[item.status] = (summary[item.status] || 0) + 1;
    if (item.status === "ทำงาน") {
      totalHours += item.hours || 8.5;
    }
  });

  let html = '';
  for (const [status, count] of Object.entries(summary)) {
    if (status === 'ทำงาน') {
      html += `<p>✔️ ${status}: ${count} วัน (${totalHours.toFixed(1)} ชม.)</p>`;
    } else {
      html += `<p>📌 ${status}: ${count} วัน</p>`;
    }
  }

  if (summary["ทำงาน"]) {
    html += `<hr class="my-2" /><p>🕒 <strong>ชั่วโมงทำงานรวม: ${totalHours.toFixed(1)} ชม.</strong></p>`;
  }

  document.getElementById("summary-box").innerHTML = html;
}

function formatDateLocal(dateObj) {
  return dateObj.getFullYear() + '-' +
    String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
    String(dateObj.getDate()).padStart(2, '0');
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
  ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(d => html += `<div class="font-semibold">${d}</div>`);

  for (let i = 0; i < firstDay.getDay(); i++) html += '<div></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(showMonth.getFullYear(), showMonth.getMonth(), d);
    const dateStr = formatDateLocal(dateObj);
    const status = internData.find(i => i.date === dateStr)?.status || "";
    const colorMap = {
      "ทำงาน": "bg-green-400",
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

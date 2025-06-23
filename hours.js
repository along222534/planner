// แสดง/ซ่อน dropdown ชั่วโมงทำงานตามสถานะ
document.getElementById("status").addEventListener("change", () => {
  const status = document.getElementById("status").value;
  const wrapper = document.getElementById("hours-wrapper");
  if (status === "ทำงาน") {
    wrapper.classList.remove("hidden");
  } else {
    wrapper.classList.add("hidden");
    document.getElementById("custom-hours").classList.add("hidden");
  }
});

// แสดง input ระบุเอง ถ้าเลือก "custom"
document.getElementById("hours-select").addEventListener("change", () => {
  const isCustom = document.getElementById("hours-select").value === "custom";
  document.getElementById("custom-hours").classList.toggle("hidden", !isCustom);
});

// ดักจับ form submit เพื่อเพิ่มค่า hours ไปด้วย
document.getElementById("log-form").addEventListener("submit", function (e) {
  const status = document.getElementById("status").value;
  let hours = null;

  if (status === "ทำงาน") {
    const selected = document.getElementById("hours-select").value;
    if (selected === "custom") {
      const val = parseFloat(document.getElementById("custom-hours").value);
      if (isNaN(val)) {
        e.preventDefault();
        alert("กรุณากรอกชั่วโมงให้ถูกต้อง");
        return;
      }
      hours = val;
    } else {
      hours = parseFloat(selected);
    }
  }

  // เก็บชั่วโมงลง data attribute ของ form เพื่อให้ script.js ใช้
  this.dataset.hours = hours ?? '';
});

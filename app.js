const API_URL = "https://script.google.com/macros/s/AKfycbzgVrBgM7VfyF5UHrCU2F9Cbn5PLjROBsIsmvXC8LovymHbUB6iciGb_h_rb2B8akQZXA/exec";

const dStock = document.getElementById('dStock');
const dIn = document.getElementById('dIn');
const dOut = document.getElementById('dOut');
const dReturn = document.getElementById('dReturn');
const dStockReport = document.getElementById('dStockReport');
const dInReport = document.getElementById('dInReport');
const dOutReport = document.getElementById('dOutReport');
const dReturnReport = document.getElementById('dReturnReport');

const inQty = document.getElementById('inQty')
const outQty = document.getElementById('outQty')
const retQty = document.getElementById('retQty')
const outLevelSelect = document.getElementById("outLevelSelect");
const outClassSelect = document.getElementById("outClass");
const retLevelSelect = document.getElementById("retLevelSelect");
const retClassSelect = document.getElementById("retClass");
const outRep = document.getElementById("outRep");
const retRep = document.getElementById("retRep");
const submitBtn = document.getElementById("incomingSubmitBtn");
const submitDistribution = document.getElementById("submitDistribution");
const submitReturn = document.getElementById("submitReturn");

const today = new Date().toISOString().split("T")[0];

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[type="date"]:not(.no-auto-date)').forEach(i => {
    i.value = today;
  });
});

// DATABASE SPREADSHEET
let db = {};

async function loadDB() {
  try {
    const res = await fetch(API_URL);
    db = await res.json();
    
    renderDashboard();
    renderRecentActivity();
    renderReportTable(getAllTransactions());
  } catch (err) {
    console.error("Gagal load DB:", err);
  }
  renderClassPanel();
  updateDailyClassCounters(); 
}

async function sendData(data, action="add", row=null) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, row, ...data })
  });
  setTimeout(loadDB, 1000);
}


function showPage(id, btn) {
  document.querySelectorAll("main section").forEach(s => s.classList.add("d-none"));
  document.getElementById(id).classList.remove("d-none");
  document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function stock() {
  const todayData = db.filter(d => d.date === today);

  const incoming = todayData
    .filter(d => d.type === "INCOMING")
    .reduce((a,b)=>a+b.qty,0);

  const distribution = todayData
    .filter(d => d.type === "DISTRIBUTION")
    .reduce((a,b)=>a+b.qty,0);

  const returns = todayData
    .filter(d => d.type === "KEMBALI")
    .reduce((a,b)=>a+b.qty,0);

  return Math.max(incoming + returns - distribution, 0);
}

async function addIncoming() {
  const qtyInput = Number(inQty.value);

  if (qtyInput <= 0 || isNaN(qtyInput)) {
    showErrorToast("Quantity wajib diisi dan tidak boleh di bawah 1!");
    inQty.focus();
    return;
  }
  if (!inRep.value) {
    showErrorToast("Nama perwakilan wajib diisi!");
    inRep.focus()
    return
  };
  if(incomingMode == "KEMBALI" && qtyInput > db.filter(d => d.date == today).reduce((a,b) => a+ b.qty,0)){
    showErrorToast("Jumlah MBG yang anda Kembalikan hari ini tidak bisa lebih dari jumlah yang anda ambil");
    inQty.focus();
    return;
  }
  const oriTextIncoming = submitBtn.innerText;
  submitBtn.innerText = "Memuat data...";
  submitBtn.disabled = true;
  await sendData({
    type: "INCOMING",
    date: inDate.value,
    qty: incomingMode === "DATANG" ? +inQty.value : -inQty.value,
    details: inMBG.value,
    rep: inRep.value,
    notes: inNotes.value
  });
  submitBtn.innerText = oriTextIncoming;
  submitBtn.disabled = false;

  showSuccessToast("Data berhasil disimpan ✅");
  document.getElementById("inNotes").value = "";
  document.getElementById("inRep").value = "";
  document.getElementById("inQty").value = "";
  document.getElementById("inMBG").value = "MBG Kitchen";
}


async function addDistribution() {
  if (outQty.value <= 0) {
    showErrorToast("Quantity wajib diisi dan tidak boleh di bawah 1!");
    outQty.focus();
    return
  };
  if (!outClass.value) {
    showErrorToast("Class wajib diisi!");
    outClass.focus();
    return
  };
  if (!outRep.value) {
    showErrorToast("Nama perwakilan wajib diisi!");
    outRep.focus()
    return
  };
  if (+outQty.value > stock()) {
    showErrorToast("Stok MBG tidak cukup!")
    outQty.focus()
    return;
  };
  if(db.some(d => d.type == "DISTRIBUTION" && d.details == outClass.value && d.date == today)){
   showErrorToast("Kelas ini sudah mengambil MBG, jika terdapat kesalahan silahkan perbaiki di menu Reports!")
    outClass.focus()
    return;
  }
  const oriTextDistribution = submitDistribution.innerText;
  submitDistribution.innerText = "Memuat data...";
  submitDistribution.disabled = true;
  await sendData({
    type: "DISTRIBUTION",
    date: outDate.value,
    qty: +outQty.value,
    details: outClass.value,
    rep: outRep.value,
    notes: outNotes.value
  });
  submitDistribution.innerText = oriTextDistribution;
  submitDistribution.disabled = false;
  
  showSuccessToast("Data berhasil disimpan ✅");
  document.getElementById("outQty").value = "";
  document.getElementById("outLevelSelect").value = "--Pilih Kelas--";
  document.getElementById("outRep").value = "";
  document.getElementById("outNotes").value = "";
  document.getElementById("outClass").disabled = true;
  document.getElementById("outClass").value = "";
}

async function addReturn() {
  if (retQty.value <= 0) {
    showErrorToast("Quantity wajib diisi dan tidak boleh di bawah 1!")
    retQty.focus()
    return
  }
  if (!retClass.value) {
    showErrorToast("Class wajib diisi!");
    retClass.focus();
    return
  };
  if (!retRep.value) {
    showErrorToast("Nama perwakilan wajib diisi!");
    retRep.focus();
    return
  };
  if(!db.some(d => d.type == "DISTRIBUTION" && d.details == retClass.value && d.date == today)){
    showErrorToast("Kelas ini belum mengambil MBG!")
    return;
  };
  if(retQty.value > db.filter(d => d.date == today & d.details == retClass.value && d.type == "DISTRIBUTION").reduce((a,b) => a+ b.qty,0)){
    showErrorToast("Jumlah MBG yang anda Kembalikan tidak bisa lebih dari jumlah yang anda ambil");
    retQty.focus();
    return;
  }
  if(db.some(d => d.type == "RETURN" && d.details == retClass.value && d.date == today)){
   showErrorToast("Kelas ini sudah mengembalikan MBG, jika terdapat kesalahan silahkan perbaiki di menu Reports!")
    retClass.focus()
    return;
  };
  
  const oriTextReturn = submitReturn.innerText;
  submitReturn.innerText = "Memuat data..."
  submitReturn.disabled = true;
  await sendData({
    type: "RETURN",
    date: retDate.value,
    qty: +retQty.value,
    details: retClass.value,
    rep: retRep.value,
    notes: retNotes.value
  });
  submitReturn.innerText = oriTextReturn;
  submitReturn.disabled = false;
  
  showSuccessToast("Data berhasil disimpan ✅");
  document.getElementById("retQty").value = "";
  document.getElementById("retLevelSelect").value = "--Pilih Kelas--";
  document.getElementById("retRep").value = "";
  document.getElementById("retNotes").value = "";
  document.getElementById("retClass").disabled = true;
  document.getElementById("retClass").value = "";
  document.getElementById("returnKelas").textContent = "0";
}

// TOAST
function showErrorToast(message) {
  const toastEl = document.getElementById("errorToast");
  document.getElementById("errorToastMsg").innerText = message;
  const toast = new bootstrap.Toast(toastEl, {
    delay: 3000
  });

  toast.show();
}

function showSuccessToast(message) {
  const toastEl = document.getElementById("successToast");
  document.getElementById("successToastMsg").innerText = message;

  const toast = new bootstrap.Toast(toastEl, {
    delay: 3000
  });

  toast.show();
}

// INPUT CLASS
const classData = {
  10: ["10-1", "10-2", "10-3", "10-4", "10-5","10-6", "10-7", "10-8", "10-9", "10-10"],
  11: ["11-1", "11-2", "11-3", "11-4", "11-5","11-6", "11-7", "11-8", "11-9", "11-10"],
  12: ["12-1", "12-2", "12-3", "12-4", "12-5","12-6", "12-7", "12-8", "12-9", "12-10"],
  13: [],
  14: []
};

outLevelSelect.addEventListener("change", () => {
  const outLevel = outLevelSelect.value;

  outClassSelect.innerHTML = `<option value="">--Pilih Kelas--</option>`;
  outClassSelect.disabled = true;

  if (!outLevel || !classData[outLevel]) return;

  classData[outLevel].forEach(cls => {
    const opt = document.createElement("option");
    opt.value = cls;
    opt.textContent = cls;
    outClassSelect.appendChild(opt);
  });

  outClassSelect.disabled = false;
});

retLevelSelect.addEventListener("change", () => {
  const retLevel = retLevelSelect.value;

  retClassSelect.innerHTML = `<option value="">--Pilih Kelas--</option>`;
  retClassSelect.disabled = true;

  if (!retLevel || !classData[retLevel]) return;

  classData[retLevel].forEach(cls => {
    const opt = document.createElement("option");
    opt.value = cls;
    opt.textContent = cls;
    retClassSelect.appendChild(opt);
  });

  retClassSelect.disabled = false;
});

// COUNTER ON HOVER

// INCOMING COUNTER
const boxIn = document.getElementById("dBoxIn");
boxIn.addEventListener("mouseenter", () => {
  document.getElementById('labelIn').textContent = "TOTAL DATANG";
  dIn.textContent = db.filter(item => item.qty > 0 && item.type === "INCOMING").reduce((a,b)=>a+b.qty,0);
});
boxIn.addEventListener("mouseleave", () => {
  document.getElementById('labelIn').textContent = "DATANG";
  dIn.textContent = db.filter(item => item.date === today && item.qty > 0 && item.type === "INCOMING").reduce((a,b)=>a+b.qty,0);
});
const boxInReport = document.getElementById("dBoxInReport");
boxInReport.addEventListener("mouseenter", () => {
  document.getElementById('labelInReport').textContent = "TOTAL DATANG";
  dInReport.textContent = db.filter(item => item.qty > 0 && item.type === "INCOMING").reduce((a,b)=>a+b.qty,0);
});
boxInReport.addEventListener("mouseleave", () => {
  document.getElementById('labelInReport').textContent = "DATANG";
  dInReport.textContent = db.filter(item => item.date === today && item.qty > 0 && item.type === "INCOMING").reduce((a,b)=>a+b.qty,0);
});

// DISTRIBUTED COUNTER
const boxOut = document.getElementById("dBoxOut");
boxOut.addEventListener("mouseenter", () => {
  document.getElementById('labelOut').textContent = "TOTAL DISTRIBUSI";
  dOut.textContent = db.filter(d => d.type === "DISTRIBUTION").reduce((a,b)=>a+b.qty,0);
});
boxOut.addEventListener("mouseleave", () => {
  document.getElementById('labelOut').textContent = "DISTRIBUSI";
  dOut.textContent = db.filter(d => d.date === today && d.type === "DISTRIBUTION").reduce((a,b)=>a+b.qty,0);
});
const boxOutReport = document.getElementById("dBoxOutReport");
boxOutReport.addEventListener("mouseenter", () => {
  document.getElementById('labelOutReport').textContent = "TOTAL DISTRIBUSI";
  dOutReport.textContent = db.filter(d => d.type === "DISTRIBUTION").reduce((a,b)=>a+b.qty,0);
});
boxOutReport.addEventListener("mouseleave", () => {
  document.getElementById('labelOutReport').textContent = "DISTRIBUSI";
  dOutReport.textContent = db.filter(d => d.date === today && d.type === "DISTRIBUTION").reduce((a,b)=>a+b.qty,0);
});

// RETURNED COUNTER
const boxReturn = document.getElementById("dBoxReturn");
boxReturn.addEventListener("mouseenter", () => {
  document.getElementById('labelReturn').textContent = "TOTAL KEMBALI";
  dReturn.textContent =  db.filter(d => d.type === "RETURN").reduce((a,b)=>a+b.qty,0);
});
boxReturn.addEventListener("mouseleave", () => {
  document.getElementById('labelReturn').textContent = "KEMBALI";
  dReturn.textContent = db.filter(d => d.date === today && d.type === "RETURN").reduce((a,b)=>a+b.qty,0);
});
const boxReturnReport = document.getElementById("dBoxReturnReport");
boxReturnReport.addEventListener("mouseenter", () => {
  document.getElementById('labelReturnReport').textContent = "TOTAL KEMBALI";
  dReturnReport.textContent =  db.filter(d => d.type === "RETURN").reduce((a,b)=>a+b.qty,0);
});
boxReturnReport.addEventListener("mouseleave", () => {
  document.getElementById('labelReturnReport').textContent = "KEMBALI";
  dReturnReport.textContent = db.filter(d => d.date === today && d.type === "RETURN").reduce((a,b)=>a+b.qty,0);
});

// DASHBOARD

function renderDashboard() {
  const tData = db.filter(d => d.date === today);

  let incoming = 0, kembali = 0, distribution = 0, returns = 0;

  tData.forEach(d => {
    if (d.type === "INCOMING") incoming += d.qty;
    else if (d.type === "KEMBALI") kembali += d.qty;
    else if (d.type === "DISTRIBUTION") distribution += d.qty;
    else if (d.type === "RETURN") returns += d.qty;
  });

  const currentStock = Math.max(incoming + kembali - distribution, 0);

  // ===== DASHBOARD =====
  dStock.textContent = currentStock;
  dIn.textContent = incoming;
  dOut.textContent = distribution;
  dReturn.textContent = returns;

  // ===== REPORT =====
  dStockReport.textContent = currentStock;
  dInReport.textContent = incoming;
  dOutReport.textContent = distribution;
  dReturnReport.textContent = returns;

  // ===== WIDGET =====
  document.getElementById("incomingStock").textContent = currentStock;
  document.getElementById("distStock").textContent = currentStock;
  document.getElementById("distTotal").textContent = distribution;
  document.getElementById("returnStock").textContent = returns;
}


function renderRecentActivity() {
  const container = document.getElementById("recentActivity");
  if (!container) return;

  const activities = getAllTransactions().slice(0, 10); 
  container.innerHTML = "";

  if (activities.length === 0) {
    container.innerHTML = `
      <li class="list-group-item text-muted text-center">
        No activity yet
      </li>
    `;
    return;
  }

  activities.forEach(a => {
    const icon =
      a.type === "INCOMING" ? "bi-box-seam text-success" :
      a.type === "KEMBALI" ? "bi-box-seam text-danger" :
      a.type === "DISTRIBUTION" ? "bi-upload text-warning" :
      "bi-arrow-counterclockwise text-purple";

    const sign =
      a.type === "DISTRIBUTION" ? "-" :
      a.type === "KEMBALI" ? "":
      "+";

    container.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <i class="bi ${icon} fs-5"></i>
          <div>
            <div class="fw-semibold">
              ${a.type === "INCOMING" ? "Received from Kitchen" :
                a.type === "KEMBALI" ? "Back to Kitchen" :
                a.type === "DISTRIBUTION" ? `Distributed to ${a.details}` :
                `Returned from ${a.details}`}
            </div>
            <small class="text-muted">${a.date}</small>
          </div>
        </div>

        <span class="fw-bold ${sign === "-" ? "text-danger" : 
          sign === "" ? "text-danger" :
          "text-success"}">
          ${sign}${a.qty}
        </span>
      </li>
    `;
  });
}

// INCOMING
let incomingMode = "DATANG"
function setIncomingMode(mode) {
  incomingMode = mode;

  const btnDatang = document.getElementById("btnDatang");
  const btnKembali = document.getElementById("btnKembali");

  if (mode === "DATANG") {
    btnDatang.classList.add("btn-primary", "active");
    btnDatang.classList.remove("btn-outline-primary");
    btnKembali.classList.add("btn-outline-primary");
    btnKembali.classList.remove("btn-primary", "active");
    submitBtn.textContent = "Submit Datang";
    document.getElementById("inDate").disabled = false;
  } else {
    btnKembali.classList.add("btn-primary", "active");
    btnKembali.classList.remove("btn-outline-primary");
    btnDatang.classList.add("btn-outline-primary");
    btnDatang.classList.remove("btn-primary", "active");
    submitBtn.textContent = "Submit Kembali";
    document.getElementById("inDate").disabled = true;
    document.getElementById("inDate").value = today;
  }
}

// RETURN
function updateReturnKelasDisplay(cls) {
  if (!cls) return;

  const totalDistribusi = db
    .filter(d => d.date === today && d.type === "DISTRIBUTION" && d.details == cls)
    .reduce((a,b)=>a+b.qty,0);

  const totalReturn = db
    .filter(d => d.date === today && d.type === "RETURN" && d.details == cls)
    .reduce((a,b)=>a+b.qty,0);

  returnKelas.textContent = totalDistribusi - totalReturn;
}
retClassSelect.addEventListener("change", (e) => {
  updateReturnKelasDisplay(e.target.value);
});


// RECAPS
let currentMode = "DISTRIBUTION";

function setMode(mode) {
  currentMode = mode;
  modeDist.classList.toggle("active", mode === "DISTRIBUTION");
  modeReturn.classList.toggle("active", mode === "RETURN");
  renderClassPanel();
}

function renderClassPanel() {
  const container = document.getElementById("classPanel");
  container.innerHTML = "";

  [10,11,12].forEach(level => {
    const group = document.createElement("div");
    group.className = "class-group";

    const title = document.createElement("div");
    title.className = "class-title";
    title.textContent = `Kelas ${level}`;

    const grid = document.createElement("div");
    grid.className = "class-grid";

    classData[level].forEach(cls => {
      const btn = document.createElement("button");
      btn.textContent = cls;
      btn.className = "class-button";

      const todayData = db.filter(d => d.date === today);

      const distributed = todayData.some(d => d.type === "DISTRIBUTION" && d.details === cls);
      const returned = todayData.some(d => d.type === "RETURN" && d.details === cls);

      if (currentMode === "DISTRIBUTION") {
        btn.classList.add(distributed ? "orange" : "gray");
      } else {
        btn.classList.add(returned ? "purple" : "gray");
      }
      btn.onclick = () => {
        if(currentMode === "DISTRIBUTION"){
          showPage('distribution', document.querySelector('[onclick*="distribution"]'));
          selectClass(outLevelSelect, outClassSelect, cls);
        }else if(currentMode === "RETURN"){
          showPage('return', document.querySelector('[onclick*="return"]'));
          selectClass(retLevelSelect, retClassSelect, cls);
        }
      };
      grid.appendChild(btn);
    });

    group.appendChild(title);
    group.appendChild(grid);
    container.appendChild(group);
  });
}
function selectClass(levelSelect, classSelect, cls) {
  const level = cls.split("-")[0];

  levelSelect.value = level;
  classSelect.innerHTML = `<option value="">--Pilih Kelas--</option>`;

  classData[level].forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    if (c === cls) opt.selected = true;
    classSelect.appendChild(opt);
  });

  classSelect.disabled = false;

  classSelect.dispatchEvent(new Event("change"));
}
function updateDailyClassCounters() {
  const todayData = db.filter(d => d.date === today);

  // Ambil kelas unik untuk masing-masing tipe
  const distribClasses = new Set(
    todayData
      .filter(d => d.type === "DISTRIBUTION")
      .map(d => d.details)
  );

  const returnClasses = new Set(
    todayData
      .filter(d => d.type === "RETURN")
      .map(d => d.details)
  );
  document.getElementById("disRecaps").textContent = distribClasses.size;
  document.getElementById("retRecaps").textContent = returnClasses.size;
}

// REPORT
function truncateText(text, max = 30) {
  if (!text) return "";
  return text.length > max
    ? text.slice(0, max) + "..."
    : text;
}

function renderReportTable(list) {
  reportTable.innerHTML = "";

  const sortedList = [...list].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  sortedList.forEach((d, i) => {
    const badge =
      d.type === "INCOMING" ? "badge-in" :
      d.type === "DISTRIBUTION" ? "badge-out" :
      d.type === "KEMBALI" ? "badge-kembali" :
      "badge-return";

    reportTable.innerHTML += `
      <tr>
        <td>${d.date}</td>
        <td><span class="badge-type ${badge}">${d.type}</span></td>
        <td>
          <strong>${d.details}</strong><br>
          <small class="text-muted" title="${d.note || ""}">
            ${truncateText(d.note, 30)}
          </small>
        </td>
        <td>${d.rep || "-"}</td>
        <td class="fw-bold">${d.qty}</td>
        <td>
          <button
            class="btn btn-danger btn-sm action-delete action-btn"
            onclick="openDeleteModal(${i})">
            🗑
          </button>          
          <button
            class="btn btn-warning btn-sm action-delete action-btn"
            onclick="openEditModal(${i})">
            ✏️
          </button>
        </td>
      </tr>
    `;
  });
}

function getAllTransactions() {
  return db
    .map(d => ({
      row: d.row,
      type: d.qty < 0 ? "KEMBALI": d.type,
      date: d.date,
      qty: d.qty,
      details: d.details,
      rep: d.rep,
      note: d.notes || "-"
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// FILTER
function applyReportFilter() {
  let list = getAllTransactions();

  if (filterType.value !== "ALL") {
    list = list.filter(d => d.type === filterType.value);
  }

  if (filterFrom.value) {
    list = list.filter(d => d.date >= filterFrom.value);
  }

  if (filterTo.value) {
    list = list.filter(d => d.date <= filterTo.value);
  }
  renderReportTable(list);
}

// DELETE
let deleteIndex = null;

function openDeleteModal(index) {
  deleteIndex = index;
  new bootstrap.Modal(
    document.getElementById("deleteColomModal")
  ).show();
}

async function deleteTransaction(index) {
  const all = getAllTransactions();
  const item = all[index];

  if (!item.row) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteRow",
        row: item.row
      })
    });
    
    // Refresh data agar tampilan sinkron dengan kondisi Spreadsheet terbaru
    if (typeof loadData === "function") {
      loadData(); 
    } else {
      location.reload();
    }
  } catch (error) {
    console.error("Gagal menghapus:", error);
  }
}

async function confirmDelete() {
  if (deleteIndex === null) return;

  // Tampilkan loading jika perlu
  const deleteBtn = document.getElementById("hapusRow");
  const originalText = deleteBtn.innerText;
  deleteBtn.innerText = "Menghapus...";
  deleteBtn.disabled = true;

  await deleteTransaction(deleteIndex);

  deleteIndex = null;
  deleteBtn.innerText = originalText;
  deleteBtn.disabled = false;

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("deleteColomModal")
  );
  modal.hide();
}
async function clearDB(){
  const deleteBtnData = document.getElementById("hapusData");
  const oriTextDelete = deleteBtnData.innerText;
  deleteBtnData.innerText = "Menghapus...";
  deleteBtnData.disabled = true;
  await fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ action: "clear" })
  })
  .then(r => r.json())
  .then(res => {
    window.location.reload()
  });
  deleteBtnData.innerText = oriTextDelete;
  deleteBtnData.disabled = false;
}

// EDIT
function openEditModal(index) {
  const all = getAllTransactions();
  const item = all[index];

  document.getElementById("editRow").value = item.row;
  document.getElementById("editDate").value = item.date;
  document.getElementById("editQty").value = item.qty;
  document.getElementById("editDetails").value = item.details;
  document.getElementById("editRep").value = item.rep;
  document.getElementById("editNotes").value = item.note;

  new bootstrap.Modal(document.getElementById("editModal")).show();
}

const editQty = document.getElementById("editQty")
async function saveEdit() {
  const row = document.getElementById("editRow").value;
  const all = getAllTransactions();
  const item = all.find(d => d.row == row);
  if (item.type != "KEMBALI" && editQty.value <= 0) {
    showErrorToast("Quantity wajib diisi dan minimal 1!")
    editQty.focus()
    return
  }
  if (!editRep.value) {
    showErrorToast("Nama perwakilan wajib diisi!");
    editRep.focus()
    return
  };

  const editBtnData = document.getElementById("editBtn");
  const oriTextEdit = editBtnData.innerText;
  editBtnData.innerText = "Mengupdate...";
  editBtnData.disabled = true;

  await sendData({
    date: item.date,
    type: item.type,
    qty: +editQty.value,
    details: editDetails.value,
    rep: editRep.value,
    notes: editNotes.value
  }, "update", row);

  editBtnData.innerText = oriTextEdit;
  editBtnData.disabled = false;

  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();

  showSuccessToast("Data berhasil diperbarui ✨");
}

// LOCK SCREEN
let correctPin = "";

async function getPin() {
  const res = await fetch(API_URL+"?mode=pin");
  correctPin = (await res.text()).trim();
  document.getElementById("lockScreenBtn").disabled = false;
}
function unlockApp() {
  const input = document.getElementById("lockInput").value;

  if (input === correctPin) {
    document.getElementById("lockscreen").style.display = "none";
  } else {
    showErrorToast('Password Salah')
  }
}
document.getElementById("lockInput").addEventListener("keypress", function(e){
  if(e.key === "Enter") unlockApp();
});

// RESPONSIVE MOBILE MENU
const sidebar = document.querySelector(".sidebar");

const overlay = document.createElement("div");
overlay.className = "menu-overlay";
document.body.appendChild(overlay);

document.getElementById("menuToggle").addEventListener("click", () => {
  sidebar.classList.add("show");
  overlay.classList.add("show");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("show");
  overlay.classList.remove("show");
});


// init
getPin();
loadDB();
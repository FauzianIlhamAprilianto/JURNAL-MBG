const dStock = document.getElementById('dStock');
const dIn = document.getElementById('dIn');
const dOut = document.getElementById('dOut');
const dReturn = document.getElementById('dReturn');
const dStockReport = document.getElementById('dStockReport');
const dInReport = document.getElementById('dInReport');
const dOutReport = document.getElementById('dOutReport');
const dReturnReport = document.getElementById('dReturnReport');
const today = new Date().toISOString().split("T")[0];

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[type="date"]').forEach(i => {
    i.value = today;
  });
});


const db = JSON.parse(localStorage.getItem("mbg")) || {
  incoming: [],
  distribution: [],
  returns: []
};

function save() {
  localStorage.setItem("mbg", JSON.stringify(db));
  renderDashboard();
  renderRecentActivity()
  renderReportTable(getAllTransactions());
}

function showPage(id, btn) {
  document.querySelectorAll("main section").forEach(s => s.classList.add("d-none"));
  document.getElementById(id).classList.remove("d-none");

  document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function stock() {
  return db.incoming.reduce((a,b)=>a+b.qty,0)
       - db.distribution.reduce((a,b)=>a+b.qty,0)
       + db.returns.reduce((a,b)=>a+b.qty,0);
}

function addIncoming() {
  db.incoming.push({ date: inDate.value, qty:+inQty.value, notes: inNotes.value });
  save();
}

function addDistribution() {
  if (+outQty.value > stock()) return alert("Stock not enough");
  db.distribution.push({ date: outDate.value, qty:+outQty.value, class:outClass.value, rep:outRep.value, notes: outNotes.value });
  save();
}

function addReturn() {
  db.returns.push({ date: retDate.value, qty:+retQty.value, class:retClass.value, rep:retRep.value, notes: retNotes.value });
  save();
}

function renderDashboard() {
  dStock.textContent = stock();
  dIn.textContent = db.incoming.reduce((a,b)=>a+b.qty,0);
  dOut.textContent = db.distribution.reduce((a,b)=>a+b.qty,0);
  dReturn.textContent = db.returns.reduce((a,b)=>a+b.qty,0);
  dStockReport.textContent = stock();
  dInReport.textContent = db.incoming.reduce((a,b)=>a+b.qty,0);
  dOutReport.textContent = db.distribution.reduce((a,b)=>a+b.qty,0);
  dReturnReport.textContent = db.returns.reduce((a,b)=>a+b.qty,0);
  document.getElementById("incomingStock").textContent = stock();
  document.getElementById("distStock").textContent = stock();
  document.getElementById("returnStock").textContent = stock();
}
function renderRecentActivity() {
  const container = document.getElementById("recentActivity");
  if (!container) return;

  const activities = getAllTransactions().slice(0, 5); // ambil 5 terbaru
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
      a.type === "INCOMING" ? "bi-download text-success" :
      a.type === "DISTRIBUTION" ? "bi-upload text-warning" :
      "bi-arrow-counterclockwise text-purple";

    const sign =
      a.type === "DISTRIBUTION" ? "-" : "+";

    container.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <i class="bi ${icon} fs-5"></i>
          <div>
            <div class="fw-semibold">
              ${a.type === "INCOMING" ? "Received from Kitchen" :
                a.type === "DISTRIBUTION" ? `Distributed to ${a.details}` :
                `Returned from ${a.details}`}
            </div>
            <small class="text-muted">${a.date}</small>
          </div>
        </div>

        <span class="fw-bold ${sign === "-" ? "text-danger" : "text-success"}">
          ${sign}${a.qty}
        </span>
      </li>
    `;
  });
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

  list.forEach((d, i) => {
    const badge =
      d.type === "INCOMING" ? "badge-in" :
      d.type === "DISTRIBUTION" ? "badge-out" :
      "badge-return";

    reportTable.innerHTML += `
      <tr>
        <td>${d.date}</td>
        <td><span class="badge-type ${badge}">${d.type}</span></td>
        <td>
          <strong>${d.details}</strong><br>
          <small class="text-muted" title="${d.note || ""}">
            ${truncateText(d.note, 40)}
          </small>
        </td>
        <td>${d.rep || "-"}</td>
        <td class="fw-bold">${d.qty}</td>
        <td>
          <span class="action-delete" onclick="deleteTransaction(${i})">🗑</span>
        </td>
      </tr>
    `;
  });
}

function getAllTransactions() {
  return [
    ...db.incoming.map(d => ({
      type:"INCOMING", date:d.date, qty:d.qty,
      details:"MBG Kitchen", note:d.notes
    })),
    ...db.distribution.map(d => ({
      type:"DISTRIBUTION", date:d.date, qty:d.qty,
      details:d.class, rep:d.rep, note:d.notes
    })),
    ...db.returns.map(d => ({
      type:"RETURN", date:d.date, qty:d.qty,
      details:d.class, rep:d.rep, note:d.notes
    }))
  ].sort((a,b)=>b.date.localeCompare(a.date));
}

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

function deleteTransaction(index) {
  if (!confirm("Delete this transaction?")) return;

  const all = getAllTransactions();
  const item = all[index];

  if (item.type === "INCOMING") {
    db.incoming.splice(db.incoming.findIndex(d =>
      d.date === item.date && d.qty === item.qty), 1);
  }

  if (item.type === "DISTRIBUTION") {
    db.distribution.splice(db.distribution.findIndex(d =>
      d.date === item.date && d.qty === item.qty), 1);
  }

  if (item.type === "RETURN") {
    db.returns.splice(db.returns.findIndex(d =>
      d.date === item.date && d.qty === item.qty), 1);
  }

  save();
  applyReportFilter();
}

function truncateText(text, max = 50) {
  if (!text) return "";
  return text.length > max
    ? text.slice(0, max) + "..."
    : text;
}

function exportCSV() {
  // Ambil data sesuai filter yang sedang aktif
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

  if (list.length === 0) {
    alert("No data to export");
    return;
  }

  // Header CSV
  const headers = [
    "Date",
    "Type",
    "Details",
    "Representative",
    "Quantity",
    "Notes"
  ];

  // Helper untuk escape CSV
  const escapeCSV = value => {
    if (value == null) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  // Gabungkan ke format CSV
  const rows = list.map(d => [
    d.date,
    d.type,
    d.details,
    d.rep || "-",
    d.qty,
    d.note || ""
  ].map(escapeCSV).join(","));

  const csvContent =
    headers.join(",") + "\n" +
    rows.join("\n");

  // Buat file & download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `mbg-report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}




renderDashboard();
renderReportTable(getAllTransactions());

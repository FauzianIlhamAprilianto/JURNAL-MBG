const dStock = document.getElementById('dStock');
const dIn = document.getElementById('dIn');
const dOut = document.getElementById('dOut');
const dReturn = document.getElementById('dReturn');
const dStockReport = document.getElementById('dStockReport');
const dInReport = document.getElementById('dInReport');
const dOutReport = document.getElementById('dOutReport');
const dReturnReport = document.getElementById('dReturnReport');

const db = JSON.parse(localStorage.getItem("mbg")) || {
  incoming: [],
  distribution: [],
  returns: []
};

function save() {
  localStorage.setItem("mbg", JSON.stringify(db));
  renderDashboard();
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
  db.distribution.push({ date: outDate.value, qty:+outQty.value, class:outClass.value, rep:outRep.value });
  save();
}

function addReturn() {
  db.returns.push({ date: retDate.value, qty:+retQty.value, class:retClass.value, rep:retRep.value });
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
}

// REPORT
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
          <small class="text-muted">${d.note || ""}</small>
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



renderDashboard();
renderReportTable(getAllTransactions());

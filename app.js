const today = new Date().toISOString().slice(0,10);

const db = JSON.parse(localStorage.getItem("mbg")) || {
  dailyStock: null,
  incoming: [],
  distribution: [],
  returns: []
};


function save() {
  localStorage.setItem("mbg", JSON.stringify(db));
  renderDashboard();
  renderReport();
}

function saveDailyStock() {
  const qty = Number(dailyQty.value);
  if (!qty) return alert("Quantity required");

  db.dailyStock = {
    date: today,
    qty,
    note: dailyNote.value
  };

  save();
  unlockApp();
}

function checkDailyReset() {
  if (!db.dailyStock || db.dailyStock.date !== today) {
    db.dailyStock = null;
    lockApp();
    save();
  }
}

function lockApp() {
  document.querySelectorAll(".sidebar nav button")
    .forEach(b => b.disabled = true);

  dailyStockBox.classList.remove("d-none");
}

function unlockApp() {
  document.querySelectorAll(".sidebar nav button")
    .forEach(b => b.disabled = false);

  dailyStockBox.classList.add("d-none");
}

function showPage(id, btn) {
  document.querySelectorAll("main section").forEach(s => s.classList.add("d-none"));
  document.getElementById(id).classList.remove("d-none");

  document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function stock() {
  if (!db.dailyStock) return 0;

  return db.dailyStock.qty
    + db.incoming.reduce((a,b)=>a+b.qty,0)
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
  if (db.dailyStock) {
    dailyQty.value = db.dailyStock.qty;
    dailyNote.value = db.dailyStock.note;
  }

  dStock.textContent = stock();
}

function renderReport() {
  reportTable.innerHTML = "";
  [...db.incoming.map(d=>({...d,type:"IN"})),
   ...db.distribution.map(d=>({...d,type:"OUT"})),
   ...db.returns.map(d=>({...d,type:"RETURN"}))]
   .sort((a,b)=>b.date.localeCompare(a.date))
   .forEach(d=>{
     reportTable.innerHTML += `
      <tr>
        <td>${d.date}</td>
        <td>${d.type}</td>
        <td>${d.class || 'MBG Kitchen'}</td>
        <td>${d.rep || '-'}</td>
        <td>${d.qty}</td>
      </tr>`;
   });
}

checkDailyReset();
renderDashboard();
renderReport();
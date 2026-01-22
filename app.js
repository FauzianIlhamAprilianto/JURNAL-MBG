const db = JSON.parse(localStorage.getItem("mbg")) || {
  incoming: [],
  distribution: [],
  returns: []
};

function save() {
  localStorage.setItem("mbg", JSON.stringify(db));
  renderDashboard();
  renderReport();
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

renderDashboard();
renderReport();

/* ========== Splash ========== */
window.addEventListener("load", () => {
  const s = document.getElementById("splash");
  setTimeout(() => (s.style.opacity = "0"), 1400);
  setTimeout(() => (s.style.display = "none"), 2400);
});

/* ========== Helpers ========== */
const $ = (id) => document.getElementById(id);
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
const notify = (msg) => {
  const n = $("notify");
  n.innerText = msg;
  n.style.display = "block";
  setTimeout(() => (n.style.display = "none"), 3000);
};

/* ========== Settings (Owner / Repo / PAT kept locally) ========== */
function getSettings(){
  return {
    owner: localStorage.getItem("fs_owner") || "U-ARUN07",
    repo:  localStorage.getItem("fs_repo")  || "FinSight",
    pat:   localStorage.getItem("fs_pat")   || "" // user pastes once; stays in localStorage
  };
}
function setSettings({owner,repo,pat}){
  if(owner !== undefined) localStorage.setItem("fs_owner", owner);
  if(repo  !== undefined) localStorage.setItem("fs_repo",  repo);
  if(pat   !== undefined) localStorage.setItem("fs_pat",   pat);
}
function b64(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2)))); }

/* Save via repository_dispatch -> GitHub Action writes JSON */
async function saveToGitHub(username, data){
  const { owner, repo, pat } = getSettings();
  if(!owner || !repo || !pat){
    notify("⚠️ Open Settings and fill Owner / Repo / PAT first.");
    throw new Error("Missing settings");
  }
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method:"POST",
    headers:{
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event_type: "update-data",
      client_payload: {
        username,
        data: b64(data)
      }
    })
  });
  if(!res.ok){
    const t = await res.text();
    console.error("Dispatch error:", t);
    notify("❌ Save failed. Check PAT (repo + workflow), Owner/Repo, and that Actions are enabled.");
    throw new Error("dispatch failed");
  }
  notify("✅ Saving… GitHub Action will commit your data shortly.");
}

/* Load directly from raw.githubusercontent.com */
async function loadFromGitHub(username){
  const { owner, repo } = getSettings();
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/data/users/${encodeURIComponent(username)}.json?ts=${Date.now()}`;
  try{
    const res = await fetch(url, { cache:"no-cache" });
    if(!res.ok) throw new Error("no file");
    return await res.json();
  }catch{
    return { tasks:[], history:[], transactions:[] };
  }
}

/* ========== Theme ========== */
const themeIcon = $("themeIcon");
const themeBtn  = $("themeBtn");
function setTheme(mode){
  document.body.classList.toggle("light", mode==="light");
  themeIcon.classList.toggle("fa-sun", mode==="light");
  themeIcon.classList.toggle("fa-moon", mode!=="light");
  themeBtn.textContent = mode==="light" ? "Dark Theme" : "Light Theme";
  localStorage.setItem("theme", mode);
  // recolor charts next render (we use computedStyle when drawing)
}
setTheme(localStorage.getItem("theme") || "dark");
themeBtn.onclick  = () => setTheme(document.body.classList.contains("light") ? "dark" : "light");
themeIcon.onclick = themeBtn.onclick;

/* ========== Settings Modal ========== */
const settingsBtn   = $("settingsBtn");
const settingsModal = $("settingsModal");
$("closeSettings").onclick = () => settingsModal.classList.add("hidden");
settingsBtn.onclick = () => {
  const s = getSettings();
  $("owner").value = s.owner;
  $("repo").value  = s.repo;
  $("pat").value   = s.pat;
  settingsModal.classList.remove("hidden");
};
$("saveSettings").onclick = () => {
  setSettings({ owner:$("owner").value.trim(), repo:$("repo").value.trim(), pat:$("pat").value.trim() });
  settingsModal.classList.add("hidden");
  notify("✅ Settings saved locally.");
};

/* ========== Navigation ========== */
$("getStarted").onclick = () => { $("landing").classList.add("hidden"); $("auth").classList.remove("hidden"); };

/* ========== Auth ========== */
$("register").onclick = async () => {
  const u = $("username").value.trim();
  if(!u) return notify("Enter a username");
  const d = await loadFromGitHub(u);
  if (d.tasks.length || d.transactions.length || d.history.length) {
    notify("ℹ️ User already exists. Click Login.");
  } else {
    await saveToGitHub(u, { tasks:[], history:[], transactions:[] });
  }
};
$("login").onclick = async () => {
  const u = $("username").value.trim();
  if(!u) return notify("Enter a username");
  localStorage.setItem("user", u);
  $("auth").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  $("welcomeUser").innerText = `👋 Welcome, ${u}`;
  loadAll();
};

/* ========== Data bootstrap ========== */
async function loadAll(){
  const u = localStorage.getItem("user");
  const d = await loadFromGitHub(u);
  renderTasks(d);
  renderFinance(d);
  renderAnalytics(d);
}

/* ========== Tasks ========== */
function renderTasks(d){
  const list = $("taskList");
  list.innerHTML = "";

  d.tasks.forEach((t,i)=>{
    const overdue = !t.done && t.due && new Date(t.due) < new Date();
    const row = document.createElement("div");
    row.className = `task ${overdue ? "overdue":""}`;
    row.innerHTML = `
      <span>${escapeHtml(t.text)} ${t.due?`<span class="meta">• ${t.due}</span>`:""} ${t.done?`<span class="badge">done</span>`:""}</span>
      <span>
        <button class="primary" data-edit="${i}">Edit</button>
        <button class="primary" data-toggle="${i}">${t.done?"Undo":"Done"}</button>
        <button class="danger"  data-del="${i}">Del</button>
      </span>`;
    list.appendChild(row);
  });

  // Stats badges
  const done = d.tasks.filter(x=>x.done).length;
  const pending = d.tasks.length - done;
  const overdue = d.tasks.filter(x=>!x.done && x.due && new Date(x.due)<new Date()).length;
  const badges = document.createElement("div");
  badges.innerHTML =
    `<span class="badge">done ${done}</span>`+
    `<span class="badge warn">pending ${pending}</span>`+
    `<span class="badge danger">overdue ${overdue}</span>`;
  const h2 = [...document.querySelectorAll(".section h2")].find(el=>el.textContent.trim().startsWith("Tasks"));
  if(h2){
    const span = document.getElementById("taskBadges") || document.createElement("span");
    span.id = "taskBadges";
    span.innerHTML = badges.innerHTML;
    h2.appendChild(span);
  }

  // History list (latest first)
  const hist = $("historyList");
  if(hist){
    hist.innerHTML = "";
    d.history.slice(0,30).forEach(h=>{
      const p = document.createElement("p");
      p.textContent = `${h.when}: ${h.action}`;
      hist.appendChild(p);
    });
  }

  // Bind row buttons
  [...list.querySelectorAll("[data-toggle]")].forEach(btn => btn.onclick = async ()=>{
    const idx = +btn.dataset.toggle;
    const u = localStorage.getItem("user");
    const d = await loadFromGitHub(u);
    d.tasks[idx].done = !d.tasks[idx].done;
    d.history.unshift({ action:`task-${d.tasks[idx].done?"done":"undo"}`, when:new Date().toLocaleString() });
    await saveToGitHub(u, d);
    loadAll();
  });
  [...list.querySelectorAll("[data-del]")].forEach(btn => btn.onclick = async ()=>{
    const idx = +btn.dataset.del;
    const u = localStorage.getItem("user");
    const d = await loadFromGitHub(u);
    d.history.unshift({ action:"task-delete", when:new Date().toLocaleString(), item:d.tasks[idx] });
    d.tasks.splice(idx,1);
    await saveToGitHub(u, d);
    loadAll();
  });
  [...list.querySelectorAll("[data-edit]")].forEach(btn => btn.onclick = async ()=>{
    const idx = +btn.dataset.edit;
    const u = localStorage.getItem("user");
    const d = await loadFromGitHub(u);
    const cur = d.tasks[idx];
    const nt = prompt("Edit task text:", cur.text);
    if(nt===null) return;
    const nd = prompt("Edit due date (YYYY-MM-DD):", cur.due || "");
    d.tasks[idx] = { ...cur, text:(nt||"").trim() || cur.text, due: nd || "" };
    d.history.unshift({ action:"task-edit", when:new Date().toLocaleString() });
    await saveToGitHub(u, d);
    loadAll();
  });
}

$("addTask").onclick = async ()=>{
  const text = $("taskText").value.trim();
  const due  = $("taskDue").value;
  if(!text) return notify("Enter a task");
  const u = localStorage.getItem("user");
  const d = await loadFromGitHub(u);
  d.tasks.push({ text, due, done:false, created:new Date().toISOString() });
  d.history.unshift({ action:"task-add", when:new Date().toLocaleString() });
  await saveToGitHub(u, d);
  $("taskText").value = ""; $("taskDue").value = "";
  loadAll();
};

/* Optional extra buttons present in your HTML (wire if you added them) */
const delAllBtn = $("deleteAllTasks");
if(delAllBtn) delAllBtn.onclick = async ()=>{
  if(!confirm("Delete ALL tasks?")) return;
  const u = localStorage.getItem("user");
  const d = await loadFromGitHub(u);
  d.history.unshift({ action:"task-delete-all", when:new Date().toLocaleString(), items:[...d.tasks] });
  d.tasks = [];
  await saveToGitHub(u, d);
  loadAll();
};
const resetBtn = $("resetTasks");
if(resetBtn) resetBtn.onclick = async ()=>{
  const u = localStorage.getItem("user");
  const d = await loadFromGitHub(u);
  d.tasks = [];
  d.history.unshift({ action:"task-reset", when:new Date().toLocaleString() });
  await saveToGitHub(u, d);
  loadAll();
};
const clearHistBtn = $("clearHistory");
if(clearHistBtn) clearHistBtn.onclick = async ()=>{
  const u = localStorage.getItem("user");
  const d = await loadFromGitHub(u);
  d.history = [];
  await saveToGitHub(u, d);
  loadAll();
};

/* ========== Finance ========== */
function renderFinance(d){
  const income = d.transactions.filter(t=>t.type==="income").reduce((a,b)=>a+(+b.amount||0),0);
  const expense= d.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+(+b.amount||0),0);
  const balance= income - expense;

  $("financeSummary").innerHTML =
    `<span class="badge">Income ₹${income.toFixed(2)}</span>`+
    `<span class="badge danger">Expense ₹${expense.toFixed(2)}</span>`+
    `<span class="badge ${balance<0?"danger":"warn"}">Balance ₹${balance.toFixed(2)}</span>`;

  drawExpenseBar(d.transactions);
  drawBalanceLine(d.transactions);
}

$("addTxn").onclick = async ()=>{
  const type = $("txnType").value;
  const amount = +$("amount").value;
  const category = $("category").value.trim() || "General";
  const date = ($("date") && $("date").value) || new Date().toISOString().slice(0,10);
  const note = ($("note") && $("note").value.trim()) || "";
  if(!amount || amount<=0) return notify("Enter a valid amount");

  const u = localStorage.getItem("user");
  const d = await loadFromGitHub(u);
  d.transactions.push({ type, amount, category, date, note });
  d.history.unshift({ action:`txn-${type}`, when:new Date().toLocaleString(), amount, category });
  await saveToGitHub(u, d);

  if($("amount")) $("amount").value="";
  if($("category")) $("category").value="";
  if($("note")) $("note").value="";
  loadAll();

  const inc = d.transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const exp = d.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);
  if(inc-exp < 0) notify("⚠️ Warning: Balance is negative.");
};

/* ========== Charts ========== */
let taskPie, expenseBar, balanceLine;

function themeColor(){ return getComputedStyle(document.body).color; }

function renderAnalytics(d){
  const total = d.tasks.length;
  const done  = d.tasks.filter(t=>t.done).length;
  const pending = total - done;
  const overdue = d.tasks.filter(t=>!t.done && t.due && new Date(t.due) < new Date()).length;

  const ctx1 = $("taskPie").getContext("2d");
  if(taskPie) taskPie.destroy();
  taskPie = new Chart(ctx1, {
    type:"pie",
    data:{ labels:["Done","Pending","Overdue"], datasets:[{ data:[done,pending,overdue], backgroundColor:["#10b981","#fbbf24","#ef4444"] }] },
    options:{ plugins:{ legend:{ labels:{ color: themeColor() } } } }
  });

  const pct = total ? Math.round(done/total*100) : 0;
  const prog = $("taskProgress");
  if(prog) prog.style.width = pct + "%";
  const ts = $("taskSummary");
  if(ts) ts.innerText = `${pct}% completed (${done}/${total}).`;

  const income = d.transactions.filter(t=>t.type==="income").reduce((a,b)=>a+(+b.amount||0),0);
  const expense= d.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+(+b.amount||0),0);
  const balance= income - expense;
  const qt = $("quickTotals");
  if(qt) qt.innerText = `Income ₹${income.toFixed(2)} | Expense ₹${expense.toFixed(2)} | Balance ₹${balance.toFixed(2)}`;
}

function drawExpenseBar(txns){
  const byCat={};
  txns.filter(t=>t.type==="expense").forEach(t=>{ byCat[t.category]=(byCat[t.category]||0)+(+t.amount||0); });
  const labels=Object.keys(byCat); const values=Object.values(byCat);
  const ctx = $("expenseBar").getContext("2d");
  if(expenseBar) expenseBar.destroy();
  expenseBar = new Chart(ctx,{
    type:"bar",
    data:{ labels, datasets:[{ label:"Expense by Category", data:values }] },
    options:{
      plugins:{ legend:{ labels:{ color: themeColor() } } },
      scales:{
        x:{ ticks:{ color: themeColor() } },
        y:{ ticks:{ color: themeColor() } }
      }
    }
  });
}

function drawBalanceLine(txns){
  const sorted=[...txns].sort((a,b)=> new Date(a.date)-new Date(b.date));
  const days=[...new Set(sorted.map(t=>t.date))];
  let bal=0; const series=[];
  days.forEach(d=>{ sorted.filter(t=>t.date===d).forEach(t=>{ bal += t.type==="income" ? +t.amount : -(+t.amount); }); series.push(bal); });
  const ctx=$("balanceLine").getContext("2d");
  if(balanceLine) balanceLine.destroy();
  balanceLine = new Chart(ctx,{
    type:"line",
    data:{ labels:days, datasets:[{ label:"Balance Over Time", data:series, tension:.25 }] },
    options:{
      plugins:{ legend:{ labels:{ color: themeColor() } } },
      scales:{
        x:{ ticks:{ color: themeColor() } },
        y:{ ticks:{ color: themeColor() } }
      }
    }
  });
}

/* ========== Account ========== */
$("logout").onclick = ()=>{ localStorage.removeItem("user"); location.reload(); };
$("deleteUser").onclick = async ()=>{
  const u = localStorage.getItem("user");
  if(!u) return;
  if(!confirm("Clear your data (overwrite file with empty structure)?")) return;
  const data = { tasks:[], history:[], transactions:[] };
  await saveToGitHub(u, data);
  localStorage.removeItem("user");
  notify("User data cleared (empty file committed).");
  setTimeout(()=>location.reload(), 1200);
};

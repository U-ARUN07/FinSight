/* CONFIG */
const API_URL = "https://fin-sight-api.vercel.app/api/update"; // your Vercel API
const GH_OWNER = "U-ARUN07";
const GH_REPO  = "FinSight";

/* ELEMENTS */
const auth = document.getElementById("auth");
const usernameEl = document.getElementById("username");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

const dashboard = document.getElementById("dashboard");
const welcome = document.getElementById("welcome");
const themeBtn = document.getElementById("themeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");

/* Finance */
const incSum = document.getElementById("incSum");
const expSum = document.getElementById("expSum");
const balSum = document.getElementById("balSum");
const txnForm = document.getElementById("txnForm");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const typeEl = document.getElementById("type");
const resetFinance = document.getElementById("resetFinance");

/* Tasks */
const taskForm = document.getElementById("taskForm");
const taskText = document.getElementById("taskText");
const taskDue  = document.getElementById("taskDue");
const taskList = document.getElementById("taskList");
const clearTasks = document.getElementById("clearTasks");

/* History */
const historyEl = document.getElementById("history");
const clearHistoryBtn = document.getElementById("clearHistory");

/* Charts */
let pieChart, barChart;

/* STATE */
let currentUser = null;
let data = { transactions:[], tasks:[], history:[] };

/* UTILS */
const showToast = (msg)=>{ toast.textContent=msg; toast.style.display="block"; setTimeout(()=>toast.style.display="none",2000); };
const rawUrl = (u)=>`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/data/users/${encodeURIComponent(u)}.json?ts=${Date.now()}`;

/* THEME */
themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  themeBtn.textContent = document.body.classList.contains("light") ? "🌙 Theme" : "🌓 Theme";
  drawCharts();
};

/* AUTH */
registerBtn.onclick = async () => {
  const u = usernameEl.value.trim();
  if(!u) return showToast("Enter username");
  currentUser = u;
  // create empty record
  data = { transactions:[], tasks:[], history:[] };
  await save();
  enterApp();
};
loginBtn.onclick = async () => {
  const u = usernameEl.value.trim();
  if(!u) return showToast("Enter username");
  currentUser = u;
  await load();
  enterApp();
};
logoutBtn.onclick = ()=>{ localStorage.removeItem("fs_user"); location.reload(); };

function enterApp(){
  localStorage.setItem("fs_user", currentUser);
  welcome.textContent = `Welcome, ${currentUser}`;
  auth.classList.add("hidden");
  dashboard.classList.remove("hidden");
  renderAll();
}

/* LOAD & SAVE */
async function load(){
  try{
    const res = await fetch(rawUrl(currentUser), { cache:"no-cache" });
    if(res.ok){ data = await res.json(); }
    else { data = { transactions:[], tasks:[], history:[] }; }
  }catch{ data = { transactions:[], tasks:[], history:[] }; }
}
async function save(){
  try{
    await fetch(API_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ username: currentUser, data })
    });
  }catch(e){ console.error(e); showToast("Save failed"); }
}

/* FINANCE */
txnForm.onsubmit = async (e)=>{
  e.preventDefault();
  const amount = +amountEl.value;
  if(!amount) return;
  data.transactions.push({
    type: typeEl.value,
    category: categoryEl.value.trim() || "General",
    amount,
    date: new Date().toISOString().slice(0,10)
  });
  data.history.unshift({ when:new Date().toLocaleString(), action:`txn-${typeEl.value}`, amount });
  await save(); await load(); renderAll();
  txnForm.reset();
};
resetFinance.onclick = async ()=>{
  if(!confirm("Reset finance data?")) return;
  data.transactions = [];
  data.history.unshift({ when:new Date().toLocaleString(), action:"finance-reset" });
  await save(); renderAll();
};

/* TASKS */
taskForm.onsubmit = async (e)=>{
  e.preventDefault();
  const text = taskText.value.trim(); if(!text) return;
  data.tasks.push({ text, due: taskDue.value || "", done:false, created:new Date().toISOString() });
  data.history.unshift({ when:new Date().toLocaleString(), action:"task-add", text });
  await save(); renderAll(); taskForm.reset();
};
clearTasks.onclick = async ()=>{
  if(!confirm("Delete ALL tasks?")) return;
  data.tasks = [];
  data.history.unshift({ when:new Date().toLocaleString(), action:"task-clear" });
  await save(); renderAll();
};
function bindTaskButtons(){
  [...taskList.querySelectorAll("[data-toggle]")].forEach(btn=>{
    btn.onclick = async ()=>{
      const i = +btn.dataset.toggle; data.tasks[i].done = !data.tasks[i].done;
      data.history.unshift({ when:new Date().toLocaleString(), action:`task-${data.tasks[i].done?"done":"undo"}` });
      await save(); renderAll();
    };
  });
  [...taskList.querySelectorAll("[data-del]")].forEach(btn=>{
    btn.onclick = async ()=>{
      const i = +btn.dataset.del; data.tasks.splice(i,1);
      data.history.unshift({ when:new Date().toLocaleString(), action:"task-del" });
      await save(); renderAll();
    };
  });
}

/* HISTORY */
clearHistoryBtn.onclick = async ()=>{
  data.history = []; await save(); renderAll();
};

/* RENDER */
function renderAll(){
  // Finance sums
  const inc = data.transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const exp = data.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);
  incSum.textContent = inc.toFixed(2); expSum.textContent = exp.toFixed(2); balSum.textContent = (inc-exp).toFixed(2);

  // Tasks list
  taskList.innerHTML = "";
  data.tasks.forEach((t,i)=>{
    const div = document.createElement("div"); div.className="item";
    const overdue = (!t.done && t.due && new Date(t.due) < new Date());
    div.innerHTML = `
      <span>${escape(t.text)} ${t.due?`<span class="meta">• ${t.due}${overdue?" (overdue)":""}</span>`:""}</span>
      <span>
        <button class="ghost" data-toggle="${i}">${t.done?"Undo":"Done"}</button>
        <button class="ghost" data-del="${i}">Del</button>
      </span>`;
    taskList.appendChild(div);
  });
  bindTaskButtons();

  // History
  historyEl.innerHTML = data.history.slice(0,50).map(h=>`<li>${escape(h.when)} — ${escape(h.action)}</li>`).join("");

  // Charts
  drawCharts();
}
function drawCharts(){
  // Pie (income vs expense)
  const inc = data.transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const exp = data.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);
  const pieCtx = document.getElementById("pie").getContext("2d");
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx,{
    type:"pie",
    data:{ labels:["Income","Expense"], datasets:[{ data:[inc,exp], backgroundColor:["#10b981","#ef4444"] }] },
    options:{ plugins:{ legend:{ labels:{ color:getComputedStyle(document.body).color } } } }
  });

  // Bar (expense by category)
  const catMap = {};
  data.transactions.filter(t=>t.type==="expense").forEach(t=>catMap[t.category]=(catMap[t.category]||0)+t.amount);
  const labels = Object.keys(catMap), values = Object.values(catMap);
  const barCtx = document.getElementById("bar").getContext("2d");
  if(barChart) barChart.destroy();
  barChart = new Chart(barCtx,{
    type:"bar",
    data:{ labels, datasets:[{ label:"Expense by Category", data:values }] },
    options:{
      plugins:{ legend:{ labels:{ color:getComputedStyle(document.body).color } } },
      scales:{ x:{ ticks:{ color:getComputedStyle(document.body).color } }, y:{ ticks:{ color:getComputedStyle(document.body).color } } }
    }
  });
}

function escape(s){ return String(s).replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }

/* AUTO LOGIN */
(async ()=>{
  const saved = localStorage.getItem("fs_user");
  if(saved){ currentUser = saved; await load(); enterApp(); }
})();

// Elements
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");

const descEl = document.getElementById("desc");
const amountEl = document.getElementById("amount");
const typeEl = document.getElementById("type");

const listEl = document.getElementById("transactions-list");

const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");

const logoutBtn = document.getElementById("logout");
const themeBtn = document.getElementById("theme-toggle");

const usernameInput = document.getElementById("username");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const authSection = document.getElementById("auth-section");
const dashboard = document.querySelector(".dashboard");
const welcomeMsg = document.getElementById("welcome-msg");

// State (per-user in localStorage)
let currentUser = localStorage.getItem("finsight-current-user");
let users = JSON.parse(localStorage.getItem("finsight-users") || "{}");

// Charts
let pieChart, barChart;

// Helpers
const saveUsers = () => localStorage.setItem("finsight-users", JSON.stringify(users));

function render() {
  if (!currentUser) return;

  const data = users[currentUser] || [];
  let income = 0, expense = 0;

  // Build list
  listEl.innerHTML = "";
  data.forEach((t, i) => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="tx-left">
        <span class="badge ${t.type}">${t.type === "income" ? "IN" : "OUT"}</span>
        <span class="tx-desc">${escapeHTML(t.desc)}</span>
      </div>
      <div class="tx-right" style="display:flex; align-items:center; gap:12px">
        <span class="tx-amt">₹${t.amount.toLocaleString()}</span>
        <span class="tx-actions">
          <button type="button" aria-label="Delete transaction" data-del="${i}">Delete</button>
        </span>
      </div>
    `;
    listEl.appendChild(li);
  });

  // Totals
  incomeEl.textContent = income.toLocaleString();
  expenseEl.textContent = expense.toLocaleString();
  balanceEl.textContent = (income - expense).toLocaleString();

  // Bind delete buttons
  listEl.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.dataset.del;
      users[currentUser].splice(idx, 1);
      saveUsers();
      render();
    };
  });

  // Persist
  users[currentUser] = data;
  saveUsers();

  // Charts
  updateCharts(income, expense, data);
}

function updateCharts(income, expense, data) {
  const pieCtx = document.getElementById("pieChart");
  const barCtx = document.getElementById("barChart");

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#2563eb", "#dc2626"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: data.map(t => t.desc || "(no desc)"),
      datasets: [{
        label: "Amount",
        data: data.map(t => t.amount),
        backgroundColor: data.map(t => t.type === "income" ? "#2563eb" : "#dc2626")
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Sanitize
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));}

// Auth
registerBtn.onclick = () => {
  const u = usernameInput.value.trim();
  if (!u) return alert("Enter a username!");
  if (users[u]) return alert("User already exists. Try logging in.");
  users[u] = [];
  localStorage.setItem("finsight-current-user", u);
  currentUser = u;
  saveUsers();
  enterApp();
};

loginBtn.onclick = () => {
  const u = usernameInput.value.trim();
  if (!u) return alert("Enter a username!");
  if (!users[u]) return alert("User not found. Please register first.");
  localStorage.setItem("finsight-current-user", u);
  currentUser = u;
  enterApp();
};

function enterApp(){
  authSection.style.display = "none";
  dashboard.style.display = "block";
  logoutBtn.style.display = "inline-block";
  welcomeMsg.textContent = `Welcome, ${currentUser}!`;
  render();
}

// Add
addBtn.onclick = () => {
  if (!currentUser) return alert("Please login first.");
  const desc = descEl.value.trim();
  const amount = Number(amountEl.value);
  const type = typeEl.value;
  if (!desc || !amount || amount <= 0) return alert("Enter a valid description and amount.");
  users[currentUser].push({ desc, amount, type, ts: Date.now() });
  saveUsers();
  descEl.value = ""; amountEl.value = "";
  render();
};

// Clear
clearBtn.onclick = () => {
  if (!currentUser) return;
  if (!confirm("Delete ALL transactions for this user?")) return;
  users[currentUser] = [];
  saveUsers();
  render();
};

// Logout
logoutBtn.onclick = () => {
  localStorage.removeItem("finsight-current-user");
  currentUser = null;
  dashboard.style.display = "none";
  authSection.style.display = "block";
  logoutBtn.style.display = "none";
};

// Theme
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️ Theme" : "🌓 Theme";
};

// Auto-login
if (currentUser) enterApp();

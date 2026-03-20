let currentUser = localStorage.getItem("currentUser") || null;
let budgetData = null;
let expenseChart = null;

// =========================
// AUTH HELPERS
// =========================
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getBudgetKey(username) {
    return `budgetData_${username}`;
}

function loadBudgetData() {
    if (!currentUser) return;

    budgetData = JSON.parse(localStorage.getItem(getBudgetKey(currentUser))) || {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };
}

function updateLocalStorage() {
    if (!currentUser || !budgetData) return;
    localStorage.setItem(getBudgetKey(currentUser), JSON.stringify(budgetData));
}

function showApp() {
    document.getElementById("authSection").classList.add("d-none");
    document.getElementById("appSection").classList.remove("d-none");
    document.getElementById("displayUsername").textContent = currentUser;
}

function showAuth() {
    document.getElementById("authSection").classList.remove("d-none");
    document.getElementById("appSection").classList.add("d-none");
}

// =========================
// FORMAT
// =========================
function formatCurrency(value) {
    return "₱" + Number(value).toFixed(2);
}

// =========================
// CHART COLORS
// =========================
function getChartColors() {
    return [
        "#4e73df",
        "#1cc88a",
        "#36b9cc",
        "#f6c23e",
        "#e74a3b",
        "#6f42c1"
    ];
}

// =========================
// UI UPDATE
// =========================
function updateUI() {
    if (!budgetData) return;

    document.getElementById("totalBudget").textContent = formatCurrency(budgetData.totalBudget);
    document.getElementById("totalExpenses").textContent = formatCurrency(budgetData.totalExpenses);
    document.getElementById("budgetLeft").textContent = formatCurrency(budgetData.budgetLeft);

    const tableBody = document.querySelector(".table-container tbody");
    tableBody.innerHTML = "";

    if (budgetData.expenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No expenses yet.</td></tr>`;
    } else {
        budgetData.expenses.forEach(expense => {
            let row = document.createElement("tr");
            row.setAttribute("data-id", expense.id);

            row.innerHTML = `
                <td class="title-cell">${expense.title}</td>
                <td class="amount-cell">${formatCurrency(expense.amount)}</td>
                <td class="category-cell">${expense.category}</td>
                <td>${expense.date}</td>
                <td class="action-cell">
                    <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn">Remove</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateChartIfVisible();
}

// =========================
// CHART UPDATE
// =========================
function updateChartIfVisible() {
    const chartContainer = document.getElementById("chartContainer");
    if (!chartContainer || chartContainer.style.display === "none") return;

    const categoryTotals = {};

    budgetData.expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    const ctx = document.getElementById("expenseChart").getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels.length ? labels : ["No Data"],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: labels.length ? getChartColors().slice(0, labels.length) : ["#d1d3e2"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// =========================
// RESET
// =========================
function resetAll() {
    if (!currentUser) return;

    if (!confirm("Are you sure you want to reset everything?")) return;

    budgetData = {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };

    updateLocalStorage();
    updateUI();
}

// =========================
// LOGOUT
// =========================
function logout() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    budgetData = null;

    showAuth();
}

// =========================
// DOM READY
// =========================
document.addEventListener("DOMContentLoaded", function () {
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");

    // Switch to Register
    document.getElementById("showRegister").addEventListener("click", function (e) {
        e.preventDefault();
        loginBox.style.display = "none";
        registerBox.style.display = "block";
    });

    // Switch to Login
    document.getElementById("showLogin").addEventListener("click", function (e) {
        e.preventDefault();
        registerBox.style.display = "none";
        loginBox.style.display = "block";
    });

    // REGISTER
    document.getElementById("registerForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const password = document.getElementById("registerPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        if (!username || !password || !confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        let users = getUsers();
        let exists = users.find(user => user.username.toLowerCase() === username.toLowerCase());

        if (exists) {
            alert("Username already exists.");
            return;
        }

        users.push({ username, password });
        saveUsers(users);

        alert("Registration successful! You can now login.");
        this.reset();

        registerBox.style.display = "none";
        loginBox.style.display = "block";
    });

    // LOGIN
    document.getElementById("loginForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        let users = getUsers();
        let foundUser = users.find(user => user.username === username && user.password === password);

        if (!foundUser) {
            alert("Invalid username or password.");
            return;
        }

        currentUser = username;
        localStorage.setItem("currentUser", currentUser);

        loadBudgetData();
        showApp();
        updateUI();
        this.reset();
    });

    // LOGOUT
    document.getElementById("logoutBtn").addEventListener("click", logout);

    // AUTO LOGIN
    if (currentUser) {
        loadBudgetData();
        showApp();
        updateUI();
    } else {
        showAuth();
    }

    // ADD BUDGET
    document.getElementById("budgetForm").addEventListener("submit", function (e) {
        e.preventDefault();

        let val = parseFloat(document.getElementById("budget").value);

        if (isNaN(val) || val <= 0) {
            alert("Invalid budget amount.");
            return;
        }

        budgetData.totalBudget += val;
        budgetData.budgetLeft += val;

        updateLocalStorage();
        updateUI();
        this.reset();
    });

    // ADD EXPENSE
    document.getElementById("expenseForm").addEventListener("submit", function (e) {
        e.preventDefault();

        let title = document.getElementById("expense").value.trim();
        let amount = parseFloat(document.getElementById("amount").value);
        let category = document.getElementById("category").value;

        if (!title || isNaN(amount) || amount <= 0) {
            alert("Invalid expense input.");
            return;
        }

        if (amount > budgetData.budgetLeft) {
            alert("Not enough budget.");
            return;
        }

        budgetData.expenses.push({
            id: Date.now(),
            title,
            amount,
            category,
            date: new Date().toLocaleDateString()
        });

        budgetData.totalExpenses += amount;
        budgetData.budgetLeft -= amount;

        updateLocalStorage();
        updateUI();
        this.reset();
    });

    // TABLE ACTIONS
    document.querySelector(".table-container tbody").addEventListener("click", function (e) {
        let row = e.target.closest("tr");
        if (!row) return;

        let id = row.getAttribute("data-id");
        let exp = budgetData.expenses.find(x => x.id == id);
        if (!exp) return;

        // DELETE
        if (e.target.classList.contains("delete-btn")) {
            if (!confirm("Delete this expense?")) return;

            budgetData.totalExpenses -= exp.amount;
            budgetData.budgetLeft += exp.amount;
            budgetData.expenses = budgetData.expenses.filter(x => x.id != id);

            updateLocalStorage();
            updateUI();
            return;
        }

        // EDIT
        if (e.target.classList.contains("edit-btn")) {
            let actionCell = row.querySelector(".action-cell");
            actionCell.innerHTML = "";

            let btnGroup = document.createElement("div");
            btnGroup.className = "d-flex flex-wrap justify-content-center";

            let saveBtn = document.createElement("button");
            saveBtn.className = "btn btn-success btn-sm save-btn mr-1";
            saveBtn.textContent = "Save";

            let cancelBtn = document.createElement("button");
            cancelBtn.className = "btn btn-secondary btn-sm cancel-btn";
            cancelBtn.textContent = "Cancel";

            btnGroup.appendChild(saveBtn);
            btnGroup.appendChild(cancelBtn);
            actionCell.appendChild(btnGroup);

            let tCell = row.querySelector(".title-cell");
            let aCell = row.querySelector(".amount-cell");
            let cCell = row.querySelector(".category-cell");

            let tInput = document.createElement("input");
            tInput.type = "text";
            tInput.className = "form-control form-control-sm";
            tInput.value = exp.title;

            let aInput = document.createElement("input");
            aInput.type = "number";
            aInput.min = "0";
            aInput.step = "0.01";
            aInput.className = "form-control form-control-sm";
            aInput.value = exp.amount;

            let cSelect = document.createElement("select");
            cSelect.className = "form-control form-control-sm";

            ["Food", "Bills", "Transport", "Entertainment", "School", "Others"].forEach(cat => {
                let option = document.createElement("option");
                option.value = cat;
                option.textContent = cat;
                if (cat === exp.category) option.selected = true;
                cSelect.appendChild(option);
            });

            tCell.innerHTML = "";
            aCell.innerHTML = "";
            cCell.innerHTML = "";

            tCell.appendChild(tInput);
            aCell.appendChild(aInput);
            cCell.appendChild(cSelect);
        }

        // SAVE
        if (e.target.classList.contains("save-btn")) {
            let tInput = row.querySelector(".title-cell input");
            let aInput = row.querySelector(".amount-cell input");
            let cSelect = row.querySelector(".category-cell select");

            let newTitle = tInput.value.trim();
            let newAmount = parseFloat(aInput.value);
            let newCategory = cSelect.value;

            if (!newTitle || isNaN(newAmount) || newAmount <= 0) {
                alert("Invalid input.");
                return;
            }

            let diff = newAmount - exp.amount;

            if (diff > budgetData.budgetLeft) {
                alert("Not enough budget.");
                return;
            }

            exp.title = newTitle;
            exp.amount = newAmount;
            exp.category = newCategory;

            budgetData.totalExpenses += diff;
            budgetData.budgetLeft -= diff;

            updateLocalStorage();
            updateUI();
        }

        // CANCEL
        if (e.target.classList.contains("cancel-btn")) {
            updateUI();
        }
    });

    // TOGGLE CHART
    document.getElementById("toggleChartBtn").addEventListener("click", function () {
        const chartDiv = document.getElementById("chartContainer");

        if (chartDiv.style.display === "none") {
            chartDiv.style.display = "block";
            this.textContent = "Hide Expense Breakdown";
        } else {
            chartDiv.style.display = "none";
            this.textContent = "Expense Breakdown";
        }

        updateUI();
    });

    // REGISTER SERVICE WORKER
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./service-worker.js")
                .then(() => console.log("Service Worker Registered"))
                .catch(err => console.log("Service Worker Failed:", err));
        });
    }
});
let budgetData = {
    totalBudget: 0,
    totalExpenses: 0,
    budgetLeft: 0,
    expenses: []
};

let expenseChart;
let currentUser = localStorage.getItem("currentUser") || null;

// ==========================
// AUTH FUNCTIONS
// ==========================
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getBudgetKey() {
    return `budgetData_${currentUser}`;
}

function loadBudgetData() {
    const savedData = JSON.parse(localStorage.getItem(getBudgetKey()));
    budgetData = savedData || {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };
}

function updateLocalStorage() {
    if (currentUser) {
        localStorage.setItem(getBudgetKey(), JSON.stringify(budgetData));
    }
}

function showApp() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
}

function showAuth() {
    document.getElementById("authSection").style.display = "flex";
    document.getElementById("appSection").style.display = "none";
}

function logoutUser() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    showAuth();
}

// ==========================
// BUDGET FUNCTIONS
// ==========================
function formatCurrency(value) {
    return "₱" + Number(value).toFixed(2);
}

function updateUI() {
    document.getElementById("totalBudget").textContent = formatCurrency(budgetData.totalBudget);
    document.getElementById("totalExpenses").textContent = formatCurrency(budgetData.totalExpenses);
    document.getElementById("budgetLeft").textContent = formatCurrency(budgetData.budgetLeft);

    let tableBody = document.getElementById("expenseTableBody");
    tableBody.innerHTML = "";

    if (budgetData.expenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No expenses yet.</td></tr>`;
    } else {
        budgetData.expenses.forEach(expense => {
            let row = document.createElement("tr");
            row.setAttribute("data-id", expense.id);

            row.innerHTML = `
                <td class="title-cell">${expense.title}</td>
                <td class="amount-cell">${formatCurrency(expense.amount)}</td>
                <td class="category-cell">${expense.category}</td>
                <td>${expense.date}</td>
                <td class="action-cell text-center">
                    <button class="btn btn-sm btn-warning edit-btn mb-1">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn mb-1">Remove</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateChart();
}

function updateChart() {
    const chartContainer = document.getElementById("chartContainer");
    if (chartContainer.style.display === "none") return;

    let categories = {};

    budgetData.expenses.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    let labels = Object.keys(categories);
    let data = Object.values(categories);

    const ctx = document.getElementById("expenseChart").getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (labels.length === 0) return;

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    "#4e79a7",
                    "#f28e2b",
                    "#e15759",
                    "#76b7b2",
                    "#59a14f"
                ]
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

function resetAll() {
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

// ==========================
// DOM READY
// ==========================
document.addEventListener("DOMContentLoaded", function () {
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");

    // Toggle Login/Register
    document.getElementById("showRegister").addEventListener("click", function (e) {
        e.preventDefault();
        loginBox.style.display = "none";
        registerBox.style.display = "block";
    });

    document.getElementById("showLogin").addEventListener("click", function (e) {
        e.preventDefault();
        registerBox.style.display = "none";
        loginBox.style.display = "block";
    });

    // SHOW/HIDE LOGIN PASSWORD
    document.getElementById("showLoginPassword").addEventListener("change", function () {
        const loginPasswordField = document.getElementById("loginPassword");
        loginPasswordField.type = this.checked ? "text" : "password";
    });

    // SHOW/HIDE REGISTER PASSWORDS
    document.getElementById("showRegisterPassword").addEventListener("change", function () {
        const passwordField = document.getElementById("registerPassword");
        const confirmField = document.getElementById("confirmPassword");

        if (this.checked) {
            passwordField.type = "text";
            confirmField.type = "text";
        } else {
            passwordField.type = "password";
            confirmField.type = "password";
        }
    });

    // REGISTER
    document.getElementById("registerForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const firstName = document.getElementById("registerFirstName").value.trim();
        const lastName = document.getElementById("registerLastName").value.trim();
        const number = document.getElementById("registerNumber").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        if (!firstName || !lastName || !number || !email || !password || !confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        let users = getUsers();
        let exists = users.find(user => user.email === email);

        if (exists) {
            alert("Email already registered.");
            return;
        }

        users.push({
            firstName,
            lastName,
            number,
            email,
            password
        });

        saveUsers(users);

        alert("Registration successful! You can now login.");
        this.reset();

        registerBox.style.display = "none";
        loginBox.style.display = "block";
    });

    // LOGIN
    document.getElementById("loginForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value.trim();

        let users = getUsers();
        let foundUser = users.find(user => user.email === email && user.password === password);

        if (!foundUser) {
            alert("Invalid email or password.");
            return;
        }

        currentUser = email;
        localStorage.setItem("currentUser", currentUser);

        loadBudgetData();
        showApp();

        document.getElementById("displayUsername").textContent = `${foundUser.firstName} ${foundUser.lastName}`;

        updateUI();
        this.reset();
    });

    // LOGOUT
    document.getElementById("logoutBtn").addEventListener("click", function () {
        logoutUser();
    });

    // Add Budget
    document.getElementById("budgetForm").addEventListener("submit", function (e) {
        e.preventDefault();

        let val = parseFloat(document.getElementById("budget").value);

        if (isNaN(val) || val <= 0) {
            alert("Invalid budget");
            return;
        }

        budgetData.totalBudget += val;
        budgetData.budgetLeft += val;

        updateLocalStorage();
        updateUI();
        this.reset();
    });

    // Add Expense
    document.getElementById("expenseForm").addEventListener("submit", function (e) {
        e.preventDefault();

        let title = document.getElementById("expense").value.trim();
        let amount = parseFloat(document.getElementById("amount").value);
        let category = document.getElementById("category").value;

        if (!title || isNaN(amount) || amount <= 0) {
            alert("Invalid expense");
            return;
        }

        if (amount > budgetData.budgetLeft) {
            alert("Not enough budget");
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

    // Table Actions (Edit / Delete / Save / Cancel)
    document.getElementById("expenseTableBody").addEventListener("click", function (e) {
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

            row.dataset.originalTitle = exp.title;
            row.dataset.originalAmount = exp.amount;
            row.dataset.originalCategory = exp.category;

            let tCell = row.querySelector(".title-cell");
            let aCell = row.querySelector(".amount-cell");
            let cCell = row.querySelector(".category-cell");

            let tInput = document.createElement("input");
            tInput.type = "text";
            tInput.className = "form-control form-control-sm";
            tInput.value = exp.title;

            let aInput = document.createElement("input");
            aInput.type = "number";
            aInput.className = "form-control form-control-sm";
            aInput.min = 0;
            aInput.step = 0.01;
            aInput.value = exp.amount;

            let cSelect = document.createElement("select");
            cSelect.className = "form-control form-control-sm";
            ["Food", "Bills", "Transport", "Entertainment", "Others"].forEach(cat => {
                let opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                if (cat === exp.category) opt.selected = true;
                cSelect.appendChild(opt);
            });

            tCell.innerHTML = "";
            aCell.innerHTML = "";
            cCell.innerHTML = "";

            tCell.appendChild(tInput);
            aCell.appendChild(aInput);
            cCell.appendChild(cSelect);

            actionCell.innerHTML = `
                <button class="btn btn-success btn-sm save-btn mb-1">Save</button>
                <button class="btn btn-secondary btn-sm cancel-btn mb-1">Cancel</button>
            `;
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
                alert("Invalid input");
                return;
            }

            let diff = newAmount - exp.amount;

            if (diff > budgetData.budgetLeft) {
                alert("Not enough budget");
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
            exp.title = row.dataset.originalTitle;
            exp.amount = parseFloat(row.dataset.originalAmount);
            exp.category = row.dataset.originalCategory;

            updateUI();
        }
    });

    // Toggle Chart
    document.getElementById("toggleChartBtn").addEventListener("click", function () {
        let chartDiv = document.getElementById("chartContainer");

        if (chartDiv.style.display === "none") {
            chartDiv.style.display = "block";
            this.textContent = "Hide Expense Breakdown";
        } else {
            chartDiv.style.display = "none";
            this.textContent = "Expense Breakdown";
        }

        updateUI();
    });

    // AUTO LOGIN
    if (currentUser) {
        let users = getUsers();
        let loggedInUser = users.find(user => user.email === currentUser);

        loadBudgetData();
        showApp();

        if (loggedInUser) {
            document.getElementById("displayUsername").textContent = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
        } else {
            document.getElementById("displayUsername").textContent = currentUser;
        }

        updateUI();
    } else {
        showAuth();
    }

    // OPTIONAL: SERVICE WORKER FOR PWA
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./service-worker.js")
                .then(() => console.log("Service Worker Registered"))
                .catch(err => console.log("Service Worker Error:", err));
        });
    }
});

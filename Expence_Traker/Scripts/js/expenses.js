// Scripts/js/expenses.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Set default date input to today
    var expenseDateInput = document.getElementById("expenseDate");
    if (expenseDateInput) {
        expenseDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Load categories for dropdowns
    function loadCategoriesDropdown() {
        fetch("../Handlers/CategoryHandler.ashx?action=get")
            .then(res => res.json())
            .then(categories => {
                var selectForm = document.getElementById("expenseCategory");
                var selectFilter = document.querySelector("select.form-select.w-auto"); // Category filter

                if (selectForm) {
                    selectForm.innerHTML = '<option value="" selected disabled>Select Category</option>';
                    categories.forEach(cat => {
                        selectForm.innerHTML += `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.icon || '')} ${escapeHtml(cat.name)}</option>`;
                    });
                }
            })
            .catch(err => console.error("Error loading category options:", err));
    }

    // Load Expense Summary Statistics
    function loadExpenseStats() {
        fetch("../Handlers/ExpenseHandler.ashx?action=stats")
            .then(res => res.json())
            .then(stats => {
                // Summary Cards
                var totalCard = document.querySelector(".border-left-danger .h5");
                var monthCard = document.querySelector(".border-left-warning .h5");
                var todayCard = document.querySelector(".border-left-primary .h5");
                var countCard = document.querySelector(".border-left-info .h5");

                if (totalCard) totalCard.innerText = "₹" + stats.totalExpense.toLocaleString('en-IN');
                if (monthCard) monthCard.innerText = "₹" + stats.monthExpense.toLocaleString('en-IN');
                if (todayCard) todayCard.innerText = "₹" + stats.todayExpense.toLocaleString('en-IN');
                if (countCard) countCard.innerText = stats.totalRecords;

                // Statistics Section (Bottom Card)
                var statsContainer = document.querySelectorAll(".card-body .h4");
                if (statsContainer.length >= 4) {
                    statsContainer[0].innerText = "₹" + stats.maxExpense.toLocaleString('en-IN');
                    statsContainer[1].innerText = "₹" + stats.minExpense.toLocaleString('en-IN');
                    statsContainer[2].innerText = "₹" + stats.avgExpense.toLocaleString('en-IN');
                    statsContainer[3].innerText = stats.mostCategory;
                }
            })
            .catch(err => console.error("Error loading expense stats:", err));
    }

    // Load Expense Records Table
    function loadExpenses() {
        var searchVal = searchInput ? searchInput.value.trim() : "";
        var catVal = categoryFilter ? categoryFilter.value : "All";
        var payVal = paymentFilter ? paymentFilter.value : "All";

        var url = `../Handlers/ExpenseHandler.ashx?action=get&search=${encodeURIComponent(searchVal)}&category=${encodeURIComponent(catVal)}&payment_method=${encodeURIComponent(payVal)}`;

        fetch(url)
            .then(res => res.json())
            .then(expenses => {
                renderExpenseTable(expenses);
            })
            .catch(err => console.error("Error loading expenses:", err));
    }

    function renderExpenseTable(expenses) {
        var tbody = document.querySelector("table.table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (expenses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No expense records found in database.</td></tr>`;
            return;
        }

        expenses.forEach(exp => {
            var tr = document.createElement("tr");
            tr.setAttribute("data-expense-id", exp.id);

            var categoryBadge = getCategoryBadge(exp.category);
            var paymentBadge = `<span class="badge bg-secondary">${escapeHtml(exp.payment_method)}</span>`;

            tr.innerHTML = `
                <td class="ps-4 fw-bold text-muted">${exp.id}</td>
                <td>${escapeHtml(formatDate(exp.date))}</td>
                <td>${categoryBadge}</td>
                <td>${escapeHtml(exp.description || "N/A")}</td>
                <td>${paymentBadge}</td>
                <td class="fw-bold text-danger">₹${parseFloat(exp.amount).toLocaleString('en-IN')}</td>
                <td><span class="text-success"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(exp.status || 'Paid')}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger text-white btn-delete-expense" data-id="${exp.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        bindDeleteButtons();
    }

    function getCategoryBadge(catName) {
        var badgeColor = 'bg-primary';
        if (catName === 'Food') badgeColor = 'bg-primary';
        else if (catName === 'Travel') badgeColor = 'bg-info';
        else if (catName === 'Shopping') badgeColor = 'bg-success';
        else if (catName === 'Medical') badgeColor = 'bg-warning text-dark';
        else if (catName === 'Bills') badgeColor = 'bg-danger';
        else if (catName === 'Entertainment') badgeColor = 'bg-purple';

        return `<span class="badge ${badgeColor}">${escapeHtml(catName)}</span>`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "";
        var parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }

    function escapeHtml(text) {
        if (!text) return "";
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Bind Delete buttons
    function bindDeleteButtons() {
        document.querySelectorAll(".btn-delete-expense").forEach(btn => {
            btn.onclick = function () {
                var id = btn.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this expense record (ID: " + id + ")?")) {
                    var formData = new URLSearchParams();
                    formData.append("action", "delete");
                    formData.append("id", id);

                    fetch("../Handlers/ExpenseHandler.ashx", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: formData.toString()
                    })
                        .then(res => res.json())
                        .then(res => {
                            if (res.success) {
                                alert(res.message);
                                loadExpenses();
                                loadExpenseStats();
                            } else {
                                alert("Error: " + res.message);
                            }
                        })
                        .catch(err => console.error("Error deleting expense:", err));
                }
            };
        });
    }

    // Form Submission (Add Expense)
    var expenseForm = document.getElementById("expenseForm");
    if (expenseForm) {
        expenseForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var amount = document.getElementById("expenseAmount").value;
            var category = document.getElementById("expenseCategory").value;
            var paymentMethod = document.getElementById("paymentMethod").value;
            var date = document.getElementById("expenseDate").value;
            var description = document.getElementById("expenseDescription").value;

            var formData = new URLSearchParams();
            formData.append("action", "add");
            formData.append("amount", amount);
            formData.append("category", category);
            formData.append("payment_method", paymentMethod);
            formData.append("date", date);
            formData.append("description", description);

            fetch("../Handlers/ExpenseHandler.ashx", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert(res.message);
                        expenseForm.reset();
                        if (expenseDateInput) {
                            expenseDateInput.value = new Date().toISOString().split('T')[0];
                        }
                        var collapseElement = document.getElementById("addExpenseForm");
                        if (collapseElement) {
                            var bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
                            if (bsCollapse) bsCollapse.hide();
                        }
                        loadExpenses();
                        loadExpenseStats();
                    } else {
                        alert("Error: " + res.message);
                    }
                })
                .catch(err => console.error("Error adding expense:", err));
        });
    }

    // Filters & Search
    var searchInput = document.querySelector("input[placeholder='Search expense by category...']");
    var searchBtn = document.querySelector(".input-group button");
    var selects = document.querySelectorAll(".card-header select.form-select");
    var categoryFilter = selects.length > 0 ? selects[0] : null;
    var paymentFilter = selects.length > 1 ? selects[1] : null;

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            loadExpenses();
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener("click", function () {
            loadExpenses();
        });
    }
    if (categoryFilter) {
        categoryFilter.addEventListener("change", function () {
            loadExpenses();
        });
    }
    if (paymentFilter) {
        paymentFilter.addEventListener("change", function () {
            loadExpenses();
        });
    }

    // Initial Execution
    loadCategoriesDropdown();
    loadExpenseStats();
    loadExpenses();
});
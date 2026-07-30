// Scripts/js/income.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Set default date input to today
    var incomeDateInput = document.getElementById("incomeDate");
    if (incomeDateInput) {
        incomeDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Load Income Summary Statistics
    function loadIncomeStats() {
        fetch("../Handlers/IncomeHandler.ashx?action=stats")
            .then(res => res.json())
            .then(stats => {
                var totalCard = document.querySelector(".border-left-primary .h5");
                var monthCard = document.querySelector(".border-left-success .h5");
                var todayCard = document.querySelector(".border-left-warning .h5");
                var countCard = document.querySelector(".border-left-info .h5");

                if (totalCard) totalCard.innerText = "₹" + stats.totalIncome.toLocaleString('en-IN');
                if (monthCard) monthCard.innerText = "₹" + stats.monthIncome.toLocaleString('en-IN');
                if (todayCard) todayCard.innerText = "₹" + stats.todayIncome.toLocaleString('en-IN');
                if (countCard) countCard.innerText = stats.totalEntries;
            })
            .catch(err => console.error("Error loading income stats:", err));
    }

    // Load Income Records Table
    function loadIncome() {
        var searchVal = searchInput ? searchInput.value.trim() : "";
        var sourceVal = sourceFilter ? sourceFilter.value : "All";

        var url = `../Handlers/IncomeHandler.ashx?action=get&search=${encodeURIComponent(searchVal)}&source=${encodeURIComponent(sourceVal)}`;

        fetch(url)
            .then(res => res.json())
            .then(incomes => {
                renderIncomeTable(incomes);
            })
            .catch(err => console.error("Error loading income:", err));
    }

    function renderIncomeTable(incomes) {
        var tbody = document.querySelector("table.table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (incomes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No income records found in database.</td></tr>`;
            return;
        }

        incomes.forEach(inc => {
            var tr = document.createElement("tr");
            tr.setAttribute("data-income-id", inc.id);

            var sourceBadge = getSourceBadge(inc.source);

            tr.innerHTML = `
                <td class="ps-4 fw-bold text-muted">${inc.id}</td>
                <td>${escapeHtml(formatDate(inc.date))}</td>
                <td>${sourceBadge}</td>
                <td class="fw-bold text-success">₹${parseFloat(inc.amount).toLocaleString('en-IN')}</td>
                <td>${escapeHtml(inc.description || "N/A")}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger text-white btn-delete-income" data-id="${inc.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        bindDeleteButtons();
    }

    function getSourceBadge(source) {
        var badgeColor = 'bg-primary';
        if (source === 'Salary') badgeColor = 'bg-primary';
        else if (source === 'Freelancing') badgeColor = 'bg-success';
        else if (source === 'Bonus') badgeColor = 'bg-info';
        else if (source === 'Business') badgeColor = 'bg-warning text-dark';
        else if (source === 'Investment') badgeColor = 'bg-purple';

        return `<span class="badge ${badgeColor}">${escapeHtml(source)}</span>`;
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

    // Bind Delete Buttons
    function bindDeleteButtons() {
        document.querySelectorAll(".btn-delete-income").forEach(btn => {
            btn.onclick = function () {
                var id = btn.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this income record (ID: " + id + ")?")) {
                    var formData = new URLSearchParams();
                    formData.append("action", "delete");
                    formData.append("id", id);

                    fetch("../Handlers/IncomeHandler.ashx", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: formData.toString()
                    })
                        .then(res => res.json())
                        .then(res => {
                            if (res.success) {
                                alert(res.message);
                                loadIncome();
                                loadIncomeStats();
                            } else {
                                alert("Error: " + res.message);
                            }
                        })
                        .catch(err => console.error("Error deleting income record:", err));
                }
            };
        });
    }

    // Form Submission (Add Income)
    var incomeForm = document.getElementById("incomeForm");
    if (incomeForm) {
        incomeForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var amount = document.getElementById("incomeAmount").value;
            var source = document.getElementById("incomeSource").value;
            var date = document.getElementById("incomeDate").value;
            var description = document.getElementById("incomeDescription").value;

            var formData = new URLSearchParams();
            formData.append("action", "add");
            formData.append("amount", amount);
            formData.append("source", source);
            formData.append("date", date);
            formData.append("description", description);

            fetch("../Handlers/IncomeHandler.ashx", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert(res.message);
                        incomeForm.reset();
                        if (incomeDateInput) {
                            incomeDateInput.value = new Date().toISOString().split('T')[0];
                        }
                        var collapseElement = document.getElementById("addIncomeForm");
                        if (collapseElement) {
                            var bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
                            if (bsCollapse) bsCollapse.hide();
                        }
                        loadIncome();
                        loadIncomeStats();
                    } else {
                        alert("Error: " + res.message);
                    }
                })
                .catch(err => console.error("Error adding income record:", err));
        });
    }

    // Filters & Search
    var searchInput = document.querySelector("input[placeholder='Search by Income Source...']");
    var searchBtn = document.querySelector(".input-group button");
    var sourceFilter = document.querySelector(".card-header select.form-select");

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            loadIncome();
        });
    }
    if (searchBtn) {
        searchBtn.addEventListener("click", function () {
            loadIncome();
        });
    }
    if (sourceFilter) {
        sourceFilter.addEventListener("change", function () {
            loadIncome();
        });
    }

    // Initial Execution
    loadIncomeStats();
    loadIncome();
});
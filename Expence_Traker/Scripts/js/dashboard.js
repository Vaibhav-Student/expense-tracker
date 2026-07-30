// Scripts/js/dashboard.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    var myPieChart = null;

    // Load Dashboard Metrics from MySQL
    function loadDashboardData() {
        fetch("../Handlers/DashboardHandler.ashx")
            .then(res => res.json())
            .then(data => {
                updateDashboardCards(data);
                updateCategoryChart(data.categoryBreakdown);
                updateRecentTransactions(data.recentTransactions);
            })
            .catch(err => console.error("Error loading dashboard data:", err));
    }

    function updateDashboardCards(data) {
        var balanceCard = document.querySelector(".border-left-primary .h5");
        var incomeCard = document.querySelector(".border-left-success .h5");
        var expenseCard = document.querySelector(".border-left-danger .h5");
        var categoryCard = document.querySelector(".border-left-info .h5");

        if (balanceCard) balanceCard.innerText = "₹" + data.totalBalance.toLocaleString('en-IN');
        if (incomeCard) incomeCard.innerText = "₹" + data.totalIncome.toLocaleString('en-IN');
        if (expenseCard) expenseCard.innerText = "₹" + data.totalExpense.toLocaleString('en-IN');
        if (categoryCard) categoryCard.innerText = data.activeCategories;
    }

    function updateCategoryChart(breakdown) {
        var chartCanvas = document.getElementById("expenseChart");
        if (!chartCanvas) return;

        var labels = [];
        var values = [];
        var colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#6f42c1', '#fd7e14'];

        if (breakdown && breakdown.length > 0) {
            breakdown.forEach(item => {
                labels.push(item.category);
                values.push(parseFloat(item.total_amount));
            });
        } else {
            labels = ["No Data"];
            values = [1];
        }

        var ctx = chartCanvas.getContext('2d');
        if (myPieChart) {
            myPieChart.destroy();
        }

        myPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }],
            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        });
    }

    function updateRecentTransactions(transactions) {
        var tbody = document.querySelector("table.table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!transactions || transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No recent transactions found.</td></tr>`;
            return;
        }

        transactions.forEach(t => {
            var tr = document.createElement("tr");
            var isIncome = t.type === 'Income';
            var amountClass = isIncome ? 'text-success' : 'text-danger';
            var amountPrefix = isIncome ? '+₹' : '-₹';
            var typeBadge = isIncome ? '<span class="badge bg-success">Income</span>' : `<span class="badge bg-primary">${escapeHtml(t.source_or_category)}</span>`;

            tr.innerHTML = `
                <td class="ps-4 fw-bold text-muted">${t.id}</td>
                <td>${escapeHtml(formatDate(t.date))}</td>
                <td>${typeBadge}</td>
                <td>${escapeHtml(t.description || t.source_or_category)}</td>
                <td class="fw-bold ${amountClass}">${amountPrefix}${parseFloat(t.amount).toLocaleString('en-IN')}</td>
                <td><span class="badge ${isIncome ? 'bg-success' : 'bg-secondary'}">${isIncome ? 'Received' : 'Paid'}</span></td>
            `;

            tbody.appendChild(tr);
        });
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

    // Load data
    loadDashboardData();
});
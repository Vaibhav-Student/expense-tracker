// Scripts/js/reports.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Chart instances references
    var barChart = null, pieChart = null, lineChart = null;

    // Load Reports Data from MySQL
    function loadReportsData() {
        var monthVal = document.getElementById("filterMonth") ? document.getElementById("filterMonth").value : "All";
        var yearVal = document.getElementById("filterYear") ? document.getElementById("filterYear").value : "2026";

        var url = `../Handlers/ReportHandler.ashx?month=${encodeURIComponent(monthVal)}&year=${encodeURIComponent(yearVal)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                updateSummaryCards(data);
                updateIncomeVsExpenseChart(data.totalIncome, data.totalExpense);
                updateExpenseByCategoryChart(data.categoryBreakdown);
                updateMonthlyTrendChart(data.monthlyExpensesTrend);
                updateFinancialSummary(data);
                updateQuickInsights(data);
                updateTopCategoriesTable(data.categoryBreakdown);
                updateMonthlyReportTable(data.monthlyReportTable);
            })
            .catch(err => console.error("Error loading report data:", err));
    }

    // 1. Summary Cards
    function updateSummaryCards(data) {
        var cardIncome = document.getElementById("cardTotalIncome");
        var cardExpense = document.getElementById("cardTotalExpense");
        var cardBalance = document.getElementById("cardCurrentBalance");
        var cardTransactions = document.getElementById("cardTotalTransactions");

        if (cardIncome) cardIncome.innerText = "₹" + data.totalIncome.toLocaleString('en-IN');
        if (cardExpense) cardExpense.innerText = "₹" + data.totalExpense.toLocaleString('en-IN');
        if (cardBalance) cardBalance.innerText = "₹" + data.currentBalance.toLocaleString('en-IN');
        if (cardTransactions) cardTransactions.innerText = data.totalTransactions;
    }

    // 2. Bar Chart: Income vs Expense
    function updateIncomeVsExpenseChart(income, expense) {
        var ctxBar = document.getElementById("incomeVsExpenseChart");
        if (!ctxBar) return;

        if (barChart) barChart.destroy();

        barChart = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    label: 'Amount (₹)',
                    data: [income, expense],
                    backgroundColor: ['#1cc88a', '#e74a3b'],
                    hoverBackgroundColor: ['#17a673', '#be2617'],
                    borderRadius: 6,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ' ₹' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) { return '₹' + value; }
                        }
                    }
                }
            }
        });
    }

    // 3. Pie Chart: Expense by Category
    function updateExpenseByCategoryChart(categoryBreakdown) {
        var ctxPie = document.getElementById("expenseByCategoryChart");
        if (!ctxPie) return;

        var labels = [];
        var values = [];
        var palette = ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b', '#36b9cc', '#6f42c1', '#858796', '#fd7e14'];

        if (categoryBreakdown && categoryBreakdown.length > 0) {
            categoryBreakdown.forEach(item => {
                labels.push(item.category);
                values.push(item.amount);
            });
        } else {
            labels = ["No Expense"];
            values = [0];
        }

        if (pieChart) pieChart.destroy();

        pieChart = new Chart(ctxPie.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: palette.slice(0, labels.length),
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var label = context.label || '';
                                var value = context.parsed || 0;
                                return ' ' + label + ': ₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. Line Chart: Monthly Expense Trend
    function updateMonthlyTrendChart(trendData) {
        var ctxLine = document.getElementById("monthlyTrendChart");
        if (!ctxLine) return;

        if (lineChart) lineChart.destroy();

        lineChart = new Chart(ctxLine.getContext('2d'), {
            type: 'line',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [{
                    label: 'Monthly Expense (₹)',
                    data: trendData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.08)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#4e73df',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ' Expense: ₹' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) { return '₹' + value; }
                        }
                    }
                }
            }
        });
    }

    // 5. Financial Summary Table
    function updateFinancialSummary(data) {
        var rows = document.querySelectorAll(".card-body table tbody tr");
        if (rows.length >= 5) {
            rows[0].cells[1].innerText = "₹" + data.highestIncome.toLocaleString('en-IN');
            rows[1].cells[1].innerText = "₹" + data.highestExpense.toLocaleString('en-IN');
            rows[2].cells[1].innerText = "₹" + data.avgMonthlyExpense.toLocaleString('en-IN');
            rows[3].cells[1].innerText = data.mostSpendingCategory;
            rows[4].cells[1].innerText = "₹" + data.currentBalance.toLocaleString('en-IN');
        }
    }

    // 6. Quick Insights
    function updateQuickInsights(data) {
        var items = document.querySelectorAll(".col-lg-5 .list-group-item");
        if (items.length >= 4) {
            var catBadge = items[0].querySelector(".badge");
            var dailyText = items[1].querySelector(".fw-bold");
            var monthBadge = items[2].querySelector(".badge");
            var savingsText = items[3].querySelector(".fw-bold");

            if (catBadge) catBadge.innerText = data.mostSpendingCategory;
            if (dailyText) dailyText.innerText = "₹" + data.avgDailyExpense.toLocaleString('en-IN');
            if (monthBadge) monthBadge.innerText = data.bestSavingMonth;
            if (savingsText) savingsText.innerText = "₹" + data.currentBalance.toLocaleString('en-IN');
        }
    }

    // 7. Top Expense Categories Table
    function updateTopCategoriesTable(categoryBreakdown) {
        var tbody = document.querySelector(".col-lg-5 table.table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!categoryBreakdown || categoryBreakdown.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">No category data.</td></tr>`;
            return;
        }

        var progressColors = ['bg-primary', 'bg-warning', 'bg-success', 'bg-info', 'bg-danger', 'bg-purple'];

        categoryBreakdown.forEach((item, idx) => {
            var colorClass = progressColors[idx % progressColors.length];
            var tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="ps-3 fw-bold text-dark">${escapeHtml(item.category)}</td>
                <td>₹${parseFloat(item.amount).toLocaleString('en-IN')}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 8px;">
                            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${item.percentage}%;"></div>
                        </div>
                        <span class="fw-semibold text-secondary small">${item.percentage}%</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 8. Monthly Report Table
    function updateMonthlyReportTable(monthlyTable) {
        var tbody = document.querySelector(".col-lg-7 table.table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!monthlyTable || monthlyTable.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No monthly report data.</td></tr>`;
            return;
        }

        monthlyTable.forEach(row => {
            var isProfit = row.status === 'Profit';
            var tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="ps-4 fw-bold text-dark">${escapeHtml(row.month)}</td>
                <td class="text-success fw-semibold">₹${parseFloat(row.income).toLocaleString('en-IN')}</td>
                <td class="text-danger fw-semibold">₹${parseFloat(row.expense).toLocaleString('en-IN')}</td>
                <td class="fw-bold">₹${parseFloat(row.balance).toLocaleString('en-IN')}</td>
                <td class="text-end pe-4"><span class="badge ${isProfit ? 'bg-success' : 'bg-danger'} px-3 py-1">${row.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
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

    // 9. Filter Event Listeners
    var filterForm = document.getElementById("reportFilterForm");
    var btnReset = document.getElementById("btnResetFilter");

    if (filterForm) {
        filterForm.addEventListener("submit", function (e) {
            e.preventDefault();
            loadReportsData();
        });
    }

    if (btnReset) {
        btnReset.addEventListener("click", function () {
            document.getElementById("filterMonth").value = "All";
            document.getElementById("filterYear").value = "2026";
            loadReportsData();
        });
    }

    // Initial load
    loadReportsData();
});

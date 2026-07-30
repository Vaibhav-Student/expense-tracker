// Scripts/js/reports.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Chart instances references
    var barChart, pieChart, lineChart;

    // 2. Initialize Chart 1: Income vs Expense (Bar Chart)
    var ctxBar = document.getElementById("incomeVsExpenseChart");
    if (ctxBar) {
        barChart = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    label: 'Amount (₹)',
                    data: [35000, 20000],
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

    // 3. Initialize Chart 2: Expense by Category (Pie Chart)
    var ctxPie = document.getElementById("expenseByCategoryChart");
    if (ctxPie) {
        pieChart = new Chart(ctxPie.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ["Food", "Shopping", "Travel", "Medical", "Bills", "Entertainment", "Other"],
                datasets: [{
                    data: [6000, 4000, 3000, 2000, 5000, 0, 0],
                    backgroundColor: [
                        '#4e73df', // Food - Blue
                        '#1cc88a', // Shopping - Green
                        '#f6c23e', // Travel - Yellow
                        '#e74a3b', // Medical - Red
                        '#36b9cc', // Bills - Cyan
                        '#6f42c1', // Entertainment - Purple
                        '#858796'  // Other - Grey
                    ],
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

    // 4. Initialize Chart 3: Monthly Expense Trend (Line Chart)
    var ctxLine = document.getElementById("monthlyTrendChart");
    if (ctxLine) {
        lineChart = new Chart(ctxLine.getContext('2d'), {
            type: 'line',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [{
                    label: 'Monthly Expense (₹)',
                    data: [20000, 18000, 25000, 19000, 22000, 21000, 20000, 19500, 20500, 21500, 20000, 22500],
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
                        beginAtZero: false,
                        ticks: {
                            callback: function (value) { return '₹' + value; }
                        }
                    }
                }
            }
        });
    }

    // 5. Filter Section Handlers
    var filterForm = document.getElementById("reportFilterForm");
    var btnReset = document.getElementById("btnResetFilter");

    if (filterForm) {
        filterForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var month = document.getElementById("filterMonth").value;
            var year = document.getElementById("filterYear").value;

            // Simulation: Slight variation based on month
            var income = (month === "All") ? 35000 : 30000;
            var expense = (month === "All") ? 20000 : 18000;
            var balance = income - expense;

            // Update Summary Cards
            document.getElementById("cardTotalIncome").innerText = "₹" + income.toLocaleString();
            document.getElementById("cardTotalExpense").innerText = "₹" + expense.toLocaleString();
            document.getElementById("cardCurrentBalance").innerText = "₹" + balance.toLocaleString();

            // Update Bar Chart
            if (barChart) {
                barChart.data.datasets[0].data = [income, expense];
                barChart.update();
            }

            alert("Filter Applied: " + month + " " + year + " report metrics updated!");
        });
    }

    if (btnReset) {
        btnReset.addEventListener("click", function () {
            document.getElementById("filterMonth").value = "All";
            document.getElementById("filterYear").value = "2026";

            // Reset Summary Cards
            document.getElementById("cardTotalIncome").innerText = "₹35,000";
            document.getElementById("cardTotalExpense").innerText = "₹20,000";
            document.getElementById("cardCurrentBalance").innerText = "₹15,000";

            // Reset Charts
            if (barChart) {
                barChart.data.datasets[0].data = [35000, 20000];
                barChart.update();
            }
        });
    }
});

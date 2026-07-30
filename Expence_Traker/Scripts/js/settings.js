// Scripts/js/settings.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    var themeToggle = document.getElementById("themeToggle");
    var themeLabel = document.getElementById("themeToggleLabel");

    // Apply theme styling to document
    function applyTheme(isDark) {
        if (isDark) {
            document.body.classList.add("bg-dark", "text-light");
            if (themeLabel) themeLabel.innerText = "Dark Mode";
            if (themeToggle) themeToggle.checked = true;
        } else {
            document.body.classList.remove("bg-dark", "text-light");
            if (themeLabel) themeLabel.innerText = "Light Mode";
            if (themeToggle) themeToggle.checked = false;
        }
    }

    // Load Settings from MySQL via SettingsHandler.ashx
    function loadSettings() {
        fetch("../Handlers/SettingsHandler.ashx?action=get")
            .then(res => res.json())
            .then(data => {
                var currencySelect = document.getElementById("currencySelect");
                var dateFormatSelect = document.getElementById("dateFormatSelect");
                var notifyEnable = document.getElementById("notifyEnable");
                var notifyExpenseReminder = document.getElementById("notifyExpenseReminder");
                var notifyMonthlyReport = document.getElementById("notifyMonthlyReport");

                if (currencySelect && data.currency) currencySelect.value = data.currency;
                if (dateFormatSelect && data.date_format) dateFormatSelect.value = data.date_format;
                if (notifyEnable && data.notify_enable !== undefined) notifyEnable.checked = data.notify_enable;
                if (notifyExpenseReminder && data.expense_reminder !== undefined) notifyExpenseReminder.checked = data.expense_reminder;
                if (notifyMonthlyReport && data.monthly_report !== undefined) notifyMonthlyReport.checked = data.monthly_report;

                var isDark = (data.theme === "Dark");
                applyTheme(isDark);
            })
            .catch(err => console.error("Error loading settings:", err));
    }

    // Theme Toggle Switch Event
    if (themeToggle) {
        themeToggle.addEventListener("change", function () {
            applyTheme(this.checked);
        });
    }

    // Save Preferences Form Handler
    var settingsForm = document.getElementById("settingsForm");
    if (settingsForm) {
        settingsForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var theme = (themeToggle && themeToggle.checked) ? "Dark" : "Light";
            var currencySelect = document.getElementById("currencySelect");
            var dateFormatSelect = document.getElementById("dateFormatSelect");
            var notifyEnable = document.getElementById("notifyEnable");
            var notifyExpenseReminder = document.getElementById("notifyExpenseReminder");
            var notifyMonthlyReport = document.getElementById("notifyMonthlyReport");

            var currency = currencySelect ? currencySelect.value : "INR";
            var dateFormat = dateFormatSelect ? dateFormatSelect.value : "DD/MM/YYYY";
            var notify = notifyEnable ? notifyEnable.checked : true;
            var reminder = notifyExpenseReminder ? notifyExpenseReminder.checked : true;
            var report = notifyMonthlyReport ? notifyMonthlyReport.checked : true;

            var formData = new URLSearchParams();
            formData.append("action", "save");
            formData.append("theme", theme);
            formData.append("currency", currency);
            formData.append("date_format", dateFormat);
            formData.append("notify_enable", notify);
            formData.append("expense_reminder", reminder);
            formData.append("monthly_report", report);

            fetch("../Handlers/SettingsHandler.ashx", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert(res.message);
                        loadSettings();
                    } else {
                        alert("Error: " + res.message);
                    }
                })
                .catch(err => console.error("Error saving settings:", err));
        });
    }

    // 4. Data Management Handlers (Export, Import, Reset)
    var btnExport = document.getElementById("btnExportData");
    var btnImport = document.getElementById("btnImportData");
    var btnReset = document.getElementById("btnResetData");
    var fileInputImport = document.getElementById("fileInputImport");

    if (btnExport) {
        btnExport.addEventListener("click", function () {
            window.location.href = "../Handlers/SettingsHandler.ashx?action=export";
        });
    }

    if (btnImport) {
        btnImport.addEventListener("click", function () {
            if (fileInputImport) fileInputImport.click();
        });
    }

    if (fileInputImport) {
        fileInputImport.addEventListener("change", function () {
            if (this.files && this.files.length > 0) {
                var file = this.files[0];
                var formData = new FormData();
                formData.append("action", "import");
                formData.append("file", file);

                fetch("../Handlers/SettingsHandler.ashx?action=import", {
                    method: "POST",
                    body: formData
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success) {
                            alert(res.message);
                            loadSettings();
                        } else {
                            alert("Error: " + res.message);
                        }
                    })
                    .catch(err => console.error("Error importing data:", err));

                this.value = "";
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener("click", function () {
            if (confirm("Are you sure you want to reset all data back to original default settings?")) {
                var formData = new URLSearchParams();
                formData.append("action", "reset");

                fetch("../Handlers/SettingsHandler.ashx", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString()
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success) {
                            alert("Database sample data and preferences reset successfully!");
                            loadSettings();
                        } else {
                            alert("Error: " + res.message);
                        }
                    })
                    .catch(err => console.error("Error resetting data:", err));
            }
        });
    }

    // 5. Help & Support Section Modal Handlers
    var helpBtns = document.querySelectorAll(".btn-help-item");
    helpBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var title = btn.getAttribute("data-title") || "Help & Support";
            var desc = btn.getAttribute("data-desc") || "Detailed information will be provided here.";

            var modalTitle = document.getElementById("helpModalTitle");
            var modalContent = document.getElementById("helpModalContent");

            if (modalTitle) modalTitle.innerText = title;
            if (modalContent) modalContent.innerText = desc;

            var modalEl = document.getElementById("helpModal");
            if (modalEl) {
                var modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        });
    });

    // Initial load
    loadSettings();
});

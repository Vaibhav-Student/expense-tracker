// Scripts/js/settings.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // 2. Theme Toggle Switch Handler
    var themeToggle = document.getElementById("themeToggle");
    var themeLabel = document.getElementById("themeToggleLabel");

    if (themeToggle) {
        themeToggle.addEventListener("change", function () {
            if (this.checked) {
                if (themeLabel) themeLabel.innerText = "Dark Mode";
                document.body.classList.add("bg-dark", "text-light");
            } else {
                if (themeLabel) themeLabel.innerText = "Light Mode";
                document.body.classList.remove("bg-dark", "text-light");
            }
        });
    }

    // 3. Save Settings Form Handler
    var settingsForm = document.getElementById("settingsForm");
    if (settingsForm) {
        settingsForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var currency = document.getElementById("currencySelect").value;
            var dateFormat = document.getElementById("dateFormatSelect").value;
            var isThemeDark = themeToggle ? themeToggle.checked : false;

            alert("Settings saved successfully!\n- Currency: " + currency + "\n- Date Format: " + dateFormat + "\n- Theme: " + (isThemeDark ? "Dark Mode" : "Light Mode"));
        });
    }

    // 4. Data Management Buttons
    var btnExport = document.getElementById("btnExportData");
    var btnImport = document.getElementById("btnImportData");
    var btnReset = document.getElementById("btnResetData");
    var fileInputImport = document.getElementById("fileInputImport");

    if (btnExport) {
        btnExport.addEventListener("click", function () {
            alert("Exporting sample data...\nData exported successfully as 'ExpenseTracker_Data.json'!");
        });
    }

    if (btnImport) {
        btnImport.addEventListener("click", function () {
            if (fileInputImport) {
                fileInputImport.click();
            }
        });
    }

    if (fileInputImport) {
        fileInputImport.addEventListener("change", function () {
            if (this.files && this.files.length > 0) {
                alert("File '" + this.files[0].name + "' selected for import.\nSample data updated successfully!");
                this.value = "";
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener("click", function () {
            if (confirm("Are you sure you want to reset all sample data to default settings?")) {
                // Reset form fields
                if (settingsForm) settingsForm.reset();
                if (themeToggle) {
                    themeToggle.checked = false;
                    if (themeLabel) themeLabel.innerText = "Light Mode";
                    document.body.classList.remove("bg-dark", "text-light");
                }
                alert("Sample data has been reset to defaults!");
            }
        });
    }

    // 5. Help Section Modal Handlers
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
});

// Scripts/js/income.js

document.addEventListener("DOMContentLoaded", function () {
    // Update Date in navbar
    var dateElement = document.getElementById("currentDate");
    if(dateElement){
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Basic form submission handler (prevent default for styling purposes)
    var incomeForm = document.getElementById("incomeForm");
    if(incomeForm){
        incomeForm.addEventListener("submit", function(e) {
            e.preventDefault();
            alert("Income record saved successfully! (Simulation)");
            incomeForm.reset();
            // Automatically close the collapse if desired
            var collapseElement = document.getElementById("addIncomeForm");
            var bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        });
    }
});
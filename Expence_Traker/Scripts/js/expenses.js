// Scripts/js/expenses.js

document.addEventListener("DOMContentLoaded", function () {
    // Update Date in navbar
    var dateElement = document.getElementById("currentDate");
    if(dateElement){
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Basic form submission handler (prevent default for styling purposes)
    var expenseForm = document.getElementById("expenseForm");
    if(expenseForm){
        expenseForm.addEventListener("submit", function(e) {
            e.preventDefault();
            alert("Expense record saved successfully! (Simulation)");
            expenseForm.reset();
            // Automatically close the collapse if desired
            var collapseElement = document.getElementById("addExpenseForm");
            var bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        });
    }
});
// Scripts/js/categories.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    var nextIdNumber = 9;

    // Helper: Map color name to Bootstrap badge class
    function getColorBadgeClass(color) {
        switch (color.toLowerCase()) {
            case 'green': return 'bg-success';
            case 'blue': return 'bg-primary';
            case 'red': return 'bg-danger';
            case 'purple': return 'bg-purple';
            case 'orange': return 'bg-warning text-dark';
            case 'yellow': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }

    // Helper: Map color name to Border class for Cards
    function getColorBorderClass(color) {
        switch (color.toLowerCase()) {
            case 'green': return 'border-success';
            case 'blue': return 'border-primary';
            case 'red': return 'border-danger';
            case 'purple': return 'border-purple';
            case 'orange': return 'border-warning';
            case 'yellow': return 'border-warning';
            default: return 'border-secondary';
        }
    }

    // Helper: Map color name to Text class
    function getColorTextClass(color) {
        switch (color.toLowerCase()) {
            case 'green': return 'text-success';
            case 'blue': return 'text-primary';
            case 'red': return 'text-danger';
            case 'purple': return 'text-purple';
            case 'orange': return 'text-warning';
            case 'yellow': return 'text-dark';
            default: return 'text-secondary';
        }
    }

    // Update Counter Stats
    function updateCategoryStats() {
        var tableRows = document.querySelectorAll("#categoriesTable tbody tr:not(.d-none)");
        var totalRows = document.querySelectorAll("#categoriesTable tbody tr").length;
        var statTotal = document.getElementById("statTotalCategories");
        var statActive = document.getElementById("statActiveCategories");
        if (statTotal) statTotal.innerText = totalRows;
        if (statActive) statActive.innerText = tableRows.length;
    }

    // 2. Form Submission Handler (Add Category)
    var categoryForm = document.getElementById("categoryForm");
    if (categoryForm) {
        categoryForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var name = document.getElementById("categoryName").value.trim();
            var icon = document.getElementById("categoryIcon").value;
            var color = document.getElementById("categoryColor").value;
            var desc = document.getElementById("categoryDescription").value.trim() || "No description provided";

            var catIdStr = "CAT-00" + nextIdNumber;
            var currentId = nextIdNumber;
            nextIdNumber++;

            // Create new Table Row
            var tbody = document.querySelector("#categoriesTable tbody");
            var newRow = document.createElement("tr");
            newRow.setAttribute("data-category-id", currentId);
            newRow.setAttribute("data-name", name);
            newRow.setAttribute("data-icon", icon);
            newRow.setAttribute("data-color", color);
            newRow.setAttribute("data-desc", desc);

            var badgeClass = getColorBadgeClass(color);

            newRow.innerHTML = `
                <td class="ps-4 fw-bold text-secondary">${catIdStr}</td>
                <td class="fw-semibold text-dark">${name}</td>
                <td class="fs-5">${icon}</td>
                <td><span class="badge ${badgeClass}">${color}</span></td>
                <td>${desc}</td>
                <td><span class="badge bg-success rounded-pill px-3">Active</span></td>
                <td class="text-end pe-4">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-view-cat" title="View"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn btn-outline-primary btn-edit-cat" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-outline-danger btn-delete-cat" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;

            tbody.prepend(newRow);

            // Create new Grid Card
            var cardsGrid = document.getElementById("categoryCardsGrid");
            var newCol = document.createElement("div");
            newCol.className = "col category-grid-item";
            newCol.setAttribute("data-name", name);
            newCol.setAttribute("data-desc", desc);
            newCol.setAttribute("data-category-id", currentId);

            var borderClass = getColorBorderClass(color);
            var textClass = getColorTextClass(color);

            newCol.innerHTML = `
                <div class="card category-card h-100 border-top border-4 ${borderClass} p-3">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="category-icon-box bg-light ${textClass} fs-3">
                            ${icon}
                        </div>
                        <span class="badge ${badgeClass} rounded-pill px-3 py-2 fs-6">0 Expenses</span>
                    </div>
                    <h5 class="fw-bold text-dark mb-1">${name}</h5>
                    <p class="text-muted small mb-0">${desc}</p>
                </div>
            `;
            cardsGrid.prepend(newCol);

            // Re-bind Action Buttons
            bindTableActionButtons(newRow);

            // Reset form and collapse
            categoryForm.reset();
            var collapseElement = document.getElementById("addCategoryForm");
            if (collapseElement) {
                var bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }

            updateCategoryStats();
            alert("Category '" + name + "' added successfully!");
        });
    }

    // 3. Search Filter Logic
    var searchInput = document.getElementById("searchCategoryInput");
    var btnSearch = document.getElementById("btnSearchCategory");

    function filterCategories() {
        var query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        // Filter Table Rows
        var rows = document.querySelectorAll("#categoriesTable tbody tr");
        rows.forEach(function (row) {
            var name = (row.getAttribute("data-name") || row.cells[1].innerText).toLowerCase();
            var desc = (row.getAttribute("data-desc") || row.cells[4].innerText).toLowerCase();
            var id = row.cells[0].innerText.toLowerCase();

            if (name.includes(query) || desc.includes(query) || id.includes(query)) {
                row.classList.remove("d-none");
            } else {
                row.classList.add("d-none");
            }
        });

        // Filter Grid Cards
        var cards = document.querySelectorAll("#categoryCardsGrid .category-grid-item");
        cards.forEach(function (card) {
            var name = (card.getAttribute("data-name") || "").toLowerCase();
            var desc = (card.getAttribute("data-desc") || "").toLowerCase();

            if (name.includes(query) || desc.includes(query)) {
                card.classList.remove("d-none");
            } else {
                card.classList.add("d-none");
            }
        });

        updateCategoryStats();
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterCategories);
    }
    if (btnSearch) {
        btnSearch.addEventListener("click", filterCategories);
    }

    // 4. View, Edit, and Delete Actions
    function bindTableActionButtons(container) {
        var root = container || document;

        // View Button Handler
        var viewBtns = root.querySelectorAll(".btn-view-cat");
        viewBtns.forEach(function (btn) {
            btn.onclick = function () {
                var tr = btn.closest("tr");
                var id = tr.cells[0].innerText;
                var name = tr.getAttribute("data-name") || tr.cells[1].innerText;
                var icon = tr.getAttribute("data-icon") || tr.cells[2].innerText;
                var color = tr.getAttribute("data-color") || tr.cells[3].innerText;
                var desc = tr.getAttribute("data-desc") || tr.cells[4].innerText;

                document.getElementById("modalViewId").innerText = id;
                document.getElementById("modalViewName").innerText = name;
                document.getElementById("modalViewIcon").innerText = icon;
                document.getElementById("modalViewColor").innerText = color;
                document.getElementById("modalViewDesc").innerText = desc;

                var modalEl = document.getElementById("viewCategoryModal");
                var modal = new bootstrap.Modal(modalEl);
                modal.show();
            };
        });

        // Edit Button Handler
        var editBtns = root.querySelectorAll(".btn-edit-cat");
        editBtns.forEach(function (btn) {
            btn.onclick = function () {
                var tr = btn.closest("tr");
                var catId = tr.getAttribute("data-category-id");
                var name = tr.getAttribute("data-name") || tr.cells[1].innerText;
                var icon = tr.getAttribute("data-icon") || tr.cells[2].innerText;
                var color = tr.getAttribute("data-color") || tr.cells[3].innerText;
                var desc = tr.getAttribute("data-desc") || tr.cells[4].innerText;

                document.getElementById("editCategoryId").value = catId;
                document.getElementById("editCategoryName").value = name;
                document.getElementById("editCategoryIcon").value = icon;
                document.getElementById("editCategoryColor").value = color;
                document.getElementById("editCategoryDescription").value = desc;

                var modalEl = document.getElementById("editCategoryModal");
                var modal = new bootstrap.Modal(modalEl);
                modal.show();
            };
        });

        // Delete Button Handler
        var deleteBtns = root.querySelectorAll(".btn-delete-cat");
        deleteBtns.forEach(function (btn) {
            btn.onclick = function () {
                var tr = btn.closest("tr");
                var name = tr.getAttribute("data-name") || tr.cells[1].innerText;
                var catId = tr.getAttribute("data-category-id");

                if (confirm("Are you sure you want to delete category '" + name + "'?")) {
                    tr.remove();

                    // Remove corresponding card if present
                    if (catId) {
                        var matchingCard = document.querySelector(`#categoryCardsGrid .category-grid-item[data-category-id="${catId}"]`);
                        if (matchingCard) matchingCard.remove();
                    } else {
                        var gridCards = document.querySelectorAll("#categoryCardsGrid .category-grid-item");
                        gridCards.forEach(function (card) {
                            if (card.getAttribute("data-name") === name) {
                                card.remove();
                            }
                        });
                    }

                    updateCategoryStats();
                    alert("Category '" + name + "' deleted successfully!");
                }
            };
        });
    }

    // Initial binding for existing static table rows
    bindTableActionButtons();

    // Edit Form submit handler
    var editCategoryForm = document.getElementById("editCategoryForm");
    if (editCategoryForm) {
        editCategoryForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var catId = document.getElementById("editCategoryId").value;
            var name = document.getElementById("editCategoryName").value.trim();
            var icon = document.getElementById("editCategoryIcon").value;
            var color = document.getElementById("editCategoryColor").value;
            var desc = document.getElementById("editCategoryDescription").value.trim();

            var tr = document.querySelector(`#categoriesTable tbody tr[data-category-id="${catId}"]`);
            if (tr) {
                tr.setAttribute("data-name", name);
                tr.setAttribute("data-icon", icon);
                tr.setAttribute("data-color", color);
                tr.setAttribute("data-desc", desc);

                tr.cells[1].innerText = name;
                tr.cells[2].innerText = icon;
                tr.cells[3].innerHTML = `<span class="badge ${getColorBadgeClass(color)}">${color}</span>`;
                tr.cells[4].innerText = desc;
            }

            // Update matching card
            var matchingCard = document.querySelector(`#categoryCardsGrid .category-grid-item[data-name="${name}"]`) ||
                document.querySelector(`#categoryCardsGrid .category-grid-item[data-category-id="${catId}"]`);
            if (matchingCard) {
                matchingCard.setAttribute("data-name", name);
                matchingCard.setAttribute("data-desc", desc);
                var cardTitle = matchingCard.querySelector("h5");
                var cardIcon = matchingCard.querySelector(".category-icon-box");
                var cardDesc = matchingCard.querySelector("p");

                if (cardTitle) cardTitle.innerText = name;
                if (cardIcon) cardIcon.innerText = icon;
                if (cardDesc) cardDesc.innerText = desc;
            }

            var modalEl = document.getElementById("editCategoryModal");
            var modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            alert("Category updated successfully!");
        });
    }
});

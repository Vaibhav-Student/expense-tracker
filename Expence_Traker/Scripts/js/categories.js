// Scripts/js/categories.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. Update Date in Navbar
    var dateElement = document.getElementById("currentDate");
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // Helper: Map color name to Bootstrap badge class
    function getColorBadgeClass(color) {
        if (!color) return 'bg-secondary';
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
        if (!color) return 'border-secondary';
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
        if (!color) return 'text-secondary';
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

    // Load categories from MySQL database via CategoryHandler.ashx
    function loadCategories() {
        var query = searchInput ? searchInput.value.trim() : "";
        var url = "../Handlers/CategoryHandler.ashx?action=get";
        if (query) {
            url += "&search=" + encodeURIComponent(query);
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                renderCategories(data);
            })
            .catch(error => {
                console.error("Error loading categories:", error);
            });
    }

    function renderCategories(categories) {
        var tbody = document.querySelector("#categoriesTable tbody");
        var cardsGrid = document.getElementById("categoryCardsGrid");

        if (tbody) tbody.innerHTML = "";
        if (cardsGrid) cardsGrid.innerHTML = "";

        var statTotal = document.getElementById("statTotalCategories");
        var statActive = document.getElementById("statActiveCategories");
        if (statTotal) statTotal.innerText = categories.length;

        var activeCount = 0;

        categories.forEach(cat => {
            if (cat.status === 'Active') activeCount++;
            var catIdStr = "CAT-" + String(cat.id).padStart(3, '0');
            var badgeClass = getColorBadgeClass(cat.color);

            // Create Table Row
            var tr = document.createElement("tr");
            tr.setAttribute("data-category-id", cat.id);
            tr.setAttribute("data-name", cat.name);
            tr.setAttribute("data-icon", cat.icon);
            tr.setAttribute("data-color", cat.color);
            tr.setAttribute("data-desc", cat.description || "");

            tr.innerHTML = `
                <td class="ps-4 fw-bold text-secondary">${catIdStr}</td>
                <td class="fw-semibold text-dark">${escapeHtml(cat.name)}</td>
                <td class="fs-5">${escapeHtml(cat.icon)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(cat.color)}</span></td>
                <td>${escapeHtml(cat.description || "N/A")}</td>
                <td><span class="badge bg-success rounded-pill px-3">${escapeHtml(cat.status || 'Active')}</span></td>
                <td class="text-end pe-4">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-view-cat" title="View"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn btn-outline-primary btn-edit-cat" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-outline-danger btn-delete-cat" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;

            if (tbody) tbody.appendChild(tr);

            // Create Grid Card
            var col = document.createElement("div");
            col.className = "col category-grid-item";
            col.setAttribute("data-name", cat.name);
            col.setAttribute("data-category-id", cat.id);

            var borderClass = getColorBorderClass(cat.color);
            var textClass = getColorTextClass(cat.color);

            col.innerHTML = `
                <div class="card category-card h-100 border-top border-4 ${borderClass} p-3">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="category-icon-box bg-light ${textClass} fs-3">
                            ${escapeHtml(cat.icon)}
                        </div>
                        <span class="badge ${badgeClass} rounded-pill px-3 py-2 fs-6">Active</span>
                    </div>
                    <h5 class="fw-bold text-dark mb-1">${escapeHtml(cat.name)}</h5>
                    <p class="text-muted small mb-0">${escapeHtml(cat.description || "N/A")}</p>
                </div>
            `;

            if (cardsGrid) cardsGrid.appendChild(col);
        });

        if (statActive) statActive.innerText = activeCount;

        bindTableActionButtons();
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

    // 2. Form Submission Handler (Add Category)
    var categoryForm = document.getElementById("categoryForm");
    if (categoryForm) {
        categoryForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var name = document.getElementById("categoryName").value.trim();
            var icon = document.getElementById("categoryIcon").value;
            var color = document.getElementById("categoryColor").value;
            var desc = document.getElementById("categoryDescription").value.trim();

            var formData = new URLSearchParams();
            formData.append("action", "add");
            formData.append("name", name);
            formData.append("icon", icon);
            formData.append("color", color);
            formData.append("description", desc);

            fetch("../Handlers/CategoryHandler.ashx", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert(res.message);
                        categoryForm.reset();
                        var collapseElement = document.getElementById("addCategoryForm");
                        if (collapseElement) {
                            var bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
                            if (bsCollapse) bsCollapse.hide();
                        }
                        loadCategories();
                    } else {
                        alert("Error: " + res.message);
                    }
                })
                .catch(err => console.error("Error adding category:", err));
        });
    }

    // 3. Search Filter Logic
    var searchInput = document.getElementById("searchCategoryInput");
    var btnSearch = document.getElementById("btnSearchCategory");

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            loadCategories();
        });
    }
    if (btnSearch) {
        btnSearch.addEventListener("click", function () {
            loadCategories();
        });
    }

    // 4. View, Edit, and Delete Actions
    function bindTableActionButtons() {
        // View Button Handler
        document.querySelectorAll(".btn-view-cat").forEach(function (btn) {
            btn.onclick = function () {
                var tr = btn.closest("tr");
                var id = tr.cells[0].innerText;
                var name = tr.getAttribute("data-name");
                var icon = tr.getAttribute("data-icon");
                var color = tr.getAttribute("data-color");
                var desc = tr.getAttribute("data-desc");

                document.getElementById("modalViewId").innerText = id;
                document.getElementById("modalViewName").innerText = name;
                document.getElementById("modalViewIcon").innerText = icon;
                document.getElementById("modalViewColor").innerText = color;
                document.getElementById("modalViewDesc").innerText = desc || "N/A";

                var modalEl = document.getElementById("viewCategoryModal");
                var modal = new bootstrap.Modal(modalEl);
                modal.show();
            };
        });

        // Edit Button Handler
        document.querySelectorAll(".btn-edit-cat").forEach(function (btn) {
            btn.onclick = function () {
                var tr = btn.closest("tr");
                var catId = tr.getAttribute("data-category-id");
                var name = tr.getAttribute("data-name");
                var icon = tr.getAttribute("data-icon");
                var color = tr.getAttribute("data-color");
                var desc = tr.getAttribute("data-desc");

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
        document.querySelectorAll(".btn-delete-cat").forEach(function (btn) {
            btn.onclick = function () {
                var tr = btn.closest("tr");
                var name = tr.getAttribute("data-name");
                var catId = tr.getAttribute("data-category-id");

                if (confirm("Are you sure you want to delete category '" + name + "'?")) {
                    var formData = new URLSearchParams();
                    formData.append("action", "delete");
                    formData.append("id", catId);

                    fetch("../Handlers/CategoryHandler.ashx", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: formData.toString()
                    })
                        .then(res => res.json())
                        .then(res => {
                            if (res.success) {
                                alert(res.message);
                                loadCategories();
                            } else {
                                alert("Error: " + res.message);
                            }
                        })
                        .catch(err => console.error("Error deleting category:", err));
                }
            };
        });
    }

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

            var formData = new URLSearchParams();
            formData.append("action", "update");
            formData.append("id", catId);
            formData.append("name", name);
            formData.append("icon", icon);
            formData.append("color", color);
            formData.append("description", desc);

            fetch("../Handlers/CategoryHandler.ashx", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        alert(res.message);
                        var modalEl = document.getElementById("editCategoryModal");
                        var modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                        loadCategories();
                    } else {
                        alert("Error: " + res.message);
                    }
                })
                .catch(err => console.error("Error updating category:", err));
        });
    }

    // Initial load
    loadCategories();
});

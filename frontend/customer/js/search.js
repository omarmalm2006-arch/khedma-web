
document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("search-keyword");
    const jobSelect = document.getElementById("job-select");
    const locationSelect = document.getElementById("location-select");
    const sortSelect = document.getElementById("sort-select");
    const applyButton = document.getElementById("apply-filters-btn");
    const resetButton = document.getElementById("reset-filters");
    const workersList = document.getElementById("workers-list");
    const countNumber = document.getElementById("count-number");

    const API_URL = "../../backend/customer/search.php";

    if (!searchInput || !jobSelect || !locationSelect || !sortSelect ||
        !applyButton || !resetButton || !workersList || !countNumber) {
        console.error("Search page: one or more required HTML elements are missing.");
        return;
    }

    let availableCategories = [];
    let availableLocations = [];

    const urlParams = new URLSearchParams(window.location.search);
    const selectedJob = urlParams.get("job");
    const initialSearch = urlParams.get("search");

    if (initialSearch) {
        searchInput.value = initialSearch;
    }

    function showMessage(message) {
        workersList.textContent = "";

        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        workersList.appendChild(paragraph);

        countNumber.textContent = "0";
    }

    function loadCategories() {
        availableCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            jobSelect.appendChild(option);
        });
    }

    function loadLocations() {
        availableLocations.forEach(location => {
            const option = document.createElement("option");
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
    }

    function selectJobFromUrl() {
        if (!selectedJob) {
            return false;
        }

        const normalizedJob = selectedJob.trim().toLocaleLowerCase("ar");

        const matchedCategory = availableCategories.find(category => {
            const categoryName = String(category.name || "")
                .trim()
                .toLocaleLowerCase("ar");

            return categoryName === normalizedJob ||
                categoryName.includes(normalizedJob) ||
                normalizedJob.includes(categoryName);
        });

        if (matchedCategory) {
            jobSelect.value = String(matchedCategory.id);
            return true;
        }

        // If the URL job does not match a category exactly, search it as text.
        if (!searchInput.value.trim()) {
            searchInput.value = selectedJob;
        }

        return true;
    }

    async function requestWorkers() {
        const params = new URLSearchParams();

        const search = searchInput.value.trim();
        const categoryId = jobSelect.value;
        const location = locationSelect.value;

        if (search) {
            params.append("search", search);
        }

        if (categoryId !== "all") {
            params.append("category_id", categoryId);
        }

        if (location !== "all") {
            params.append("location", location);
        }

        params.append("sort", sortSelect.value);

        const response = await fetch(`${API_URL}?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "حدث خطأ أثناء تحميل الفنيين.");
        }

        return data;
    }

    function createWorkerCard(worker) {
        const card = document.createElement("article");
        card.className = "search-worker-card";

        const cardTop = document.createElement("div");
        cardTop.className = "card-top";

        const priceTag = document.createElement("span");
        priceTag.className = "price-tag";
        priceTag.append("يبدأ من ");

        const price = document.createElement("strong");
        price.textContent =
            worker.starting_price !== null &&
            worker.starting_price !== undefined &&
            worker.starting_price !== ""
                ? `${worker.starting_price} ج.م`
                : "غير محدد";

        priceTag.appendChild(price);
        cardTop.appendChild(priceTag);

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        if (worker.profile_image) {
            const image = document.createElement("img");
            image.src = worker.profile_image;
            image.alt = worker.full_name || "صورة الفني";
            image.onerror = function () {
                image.style.display = "none";
            };
            cardBody.appendChild(image);
        }

        const cardInfo = document.createElement("div");
        cardInfo.className = "card-info";

        const workerName = document.createElement("h3");
        workerName.textContent = worker.full_name || "اسم غير متاح";

        const workerJob = document.createElement("p");
        workerJob.className = "job-title";
        workerJob.textContent = worker.category_name || "المهنة غير محددة";

        const workerLocation = document.createElement("p");
        workerLocation.className = "location-text";

        const locationIcon = document.createElement("i");
        locationIcon.className = "fa-solid fa-location-dot";
        workerLocation.appendChild(locationIcon);
        workerLocation.append(" " + (worker.location || "غير محدد"));

        cardInfo.append(workerName, workerJob, workerLocation);
        cardBody.appendChild(cardInfo);

        const cardFooter = document.createElement("div");
        cardFooter.className = "card-footer";

        const detailsLink = document.createElement("a");
        detailsLink.className = "view-profile-btn";
        detailsLink.textContent = "عرض الملف";
        detailsLink.href =
            `worker-details.html?id=${encodeURIComponent(worker.id)}`;

        cardFooter.appendChild(detailsLink);
        card.append(cardTop, cardBody, cardFooter);

        return card;
    }

    function displayWorkers(workers) {
        workersList.textContent = "";

        const safeWorkers = Array.isArray(workers) ? workers : [];
        countNumber.textContent = String(safeWorkers.length);

        if (safeWorkers.length === 0) {
            showMessage("لا يوجد فنيون مطابقون لبحثك حاليًا.");
            return;
        }

        safeWorkers.forEach(worker => {
            workersList.appendChild(createWorkerCard(worker));
        });
    }

    async function loadWorkers() {
        workersList.textContent = "";

        const loadingMessage = document.createElement("p");
        loadingMessage.textContent = "جاري تحميل الفنيين...";
        workersList.appendChild(loadingMessage);

        try {
            const data = await requestWorkers();
            displayWorkers(data.workers);
        } catch (error) {
            console.error("Search error:", error);
            showMessage("تعذر تحميل الفنيين. تأكد من الاتصال بالخادم وحاول مرة أخرى.");
        }
    }

    async function initializeSearchPage() {
        try {
            // Fetch once to get the filter options from the backend.
            const initialData = await requestWorkers();

            availableCategories = initialData.filters?.categories || [];
            availableLocations = initialData.filters?.locations || [];

            loadCategories();
            loadLocations();

            const shouldReload = selectJobFromUrl();

            // If the URL contains a recognized job, fetch using its category ID.
            // Otherwise, the first response already contains the correct results.
            if (shouldReload) {
                await loadWorkers();
            } else {
                displayWorkers(initialData.workers);
            }

        } catch (error) {
            console.error("Search initialization error:", error);
            showMessage("تعذر تحميل بيانات البحث. تأكد من الاتصال بالخادم وحاول مرة أخرى.");
        }
    }

    applyButton.addEventListener("click", loadWorkers);

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            loadWorkers();
        }
    });

    jobSelect.addEventListener("change", loadWorkers);
    locationSelect.addEventListener("change", loadWorkers);
    sortSelect.addEventListener("change", loadWorkers);

    resetButton.addEventListener("click", function () {
        searchInput.value = "";
        jobSelect.value = "all";
        locationSelect.value = "all";
        sortSelect.value = "newest";
        loadWorkers();
    });

    initializeSearchPage();
});

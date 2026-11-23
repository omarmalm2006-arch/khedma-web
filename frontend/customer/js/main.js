
document.addEventListener("DOMContentLoaded", function () {

    const workersList = document.getElementById("home-workers-list");
    const searchInput = document.getElementById("hero-search-input");
    const searchButton = document.getElementById("hero-search-btn");

    const API_URL = "../../backend/customer/search.php";

    function showMessage(message) {
        workersList.textContent = "";

        const paragraph = document.createElement("p");
        paragraph.className = "home-workers-message";
        paragraph.textContent = message;

        workersList.appendChild(paragraph);
    }

    function createWorkerCard(worker) {
        const card = document.createElement("article");
        card.className = "worker-card";

        const cardHead = document.createElement("div");
        cardHead.className = "card-head";

        const priceText = document.createElement("span");
        priceText.className = "price-text";
        priceText.append("يبدأ من ");

        const price = document.createElement("strong");
        price.textContent = worker.starting_price !== null &&
                            worker.starting_price !== undefined &&
                            worker.starting_price !== ""
            ? `${worker.starting_price} ج.م`
            : "غير محدد";

        priceText.appendChild(price);
        cardHead.appendChild(priceText);

        const profile = document.createElement("div");
        profile.className = "card-profile";

        if (worker.profile_image) {
            const image = document.createElement("img");
            image.src = worker.profile_image;
            image.alt = worker.full_name || "صورة الفني";
            image.onerror = function () {
                const placeholder = createAvatar(worker.full_name);
                image.replaceWith(placeholder);
            };
            profile.appendChild(image);
        } else {
            profile.appendChild(createAvatar(worker.full_name));
        }

        const details = document.createElement("div");
        details.className = "profile-details";

        const name = document.createElement("h3");
        name.textContent = worker.full_name || "اسم غير متاح";

        const job = document.createElement("p");
        job.className = "job-tag";
        job.textContent = worker.category_name || "المهنة غير محددة";

        const location = document.createElement("p");
        location.className = "location-tag";

        const locationIcon = document.createElement("i");
        locationIcon.className = "fa-solid fa-location-dot";
        location.appendChild(locationIcon);
        location.append(" " + (worker.location || "المكان غير محدد"));

        details.append(name, job, location);
        profile.appendChild(details);

        const stats = document.createElement("div");
        stats.className = "card-stats";

        const experience = document.createElement("span");
        const experienceIcon = document.createElement("i");
        experienceIcon.className = "fa-solid fa-briefcase";
        experience.appendChild(experienceIcon);

        const years = worker.experience_years;
        experience.append(
            years !== null && years !== undefined && years !== ""
                ? ` ${years} سنة خبرة`
                : " الخبرة غير محددة"
        );

        stats.appendChild(experience);

        const action = document.createElement("div");
        action.className = "card-action";

        const detailsLink = document.createElement("a");
        detailsLink.className = "profile-link";
        detailsLink.textContent = "عرض الملف ←";
        detailsLink.href = `worker-details.html?id=${encodeURIComponent(worker.id)}`;

        action.appendChild(detailsLink);

        card.append(cardHead, profile, stats, action);
        return card;
    }

    function createAvatar(fullName) {
        const avatar = document.createElement("div");
        avatar.className = "worker-avatar-placeholder";
        avatar.setAttribute("aria-label", "صورة غير متاحة");

        const firstLetter = (fullName || "؟").trim().charAt(0) || "؟";
        avatar.textContent = firstLetter;

        return avatar;
    }

    async function loadHomeWorkers() {
        showMessage("جاري تحميل الفنيين...");

        try {
            const response = await fetch(`${API_URL}?sort=newest`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "تعذر تحميل الفنيين.");
            }

            workersList.textContent = "";

            const workers = Array.isArray(data.workers) ? data.workers : [];

            if (workers.length === 0) {
                showMessage("لا يوجد فنيون معتمدون حاليًا. حاول مرة أخرى لاحقًا.");
                return;
            }

            workers.forEach(worker => {
                workersList.appendChild(createWorkerCard(worker));
            });

        } catch (error) {
            console.error("Homepage workers error:", error);
            showMessage("تعذر الاتصال بالخادم. تأكد من تشغيل السيرفر وحاول مرة أخرى.");
        }
    }

    function goToSearch() {
        const searchValue = searchInput.value.trim();
        const destination = searchValue
            ? `search.html?search=${encodeURIComponent(searchValue)}`
            : "search.html";

        window.location.href = destination;
    }

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", goToSearch);

        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                goToSearch();
            }
        });
    }

    if (workersList) {
        loadHomeWorkers();
    }
});

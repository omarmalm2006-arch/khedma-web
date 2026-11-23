
document.addEventListener("DOMContentLoaded", async function () {

    const urlParams = new URLSearchParams(window.location.search);
    const workerId = urlParams.get("id");

    if (!workerId || !/^\d+$/.test(workerId)) {
        document.querySelector(".worker-details-container").innerHTML =
            "<h2>رقم الفني غير صحيح.</h2>";
        return;
    }

    try {

        const response = await fetch(
            `../../backend/customer/worker-details.php?id=${encodeURIComponent(workerId)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "تعذر تحميل بيانات الفني.");
        }

        const worker = data.worker;

        // عنوان الصفحة
        document.title = `خدمة | تفاصيل الفني ${worker.full_name}`;

        // دالة لتحديث النصوص
        function setText(id, value) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = value ?? "";
            }
        }

        // بيانات الفني
        setText("worker-name", worker.full_name);
        setText("breadcrumb-name", worker.full_name);
        setText("worker-job", worker.category_name);
        setText("worker-location", worker.location);
        setText("worker-experience", worker.experience_years + " سنوات خبرة");
        setText("worker-price", worker.starting_price + " ج.م");
        setText("worker-phone", worker.phone);
        setText("worker-bio", worker.bio || "لا توجد نبذة متاحة حاليًا.");

        // صورة الفني
        const workerImage = document.getElementById("worker-img");

        if (workerImage && worker.profile_image) {
            workerImage.src = worker.profile_image;
        }

    } catch (error) {

        console.error("Worker details error:", error);

        document.querySelector(".worker-details-container").innerHTML =
            `<h2>${error.message}</h2>`;
    }

});

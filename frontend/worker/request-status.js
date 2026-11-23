
// إعدادات الحالات
const states = {
    pending: {
        color: "#f59e0b",
        dark: "#92400e",
        soft: "#fffbeb",
        icon: "⏳",
        badge: "قيد المراجعة",
        title: "طلبك قيد المراجعة",
        subtitle: "يقوم فريق الإدارة حاليًا بمراجعة بياناتك والمستندات المقدمة.",
        noticeTitle: "تنبيه مهم:",
        noticeText: "تم استلام طلبك بنجاح، وهو الآن في انتظار المراجعة. تستغرق عملية الموافقة عادةً من 12 إلى 24 ساعة. لن يظهر ملفك الشخصي للعملاء ضمن نتائج البحث كعامل معتمد حتى تتم الموافقة على طلبك رسميًا.",
        steps: [
            ["done", "✓", "تم تقديم الطلب", "تم الإرسال بنجاح", "#0866C6"],
            ["current", "⏱", "مراجعة الإدارة", "قيد المراجعة حاليًا", "#f59e0b"],
            ["wait", "⚑", "القرار النهائي", "في انتظار المراجعة", "#cbd5e1"]
        ],
        buttons: [
            ["تحديث الحالة", true, "refresh"],
            ["تعديل الطلب", false, "edit"]
        ]
    },

    approved: {
        color: "#10b981",
        dark: "#065f46",
        soft: "#ecfdf5",
        icon: "✓",
        badge: "تمت الموافقة",
        title: "تهانينا! تمت الموافقة على طلبك",
        subtitle: "تم اعتماد حسابك وأصبح ظاهرًا في نتائج البحث.",
        noticeTitle: "حسابك نشط الآن:",
        noticeText: "وافقت الإدارة على طلبك بنجاح. يمكنك الآن الدخول إلى لوحة تحكم العامل، واستقبال طلبات العملاء، وتحديث معرض أعمالك في أي وقت.",
        steps: [
            ["done", "✓", "تم تقديم الطلب", "تم الإرسال بنجاح", "#0866C6"],
            ["done", "✓", "مراجعة الإدارة", "اكتملت المراجعة", "#10b981"],
            ["done", "✓", "تمت الموافقة", "أصبحت متاحًا للعملاء", "#10b981"]
        ],
        buttons: [
            ["الانتقال إلى لوحة تحكم العامل", true, "dashboard"]
        ]
    },

    rejected: {
        color: "#ef4444",
        dark: "#991b1b",
        soft: "#fef2f2",
        icon: "✕",
        badge: "مرفوض",
        title: "نأسف، لم تتم الموافقة على طلبك",
        subtitle: "يُرجى مراجعة ملاحظات الإدارة وتحديث المستندات المطلوبة.",
        noticeTitle: "سبب الرفض:",
        steps: [
            ["done", "✓", "تم تقديم الطلب", "تم الإرسال بنجاح", "#0866C6"],
            ["done", "✓", "مراجعة الإدارة", "اكتملت المراجعة", "#ef4444"],
            ["done", "✕", "تم رفض الطلب", "مطلوب اتخاذ إجراء", "#ef4444"]
        ],
        buttons: [
            ["إعادة التقديم وتحديث المستندات", true, "reapply"]
        ]
    }
};

// روابط الصفحات
const links = {
    dashboard: "worker-dashboard.html",
    reapply: "worker-register.html",
    edit: "worker-register.html"
};

// الوصول لعناصر HTML
const $ = (id) => document.getElementById(id);

// تحويل تاريخ قاعدة البيانات إلى صيغة مقروءة
function formatDate(dateString) {
    if (!dateString) return "غير متاح";

    const [datePart] = dateString.split(" ");
    const [year, month, day] = datePart.split("-");

    return `تاريخ التقديم: ${day}/${month}/${year}`;
}

// عرض حالة الطلب والبيانات الحقيقية
function showStatus(status, data) {
    const s = states[status];

    if (!s) {
        throw new Error("حالة الطلب غير معروفة: " + status);
    }

    // تغيير ألوان الصفحة
    const root = document.documentElement.style;

    root.setProperty("--accent", s.color);
    root.setProperty("--accent-dark", s.dark);
    root.setProperty("--accent-soft", s.soft);
    root.setProperty("--btn", s.color);
    root.setProperty("--banner-bg", s.soft);
    root.setProperty("--banner-text-color", s.dark);
    root.setProperty("--banner-icon-color", s.color);
    root.setProperty("--badge-bg", s.color);
    root.setProperty("--accent-color", s.color);

    // تحديث كلاس بطاقة الحالة
    const statusBox = document.querySelector(".status-box");

    if (statusBox) {
        statusBox.classList.remove("pending", "approved", "rejected");
        statusBox.classList.add(status);
    }

    // بيانات الحالة
    $("icon").textContent = s.icon;
    $("badge").textContent = s.badge;
    $("title").textContent = s.title;
    $("subtitle").textContent = s.subtitle;
    $("noticeTitle").textContent = s.noticeTitle;

    // ملاحظة الإدارة عند الرفض
    $("noticeText").textContent =
        status === "rejected"
            ? (data.admin_note || "لم يتم توضيح سبب الرفض. يُرجى التواصل مع الإدارة.")
            : s.noticeText;

    // بيانات الطلب من API
    $("reqNumber").textContent = "#" + data.request_number;
    $("date").textContent = formatDate(data.created_at);

    $("fName").textContent = data.name || "غير متاح";
    $("fJob").textContent = data.job || "غير محدد";
    $("fPhone").textContent = data.phone || "غير متاح";

    const location = [data.location, data.address_details]
        .filter(Boolean)
        .join(" - ");

    $("fRegion").textContent = location || "غير محدد";

    $("fExp").textContent =
        data.experience_years != null
            ? data.experience_years + " سنوات"
            : "غير محدد";

    $("fPrice").textContent =
        data.starting_price != null
            ? data.starting_price + " جنيه"
            : "غير محدد";

    // مراحل الطلب
    $("steps").innerHTML = s.steps.map(
        ([cls, mark, label, sub, color]) => `
            <div class="step ${cls}" style="--c:${color}">
                <div class="dot">${mark}</div>
                <b>${label}</b>
                <small>${sub}</small>
            </div>
        `
    ).join("");

    // الأزرار
    $("actions").innerHTML = "";

    s.buttons.forEach(([text, isMain, action]) => {
        const btn = document.createElement("button");

        btn.className = "btn" + (isMain ? " main" : "");
        btn.textContent = text;

        btn.onclick = () => {
            if (action === "refresh") {
                loadRequestStatus();
            } else if (links[action]) {
                location.href = links[action];
            }
        };

        $("actions").appendChild(btn);
    });
}

// جلب حالة الطلب من Backend
async function loadRequestStatus() {
    try {
        const response = await fetch(
            "../../backend/auth/get-request-status.php",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "تعذر تحميل بيانات الطلب.");
        }

        // عرض البيانات الحقيقية
        showStatus(result.data.status, result.data);

    } catch (error) {
        console.error("Request Status Error:", error);

        $("title").textContent = "تعذر تحميل حالة الطلب";
        $("subtitle").textContent =
            "حدثت مشكلة أثناء جلب بياناتك. حاول تحديث الصفحة مرة أخرى.";

        $("noticeTitle").textContent = "تنبيه:";
        $("noticeText").textContent = error.message;
    }
}

// تشغيل الصفحة
loadRequestStatus();

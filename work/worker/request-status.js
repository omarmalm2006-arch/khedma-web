
// بيانات الطلب (تجريبية)
const requestData = {
    number: "REQ-84920",
    date: "تاريخ التقديم: 10 نوفمبر 2026",
    name: " محمد احمد",
    job: "فني كهرباء",
    phone: "+20 101 234 5678",
    region: "القاهرة - مدينة نصر",
    experience: "6 سنوات",
    price: "150 جنيه",
    rejectReason: "صورة الرقم القومي غير واضحة. يُرجى رفع صور واضحة لأعمالك السابقة لاستكمال عملية المراجعة."
};

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
        noticeText: "",
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

// تغيير حالة الطلب
function showStatus(status) {
    const s = states[status];

    if (!s) return;

    // تغيير ألوان الصفحة حسب الحالة
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
        statusBox.classList.remove(
            "pending",
            "approved",
            "rejected"
        );

        statusBox.classList.add(status);
    }

    // تحديث البيانات
    $("icon").textContent = s.icon;
    $("badge").textContent = s.badge;
    $("title").textContent = s.title;
    $("subtitle").textContent = s.subtitle;

    $("noticeTitle").textContent = s.noticeTitle;

    $("noticeText").textContent =
        status === "rejected"
            ? requestData.rejectReason
            : s.noticeText;

    $("reqNumber").textContent = "#" + requestData.number;
    $("date").textContent = requestData.date;

    $("fName").textContent = requestData.name;
    $("fJob").textContent = requestData.job;
    $("fPhone").textContent = requestData.phone;
    $("fRegion").textContent = requestData.region;
    $("fExp").textContent = requestData.experience;
    $("fPrice").textContent = requestData.price;

    // تحديث مراحل الطلب
    $("steps").innerHTML = s.steps.map(
        ([cls, mark, label, sub, color]) => `
            <div class="step ${cls}" style="--c:${color}">
                <div class="dot">${mark}</div>
                <b>${label}</b>
                <small>${sub}</small>
            </div>
        `
    ).join("");

    // تحديث الأزرار
    $("actions").innerHTML = "";

    s.buttons.forEach(([text, isMain, action]) => {
        const btn = document.createElement("button");

        btn.className = "btn" + (isMain ? " main" : "");
        btn.textContent = text;

        btn.onclick = () => {
            if (action === "refresh") {
                location.reload();
            } else if (links[action]) {
                location.href = links[action];
            }
        };

        $("actions").appendChild(btn);
    });
}

// تغيير الحالة من القائمة
const statusSelect = $("statusSelect");

if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
        showStatus(e.target.value);
    });
}

// تشغيل الصفحة بالحالة الافتراضية
showStatus("pending");

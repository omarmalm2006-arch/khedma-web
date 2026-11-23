/* =========================================================
   Khedma - Login  (متظبط على login.php بتاع الباك إند)
========================================================= */

const CONFIG = {
  API_URL: "../../backend/auth/login.php",
  CSRF_URL: "../../backend/auth/csrf-token.php",
  SUCCESS_URL: "../index.html",
};

const form = document.getElementById("login-form");
const alertBox = document.getElementById("form-alert");
const submitBtn = form.querySelector(".submit-btn");

/* ---------- رسائل الباك إند (إنجليزي) -> عربي ---------- */
const SERVER_MSG = {
  "Email and password are required": "من فضلك اكتب البريد الإلكتروني وكلمة المرور.",
  "Invalid email format": "صيغة البريد الإلكتروني غير صحيحة.",
  "Invalid email or password": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Your account is not active": "حسابك لسه مش مفعّل أو متوقف حاليًا.",
  "Invalid security token. Refresh the page.": "انتهت صلاحية الجلسة الأمنية. حدّث الصفحة وحاول تاني.",
  "Something went wrong. Please try again later.": "حصلت مشكلة في السيرفر، حاول تاني.",
};

/* ---------- CSRF ----------
   login.php بيقرا التوكن من جسم الـ JSON (csrf_token) ويقارنه بالـ session،
   فلازم نجيبه من csrf-token.php بنفس الـ session (credentials: include). */
let csrfToken = "";
async function ensureCsrfToken(force = false) {
  if (csrfToken && !force) return csrfToken;
  csrfToken = "";
  try {
    const res = await fetch(CONFIG.CSRF_URL, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return "";
    const data = await res.json();
    csrfToken = data.csrf_token || "";
  } catch (e) {}
  return csrfToken;
}

function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = "form-alert " + type;
  alertBox.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertBox.hidden = true;

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  if (!email || !password) {
    showAlert("من فضلك اكتب البريد الإلكتروني وكلمة المرور.", "error");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("صيغة البريد الإلكتروني غير صحيحة.", "error");
    return;
  }

  submitBtn.disabled = true;
  try {
    const token = await ensureCsrfToken();
    if (!token) {
      showAlert("مقدرناش نجيب التوكن الأمني. حدّث الصفحة وحاول تاني.", "error");
      return;
    }

    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password, csrf_token: token }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data && data.success) {
      showAlert("تم تسجيل الدخول بنجاح.", "success");
      setTimeout(() => (location.href = CONFIG.SUCCESS_URL), 800);
      return;
    }

    if (res.status === 403) csrfToken = ""; // التوكن اتغيّر/انتهى، هنجيب واحد جديد في المحاولة الجاية
    showAlert(
      SERVER_MSG[data?.message] || (data && data.message) || "حصلت مشكلة، حاول تاني.",
      "error"
    );
  } catch (err) {
    showAlert("مشكلة في الاتصال بالسيرفر. اتأكد من النت وحاول تاني.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

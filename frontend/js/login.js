
/* =========================================================
   Khedma - Login
   Connected to backend/auth/login.php
========================================================= */

const CONFIG = {
  API_URL: "../../backend/auth/login.php",
  CSRF_URL: "../../backend/auth/csrf-token.php",
  SUCCESS_URL: "../index.html",
  WORKER_URL: "../worker/request-status.html",
};

const form = document.getElementById("login-form");
const alertBox = document.getElementById("form-alert");
const submitBtn = form.querySelector(".submit-btn");

/* ---------- Backend messages -> Arabic ---------- */

const SERVER_MSG = {
  "Email and password are required":
    "من فضلك اكتب البريد الإلكتروني وكلمة المرور.",

  "Invalid email format":
    "صيغة البريد الإلكتروني غير صحيحة.",

  "Invalid email or password":
    "البريد الإلكتروني أو كلمة المرور غير صحيحة.",

  "Your account is not active":
    "حسابك لسه مش مفعّل أو متوقف حاليًا.",

  "Worker profile not found":
    "ملف العامل غير موجود.",

  "Invalid security token. Refresh the page.":
    "انتهت صلاحية الجلسة الأمنية. حدّث الصفحة وحاول تاني.",

  "Something went wrong. Please try again later.":
    "حصلت مشكلة في السيرفر، حاول تاني.",
};

/* ---------- CSRF Token ---------- */

let csrfToken = "";

async function ensureCsrfToken(force = false) {
  if (csrfToken && !force) {
    return csrfToken;
  }

  csrfToken = "";

  try {
    const res = await fetch(CONFIG.CSRF_URL, {
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return "";
    }

    const data = await res.json();
    csrfToken = data.csrf_token || "";

  } catch (error) {
    console.error("CSRF Error:", error);
  }

  return csrfToken;
}

/* ---------- Show Alert ---------- */

function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = "form-alert " + type;
  alertBox.hidden = false;
}

/* ---------- Login Form ---------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  alertBox.hidden = true;

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  /* Validate required fields */

  if (!email || !password) {
    showAlert(
      "من فضلك اكتب البريد الإلكتروني وكلمة المرور.",
      "error"
    );
    return;
  }

  /* Validate email format */

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert(
      "صيغة البريد الإلكتروني غير صحيحة.",
      "error"
    );
    return;
  }

  submitBtn.disabled = true;

  try {
    /* Get CSRF Token */

    const token = await ensureCsrfToken();

    if (!token) {
      showAlert(
        "مقدرناش نجيب التوكن الأمني. حدّث الصفحة وحاول تاني.",
        "error"
      );
      return;
    }

    /* Send Login Request */

    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        csrf_token: token,
      }),
    });

    const data = await res.json().catch(() => null);

    /* Successful Login */

    if (res.ok && data && data.success) {
      showAlert(
        "تم تسجيل الدخول بنجاح.",
        "success"
      );

      const userRole = data.user?.role;

      let redirectUrl = CONFIG.SUCCESS_URL;

      /* Redirect Worker */

      if (userRole === "worker") {
        redirectUrl = CONFIG.WORKER_URL;
      }

      /* Redirect after success message */

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);

      return;
    }

    /* Handle Failed Login */

    if (res.status === 403) {
      csrfToken = "";
    }

    const errorMessage =
      SERVER_MSG[data?.message] ||
      data?.message ||
      "حصلت مشكلة، حاول تاني.";

    showAlert(errorMessage, "error");

  } catch (error) {
    console.error("Login Error:", error);

    showAlert(
      "مشكلة في الاتصال بالسيرفر. اتأكد من النت وحاول تاني.",
      "error"
    );

  } finally {
    submitBtn.disabled = false;
  }
});

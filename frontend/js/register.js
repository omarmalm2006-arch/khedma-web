const CONFIG = {
  API_URL: "../../backend/auth/register.php",
  CATEGORIES_URL: "../../backend/auth/categories.php",
  CSRF_URL: "../../backend/auth/csrf-token.php",
  SUCCESS_URL: "../index.html",
};

const form = document.getElementById("register-form");
const alertBox = document.getElementById("form-alert");
const submitBtn = document.getElementById("submit-btn");
const roleInput = document.getElementById("role");
const workerBox = document.getElementById("worker-fields");
const roleBtns = document.querySelectorAll(".role-btn");

const SERVER_MSG = {
  "Please fill in all required fields.": ["من فضلك املا كل الحقول المطلوبة."],
  "Name must be between 3 and 120 characters.": ["الاسم لازم يكون بين 3 و120 حرف.", "full_name"],
  "Please enter a valid email address.": ["البريد الإلكتروني غير صحيح.", "email"],
  "Please enter a valid phone number.": ["رقم الموبايل غير صحيح.", "phone"],
  "Password must be at least 8 characters.": ["كلمة المرور لازم تكون 8 حروف على الأقل.", "password"],
  "Password must contain letters and numbers.": ["كلمة المرور لازم تحتوي على حروف وأرقام.", "password"],
  "Passwords do not match.": ["كلمتا المرور غير متطابقتين.", "confirm_password"],
  "Invalid account type.": ["نوع الحساب غير صحيح."],
  "Please select a valid service category.": ["اختار التخصص.", "category_id"],
  "Selected category is not available.": ["التخصص ده غير متاح حاليًا.", "category_id"],
  "Please enter your location.": ["اكتب المنطقة / المحافظة.", "location"],
  "Invalid experience years.": ["سنين الخبرة غير صحيحة.", "experience_years"],
  "National ID is required for workers.": ["الرقم القومي مطلوب للفنيين.", "national_id"],
  "National ID must contain exactly 14 digits.": ["الرقم القومي لازم يكون 14 رقم.", "national_id"],
  "Bio is too long.": ["النبذة طويلة جدًا.", "bio"],
  "Invalid starting price.": ["السعر المبدئي غير صحيح.", "starting_price"],
  "Email, phone, or national ID is already registered.": ["الإيميل أو الموبايل أو الرقم القومي مسجّل قبل كده."],
  "Something went wrong. Please try again.": ["حصلت مشكلة في السيرفر، حاول تاني."],
  "Invalid security token. Refresh the page.": ["انتهت صلاحية الجلسة الأمنية. حدّث الصفحة وحاول تاني."],
  "Account created successfully.": ["تم إنشاء الحساب بنجاح."],
};

/* ---------- CSRF ----------
   register.php بيقرا التوكن من $_POST["csrf_token"] ويقارنه بـ $_SESSION،
   فلازم نجيبه من csrf-token.php بنفس الـ session (credentials: include) ونبعته كحقل في الفورم. */
let csrfToken = "";
async function ensureCsrfToken(force = false) {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta && meta.content) return (csrfToken = meta.content);
  if (csrfToken && !force) return csrfToken;
  csrfToken = "";
  try {
    const res = await fetch(CONFIG.CSRF_URL, { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return "";
    const text = (await res.text()).trim();
    try {
      const j = JSON.parse(text);
      csrfToken = j.csrf_token || j.token || j.csrfToken || (j.data && (j.data.csrf_token || j.data.token)) || "";
    } catch (e) {
      if (/^[A-Za-z0-9_\-]{16,}$/.test(text)) csrfToken = text; 
    }
  } catch (e) {}
  return csrfToken;
}

const ALLOWED_ROLES = ["customer", "worker"];

function setRole(role) {
  if (!ALLOWED_ROLES.includes(role)) role = "customer";
  roleInput.value = role;
  const isWorker = role === "worker";
  workerBox.hidden = !isWorker;
  workerBox.querySelectorAll("input, select, textarea").forEach((el) => (el.disabled = !isWorker));
  roleBtns.forEach((b) => b.classList.toggle("active", b.dataset.role === role));
  clearErrors();
  if (isWorker) loadCategories();
}
roleBtns.forEach((b) => b.addEventListener("click", () => setRole(b.dataset.role)));

/* ---------- التخصصات ---------- */
let categoriesLoaded = false;
async function loadCategories() {
  if (categoriesLoaded) return;
  const select = document.getElementById("category_id");
  try {
    const res = await fetch(CONFIG.CATEGORIES_URL, { headers: { Accept: "application/json" }, credentials: "include" });
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.categories || data.data || [];
    list.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name || c.title;
      select.appendChild(opt);
    });
    categoriesLoaded = list.length > 0;
  } catch (e) {
    showAlert("مقدرناش نحمّل قائمة التخصصات. حاول تاني.", "error");
  }
}

const RULES = {
  phone: /^\+?[0-9]{10,15}$/,
  password: /^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$/,
  nationalId: /^[0-9]{14}$/,
};

function setError(name, msg) {
  const field = form.elements[name]?.closest(".field");
  if (!field) return false;
  field.classList.add("invalid");
  field.querySelector(".error-msg").textContent = msg;
  return true;
}

function clearErrors() {
  alertBox.hidden = true;
  form.querySelectorAll(".field").forEach((f) => {
    f.classList.remove("invalid");
    f.querySelector(".error-msg").textContent = "";
  });
}

function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = "form-alert " + type;
  alertBox.hidden = false;
}

const cleanPhone = () => form.elements.phone.value.replace(/[\s-]/g, "");

function validate() {
  const errors = {};
  const v = (n) => (form.elements[n]?.value || "").trim();
  const role = roleInput.value;
  const pass = form.elements.password.value;

  if (!ALLOWED_ROLES.includes(role)) errors.role = "نوع الحساب غير صحيح";

  if (!v("full_name")) errors.full_name = "الاسم مطلوب";
  else if (v("full_name").length < 3 || v("full_name").length > 120) errors.full_name = "الاسم بين 3 و120 حرف";

  if (!v("email")) errors.email = "البريد الإلكتروني مطلوب";
  else if (v("email").length > 190 || !form.elements.email.validity.valid) errors.email = "البريد الإلكتروني غير صحيح";

  if (!v("phone")) errors.phone = "رقم الموبايل مطلوب";
  else if (!RULES.phone.test(cleanPhone())) errors.phone = "رقم الموبايل غير صحيح (10 لـ 15 رقم)";

  if (!pass) errors.password = "كلمة المرور مطلوبة";
  else if (!RULES.password.test(pass)) errors.password = "8 حروف على الأقل وفيها حروف وأرقام";

  if (!form.elements.confirm_password.value) errors.confirm_password = "تأكيد كلمة المرور مطلوب";
  else if (form.elements.confirm_password.value !== pass) errors.confirm_password = "كلمتا المرور غير متطابقتين";

  if (role === "worker") {
    if (!/^[1-9][0-9]*$/.test(v("category_id"))) errors.category_id = "اختار التخصص";

    if (!v("national_id")) errors.national_id = "الرقم القومي مطلوب";
    else if (!RULES.nationalId.test(v("national_id"))) errors.national_id = "الرقم القومي لازم يكون 14 رقم";

    if (!v("location")) errors.location = "المنطقة مطلوبة";
    else if (v("location").length > 120) errors.location = "المنطقة طويلة جدًا (120 حرف كحد أقصى)";

    const exp = v("experience_years"); // الصفر مسموح
    if (exp === "") errors.experience_years = "سنين الخبرة مطلوبة";
    else if (!/^[0-9]+$/.test(exp) || Number(exp) > 80) errors.experience_years = "أدخل رقم من 0 لـ 80";

    if (v("bio").length > 10000) errors.bio = "النبذة طويلة جدًا";
  }
  return errors;
}

/* ---------- Submit ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const errors = validate();
  const names = Object.keys(errors);
  if (names.length) {
    names.forEach((n) => setError(n, errors[n]));
    form.elements[names[0]]?.focus();
    return;
  }

  // multipart/form-data (الباك إند بيقرا $_POST) — من غير Content-Type يدوي عشان المتصفح يحط الـ boundary
  const fd = new FormData(form);
  fd.set("phone", cleanPhone());
  fd.set("full_name", form.elements.full_name.value.trim());

  submitBtn.disabled = true;
  try {
    const token = await ensureCsrfToken();
    if (!token) {
      showAlert(". حدّث الصفحة وحاول تاني", "error");
      return;
    }
    fd.set("csrf_token", token);

    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      body: fd,
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => null);
    const [arMsg, arField] = SERVER_MSG[data?.message] || [];

    if (res.ok && data && data.success) {
      if (data.approval_status === "pending") {
        form.reset();
        setRole("customer"); 
        showAlert("تم استلام طلب انضمامك وهو قيد مراجعة الإدارة. هتقدر تسجّل دخول أول ما نوافق على حسابك.", "success");
      } else {
        showAlert(arMsg || "تم إنشاء الحساب بنجاح.", "success");
        setTimeout(() => (location.href = CONFIG.SUCCESS_URL), 1500);
      }
      return;
    }

    if (res.status === 403) csrfToken = "";
    if (arField) setError(arField, arMsg);
    showAlert(arMsg || (data && data.message) || "حصلت مشكلة، حاول تاني.", "error");
  } catch (err) {
    showAlert("مشكلة في الاتصال بالسيرفر. اتأكد من النت وحاول تاني.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

setRole("customer");
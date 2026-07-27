const STORAGE_KEY = "weiheDemoUser";
const PHONE_PATTERN = /^1\d{10}$/;

function setFieldError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (error) error.textContent = message;
}

function validateRequired(input, label) {
  const value = input.value.trim();
  if (!value) {
    setFieldError(input, `请输入${label}`);
    return false;
  }
  setFieldError(input, "");
  return true;
}

function validatePhone(input) {
  if (!validateRequired(input, "手机号")) return false;
  if (!PHONE_PATTERN.test(input.value.trim())) {
    setFieldError(input, "请输入以 1 开头的 11 位手机号");
    return false;
  }
  setFieldError(input, "");
  return true;
}

function validatePassword(input, label = "密码") {
  if (!validateRequired(input, label)) return false;
  if (input.value.length < 6) {
    setFieldError(input, `${label}至少需要 6 位`);
    return false;
  }
  setFieldError(input, "");
  return true;
}

function focusFirstInvalid(form) {
  form.querySelector('[aria-invalid="true"]')?.focus();
}

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function saveDemoProfile(nickname, phone) {
  const demoUser = {
    version: 1,
    profile: {
      nickname,
      phone: maskPhone(phone)
    },
    addressBook: [],
    defaultAddressId: null,
    createdAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    return true;
  } catch {
    return false;
  }
}

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.passwordToggle}`);
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.textContent = showPassword ? "隐藏" : "显示";
    button.setAttribute("aria-label", showPassword ? "隐藏密码" : "显示密码");
  });
});

document.querySelectorAll(".field input").forEach((input) => {
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") setFieldError(input, "");
  });
});

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  const phone = document.querySelector("#login-phone");
  const password = document.querySelector("#login-password");
  const status = document.querySelector("#login-status");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus(status, "");
    const phoneValid = validatePhone(phone);
    const passwordValid = validatePassword(password);

    if (!phoneValid || !passwordValid) {
      setStatus(status, "请检查表单中的提示后再试。", true);
      focusFirstInvalid(loginForm);
      return;
    }

    setStatus(status, "登录演示成功，即将返回首页。");
    window.setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  });
}

const registerForm = document.querySelector("#register-form");
if (registerForm) {
  const nickname = document.querySelector("#register-nickname");
  const phone = document.querySelector("#register-phone");
  const password = document.querySelector("#register-password");
  const confirmPassword = document.querySelector("#register-confirm-password");
  const status = document.querySelector("#register-status");

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus(status, "");

    let nicknameValid = validateRequired(nickname, "昵称");
    if (nicknameValid && (nickname.value.trim().length < 2 || nickname.value.trim().length > 20)) {
      setFieldError(nickname, "昵称长度应为 2–20 个字符");
      nicknameValid = false;
    }

    const phoneValid = validatePhone(phone);
    const passwordValid = validatePassword(password);
    let confirmValid = validatePassword(confirmPassword, "确认密码");
    if (confirmValid && confirmPassword.value !== password.value) {
      setFieldError(confirmPassword, "两次输入的密码不一致");
      confirmValid = false;
    }

    if (!nicknameValid || !phoneValid || !passwordValid || !confirmValid) {
      setStatus(status, "请检查表单中的提示后再试。", true);
      focusFirstInvalid(registerForm);
      return;
    }

    const stored = saveDemoProfile(nickname.value.trim(), phone.value.trim());
    setStatus(
      status,
      stored
        ? "演示账号已创建，本地仅保存昵称和脱敏手机号。"
        : "演示账号创建成功；浏览器存储不可用，本次不会保存资料。"
    );
    password.value = "";
    confirmPassword.value = "";
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 1100);
  });
}

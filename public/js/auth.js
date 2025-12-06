// ===== Authentication JavaScript =====

// تسجيل الدخول
async function login(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // نجح تسجيل الدخول
            window.location.href = '/';
        } else {
            // فشل تسجيل الدخول
            showError(data.error || 'حدث خطأ في تسجيل الدخول');
        }
    } catch (error) {
        showError('حدث خطأ في الاتصال بالسيرفر');
    }
}

// إنشاء حساب جديد
async function register(name, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // نجح إنشاء الحساب
            window.location.href = '/';
        } else {
            // فشل إنشاء الحساب
            showError(data.error || 'حدث خطأ في إنشاء الحساب');
        }
    } catch (error) {
        showError('حدث خطأ في الاتصال بالسيرفر');
    }
}

// عرض رسالة الخطأ
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// معالج نموذج تسجيل الدخول
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        await login(email, password);
    });
}

// معالج نموذج إنشاء الحساب
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!name || !email || !password || !confirmPassword) {
            showError('يرجى ملء جميع الحقول');
            return;
        }

        if (password.length < 6) {
            showError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
            return;
        }

        if (password !== confirmPassword) {
            showError('كلمات المرور غير متطابقة');
            return;
        }

        await register(name, email, password);
    });
}


// ===== Main JavaScript =====

// التحقق من حالة تسجيل الدخول
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const user = await response.json();
            updateUserMenu(user);
            return user;
        } else {
            hideUserMenu();
            return null;
        }
    } catch (error) {
        hideUserMenu();
        return null;
    }
}

// تحديث قائمة المستخدم
function updateUserMenu(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');

    if (authButtons && userMenu && userName) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = user.name;
    }
}

// إخفاء قائمة المستخدم
function hideUserMenu() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');

    if (authButtons && userMenu) {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// تسجيل الخروج
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
}

// تحميل الإحصائيات
async function loadStats() {
    try {
        const [lessonsRes, quizRes, usersRes] = await Promise.all([
            fetch('/api/lessons'),
            fetch('/api/quiz'),
            fetch('/api/users')
        ]);

        const lessons = await lessonsRes.json();
        const quiz = await quizRes.json();
        const users = usersRes.ok ? await usersRes.json() : [];

        const lessonsCount = document.getElementById('lessons-count');
        const quizCount = document.getElementById('quiz-count');
        const usersCount = document.getElementById('users-count');

        if (lessonsCount) lessonsCount.textContent = lessons.length || 0;
        if (quizCount) quizCount.textContent = quiz.length || 0;
        if (usersCount) usersCount.textContent = users.length || 0;
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// إدارة قائمة الهامبرجر
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    const navOverlay = document.getElementById('nav-overlay');

    if (!hamburgerBtn || !navLinks) return;

    function toggleMenu() {
        hamburgerBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
        if (navOverlay) {
            navOverlay.classList.toggle('active');
        }
        // منع التمرير عند فتح القائمة
        if (navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    hamburgerBtn.addEventListener('click', toggleMenu);

    if (navOverlay) {
        navOverlay.addEventListener('click', toggleMenu);
    }

    // إغلاق القائمة عند النقر على رابط
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                hamburgerBtn.classList.remove('active');
                navLinks.classList.remove('active');
                if (navOverlay) {
                    navOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            }
        });
    });
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // إدارة قائمة الهامبرجر
    initHamburgerMenu();

    // التحقق من تسجيل الدخول
    checkAuth();

    // تحميل الإحصائيات للصفحة الرئيسية
    if (document.getElementById('lessons-count')) {
        loadStats();
    }

    // إضافة مستمع لتسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});


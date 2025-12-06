// ===== Lessons JavaScript =====

let lessons = [];

// تحميل الدروس
async function loadLessons() {
    try {
        const response = await fetch('/api/lessons');
        lessons = await response.json();
        await displayLessons();
    } catch (error) {
        console.error('خطأ في تحميل الدروس:', error);
        document.getElementById('lessons-container').innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>حدث خطأ في تحميل الدروس</p>
            </div>
        `;
    }
}

// عرض الدروس
async function displayLessons() {
    const container = document.getElementById('lessons-container');
    
    // التحقق من حالة تسجيل الدخول
    let isLoggedIn = false;
    try {
        const userResponse = await fetch('/api/user');
        isLoggedIn = userResponse.ok;
    } catch (error) {
        isLoggedIn = false;
    }
    
    if (!lessons || lessons.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-book"></i>
                <p>لا توجد دروس متاحة حالياً</p>
            </div>
        `;
        return;
    }

    // فصل الدروس العادية والمميزة
    const regularLessons = lessons.filter(l => !l.isPremium);
    const premiumLessons = lessons.filter(l => l.isPremium);

    let html = '';

    // عرض الدروس العادية
    if (regularLessons.length > 0) {
        html += regularLessons.map(lesson => `
            <div class="lesson-card animate__animated animate__fadeInUp" onclick="openLesson('${lesson.id}')">
                <div class="lesson-image">
                    ${lesson.image ? `<img src="${lesson.image}" alt="${lesson.title}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-shield-alt"></i>'}
                </div>
                <div class="lesson-content">
                    <span class="lesson-category">${lesson.category || 'عام'}</span>
                    <h3 class="lesson-title">${lesson.title}</h3>
                    <p class="lesson-description">${lesson.description || ''}</p>
                    <div class="lesson-footer">
                        <a href="#" class="lesson-btn" onclick="event.stopPropagation(); openLesson('${lesson.id}')">
                            اقرأ المزيد <i class="fas fa-arrow-left"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // عرض الدروس المميزة (للمستخدمين المسجلين فقط)
    if (premiumLessons.length > 0) {
        if (!isLoggedIn) {
            html += `
                <div class="premium-section">
                    <div class="premium-header">
                        <i class="fas fa-crown"></i>
                        <h2>دروس مميزة</h2>
                        <p>سجل دخولك للوصول إلى دروس إضافية حصرية</p>
                        <a href="/login" class="btn btn-primary">تسجيل الدخول</a>
                    </div>
                </div>
            `;
        } else {
            html += premiumLessons.map(lesson => `
                <div class="lesson-card premium-lesson animate__animated animate__fadeInUp" onclick="openLesson('${lesson.id}')">
                    <div class="premium-badge">
                        <i class="fas fa-crown"></i>
                        مميز
                    </div>
                    <div class="lesson-image">
                        ${lesson.image ? `<img src="${lesson.image}" alt="${lesson.title}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-shield-alt"></i>'}
                    </div>
                    <div class="lesson-content">
                        <span class="lesson-category">${lesson.category || 'عام'}</span>
                        <h3 class="lesson-title">${lesson.title}</h3>
                        <p class="lesson-description">${lesson.description || ''}</p>
                        <div class="lesson-footer">
                            <a href="#" class="lesson-btn" onclick="event.stopPropagation(); openLesson('${lesson.id}')">
                                اقرأ المزيد <i class="fas fa-arrow-left"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    container.innerHTML = html;
}

// إكمال درس
async function completeLesson(lessonId) {
    try {
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) return;

        const response = await fetch('/api/complete-lesson', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lessonId })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.totalPoints !== undefined) {
                showPointsNotification(20, data.totalPoints, data.newBadges || []);
            }
        }
    } catch (error) {
        console.error('خطأ في إكمال الدرس:', error);
    }
}

// عرض إشعار النقاط
function showPointsNotification(pointsEarned, totalPoints, newBadges) {
    const notification = document.createElement('div');
    notification.className = 'points-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-star"></i>
            <div>
                <strong>حصلت على ${pointsEarned} نقطة!</strong>
                ${newBadges.length > 0 ? `<p>🏆 ${newBadges.length} ميدالية جديدة!</p>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// فتح درس
function openLesson(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const modal = document.getElementById('lesson-modal');
    const content = document.getElementById('lesson-content');

    content.innerHTML = `
        <h2>${lesson.title}</h2>
        <div class="lesson-category" style="margin-bottom: 20px;">${lesson.category || 'عام'}</div>
        
        ${lesson.image ? `<img src="${lesson.image}" alt="${lesson.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; margin-bottom: 20px;">` : ''}
        
        ${lesson.video ? `
            <div style="margin-bottom: 20px;">
                <video controls style="width: 100%; border-radius: 10px;">
                    <source src="${lesson.video}" type="video/mp4">
                    متصفحك لا يدعم تشغيل الفيديو.
                </video>
            </div>
        ` : ''}
        
        ${lesson.audio ? `
            <div style="margin-bottom: 20px;">
                <audio controls style="width: 100%;">
                    <source src="${lesson.audio}" type="audio/mpeg">
                    متصفحك لا يدعم تشغيل الصوت.
                </audio>
            </div>
        ` : ''}
        
        <div style="line-height: 1.8; color: var(--text-light); margin-bottom: 20px;">
            ${lesson.content ? lesson.content.replace(/\n/g, '<br>') : lesson.description || ''}
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <button class="btn btn-primary" onclick="completeLesson('${lesson.id}')">
                <i class="fas fa-check"></i>
                أكملت هذا الدرس
            </button>
        </div>
    `;

    modal.style.display = 'block';
}

// إغلاق Modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('lesson-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // تحميل الدروس
    loadLessons();
});


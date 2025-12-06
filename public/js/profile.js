// ===== Profile JavaScript =====

let userPoints = null;
let userScores = [];
let notes = [];
let leaderboard = [];

// معلومات الميداليات
const badgesInfo = {
    'points_1000': { name: 'خبير النقاط', icon: 'fas fa-coins', color: '#FFD700' },
    'points_500': { name: 'جامع النقاط', icon: 'fas fa-coins', color: '#C0C0C0' },
    'points_100': { name: 'مبتدئ النقاط', icon: 'fas fa-coins', color: '#CD7F32' },
    'lessons_10': { name: 'خبير التعلم', icon: 'fas fa-graduation-cap', color: '#FFD700' },
    'lessons_5': { name: 'طالب مجتهد', icon: 'fas fa-book', color: '#C0C0C0' },
    'lessons_1': { name: 'متعلم جديد', icon: 'fas fa-book-open', color: '#CD7F32' },
    'quizzes_10': { name: 'خبير الاختبارات', icon: 'fas fa-brain', color: '#FFD700' },
    'quizzes_5': { name: 'مختبر نشط', icon: 'fas fa-question-circle', color: '#C0C0C0' },
    'quizzes_1': { name: 'مختبر مبتدئ', icon: 'fas fa-clipboard-check', color: '#CD7F32' },
    'perfect_5': { name: 'المثالي', icon: 'fas fa-star', color: '#FFD700' },
    'perfect_1': { name: 'نتيجة مثالية', icon: 'fas fa-check-circle', color: '#00ff88' }
};

// تحميل البيانات
async function loadProfileData() {
    try {
        // التحقق من تسجيل الدخول
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
            window.location.href = '/login';
            return;
        }

        const user = await userResponse.json();
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('user-name').textContent = user.name;

        // تحميل النقاط والميداليات
        const pointsResponse = await fetch('/api/points');
        if (pointsResponse.ok) {
            userPoints = await pointsResponse.json();
            displayPoints();
        }

        // تحميل النتائج
        const scoresResponse = await fetch('/api/scores');
        if (scoresResponse.ok) {
            userScores = await scoresResponse.json();
            displayStats();
        }

        // تحميل الملاحظات
        const notesResponse = await fetch('/api/notes');
        if (notesResponse.ok) {
            notes = await notesResponse.json();
            displayNotes();
        }

        // تحميل لوحة المتصدرين
        const leaderboardResponse = await fetch('/api/leaderboard');
        if (leaderboardResponse.ok) {
            leaderboard = await leaderboardResponse.json();
            displayLeaderboard();
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// عرض النقاط والميداليات
function displayPoints() {
    if (!userPoints) return;

    document.getElementById('total-points').textContent = userPoints.totalPoints || 0;
    document.getElementById('total-badges').textContent = (userPoints.badges || []).length;

    const badgesContainer = document.getElementById('badges-container');
    const badges = userPoints.badges || [];

    if (badges.length === 0) {
        badgesContainer.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد ميداليات بعد. استمر في التعلم!</p>';
        return;
    }

    badgesContainer.innerHTML = badges.map(badgeId => {
        const badge = badgesInfo[badgeId] || { name: badgeId, icon: 'fas fa-medal', color: '#00ff88' };
        return `
            <div class="badge-item" style="border-color: ${badge.color};">
                <i class="${badge.icon}" style="color: ${badge.color};"></i>
                <span>${badge.name}</span>
            </div>
        `;
    }).join('');
}

// عرض الإحصائيات
function displayStats() {
    if (!userPoints) return;

    document.getElementById('completed-lessons').textContent = (userPoints.completedLessons || []).length;
    document.getElementById('completed-quizzes').textContent = (userPoints.completedQuizzes || []).length;

    // أفضل نتيجة
    if (userScores.length > 0) {
        const bestScore = Math.max(...userScores.map(s => s.score || 0));
        document.getElementById('best-score').textContent = bestScore + '%';
    } else {
        document.getElementById('best-score').textContent = '0%';
    }
}

// عرض لوحة المتصدرين
function displayLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    
    if (leaderboard.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد بيانات متاحة</p>';
        return;
    }

    container.innerHTML = `
        <div class="leaderboard-list">
            ${leaderboard.map((user, index) => `
                <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                    <div class="rank">${index + 1}</div>
                    <div class="user-info">
                        <div class="user-name">${user.userName}</div>
                        <div class="user-stats">
                            ${user.totalPoints} نقطة | 
                            ${user.completedLessons} درس | 
                            ${user.completedQuizzes} اختبار
                        </div>
                    </div>
                    <div class="user-badges">
                        ${(user.badges || []).length} <i class="fas fa-medal"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// عرض الملاحظات
function displayNotes() {
    const container = document.getElementById('notes-container');
    
    if (notes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد ملاحظات. أضف ملاحظة جديدة!</p>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <h4>${note.title || 'بدون عنوان'}</h4>
                <div class="note-actions">
                    <button class="btn-icon-small" onclick="editNote('${note.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-small btn-danger" onclick="deleteNote('${note.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="note-content">${note.content || ''}</p>
            ${note.lesson ? `<div class="note-meta">الدرس: ${note.lesson}</div>` : ''}
            <div class="note-date">${new Date(note.createdAt).toLocaleDateString('ar-EG')}</div>
        </div>
    `).join('');
}

// إضافة ملاحظة
function addNote() {
    const modal = document.getElementById('note-modal');
    const form = document.getElementById('note-form');
    const title = document.getElementById('note-modal-title');

    title.textContent = 'إضافة ملاحظة';
    form.reset();
    document.getElementById('note-id').value = '';
    modal.style.display = 'block';
}

// تعديل ملاحظة
function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const modal = document.getElementById('note-modal');
    const form = document.getElementById('note-form');
    const title = document.getElementById('note-modal-title');

    title.textContent = 'تعديل الملاحظة';
    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-content').value = note.content || '';
    document.getElementById('note-lesson').value = note.lesson || '';

    modal.style.display = 'block';
}

// حذف ملاحظة
async function deleteNote(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;

    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadProfileData();
        } else {
            alert('حدث خطأ في حذف الملاحظة');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// حفظ ملاحظة
async function saveNote(e) {
    e.preventDefault();

    const id = document.getElementById('note-id').value;
    const noteData = {
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value,
        lesson: document.getElementById('note-lesson').value || null
    };

    try {
        const url = id ? `/api/notes/${id}` : '/api/notes';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData)
        });

        if (response.ok) {
            document.getElementById('note-modal').style.display = 'none';
            loadProfileData();
        } else {
            const data = await response.json();
            alert(data.error || 'حدث خطأ في حفظ الملاحظة');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();

    const addNoteBtn = document.getElementById('add-note-btn');
    const noteForm = document.getElementById('note-form');
    const cancelNoteBtn = document.getElementById('cancel-note-btn');
    const closeModal = document.querySelector('.close-modal');

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', addNote);
    }

    if (noteForm) {
        noteForm.addEventListener('submit', saveNote);
    }

    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', () => {
            document.getElementById('note-modal').style.display = 'none';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('note-modal').style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});


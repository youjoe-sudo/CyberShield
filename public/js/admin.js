// ===== Admin JavaScript =====

let currentUser = null;
let lessons = [];
let questions = [];
let quizzes = [];
let users = [];
let scores = [];

// التحقق من صلاحيات المدير
async function checkAdmin() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            currentUser = await response.json();
            if (!currentUser.isAdmin) {
                alert('ليس لديك صلاحيات للوصول إلى هذه الصفحة');
                window.location.href = '/';
                return false;
            }
            return true;
        } else {
            alert('يجب تسجيل الدخول أولاً');
            window.location.href = '/login';
            return false;
        }
    } catch (error) {
        console.error('خطأ في التحقق من الصلاحيات:', error);
        return false;
    }
}

// تحميل البيانات
async function loadData() {
    try {
        const [lessonsRes, quizRes, usersRes, scoresRes] = await Promise.all([
            fetch('/api/lessons'),
            fetch('/api/quiz'),
            fetch('/api/users'),
            fetch('/api/all-scores').catch(() => null)
        ]);

        lessons = await lessonsRes.json();
        const quizData = await quizRes.json();
        users = usersRes.ok ? await usersRes.json() : [];
        scores = scoresRes && scoresRes.ok ? await scoresRes.json() : [];

        // فصل الكويزات والأسئلة
        if (quizData.length > 0 && quizData[0].title) {
            // بنية كويزات متعددة
            quizzes = quizData;
            questions = [];
            quizzes.forEach(quiz => {
                if (quiz.questions) {
                    questions = questions.concat(quiz.questions);
                }
            });
        } else {
            // بنية أسئلة مباشرة (قديم)
            quizzes = [];
            questions = quizData;
        }

        displayLessons();
        displayQuizzes();
        displayQuestions();
        displayUsers();
        displayScores();
        updateQuizSelect();
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// عرض الدروس
function displayLessons() {
    const container = document.getElementById('lessons-list');
    if (!container) return;

    if (lessons.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد دروس</p>';
        return;
    }

    container.innerHTML = lessons.map(lesson => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">
                    ${lesson.title}
                    ${lesson.isPremium ? '<span style="color: var(--neon-green); margin-right: 10px;"><i class="fas fa-crown"></i> مميز</span>' : ''}
                </div>
                <div class="admin-item-meta">${lesson.category || 'عام'} - ${lesson.description || ''}</div>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary btn-icon" onclick="editLesson('${lesson.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteLesson('${lesson.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// عرض الكويزات
function displayQuizzes() {
    const container = document.getElementById('quizzes-list');
    if (!container) return;

    if (quizzes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد كويزات</p>';
        return;
    }

    container.innerHTML = quizzes.map(quiz => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">${quiz.title || 'كويز بدون عنوان'}</div>
                <div class="admin-item-meta">${quiz.description || ''} - عدد الأسئلة: ${quiz.questions ? quiz.questions.length : 0}</div>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary btn-icon" onclick="editQuiz('${quiz.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteQuiz('${quiz.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// عرض الأسئلة
function displayQuestions() {
    const container = document.getElementById('questions-list');
    if (!container) return;

    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد أسئلة</p>';
        return;
    }

    container.innerHTML = questions.map(question => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">${question.question || 'سؤال بدون نص'}</div>
                <div class="admin-item-meta">الإجابة الصحيحة: ${question[`option${question.correctAnswer}`] || ''}</div>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary btn-icon" onclick="editQuestion('${question.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteQuestion('${question.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// عرض النتائج
function displayScores() {
    const container = document.getElementById('scores-list');
    if (!container) return;

    if (scores.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا توجد نتائج</p>';
        return;
    }

    // ترتيب النتائج حسب التاريخ (الأحدث أولاً)
    const sortedScores = scores.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedScores.map(score => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">${score.userName || 'مستخدم غير معروف'}</div>
                <div class="admin-item-meta">
                    النتيجة: ${score.score || 0}% | 
                    صحيح: ${score.correct || 0} | 
                    خطأ: ${score.wrong || 0} | 
                    الإجمالي: ${score.total || 0} |
                    التاريخ: ${new Date(score.date).toLocaleDateString('ar-EG')}
                </div>
            </div>
        </div>
    `).join('');
}

// عرض المستخدمين
function displayUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-gray);">لا يوجد مستخدمون</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="admin-item">
            <div class="admin-item-content">
                <div class="admin-item-title">${user.name}</div>
                <div class="admin-item-meta">${user.email} ${user.isAdmin ? '- <span style="color: var(--neon-green);">مدير</span>' : ''}</div>
            </div>
        </div>
    `).join('');
}

// إضافة درس جديد
function addLesson() {
    const modal = document.getElementById('lesson-modal');
    const form = document.getElementById('lesson-form');
    const title = document.getElementById('lesson-modal-title');

    title.textContent = 'إضافة درس جديد';
    form.reset();
    document.getElementById('lesson-id').value = '';
    modal.style.display = 'block';
}

// تعديل درس
function editLesson(id) {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    const modal = document.getElementById('lesson-modal');
    const form = document.getElementById('lesson-form');
    const title = document.getElementById('lesson-modal-title');

    title.textContent = 'تعديل الدرس';
    document.getElementById('lesson-id').value = lesson.id;
    document.getElementById('lesson-title').value = lesson.title || '';
    document.getElementById('lesson-description').value = lesson.description || '';
    document.getElementById('lesson-content').value = lesson.content || '';
    document.getElementById('lesson-image').value = lesson.image || '';
    document.getElementById('lesson-video').value = lesson.video || '';
    document.getElementById('lesson-audio').value = lesson.audio || '';
    document.getElementById('lesson-category').value = lesson.category || '';
    document.getElementById('lesson-isPremium').checked = lesson.isPremium || false;

    modal.style.display = 'block';
}

// حذف درس
async function deleteLesson(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;

    try {
        const response = await fetch(`/api/lessons/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadData();
        } else {
            alert('حدث خطأ في حذف الدرس');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// إضافة كويز جديد
function addQuiz() {
    const modal = document.getElementById('quiz-modal');
    const form = document.getElementById('quiz-form');
    const title = document.getElementById('quiz-modal-title');

    title.textContent = 'إضافة كويز جديد';
    form.reset();
    document.getElementById('quiz-id').value = '';
    modal.style.display = 'block';
}

// تعديل كويز
function editQuiz(id) {
    const quiz = quizzes.find(q => q.id === id);
    if (!quiz) return;

    const modal = document.getElementById('quiz-modal');
    const form = document.getElementById('quiz-form');
    const title = document.getElementById('quiz-modal-title');

    title.textContent = 'تعديل الكويز';
    document.getElementById('quiz-id').value = quiz.id;
    document.getElementById('quiz-title').value = quiz.title || '';
    document.getElementById('quiz-description').value = quiz.description || '';
    document.getElementById('quiz-question-count').value = quiz.questions ? quiz.questions.length : 10;

    modal.style.display = 'block';
}

// حذف كويز
async function deleteQuiz(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الكويز؟ سيتم حذف جميع أسئلته أيضاً.')) return;

    try {
        // حذف الكويز من الملف
        const response = await fetch(`/api/quiz/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadData();
        } else {
            alert('حدث خطأ في حذف الكويز');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// حفظ كويز
async function saveQuiz(e) {
    e.preventDefault();

    const id = document.getElementById('quiz-id').value;
    const quizData = {
        title: document.getElementById('quiz-title').value,
        description: document.getElementById('quiz-description').value,
        questions: []
    };

    try {
        // حفظ الكويز (سيتم تحديث API ليدعم الكويزات)
        alert('ميزة الكويزات المتعددة قيد التطوير. استخدم الأسئلة العامة حالياً.');
        document.getElementById('quiz-modal').style.display = 'none';
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// تحديث قائمة الكويزات في select
function updateQuizSelect() {
    const select = document.getElementById('question-quiz-id');
    if (!select) return;

    select.innerHTML = '<option value="">كويز عام (قديم)</option>';
    quizzes.forEach(quiz => {
        const option = document.createElement('option');
        option.value = quiz.id;
        option.textContent = quiz.title || 'كويز بدون عنوان';
        select.appendChild(option);
    });
}

// إضافة سؤال جديد
function addQuestion() {
    const modal = document.getElementById('question-modal');
    const form = document.getElementById('question-form');
    const title = document.getElementById('question-modal-title');

    title.textContent = 'إضافة سؤال جديد';
    form.reset();
    document.getElementById('question-id').value = '';
    updateQuizSelect();
    modal.style.display = 'block';
}

// تعديل سؤال
function editQuestion(id) {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    const modal = document.getElementById('question-modal');
    const form = document.getElementById('question-form');
    const title = document.getElementById('question-modal-title');

    title.textContent = 'تعديل السؤال';
    document.getElementById('question-id').value = question.id;
    document.getElementById('question-text').value = question.question || '';
    document.getElementById('option1').value = question.option1 || '';
    document.getElementById('option2').value = question.option2 || '';
    document.getElementById('option3').value = question.option3 || '';
    document.getElementById('option4').value = question.option4 || '';
    document.getElementById('correct-answer').value = question.correctAnswer || '1';
    document.getElementById('question-explanation').value = question.explanation || '';

    modal.style.display = 'block';
}

// حذف سؤال
async function deleteQuestion(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

    try {
        const response = await fetch(`/api/quiz/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadData();
        } else {
            alert('حدث خطأ في حذف السؤال');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// حفظ درس
async function saveLesson(e) {
    e.preventDefault();

    const id = document.getElementById('lesson-id').value;
    const lessonData = {
        title: document.getElementById('lesson-title').value,
        description: document.getElementById('lesson-description').value,
        content: document.getElementById('lesson-content').value,
        image: document.getElementById('lesson-image').value,
        video: document.getElementById('lesson-video').value,
        audio: document.getElementById('lesson-audio').value,
        category: document.getElementById('lesson-category').value,
        isPremium: document.getElementById('lesson-isPremium').checked
    };

    try {
        const url = id ? `/api/lessons/${id}` : '/api/lessons';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lessonData)
        });

        if (response.ok) {
            document.getElementById('lesson-modal').style.display = 'none';
            loadData();
        } else {
            const data = await response.json();
            alert(data.error || 'حدث خطأ في حفظ الدرس');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// حفظ سؤال
async function saveQuestion(e) {
    e.preventDefault();

    const id = document.getElementById('question-id').value;
    const questionData = {
        question: document.getElementById('question-text').value,
        option1: document.getElementById('option1').value,
        option2: document.getElementById('option2').value,
        option3: document.getElementById('option3').value,
        option4: document.getElementById('option4').value,
        correctAnswer: parseInt(document.getElementById('correct-answer').value),
        explanation: document.getElementById('question-explanation').value
    };

    try {
        const url = id ? `/api/quiz/${id}` : '/api/quiz';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionData)
        });

        if (response.ok) {
            document.getElementById('question-modal').style.display = 'none';
            loadData();
        } else {
            const data = await response.json();
            alert(data.error || 'حدث خطأ في حفظ السؤال');
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالسيرفر');
    }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;

    // تحديث اسم المستخدم
    if (currentUser) {
        const userName = document.getElementById('user-name');
        if (userName) {
            userName.textContent = currentUser.name;
        }
    }

    // تحميل البيانات
    loadData();

    // التبويبات
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // إزالة active من جميع التبويبات والمحتوى
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // إضافة active للتبويب والمحتوى المحدد
            btn.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });

    // أزرار إضافة
    const addLessonBtn = document.getElementById('add-lesson-btn');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const addQuizBtn = document.getElementById('add-quiz-btn');

    if (addLessonBtn) {
        addLessonBtn.addEventListener('click', addLesson);
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestion);
    }

    if (addQuizBtn) {
        addQuizBtn.addEventListener('click', addQuiz);
    }

    // النماذج
    const lessonForm = document.getElementById('lesson-form');
    const questionForm = document.getElementById('question-form');
    const quizForm = document.getElementById('quiz-form');

    if (lessonForm) {
        lessonForm.addEventListener('submit', saveLesson);
    }

    if (questionForm) {
        questionForm.addEventListener('submit', saveQuestion);
    }

    if (quizForm) {
        quizForm.addEventListener('submit', saveQuiz);
    }

    // إغلاق Modals
    const closeBtns = document.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    const cancelLessonBtn = document.getElementById('cancel-lesson-btn');
    const cancelQuestionBtn = document.getElementById('cancel-question-btn');
    const cancelQuizBtn = document.getElementById('cancel-quiz-btn');

    if (cancelLessonBtn) {
        cancelLessonBtn.addEventListener('click', () => {
            document.getElementById('lesson-modal').style.display = 'none';
        });
    }

    if (cancelQuestionBtn) {
        cancelQuestionBtn.addEventListener('click', () => {
            document.getElementById('question-modal').style.display = 'none';
        });
    }

    if (cancelQuizBtn) {
        cancelQuizBtn.addEventListener('click', () => {
            document.getElementById('quiz-modal').style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});


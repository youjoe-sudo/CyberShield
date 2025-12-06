// ===== Quiz JavaScript =====

let questions = [];
let currentQuestion = 0;
let answers = {};
let quizStarted = false;

// تحميل الأسئلة
async function loadQuestions() {
    try {
        const response = await fetch('/api/quiz');
        questions = await response.json();
        
        // إذا كان هناك أكثر من 10 أسئلة، نأخذ 10 فقط بشكل عشوائي
        if (questions.length > 10) {
            questions = questions.sort(() => Math.random() - 0.5).slice(0, 10);
        }
        
        updateTotalQuestions();
    } catch (error) {
        console.error('خطأ في تحميل الأسئلة:', error);
    }
}

// تحديث عدد الأسئلة الإجمالي
function updateTotalQuestions() {
    const totalEl = document.getElementById('total-questions');
    if (totalEl) {
        totalEl.textContent = questions.length;
    }
}

// بدء الاختبار
function startQuiz() {
    if (questions.length === 0) {
        alert('لا توجد أسئلة متاحة حالياً');
        return;
    }

    quizStarted = true;
    currentQuestion = 0;
    answers = {};

    document.getElementById('quiz-start').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';

    displayQuestion();
}

// عرض السؤال الحالي
function displayQuestion() {
    if (currentQuestion >= questions.length) {
        submitQuiz();
        return;
    }

    const question = questions[currentQuestion];
    const container = document.getElementById('question-container');
    const progressFill = document.getElementById('progress-fill');
    const currentQuestionEl = document.getElementById('current-question');
    const totalQuestionsEl = document.getElementById('total-questions-display');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');

    // تحديث التقدم
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    progressFill.style.width = progress + '%';
    currentQuestionEl.textContent = currentQuestion + 1;
    totalQuestionsEl.textContent = questions.length;

    // عرض السؤال
    container.innerHTML = `
        <h3 class="question-text">${question.question}</h3>
        <ul class="options-list">
            ${[1, 2, 3, 4].map(num => `
                <li class="option-item">
                    <label class="option-label">
                        <input type="radio" name="answer" value="${num}" ${answers[currentQuestion] === num ? 'checked' : ''}>
                        <span>${question[`option${num}`] || ''}</span>
                    </label>
                </li>
            `).join('')}
        </ul>
    `;

    // تحديث الأزرار
    prevBtn.style.display = currentQuestion > 0 ? 'block' : 'none';
    nextBtn.style.display = currentQuestion < questions.length - 1 ? 'block' : 'none';
    submitBtn.style.display = currentQuestion === questions.length - 1 ? 'block' : 'none';

    // حفظ الإجابة عند التغيير
    const radioInputs = container.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            answers[currentQuestion] = parseInt(e.target.value);
        });
    });
}

// السؤال التالي
function nextQuestion() {
    // حفظ الإجابة الحالية
    const selected = document.querySelector('input[name="answer"]:checked');
    if (selected) {
        answers[currentQuestion] = parseInt(selected.value);
    }

    currentQuestion++;
    displayQuestion();
}

// السؤال السابق
function prevQuestion() {
    currentQuestion--;
    displayQuestion();
}

// إنهاء الاختبار
async function submitQuiz() {
    // حفظ الإجابة الأخيرة
    const selected = document.querySelector('input[name="answer"]:checked');
    if (selected) {
        answers[currentQuestion] = parseInt(selected.value);
    }

    // حساب النتيجة
    let correct = 0;
    let wrong = 0;

    questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correctAnswer;

        if (userAnswer === correctAnswer) {
            correct++;
        } else {
            wrong++;
        }
    });

    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    // حفظ النتيجة
    try {
        const userResponse = await fetch('/api/user');
        if (userResponse.ok) {
            const scoreResponse = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    score: percentage,
                    correct: correct,
                    wrong: wrong,
                    total: total
                })
            });

            if (scoreResponse.ok) {
                const scoreData = await scoreResponse.json();
                // عرض النقاط والميداليات الجديدة
                if (scoreData.pointsEarned > 0) {
                    showPointsNotification(scoreData.pointsEarned, scoreData.totalPoints, scoreData.newBadges || []);
                }
            }
        }
    } catch (error) {
        console.error('خطأ في حفظ النتيجة:', error);
    }

    // عرض النتائج
    displayResults(percentage, correct, wrong);
}

// عرض النتائج
function displayResults(percentage, correct, wrong) {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';

    document.getElementById('score-percentage').textContent = percentage;
    document.getElementById('correct-answers').textContent = correct;
    document.getElementById('wrong-answers').textContent = wrong;

    const resultMessage = document.getElementById('result-message');
    let message = '';
    let icon = '';

    if (percentage >= 90) {
        message = 'ممتاز! أنت خبير في الأمن السيبراني 🎉';
        icon = 'fas fa-trophy';
    } else if (percentage >= 70) {
        message = 'جيد جداً! لديك معرفة جيدة بالأمن السيبراني 👍';
        icon = 'fas fa-star';
    } else if (percentage >= 50) {
        message = 'ليس سيئاً! استمر في التعلم لتحسين معرفتك 📚';
        icon = 'fas fa-book';
    } else {
        message = 'استمر في المحاولة! التعلم يحتاج وقتاً 💪';
        icon = 'fas fa-redo';
    }

    resultMessage.innerHTML = `
        <i class="${icon}"></i>
        <p style="margin-top: 10px;">${message}</p>
    `;
}

// عرض إشعار النقاط
function showPointsNotification(pointsEarned, totalPoints, newBadges) {
    let message = `🎉 لقد حصلت على ${pointsEarned} نقطة! إجمالي النقاط: ${totalPoints}`;
    
    if (newBadges.length > 0) {
        message += `\n\n🏆 ميداليات جديدة:\n`;
        newBadges.forEach(badge => {
            message += `• ${badge}\n`;
        });
    }
    
    // إنشاء إشعار بصري
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

// إعادة المحاولة
function retryQuiz() {
    quizStarted = false;
    currentQuestion = 0;
    answers = {};

    document.getElementById('quiz-start').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'none';
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();

    const startBtn = document.getElementById('start-quiz-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');
    const retryBtn = document.getElementById('retry-btn');

    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', prevQuestion);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', submitQuiz);
    }

    if (retryBtn) {
        retryBtn.addEventListener('click', retryQuiz);
    }
});


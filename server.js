const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// استخدام Helmet للحماية
app.use(helmet({
  contentSecurityPolicy: false, // للسماح بالأنيميشن والموارد الخارجية
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: 'cybershield-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24 ساعة
}));

// مسارات ملفات JSON
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LESSONS_FILE = path.join(DATA_DIR, 'lessons.json');
const QUIZ_FILE = path.join(DATA_DIR, 'quiz.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const POINTS_FILE = path.join(DATA_DIR, 'points.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

// التأكد من وجود مجلد البيانات
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // إنشاء ملفات JSON الأولية
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(LESSONS_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(QUIZ_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(SCORES_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(POINTS_FILE, JSON.stringify([], null, 2));
    await fs.writeFile(NOTES_FILE, JSON.stringify([], null, 2));
  }
}

// Middleware للتحقق من تسجيل الدخول
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
}

// Middleware للتحقق من صلاحيات المدير
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'ليس لديك صلاحيات للوصول' });
  }
}

// Routes - API

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.isAdmin = user.isAdmin || false;

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        isAdmin: user.isAdmin || false 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// إنشاء حساب جديد
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;
    req.session.isAdmin = false;

    res.json({ 
      success: true, 
      user: { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// الحصول على معلومات المستخدم الحالي
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name,
        isAdmin: user.isAdmin || false 
      });
    } else {
      res.status(404).json({ error: 'المستخدم غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// الحصول على جميع الدروس
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = JSON.parse(await fs.readFile(LESSONS_FILE, 'utf8'));
    const isLoggedIn = !!req.session.userId;
    
    // إذا كان المستخدم مسجل دخول، أرسل جميع الدروس
    // إذا لم يكن مسجل دخول، أرسل فقط الدروس العادية (isPremium = false أو غير موجود)
    const filteredLessons = isLoggedIn 
      ? lessons 
      : lessons.filter(lesson => !lesson.isPremium);
    
    res.json(filteredLessons);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// إضافة درس جديد (مدير فقط)
app.post('/api/lessons', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lessons = JSON.parse(await fs.readFile(LESSONS_FILE, 'utf8'));
    const newLesson = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    lessons.push(newLesson);
    await fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2));
    res.json({ success: true, lesson: newLesson });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// تحديث درس
app.put('/api/lessons/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lessons = JSON.parse(await fs.readFile(LESSONS_FILE, 'utf8'));
    const index = lessons.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'الدرس غير موجود' });
    }
    lessons[index] = { ...lessons[index], ...req.body, updatedAt: new Date().toISOString() };
    await fs.writeFile(LESSONS_FILE, JSON.stringify(lessons, null, 2));
    res.json({ success: true, lesson: lessons[index] });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// حذف درس
app.delete('/api/lessons/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lessons = JSON.parse(await fs.readFile(LESSONS_FILE, 'utf8'));
    const filtered = lessons.filter(l => l.id !== req.params.id);
    await fs.writeFile(LESSONS_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// الحصول على أسئلة الاختبار
app.get('/api/quiz', async (req, res) => {
  try {
    const quiz = JSON.parse(await fs.readFile(QUIZ_FILE, 'utf8'));
    const quizId = req.query.quizId; // للحصول على كويز محدد
    
    if (quizId) {
      // إرجاع كويز محدد
      const selectedQuiz = quiz.find(q => q.id === quizId);
      if (selectedQuiz) {
        return res.json(selectedQuiz.questions || []);
      }
      return res.json([]);
    }
    
    // إرجاع قائمة الكويزات أو الأسئلة حسب البنية
    // إذا كانت البنية تحتوي على كويزات متعددة
    if (quiz.length > 0 && quiz[0].title) {
      // بنية كويزات متعددة
      res.json(quiz);
    } else {
      // بنية أسئلة مباشرة (للتوافق مع القديم)
      res.json(quiz);
    }
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// إضافة سؤال جديد (مدير فقط)
app.post('/api/quiz', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quiz = JSON.parse(await fs.readFile(QUIZ_FILE, 'utf8'));
    const newQuestion = {
      id: Date.now().toString(),
      ...req.body
    };
    quiz.push(newQuestion);
    await fs.writeFile(QUIZ_FILE, JSON.stringify(quiz, null, 2));
    res.json({ success: true, question: newQuestion });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// تحديث سؤال
app.put('/api/quiz/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quiz = JSON.parse(await fs.readFile(QUIZ_FILE, 'utf8'));
    const index = quiz.findIndex(q => q.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }
    quiz[index] = { ...quiz[index], ...req.body };
    await fs.writeFile(QUIZ_FILE, JSON.stringify(quiz, null, 2));
    res.json({ success: true, question: quiz[index] });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// حذف سؤال
app.delete('/api/quiz/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const quiz = JSON.parse(await fs.readFile(QUIZ_FILE, 'utf8'));
    const filtered = quiz.filter(q => q.id !== req.params.id);
    await fs.writeFile(QUIZ_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// حفظ نتيجة الاختبار
app.post('/api/scores', requireAuth, async (req, res) => {
  try {
    const scores = JSON.parse(await fs.readFile(SCORES_FILE, 'utf8'));
    const pointsData = JSON.parse(await fs.readFile(POINTS_FILE, 'utf8'));
    
    const newScore = {
      id: Date.now().toString(),
      userId: req.session.userId,
      ...req.body,
      date: new Date().toISOString()
    };
    scores.push(newScore);
    await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
    
    // إضافة النقاط
    let userPoints = pointsData.find(p => p.userId === req.session.userId);
    if (!userPoints) {
      userPoints = {
        userId: req.session.userId,
        totalPoints: 0,
        badges: [],
        completedLessons: [],
        completedQuizzes: []
      };
      pointsData.push(userPoints);
    }
    
    // نقاط الاختبار: 10 نقاط لكل إجابة صحيحة + 50 نقطة إضافية إذا كانت النتيجة 100%
    const pointsEarned = (newScore.correct || 0) * 10 + (newScore.score === 100 ? 50 : 0);
    userPoints.totalPoints = (userPoints.totalPoints || 0) + pointsEarned;
    
    // إضافة الاختبار للمكتملة
    if (!userPoints.completedQuizzes) userPoints.completedQuizzes = [];
    if (!userPoints.completedQuizzes.includes(newScore.id)) {
      userPoints.completedQuizzes.push(newScore.id);
    }
    
    // فحص الميداليات
    const badges = checkBadges(userPoints);
    userPoints.badges = badges;
    
    await fs.writeFile(POINTS_FILE, JSON.stringify(pointsData, null, 2));
    
    res.json({ 
      success: true, 
      score: newScore,
      pointsEarned: pointsEarned,
      totalPoints: userPoints.totalPoints,
      newBadges: badges.filter(b => !userPoints.badges.includes(b))
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// دالة فحص الميداليات
async function checkBadges(userPoints) {
  const badges = [...(userPoints.badges || [])];
  const totalPoints = userPoints.totalPoints || 0;
  const completedLessons = (userPoints.completedLessons || []).length;
  const completedQuizzes = (userPoints.completedQuizzes || []).length;
  
  // ميداليات النقاط
  if (totalPoints >= 1000 && !badges.includes('points_1000')) badges.push('points_1000');
  if (totalPoints >= 500 && !badges.includes('points_500')) badges.push('points_500');
  if (totalPoints >= 100 && !badges.includes('points_100')) badges.push('points_100');
  
  // ميداليات الدروس
  if (completedLessons >= 10 && !badges.includes('lessons_10')) badges.push('lessons_10');
  if (completedLessons >= 5 && !badges.includes('lessons_5')) badges.push('lessons_5');
  if (completedLessons >= 1 && !badges.includes('lessons_1')) badges.push('lessons_1');
  
  // ميداليات الاختبارات
  if (completedQuizzes >= 10 && !badges.includes('quizzes_10')) badges.push('quizzes_10');
  if (completedQuizzes >= 5 && !badges.includes('quizzes_5')) badges.push('quizzes_5');
  if (completedQuizzes >= 1 && !badges.includes('quizzes_1')) badges.push('quizzes_1');
  
  // ميدالية المثالي
  try {
    const scores = JSON.parse(await fs.readFile(SCORES_FILE, 'utf8'));
    const userScores = scores.filter(s => s.userId === userPoints.userId);
    const perfectScores = userScores.filter(s => s.score === 100).length;
    if (perfectScores >= 5 && !badges.includes('perfect_5')) badges.push('perfect_5');
    if (perfectScores >= 1 && !badges.includes('perfect_1')) badges.push('perfect_1');
  } catch (error) {
    // تجاهل الخطأ
  }
  
  return [...new Set(badges)]; // إزالة التكرارات
}

// الحصول على نتائج المستخدم
app.get('/api/scores', requireAuth, async (req, res) => {
  try {
    const scores = JSON.parse(await fs.readFile(SCORES_FILE, 'utf8'));
    const userScores = scores.filter(s => s.userId === req.session.userId);
    res.json(userScores);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// الحصول على جميع النتائج (للمدير فقط)
app.get('/api/all-scores', requireAuth, requireAdmin, async (req, res) => {
  try {
    const scores = JSON.parse(await fs.readFile(SCORES_FILE, 'utf8'));
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    
    // إضافة معلومات المستخدم لكل نتيجة
    const scoresWithUsers = scores.map(score => {
      const user = users.find(u => u.id === score.userId);
      return {
        ...score,
        userName: user ? user.name : 'مستخدم محذوف',
        userEmail: user ? user.email : ''
      };
    });
    
    res.json(scoresWithUsers);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// الحصول على جميع المستخدمين (مدير فقط)
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin || false,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// Routes - Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/lessons', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lessons.html'));
});

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quiz.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// APIs للنقاط والميداليات
app.get('/api/points', requireAuth, async (req, res) => {
  try {
    const pointsData = JSON.parse(await fs.readFile(POINTS_FILE, 'utf8'));
    const userPoints = pointsData.find(p => p.userId === req.session.userId) || {
      userId: req.session.userId,
      totalPoints: 0,
      badges: [],
      completedLessons: [],
      completedQuizzes: []
    };
    res.json(userPoints);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// إضافة نقاط عند إكمال درس
app.post('/api/complete-lesson', requireAuth, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const pointsData = JSON.parse(await fs.readFile(POINTS_FILE, 'utf8'));
    
    let userPoints = pointsData.find(p => p.userId === req.session.userId);
    if (!userPoints) {
      userPoints = {
        userId: req.session.userId,
        totalPoints: 0,
        badges: [],
        completedLessons: [],
        completedQuizzes: []
      };
      pointsData.push(userPoints);
    }
    
    // إضافة الدرس للمكتملة إذا لم يكن موجوداً
    if (!userPoints.completedLessons) userPoints.completedLessons = [];
    if (!userPoints.completedLessons.includes(lessonId)) {
      userPoints.completedLessons.push(lessonId);
      // إضافة 20 نقطة لكل درس مكتمل
      userPoints.totalPoints = (userPoints.totalPoints || 0) + 20;
    }
    
    // فحص الميداليات
    const oldBadges = [...(userPoints.badges || [])];
    const badges = await checkBadges(userPoints);
    userPoints.badges = badges;
    
    await fs.writeFile(POINTS_FILE, JSON.stringify(pointsData, null, 2));
    
    res.json({ 
      success: true,
      totalPoints: userPoints.totalPoints,
      newBadges: badges.filter(b => !oldBadges.includes(b))
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// لوحة المتصدرين
app.get('/api/leaderboard', async (req, res) => {
  try {
    const pointsData = JSON.parse(await fs.readFile(POINTS_FILE, 'utf8'));
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    
    const leaderboard = pointsData
      .map(p => {
        const user = users.find(u => u.id === p.userId);
        return {
          userId: p.userId,
          userName: user ? user.name : 'مستخدم محذوف',
          totalPoints: p.totalPoints || 0,
          badges: p.badges || [],
          completedLessons: (p.completedLessons || []).length,
          completedQuizzes: (p.completedQuizzes || []).length
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10); // أفضل 10
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// APIs للملاحظات الشخصية
app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const notes = JSON.parse(await fs.readFile(NOTES_FILE, 'utf8'));
    const userNotes = notes.filter(n => n.userId === req.session.userId);
    res.json(userNotes);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const notes = JSON.parse(await fs.readFile(NOTES_FILE, 'utf8'));
    const newNote = {
      id: Date.now().toString(),
      userId: req.session.userId,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    notes.push(newNote);
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
    res.json({ success: true, note: newNote });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

app.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const notes = JSON.parse(await fs.readFile(NOTES_FILE, 'utf8'));
    const index = notes.findIndex(n => n.id === req.params.id && n.userId === req.session.userId);
    if (index === -1) {
      return res.status(404).json({ error: 'الملاحظة غير موجودة' });
    }
    notes[index] = { ...notes[index], ...req.body, updatedAt: new Date().toISOString() };
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
    res.json({ success: true, note: notes[index] });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const notes = JSON.parse(await fs.readFile(NOTES_FILE, 'utf8'));
    const filtered = notes.filter(n => !(n.id === req.params.id && n.userId === req.session.userId));
    await fs.writeFile(NOTES_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// بدء السيرفر
ensureDataDir().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`🛡️ CyberShield جاهز للاستخدام!`);
  });
}).catch(console.error);


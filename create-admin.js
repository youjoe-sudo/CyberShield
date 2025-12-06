// ===== Script لإنشاء حساب مدير =====
// استخدم هذا الملف لإنشاء حساب مدير
// تشغيل: node create-admin.js

const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
    try {
        console.log('🛡️  إنشاء حساب مدير لـ CyberShield\n');
        
        const name = await question('أدخل اسم المدير: ');
        const email = await question('أدخل البريد الإلكتروني: ');
        const password = await question('أدخل كلمة المرور: ');
        
        if (!name || !email || !password) {
            console.log('❌ يجب ملء جميع الحقول');
            rl.close();
            return;
        }
        
        if (password.length < 6) {
            console.log('❌ يجب أن تكون كلمة المرور 6 أحرف على الأقل');
            rl.close();
            return;
        }
        
        const usersFile = path.join(__dirname, 'data', 'users.json');
        
        // قراءة المستخدمين الحاليين
        let users = [];
        try {
            const data = await fs.readFile(usersFile, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            // الملف غير موجود، سيتم إنشاؤه
        }
        
        // التحقق من وجود المستخدم
        if (users.find(u => u.email === email)) {
            console.log('❌ البريد الإلكتروني مستخدم بالفعل');
            rl.close();
            return;
        }
        
        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // إنشاء المستخدم الجديد
        const newAdmin = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: hashedPassword,
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        
        users.push(newAdmin);
        
        // حفظ المستخدمين
        await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
        
        console.log('\n✅ تم إنشاء حساب المدير بنجاح!');
        console.log(`📧 البريد الإلكتروني: ${email}`);
        console.log(`👤 الاسم: ${name}`);
        console.log('\nيمكنك الآن تسجيل الدخول باستخدام هذه البيانات.\n');
        
    } catch (error) {
        console.error('❌ حدث خطأ:', error.message);
    } finally {
        rl.close();
    }
}

createAdmin();


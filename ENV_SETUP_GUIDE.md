# 🔧 HƯỚNG DẪN CẤU HÌNH .ENV

## 📍 **1. TEST LOCAL (Đang dùng)**

### **Backend (.env trong quiz-backend/):**
```env
DATABASE_URL="postgresql://HoanBuCon:hoanbucon1235@localhost:5433/quiz_app?schema=public"
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
PORT=4000
```
✅ **KHÔNG CẦN SỬA GÌ** - Đã đúng!

### **Frontend (.env trong root/):**
```env
REACT_APP_API_BASE_URL=http://localhost:4000
```
✅ **ĐÃ SỬA XONG!**

---

## 🌐 **2. DEPLOY LÊN CPANEL**

### **A. Chuẩn bị Database trên cPanel:**
1. Vào **cPanel → MySQL Databases**
2. Tạo database mới: `your_db_name`
3. Tạo user: `your_db_user` với password mạnh
4. Gán quyền user cho database
5. Note lại: host (thường là `localhost`), port (thường là `3306`)

### **B. Backend (.env trong quiz-backend/):**
```env
# Database - Thay thế bằng thông tin thật
DATABASE_URL="postgresql://your_db_user:your_password@localhost:3306/your_db_name?schema=public"

NODE_ENV=production

# Domain thật của bạn
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# cPanel tự inject port
PORT=3000

# Tạo JWT secret mạnh (random string)
JWT_SECRET=abc123xyz789ChangeMeToRandomString456
```

### **C. Frontend (.env trong root/):**
```env
# URL backend thật trên hosting
REACT_APP_API_BASE_URL=https://yourdomain.com
```

### **D. Upload lên cPanel:**

#### **Cách 1: FTP/File Manager**
1. Zip toàn bộ project
2. Upload lên `/public_html/` hoặc `/home/username/`
3. Unzip
4. Tạo file `.env` theo mẫu bên trên
5. Chạy: `npm install --production`
6. Chạy: `npm run prisma:deploy` (migrate database)
7. Setup Node.js App trong cPanel

#### **Cách 2: Git (Recommend)**
```bash
# Trên server (SSH)
cd /home/username/
git clone your-repo-url quiz-app
cd quiz-app/quiz-backend
npm install --production
npm run prisma:deploy
```

### **E. Cấu trúc thư mục trên cPanel:**
```
/home/username/
  quiz-app/
    quiz-backend/          ← Backend Node.js app
      .env                 ← Config production
      public/
        uploads/
          images/          ← Ảnh sẽ lưu ở đây
    build/                 ← Frontend đã build
      index.html
      static/
```

### **F. Setup Node.js App trong cPanel:**
1. **cPanel → Setup Node.js App**
2. Application root: `/home/username/quiz-app/quiz-backend`
3. Application URL: `yourdomain.com` hoặc `api.yourdomain.com`
4. Application startup file: `index.js`
5. Node.js version: 18.x hoặc 20.x
6. Click **Start**

### **G. Serve Frontend:**
- Copy thư mục `build/` vào `/public_html/`
- Hoặc point domain vào `/quiz-app/build/`

---

## 📝 **TÓM TẮT NHANH:**

| Môi trường | Backend .env | Frontend .env |
|------------|--------------|---------------|
| **Local (Hiện tại)** | `PORT=4000`<br>`DATABASE_URL=localhost:5433` | `REACT_APP_API_BASE_URL=http://localhost:4000` |
| **cPanel Production** | `PORT=3000`<br>`DATABASE_URL=hosting_db`<br>`NODE_ENV=production`<br>`JWT_SECRET=...` | `REACT_APP_API_BASE_URL=https://yourdomain.com` |

---

## 🎯 **ĐỂ SWITCH:**

### **Local → Production:**
1. Sửa `quiz-backend/.env` theo template `.env.production.example`
2. Sửa `.env` (frontend) → `REACT_APP_API_BASE_URL=https://yourdomain.com`
3. Build frontend: `npm run build`
4. Deploy cả 2 lên cPanel

### **Production → Local:**
1. Git pull code về
2. Restore file `.env` local (đã backup)
3. `npm install`
4. `npm start`

---

## 🖼️ **BONUS: Ảnh sẽ được lưu:**

- **Local:** `D:\...\quiz-backend\public\uploads\images\photo-123.jpg`
- **cPanel:** `/home/username/quiz-app/quiz-backend/public/uploads/images/photo-123.jpg`

**URL truy cập:**
- **Local:** `http://localhost:4000/uploads/images/photo-123.jpg`
- **cPanel:** `https://yourdomain.com/uploads/images/photo-123.jpg`

---

## ✅ **CHECKLIST KHI DEPLOY:**

- [ ] Database đã tạo trên cPanel
- [ ] File `.env` đã điền đúng thông tin
- [ ] `npm install --production` đã chạy
- [ ] `npm run prisma:deploy` đã migrate DB
- [ ] Node.js App đã Start trong cPanel
- [ ] Frontend đã build và copy vào `public_html`
- [ ] Test upload ảnh → Check thư mục `public/uploads/images/`
- [ ] Test truy cập ảnh qua URL

# Quiz Website - Website Giải Bài Tập Trắc Nghiệm

## Mô tả dự án

Quiz Website là một ứng dụng web được xây dựng bằng ReactJS và Tailwind CSS, cung cấp nền tảng để tạo và làm bài trắc nghiệm trực tuyến. Website được thiết kế với giao diện hiện đại, hỗ trợ dark/light mode và responsive design.

## Tính năng chính

### 🏠 Trang chủ
- Hiển thị danh sách các lớp học công khai
- Thống kê nhanh về website
- Giao diện thân thiện với người dùng

### 📚 Lớp học
- Quản lý các lớp học của người dùng
- Danh sách bài kiểm tra trong từng lớp
- Thống kê học tập và tiến độ

### ➕ Tạo lớp
- Upload file tài liệu (.doc, .docx, .json, .txt)
- Hỗ trợ kéo thả file
- Xử lý file tự động để tạo câu hỏi trắc nghiệm

### 📖 Làm bài trắc nghiệm
- Giao diện làm bài với 3 loại câu hỏi:
  - Chọn một đáp án đúng
  - Chọn nhiều đáp án đúng
  - Điền đáp án
- Minimap hiển thị tiến độ làm bài
- Timer countdown
- Navigation giữa các câu hỏi

### 📁 Tài liệu
- Quản lý file tài liệu đã upload
- Download tài liệu
- Tạo lớp học từ tài liệu
- Thống kê dung lượng và số lượng file

### 🌙 Dark/Light Mode
- Chuyển đổi theme tự động
- Lưu trạng thái theme trong localStorage
- Giao diện nhất quán giữa các mode

## Công nghệ sử dụng

- **React 18** - Framework JavaScript
- **TypeScript** - Ngôn ngữ lập trình type-safe
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Routing cho SPA
- **Context API** - State management

## Cấu trúc dự án

```
src/
├── components/
│   └── Layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Layout.tsx
├── context/
│   └── ThemeContext.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── ClassesPage.tsx
│   ├── CreateClassPage.tsx
│   ├── DocumentsPage.tsx
│   └── QuizPage.tsx
├── types/
│   └── index.ts
├── App.tsx
└── index.css
```

## Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js (version 16 trở lên)
- npm hoặc yarn

### Cài đặt

1. Clone dự án:
```bash
git clone https://github.com/HoanBuCon/Quiz-Website-FE.git
cd quiz-website
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy dự án ở môi trường development:
```bash
npm start
```

4. Mở trình duyệt và truy cập: `http://localhost:3000`

### Build cho production

```bash
npm run build
```

## Cấu hình Tailwind CSS

Dự án đã được cấu hình sẵn Tailwind CSS với:
- Dark mode support
- Custom color palette
- Responsive design
- Custom components

## Tính năng nổi bật

### 🎨 Giao diện hiện đại
- Thiết kế clean và professional
- Responsive trên mọi thiết bị
- Animation mượt mà
- Loading states

### 🔄 State Management
- Context API cho theme management
- Local state cho các component
- Persistent theme preference

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints cho tablet và desktop
- Touch-friendly interface

### ⚡ Performance
- Lazy loading components
- Optimized bundle size
- Efficient re-renders

## Hướng dẫn sử dụng

### 1. Tạo lớp học mới
1. Vào trang "Tạo lớp"
2. Upload file tài liệu (.doc, .docx, .json, .txt)
3. Hệ thống sẽ tự động xử lý và tạo câu hỏi

### 2. Làm bài trắc nghiệm
1. Vào trang "Lớp học"
2. Chọn lớp học muốn tham gia
3. Click "Làm bài" để bắt đầu
4. Sử dụng minimap để điều hướng giữa các câu hỏi

### 3. Quản lý tài liệu
1. Vào trang "Tài liệu"
2. Upload, download hoặc xóa file
3. Tạo lớp học từ tài liệu có sẵn

## Tích hợp Backend

Dự án được thiết kế để dễ dàng tích hợp với backend:
- API endpoints được chuẩn bị sẵn
- TypeScript interfaces cho data models
- Error handling patterns
- Loading states cho async operations

## Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some DogshitFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

Dự án này được phát hành dưới MIT License.

## Liên hệ

Nếu có bất kỳ câu hỏi hoặc đề xuất nào, vui lòng tạo issue trên GitHub repository.

---

**Lưu ý**: Đây là phiên bản frontend của dự án. Backend API cần được phát triển riêng để hoàn thiện toàn bộ chức năng.

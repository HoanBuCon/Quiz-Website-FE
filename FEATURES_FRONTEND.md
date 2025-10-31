## Tính năng Frontend hiện có (Quiz Website)

### Tổng quan
- **Stack**: React 18 + TypeScript + React Router v7 + Tailwind CSS + Context API
- **UI/UX**: Responsive, Dark/Light mode, hiệu ứng hiện đại, skeleton loading
- **Lưu trữ cục bộ**: `localStorage` và `sessionStorage` cho lớp học, quiz, kết quả; hỗ trợ seed dữ liệu demo

### Điều hướng và Layout
- **Routes** (`src/App.tsx`):
  - `/` Trang chủ
  - `/classes` Lớp học
  - `/create` Tạo lớp
  - `/documents` Tài liệu
  - `/edit-quiz` Chỉnh sửa quiz
  - `/quiz/:quizId` Làm bài
  - `/results/:quizId` Kết quả
  - `/edit-class/:classId` Chỉnh sửa lớp (dùng `FixedLayout`, không scroll)
- **Layout**: `Layout` (Header/Footer cố định, nội dung cuộn) và `FixedLayout` (khung cố định cho trang chỉnh sửa lớp)
- **Header**: menu responsive, highlight route đang active, nút đổi theme, nút bật/tắt trình phát nhạc
- **Footer**: link thông tin, hỗ trợ, liên hệ; hiển thị bản quyền

### Trang chủ (`HomePage`)
- Hiển thị danh sách lớp công khai (mock), thống kê tổng lớp/quiz
- Dropdown chọn quiz khi lớp có nhiều bài; điều hướng nhanh vào quiz
- Seed các quiz demo vào `localStorage` để dùng xuyên trang
- Khối “Kho tài liệu học tập” với hình động 3D hover, mở liên kết LMS

### Lớp học của tôi (`ClassesPage`)
- Đọc `classrooms` và `quizzes` từ `localStorage`; hỗ trợ cả 2 format `quizIds` (legacy) và `quizzes` (mới)
- Danh sách lớp, số bài kiểm tra, ngày tạo; dropdown chọn quiz khi >1 bài
- Hành động theo lớp: vào làm bài, chỉnh sửa lớp, xóa lớp (xóa kèm quiz liên quan)
- Hành động theo quiz: làm bài, chỉnh sửa quiz, xóa quiz trong lớp
- Khối thống kê học tập (số lớp, số bài, tiến độ, điểm TB)

### Tạo lớp / nhập tài liệu (`CreateClassPage`)
- Chọn tạo lớp mới hoặc chọn lớp có sẵn (radio)
- Nhập tên/mô tả lớp (validation trước khi upload/tạo quiz)
- Tạo Quiz thủ công: điều hướng đến trang chỉnh sửa với dữ liệu rỗng
- Upload kéo-thả và chọn file; hỗ trợ `.txt`, `.json`, `.doc`, `.docx`
- Kiểm tra trùng tên file, hiển thị modal chọn “Ghi đè / Đổi tên / Hủy” (theme-aware)
- Parse tài liệu thành câu hỏi rồi chuyển sang trang chỉnh sửa quiz để xuất bản
- Preview định dạng chuẩn (ID, Câu X:, A./B./C./D., đánh dấu đáp án bằng *)

### Quản lý tài liệu (`DocumentsPage`)
- Danh sách tài liệu đã tải lên (tên, dung lượng, ngày, loại)
- Tải lên mới (kéo-thả/chọn file), kiểm tra trùng tên với modal xử lý
- Tải về tài liệu: hỗ trợ trả về file Word từ base64 và text thuần
- Xóa tài liệu
- Thống kê: số tài liệu, tổng dung lượng, số lớp/quiz, tài liệu mới nhất
- Tạo Quiz từ tài liệu: mở modal tạo lớp mới hoặc chọn lớp có sẵn rồi điều hướng sang chỉnh sửa quiz

### Chỉnh sửa Quiz (`EditQuizPage`)
- Nhận dữ liệu từ Upload/Manual hoặc từ trang tài liệu/lớp
- Biên tập câu hỏi: sửa nội dung, loại câu hỏi (chọn 1, nhiều, điền), đáp án đúng, giải thích
- Thêm/xóa đáp án; đảm bảo tối thiểu 2 đáp án cho trắc nghiệm; validation chi tiết trước khi xuất bản
- Kéo‑thả sắp xếp câu hỏi (dnd-kit); cập nhật Preview tức thời
- Thêm ảnh cho câu hỏi và từng đáp án: chọn file, kéo‑thả, dán từ clipboard; giới hạn kích thước, xem trước
- Khối Preview có thể chỉnh sửa văn bản theo chuẩn (ID/Câu/đáp án với *), tự parse ngược vào danh sách câu hỏi
- Xuất bản: lưu quiz vào `localStorage`, cập nhật/tạo `classrooms` phù hợp theo ngữ cảnh (tạo mới/thêm vào lớp)
- Hỗ trợ chế độ chỉnh sửa quiz đã có (update thay vì tạo mới)

### Làm bài trắc nghiệm (`QuizPage`)
- Tải quiz từ `localStorage` hoặc dữ liệu mock nếu không có
- Hỗ trợ 3 loại câu hỏi: chọn 1, chọn nhiều, điền đáp án (so khớp không phân biệt hoa thường/trim)
- Bộ đếm thời gian: 5 phút cho mỗi câu (tổng = số câu × 5 phút)
- Đánh dấu câu để xem lại; thanh tiến độ; danh sách câu bên phải để nhảy nhanh
- Hỗ trợ ảnh cho câu hỏi và từng đáp án (nếu có)
- Lưu câu trả lời trong state; nộp bài sẽ chấm điểm và lưu kết quả vào `sessionStorage`

### Kết quả làm bài (`ResultsPage`)
- Đọc kết quả từ `sessionStorage`; hiển thị điểm, phần trăm đúng, thời gian, số câu sai, thanh tiến độ
- Danh sách chi tiết từng câu: đáp án người dùng, đáp án đúng, trạng thái đúng/sai, giải thích (toggle hiện/ẩn)
- Hành động: Làm lại bài, về lớp học khác, về trang chủ

### Trình phát nhạc nền
- Trình phát nhạc nổi, toggle từ Header; giữ nguyên khi đổi route (được mount ngoài `Routes`)
- Danh sách track assets nội bộ; Play/Pause/Stop, Next/Prev, Random, Loop Queue/Track
- Giao diện timeline, thời lượng; toast thông báo trạng thái; lưu trạng thái phát qua `MusicContext`
- Tự động phát sau tương tác đầu tiên của người dùng; click outside/ESC để đóng hộp player

### Theme (Dark/Light)
- Quản lý bởi `ThemeContext`; lưu trạng thái vào `localStorage` (key: `theme`)
- Áp dụng `documentElement.classList` để bật dark mode Tailwind
- `Toaster` tùy chỉnh theo theme; toàn bộ UI có biến thể sáng/tối nhất quán

### Xử lý tài liệu và parser
- `.doc/.docx`: dùng `mammoth` để trích text, chuẩn hóa ký tự/whitespace/bullets
- Xác thực định dạng: `validateDocsFormat` + hướng dẫn lỗi chi tiết
- Parse chuẩn văn bản thành `ParsedQuestion[]`, tự suy luận loại câu hỏi theo số đáp án đúng

### Lưu trữ dữ liệu (không cần backend)
- `localStorage`:
  - `quizzes`: danh sách quiz đã xuất bản
  - `classrooms`: danh sách lớp học và liên kết quiz (hỗ trợ `quizIds` và `quizzes`)
  - `documents`: tài liệu đã tải lên (bao gồm content/base64)
  - `theme`: trạng thái giao diện
- `sessionStorage`: kết quả làm bài theo khóa `quiz-result-:quizId`

### Khả năng truy cập và Responsive
- Điều hướng bàn phím cho một số control (player, menu)
- Giao diện mobile/desktop tối ưu: menu di động, thẻ thông tin, lưới câu hỏi, card có shadow và hover states

### Hạn chế/ghi chú
- Backend là tùy chọn; project đã sẵn sàng tích hợp API nhưng mặc định chạy full local bằng `localStorage`
- File Word được lưu trữ dạng base64 khi upload; tải về chuyển lại blob đúng MIME
- Xóa lớp sẽ xóa quiz liên quan, nhưng không xóa tài liệu trong trang Tài liệu



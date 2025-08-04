# Tính năng Kiểm tra Duplicate File Names

## Mô tả
Tính năng này giúp người dùng xử lý các file có tên trùng nhau khi tải lên website Quiz. Khi upload một file có tên đã tồn tại, hệ thống sẽ đưa ra 2 lựa chọn:

1. **Ghi đè lên file cũ**: Thay thế hoàn toàn file cũ bằng file mới
2. **Đổi tên file mới**: Giữ nguyên file cũ và đổi tên file mới theo format `filename(1).ext`

## Cách hoạt động

### 1. Kiểm tra duplicate
- Hệ thống sẽ so sánh tên file mới với tất cả file đã có trong localStorage
- Nếu trùng tên, hiển thị modal cho người dùng chọn

### 2. Đề xuất tên mới
- Format: `originalname(số thứ tự).extension`
- Ví dụ: `document.txt` → `document(1).txt` → `document(2).txt`
- Hỗ trợ file không có extension: `README` → `README(1)`

### 3. Modal xác nhận
- Thiết kế responsive, hỗ trợ dark mode
- Có thể đóng bằng ESC hoặc click ngoài modal
- 3 lựa chọn: Ghi đè / Đổi tên / Hủy

## File được áp dụng

### DocumentsPage.tsx
- Trang quản lý tài liệu
- Kiểm tra duplicate khi upload file

### CreateClassPage.tsx  
- Trang tạo lớp học
- Kiểm tra duplicate khi upload file câu hỏi

## Các function chính

### `checkDuplicateFileName(fileName, existingFiles)`
- **Input**: Tên file, danh sách file hiện có
- **Output**: Object chứa thông tin duplicate và tên đề xuất

### `generateUniqueFileName(originalName, existingFiles)`
- **Input**: Tên file gốc, danh sách file hiện có  
- **Output**: Tên file duy nhất

### `showDuplicateModal(fileName, suggestedName)`
- **Input**: Tên file trùng, tên đề xuất
- **Output**: Promise với action được chọn

## Test cases

File `test-duplicate-files.js` chứa các test case:

1. ✅ File không trùng tên
2. ✅ File trùng tên → đề xuất `(2)`
3. ✅ File extension khác → không conflict
4. ✅ Generate unique name cho file trùng
5. ✅ File .docx trùng tên

## UI/UX Features

- **Visual indicators**: Icon warning, màu sắc phân biệt
- **Clear options**: Mô tả rõ ràng cho từng lựa chọn
- **Keyboard navigation**: Hỗ trợ ESC để hủy
- **Dark mode support**: Tự động detect theme hiện tại
- **Responsive design**: Hoạt động tốt trên mobile

## Cách sử dụng

1. **Upload file bình thường**
   - Chọn file từ input hoặc drag & drop
   - Nếu tên không trùng → upload ngay

2. **Khi có duplicate**
   - Modal xuất hiện với 2 lựa chọn
   - Click "Ghi đè" để thay thế file cũ
   - Click "Đổi tên" để giữ cả 2 file
   - Click "Hủy" để bỏ qua file này

3. **Kết quả**
   - File được lưu vào localStorage với tên được chọn
   - State của component được cập nhật
   - UI hiển thị file mới

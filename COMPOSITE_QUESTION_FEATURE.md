# Tính năng Câu hỏi Mẹ - Câu hỏi Con (Composite Questions)

## Tổng quan
Tính năng câu hỏi mẹ - câu hỏi con cho phép giáo viên tạo một câu hỏi chính (câu hỏi mẹ) chứa nhiều câu hỏi nhỏ hơn (câu hỏi con). Đây là định dạng câu hỏi phổ biến trong các bài thi, đặc biệt là bài thi đọc hiểu hoặc các bài tập có ngữ cảnh chung.

## Cấu trúc dữ liệu

### Question Type
```typescript
interface QuestionWithImages extends Question {
  id: string;
  question: string;  // Nội dung câu hỏi mẹ (ngữ cảnh chung)
  type: 'composite';
  subQuestions?: QuestionWithImages[];  // Mảng các câu hỏi con
  questionImage?: string;
  optionImages?: { [key: string]: string };
}
```

### Sub-Question Structure
Mỗi câu hỏi con có thể là:
- **Trắc nghiệm 1 đáp án** (`type: 'single'`)
- **Trắc nghiệm nhiều đáp án** (`type: 'multiple'`)
- **Tự luận** (`type: 'text'`)

Câu hỏi con KHÔNG thể là:
- Câu hỏi kéo thả (`drag`)
- Câu hỏi mẹ lồng nhau (`composite`)

## Tính năng đã triển khai

### 1. EditQuizPage - Trình soạn thảo câu hỏi

#### Tạo câu hỏi mẹ
1. Chọn loại câu hỏi: "Câu hỏi mẹ (nhiều câu con)"
2. Nhập nội dung câu hỏi mẹ (ngữ cảnh chung, đoạn văn, bài đọc...)
3. Thêm ảnh cho câu hỏi mẹ (tùy chọn)

#### Quản lý câu hỏi con
- **Thêm câu hỏi con**: Nhấn nút "Thêm câu hỏi con"
- **Xóa câu hỏi con**: Nhấn biểu tượng thùng rác ở góc phải mỗi câu
- **Chỉnh sửa câu hỏi con**:
  - Chọn loại câu hỏi (Chọn 1 / Chọn nhiều / Điền đáp án)
  - Nhập nội dung câu hỏi
  - Thêm đáp án (với trắc nghiệm)
  - Đánh dấu đáp án đúng
  - Thêm giải thích (tùy chọn)

#### Giao diện hiển thị
- Câu hỏi con được hiển thị trong các khung màu xám nổi bật
- Mỗi câu hỏi con có nhãn "Câu hỏi con 1", "Câu hỏi con 2"...
- Nút xóa riêng biệt cho từng câu hỏi con
- UI gọn gàng, dễ quản lý

### 2. QuizPage - Giao diện làm bài

#### Hiển thị câu hỏi mẹ
- Câu hỏi mẹ hiển thị ở đầu với nội dung ngữ cảnh chung
- Các câu hỏi con được liệt kê bên dưới với viền màu primary
- Mỗi câu hỏi con có:
  - Nhãn "Câu hỏi con 1", "Câu hỏi con 2"...
  - Badge hiển thị loại câu hỏi (Tự luận / Chọn 1 / Chọn nhiều)
  - Nội dung câu hỏi
  - Các đáp án (nếu là trắc nghiệm)

#### Trả lời câu hỏi
- Học sinh trả lời từng câu hỏi con độc lập
- Mỗi câu hỏi con được lưu riêng biệt trong `userAnswers`
- Hỗ trợ đầy đủ các loại câu hỏi con (single, multiple, text)

### 3. ResultsPage - Hiển thị kết quả

#### Đánh giá từng câu hỏi con
- Kết quả quiz tự động flatten các câu hỏi con
- Mỗi câu hỏi con được chấm điểm riêng biệt
- Hiển thị đầy đủ:
  - Câu trả lời của học sinh
  - Đáp án đúng
  - Trạng thái đúng/sai với màu sắc rõ ràng
  - Giải thích (nếu có)

### 4. Validation (Kiểm tra dữ liệu)

#### Khi xuất bản quiz
Hệ thống kiểm tra:
1. **Câu hỏi mẹ phải có ít nhất 1 câu hỏi con**
2. **Mỗi câu hỏi con phải có**:
   - Nội dung câu hỏi không rỗng
   - Với trắc nghiệm: ít nhất 2 đáp án
   - Với trắc nghiệm: ít nhất 1 đáp án đúng được chọn
   - Với tự luận: ít nhất 1 đáp án mẫu

#### Thông báo lỗi chi tiết
- Ví dụ: "Câu 3 - Câu con 2: Chưa có nội dung câu hỏi"
- Ví dụ: "Câu 5 - Câu con 1: Cần ít nhất 2 đáp án"

### 5. Preview Content

Câu hỏi mẹ được hiển thị trong preview với format:
```
ID: q-123456789
Câu 1: Đọc đoạn văn sau và trả lời các câu hỏi:
(Câu hỏi mẹ chứa 3 câu hỏi con)
  Câu con 1: What is the main idea?
    A. Option 1
    *B. Option 2
    C. Option 3
  Câu con 2: According to the passage...
    *A. Correct answer
    B. Wrong answer
  Câu con 3: Your opinion?
    Đáp án: Open answer
```

## Ví dụ sử dụng

### Ví dụ 1: Bài đọc hiểu tiếng Anh
**Câu hỏi mẹ**: "Read the following passage: [Đoạn văn tiếng Anh]"
**Câu hỏi con**:
1. What is the main idea of the passage? (Single choice)
2. Which statements are true according to the passage? (Multiple choice)
3. What is your opinion about...? (Text answer)

### Ví dụ 2: Bài toán có dữ liệu chung
**Câu hỏi mẹ**: "Cho hàm số f(x) = 2x² + 3x - 5"
**Câu hỏi con**:
1. Tính f(2) = ? (Text answer)
2. Đạo hàm của f(x) là? (Single choice)
3. Hàm số đồng biến trên khoảng nào? (Multiple choice)

### Ví dụ 3: Phân tích văn bản
**Câu hỏi mẹ**: "Đọc đoạn thơ sau: [Đoạn thơ]"
**Câu hỏi con**:
1. Biện pháp tu từ được sử dụng? (Multiple choice)
2. Chủ đề của đoạn thơ? (Single choice)
3. Cảm nhận của em về đoạn thơ? (Text answer)

## Ưu điểm

✅ **Tiết kiệm thời gian**: Không cần lặp lại ngữ cảnh cho mỗi câu hỏi
✅ **Tổ chức tốt hơn**: Nhóm các câu hỏi liên quan với nhau
✅ **Phù hợp với đề thi thực tế**: Giống format bài thi chuẩn
✅ **Linh hoạt**: Hỗ trợ nhiều loại câu hỏi con khác nhau
✅ **Chấm điểm chính xác**: Mỗi câu hỏi con được chấm riêng

## Hạn chế hiện tại

⚠️ Câu hỏi con không hỗ trợ:
- Câu hỏi kéo thả (drag)
- Câu hỏi mẹ lồng nhau (composite trong composite)
- Thêm ảnh cho câu hỏi con (có thể bổ sung sau)

## Kế hoạch mở rộng

🔮 **Tương lai có thể bổ sung**:
1. Hỗ trợ thêm ảnh cho câu hỏi con
2. Hỗ trợ câu hỏi kéo thả trong câu hỏi mẹ
3. Import/Export câu hỏi mẹ từ Word/Excel
4. Template câu hỏi mẹ có sẵn
5. Sao chép câu hỏi mẹ
6. Thống kê chi tiết theo từng câu hỏi con

## Ghi chú kỹ thuật

### Files đã chỉnh sửa:
1. **EditQuizPage.tsx**:
   - Thêm UI editor cho composite questions
   - Validation logic cho composite questions
   - Preview generation cho composite questions
   - Display component cho composite questions

2. **QuizPage.tsx**:
   - Render composite questions với styling đẹp
   - Handle user answers cho sub-questions
   - Support all sub-question types

3. **ResultsPage.tsx**:
   - Flatten composite questions để hiển thị kết quả
   - Individual scoring cho từng sub-question
   - (Đã có sẵn từ trước)

### Type Definitions:
- File: `src/types/index.ts`
- Interface: `Question` với `subQuestions?: Question[]`

### State Management:
- Sub-questions được lưu trong `question.subQuestions`
- User answers lưu riêng cho mỗi sub-question ID
- Validation kiểm tra đầy đủ parent và children

---

**Ngày hoàn thành**: 2025-11-02
**Version**: 1.0
**Status**: ✅ Production Ready

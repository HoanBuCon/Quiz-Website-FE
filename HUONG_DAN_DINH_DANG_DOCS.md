# Hướng dẫn định dạng file docs

## Định dạng chuẩn

File docs phải tuân theo định dạng sau:

```
ID: 1
Câu 1: Câu hỏi của bạn ở đây?
A. Đáp án A
B. Đáp án B
*C. Đáp án đúng (có dấu *)
D. Đáp án D

ID: 2
Câu 2: Câu hỏi tiếp theo?
*A. Đáp án đúng
B. Đáp án sai
C. Đáp án sai
```

## Quy tắc quan trọng

1. **Mỗi câu hỏi phải có ID**: Bắt đầu bằng `ID: [số]`
2. **Câu hỏi**: Bắt đầu bằng `Câu [số]: [nội dung câu hỏi]`
3. **Đáp án**: Bắt đầu bằng `[A-E]. [nội dung đáp án]`
4. **Đáp án đúng**: Thêm dấu `*` trước đáp án đúng (ví dụ: `*A. Đáp án đúng`)

## Các loại câu hỏi

### 1. Câu hỏi chọn 1 đáp án
```
ID: 1
Câu 1: Câu hỏi chọn 1 đáp án?
A. Đáp án A
*B. Đáp án đúng
C. Đáp án C
D. Đáp án D
```

### 2. Câu hỏi chọn nhiều đáp án
```
ID: 2
Câu 2: Câu hỏi chọn nhiều đáp án?
*A. Đáp án đúng 1
*B. Đáp án đúng 2
C. Đáp án sai
D. Đáp án sai
*E. Đáp án đúng 3
```

### 3. Câu hỏi điền đáp án
```
ID: 3
Câu 3: Câu hỏi điền đáp án - Hãy điền tên ngôn ngữ lập trình?
```

## Định dạng file hỗ trợ

### ✅ Hỗ trợ tốt
- **File .txt** - Khuyến nghị sử dụng
- **File .json** - Cho dữ liệu có cấu trúc
- **File .docx** - Hỗ trợ trực tiếp (mới)

### ⚠️ Hỗ trợ có điều kiện
- **File .doc** - Cần copy/paste vào .txt

## Cách sử dụng file Word

### Phương pháp 1: Upload trực tiếp (Khuyến nghị)
1. **Tạo file Word** với định dạng chuẩn
2. **Sử dụng font đơn giản** (Times New Roman, Arial)
3. **Không sử dụng bullet points**, chỉ dùng A. B. C. D.
4. **Không sử dụng màu sắc** hoặc định dạng phức tạp
5. **Upload trực tiếp** file .docx lên web

### Phương pháp 2: Copy và Paste (Dự phòng)
1. **Mở file Word** trong Microsoft Word
2. **Copy toàn bộ nội dung** (Ctrl+A, Ctrl+C)
3. **Tạo file text mới** (.txt) trong Notepad
4. **Paste nội dung** vào file text
5. **Lưu file** với định dạng UTF-8
6. **Upload file .txt** lên web

## Lưu ý cho file Word

- **Sử dụng font đơn giản**: Times New Roman, Arial
- **Không sử dụng bullet points**: Chỉ dùng A. B. C. D.
- **Không sử dụng màu sắc**: Text đen trắng
- **Không sử dụng định dạng phức tạp**: Bảng, hình ảnh
- **Đánh dấu đáp án đúng**: Thêm dấu * trước đáp án đúng

## Lưu ý

- Không có dấu `*` = đáp án sai
- Có dấu `*` = đáp án đúng
- Mỗi câu hỏi phải có ID riêng
- Có thể có nhiều đáp án đúng (chọn nhiều)
- Câu hỏi điền đáp án không cần đáp án A, B, C, D
- **File Word (.docx) hiện đã được hỗ trợ trực tiếp**

## File mẫu

Xem file `template-docs.txt` để có ví dụ hoàn chỉnh. 
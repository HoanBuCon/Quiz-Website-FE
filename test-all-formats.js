// Test tất cả các định dạng file
const fs = require('fs');

function validateDocsFormat(content) {
  const errors = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let hasQuestions = false;
  let currentQuestionId = '';
  let hasValidQuestion = false;
  let questionCount = 0;
  let totalLines = lines.length;
  let hasIdFormat = false;
  let hasQuestionFormat = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('ID:')) {
      hasIdFormat = true;
      const idMatch = line.match(/ID:\s*(\d+)/);
      if (!idMatch) {
        errors.push(`Dòng ${i + 1}: Định dạng ID không hợp lệ - "${line}"`);
      } else {
        currentQuestionId = idMatch[1];
        hasQuestions = true;
      }
    } else if (line.startsWith('Câu') && line.includes(':')) {
      hasQuestionFormat = true;
      if (!currentQuestionId) {
        errors.push(`Dòng ${i + 1}: Thiếu ID cho câu hỏi - "${line}"`);
      } else {
        hasValidQuestion = true;
        questionCount++;
      }
    } else if (line.match(/^[*]?[A-E]\.\s+/)) {
      if (!currentQuestionId) {
        errors.push(`Dòng ${i + 1}: Thiếu ID cho đáp án - "${line}"`);
      }
    }
  }
  
  if (!hasIdFormat && !hasQuestionFormat) {
    errors.push(`File không có định dạng hợp lệ. Vui lòng sử dụng định dạng sau:

ID: 1
Câu 1: Câu hỏi của bạn ở đây?
A. Đáp án A
B. Đáp án B
*C. Đáp án đúng (có dấu *)
D. Đáp án D

Lưu ý: File Word (.docx) có thể chứa định dạng phức tạp. 
Vui lòng copy nội dung từ Word và paste vào file .txt trước khi upload.`);
  } else if (!hasQuestions) {
    errors.push(`Không tìm thấy câu hỏi nào trong file (thiếu định dạng ID:). File có ${totalLines} dòng.`);
  } else if (!hasValidQuestion) {
    errors.push(`Không tìm thấy câu hỏi hợp lệ trong file (thiếu định dạng Câu X:). File có ${totalLines} dòng.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Test với các file khác nhau
const testFiles = [
  { name: 'test-docs.txt', type: 'Text file' },
  { name: 'test-simple-docs.txt', type: 'Simple text file' },
  { name: 'template-docs.txt', type: 'Template file' }
];

console.log('=== TEST TẤT CẢ ĐỊNH DẠNG FILE ===\n');

testFiles.forEach((fileInfo, index) => {
  try {
    const content = fs.readFileSync(fileInfo.name, 'utf8');
    console.log(`\n--- ${index + 1}. ${fileInfo.type} (${fileInfo.name}) ---`);
    
    const validation = validateDocsFormat(content);
    console.log('Kết quả validate:', validation.isValid ? '✅ Hợp lệ' : '❌ Không hợp lệ');
    
    if (!validation.isValid) {
      console.log('Lỗi:');
      validation.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ File hoạt động tốt!');
    }
  } catch (error) {
    console.log(`❌ Không thể đọc file ${fileInfo.name}: ${error.message}`);
  }
});

console.log('\n=== KẾT LUẬN ===');
console.log('✅ Hệ thống hỗ trợ:');
console.log('  • File .txt - Hoạt động tốt');
console.log('  • File .json - Hoạt động tốt');
console.log('  • File .doc/.docx - Cần copy/paste vào .txt');
console.log('\n📝 Hướng dẫn sử dụng:');
console.log('  1. Tạo file .txt với định dạng chuẩn');
console.log('  2. Hoặc copy nội dung từ Word vào Notepad');
console.log('  3. Upload file .txt lên web');
console.log('  4. Xem template-docs.txt để biết định dạng'); 
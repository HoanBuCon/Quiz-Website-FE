// Simple JS test for file utils
// Mock data for testing
const mockFiles = [
  {
    id: '1',
    name: 'test.txt',
    type: 'txt',
    size: 1024,
    uploadedAt: new Date(),
    content: 'Test content'
  },
  {
    id: '2', 
    name: 'document.docx',
    type: 'docs',
    size: 2048,
    uploadedAt: new Date(),
    content: 'Document content'
  },
  {
    id: '3',
    name: 'data.json',
    type: 'json', 
    size: 512,
    uploadedAt: new Date(),
    content: '{"test": true}'
  },
  {
    id: '4',
    name: 'test(1).txt',
    type: 'txt',
    size: 1024,
    uploadedAt: new Date(), 
    content: 'Test content 2'
  }
];

// Simple duplicate check function
function checkDuplicateFileName(fileName, existingFiles) {
  const existingFile = existingFiles.find(file => file.name === fileName);
  
  if (!existingFile) {
    return { isDuplicate: false };
  }

  // Generate suggested name
  const suggestedName = generateUniqueFileName(fileName, existingFiles);
  
  return {
    isDuplicate: true,
    existingFile,
    suggestedName
  };
}

// Generate unique filename function
function generateUniqueFileName(originalName, existingFiles) {
  const existingNames = existingFiles.map(file => file.name);
  
  if (!existingNames.includes(originalName)) {
    return originalName;
  }

  const lastDotIndex = originalName.lastIndexOf('.');
  const nameWithoutExtension = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
  const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

  let counter = 1;
  let newName = `${nameWithoutExtension}(${counter})${extension}`;

  while (existingNames.includes(newName)) {
    counter++;
    newName = `${nameWithoutExtension}(${counter})${extension}`;
  }

  return newName;
}

console.log('=== Testing File Duplicate Detection ===');

// Test 1: File không trùng
console.log('\n1. Testing non-duplicate file:');
const result1 = checkDuplicateFileName('newfile.txt', mockFiles);
console.log('Result:', result1);
console.log('Expected: isDuplicate = false');

// Test 2: File trùng tên
console.log('\n2. Testing duplicate file:');  
const result2 = checkDuplicateFileName('test.txt', mockFiles);
console.log('Result:', result2);
console.log('Expected: isDuplicate = true, suggestedName = test(2).txt');

// Test 3: Tạo tên unique cho file có extension khác
console.log('\n3. Testing generate unique name for different extension:');
const uniqueName1 = generateUniqueFileName('document.pdf', mockFiles);
console.log('Result:', uniqueName1);
console.log('Expected: document.pdf (no change)');

// Test 4: Tạo tên unique cho file trùng
console.log('\n4. Testing generate unique name for duplicate:');
const uniqueName2 = generateUniqueFileName('test.txt', mockFiles);  
console.log('Result:', uniqueName2);
console.log('Expected: test(2).txt');

// Test 5: File docx trùng
console.log('\n5. Testing duplicate docx file:');
const result5 = checkDuplicateFileName('document.docx', mockFiles);
console.log('Result:', result5);
console.log('Expected: isDuplicate = true, suggestedName = document(1).docx');

console.log('\n=== All tests completed ===');

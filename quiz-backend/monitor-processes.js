const { exec } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';
let previousCount = 0;
let warningCount = 0;
const THRESHOLD = 15; // Cảnh báo nếu > 15 node processes
const WARNING_LIMIT = 3; // Cảnh báo liên tiếp 3 lần = có vấn đề

function checkProcesses() {
  const cmd = isWindows 
    ? 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH'
    : 'ps aux | grep node | grep -v grep';

  exec(cmd, (err, stdout) => {
    if (err) {
      console.error('Error checking processes:', err.message);
      return;
    }

    const lines = stdout.trim().split('\n').filter(Boolean);
    const count = lines.length;
    
    const timestamp = new Date().toLocaleTimeString();
    const trend = count > previousCount ? 'Tăng' : count < previousCount ? 'Giảm' : 'Không đổi';

    console.log(`[${timestamp}] ${trend} Node processes: ${count}`);

    // Cảnh báo nếu tăng đột biến
    if (count > THRESHOLD) {
      warningCount++;
      console.warn(`WARNING: High process count (${count}). Check count: ${warningCount}/${WARNING_LIMIT}`);
      
      if (warningCount >= WARNING_LIMIT) {
        console.error('CRITICAL: Possible process leak detected!');
        console.error('Action: Kill all node processes and restart');
        
        if (isWindows) {
          console.log('Run: taskkill /F /IM node.exe');
        } else {
          console.log('Run: killall -9 node');
        }
        
        // Optional: Auto-kill (uncomment if you want)
        // exec(isWindows ? 'taskkill /F /IM node.exe' : 'killall -9 node');
        // process.exit(1);
      }
    } else if (count < THRESHOLD && warningCount > 0) {
      // Reset cảnh báo nếu đã về mức bình thường
      console.log('Process count normalized');
      warningCount = 0;
    }

    // Hiển thị chi tiết nếu có quá nhiều process
    if (count > THRESHOLD && isWindows) {
      console.log('\nProcess details:');
      exec('tasklist /FI "IMAGENAME eq node.exe" /FO LIST', (_, detail) => {
        console.log(detail);
      });
    }

    previousCount = count;
  });
}

// Chạy mỗi 5 giây
console.log('Node Process Monitor started...');
console.log(`Warning threshold: ${THRESHOLD} processes\n`);

checkProcesses(); // Chạy ngay lần đầu
const interval = setInterval(checkProcesses, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping monitor...');
  clearInterval(interval);
  process.exit(0);
});
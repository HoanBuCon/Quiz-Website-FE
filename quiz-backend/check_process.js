import { exec } from "child_process";

// Số lần quét
const INTERVAL = 3000; // 3s
const MAX_HISTORY = 10; // lưu 10 lần đo gần nhất

const history = [];

function countProcesses(callback) {
  const cmd =
    process.platform === "win32"
      ? `wmic process where "name='node.exe'" get ProcessId | find /c " "`
      : `ps -A | grep node | wc -l`;

  exec(cmd, (err, stdout) => {
    if (err) return callback(null);
    const count = parseInt(stdout.trim(), 10);
    callback(count);
  });
}

function checkSpam() {
  countProcesses((count) => {
    if (!count) return;

    history.push(count);
    if (history.length > MAX_HISTORY) history.shift();

    const avg = history.reduce((a, b) => a + b, 0) / history.length;

    console.clear();
    console.log("Node Process Monitor");
    console.log("─────────────────────────────");
    console.log("Mốc thời gian:", new Date().toLocaleTimeString());
    console.log("Tiến trình hiện tại:", count);
    console.log("Trung bình gần đây:", avg.toFixed(2));
    console.log("─────────────────────────────");

    // Cảnh báo nếu quá nhiều tiến trình (ví dụ > 5)
    if (count > 5) {
      console.log("Cảnh báo: Có thể đang xảy ra loop spawn hoặc leak!");
      console.log("Kiểm tra code index.js hoặc process manager (nodemon/pm2).");
    }
  });
}

console.log("Bắt đầu theo dõi tiến trình NodeJS...");
setInterval(checkSpam, INTERVAL);

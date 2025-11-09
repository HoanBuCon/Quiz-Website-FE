// adminActions.js
import { PrismaClient } from "@prisma/client";
import readline from "readline";

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`
=============================
 CHỨC NĂNG QUẢN TRỊ HỆ THỐNG
=============================
1. Xóa tài khoản người dùng
2. Xóa toàn bộ tin nhắn của người dùng
`);

rl.question("Nhập lựa chọn (1/2): ", async (choice) => {
  try {
    switch (choice.trim()) {
      case "1": {
        rl.question("Nhập email hoặc username cần xóa: ", async (input) => {
          // Tìm user theo email hoặc name
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ email: input.trim() }, { name: input.trim() }],
            },
          });

          if (!user) {
            console.log("❌ Không tìm thấy người dùng cần xóa.");
            rl.close();
            await prisma.$disconnect();
            return;
          }

          console.log(`⚠️ Bạn sắp xóa tài khoản: ${user.email || user.name}`);
          rl.question("Bạn có chắc muốn xóa? (yes/no): ", async (confirm) => {
            if (confirm.toLowerCase() === "yes") {
              await prisma.user.delete({
                where: { id: user.id },
              });
              console.log("✅ Đã xóa tài khoản và toàn bộ dữ liệu liên quan (theo cascade).");
            } else {
              console.log("❎ Đã hủy thao tác.");
            }
            rl.close();
            await prisma.$disconnect();
          });
        });
        break;
      }

      case "2": {
        rl.question("Nhập email hoặc username của người dùng cần xóa tin nhắn: ", async (input) => {
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ email: input.trim() }, { name: input.trim() }],
            },
          });

          if (!user) {
            console.log("❌ Không tìm thấy người dùng này.");
            rl.close();
            await prisma.$disconnect();
            return;
          }

          const count = await prisma.chatMessage.deleteMany({
            where: { userId: user.id },
          });

          console.log(`✅ Đã xóa ${count.count} tin nhắn của người dùng ${user.email || user.name}.`);

          rl.close();
          await prisma.$disconnect();
        });
        break;
      }

      default:
        console.log("❌ Lựa chọn không hợp lệ. Vui lòng chọn 1 hoặc 2.");
        rl.close();
        await prisma.$disconnect();
        break;
    }
  } catch (error) {
    console.error("🚨 Lỗi trong quá trình xử lý:", error);
    rl.close();
    await prisma.$disconnect();
  }
});

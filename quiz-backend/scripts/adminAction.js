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
2. Xóa tin nhắn người dùng
3. Quản lý quiz và lớp học của người dùng
`);

rl.question("Nhập lựa chọn (1/2/3): ", async (choice) => {
  try {
    switch (choice.trim()) {
      // ==================================================
      // 1. XÓA TÀI KHOẢN NGƯỜI DÙNG
      // ==================================================
      case "1": {
        rl.question("Nhập email hoặc username cần xóa: ", async (input) => {
          const user = await prisma.user.findFirst({
            where: { OR: [{ email: input.trim() }, { name: input.trim() }] },
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
              await prisma.user.delete({ where: { id: user.id } });
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

      // ==================================================
      // 2. XÓA TIN NHẮN NGƯỜI DÙNG
      // ==================================================
      case "2": {
        rl.question("Nhập email hoặc username của người dùng cần xóa tin nhắn: ", async (input) => {
          const user = await prisma.user.findFirst({
            where: { OR: [{ email: input.trim() }, { name: input.trim() }] },
          });

          if (!user) {
            console.log("❌ Không tìm thấy người dùng này.");
            rl.close();
            await prisma.$disconnect();
            return;
          }

          console.log(`
=============================================
👤 Người dùng: ${user.name || "(không có tên)"} (${user.email})
=============================================
Bạn muốn làm gì?
a. Xóa 1 tin nhắn chỉ định
b. Xóa số lượng tin nhắn gần nhất
c. Xóa toàn bộ tin nhắn
=============================================
`);
          rl.question("Nhập lựa chọn (a/b/c): ", async (subChoice) => {
            switch (subChoice.trim().toLowerCase()) {
              case "a": {
                const messages = await prisma.chatMessage.findMany({
                  where: { userId: user.id },
                  orderBy: { createdAt: "desc" },
                  take: 20,
                });

                if (messages.length === 0) {
                  console.log("⚠️ Người dùng này chưa có tin nhắn nào.");
                  rl.close();
                  await prisma.$disconnect();
                  return;
                }

                console.log("\n🗨️ Các tin nhắn gần nhất:");
                messages.forEach((m, i) => {
                  console.log(
                    `${i + 1}. [${m.id}] ${new Date(m.createdAt).toLocaleString()} → ${m.content}`
                  );
                });

                rl.question("\nNhập ID tin nhắn cần xóa: ", async (msgId) => {
                  const msg = await prisma.chatMessage.findUnique({ where: { id: msgId.trim() } });
                  if (!msg) {
                    console.log("❌ Không tìm thấy tin nhắn với ID này.");
                  } else {
                    await prisma.chatMessage.delete({ where: { id: msg.id } });
                    console.log("✅ Đã xóa tin nhắn.");
                  }
                  rl.close();
                  await prisma.$disconnect();
                });
                break;
              }

              case "b": {
                rl.question("Nhập số lượng tin nhắn gần nhất cần xóa: ", async (numStr) => {
                  const num = parseInt(numStr);
                  if (isNaN(num) || num <= 0) {
                    console.log("❌ Số lượng không hợp lệ.");
                    rl.close();
                    await prisma.$disconnect();
                    return;
                  }

                  const recentMessages = await prisma.chatMessage.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: "desc" },
                    take: num,
                  });

                  const ids = recentMessages.map((m) => m.id);
                  const deleted = await prisma.chatMessage.deleteMany({
                    where: { id: { in: ids } },
                  });

                  console.log(`✅ Đã xóa ${deleted.count} tin nhắn gần nhất của ${user.email || user.name}.`);
                  rl.close();
                  await prisma.$disconnect();
                });
                break;
              }

              case "c": {
                console.log("⚠️ Bạn sắp xóa toàn bộ tin nhắn của người dùng này.");
                rl.question("Bạn có chắc chắn không? (yes/no): ", async (confirm) => {
                  if (confirm.toLowerCase() === "yes") {
                    const deleted = await prisma.chatMessage.deleteMany({
                      where: { userId: user.id },
                    });
                    console.log(`✅ Đã xóa toàn bộ ${deleted.count} tin nhắn.`);
                  } else {
                    console.log("❎ Đã hủy thao tác.");
                  }
                  rl.close();
                  await prisma.$disconnect();
                });
                break;
              }

              default:
                console.log("❌ Lựa chọn không hợp lệ.");
                rl.close();
                await prisma.$disconnect();
                break;
            }
          });
        });
        break;
      }

      // ==================================================
      // 3. QUẢN LÝ QUIZ / CLASS CỦA NGƯỜI DÙNG
      // ==================================================
      case "3": {
        await handleUserQuizClass();
        break;
      }

      default:
        console.log("❌ Lựa chọn không hợp lệ. Vui lòng chọn 1, 2 hoặc 3.");
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

// ==================================================
// HÀM CON: QUẢN LÝ QUIZ / CLASS VỚI FALLBACK
// ==================================================
async function handleUserQuizClass() {
  rl.question("Nhập email hoặc username của người dùng: ", async (input) => {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.trim() }, { name: input.trim() }],
      },
      include: {
        classes: true,
        quizzes: true,
      },
    });

    if (!user) {
      console.log("❌ Không tìm thấy người dùng này. Vui lòng nhập lại.\n");
      return handleUserQuizClass();
    }

    console.log(`\n👤 Người dùng: ${user.name || "(không có tên)"} (${user.email})`);
    console.log("=============================================");

    const hasClasses = user.classes.length > 0;
    const hasQuizzes = user.quizzes.length > 0;

    if (!hasClasses && !hasQuizzes) {
      console.log("\n⚠️ Người dùng này chưa tạo lớp học hoặc quiz nào.");
      console.log("🔁 Vui lòng nhập người dùng khác.\n");
      return handleUserQuizClass();
    }

    if (hasClasses) {
      console.log("\n📚 LỚP HỌC ĐÃ TẠO:");
      console.table(
        user.classes.map((c) => ({
          ID: c.id,
          Tên: c.name,
          Công_khai: c.isPublic ? "✅" : "❌",
          Chia_sẻ: c.shareCode ? "🔗 Có" : "❌ Không",
          Tạo_lúc: new Date(c.createdAt).toLocaleString(),
        }))
      );
    }

    if (hasQuizzes) {
      console.log("\n🧩 QUIZ ĐÃ TẠO:");
      console.table(
        user.quizzes.map((q) => ({
          ID: q.id,
          Tiêu_đề: q.title,
          Công_bố: q.published ? "✅" : "❌",
          Chia_sẻ: q.shareCode ? "🔗 Có" : "❌ Không",
          Tạo_lúc: new Date(q.createdAt).toLocaleString(),
        }))
      );
    }

    console.log(`
=============================================
Bạn muốn làm gì?
a. Xóa 1 lớp học theo ID
b. Xóa 1 quiz theo ID
c. Xóa toàn bộ lớp học và quiz của người dùng này
=============================================
`);

    rl.question("Nhập lựa chọn (a/b/c): ", async (subChoice) => {
      switch (subChoice.trim().toLowerCase()) {
        case "a": {
          rl.question("Nhập ID lớp học cần xóa: ", async (classId) => {
            const cls = await prisma.class.findUnique({ where: { id: classId.trim() } });
            if (!cls) console.log("❌ Không tìm thấy lớp học với ID đó.");
            else {
              await prisma.class.delete({ where: { id: cls.id } });
              console.log(`✅ Đã xóa lớp học "${cls.name}".`);
            }
            rl.close();
            await prisma.$disconnect();
          });
          break;
        }

        case "b": {
          rl.question("Nhập ID quiz cần xóa: ", async (quizId) => {
            const quiz = await prisma.quiz.findUnique({ where: { id: quizId.trim() } });
            if (!quiz) console.log("❌ Không tìm thấy quiz với ID đó.");
            else {
              await prisma.quiz.delete({ where: { id: quiz.id } });
              console.log(`✅ Đã xóa quiz "${quiz.title}".`);
            }
            rl.close();
            await prisma.$disconnect();
          });
          break;
        }

        case "c": {
          console.log("⚠️ Bạn sắp xóa toàn bộ lớp học và quiz của người dùng này.");
          rl.question("Bạn có chắc chắn không? (yes/no): ", async (confirm) => {
            if (confirm.toLowerCase() === "yes") {
              const deletedClasses = await prisma.class.deleteMany({ where: { ownerId: user.id } });
              const deletedQuizzes = await prisma.quiz.deleteMany({ where: { ownerId: user.id } });
              console.log(`✅ Đã xóa ${deletedClasses.count} lớp học và ${deletedQuizzes.count} quiz.`);
            } else {
              console.log("❎ Đã hủy thao tác.");
            }
            rl.close();
            await prisma.$disconnect();
          });
          break;
        }

        default:
          console.log("❌ Lựa chọn không hợp lệ.");
          rl.close();
          await prisma.$disconnect();
          break;
      }
    });
  });
}

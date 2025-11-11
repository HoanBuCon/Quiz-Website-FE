// getUserInfo.js
import { PrismaClient } from "@prisma/client";
import readline from "readline";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`
=============================
 CHỌN CHỨC NĂNG LẤY NGƯỜI DÙNG
=============================
1. Tìm theo tên người dùng (name)
2. Tìm theo email
3. Hiển thị toàn bộ người dùng (dạng rút gọn)
4. Hiển thị toàn bộ người dùng (đầy đủ chi tiết)
5. Xuất toàn bộ người dùng ra file TXT (full)
`);

rl.question("Nhập lựa chọn (1/2/3/4/5): ", async (choice) => {
  try {
    switch (choice.trim()) {
      case "1": {
        rl.question("Nhập tên người dùng (name): ", async (name) => {
          await getUserDetail({ name: name.trim() });
        });
        break;
      }

      case "2": {
        rl.question("Nhập email: ", async (email) => {
          await getUserDetail({ email: email.trim() });
        });
        break;
      }

      case "3": {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        });
        if (users.length === 0) {
          console.log("⚠️ Không có người dùng nào trong hệ thống.");
        } else {
          console.log(`✅ Danh sách ${users.length} người dùng:`);
          console.table(users);
        }
        rl.close();
        await prisma.$disconnect();
        break;
      }

      case "4": {
        const allUsers = await prisma.user.findMany({
          include: {
            classes: true,
            quizzes: true,
            sessions: {
              include: {
                quiz: { select: { id: true, title: true } },
              },
            },
            // === BỔ SUNG TRUY VẤN MỚI ===
            quizAttempts: {
              include: {
                quiz: { select: { id: true, title: true } },
              },
              orderBy: {
                startedAt: "desc", // Lấy các lần thử mới nhất lên đầu
              },
            },
            // === KẾT THÚC BỔ SUNG ===
          },
        });

        if (allUsers.length === 0) {
          console.log("⚠️ Không có người dùng nào trong hệ thống.");
        } else {
          console.log(
            `✅ Hiển thị toàn bộ ${allUsers.length} người dùng (full):`
          );
          for (const user of allUsers) {
            await printFullUserInfo(user);
            console.log("\n───────────────────────────────\n");
          }
        }

        rl.close();
        await prisma.$disconnect();
        break;
      }

      case "5": {
        const allUsers = await prisma.user.findMany({
          include: {
            classes: true,
            quizzes: true,
            sessions: {
              include: {
                quiz: { select: { id: true, title: true } },
              },
            },
            // === BỔ SUNG TRUY VẤN MỚI ===
            quizAttempts: {
              include: {
                quiz: { select: { id: true, title: true } },
              },
              orderBy: {
                startedAt: "desc", // Lấy các lần thử mới nhất lên đầu
              },
            },
            // === KẾT THÚC BỔ SUNG ===
          },
        });

        if (allUsers.length === 0) {
          console.log("⚠️ Không có người dùng nào trong hệ thống.");
        } else {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const dir = path.resolve("./user_info");
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

          const filePath = path.join(
            dir,
            `full_user_dump_${timestamp}.txt`
          );
          const output = [];

          output.push(
            `BÁO CÁO NGƯỜI DÙNG - ${new Date().toLocaleString()}`
          );
          output.push(
            "=====================================================\n"
          );

          for (const user of allUsers) {
            output.push(formatFullUserText(user));
            output.push(
              "\n-----------------------------------------------------\n"
            );
          }

          fs.writeFileSync(filePath, output.join("\n"), "utf-8");
          console.log(
            `✅ Đã xuất toàn bộ người dùng vào file:\n📄 ${filePath}`
          );
        }

        rl.close();
        await prisma.$disconnect();
        break;
      }

      default:
        console.log("❌ Lựa chọn không hợp lệ. Vui lòng chọn 1–5.");
        rl.close();
        await prisma.$disconnect();
        break;
    }
  } catch (error) {
    console.error("🚨 Lỗi khi truy vấn người dùng:", error);
    rl.close();
    await prisma.$disconnect();
  }
});

// =============================
// HÀM TRUY VẤN NGƯỜI DÙNG CHI TIẾT
// =============================
async function getUserDetail(whereClause) {
  try {
    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        classes: true,
        quizzes: true,
        sessions: {
          include: {
            quiz: { select: { id: true, title: true } },
          },
        },
        // === BỔ SUNG TRUY VẤN MỚI ===
        quizAttempts: {
          include: {
            quiz: { select: { id: true, title: true } },
          },
          orderBy: {
            startedAt: "desc", // Lấy các lần thử mới nhất lên đầu
          },
        },
        // === KẾT THÚC BỔ SUNG ===
      },
    });

    if (!user) {
      console.log("❌ Không tìm thấy người dùng nào.");
      rl.close();
      await prisma.$disconnect();
      return;
    }

    await printFullUserInfo(user);

    rl.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error("🚨 Lỗi khi lấy thông tin người dùng:", error);
    rl.close();
    await prisma.$disconnect();
  }
}

// =============================
// HÀM IN THÔNG TIN NGƯỜI DÙNG RA CONSOLE
// =============================
async function printFullUserInfo(user) {
  console.log("\n===============================");
  console.log(`👤 NGƯỜI DÙNG: ${user.name || "(không có tên)"}`);
  console.log("===============================");
  console.log({
    ID: user.id,
    Email: user.email,
    Tên: user.name,
    Tạo_lúc: user.createdAt,
    Cập_nhật_lúc: user.updatedAt,
  });

  // === BỔ SUNG THÔNG TIN HOẠT ĐỘNG ===
  console.log("🕒 THÔNG TIN HOẠT ĐỘNG:");
  console.log({
    Login_gần_nhất: user.lastLoginAt?.toLocaleString() || "(chưa ghi nhận)",
    Logout_gần_nhất: user.lastLogoutAt?.toLocaleString() || "(chưa ghi nhận)",
    Hoạt_động_cuối: user.lastActivityAt?.toLocaleString() || "(chưa ghi nhận)",
  });
  // === KẾT THÚC BỔ SUNG ===

  // ===== LỚP HỌC =====
  console.log("\n📚 LỚP HỌC ĐÃ TẠO:");
  if (user.classes.length === 0) console.log("  (Không có lớp học nào)");
  else {
    console.table(
      user.classes.map((c) => ({
        ID: c.id,
        Tên: c.name,
        Công_khai: c.isPublic ? "✅" : "❌",
        Tạo_lúc: c.createdAt.toISOString(),
      }))
    );
  }

  // ===== QUIZ =====
  console.log("\n🧩 QUIZ ĐÃ TẠO:");
  if (user.quizzes.length === 0) console.log("  (Không có quiz nào)");
  else {
    console.table(
      user.quizzes.map((q) => ({
        ID: q.id,
        Tiêu_đề: q.title,
        Công_bố: q.published ? "✅" : "❌",
        Tạo_lúc: q.createdAt.toISOString(),
      }))
    );
  }

  // ===== THỐNG KÊ LÀM BÀI =====
  console.log("\n🧮 THỐNG KÊ LÀM BÀI (QuizSession):");
  if (user.sessions.length === 0) {
    console.log("  (Người dùng này chưa làm bài nào)");
  } else {
    const grouped = {};
    user.sessions.forEach((s) => {
      if (!grouped[s.quizId]) grouped[s.quizId] = [];
      grouped[s.quizId].push(s);
    });

    const stats = Object.entries(grouped).map(([quizId, sessions]) => {
      const quizName = sessions[0].quiz.title;
      const count = sessions.length;

      const avgPercent = (
        sessions.reduce(
          (sum, s) => sum + (s.score / s.totalQuestions) * 100,
          0
        ) / sessions.length
      ).toFixed(2);

      const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
      const times = sessions
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .map(
          (s, i) =>
            `#${i + 1} ${
              s.completedAt?.toLocaleString() || "?"
            } (${s.timeSpent}s) → ${(
              (s.score / s.totalQuestions) *
              100
            ).toFixed(2)}%`
        )
        .join("\n");

      return {
        Quiz_ID: quizId,
        Tiêu_đề: quizName,
        Số_lần_làm: count,
        "Điểm_tb(%)": `${avgPercent}%`,
        Tổng_thời_gian: `${totalTime}s`,
        Chi_tiết_từng_lần: `\n${times}`,
      };
    });

    console.table(stats);
  }

  // === BỔ SUNG LỊCH SỬ TRUY CẬP QUIZ ===
  console.log("\n🖱️ LỊCH SỬ TRUY CẬP QUIZ (QuizAttempt):");
  // Xử lý trường hợp user cũ không có dữ liệu quizAttempts
  if (!user.quizAttempts || user.quizAttempts.length === 0) {
    console.log("  (Chưa có lịch sử truy cập quiz nào được ghi nhận)");
  } else {
    console.table(
      user.quizAttempts.map((attempt) => ({
        Quiz_ID: attempt.quizId,
        Tiêu_đề: attempt.quiz.title,
        Vào_lúc: attempt.startedAt?.toLocaleString(),
        Thoát_lúc:
          attempt.endedAt?.toLocaleString() || "(chưa thoát/đang xem)",
        Đã_nộp_bài: attempt.quizSessionId ? "✅" : "❌",
      }))
    );
  }
  // === KẾT THÚC BỔ SUNG ===
}

// =============================
// HÀM XUẤT TEXT CHO FILE TXT
// =============================
function formatFullUserText(user) {
  let text = "";
  text += `👤 NGƯỜI DÙNG: ${user.name || "(không có tên)"}\n`;
  text += `ID: ${
    user.id
  }\nEmail: ${user.email}\nTạo lúc: ${user.createdAt}\nCập nhật lúc: ${user.updatedAt}\n`;

  // === BỔ SUNG THÔNG TIN HOẠT ĐỘNG ===
  text += `Login gần nhất: ${
    user.lastLoginAt?.toLocaleString() || "(chưa ghi nhận)"
  }\n`;
  text += `Logout gần nhất: ${
    user.lastLogoutAt?.toLocaleString() || "(chưa ghi nhận)"
  }\n\n`;
  // === KẾT THÚC BỔ SUNG ===

  text += "📚 LỚP HỌC:\n";
  if (user.classes.length === 0) text += "  (Không có lớp học nào)\n";
  else {
    for (const c of user.classes) {
      text += `  - ${c.name} [${c.id}] | Công khai: ${
        c.isPublic ? "✅" : "❌"
      } | ${c.createdAt.toISOString()}\n`;
    }
  }

  text += "\n🧩 QUIZ:\n";
  if (user.quizzes.length === 0) text += "  (Không có quiz nào)\n";
  else {
    for (const q of user.quizzes) {
      text += `  - ${q.title} [${q.id}] | Công bố: ${
        q.published ? "✅" : "❌"
      } | ${q.createdAt.toISOString()}\n`;
    }
  }

  text += "\n🧮 LỊCH SỬ LÀM BÀI:\n";
  if (user.sessions.length === 0) text += "  (Chưa làm bài nào)\n";
  else {
    const grouped = {};
    user.sessions.forEach((s) => {
      if (!grouped[s.quizId]) grouped[s.quizId] = [];
      grouped[s.quizId].push(s);
    });

    for (const [quizId, sessions] of Object.entries(grouped)) {
      const quizName = sessions[0].quiz.title;
      const avgPercent = (
        sessions.reduce(
          (sum, s) => sum + (s.score / s.totalQuestions) * 100,
          0
        ) / sessions.length
      ).toFixed(2);
      const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
      text += `  • ${quizName} [${quizId}]\n`;
      text += `    → Số lần làm: ${sessions.length}, Trung bình: ${avgPercent}%, Tổng thời gian: ${totalTime}s\n`;
      sessions
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .forEach((s, i) => {
          const percent = ((s.score / s.totalQuestions) * 100).toFixed(2);
          text += `      #${i + 1} ${
            s.completedAt?.toLocaleString() || "?"
          } (${s.timeSpent}s) → ${percent}%\n`;
        });
      text += "\n";
    }
  }

  // === BỔ SUNG LỊCH SỬ TRUY CẬP QUIZ ===
  text += "\n🖱️ LỊCH SỬ TRUY CẬP QUIZ (QuizAttempt):\n";
  // Xử lý trường hợp user cũ không có dữ liệu quizAttempts
  if (!user.quizAttempts || user.quizAttempts.length === 0) {
    text += "  (Chưa có lịch sử truy cập quiz nào được ghi nhận)\n";
  } else {
    // Sắp xếp lại theo thời gian bắt đầu (nếu cần, vì truy vấn đã orderBy 'desc')
    const sortedAttempts = user.quizAttempts; // Đã sort bằng query

    for (const attempt of sortedAttempts) {
      text += `  • ${attempt.quiz.title} [${attempt.quizId}]\n`;
      text += `    → Vào lúc: ${attempt.startedAt?.toLocaleString()}\n`;
      text += `    → Thoát lúc: ${
        attempt.endedAt?.toLocaleString() || "(chưa thoát/đang xem)"
      }\n`;
      text += `    → Đã nộp bài: ${attempt.quizSessionId ? "✅" : "❌"}\n\n`;
    }
  }
  // === KẾT THÚC BỔ SUNG ===

  return text;
}
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
                    },
                });

                if (allUsers.length === 0) {
                    console.log("⚠️ Không có người dùng nào trong hệ thống.");
                } else {
                    console.log(`✅ Hiển thị toàn bộ ${allUsers.length} người dùng (full):`);
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
                    },
                });

                if (allUsers.length === 0) {
                    console.log("⚠️ Không có người dùng nào trong hệ thống.");
                } else {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                    const dir = path.resolve("./user_info");
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                    const filePath = path.join(dir, `full_user_dump_${timestamp}.txt`);
                    const output = [];

                    output.push(`BÁO CÁO NGƯỜI DÙNG - ${new Date().toLocaleString()}`);
                    output.push("=====================================================\n");

                    for (const user of allUsers) {
                        output.push(formatFullUserText(user));
                        output.push("\n-----------------------------------------------------\n");
                    }

                    fs.writeFileSync(filePath, output.join("\n"), "utf-8");
                    console.log(`✅ Đã xuất toàn bộ người dùng vào file:\n📄 ${filePath}`);
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
                sessions.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 100, 0) /
                sessions.length
            ).toFixed(2);

            const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
            const times = sessions
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .map((s) => `→ ${s.completedAt?.toLocaleString() || "?"} (${s.timeSpent}s)`)
                .join("\n");

            return {
                Quiz_ID: quizId,
                Tiêu_đề: quizName,
                Số_lần_làm: count,
                "Điểm_trung_bình(%)": `${avgPercent}%`,
                Tổng_thời_gian: `${totalTime}s`,
                Thời_gian_hoàn_thành: `\n${times}`,
            };
        });

        console.table(stats);
    }
}

// =============================
// HÀM XUẤT TEXT CHO FILE TXT
// =============================
function formatFullUserText(user) {
    let text = "";
    text += `👤 NGƯỜI DÙNG: ${user.name || "(không có tên)"}\n`;
    text += `ID: ${user.id}\nEmail: ${user.email}\nTạo lúc: ${user.createdAt}\nCập nhật lúc: ${user.updatedAt}\n\n`;

    text += "📚 LỚP HỌC:\n";
    if (user.classes.length === 0) text += "  (Không có lớp học nào)\n";
    else {
        for (const c of user.classes) {
            text += `  - ${c.name} [${c.id}] | Công khai: ${c.isPublic ? "✅" : "❌"} | ${c.createdAt.toISOString()}\n`;
        }
    }

    text += "\n🧩 QUIZ:\n";
    if (user.quizzes.length === 0) text += "  (Không có quiz nào)\n";
    else {
        for (const q of user.quizzes) {
            text += `  - ${q.title} [${q.id}] | Công bố: ${q.published ? "✅" : "❌"} | ${q.createdAt.toISOString()}\n`;
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
                sessions.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 100, 0) /
                sessions.length
            ).toFixed(2);
            const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
            text += `  • ${quizName} [${quizId}]\n`;
            text += `    → Số lần làm: ${sessions.length}, Trung bình: ${avgPercent}%, Tổng thời gian: ${totalTime}s\n`;
            sessions.forEach((s, i) => {
                text += `      #${i + 1} ${s.completedAt?.toLocaleString() || "?"} (${s.timeSpent}s)\n`;
            });
            text += "\n";
        }
    }

    return text;
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang cập nhật hình ảnh và mô tả chuẩn cho danh mục và sản phẩm ---');

  const catUpdates = [
    { slug: 'tai-khoan-premium', icon: './icons/star.svg', desc: 'Tài khoản giải trí chính chủ Netflix, Spotify, YouTube chất lượng cao, bảo hành trọn đời' },
    { slug: 'phan-mem-ban-quyen', icon: './icons/key.svg', desc: 'Key bản quyền Windows, Office, VPN chính hãng kích hoạt online 1 lần dùng vĩnh viễn' },
    { slug: 'microsoft', icon: './icons/windows.svg', desc: 'Hệ sinh thái Microsoft bản quyền chính hãng (Windows 11, Office 365)' },
    { slug: 'google', icon: './icons/google.svg', desc: 'Dịch vụ nâng cấp Google One, Google Drive dung lượng cao chính chủ' },
    { slug: 'source-code', icon: './icons/code.svg', desc: 'Mã nguồn bot Telegram, source code MMO độc quyền tối ưu' },
    { slug: 'canva', icon: './icons/canva.svg', desc: 'Tài khoản thiết kế đồ hoạ Canva Pro không giới hạn tính năng VIP' },
    { slug: 'chatgpt', icon: './icons/chatgpt.svg', desc: 'Tài khoản trí tuệ nhân tạo ChatGPT Plus, OpenAI GPT-4o cao cấp' },
    { slug: 'capcut', icon: './icons/capcut.svg', desc: 'Tài khoản CapCut Pro chính chủ mở khoá hiệu ứng và xuất video 4K 60fps' },
    { slug: 'tools', icon: './icons/tool.svg', desc: 'Công cụ MMO, tool tự động hoá nuôi nick và download video đa nền tảng' },
    { slug: 'duolingo', icon: './icons/duolingo.svg', desc: 'Gói học ngoại ngữ Duolingo Super không quảng cáo, học không giới hạn' },
    { slug: 'expressvpn', icon: './icons/vpn.svg', desc: 'Mạng riêng ảo tốc độ cao, bảo mật IP vượt mọi tường lửa' },
    { slug: 'dich-vu-khac', icon: './icons/star.svg', desc: 'Các gói dịch vụ số và tài khoản bản quyền độc quyền khác' }
  ];

  for (const cu of catUpdates) {
    await prisma.category.updateMany({
      where: { slug: cu.slug },
      data: { imageUrl: cu.icon, description: cu.desc }
    });
  }

  const prodUpdates = [
    { match: 'Netflix', icon: './icons/netflix.svg', desc: 'Tài khoản Netflix Premium xem phim 4K Ultra HD đỉnh cao. Bảo hành 1 đổi 1 suốt thời gian sử dụng.' },
    { match: 'Spotify', icon: './icons/spotify.svg', desc: 'Nâng cấp gói Spotify Premium nghe nhạc bản quyền không quảng cáo, tải nhạc offline cực mượt.' },
    { match: 'Windows 11', icon: './icons/windows.svg', desc: 'Key bản quyền Windows 11 Pro Retail chính hãng kích hoạt trực tiếp từ Microsoft.' },
    { match: 'Office 365', icon: './icons/office.svg', desc: 'Tài khoản Microsoft 365 bản quyền kèm 1TB lưu trữ OneDrive đám mây dung lượng khủng.' },
    { match: 'Google One', icon: './icons/google.svg', desc: 'Nâng cấp Google One dung lượng 2TB dùng cho Google Drive, Photos và Gmail.' },
    { match: 'Canva Pro', icon: './icons/canva.svg', desc: 'Tài khoản Canva Pro mở khoá toàn bộ thư viện ảnh, video, font chữ và công cụ xoá phông AI.' },
    { match: 'ChatGPT Plus', icon: './icons/chatgpt.svg', desc: 'Tài khoản ChatGPT Plus trải nghiệm siêu trí tuệ GPT-4o, DALL-E 3 tạo ảnh và duyệt web không giới hạn.' },
    { match: 'CapCut Pro', icon: './icons/capcut.svg', desc: 'CapCut Pro mở khoá đầy đủ bộ lọc, chuyển cảnh và xuất video 4K chuyên nghiệp.' },
    { match: 'Duolingo Super', icon: './icons/duolingo.svg', desc: 'Gói Duolingo Super học tiếng Anh, tiếng Trung... không giới hạn mạng sống, không quảng cáo.' },
    { match: 'ExpressVPN', icon: './icons/vpn.svg', desc: 'Key ExpressVPN tốc độ cực cao, mã hoá quân đội, mở khoá nội dung toàn cầu.' },
    { match: 'Source Bot', icon: './icons/code.svg', desc: 'Mã nguồn full source code Bot Telegram Shop MMO đầy đủ tính năng nạp tự động, Mini App và Admin.' },
    { match: 'Tool Nuôi Nick', icon: './icons/tool.svg', desc: 'Phần mềm quản lý đa tài khoản Facebook, nuôi nick tương tác tự động và chống checkpoint.' },
    { match: 'Tool Tải Video', icon: './icons/tool.svg', desc: 'Công cụ tải video không logo từ TikTok, Douyin, Reels, YouTube chất lượng gốc.' }
  ];

  for (const pu of prodUpdates) {
    const products = await prisma.product.findMany({
      where: { name: { contains: pu.match } }
    });
    for (const p of products) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          imageUrl: pu.icon,
          description: p.description || pu.desc
        }
      });
    }
  }

  console.log('✅ Đã cập nhật xong dữ liệu danh mục & sản phẩm!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

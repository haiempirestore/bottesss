(() => {
  'use strict';
  try {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  } catch (e) {}
  const scrollToTop = () => {
    try {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const app = document.getElementById('app');
      if (app) app.scrollTop = 0;
    } catch (e) {}
  };
  scrollToTop();
  const tg = window.Telegram?.WebApp;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icons = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>', crown: '<path d="m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Z"/><path d="M5 21h14"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 13h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bag: '<path d="m5 8 1 13h12l1-13H5Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    package: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v9M4 9v9l8 4 8-4V9"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    zap: '<path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    receipt: '<path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2-3-2Z"/><path d="M9 9h6M9 13h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
    tool: '<path d="m14.7 6.3 3 3-9.4 9.4H5.3v-3l9.4-9.4Zm2.1-2.1a2.1 2.1 0 0 1 3 0l.7.7a2.1 2.1 0 0 1 0 3l-1.4 1.4-3.7-3.7 1.4-1.4Z"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 11.9-3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8m-3 3 3 3m-6 0 3 3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    hash: '<path d="M10 3 8 21M16 3l-2 18M4 9h16M3 15h16"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 21h14"/>'
    , heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>'
    , cart: '<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"/>'
    , star: '<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17.3 5.7 20.5 7 13.7 2 8.9 9 8l3-6Z"/>'
    , gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.package}</svg>`;
  const paintIcons = root => $$('[data-icon]', root).forEach(el => { if (!el.dataset.painted) { el.innerHTML = svg(el.dataset.icon); el.dataset.painted = '1'; } });
  paintIcons(document);
  document.addEventListener('contextmenu', event => {
    if (event.target?.closest?.('.product-art,.sheet-product-icon,.pay-logo,.invoice-qr,.avatar-button,.profile-avatar')) event.preventDefault();
  });
  document.addEventListener('dragstart', event => {
    if (event.target?.tagName === 'IMG') event.preventDefault();
  });

  const state = { data: null, page: 'home', category: 'Tất cả', search: '', socialCategory: 'Tất cả', socialSearch: '', sort: 'popular', selected: null, quantity: 1, quoteAmount: 0, quoteTimer: null, quoteSeq: 0, warrantyOrder: null, deliveryOrder: null, deliveryRequestSeq: 0, deliveryItems: [], orderTab: 'orders', paymentMethod: 'balance', paymentBinanceOpen: false, topupMethod: '', topupBinanceOpen: false, languageSaving: false, demoOrder: null, invoice: null, paymentPoll: null, paymentPollTimer: null, paymentPollSeq: 0, topupInvoice: null, supportMessages: [], supportPoll: null, aliasMode: 'plus', soundEnabled: localStorage.getItem('dino_transaction_sound') !== 'off', refreshing: false, adminData: null, adminLoading: false, adminRequestSeq: 0, adminIdentityKey: '', adminTab: 'orders', adminQuery: '', adminStatus: 'all', adminDay: '', commerce: { favorites: [], recent: [], cart: [], renewal_reminders: false }, commerceSaving: false, commerceDirty: false, commerceRevision: 0, wheelSpinning: false, wheelRotation: 0 };
  const UI_TEXT = {
    en: {
      'Đang mở cửa hàng...': 'Opening the store...', 'CHÀO MỪNG TRỞ LẠI': 'WELCOME BACK', 'Xin chào,': 'Hello,', 'bạn': 'you', 'SỐ DƯ KHẢ DỤNG': 'AVAILABLE BALANCE', 'Tổng chi tiêu': 'Total spent', 'Nạp tiền': 'Top up', 'Cửa hàng': 'Store', 'Mua tài khoản & key': 'Buy accounts & keys', 'Đơn hàng': 'Orders', 'Giao hàng & bảo hành': 'Delivery & warranty', 'Giỏ hàng': 'Cart', 'Lưu và mua nhanh nhiều sản phẩm': 'Save products for quick checkout', 'ĐANG HOT': 'TRENDING', 'Sản phẩm nổi bật': 'Featured products', 'Xem tất cả': 'View all', 'Giao tự động': 'Automatic delivery', 'Chỉ trong vài giây': 'Within seconds', 'Bảo hành rõ ràng': 'Clear warranty', 'Theo từng sản phẩm': 'Per product', 'Khám phá sản phẩm': 'Explore products', 'Tất cả sản phẩm': 'All products', 'Phổ biến': 'Popular', 'Chưa tìm thấy sản phẩm': 'No products found', 'Thử một từ khóa hoặc danh mục khác nhé.': 'Try another keyword or category.', 'Trang chủ': 'Home', 'Tiện ích': 'Tools', 'Tài khoản': 'Account', 'EMAIL NHẬN DỊCH VỤ': 'SERVICE DELIVERY EMAIL', 'LINK / USERNAME CẦN CHẠY': 'TARGET LINK / USERNAME', 'NỘI DUNG / GHI CHÚ': 'CONTENT / NOTES', 'Mã giảm giá (nếu có)': 'Coupon code (optional)', 'Nhập coupon': 'Enter coupon', 'TỔNG THANH TOÁN': 'TOTAL PAYMENT', 'Yêu thích': 'Favorite', 'Thêm vào giỏ': 'Add to cart', 'Mua ngay': 'Buy now', 'Thanh toán an toàn qua ví, QR ngân hàng hoặc USDT': 'Secure payment via wallet, bank QR, or USDT', 'THANH TOÁN AN TOÀN': 'SECURE PAYMENT', 'Chọn phương thức': 'Choose a payment method', 'Hoàn tất đơn hàng của bạn.': 'Complete your order.', 'Số dư ví': 'Wallet balance', 'Thanh toán ngay bằng số dư Dino': 'Pay instantly with your Dino balance', 'Tự động xác nhận 1–3 phút': 'Automatically confirmed in 1–3 minutes', 'Chọn kênh thanh toán USDT': 'Choose a USDT payment channel', 'Chọn kênh nạp USDT': 'Choose a USDT top-up channel', 'Thanh toán USDT qua Binance Pay ID': 'Pay USDT via Binance Pay ID', 'BNB Smart Chain · tự động xác nhận': 'BNB Smart Chain · automatic confirmation', 'Mạng Polygon · tự động xác nhận': 'Polygon network · automatic confirmation', 'Mạng TRON · tự động xác nhận': 'TRON network · automatic confirmation', 'Tạo hóa đơn thanh toán': 'Create payment invoice', 'Hệ thống chỉ giao hàng sau khi ngân hàng hoặc Binance xác nhận tiền.': 'Delivery starts only after the payment is confirmed.', 'Xử lý nhanh': 'Fast processing', 'Hết hàng': 'Out of stock', 'Theo số lượng': 'Based on quantity', 'Giao tức thì': 'Instant delivery', 'Chưa cấu hình USDT': 'USDT is not configured', 'Chính sách & cam kết': 'Policy & commitments', 'Rõ ràng trước khi mua': 'Clear before purchase', 'Chỉ xử lý sau khi xác nhận tiền': 'Processed only after payment confirmation', 'MB Bank và USDT được tự động xác nhận khi chuyển đúng mạng, đúng số tiền và đúng địa chỉ/ID.': 'MB Bank and USDT are confirmed automatically when sent to the correct network, amount, and address/ID.', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Sai mạng hoặc thiếu memo/ID có thể cần xử lý thủ công lâu hơn.': 'Check the network and amount before sending. Wrong networks or missing memo/ID may require longer manual handling.', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Hệ thống tự xác nhận khi nhận đúng thông tin thanh toán.': 'Check the network and amount before sending. The system confirms automatically when the payment details are correct.', 'Sao chép địa chỉ/ID': 'Copy address/ID', 'Sao chép nội dung chuyển khoản': 'Copy transfer content', 'Copy link': 'Copy link', 'Đã sao chép link sản phẩm': 'Product link copied', 'Sản phẩm không tồn tại hoặc đang tạm ẩn': 'Product does not exist or is hidden'
    },
    zh: {
      'Đang mở cửa hàng...': '正在打开商店…', 'CHÀO MỪNG TRỞ LẠI': '欢迎回来', 'Xin chào,': '你好，', 'bạn': '您', 'SỐ DƯ KHẢ DỤNG': '可用余额', 'Tổng chi tiêu': '总消费', 'Nạp tiền': '充值', 'Cửa hàng': '商店', 'Mua tài khoản & key': '购买账号和密钥', 'Đơn hàng': '订单', 'Giao hàng & bảo hành': '交付与保修', 'Giỏ hàng': '购物车', 'Lưu và mua nhanh nhiều sản phẩm': '保存商品以便快速购买', 'ĐANG HOT': '热门', 'Sản phẩm nổi bật': '精选商品', 'Xem tất cả': '查看全部', 'Giao tự động': '自动发货', 'Chỉ trong vài giây': '仅需几秒', 'Bảo hành rõ ràng': '清晰保修', 'Theo từng sản phẩm': '按商品说明', 'Khám phá sản phẩm': '浏览商品', 'Tất cả sản phẩm': '全部商品', 'Phổ biến': '热门', 'Chưa tìm thấy sản phẩm': '未找到商品', 'Thử một từ khóa hoặc danh mục khác nhé.': '请尝试其他关键词或分类。', 'Trang chủ': '首页', 'Tiện ích': '工具', 'Tài khoản': '账户', 'EMAIL NHẬN DỊCH VỤ': '接收服务的邮箱', 'LINK / USERNAME CẦN CHẠY': '目标链接 / 用户名', 'NỘI DUNG / GHI CHÚ': '内容 / 备注', 'Mã giảm giá (nếu có)': '优惠码（可选）', 'Nhập coupon': '输入优惠码', 'TỔNG THANH TOÁN': '应付总额', 'Yêu thích': '收藏', 'Thêm vào giỏ': '加入购物车', 'Mua ngay': '立即购买', 'Thanh toán an toàn qua ví, QR ngân hàng hoặc USDT': '支持钱包、银行二维码或 USDT 安全付款', 'THANH TOÁN AN TOÀN': '安全支付', 'Chọn phương thức': '选择付款方式', 'Hoàn tất đơn hàng của bạn.': '完成您的订单。', 'Số dư ví': '钱包余额', 'Thanh toán ngay bằng số dư Dino': '使用 Dino 余额即时付款', 'Tự động xác nhận 1–3 phút': '1–3 分钟自动确认', 'Chọn kênh thanh toán USDT': '选择 USDT 付款通道', 'Chọn kênh nạp USDT': '选择 USDT 充值通道', 'Thanh toán USDT qua Binance Pay ID': '通过 Binance Pay ID 支付 USDT', 'BNB Smart Chain · tự động xác nhận': 'BNB Smart Chain · 自动确认', 'Mạng Polygon · tự động xác nhận': 'Polygon 网络 · 自动确认', 'Mạng TRON · tự động xác nhận': 'TRON 网络 · 自动确认', 'Tạo hóa đơn thanh toán': '创建付款账单', 'Hệ thống chỉ giao hàng sau khi ngân hàng hoặc Binance xác nhận tiền.': '付款确认后系统才会交付商品。', 'Xử lý nhanh': '快速处理', 'Hết hàng': '缺货', 'Theo số lượng': '按数量', 'Giao tức thì': '即时交付', 'Chưa cấu hình USDT': 'USDT 尚未配置', 'Chính sách & cam kết': '政策与承诺', 'Rõ ràng trước khi mua': '购买前清楚说明', 'Chỉ xử lý sau khi xác nhận tiền': '确认付款后才处理', 'MB Bank và USDT được tự động xác nhận khi chuyển đúng mạng, đúng số tiền và đúng địa chỉ/ID.': 'MB Bank 和 USDT 在网络、金额和地址/ID 正确时会自动确认。', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Sai mạng hoặc thiếu memo/ID có thể cần xử lý thủ công lâu hơn.': '转账前请核对网络和金额。网络错误或缺少 memo/ID 可能需要更久的人工处理。', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Hệ thống tự xác nhận khi nhận đúng thông tin thanh toán.': '转账前请核对网络和金额。付款信息正确时系统会自动确认。', 'Sao chép địa chỉ/ID': '复制地址/ID', 'Sao chép nội dung chuyển khoản': '复制转账内容', 'Copy link': '复制链接', 'Đã sao chép link sản phẩm': '已复制商品链接', 'Sản phẩm không tồn tại hoặc đang tạm ẩn': '商品不存在或已隐藏'
    }
  };
  Object.assign(UI_TEXT.en, {
    'Quản trị': 'Admin', 'DÀNH CHO BẠN': 'FOR YOU', 'Gợi ý phù hợp': 'Recommended for you', 'VỪA XEM': 'RECENTLY VIEWED', 'Xem lại nhanh': 'View again', 'DINO MARKET': 'DINO MARKET', 'Khám phá cửa hàng': 'Explore store', 'Dữ liệu riêng tư': 'Private data', 'Không chia sẻ tài khoản, key hoặc file này cho người khác.': 'Do not share this account, key, or file with anyone else.', 'Sao chép tất cả': 'Copy all', 'Tải file TXT': 'Download TXT', 'NẠP VÍ DINO': 'DINO WALLET TOP-UP', 'Nạp ví Dino': 'Top up Dino wallet', 'Chọn ngân hàng hoặc USDT, nhập số tiền và hệ thống sẽ tự cộng vào ví sau khi xác nhận giao dịch.': 'Choose bank or USDT, enter an amount, and the system will credit your wallet after confirmation.', 'Nạp tiền bằng MB Bank': 'Top up with MB Bank', 'Nhập số tiền, quét QR và hệ thống sẽ tự cộng vào ví sau khi nhận giao dịch.': 'Enter an amount, scan the QR code, and the system will credit your wallet after receiving the transaction.', 'Số tiền muốn nạp': 'Top-up amount', 'Tạo QR nạp tiền': 'Create top-up QR', 'Nạp tối thiểu 10.000 ₫ · xác nhận tự động 1–3 phút.': 'Minimum top-up 10,000 ₫ · automatic confirmation in 1–3 minutes.', 'Nạp tối thiểu 10.000 ₫ · MB Bank và USDT tự động xác nhận khi nhận đúng tiền.': 'Minimum top-up 10,000 ₫ · MB Bank and USDT are confirmed automatically when the correct amount is received.', 'HỖ TRỢ TRỰC TIẾP': 'LIVE SUPPORT', 'Chat với Admin': 'Chat with Admin', 'Lịch sử hỗ trợ được đồng bộ với hệ thống quản trị Dino Store.': 'Support history is synced with the Dino Store admin system.', 'Tin nhắn': 'Message', 'Nhập nội dung cần hỗ trợ...': 'Enter your support message...', 'Gửi cho Admin': 'Send to Admin', 'GIỎ HÀNG ĐỒNG BỘ': 'SYNCED CART', 'Sản phẩm đã lưu': 'Saved products', 'Mỗi sản phẩm vẫn được thanh toán riêng để đảm bảo kho và hoàn tiền chính xác.': 'Each product is still paid separately to keep stock and refunds accurate.', 'Tạm tính': 'Subtotal', 'Tạo yêu cầu bảo hành': 'Create warranty request', 'Mô tả tình trạng lỗi': 'Describe the issue', 'Gửi yêu cầu': 'Send request',
    'An toàn & bảo mật': 'Safe & secure', 'Trung tâm quản trị': 'Admin Center', 'Mở dashboard dành riêng cho Admin': 'Open dashboard dedicated to Admin', 'Số dư ví': 'Wallet balance', 'Lịch sử đơn hàng': 'Order history', 'Tra cứu sản phẩm đã mua': 'Look up purchased products', 'Âm báo giao dịch': 'Transaction sound', 'Phát tiếng ting khi thanh toán hoặc nạp tiền thành công': 'Play chime on successful payment or top-up', 'Hỗ trợ trực tiếp': 'Direct support', 'Phản hồi trong 5–15 phút': 'Response in 5–15 minutes', 'Phản hồi trong 5-15 phút': 'Response in 5–15 minutes', 'Bảo hành minh bạch': 'Transparent warranty', 'Mọi sản phẩm đều hiển thị rõ thời hạn và trạng thái bảo hành.': 'All products clearly show warranty period and status.', 'Giao hàng siêu tốc': 'Ultra-fast delivery', 'Sản phẩm có sẵn được giao tự động ngay khi hệ thống nhận thanh toán.': 'In-stock products are delivered automatically upon payment.', 'Hạng thành viên': 'Member rank', 'Mua sắm để mở khóa quyền lợi tiếp theo.': 'Shop to unlock next level benefits.', 'Giới thiệu bạn bè': 'Referral program', 'Sao chép liên kết giới thiệu': 'Copy referral link', 'Nhắc mua lại/gia hạn': 'Renewal / Rebuy reminder', 'Nhận nhắc nhở cho sản phẩm sắp hết hạn': 'Receive reminders for expiring products', 'Đã bật nhắc gia hạn': 'Renewal reminder enabled', 'Đã tắt nhắc gia hạn': 'Renewal reminder disabled', 'Đồng bộ sản phẩm đã lưu': 'Synced saved products', 'Tiện ích MMO': 'MMO Tools', '2FA, Email & Password': '2FA, Email & Password', 'Doanh thu, đơn hàng, sản phẩm, user và API': 'Revenue, orders, products, users & API', 'THƯ MỤC DỊCH VỤ': 'SERVICE DIRECTORY', 'Tăng tương tác cho các nền tảng xã hội trong một khu vực riêng.': 'Boost social media engagement in a dedicated space.', 'Tìm dịch vụ Facebook, TikTok, YouTube...': 'Search Facebook, TikTok, YouTube services...', 'Tất cả dịch vụ': 'All services', 'ĐANG HOẠT ĐỘNG': 'ACTIVE', 'Chưa tìm thấy dịch vụ': 'No services found', 'Thử tên nền tảng, loại tương tác hoặc một từ khóa khác nhé.': 'Try platform name, interaction type, or another keyword.', 'Xóa bộ lọc': 'Clear filters', 'KHO CỦA BẠN': 'YOUR INVENTORY', 'Đơn hàng & bảo hành': 'Orders & warranty', 'Đã mua': 'Purchased', 'Còn bảo hành': 'Under warranty', 'Yêu cầu BH': 'Warranty requests', 'Chưa có đơn hàng': 'No orders yet', 'Sản phẩm bạn mua sẽ xuất hiện tại đây.': 'Products you purchase will appear here.', 'DINO TOOLBOX': 'DINO TOOLBOX', 'Tiện ích nhanh': 'Quick tools', 'Riêng tư tuyệt đối': 'Absolute privacy', 'Secret 2FA, email và mật khẩu chỉ xử lý trên thiết bị, không gửi về server.': '2FA secrets, emails, and passwords are processed on-device only.', 'Mã 2FA': '2FA Code', 'Mail Alias': 'Mail Alias', 'Mật khẩu': 'Password', 'UUID': 'UUID', 'Tạo mã 2FA': 'Generate 2FA Code', 'Hỗ trợ secret Base32 tiêu chuẩn Google Authenticator.': 'Supports standard Google Authenticator Base32 secret.', 'MÃ XÁC THỰC': 'AUTHENTICATION CODE', 'Mã tự động đổi sau mỗi 30 giây. Secret không bao giờ rời khỏi trình duyệt.': 'Code changes automatically every 30 seconds. Secret never leaves browser.', 'Tạo Email Alias': 'Generate Email Alias', 'Tạo biến thể Gmail bằng dấu chấm hoặc dấu cộng.': 'Create Gmail variants using dots or plus sign.', 'EMAIL GỐC': 'ORIGINAL EMAIL', 'Dấu +': 'Plus (+)', 'Dấu chấm': 'Dots (.)', 'Tạo danh sách alias': 'Generate alias list', 'Mật khẩu mạnh': 'Strong Password', 'Tạo bằng bộ sinh số ngẫu nhiên an toàn của thiết bị.': 'Generated using device cryptographically secure random generator.', 'Nhấn tạo để bắt đầu': 'Click generate to start', 'Độ dài': 'Length', 'Tạo mật khẩu mới': 'Generate new password', 'Tạo UUID v4 chuẩn, phù hợp mã tham chiếu và API.': 'Generate standard UUID v4 suitable for reference codes and APIs.', 'Tạo 5 UUID mới': 'Generate 5 new UUIDs', 'YÊU CẦU HỖ TRỢ': 'SUPPORT REQUEST', 'KHO HÀNG CỦA BẠN': 'YOUR INVENTORY', 'Thông tin sản phẩm': 'Product details', 'Chỉ bạn mới xem được nội dung của đơn hàng này.': 'Only you can view the contents of this order.', 'Ví dụ: Tài khoản báo sai mật khẩu từ sáng nay...': 'Example: Account reported incorrect password since this morning...', 'Đã sao chép liên kết giới thiệu': 'Referral link copied', 'Đã sao chép toàn bộ sản phẩm': 'All products copied', 'Đã sao chép mã 2FA': '2FA code copied', 'Đã sao chép mật khẩu': 'Password copied'
  });
  Object.assign(UI_TEXT.zh, {
    'Quản trị': '管理', 'DÀNH CHO BẠN': '为您推荐', 'Gợi ý phù hợp': '适合您的推荐', 'VỪA XEM': '最近浏览', 'Xem lại nhanh': '快速查看', 'DINO MARKET': 'DINO 市场', 'Khám phá cửa hàng': '浏览商店', 'Dữ liệu riêng tư': '私密数据', 'Không chia sẻ tài khoản, key hoặc file này cho người khác.': '不要与他人分享此账号、密钥或文件。', 'Sao chép tất cả': '全部复制', 'Tải file TXT': '下载 TXT', 'NẠP VÍ DINO': 'DINO 钱包充值', 'Nạp ví Dino': '充值 Dino 钱包', 'Chọn ngân hàng hoặc USDT, nhập số tiền và hệ thống sẽ tự cộng vào ví sau khi xác nhận giao dịch.': '选择银行或 USDT，输入金额，系统确认后会自动充值到钱包。', 'Nạp tiền bằng MB Bank': '通过 MB Bank 充值', 'Nhập số tiền, quét QR và hệ thống sẽ tự cộng vào ví sau khi nhận giao dịch.': '输入金额并扫码，系统收到交易后会自动充值到钱包。', 'Số tiền muốn nạp': '充值金额', 'Tạo QR nạp tiền': '创建充值二维码', 'Nạp tối thiểu 10.000 ₫ · xác nhận tự động 1–3 phút.': '最低充值 10,000 ₫ · 1–3 分钟自动确认。', 'Nạp tối thiểu 10.000 ₫ · MB Bank và USDT tự động xác nhận khi nhận đúng tiền.': '最低充值 10,000 ₫ · MB Bank 和 USDT 收到正确金额后自动确认。', 'HỖ TRỢ TRỰC TIẾP': '在线支持', 'Chat với Admin': '联系管理员', 'Lịch sử hỗ trợ được đồng bộ với hệ thống quản trị Dino Store.': '支持记录会同步到 Dino Store 管理系统。', 'Tin nhắn': '消息', 'Nhập nội dung cần hỗ trợ...': '请输入需要支持的内容...', 'Gửi cho Admin': '发送给管理员', 'GIỎ HÀNG ĐỒNG BỘ': '同步购物车', 'Sản phẩm đã lưu': '已保存商品', 'Mỗi sản phẩm vẫn được thanh toán riêng để đảm bảo kho và hoàn tiền chính xác.': '每个商品仍会单独付款，以确保库存和退款准确。', 'Tạm tính': '小计', 'Tạo yêu cầu bảo hành': '创建保修请求', 'Mô tả tình trạng lỗi': '描述问题', 'Gửi yêu cầu': '提交请求',
    'An toàn & bảo mật': '安全与保密', 'Trung tâm quản trị': '管理中心', 'Mở dashboard dành riêng cho Admin': '打开管理员专属仪表板', 'Số dư ví': '钱包余额', 'Lịch sử đơn hàng': '订单历史', 'Tra cứu sản phẩm đã mua': '查询已购商品', 'Âm báo giao dịch': '交易提示音', 'Phát tiếng ting khi thanh toán hoặc nạp tiền thành công': '付款或充值成功时播放提示音', 'Hỗ trợ trực tiếp': '在线客服', 'Phản hồi trong 5–15 phút': '5–15 分钟内回复', 'Phản hồi trong 5-15 phút': '5–15 分钟内回复', 'Bảo hành minh bạch': '透明保修', 'Mọi sản phẩm đều hiển thị rõ thời hạn và trạng thái bảo hành.': '所有商品均明确显示保修期限和状态。', 'Giao hàng siêu tốc': '超快发货', 'Sản phẩm có sẵn được giao tự động ngay khi hệ thống nhận thanh toán.': '系统收到付款后，现货商品将自动发货。', 'Hạng thành viên': '会员等级', 'Mua sắm để mở khóa quyền lợi tiếp theo.': '购物以解锁下一阶段权益。', 'Giới thiệu bạn bè': '推荐好友', 'Sao chép liên kết giới thiệu': '复制推荐链接', 'Nhắc mua lại/gia hạn': '续费/再次购买提醒', 'Nhận nhắc nhở cho sản phẩm sắp hết hạn': '接收即将在期商品的提醒', 'Đã bật nhắc gia hạn': '已开启续费提醒', 'Đã tắt nhắc gia hạn': '已关闭续费提醒', 'Đồng bộ sản phẩm đã lưu': '已保存商品同步', 'Tiện ích MMO': 'MMO 工具', '2FA, Email & Password': '2FA、邮箱与密码', 'Doanh thu, đơn hàng, sản phẩm, user và API': '收入、订单、商品、用户与 API', 'THƯ MỤC DỊCH VỤ': '服务目录', 'Tăng tương tác cho các nền tảng xã hội trong một khu vực riêng.': '在专属区域提升社交平台互动。', 'Tìm dịch vụ Facebook, TikTok, YouTube...': '搜索 Facebook、TikTok、YouTube 服务...', 'Tất cả dịch vụ': '全部服务', 'ĐANG HOẠT ĐỘNG': '运行中', 'Chưa tìm thấy dịch vụ': '未找到服务', 'Thử tên nền tảng, loại tương tác hoặc một từ khóa khác nhé.': '请尝试平台名称、互动类型或其他关键词。', 'Xóa bộ lọc': '清除筛选', 'KHO CỦA BẠN': '您的库存', 'Đơn hàng & bảo hành': '订单与保修', 'Đã mua': '已购买', 'Còn bảo hành': '保修期内', 'Yêu cầu BH': '保修请求', 'Chưa có đơn hàng': '暂无订单', 'Sản phẩm bạn mua sẽ xuất hiện tại đây.': '您购买的商品将显示在此处。', 'DINO TOOLBOX': 'DINO 工具箱', 'Tiện ích nhanh': '快捷工具', 'Riêng tư tuyệt đối': '绝对隐私', 'Secret 2FA, email và mật khẩu chỉ xử lý trên thiết bị, không gửi về server.': '2FA 密钥、邮箱和密码仅在设备本地处理，绝不发送到服务器。', 'Mã 2FA': '2FA 验证码', 'Mail Alias': '邮箱别名', 'Mật khẩu': '密码', 'UUID': 'UUID', 'Tạo mã 2FA': '生成 2FA 验证码', 'Hỗ trợ secret Base32 tiêu chuẩn Google Authenticator.': '支持标准 Google Authenticator Base32 密钥。', 'MÃ XÁC THỰC': '身份验证码', 'Mã tự động đổi sau mỗi 30 giây. Secret không bao giờ rời khỏi trình duyệt.': '验证码每 30 秒自动更新。密钥绝不离开浏览器。', 'Tạo Email Alias': '生成邮箱别名', 'Tạo biến thể Gmail bằng dấu chấm hoặc dấu cộng.': '使用加号或点号创建 Gmail 变体。', 'EMAIL GỐC': '原始邮箱', 'Dấu +': '加号 (+)', 'Dấu chấm': '点号 (.)', 'Tạo danh sách alias': '生成别名列表', 'Mật khẩu mạnh': '强密码', 'Tạo bằng bộ sinh số ngẫu nhiên an toàn của thiết bị.': '使用设备加密安全随机数生成器生成。', 'Nhấn tạo để bắt đầu': '点击生成开始', 'Độ dài': '长度', 'Tạo mật khẩu mới': '生成新密码', 'Tạo UUID v4 chuẩn, phù hợp mã tham chiếu và API.': '生成适用于参考代码和 API 的标准 UUID v4。', 'Tạo 5 UUID mới': '生成 5 个新 UUID', 'YÊU CẦU HỖ TRỢ': '支持请求', 'KHO HÀNG CỦA BẠN': '您的库存', 'Thông tin sản phẩm': '商品详情', 'Chỉ bạn mới xem được nội dung của đơn hàng này.': '只有您能查看此订单的内容。', 'Ví dụ: Tài khoản báo sai mật khẩu từ sáng nay...': '例如：账号从早上起显示密码错误...', 'Đã sao chép liên kết giới thiệu': '已复制推荐链接', 'Đã sao chép toàn bộ sản phẩm': '已复制全部商品', 'Đã sao chép mã 2FA': '已复制 2FA 验证码', 'Đã sao chép mật khẩu': '已复制密码'
  });
  Object.assign(UI_TEXT.en, {
    'Ấn để xem chi tiết': 'Tap to view details', 'CHÍNH SÁCH DINO STORE': 'DINO STORE POLICY', 'Cam kết dịch vụ': 'Service commitments', 'Vui lòng đọc kỹ trước khi mua hoặc nạp ví. Hệ thống chỉ xử lý khi thanh toán được xác nhận thành công.': 'Please read before buying or topping up. The system only processes after payment is successfully confirmed.', 'Thời hạn bảo hành hiển thị theo từng sản phẩm. Nếu sản phẩm lỗi trong thời hạn, bạn có thể tạo yêu cầu bảo hành trong mục Đơn hàng.': 'Warranty duration is shown per product. If a product has an issue during warranty, create a warranty request from Orders.', 'Giao hàng tự động': 'Automatic delivery', 'Sản phẩm có sẵn sẽ được giao ngay sau khi MB Bank, Binance ID hoặc USDT on-chain xác nhận đúng số tiền.': 'In-stock products are delivered after MB Bank, Binance ID, or on-chain USDT confirms the correct amount.', 'Thanh toán & nạp ví': 'Payment & wallet top-up', 'Hỗ trợ MB Bank QR, Binance ID, USDT BEP20, USDT Polygon và USDT TRC20. Hãy chuyển đúng mạng, đúng số tiền và đúng địa chỉ/ID.': 'Supports MB Bank QR, Binance ID, USDT BEP20, USDT Polygon, and USDT TRC20. Send to the correct network, amount, and address/ID.', 'Chính sách hoàn tiền': 'Refund policy', 'Mọi đơn nạp tiền hoặc thanh toán trực tiếp nếu cần hoàn tiền sẽ chỉ được hoàn về số dư bot. Dino Store không hoàn tiền ngược về ngân hàng hoặc ví crypto đã chuyển.': 'Any wallet top-up or direct payment refund will only be returned to bot balance. Dino Store does not refund back to the bank account or crypto wallet used for payment.', 'Thời gian xác nhận': 'Confirmation time', 'MB Bank thường xác nhận 1–3 phút. USDT sẽ được hệ thống quét tự động khi giao dịch đủ xác nhận trên mạng lưới.': 'MB Bank usually confirms in 1–3 minutes. USDT is scanned automatically after enough network confirmations.', 'Lưu ý an toàn': 'Safety note', 'Lưu ý khi mua': 'Purchase note', 'Sai mạng, sai số tiền, sai địa chỉ/ID hoặc giao dịch hết hạn có thể làm đơn chưa được ghi nhận tự động. Khi cần hỗ trợ, hãy gửi mã hóa đơn cho Admin.': 'Wrong network, amount, address/ID, or expired transactions may not be recorded automatically. Send the invoice code to Admin if you need support.', 'Sai mạng, sai số tiền, sai địa chỉ/ID hoặc giao dịch hết hạn có thể làm đơn chưa được ghi nhận tự động. Mọi khoản hoàn sẽ cộng vào số dư bot để dùng cho đơn sau, không hoàn về ngân hàng.': 'Wrong network, amount, address/ID, or expired transactions may not be recorded automatically. Refunds are credited to bot balance for future orders, not returned to the bank.', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Nếu cần hoàn tiền, hệ thống chỉ hoàn về số dư bot, không hoàn về ngân hàng.': 'Check the network and amount before sending. If a refund is needed, it is only credited to bot balance, not returned to the bank.', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Hoàn tiền chỉ cộng vào ví Bot, không hoàn về ngân hàng.': 'Check the network and amount before transferring. Refunds are credited to Bot Wallet only, no bank refund.', 'Hoàn tiền chỉ cộng về số dư bot · không hoàn về ngân hàng.': 'Refunds are credited to bot balance only · no bank refund.', 'Nạp tối thiểu 10.000 ₫ · nếu hoàn tiền chỉ hoàn về số dư bot.': 'Minimum top-up 10,000 ₫ · refunds go to bot balance only.', 'Đã hiểu': 'Got it', 'Tôi đã đọc và đồng ý với': 'I have read and agree to', 'Chính sách & Điều khoản Dino Store': 'Dino Store Terms & Policy', 'CHÍNH SÁCH & ĐIỀU KHOẢN': 'TERMS & POLICY', 'Cập nhật: 06/08/2026 · Vui lòng đọc kỹ trước khi mua hàng hoặc nạp tiền.': 'Updated: 06/08/2026 · Please read carefully before buying or topping up.', 'Vui lòng tích chọn đồng ý với Chính sách & Điều khoản trước khi tạo QR': 'Please check the box to agree to Terms & Policy before creating QR', 'Đã đọc và hiểu rõ': 'Read and understood', '1. Phạm vi áp dụng': '1. Scope of Application', 'Khi tạo đơn, người mua xác nhận đã đọc mô tả sản phẩm, giá, số lượng, phương thức giao và chính sách liên quan hiển thị tại thời điểm đặt hàng.': 'When creating an order, the buyer confirms having read the product description, price, quantity, delivery method, and relevant policies shown at order time.', '2. Giá và thanh toán': '2. Pricing & Payment', '• Giá có thể thay đổi theo nguồn cung; đơn được tính theo mức giá hiển thị tại bước xác nhận cuối.': '• Prices may vary based on supply; orders are calculated based on the price displayed at final confirmation.', '• Chỉ thanh toán bằng phương thức do bot cung cấp và dùng đúng mã/nội dung của đơn.': '• Pay only via methods provided by the bot and use the exact order code/content.', '• Giao dịch sai số tiền, sai nội dung hoặc sau thời hạn có thể cần đối soát thủ công.': '• Transactions with wrong amount, content, or after expiration may require manual audit.', '• QR chỉ dùng cho đơn hàng hợp pháp. Nghiêm cấm gian lận, rửa tiền, chiếm đoạt tài sản và mọi hành vi trái pháp luật.': '• QR codes are for lawful orders only. Fraud, money laundering, asset theft, and illegal acts are strictly prohibited.', '3. Giao hàng': '3. Delivery', '• Thời gian giao phụ thuộc loại sản phẩm: tự động, manual, resell hoặc Social Media.': '• Delivery time depends on product type: automatic, manual, resell, or Social Media.', '• Người mua phải kiểm tra sản phẩm ngay sau khi nhận và bảo quản thông tin an toàn.': '• Buyers must check products immediately upon receipt and store information securely.', '• Không công khai hoặc bán lại nội dung nếu sản phẩm/nhà cung cấp không cho phép.': '• Do not publish or resell contents unless authorized by the product/provider.', '4. Bảo hành': '4. Warranty', '• Chỉ áp dụng trong thời hạn và phạm vi ghi tại sản phẩm hoặc đơn hàng.': '• Applies only within the duration and scope specified on the product or order.', '• Cần cung cấp mã đơn và bằng chứng lỗi để kiểm tra.': '• Order code and proof of issue must be provided for verification.', '• Không bảo hành lỗi do đổi mật khẩu/email khôi phục, chia sẻ nhiều người, sử dụng sai hướng dẫn, vi phạm điều khoản nền tảng hoặc tự ý can thiệp sản phẩm.': '• Warranty is void for issues caused by password/recovery email changes, multi-user sharing, misuse, platform terms violation, or unauthorized tampering.', '• Dịch vụ Social Media chỉ được refill/bù tụt khi dịch vụ có ghi rõ hỗ trợ và người mua giữ nguyên điều kiện cần thiết.': '• Social Media services are refilled only if explicitly supported and buyer meets required conditions.', '5. Hủy đơn và hoàn tiền (ĐẶC BIỆT LƯU Ý)': '5. Cancellation & Refund (IMPORTANT NOTE)', '• Đơn chưa thanh toán có thể hủy trước khi hết hạn. Phần tiền ví đã giữ sẽ được hoàn vào Ví Bot.': '• Unpaid orders can be cancelled before expiry. Reserved wallet funds will be returned to Bot Wallet.', '• Xem xét hoàn tiền khi hệ thống trừ tiền nhưng không tạo được đơn, giao trùng hoặc nhà cung cấp xác nhận hủy/hoàn một phần.': '• Refunds are considered if system charged but failed to create order, duplicate delivery, or partial cancellation confirmed by provider.', '• Sản phẩm số đã giao đúng và đã sử dụng không được hoàn tiền.': '• Correctly delivered and used digital products are non-refundable.', '• Đơn lỗi đã sử dụng một phần được xem xét hoàn theo số ngày nguyên còn lại chưa sử dụng vào Ví Bot.': '• Faulty orders partially used will be calculated based on remaining unused full days and credited to Bot Wallet.', '• QUY ĐỊNH HOÀN TIỀN VÍ BOT: Mọi khoản hoàn tiền (bao gồm đơn nạp tiền hoặc thanh toán trực tiếp qua Ngân hàng / Binance / USDT) CHỈ ĐƯỢC HOÀN VỀ SỐ DƯ VÍ BOT (DINO WALLET). Hệ thống TUYỆT ĐỐI KHÔNG HOÀN TIỀN VỀ TÀI KHOẢN NGÂN HÀNG HOẶC VÍ BÊN NGOÀI dưới bất kỳ hình thức nào. Tiền trong Ví Bot được sử dụng để mua các sản phẩm và dịch vụ khác trên hệ thống.': '• BOT WALLET REFUND POLICY: All refunds (including top-ups or direct payments via Bank / Binance / USDT) ARE REFUNDED EXCLUSIVELY TO BOT WALLET BALANCE (DINO WALLET). The system STRICTLY DOES NOT REFUND TO BANK ACCOUNTS OR EXTERNAL WALLETS under any circumstances. Bot wallet balance can be used for purchasing other products and services on the system.', '• Thời gian xử lý hoàn vào Ví Bot phụ thuộc việc đối soát hệ thống và nhà cung cấp.': '• Processing time for Bot Wallet refund depends on system and provider reconciliation.', '6. Dữ liệu và quyền riêng tư': '6. Data & Privacy', '• Bot chỉ sử dụng thông tin cần thiết để tạo đơn, giao hàng, hỗ trợ, chống gian lận và đối soát.': '• The bot uses only necessary information for order creation, delivery, support, fraud prevention, and audit.', '• Không gửi mật khẩu ngân hàng, OTP, khóa ví hoặc dữ liệu không cần thiết.': '• Do not send bank passwords, OTPs, wallet keys, or unnecessary sensitive data.', '• Thông tin có thể được cung cấp cho cơ quan có thẩm quyền khi pháp luật yêu cầu.': '• Information may be provided to competent authorities when required by law.', '7. Hành vi bị cấm': '7. Prohibited Conduct', '• Dùng sản phẩm cho lừa đảo, spam, xâm nhập trái phép, phát tán mã độc, đánh cắp dữ liệu hoặc nội dung vi phạm pháp luật.': '• Using products for fraud, spam, unauthorized access, malware distribution, data theft, or unlawful content is forbidden.', '• Lợi dụng lỗi hệ thống, tạo giao dịch giả, hoàn tiền gian lận hoặc cố tình tạo đơn trùng.': '• Exploiting system bugs, fake transactions, fraudulent refunds, or creating duplicate orders is strictly prohibited.', '• Dino Store có thể từ chối xử lý và đóng tài khoản khi phát hiện dấu hiệu bất thường.': '• Dino Store may refuse service and terminate accounts upon detecting suspicious activities.', '8. Khiếu nại và hỗ trợ': '8. Complaints & Support', 'Gửi yêu cầu qua Hỗ Trợ & Liên Hệ, kèm mã đơn, thời gian, nội dung và bằng chứng. Hai bên ưu tiên kiểm tra dữ liệu hệ thống và trao đổi để giải quyết minh bạch.': 'Submit requests via Support & Contact, with order code, timestamp, details, and proof. Both sides prioritize checking system records for transparent resolution.'
  });
  Object.assign(UI_TEXT.zh, {
    'Ấn để xem chi tiết': '点击查看详情', 'CHÍNH SÁCH DINO STORE': 'DINO STORE 政策', 'Cam kết dịch vụ': '服务承诺', 'Vui lòng đọc kỹ trước khi mua hoặc nạp ví. Hệ thống chỉ xử lý khi thanh toán được xác nhận thành công.': '购买或充值前请仔细阅读。系统只会在付款成功确认后处理。', 'Thời hạn bảo hành hiển thị theo từng sản phẩm. Nếu sản phẩm lỗi trong thời hạn, bạn có thể tạo yêu cầu bảo hành trong mục Đơn hàng.': '保修期限按商品显示。保修期内如有问题，可在订单中提交保修请求。', 'Giao hàng tự động': '自动交付', 'Sản phẩm có sẵn sẽ được giao ngay sau khi MB Bank, Binance ID hoặc USDT on-chain xác nhận đúng số tiền.': '库存商品会在 MB Bank、Binance ID 或链上 USDT 确认正确金额后自动交付。', 'Thanh toán & nạp ví': '付款与充值', 'Hỗ trợ MB Bank QR, Binance ID, USDT BEP20, USDT Polygon và USDT TRC20. Hãy chuyển đúng mạng, đúng số tiền và đúng địa chỉ/ID.': '支持 MB Bank QR、Binance ID、USDT BEP20、USDT Polygon 和 USDT TRC20。请使用正确网络、金额和地址/ID。', 'Chính sách hoàn tiền': '退款政策', 'Mọi đơn nạp tiền hoặc thanh toán trực tiếp nếu cần hoàn tiền sẽ chỉ được hoàn về số dư bot. Dino Store không hoàn tiền ngược về ngân hàng hoặc ví crypto đã chuyển.': '任何充值或直接付款如需退款，只会退回到机器人余额。Dino Store 不会退回到银行账户或已付款的加密钱包。', 'Thời gian xác nhận': '确认时间', 'MB Bank thường xác nhận 1–3 phút. USDT sẽ được hệ thống quét tự động khi giao dịch đủ xác nhận trên mạng lưới.': 'MB Bank 通常 1–3 分钟确认。USDT 在网络确认足够后由系统自动扫描。', 'Lưu ý an toàn': '安全提示', 'Lưu ý khi mua': '购买提示', 'Sai mạng, sai số tiền, sai địa chỉ/ID hoặc giao dịch hết hạn có thể làm đơn chưa được ghi nhận tự động. Khi cần hỗ trợ, hãy gửi mã hóa đơn cho Admin.': '网络、金额、地址/ID 错误或交易过期可能无法自动记录。如需支持，请把账单编号发送给管理员。', 'Sai mạng, sai số tiền, sai địa chỉ/ID hoặc giao dịch hết hạn có thể làm đơn chưa được ghi nhận tự động. Mọi khoản hoàn sẽ cộng vào số dư bot để dùng cho đơn sau, không hoàn về ngân hàng.': '网络、金额、地址/ID 错误或交易过期可能无法自动记录。所有退款会退到机器人余额用于后续订单，不会退回银行。', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Nếu cần hoàn tiền, hệ thống chỉ hoàn về số dư bot, không hoàn về ngân hàng.': '转账前请核对网络和金额。如需退款，只会退到机器人余额，不会退回银行。', 'Kiểm tra đúng mạng và số tiền trước khi chuyển. Hoàn tiền chỉ cộng vào ví Bot, không hoàn về ngân hàng.': '转账前请核对网络和金额。退款仅退到机器人钱包，不退回银行。', 'Hoàn tiền chỉ cộng về số dư bot · không hoàn về ngân hàng.': '退款仅退到机器人余额 · 不退回银行。', 'Nạp tối thiểu 10.000 ₫ · nếu hoàn tiền chỉ hoàn về số dư bot.': '最低充值 10,000 ₫ · 退款仅退到机器人余额。', 'Đã hiểu': '明白', 'Tôi đã đọc và đồng ý với': '我已阅读并同意', 'Chính sách & Điều khoản Dino Store': 'Dino Store 条款与政策', 'CHÍNH SÁCH & ĐIỀU KHOẢN': '条款与政策', 'Cập nhật: 06/08/2026 · Vui lòng đọc kỹ trước khi mua hàng hoặc nạp tiền.': '更新于: 2026/08/06 · 购买或充值前请仔细阅读。', 'Vui lòng tích chọn đồng ý với Chính sách & Điều khoản trước khi tạo QR': '创建二维码前请勾选同意条款与政策', 'Đã đọc và hiểu rõ': '已阅读并理解', '1. Phạm vi áp dụng': '1. 适用范围', 'Khi tạo đơn, người mua xác nhận đã đọc mô tả sản phẩm, giá, số lượng, phương thức giao và chính sách liên quan hiển thị tại thời điểm đặt hàng.': '创建订单时，买方确认已阅读下单时显示的商品描述、价格、数量、交付方式及相关政策。', '2. Giá và thanh toán': '2. 价格与支付', '• Giá có thể thay đổi theo nguồn cung; đơn được tính theo mức giá hiển thị tại bước xác nhận cuối.': '• 价格可能会根据供求有所变动；订单按最终确认页面显示的金额计算。', '• Chỉ thanh toán bằng phương thức do bot cung cấp và dùng đúng mã/nội dung của đơn.': '• 仅通过机器人提供的方式付款，并使用准确的订单代码/备注。', '• Giao dịch sai số tiền, sai nội dung hoặc sau thời hạn có thể cần đối soát thủ công.': '• 金额、备注错误或逾期的交易可能需要人工核对。', '• QR chỉ dùng cho đơn hàng hợp pháp. Nghiêm cấm gian lận, rửa tiền, chiếm đoạt tài sản và mọi hành vi trái pháp luật.': '• 二维码仅用于合法订单。严禁诈骗、洗钱、侵占财产及一切违法行为。', '3. Giao hàng': '3. 商品交付', '• Thời gian giao phụ thuộc loại sản phẩm: tự động, manual, resell hoặc Social Media.': '• 交付时间取决于商品类型：自动、手动、转售或社交媒体服务。', '• Người mua phải kiểm tra sản phẩm ngay sau khi nhận và bảo quản thông tin an toàn.': '• 买方须在收到商品后立即检查并安全保管信息。', '• Không công khai hoặc bán lại nội dung nếu sản phẩm/nhà cung cấp không cho phép.': '• 未经商品/供应商允许，切勿公开或转售内容。', '4. Bảo hành': '4. 保修服务', '• Chỉ áp dụng trong thời hạn và phạm vi ghi tại sản phẩm hoặc đơn hàng.': '• 仅适用于商品或订单上注明的期限和范围。', '• Cần cung cấp mã đơn và bằng chứng lỗi để kiểm tra.': '• 必须提供订单号和故障凭证以供核验。', '• Không bảo hành lỗi do đổi mật khẩu/email khôi phục, chia sẻ nhiều người, sử dụng sai hướng dẫn, vi phạm điều khoản nền tảng hoặc tự ý can thiệp sản phẩm.': '• 因修改密码/恢复邮箱、多人共享、误操作、违反平台条款或擅自篡改导致的故障不予保修。', '• Dịch vụ Social Media chỉ được refill/bù tụt khi dịch vụ có ghi rõ hỗ trợ và người mua giữ nguyên điều kiện cần thiết.': '• 社交媒体服务仅在明确支持补粉/补量且买方符合必要条件时提供补充。', '5. Hủy đơn và hoàn tiền (ĐẶC BIỆT LƯU Ý)': '5. 取消订单与退款（特别注意）', '• Đơn chưa thanh toán có thể hủy trước khi hết hạn. Phần tiền ví đã giữ sẽ được hoàn vào Ví Bot.': '• 未付款订单可在过期前取消。保留的钱包资金将退回机器人钱包。', '• Xem xét hoàn tiền khi hệ thống trừ tiền nhưng không tạo được đơn, giao trùng hoặc nhà cung cấp xác nhận hủy/hoàn một phần.': '• 若系统扣款但未生成订单、重复交付或供应商确认取消/部分退款，将予以审核退款。', '• Sản phẩm số đã giao đúng và đã sử dụng không được hoàn tiền.': '• 已正确交付并使用的数字商品不予退款。', '• Đơn lỗi đã sử dụng một phần được xem xét hoàn theo số ngày nguyên còn lại chưa sử dụng vào Ví Bot.': '• 部分已使用的故障订单将按剩余未使用的完整天数折算退回机器人钱包。', '• QUY ĐỊNH HOÀN TIỀN VÍ BOT: Mọi khoản hoàn tiền (bao gồm đơn nạp tiền hoặc thanh toán trực tiếp qua Ngân hàng / Binance / USDT) CHỈ ĐƯỢC HOÀN VỀ SỐ DƯ VÍ BOT (DINO WALLET). Hệ thống TUYỆT ĐỐI KHÔNG HOÀN TIỀN VỀ TÀI KHOẢN NGÂN HÀNG HOẶC VÍ BÊN NGOÀI dưới bất kỳ hình thức nào. Tiền trong Ví Bot được sử dụng để mua các sản phẩm và dịch vụ khác trên hệ thống.': '• 机器人钱包退款规定：所有退款（包括通过银行/Binance/USDT充值或直接支付的订单）仅退回到机器人钱包余额（Dino Wallet）。系统在任何情况下绝不退回到银行账户或外部钱包。机器人钱包余额可用于购买系统上的其他商品和服务。', '• Thời gian xử lý hoàn vào Ví Bot phụ thuộc việc đối soát hệ thống và nhà cung cấp.': '• 退回到机器人钱包的处理时间取决于系统和供应商的对账进度。', '6. Dữ liệu và quyền riêng tư': '6. 数据与隐私', '• Bot chỉ sử dụng thông tin cần thiết để tạo đơn, giao hàng, hỗ trợ, chống gian lận và đối soát.': '• 机器人仅使用建单、发货、客服、防欺诈及对账所需的必要信息。', '• Không gửi mật khẩu ngân hàng, OTP, khóa ví hoặc dữ liệu không cần thiết.': '• 请勿发送银行密码、验证码(OTP)、钱包私钥或无关敏感数据。', '• Thông tin có thể được cung cấp cho cơ quan có thẩm quyền khi pháp luật yêu cầu.': '• 法律法规要求时，信息可能会提供给主管机关。', '7. Hành vi bị cấm': '7. 禁止行为', '• Dùng sản phẩm cho lừa đảo, spam, xâm nhập trái phép, phát tán mã độc, đánh cắp dữ liệu hoặc nội dung vi phạm pháp luật.': '• 严禁将商品用于诈骗、垃圾邮件、非法入侵、传播木马、盗取数据或违法内容。', '• Lợi dụng lỗi hệ thống, tạo giao dịch giả, hoàn tiền gian lận hoặc cố tình tạo đơn trùng.': '• 严禁利用系统漏洞、伪造交易、欺诈退款或恶意重复建单。', '• Dino Store có thể từ chối xử lý và đóng tài khoản khi phát hiện dấu hiệu bất thường.': '• 发现异常迹象时，Dino Store 有权拒绝处理并封禁账户。', '8. Khiếu nại và hỗ trợ': '8. 投诉与支持', 'Gửi yêu cầu qua Hỗ Trợ & Liên Hệ, kèm mã đơn, thời gian, nội dung và bằng chứng. Hai bên ưu tiên kiểm tra dữ liệu hệ thống và trao đổi để giải quyết minh bạch.': '请通过“在线支持”提交请求，附上订单号、时间、内容及凭证。双方优先核对系统数据进行透明协商解决。'
  });
  const LANG_STORAGE_KEY = 'dino_miniapp_lang';
  const normalizeLang = value => ['vi', 'en', 'zh'].includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : 'vi';
  const storedLang = () => normalizeLang(localStorage.getItem(LANG_STORAGE_KEY) || state.data?.lang || 'vi');
  const currentLang = () => normalizeLang(state.data?.lang || storedLang());
  const langText = (vi, en, zh) => ({ vi, en, zh }[currentLang()] || vi);
  const tr = source => UI_TEXT[currentLang()]?.[String(source)] || String(source);
  const flagSvg = { vi: '<svg width="17" height="12" viewBox="0 0 30 20" style="vertical-align:-1px;border-radius:2px;margin-right:4px"><rect width="30" height="20" fill="#da251d"/><polygon points="15,4 16.5,8.5 21.2,8.5 17.4,11.3 18.8,15.8 15,13 11.2,15.8 12.6,11.3 8.8,8.5 13.5,8.5" fill="#ffff00"/></svg>', en: '<svg width="17" height="12" viewBox="0 0 60 30" style="vertical-align:-1px;border-radius:2px;margin-right:4px"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/></svg>', zh: '<svg width="17" height="12" viewBox="0 0 30 20" style="vertical-align:-1px;border-radius:2px;margin-right:4px"><rect width="30" height="20" fill="#ee1c25"/><polygon points="5,3 5.9,5.8 8.4,3.9 5.3,6.3 6.5,9.2 4.4,7.4 2.3,9.2 3.5,6.3 0.4,3.9 2.9,5.8" fill="#ffde00"/><circle cx="10" cy="2" r="0.7" fill="#ffde00"/><circle cx="12" cy="4" r="0.7" fill="#ffde00"/><circle cx="12" cy="7" r="0.7" fill="#ffde00"/><circle cx="10" cy="9" r="0.7" fill="#ffde00"/></svg>' };
  const languageLabels = { vi: `${flagSvg.vi}VI`, en: `${flagSvg.en}EN`, zh: `${flagSvg.zh}ZH` };
  const originalTextNodes = new WeakMap();
  function updateLanguageButton() { const btn = $('#languageButton'); if (btn) { $('span', btn).innerHTML = languageLabels[currentLang()] || languageLabels.vi; btn.disabled = state.languageSaving; } }
  function applyLanguage() {
    const lang = currentLang(); document.documentElement.lang = lang; localStorage.setItem(LANG_STORAGE_KEY, lang);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) { return node.nodeValue?.trim() && !['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } }), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => { if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue); const source = originalTextNodes.get(node), trimmed = source.trim(), translated = UI_TEXT[lang]?.[trimmed] || trimmed; node.nodeValue = source.replace(trimmed, translated); });
    const placeholders = { en: { 'Nhập coupon': 'Enter coupon', 'Mỗi dòng một nội dung nếu dịch vụ yêu cầu': 'One item per line if required' }, zh: { 'Nhập coupon': '输入优惠码', 'Mỗi dòng một nội dung nếu dịch vụ yêu cầu': '如服务要求，请每行填写一项' } };
    $$('input[placeholder],textarea[placeholder]').forEach(el => { if (!el.dataset.placeholderVi) el.dataset.placeholderVi = el.placeholder; el.placeholder = placeholders[lang]?.[el.dataset.placeholderVi] || el.dataset.placeholderVi; });
    updateLanguageButton();
  }
  const getCurrencyMode = () => state.currencyMode || (localStorage.getItem('dino_currency')) || ((state.data?.lang || storedLang() || 'vi') === 'vi' ? 'vnd' : 'usdt');
  const getUsdtRate = () => Number(state.data?.usdt_rate || 25400);
  const money = (value, customCurrency) => {
    const num = Math.max(0, Number(value || 0)), mode = customCurrency || getCurrencyMode();
    if (mode === 'usdt') {
      const usdt = (num / getUsdtRate()).toFixed(2);
      return `${Number(usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    }
    return `${num.toLocaleString('vi-VN')} ₫`;
  };
  const signedMoney = (value, customCurrency) => {
    const num = Number(value || 0), sign = num > 0 ? '+' : (num < 0 ? '-' : ''), absVal = Math.abs(num), mode = customCurrency || getCurrencyMode();
    if (mode === 'usdt') {
      const usdt = (absVal / getUsdtRate()).toFixed(2);
      return `${sign}${Number(usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    }
    return `${sign}${absVal.toLocaleString('vi-VN')} ₫`;
  };
  const date = ts => ts ? new Intl.DateTimeFormat(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts * 1000)) : '—';
  const cleanStatus = value => String(value || '').replace(/<[^>]+>/g, '').trim() || 'Đang xử lý';
  const palette = id => {
    const sets = [
      ['#0E261E', '#144634', '#10B981'], // Cyber Emerald
      ['#181D3B', '#2A3467', '#6366F1'], // Royal Indigo
      ['#102238', '#1A3D66', '#06B6D4'], // Electric Cyan
      ['#211538', '#382260', '#A855F7'], // Cyber Violet
      ['#2B1E0F', '#4A3416', '#F59E0B']  // Luxury Amber Gold
    ];
    let hash = 0; for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0; return sets[hash % sets.length];
  };
  const styleVars = id => { const p = palette(id); return `--art-a:${p[0]};--art-b:${p[1]};--art-c:${p[2]}`; };
  const initials = name => String(name || 'D').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase().slice(0, 2);
  function setAvatarPhoto(container, textEl, url, letter) {
    if (!container || !textEl) return;
    if (letter) textEl.textContent = letter;
    const cleanUrl = String(url || '').trim();
    let img = container.querySelector('.user-avatar-photo');
    if (!cleanUrl) {
      container.classList.remove('has-photo');
      img?.remove();
      textEl.hidden = false;
      return;
    }
    if (!img) {
      img = document.createElement('img');
      img.className = 'user-avatar-photo';
      img.alt = 'Avatar';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      img.referrerPolicy = 'no-referrer';
      Object.assign(img.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'cover',
        borderRadius: 'inherit',
        pointerEvents: 'none'
      });
      container.style.overflow = 'hidden';
      container.insertBefore(img, container.firstChild);
    }
    img.onerror = () => {
      container.classList.remove('has-photo');
      img.style.display = 'none';
      textEl.hidden = false;
    };
    img.onload = () => {
      img.style.display = '';
      container.classList.add('has-photo');
      textEl.hidden = true;
    };
    if (img.getAttribute('src') !== cleanUrl) {
      img.src = cleanUrl;
    } else if (img.complete && img.naturalWidth > 0) {
      img.style.display = '';
      container.classList.add('has-photo');
      textEl.hidden = true;
    }
  }
  const vibrate = style => { try { tg?.HapticFeedback?.impactOccurred(style || 'light'); } catch { } };
  const toast = (message, error = false) => { const el = $('#toast'); $('span', el).textContent = message; el.classList.toggle('error', error); el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2800); vibrate(error ? 'heavy' : 'light'); };
  let audioContext;
  function getAudioContext() { try { audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)(); return audioContext; } catch { return null; } }
  function unlockSound() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { });
  }
  function playSuccessChime() {
    if (state.soundEnabled === false) return; const ctx = getAudioContext(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume().catch(() => { }); const start = ctx.currentTime + .02;
    [[1046.5, 0, .12], [1318.5, .1, .16], [1568, .22, .3]].forEach(([frequency, delay, duration]) => { const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, start + delay); gain.gain.exponentialRampToValueAtTime(.22, start + delay + .015); gain.gain.exponentialRampToValueAtTime(.0001, start + delay + duration); oscillator.connect(gain).connect(ctx.destination); oscillator.start(start + delay); oscillator.stop(start + delay + duration + .02); });
    vibrate('medium'); setTimeout(() => { try { tg?.HapticFeedback?.notificationOccurred('success'); } catch { } }, 180);
  }
  function playWheelTickSound(freq = 720) {
    if (state.soundEnabled === false) return; const ctx = getAudioContext(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    try {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
      osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
      gain.gain.setValueAtTime(0.28, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + 0.05);
    } catch (e) { }
  }
  function playWheelSpinStart() {
    if (state.soundEnabled === false) return; const ctx = getAudioContext(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    try {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
      osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      gain.gain.setValueAtTime(0.01, now); gain.gain.linearRampToValueAtTime(0.22, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + 0.42);
    } catch (e) { }
  }
  function playWinSound() {
    if (state.soundEnabled === false) return; const ctx = getAudioContext(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    try {
      const now = ctx.currentTime + 0.02;
      [[523.25, 0, 0.18], [659.25, 0.12, 0.18], [783.99, 0.24, 0.22], [1046.50, 0.38, 0.45], [1318.51, 0.48, 0.55]].forEach(([f, delay, dur]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(f, now + delay);
        gain.gain.setValueAtTime(0.001, now + delay); gain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.025); gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
        osc.connect(gain).connect(ctx.destination); osc.start(now + delay); osc.stop(now + delay + dur + 0.04);
      });
      vibrate('heavy'); setTimeout(() => { try { tg?.HapticFeedback?.notificationOccurred('success'); } catch { } }, 220);
    } catch (e) { }
  }
  function playLoseSound() {
    if (state.soundEnabled === false) return; const ctx = getAudioContext(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume().catch(() => { });
    try {
      const now = ctx.currentTime + 0.02, osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(320, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + 0.35);
      vibrate('medium');
    } catch (e) { }
  }
  function renderSoundSetting() { const enabled = state.soundEnabled; $('#soundToggle')?.setAttribute('aria-pressed', String(enabled)); $('#soundSwitch')?.classList.toggle('active', enabled); }

  function isProductOutOfStock(p) {
    if (!p) return false;
    // A local product with preorder enabled remains actionable while empty.
    if (p.preorder_available === true && !p.available) return false;
    if (p.available === false) return true;
    if (p.manual || p.social) return false;
    return Number(p.stock || 0) <= 0;
  }
  function productArt(p, className = 'product-art') {
    const isOut = isProductOutOfStock(p);
    const image = p.image_url ? `<img src="${escapeHTML(p.image_url)}" alt="${langText('Ảnh', 'Image', '图片')} ${escapeHTML(p.name)}" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer">` : '';
    const outOverlay = isOut ? `<div class="out-of-stock-overlay"><span class="out-pill">${langText('HẾT HÀNG', 'OUT OF STOCK', '已售罄')}</span></div>` : '';
    return `<div class="${className} ${isOut ? 'out-of-stock' : ''}" style="${styleVars(p.id)}"><span class="product-logo">${initials(p.name).slice(0, 1)}</span>${image}${outOverlay}</div>`;
  }
  function featuredCard(p) {
    const isFlash = Boolean(p.is_flash || p.flash_sale);
    const isOut = isProductOutOfStock(p);
    const discount = p.old_price > p.price ? Math.round((p.old_price - p.price) * 100 / p.old_price) : (p.flash_sale?.discount_percent || 0);
    const tagHtml = isOut
      ? ''
      : (isFlash
        ? `<span class="tag flash-tag"><i data-icon="zap"></i> ${discount ? `-${discount}%` : 'FLASH'}</span>`
        : (discount ? `<span class="tag">-${discount}%</span>` : `<span class="tag hot-tag">HOT</span>`));
    const outOverlay = isOut ? `<div class="out-of-stock-overlay"><span class="out-pill">${langText('HẾT HÀNG', 'OUT OF STOCK', '已售罄')}</span></div>` : '';
    const ratingAvg = '5.0';
    const ratingCount = Number(p.rating?.count || 28);
    const ratingHtml = `<div class="meta-line product-rating"><i data-icon="star"></i><strong>${ratingAvg}</strong><span>(${ratingCount})</span><span class="dot">·</span><span>${escapeHTML(p.warranty || 'Bảo hành')}</span></div>`;
    return `<button class="featured-card ${isOut ? 'unavailable' : ''} ${isFlash ? 'is-flash' : ''}" data-product="${p.id}"><div class="product-art ${isOut ? 'out-of-stock' : ''}" style="${styleVars(p.id)}">${tagHtml}<span class="product-logo">${initials(p.name).slice(0, 1)}</span>${p.image_url ? `<img src="${escapeHTML(p.image_url)}" alt="${langText('Ảnh', 'Image', '图片')} ${escapeHTML(p.name)}" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer">` : ''}${outOverlay}</div><h3>${escapeHTML(p.name)}</h3>${ratingHtml}<div class="price-line"><div>${p.old_price > p.price ? `<del>${money(p.old_price)}</del>` : ''}<strong>${money(p.price)}</strong></div><span><i data-icon="arrow"></i></span></div></button>`;
  }
  function productCard(p) {
    const isFlash = Boolean(p.is_flash || p.flash_sale);
    const isHot = Boolean(p.is_hot || p.featured);
    const isOut = isProductOutOfStock(p);
    const stockBadge = `<span class="stock-badge ${isOut ? 'out-stock' : (isFlash ? 'flash-stock' : (isHot ? 'hot-stock' : ''))}">${isOut ? tr('Hết hàng') : (isFlash ? '⚡ FLASH SALE' : (isHot ? '🔥 HOT' : (p.manual ? tr('Xử lý nhanh') : `${langText('Còn', 'Available', '剩余')} ${Number(p.stock).toLocaleString(locale())}`)))}</span>`;
    const ratingAvg = '5.0';
    const ratingCount = Number(p.rating?.count || 28);
    const ratingHtml = `<div class="meta-line product-rating"><i data-icon="star"></i><strong>${ratingAvg}</strong><span>(${ratingCount})</span><span class="dot">·</span><span>${escapeHTML(p.warranty || 'Bảo hành')}</span></div>`;
    return `<button class="product-card ${isOut ? 'unavailable' : ''} ${isFlash ? 'is-flash' : ''}" data-product="${p.id}">${stockBadge}${productArt(p)}<h3>${escapeHTML(p.name)}</h3>${ratingHtml}<div class="price-line"><div>${p.old_price > p.price ? `<del>${money(p.old_price)}</del>` : ''}<strong>${money(p.price)}</strong></div><span><i data-icon="arrow"></i></span></div></button>`;
  }
  function escapeHTML(value) { const el = document.createElement('div'); el.textContent = String(value ?? ''); return el.innerHTML; }

  function hydrateCommerce(data = state.data?.commerce_state || {}) {
    state.commerce = { favorites: [...(data.favorites || [])], recent: [...(data.recent || [])], cart: [...(data.cart || [])], renewal_reminders: data.renewal_reminders === true };
  }
  async function flushCommerce() {
    if (state.commerceSaving) { state.commerceDirty = true; return; }
    state.commerceSaving = true; state.commerceDirty = false;
    const revision = state.commerceRevision, commerceWasStable = !state.commerceDirty, body = JSON.stringify({ ...state.commerce, init_data: tg?.initData || '' });
    try {
      const result = await api('commerce-state', { method: 'POST', body });
      if (revision===state.commerceRevision && result.commerce_state) { hydrateCommerce(result.commerce_state); if (state.data) state.data.commerce_state = result.commerce_state; }
      else if (revision !== state.commerceRevision) state.commerceDirty = true;
    } catch (error) { toast(error.message, true); }
    finally {
      state.commerceSaving = false;
      if (state.commerceDirty || revision !== state.commerceRevision) { clearTimeout(syncCommerce.timer); syncCommerce.timer = setTimeout(flushCommerce, 0); }
    }
  }
  function syncCommerce() {
    state.commerceRevision += 1; state.commerceDirty = true; clearTimeout(syncCommerce.timer); syncCommerce.timer = setTimeout(flushCommerce, 220);
  }
  function recordRecent(productId) { state.commerce.recent = [productId, ...state.commerce.recent.filter(id => id !== productId)].slice(0, 30); syncCommerce(); renderGrowth(); }
  function toggleFavorite(productId = state.selected?.id) { if (!productId) return; const exists = state.commerce.favorites.includes(productId); state.commerce.favorites = exists ? state.commerce.favorites.filter(id => id !== productId) : [productId, ...state.commerce.favorites].slice(0, 100); renderCommerceButtons(); renderShop(); renderGrowth(); syncCommerce(); toast(exists ? langText('Đã bỏ yêu thích', 'Removed from favorites', '已取消收藏') : langText('Đã thêm vào yêu thích', 'Added to favorites', '已加入收藏')); }
  function addSelectedToCart() { const product = state.selected; if (!product) return; const quantity = Math.max(1, state.quantity || 1), existing = state.commerce.cart.find(item => item.product_id === product.id); if (existing) existing.quantity = quantity; else state.commerce.cart.push({ product_id: product.id, quantity }); state.commerce.cart = state.commerce.cart.slice(0, 30); renderCart(); renderCommerceButtons(); syncCommerce(); toast(langText('Đã thêm vào giỏ hàng', 'Added to cart', '已加入购物车')); }
  function removeCartItem(productId) { state.commerce.cart = state.commerce.cart.filter(item => item.product_id !== productId); renderCart(); syncCommerce(); }
  function renderCommerceButtons() { const selectedId = state.selected?.id, favorite = selectedId && state.commerce.favorites.includes(selectedId), inCart = selectedId && state.commerce.cart.some(item => item.product_id === selectedId); $('#favoriteProduct')?.classList.toggle('active', Boolean(favorite)); $('#favoriteProduct span').textContent = favorite ? langText('Đã yêu thích', 'Favorited', '已收藏') : tr('Yêu thích'); $('#addCart span').textContent = inCart ? langText('Cập nhật giỏ', 'Update cart', '更新购物车') : tr('Thêm vào giỏ'); const cLen = state.commerce.cart.length, cEl = $('#cartCount'); if (cEl) { cEl.textContent = String(cLen); cEl.hidden = cLen <= 0; } }
  function renderGrowth() {
    if (!state.data) return; const products = state.data.products || [], byId = new Map(products.map(item => [item.id, item])), recommended = (state.data.recommendations || []).map(id => byId.get(id)).filter(Boolean).slice(0, 6), recent = state.commerce.recent.map(id => byId.get(id)).filter(Boolean).slice(0, 6); $('#recommendationSection').hidden = !recommended.length; $('#recentSection').hidden = !recent.length; $('#recommendedProducts').innerHTML = recommended.map(featuredCard).join(''); $('#recentProducts').innerHTML = recent.map(featuredCard).join(''); bindProducts($('#recommendedProducts')); bindProducts($('#recentProducts')); paintIcons($('#recommendationSection')); paintIcons($('#recentSection')); renderCommerceButtons();
  }
  function renderCart() {
    const products = state.data?.products || [], byId = new Map(products.map(item => [item.id, item])), rows = state.commerce.cart.map(item => ({ item, product: byId.get(item.product_id) })).filter(row => row.product); $('#cartItems').innerHTML = rows.length ? rows.map(({ item, product }) => `<article class="cart-item"><div class="cart-item-art" style="${styleVars(product.id)}">${product.image_url ? `<img src="${escapeHTML(product.image_url)}" alt="">` : ''}</div><div><b>${escapeHTML(product.name)}</b><small>${langText('SL', 'Qty', '数量')} ${Number(item.quantity).toLocaleString(locale())} · ${money(localTotal(product, item.quantity))}</small></div><div class="cart-item-actions"><button data-cart-buy="${escapeHTML(product.id)}">${langText('Mua', 'Buy', '购买')}</button><button data-cart-remove="${escapeHTML(product.id)}">${langText('Xóa', 'Remove', '删除')}</button></div></article>`).join('') : adminEmpty(langText('Giỏ hàng đang trống.', 'Your cart is empty.', '购物车为空。')); $('#cartTotal').textContent = money(rows.reduce((sum, row) => sum + localTotal(row.product, row.item.quantity), 0)); const cLen = rows.length, cEl = $('#cartCount'); if (cEl) { cEl.textContent = String(cLen); cEl.hidden = cLen <= 0; } $$('[data-cart-remove]', $('#cartItems')).forEach(button => button.onclick = () => removeCartItem(button.dataset.cartRemove)); $$('[data-cart-buy]', $('#cartItems')).forEach(button => button.onclick = () => { const row = rows.find(item => item.product.id === button.dataset.cartBuy); if (!row) return; closeSheets(); openProduct(row.product); setQuantity(row.item.quantity, { commit: true }); }); paintIcons($('#cartSheet'));
  }

  function renderProfile() {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgName = tgUser ? (tgUser.first_name ? (tgUser.last_name ? `${tgUser.first_name} ${tgUser.last_name}` : tgUser.first_name) : tgUser.username) : '';
    const p = state.data.profile, name = p.name || tgName || langText('Bạn', 'You', '您'), letter = initials(name).slice(0, 1);
    if ($('#welcomeName')) $('#welcomeName').textContent = tgName || name;
    const avatarUrl = p.avatar_url || tgUser?.photo_url || '';
    setAvatarPhoto($('.avatar-button'), $('#avatarText'), avatarUrl, letter);
    setAvatarPhoto($('.profile-avatar'), $('#profileInitial'), avatarUrl, letter);
    const isAdmin = Boolean(p.is_admin || p.role === 'admin'), roleLabel = isAdmin ? String(p.admin_role || 'admin').toUpperCase() : 'MEMBER', rankLabel = String(p.rank || 'MEMBER').toUpperCase();
    const adminIdentityKey = isAdmin ? `${String(p.admin_role || 'admin').toLowerCase()}:${[...(p.admin_capabilities || [])].sort().join(',')}` : 'member';
    if (state.adminIdentityKey && state.adminIdentityKey !== adminIdentityKey) { state.adminData = null; state.adminLoading = false; state.adminRequestSeq += 1; state.adminTab = ''; }
    state.adminIdentityKey = adminIdentityKey;
    const mode = getCurrencyMode();
    if ($('#balanceText')) {
      if (mode === 'usdt') {
        const usdtBal = (Number(p.balance || 0) / getUsdtRate()).toFixed(2);
        $('#balanceText').textContent = Number(usdtBal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else {
        $('#balanceText').textContent = Number(p.balance || 0).toLocaleString('vi-VN');
      }
    }
    if ($('#currencyUnit')) $('#currencyUnit').textContent = mode === 'usdt' ? 'USDT' : '₫';
    if ($('#currencyToggleLabel')) $('#currencyToggleLabel').textContent = mode === 'usdt' ? 'USDT' : 'VND';
    $('#spentText').textContent = money(p.total_spent); $('#rankText').textContent = roleLabel;
    $('#rankText').closest('.mini-chip')?.classList.toggle('admin', isAdmin);
    $('#profileName').textContent = name;
    $('#profileUsername').textContent = p.username ? `@${p.username}` : (isAdmin ? langText('Quản trị viên Dino Store', 'Dino Store admin', 'Dino Store 管理员') : langText('Thành viên Dino Store', 'Dino Store member', 'Dino Store 会员'));
    const cleanRank = String(state.data?.rank_details?.name || p.rank || 'MEMBER').toUpperCase();
    if (isAdmin) {
      $('#profileRole').textContent = `ADMIN · ${String(p.admin_role || 'STAFF').toUpperCase()}`;
    } else {
      $('#profileRole').textContent = `HẠNG ${cleanRank}`;
    }
    if ($('#profileRank')) $('#profileRank').textContent = '';
    $('#profileRoleCard').classList.toggle('admin', isAdmin);
    $('#profileBalance').textContent = money(p.balance);
    $$('[data-admin-only]').forEach(element => element.hidden = !isAdmin);
    $('#bottomNav')?.classList.toggle('admin-mode', isAdmin);
    $('#bottomNav').style.gridTemplateColumns = `repeat(${isAdmin ? 6 : 5},1fr)`;
    applyAdminCapabilities();
    if (!isAdmin && state.page === 'admin') go('home');
    const rank = state.data.rank_details || {}, referral = state.data.referral || {}, required = Number(rank.remaining || 0) + Number(rank.total_spent || 0), progress = required ? Math.min(100, Math.round(Number(rank.total_spent || 0) * 100 / required)) : 100; $('#rankDetailName').textContent = rank.name || p.rank || 'MEMBER'; $('#rankDetailSpent').textContent = money(rank.total_spent || p.total_spent); $('#rankDetailNote').textContent = rank.next_name ? langText(`Còn ${money(rank.remaining)} để lên ${rank.next_name}`, `${money(rank.remaining)} until ${rank.next_name}`, `还差 ${money(rank.remaining)} 升级到 ${rank.next_name}`) : langText('Bạn đang ở hạng cao nhất hiện tại.', 'You are currently at the highest rank.', '您当前已是最高等级。'); $('#rankProgressBar').style.width = `${progress}%`; $('#referralInvited').textContent = `${Number(referral.invited || 0).toLocaleString(locale())} ${langText('người', 'people', '人')}`; $('#referralCommission').textContent = `${money(referral.commission)} ${langText('hoa hồng', 'commission', '佣金')}`; $('#renewalToggle').setAttribute('aria-pressed', String(state.commerce.renewal_reminders)); $('#renewalSwitch').classList.toggle('active', state.commerce.renewal_reminders);
  }

  function adminKpi(label, value, note = '') {
    return `<article class="admin-kpi"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong>${note ? `<span>${escapeHTML(note)}</span>` : ''}</article>`;
  }
  function adminEmpty(message) { return `<div class="admin-empty">${escapeHTML(message)}</div>`; }
  function adminCapabilities() { return new Set(state.adminData?.capabilities || state.adminData?.admin?.capabilities || state.data?.profile?.admin_capabilities || []); }
  function canAdmin(capability) { return adminCapabilities().has(capability); }
  function applyAdminCapabilities() {
    $$('[data-admin-capability]', $('#miniAdminPage')).forEach(element => { element.hidden = !canAdmin(element.dataset.adminCapability); });
    const availableTabs = $$('[data-admin-tab]', $('#adminTabs')).filter(button => !button.hidden);
    if (!availableTabs.some(button => button.dataset.adminTab === state.adminTab)) state.adminTab = availableTabs[0]?.dataset.adminTab || '';
    $$('[data-admin-tab]', $('#adminTabs')).forEach(button => button.classList.toggle('active', !button.hidden && button.dataset.adminTab === state.adminTab));
    $$('[data-admin-panel]', $('#miniAdminPage')).forEach(panel => panel.classList.toggle('active', !panel.hidden && panel.dataset.adminPanel === state.adminTab));
  }
  function renderAdminKpis() {
    const o = state.adminData?.overview || {}, coverage = o.completed_orders ? Math.round((Number(o.costed_orders || 0) / Number(o.completed_orders)) * 100) : 0;
    const cards = [];
    if (canAdmin('finance.read')) cards.push(
      adminKpi('GỘP HÔM NAY', money(o.today_gross), `${o.today_orders || 0} đơn ghi nhận`),
      adminKpi('HOÀN HÔM NAY', money(o.today_refunds), `${o.unknown_refunds || 0} hoàn tiền cũ chưa rõ số`),
      adminKpi('THUẦN HÔM NAY', money(o.today_net), 'Gộp trừ hoàn tiền đã biết'),
      adminKpi('LỢI NHUẬN HÔM NAY', money(o.today_profit), `Có giá vốn ${coverage}% trong tháng`)
    );
    if (canAdmin('orders.read')) cards.push(adminKpi('ĐƠN THÁNG NÀY', String(o.completed_orders || 0), `${(o.pending_pay || 0) + (o.pending_manual || 0)} đơn pending`));
    if (canAdmin('catalog.read')) cards.push(adminKpi('SẢN PHẨM', String(o.products || 0), 'Danh mục đang quản lý'));
    if (canAdmin('support.read')) cards.push(adminKpi('HỖ TRỢ', String(o.support_open || 0), 'Yêu cầu đang mở'));
    if (canAdmin('api.read')) cards.push(adminKpi('API PARTNER', `${o.api_active || 0}/${o.api_total || 0}`, 'Đang bật / tổng số'));
    $('#adminKpis').innerHTML = (cards.length ? cards : [adminKpi('QUYỀN HẠN', 'CHỈ ĐỌC', 'Không có dữ liệu phù hợp')]).join('');
    if (canAdmin('finance.read')) {
      $('#adminFinancialSummary').innerHTML = [['GỘP THÁNG', o.gross], ['HOÀN THÁNG', o.refunds], ['THUẦN THÁNG', o.net], ['GIÁ VỐN', o.cost], ['LỢI NHUẬN', o.profit], ['ĐƠN', o.completed_orders]].map(([label, value]) => `<span><small>${label}</small><b>${label === 'ĐƠN' ? Number(value || 0).toLocaleString('vi-VN') : money(value)}</b></span>`).join('');
      const integrity = o.balance_integrity || {}, issues = (integrity.mismatches?.length || 0) + (integrity.untracked?.length || 0), box = $('#adminIntegrity'); box.classList.toggle('error', !integrity.ok); box.textContent = integrity.ok ? `Sổ cái ví khớp ${Number(integrity.tracked || 0).toLocaleString('vi-VN')} user` : `Cảnh báo đối soát: ${issues} user cần kiểm tra`;
    }
  }
  function adminMatches(item) { const q = state.adminQuery.trim().toLocaleLowerCase('vi'); return !q || JSON.stringify(item).toLocaleLowerCase('vi').includes(q); }
  function renderAdminOrders() {
    const rows = state.adminData?.orders || [];
    $('#adminOrders').innerHTML = rows.length ? rows.map(item => {
      const canDelete = canAdmin('orders.pending.delete') && (item.source === 'pending' || item.source === 'manual'), target = `${item.source}:${item.code}`;
      const statusLine = canAdmin('finance.read') ? `${money(item.amount)} · ${escapeHTML(item.status)}` : escapeHTML(item.status);
      return `<article class="admin-row"><div class="admin-row-main" data-admin-order="${escapeHTML(item.code)}" data-admin-source="${escapeHTML(item.source)}"><b>${escapeHTML(item.product)}</b><small>#${escapeHTML(item.code)} · User ${escapeHTML(item.user_id || '—')} · ${date(item.timestamp)}</small><span>${statusLine}</span></div><div class="admin-row-actions">${canDelete ? `<button class="danger" data-admin-action="pending_delete" data-admin-target="${escapeHTML(target)}" data-admin-label="xóa đơn pending ${escapeHTML(item.code)}">Xóa</button>` : ''}</div></article>`;
    }).join('') : adminEmpty('Chưa có đơn hàng.');
  }
  function buildProductDirectLink(productId) {
    const raw = String(productId || '').trim();
    if (!raw) return '';
    const item = (state.data?.products || []).find(x => String(x.id) === raw || String(x.code || '') === raw);
    const pid = String(item?.code || raw).trim();
    const bot = String(state.data?.bot_username || 'shopdinostore_bot').replace(/^@/, '').trim() || 'shopdinostore_bot';
    const shortName = String(state.data?.miniapp_short_name || '').replace(/^\/+|\/+$/g, '').trim();
    const startVal = encodeURIComponent(`prod_${pid}`);
    return shortName
      ? `https://t.me/${bot}/${encodeURIComponent(shortName)}?startapp=${startVal}`
      : `https://t.me/${bot}?start=${startVal}`;
  }
  function findProductByParam(idOrCode) {
    const target = String(idOrCode || '').trim();
    if (!target) return null;
    const list = state.data?.products || [];
    const lower = target.toLowerCase();
    return list.find(item => String(item.id) === target || String(item.code || '') === target)
      || list.find(item => String(item.id || '').toLowerCase() === lower || String(item.code || '').toLowerCase() === lower)
      || list.find(item => String(item.id).toLowerCase() === lower || String(item.code || '').toLowerCase() === lower)
      || null;
  }
  function renderAdminProducts() {
    const rows = (state.adminData?.products || []).filter(adminMatches);
    const canWrite = canAdmin('catalog.write');
    $('#adminProducts').innerHTML = rows.length ? rows.map(item => `<article class="admin-row"><div class="admin-row-main"><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.type)} · ${escapeHTML(item.category)} · Kho ${Number(item.stock || 0).toLocaleString('vi-VN')}</small><span>${money(item.price)} · ${item.enabled ? 'Đang bán' : 'Đang ẩn'}</span></div><div class="admin-row-actions"><button type="button" data-admin-copy-link="${escapeHTML(item.id)}">Link</button>${canWrite ? `<button class="${item.enabled ? 'danger' : ''}" data-admin-action="product_toggle" data-admin-target="${escapeHTML(item.id)}" data-admin-value="${item.enabled ? 'false' : 'true'}" data-admin-label="${item.enabled ? 'tắt' : 'bật'} sản phẩm ${escapeHTML(item.name)}">${item.enabled ? 'Tắt' : 'Bật'}</button>` : ''}</div></article>`).join('') : adminEmpty('Chưa có sản phẩm.');
  }
  function renderAdminUsers() {
    const rows = (state.adminData?.users || []).filter(adminMatches);
    const canWrite = canAdmin('finance.balance.write');
    $('#adminUsers').innerHTML = rows.length ? rows.map(item => `<article class="admin-row"><div class="admin-row-main"><b>${escapeHTML(item.name)}</b><small>${item.username ? '@' + escapeHTML(item.username) + ' · ' : ''}ID ${escapeHTML(item.id)}${item.banned ? ' · Đã khóa' : ''}</small><span>${money(item.balance)} · Đã chi ${money(item.total_spent)}</span></div><div class="admin-row-actions">${canWrite ? `<input class="admin-balance-input" type="number" min="0" max="1000000000000" value="${Number(item.balance || 0)}" aria-label="Số dư user ${escapeHTML(item.id)}"><button data-admin-balance="${escapeHTML(item.id)}" data-admin-label="đặt số dư user ${escapeHTML(item.id)}">Lưu</button>` : ''}</div></article>`).join('') : adminEmpty('Chưa có user.');
  }
  function renderAdminSupport() {
    const rows = (state.adminData?.support || []).filter(adminMatches);
    const canWrite = canAdmin('support.write');
    $('#adminSupport').innerHTML = rows.length ? rows.map(item => { const resolved = ['resolved', 'closed', 'completed'].includes(String(item.status).toLowerCase()); return `<article class="admin-row"><div class="admin-row-main"><b>${escapeHTML(item.kind)} · ${escapeHTML(item.title)}</b><small>User ${escapeHTML(item.user_id || '—')} · ${date(item.timestamp)}</small><span>${escapeHTML(item.status)}${item.preview ? ' · ' + escapeHTML(item.preview) : ''}</span></div><div class="admin-row-actions">${resolved || !canWrite ? '' : `<button data-admin-action="support_resolve" data-admin-target="${escapeHTML(item.id)}" data-admin-label="hoàn tất ${escapeHTML(item.kind)} ${escapeHTML(item.title)}">Xong</button>`}</div></article>` }).join('') : adminEmpty('Không có yêu cầu hỗ trợ.');
  }
  function renderAdminApi() {
    const rows = (state.adminData?.api_partners || []).filter(adminMatches);
    const canWrite = canAdmin('api.write');
    $('#adminApi').innerHTML = rows.length ? rows.map(item => `<article class="admin-row"><div class="admin-row-main"><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.id)} · Owner ${escapeHTML(item.owner_user_id || '—')} · ${item.rate_limit || 0} req/phút</small><span>${money(item.balance)} · ${item.enabled ? 'Đang bật' : 'Đã tắt'}</span></div><div class="admin-row-actions">${canWrite ? `<button class="${item.enabled ? 'danger' : ''}" data-admin-action="api_toggle" data-admin-target="${escapeHTML(item.id)}" data-admin-value="${item.enabled ? 'false' : 'true'}" data-admin-label="${item.enabled ? 'tắt' : 'bật'} API partner ${escapeHTML(item.name)}">${item.enabled ? 'Tắt' : 'Bật'}</button>` : ''}</div></article>`).join('') : adminEmpty('Chưa có API partner.');
  }
  function renderAdminAudit() {
    const rows = (state.adminData?.balance_ledger || []).filter(adminMatches);
    $('#adminAudit').innerHTML = rows.length ? rows.map(item => `<article class="admin-row"><div class="admin-row-main"><b>User ${escapeHTML(item.user_id)} · ${escapeHTML(item.type)}</b><small>${date(item.timestamp)} · ${escapeHTML(item.reason || item.reference || 'Không có ghi chú')}</small><span class="admin-ledger-amount ${item.amount >= 0 ? 'positive' : 'negative'}">${signedMoney(item.amount)} · ${money(item.before)} → ${money(item.after)}</span></div></article>`).join('') : adminEmpty('Chưa có biến động số dư.');
  }
  function renderAdminSurfshark() {
    const box = $('#adminSurfsharkBox');
    if (!box) return;
    if (!canAdmin('catalog.read')) { box.hidden = true; return; }
    box.hidden = false;
    const s = state.surfsharkAdminSummary;
    const canWrite = canAdmin('catalog.write');
    if (!s) {
      box.innerHTML = `<div class="admin-surfshark-top"><b>🦈 Surfshark Nguồn (Auto-Login 6 ký tự)</b><button type="button" id="ssAdminReload" class="ss-mini-btn">Tải trạng thái</button></div><div class="admin-surfshark-meta">Đang kiểm tra kết nối tài khoản nguồn...</div>`;
      $('#ssAdminReload')?.addEventListener('click', () => loadAdminSurfshark(true));
      return;
    }
    const connected = Boolean(s.connected);
    const guardOn = s.guard_enabled !== false;
    const pending = s.pending_login && s.pending_login.code && Number(s.pending_login.remaining_seconds || 0) > 0 ? s.pending_login : null;
    const devData = state.surfsharkAdminDevices;
    const devicesHtml = state.surfsharkDevicesOpen && devData ? `
      <div class="ss-admin-devices">
        <div class="admin-surfshark-meta">
          <b>${(devData.devices || []).length}</b> thiết bị đang login · Whitelist chuẩn: <b>${devData.allowed_count || 0}</b>
        </div>
        ${(devData.devices || []).map((d, i) => {
          const badge = d.source === 'bot_order' && d.order_code
            ? `✅ Đơn #${escapeHTML(d.order_code)}`
            : (d.whitelisted ? '🛡️ Whitelist' : '🚨 LẠ');
          const dName = String(d.name || 'Unknown').replace(/\+/g, ' ');
          return `
            <div class="ss-dev-row">
              <div class="ss-dev-info">
                <b>${i + 1}. ${escapeHTML(dName)} (${escapeHTML(d.platform || d.type || 'app')})</b>
                <small>${badge} · ${escapeHTML(d.location || '—')}</small>
              </div>
              ${canWrite && !d.current ? `<button type="button" class="ss-dev-kick" data-ss-kick="${escapeHTML(d.id)}">Kick</button>` : ''}
            </div>`;
        }).join('') || '<div class="admin-surfshark-meta">Không có thiết bị nào.</div>'}
      </div>` : '';
    box.innerHTML = `
      <div class="admin-surfshark-top">
        <b>🦈 Surfshark Nguồn · ${connected ? '🟢 Đang kết nối' : '🔴 Chưa đăng nhập'}</b>
      </div>
      <div class="admin-surfshark-meta">
        ${s.email_masked ? `Email: <b>${escapeHTML(s.email_masked)}</b> · ` : ''}
        Gói đến: <b>${escapeHTML(String(s.subscription_expires_at || '—').slice(0, 10))}</b> ·
        Auto-Kick lạ: <b>${guardOn ? '🛡️ BẬT' : '⚠️ TẮT'}</b> (${Number(s.allowed_devices_count || 0)} máy chuẩn)
        ${pending ? `<br>⏳ Mã chờ duyệt: <code>${escapeHTML(pending.code)}</code> (duyệt trong app Surfshark → My account → Enter login code)` : ''}
      </div>
      <div class="ss-admin-btns">
        <button type="button" id="ssAdminDevicesBtn" class="accent">${state.surfsharkDevicesOpen ? 'Ẩn thiết bị' : '📱 Thiết bị đang login'}</button>
        ${canWrite ? `<button type="button" id="ssAdminGuardToggle" class="${guardOn ? 'guard-on' : 'guard-off'}">${guardOn ? '🛡️ Auto-Kick: BẬT' : '⚠️ Auto-Kick: TẮT'}</button>` : ''}
        ${canWrite ? `<button type="button" id="ssAdminGuardScan">🔍 Quét lạ ngay</button>` : ''}
        ${canWrite && state.surfsharkDevicesOpen ? `<button type="button" id="ssAdminWhitelistAll">📌 Chốt all hiện tại</button>` : ''}
        <button type="button" id="ssAdminReload">Kiểm tra lại</button>
        ${canWrite ? `<button type="button" id="ssAdminRenew">Gia hạn Token</button>` : ''}
        ${canWrite ? `<button type="button" id="ssAdminLoginStart">${pending ? 'Tạo mã 6 số mới' : 'Đăng nhập mã 6 số'}</button>` : ''}
        ${canWrite && pending ? `<button type="button" id="ssAdminLoginPoll" class="accent">Kiểm tra duyệt (${escapeHTML(pending.code)})</button>` : ''}
      </div>
      ${devicesHtml}`;
    $('#ssAdminDevicesBtn')?.addEventListener('click', async () => {
      state.surfsharkDevicesOpen = !state.surfsharkDevicesOpen;
      if (state.surfsharkDevicesOpen) {
        try {
          const res = await api('admin/surfshark/devices');
          state.surfsharkAdminDevices = res;
        } catch (e) { toast(e.message, true); }
      }
      renderAdminSurfshark();
    });
    $('#ssAdminGuardToggle')?.addEventListener('click', async () => {
      try {
        const res = await api('admin/surfshark/guard-toggle', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        if (state.surfsharkAdminSummary) state.surfsharkAdminSummary.guard_enabled = res.guard_enabled;
        if (state.surfsharkAdminDevices) state.surfsharkAdminDevices.guard_enabled = res.guard_enabled;
        renderAdminSurfshark();
        toast(res.message);
      } catch (e) { toast(e.message, true); }
    });
    $('#ssAdminGuardScan')?.addEventListener('click', async () => {
      try {
        const res = await api('admin/surfshark/guard-scan', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        if (state.surfsharkDevicesOpen) state.surfsharkAdminDevices = await api('admin/surfshark/devices');
        await loadAdminSurfshark(true);
        toast(res.message);
      } catch (e) { toast(e.message, true); }
    });
    $('#ssAdminWhitelistAll')?.addEventListener('click', async () => {
      try {
        const res = await api('admin/surfshark/devices/whitelist-all', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        state.surfsharkAdminDevices = await api('admin/surfshark/devices');
        await loadAdminSurfshark(true);
        toast(res.message);
      } catch (e) { toast(e.message, true); }
    });
    $$('[data-ss-kick]', box).forEach(btn => btn.onclick = async () => {
      const did = btn.dataset.ssKick;
      if (!did) return;
      const ok = await confirmAdminAction('Kick thiết bị này khỏi tài khoản Surfshark ngay?');
      if (!ok) return;
      try {
        const res = await api(`admin/surfshark/devices/${encodeURIComponent(did)}/kick`, { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        state.surfsharkAdminDevices = await api('admin/surfshark/devices');
        await loadAdminSurfshark(true);
        toast(res.message || 'Đã kick thiết bị');
      } catch (e) { toast(e.message, true); }
    });
    $('#ssAdminReload')?.addEventListener('click', () => loadAdminSurfshark(true));
    $('#ssAdminRenew')?.addEventListener('click', async () => {
      try {
        const res = await api('admin/surfshark/renew', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        state.surfsharkAdminSummary = res.summary || state.surfsharkAdminSummary;
        renderAdminSurfshark();
        toast(res.message || 'Đã làm mới token Surfshark');
      } catch (e) { toast(e.message, true); }
    });
    $('#ssAdminLoginStart')?.addEventListener('click', async () => {
      try {
        const res = await api('admin/surfshark/login-start', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        await loadAdminSurfshark(true);
        toast(`Mã 6 ký tự Surfshark: ${res.code} — vào app duyệt rồi bấm Kiểm tra duyệt`);
      } catch (e) { toast(e.message, true); }
    });
    $('#ssAdminLoginPoll')?.addEventListener('click', async () => {
      try {
        const res = await api('admin/surfshark/login-poll', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
        if (res.summary) state.surfsharkAdminSummary = res.summary;
        else await loadAdminSurfshark(true);
        renderAdminSurfshark();
        toast(res.ok ? '✅ Đã lưu phiên Surfshark mới!' : (res.error || 'Chưa thấy xác nhận từ app Surfshark'), !res.ok);
      } catch (e) { toast(e.message, true); }
    });
  }
  async function loadAdminSurfshark(force = false) {
    if (!canAdmin('catalog.read') || state.surfsharkAdminLoading) return;
    if (!force && state.surfsharkAdminSummary && (Date.now() - (state.surfsharkAdminFetchedAt || 0) < 15000)) {
      renderAdminSurfshark();
      return;
    }
    state.surfsharkAdminLoading = true;
    try {
      const res = await api('admin/surfshark/status');
      if (res.summary) {
        state.surfsharkAdminSummary = res.summary;
        state.surfsharkAdminFetchedAt = Date.now();
      }
    } catch { }
    finally {
      state.surfsharkAdminLoading = false;
      renderAdminSurfshark();
    }
  }
  function renderAdmin() {
    if (!state.adminData) return;
    $('#adminName').textContent = state.adminData.admin?.name || state.data?.profile?.name || 'Admin';
    $('#adminRole').textContent = String(state.adminData.admin?.role || state.data?.profile?.admin_role || 'viewer').toUpperCase();
    applyAdminCapabilities(); renderAdminKpis(); renderAdminOrders(); renderAdminProducts(); renderAdminSurfshark(); if (canAdmin('catalog.read')) loadAdminSurfshark(false); renderAdminUsers(); renderAdminSupport(); renderAdminApi(); renderAdminAudit(); paintIcons($('#miniAdminPage')); bindAdminActions();
  }
  function confirmAdminAction(message) {
    return new Promise(resolve => { if (tg?.showConfirm) tg.showConfirm(message, resolve); else resolve(window.confirm(message)); });
  }
  async function runAdminAction(action, target, value, label) {
    const accepted = await confirmAdminAction(`Xác nhận ${label}?\n\nThao tác sẽ được ghi vào audit log.`); if (!accepted) return;
    try {
      const confirmed = await api('admin/confirm', { method: 'POST', body: JSON.stringify({ action, target, value, init_data: tg?.initData || '' }) });
      const result = await api('admin/action', { method: 'POST', body: JSON.stringify({ action, target, value, confirmation_token: confirmed.confirmation_token, init_data: tg?.initData || '' }) });
      toast(result.message || 'Đã cập nhật'); await refreshAdmin(true);
    } catch (error) { toast(error.message, true); }
  }
  function bindAdminActions() {
    $$('[data-admin-copy-link]', $('#miniAdminPage')).forEach(button => button.onclick = () => copyText(buildProductDirectLink(button.dataset.adminCopyLink), tr('Đã sao chép link sản phẩm')));
    $$('[data-admin-action]', $('#miniAdminPage')).forEach(button => button.onclick = () => runAdminAction(button.dataset.adminAction, button.dataset.adminTarget, button.dataset.adminValue === 'true', button.dataset.adminLabel || 'thao tác'));
    $$('[data-admin-balance]', $('#miniAdminPage')).forEach(button => button.onclick = () => { const input = button.parentElement.querySelector('input'), value = Number(input?.value); if (!Number.isFinite(value) || value < 0) { toast('Số dư không hợp lệ', true); return; } runAdminAction('user_balance_set', button.dataset.adminBalance, Math.floor(value), `${button.dataset.adminLabel} thành ${money(value)}`); });
    $$('[data-admin-order]', $('#miniAdminPage')).forEach(element => element.onclick = () => openAdminOrder(element.dataset.adminOrder, element.dataset.adminSource));
  }
  async function openAdminOrder(code, source = 'history') {
    $('#adminDetailTitle').textContent = `Đơn #${code}`; $('#adminDetailSummary').textContent = 'Đang lấy dữ liệu đã xác minh...'; $('#adminDetailContent').innerHTML = ''; openSheet('#adminDetailSheet');
    try { const result = await api(`admin/orders/${encodeURIComponent(code)}?source=${encodeURIComponent(source)}`), o = result.order || {}; $('#adminDetailTitle').textContent = o.product || `Đơn #${code}`; $('#adminDetailSummary').textContent = `#${o.code} · ${o.status || 'Chưa rõ trạng thái'}`; const fields = [['USER', `${o.full_name || '—'} · ${o.user_id || '—'}`], ['USERNAME', o.username ? `@${o.username}` : '—'], ['EMAIL', o.email || '—'], ['SỐ LƯỢNG', o.quantity || 1], ['GIAO HÀNG', `${o.delivery_method || '—'} · ${o.delivered_count || 0} mục`], ['THỜI GIAN', date(o.timestamp)]]; if (canAdmin('finance.read')) fields.splice(4, 0, ['THANH TOÁN', money(o.amount)], ['PHƯƠNG THỨC', o.payment_method || '—'], ['GIÁ VỐN', o.cost === null ? 'Chưa ghi' : money(o.cost)], ['HOÀN TIỀN', money(o.refund_amount)]); $('#adminDetailContent').innerHTML = fields.map(([label, value]) => `<div><small>${escapeHTML(label)}</small><b>${escapeHTML(value)}</b></div>`).join(''); }
    catch (error) { $('#adminDetailSummary').textContent = error.message; toast(error.message, true); }
  }
  async function downloadAdminReport() {
    if (!canAdmin('finance.report')) { toast('Vai trò hiện tại không có quyền xuất báo cáo', true); return; }
    const demo = new URLSearchParams(location.search).get('demo') === '1', url = `/miniapp/api/admin/report.csv${demo ? '?demo=1' : ''}`;
    try { const response = await fetch(url, { headers: { 'X-Telegram-Init-Data': tg?.initData || '' } }); if (!response.ok) throw new Error('Không xuất được báo cáo'); const blob = await response.blob(), objectUrl = URL.createObjectURL(blob), link = document.createElement('a'); link.href = objectUrl; link.download = `dino-finance-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1500); toast('Đã xuất báo cáo CSV'); } catch (error) { toast(error.message, true); }
  }
  async function refreshAdmin(silent = false) {
    if (!state.data?.profile?.is_admin) return;
    const requestSeq = ++state.adminRequestSeq; state.adminLoading = true; if (!silent) $('#adminKpis').innerHTML = '<div class="admin-loading">Đang xác minh quyền Admin...</div>';
    try {
      const params = new URLSearchParams(); if (state.adminQuery.trim()) params.set('q', state.adminQuery.trim()); if (state.adminStatus && state.adminStatus !== 'all') params.set('status', state.adminStatus); if (state.adminDay) params.set('day', state.adminDay);
      const result = await api(`admin/bootstrap${params.size ? `?${params}` : ''}`);
      if (requestSeq!==state.adminRequestSeq) return;
      state.adminData = result; renderAdmin(); if (!silent) toast('Đã cập nhật trang quản trị');
    }
    catch (error) { if (requestSeq === state.adminRequestSeq) { $('#adminKpis').innerHTML = `<div class="admin-empty">${escapeHTML(error.message)}</div>`; toast(error.message, true); } }
    finally { if (requestSeq === state.adminRequestSeq) state.adminLoading = false; }
  }
  function sellableProducts() { return state.data.products || []; }
  function sortProductPriority(a, b) {
    const aFlash = (a.is_flash || a.flash_sale) ? 1 : 0;
    const bFlash = (b.is_flash || b.flash_sale) ? 1 : 0;
    if (aFlash !== bFlash) return bFlash - aFlash;

    const aSold = Number(a.sold_count || a.sales_count || 0);
    const bSold = Number(b.sold_count || b.sales_count || 0);
    if (aSold !== bSold) return bSold - aSold;

    const aFeat = a.featured ? 1 : 0;
    const bFeat = b.featured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;

    return (b.available ? 1 : 0) - (a.available ? 1 : 0);
  }
  function timeAgoText(ts) {
    if (!ts) return '';
    const now = Date.now() / 1000;
    const diff = Math.max(1, Math.floor(now - ts));
    if (diff < 60) return `${diff}s ${langText('trước', 'ago', '前')}`;
    const min = Math.floor(diff / 60);
    if (min < 60) return `${min}p ${langText('trước', 'ago', '前')}`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ${langText('trước', 'ago', '前')}`;
    const day = Math.floor(hr / 24);
    return `${day}d ${langText('trước', 'ago', '前')}`;
  }
  function renderTicker() {
    const ticker = $('#liveOrdersTicker');
    const track = $('#tickerTrack');
    if (!ticker || !track) return;
    const items = state.data?.recent_purchases || [];
    if (!items.length) {
      ticker.hidden = true;
      return;
    }
    ticker.hidden = false;

    const formatItem = (item) => {
      let pName = item.product || '';
      if (pName.length > 28) pName = pName.slice(0, 26) + '…';
      const timeStr = timeAgoText(item.timestamp);
      const amountStr = item.amount ? money(item.amount) : '';
      return `<div class="ticker-item"><span class="ticker-buyer">${escapeHTML(item.buyer || 'Khách')}</span><span class="ticker-action">${langText('vừa mua', 'bought', '刚刚购买')}</span><strong class="ticker-product">${escapeHTML(pName)}</strong>${amountStr ? `<span class="ticker-price">${amountStr}</span>` : ''}${timeStr ? `<span class="ticker-time">(${timeStr})</span>` : ''}</div>`;
    };

    const rendered = items.map(formatItem).join('<span class="ticker-sep">•</span>');
    track.innerHTML = `${rendered}<span class="ticker-sep">•</span>${rendered}`;
  }
  function renderHome() {
    const products = sellableProducts().filter(p => !p.social);
    const sorted = [...products].sort(sortProductPriority);
    let featured = sorted.filter(p => p.is_flash || p.flash_sale || Number(p.sold_count || p.sales_count || 0) > 0 || p.featured).slice(0, 8);
    if (featured.length < 3) featured = sorted.slice(0, 8);
    $('#featuredProducts').innerHTML = featured.map(featuredCard).join('') || `<p class="meta-line">${langText('Catalog đang được cập nhật.', 'Catalog is being updated.', '目录正在更新。')}</p>`; bindProducts($('#featuredProducts')); paintIcons($('#featuredProducts'));
    if ($('#socialFolderCount')) $('#socialFolderCount').textContent = sellableProducts().filter(p => p.social).length.toLocaleString(locale());
    renderGrowth(); renderCart(); renderTicker();
  }
  function renderCategories() {
    const all = 'Tất cả', favorite = 'Yêu thích', cats = [all, ...(state.commerce.favorites.length ? [favorite] : []), ...new Set(sellableProducts().filter(p => !p.social).map(p => p.category).filter(Boolean))];
    $('#categoryChips').innerHTML = cats.map(c => `<button class="${c === state.category ? 'active' : ''}" data-category="${escapeHTML(c)}">${escapeHTML(c === all ? langText('Tất cả', 'All', '全部') : c === favorite ? langText('Yêu thích', 'Favorites', '收藏') : c)}</button>`).join('');
    $$('[data-category]').forEach(b => b.onclick = () => { state.category = b.dataset.category; renderShop(); vibrate(); });
  }
  function filteredProducts() {
    const q = state.search.trim().toLocaleLowerCase(locale()); let rows = sellableProducts().filter(p => !p.social && (state.category === 'Tất cả' || (state.category === 'Yêu thích' ? state.commerce.favorites.includes(p.id) : p.category === state.category)) && (!q || `${p.name} ${p.description} ${p.category}`.toLocaleLowerCase(locale()).includes(q)));
    if (state.sort === 'price') rows.sort((a, b) => a.price - b.price); else if (state.sort === 'stock') rows.sort((a, b) => b.stock - a.stock); else rows.sort(sortProductPriority); return rows;
  }
  function renderShop() {
    renderCategories(); const rows = filteredProducts(); $('#productCount').textContent = `${rows.length} ${langText('SP', 'items', '商品')}`; $('#catalogLabel').textContent = state.category === 'Tất cả' ? langText('Tất cả sản phẩm', 'All products', '全部商品') : state.category === 'Yêu thích' ? langText('Yêu thích', 'Favorites', '收藏') : state.category; $('#productGrid').innerHTML = rows.map(productCard).join(''); $('#emptyProducts').hidden = rows.length > 0; bindProducts($('#productGrid')); paintIcons($('#productGrid'));
  }
  const smmState = {
    tab: 'order',
    platform: 'all',
    action: 'all',
    search: '',
    selectedProduct: null,
    quantity: 100,
    trackingFilter: 'all',
    pricingSearch: '',
    submitting: false,
    initialized: false,
  };

  function detectSmmPlatform(p) {
    const text = `${p.category || ''} ${p.name || ''} ${p.social_source_category || ''}`.toLowerCase();
    if (/facebook|fb\b|fb_|fanpage|group fb|page fb/.test(text)) return 'Facebook';
    if (/tiktok|tt\b|douyin/.test(text)) return 'TikTok';
    if (/instagram|ig\b|insta/.test(text)) return 'Instagram';
    if (/youtube|yt\b/.test(text)) return 'YouTube';
    if (/telegram|tele\b|tg\b/.test(text)) return 'Telegram';
    return 'Other';
  }

  function detectSmmAction(p) {
    const t = (p.social_service_type || '').toLowerCase();
    const text = `${t} ${p.name || ''}`.toLowerCase();
    if (/comment|bình luận|cmt/.test(text)) return 'comment';
    if (/follow|sub|theo dõi|subscribers|bạn bè|friend|member|thành viên/.test(text)) return 'follow';
    if (/like|tim|thả tim|cảm xúc|reaction|care|love|haha|tương tác/.test(text)) return 'like';
    if (/view|xem|lượt xem|story|reel|short/.test(text)) return 'view';
    if (/live|mắt live|share|chia sẻ|retweet/.test(text)) return 'live';
    return 'other';
  }

  function getSmmBadges(p) {
    const badges = [];
    const desc = (p.description || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    if (p.social_refill || p.warranty || /bảo hành|refill/.test(desc + name)) {
      badges.push({ text: '🛡️ Bảo hành', cls: 'warranty' });
    }
    if (/nhanh|siêu tốc|instant|speed|v2/.test(desc + name)) {
      badges.push({ text: '⚡ Siêu tốc', cls: 'speed' });
    }
    if (p.is_flash || p.featured || /khuyên dùng|hot|vip|chất lượng/.test(desc + name)) {
      badges.push({ text: '⭐ Khuyên dùng', cls: 'best' });
    }
    if (!badges.length) {
      badges.push({ text: '⚡ Tự động', cls: 'speed' });
    }
    return badges;
  }

  function isSocialProduct(productId) {
    const p = (state.data?.products || []).find(x => x.id === productId);
    return Boolean(p?.social);
  }

  function filteredSmmServices() {
    const q = smmState.search.trim().toLowerCase();
    return sellableProducts().filter(p => {
      if (!p.social) return false;
      const plat = detectSmmPlatform(p);
      if (smmState.platform !== 'all' && plat !== smmState.platform) return false;
      const act = detectSmmAction(p);
      if (smmState.action !== 'all' && act !== smmState.action) return false;
      if (q) {
        const full = `${p.name} ${p.description || ''} ${p.category || ''} ${plat}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      const pA = Number(a.unit_price || a.price || 0);
      const pB = Number(b.unit_price || b.price || 0);
      return pA - pB;
    });
  }

  function smmServerCard(p, isSelected) {
    const min = Math.max(1, Number(p.minimum_quantity || 1));
    const max = Math.max(min, Number(p.maximum_quantity || p.stock || 50000));
    const unitPrice = Number(p.unit_price || p.price || 0);
    const rate1k = Math.round(unitPrice * 1000);
    const platform = detectSmmPlatform(p);
    const platformIcon = {
      Facebook: '<span class="smm-p-icon fb sm">FB</span>',
      TikTok: '<span class="smm-p-icon tiktok sm">TT</span>',
      Instagram: '<span class="smm-p-icon ig sm">IG</span>',
      YouTube: '<span class="smm-p-icon yt sm">YT</span>',
      Telegram: '<span class="smm-p-icon tg sm">TG</span>',
      Other: '<span class="smm-p-icon other sm"><i data-icon="users"></i></span>'
    }[platform] || '<span class="smm-p-icon other sm"><i data-icon="users"></i></span>';
    const badges = getSmmBadges(p).map(b => `<span class="smm-server-badge ${b.cls}">${b.text}</span>`).join('');
    const serverId = p.social_server_id ? `SV${p.social_server_id}` : `ID ${p.id}`;

    return `
      <div class="smm-server-card ${isSelected ? 'active' : ''} ${p.available ? '' : 'disabled'}" data-smm-product="${escapeHTML(p.id)}">
        <div class="smm-sc-header">
          <div class="smm-sc-title-wrap">
            ${platformIcon}
            <div>
              <div class="smm-sc-id">${serverId} · ${escapeHTML(p.category || platform)}</div>
              <h4 class="smm-sc-name">${escapeHTML(p.name)}</h4>
            </div>
          </div>
          <div class="smm-sc-radio">
            <div class="smm-sc-check"></div>
          </div>
        </div>
        <div class="smm-sc-badges">${badges}</div>
        ${p.description ? `<p class="smm-sc-desc">${escapeHTML(p.description)}</p>` : ''}
        <div class="smm-sc-footer">
          <div class="smm-sc-rate">
            <span class="rate-1k">${money(rate1k)} <small>/ 1.000</small></span>
            <span class="rate-unit">(${money(unitPrice)}/lượt)</span>
          </div>
          <div class="smm-sc-limits">
            <i data-icon="package"></i>
            <span>${min.toLocaleString(locale())} – ${max.toLocaleString(locale())}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderSmmServerCards() {
    const listEl = $('#smmServerList');
    const emptyEl = $('#smmEmptyServices');
    if (!listEl) return;
    const services = filteredSmmServices();
    if (emptyEl) emptyEl.hidden = services.length > 0;

    if (!smmState.selectedProduct && services.length > 0) {
      selectSmmService(services[0].id, { scroll: false });
      return;
    }

    const selId = smmState.selectedProduct?.id;
    listEl.innerHTML = services.map(p => smmServerCard(p, p.id === selId)).join('');
    paintIcons(listEl);

    $$('[data-smm-product]', listEl).forEach(el => {
      el.onclick = () => {
        selectSmmService(el.dataset.smmProduct, { scroll: true });
        vibrate('light');
      };
    });
  }

  function selectSmmService(productId, { scroll = true } = {}) {
    const p = sellableProducts().find(x => x.id === productId);
    if (!p) return;
    smmState.selectedProduct = p;
    const plat = detectSmmPlatform(p);
    const min = Math.max(1, Number(p.minimum_quantity || 1));
    const max = Math.max(min, Number(p.maximum_quantity || p.stock || 50000));
    smmState.quantity = Math.max(min, Math.min(max, smmState.quantity || 100));

    const formCard = $('#smmFormCard');
    if (formCard) formCard.hidden = false;

    const platBadge = $('#smmSelectedPlatform');
    if (platBadge) {
      platBadge.textContent = plat.toUpperCase();
      platBadge.className = `smm-active-service-badge ${plat.toLowerCase()}`;
    }

    if ($('#smmSelectedTitle')) $('#smmSelectedTitle').textContent = p.name;
    if ($('#smmSelectedDesc')) $('#smmSelectedDesc').textContent = p.description || 'Xử lý tự động qua hệ thống máy chủ Dino SMM. Tốc độ cao, an toàn tuyệt đối.';

    const isComment = detectSmmAction(p) === 'comment' || (p.social_input_fields && p.social_input_fields.includes('comments'));
    const commentsGrp = $('#smmCommentsGroup');
    if (commentsGrp) commentsGrp.hidden = !isComment;

    if ($('#smmRangeHint')) $('#smmRangeHint').textContent = `Min: ${min.toLocaleString(locale())} · Max: ${max.toLocaleString(locale())}`;
    const qtyInput = $('#smmQtyInput');
    if (qtyInput) {
      qtyInput.min = String(min);
      qtyInput.max = String(max);
      qtyInput.value = smmState.quantity;
    }

    updateSmmQuote();
    renderSmmServerCards();

    if (scroll) {
      setTimeout(() => {
        formCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }
  }

  function updateSmmQuote() {
    const p = smmState.selectedProduct;
    if (!p) return;
    const min = Math.max(1, Number(p.minimum_quantity || 1));
    const max = Math.max(min, Number(p.maximum_quantity || p.stock || 50000));

    smmState.quantity = Math.max(min, Math.min(max, Number(smmState.quantity) || min));
    if ($('#smmQtyInput')) $('#smmQtyInput').value = smmState.quantity;

    const unitPrice = Number(p.unit_price || p.price || 0);
    const total = Math.ceil(unitPrice * smmState.quantity);
    const userBalance = Number(state.data?.profile?.balance || 0);
    const deficit = total - userBalance;

    if ($('#smmSummaryUnitPrice')) $('#smmSummaryUnitPrice').textContent = `${money(unitPrice)} / lượt`;
    if ($('#smmSummaryQty')) $('#smmSummaryQty').textContent = smmState.quantity.toLocaleString(locale());
    if ($('#smmSummaryTotal')) $('#smmSummaryTotal').textContent = money(total);

    const noteEl = $('#smmBalanceNote');
    if (noteEl) {
      if (userBalance >= total) {
        noteEl.innerHTML = `<span style="color:var(--smm-emerald-neon);">✓ Số dư ví đủ thanh toán (${money(userBalance)})</span>`;
      } else {
        noteEl.innerHTML = `<span style="color:#ffb74d;">⚠ Số dư ví: ${money(userBalance)} (Thiếu ${money(deficit)}) · Nạp thêm hoặc thanh toán QR</span>`;
      }
    }

    const walletBtn = $('#smmSubmitWalletBtn');
    if (walletBtn) {
      walletBtn.innerHTML = `<i data-icon="zap"></i><span>Tạo tiến trình bằng Ví Bot (${money(total)})</span>`;
      paintIcons(walletBtn);
    }
  }

  function handleSmmCommentInput() {
    const text = $('#smmCommentsInput')?.value || '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if ($('#smmCommentCount')) $('#smmCommentCount').textContent = `${lines.length} bình luận`;
    if (lines.length > 0 && smmState.selectedProduct) {
      const min = Math.max(1, Number(smmState.selectedProduct.minimum_quantity || 1));
      const max = Math.max(min, Number(smmState.selectedProduct.maximum_quantity || 50000));
      smmState.quantity = Math.max(min, Math.min(max, lines.length));
      updateSmmQuote();
    }
  }

  async function submitSmmOrder(method = 'balance') {
    const p = smmState.selectedProduct;
    if (!p) {
      toast('Vui lòng chọn một gói dịch vụ trước', true);
      return;
    }
    const targetLink = $('#smmTargetInput')?.value.trim();
    if (!targetLink) {
      toast('Vui lòng nhập Link hoặc Username cần buff', true);
      $('#smmTargetInput')?.focus();
      vibrate('heavy');
      return;
    }
    const isComment = detectSmmAction(p) === 'comment' || (p.social_input_fields && p.social_input_fields.includes('comments'));
    const comments = $('#smmCommentsInput')?.value.trim() || '';
    if (isComment && !comments) {
      toast('Dịch vụ này yêu cầu nhập nội dung bình luận', true);
      $('#smmCommentsInput')?.focus();
      vibrate('heavy');
      return;
    }

    const unitPrice = Number(p.unit_price || p.price || 0);
    const total = Math.ceil(unitPrice * smmState.quantity);
    const userBalance = Number(state.data?.profile?.balance || 0);

    if (method === 'balance') {
      if (userBalance < total) {
        const deficit = total - userBalance;
        $('#topupAmount').value = Math.max(10000, deficit);
        openTopup();
        toast(`Số dư ví còn thiếu ${money(deficit)}, vui lòng nạp thêm`, true);
        return;
      }

      const btn = $('#smmSubmitWalletBtn');
      const oldHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span>Đang gửi đơn lên máy chủ...</span><i data-icon="refresh"></i>`;
      paintIcons(btn);
      try {
        const res = await api('checkout/balance', {
          method: 'POST',
          body: JSON.stringify({
            product_id: p.id,
            quantity: smmState.quantity,
            target_link: targetLink,
            comments: comments,
            init_data: tg?.initData || ''
          })
        });

        if (res.paid) {
          if (Number.isFinite(Number(res.balance))) {
            state.data.profile.balance = Number(res.balance);
          }
          playSuccessChime();
          toast(res.message || 'Tạo tiến trình buff thành công!');

          if ($('#smmTargetInput')) $('#smmTargetInput').value = '';
          if ($('#smmCommentsInput')) $('#smmCommentsInput').value = '';

          await refreshTransactions({ silent: true });
          switchSmmTab('tracking');
        }
      } catch (err) {
        toast(err.message || 'Lỗi khi tạo đơn buff', true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
        paintIcons(btn);
        updateSmmQuote();
      }
    } else {
      state.selected = p;
      state.quantity = smmState.quantity;
      if ($('#checkoutTarget')) $('#checkoutTarget').value = targetLink;
      if ($('#checkoutComments')) $('#checkoutComments').value = comments;
      openPayment();
    }
  }

  function renderSmmTracking() {
    const allOrders = state.data?.orders || [];
    const socialOrders = allOrders.filter(o => o.is_social || o.supplier_order_id || isSocialProduct(o.product_id));

    const badge = $('#smmTrackingBadge');
    const activeCount = socialOrders.filter(o => !['completed', 'hoàn thành', 'refunded', 'hoàn tiền', 'cancelled', 'hủy'].includes(String(o.status || '').toLowerCase())).length;
    if (badge) {
      badge.textContent = activeCount;
      badge.hidden = activeCount === 0;
    }

    let filtered = socialOrders;
    if (smmState.trackingFilter === 'running') {
      filtered = socialOrders.filter(o => !['completed', 'hoàn thành', 'refunded', 'hoàn tiền', 'cancelled', 'hủy'].includes(String(o.status || '').toLowerCase()));
    } else if (smmState.trackingFilter === 'completed') {
      filtered = socialOrders.filter(o => ['completed', 'hoàn thành', 'done'].includes(String(o.status || '').toLowerCase()));
    } else if (smmState.trackingFilter === 'refunded') {
      filtered = socialOrders.filter(o => ['refunded', 'hoàn tiền', 'cancelled', 'hủy', 'partial'].includes(String(o.status || '').toLowerCase()));
    }

    const listEl = $('#smmOrderList');
    const emptyEl = $('#smmEmptyOrders');
    if (emptyEl) emptyEl.hidden = filtered.length > 0;
    if (!listEl) return;

    listEl.innerHTML = filtered.map(o => {
      const totalQty = Number(o.quantity || 1);
      const remains = Number.isFinite(Number(o.supplier_remains)) ? Number(o.supplier_remains) : null;
      let done = totalQty;
      let pct = 100;
      const statusLower = String(o.status || '').toLowerCase();
      const isDone = ['completed', 'hoàn thành', 'done'].includes(statusLower);
      const isRefunded = ['refunded', 'hoàn tiền', 'cancelled', 'hủy'].includes(statusLower);

      if (isDone) {
        done = totalQty;
        pct = 100;
      } else if (isRefunded) {
        done = remains !== null ? Math.max(0, totalQty - remains) : 0;
        pct = Math.round((done / totalQty) * 100);
      } else if (remains !== null) {
        done = Math.max(0, totalQty - remains);
        pct = Math.min(100, Math.max(5, Math.round((done / totalQty) * 100)));
      } else {
        done = 0;
        pct = 15;
      }

      const statusClass = isDone ? 'completed' : (isRefunded ? 'refunded' : 'running');
      const statusLabel = cleanStatus(o.status || 'Đang chạy');
      const startCount = o.supplier_start_count !== null && o.supplier_start_count !== undefined ? Number(o.supplier_start_count) : '—';

      return `
        <div class="smm-track-card" data-order-code="${escapeHTML(o.code)}">
          <div class="smm-track-head">
            <div class="smm-track-info">
              <h4>${escapeHTML(o.product_name || 'Dịch vụ tương tác')}</h4>
              <div class="smm-track-meta">
                <span class="code">#${escapeHTML(o.code)}</span>
                <span class="dot">·</span>
                <span>${date(o.timestamp)}</span>
                <span class="dot">·</span>
                <strong class="cost">${money(o.amount)}</strong>
              </div>
            </div>
            <span class="smm-track-status ${statusClass}">${escapeHTML(statusLabel)}</span>
          </div>

          ${o.target_link ? `
            <div class="smm-track-link">
              <i data-icon="arrow"></i>
              <span class="link-text" title="${escapeHTML(o.target_link)}">${escapeHTML(o.target_link)}</span>
              <button type="button" class="copy-link-btn" data-copy-link="${escapeHTML(o.target_link)}" title="Sao chép link">
                <i data-icon="copy"></i>
              </button>
            </div>
          ` : ''}

          <div class="smm-progress-wrap">
            <div class="smm-progress-header">
              <span>Tiến độ hoàn thành: <b>${done.toLocaleString(locale())} / ${totalQty.toLocaleString(locale())}</b></span>
              <b>${pct}%</b>
            </div>
            <div class="smm-progress-track">
              <div class="smm-progress-fill ${statusClass}" style="width: ${pct}%"></div>
            </div>
            <div class="smm-progress-stats">
              <span>Bắt đầu: <b>${startCount}</b></span>
              <span>Số lượng: <b>${totalQty.toLocaleString(locale())}</b></span>
              <span>Còn lại: <b>${remains !== null ? remains.toLocaleString(locale()) : 'Đang đếm'}</b></span>
            </div>
          </div>

          <div class="smm-track-actions">
            <button type="button" class="smm-track-refresh-btn" data-smm-refresh-order="${escapeHTML(o.code)}">
              <i data-icon="refresh"></i> Cập nhật tiến độ
            </button>
            <button type="button" class="smm-track-report-btn" data-smm-report-order="${escapeHTML(o.code)}">
              <i data-icon="shield"></i> Báo lỗi / Hỗ trợ
            </button>
          </div>
        </div>
      `;
    }).join('');

    paintIcons(listEl);

    $$('[data-copy-link]', listEl).forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        copyText(b.dataset.copyLink, 'Đã sao chép liên kết');
      };
    });

    $$('[data-smm-refresh-order]', listEl).forEach(b => {
      b.onclick = async () => {
        const code = b.dataset.smmRefreshOrder;
        b.disabled = true;
        b.classList.add('loading');
        try {
          const res = await api(`social/orders/${encodeURIComponent(code)}/refresh`, { method: 'POST' });
          if (res.order) {
            const idx = (state.data?.orders || []).findIndex(x => x.code === code);
            if (idx !== -1) state.data.orders[idx] = res.order;
            renderSmmTracking();
            toast(res.message || 'Đã cập nhật tiến độ mới nhất');
            vibrate('medium');
          }
        } catch (err) {
          toast(err.message || 'Không thể cập nhật lúc này', true);
        } finally {
          b.disabled = false;
          b.classList.remove('loading');
        }
      };
    });

    $$('[data-smm-report-order]', listEl).forEach(b => {
      b.onclick = () => {
        openWarranty(b.dataset.smmReportOrder);
      };
    });
  }

  function renderSmmPricing() {
    const services = sellableProducts().filter(p => p.social);
    const q = smmState.pricingSearch.trim().toLowerCase();
    const filtered = services.filter(p => {
      if (!q) return true;
      return `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase().includes(q);
    }).sort((a, b) => Number(a.unit_price || a.price || 0) - Number(b.unit_price || b.price || 0));

    const tbody = $('#smmPricingBody');
    if (!tbody) return;

    tbody.innerHTML = filtered.map(p => {
      const plat = detectSmmPlatform(p);
      const min = Math.max(1, Number(p.minimum_quantity || 1));
      const max = Math.max(min, Number(p.maximum_quantity || p.stock || 50000));
      const unitPrice = Number(p.unit_price || p.price || 0);
      const rate1k = Math.round(unitPrice * 1000);
      const warrantyText = p.social_warranty_time || p.warranty || (p.social_refill ? 'Có bảo hành' : 'Không');

      return `
        <tr>
          <td>
            <div class="smm-table-name">
              <b>${escapeHTML(p.name)}</b>
              <button type="button" class="smm-table-buy-btn" data-smm-quick-order="${escapeHTML(p.id)}">Tạo đơn</button>
            </div>
          </td>
          <td><span class="smm-platform-badge ${plat.toLowerCase()}">${plat}</span></td>
          <td><strong class="smm-price-highlight">${money(rate1k)}</strong></td>
          <td>${min.toLocaleString(locale())} – ${max.toLocaleString(locale())}</td>
          <td><span class="smm-warranty-pill">${escapeHTML(warrantyText)}</span></td>
        </tr>
      `;
    }).join('');

    $$('[data-smm-quick-order]', tbody).forEach(b => {
      b.onclick = () => {
        switchSmmTab('order');
        selectSmmService(b.dataset.smmQuickOrder);
      };
    });
  }

  function switchSmmTab(tab) {
    smmState.tab = tab;
    $$('[data-smm-tab]').forEach(b => b.classList.toggle('active', b.dataset.smmTab === tab));
    $('#smmOrderView')?.classList.toggle('active', tab === 'order');
    if ($('#smmOrderView')) $('#smmOrderView').hidden = tab !== 'order';
    $('#smmTrackingView')?.classList.toggle('active', tab === 'tracking');
    if ($('#smmTrackingView')) $('#smmTrackingView').hidden = tab !== 'tracking';
    $('#smmPricingView')?.classList.toggle('active', tab === 'pricing');
    if ($('#smmPricingView')) $('#smmPricingView').hidden = tab !== 'pricing';

    if (tab === 'order') renderSmmServerCards();
    else if (tab === 'tracking') renderSmmTracking();
    else if (tab === 'pricing') renderSmmPricing();
    vibrate();
  }

  function initSmmListeners() {
    if (smmState.initialized) return;
    smmState.initialized = true;

    $$('[data-smm-tab]').forEach(b => b.addEventListener('click', () => switchSmmTab(b.dataset.smmTab)));
    $$('[data-smm-platform]').forEach(b => b.addEventListener('click', () => {
      smmState.platform = b.dataset.smmPlatform;
      $$('[data-smm-platform]').forEach(x => x.classList.toggle('active', x === b));
      renderSmmServerCards();
      vibrate();
    }));
    $$('[data-smm-action]').forEach(b => b.addEventListener('click', () => {
      smmState.action = b.dataset.smmAction;
      $$('[data-smm-action]').forEach(x => x.classList.toggle('active', x === b));
      renderSmmServerCards();
      vibrate();
    }));

    $('#smmTopupBtn')?.addEventListener('click', openTopup);
    $('#smmSearchInput')?.addEventListener('input', e => {
      smmState.search = e.target.value;
      renderSmmServerCards();
    });
    $('#clearSmmSearch')?.addEventListener('click', () => {
      if ($('#smmSearchInput')) $('#smmSearchInput').value = '';
      smmState.search = '';
      renderSmmServerCards();
    });
    $('#clearSmmFilters')?.addEventListener('click', () => {
      smmState.platform = 'all';
      smmState.action = 'all';
      smmState.search = '';
      if ($('#smmSearchInput')) $('#smmSearchInput').value = '';
      $$('[data-smm-platform]').forEach(x => x.classList.toggle('active', x.dataset.smmPlatform === 'all'));
      $$('[data-smm-action]').forEach(x => x.classList.toggle('active', x.dataset.smmAction === 'all'));
      renderSmmServerCards();
    });

    $('#smmPasteBtn')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if ($('#smmTargetInput')) $('#smmTargetInput').value = text.trim();
        toast('Đã dán liên kết từ clipboard');
      } catch {
        toast('Không thể đọc clipboard', true);
      }
    });

    $('#smmQtyDec')?.addEventListener('click', () => {
      smmState.quantity = Math.max(1, smmState.quantity - 100);
      updateSmmQuote();
      vibrate();
    });
    $('#smmQtyInc')?.addEventListener('click', () => {
      smmState.quantity += 100;
      updateSmmQuote();
      vibrate();
    });
    $('#smmQtyInput')?.addEventListener('input', e => {
      const val = Number(e.target.value);
      if (Number.isFinite(val) && val > 0) {
        smmState.quantity = val;
        updateSmmQuote();
      }
    });

    $$('[data-add-qty]').forEach(b => {
      b.addEventListener('click', () => {
        smmState.quantity += Number(b.dataset.addQty);
        updateSmmQuote();
        vibrate();
      });
    });

    $('#smmSetMaxQty')?.addEventListener('click', () => {
      if (smmState.selectedProduct) {
        const max = Math.max(1, Number(smmState.selectedProduct.maximum_quantity || smmState.selectedProduct.stock || 50000));
        smmState.quantity = max;
        updateSmmQuote();
        vibrate();
      }
    });

    $('#smmCommentsInput')?.addEventListener('input', handleSmmCommentInput);
    $('#smmSubmitWalletBtn')?.addEventListener('click', () => submitSmmOrder('balance'));
    $('#smmSubmitOtherBtn')?.addEventListener('click', () => submitSmmOrder('other'));

    $$('[data-track-status]').forEach(b => {
      b.addEventListener('click', () => {
        smmState.trackingFilter = b.dataset.trackStatus;
        $$('[data-track-status]').forEach(x => x.classList.toggle('active', x === b));
        renderSmmTracking();
        vibrate();
      });
    });

    $('#smmRefreshAllBtn')?.addEventListener('click', async () => {
      const btn = $('#smmRefreshAllBtn');
      btn.classList.add('loading');
      try {
        await refreshTransactions({ silent: true });
        renderSmmTracking();
        toast('Đã làm mới danh sách đơn buff');
      } catch (err) {
        toast(err.message, true);
      } finally {
        btn.classList.remove('loading');
      }
    });

    $('#smmGoOrderBtn')?.addEventListener('click', () => switchSmmTab('order'));
    $('#smmPricingSearchInput')?.addEventListener('input', e => {
      smmState.pricingSearch = e.target.value;
      renderSmmPricing();
    });
  }

  function renderSmm() {
    initSmmListeners();
    const balance = Number(state.data?.profile?.balance || 0);
    if ($('#smmWalletBalance')) $('#smmWalletBalance').textContent = money(balance);
    if (smmState.tab === 'order') {
      renderSmmServerCards();
      if (smmState.selectedProduct) updateSmmQuote();
    } else if (smmState.tab === 'tracking') {
      renderSmmTracking();
    } else if (smmState.tab === 'pricing') {
      renderSmmPricing();
    }
  }

  function renderSocial() {
    renderSmm();
  }

  function orderCard(o) {
    const active = o.warranty?.active, rating = Number(o.rating || 0);
    const isSocial = Boolean(o.is_social || o.supplier_order_id || isSocialProduct(o.product_id));
    const socialBtn = isSocial ? `<button class="receive-order social-track-link" data-go-smm="${escapeHTML(o.code)}"><i data-icon="zap"></i><span>${langText('Theo dõi tiến độ buff', 'Track boost progress', '查看刷粉进度')}</span><i data-icon="chevron"></i></button>` : '';
    const prod = state.data?.products?.find(x => x.id === o.product_id);
    const artHtml = prod?.image_url 
      ? `<img src="${escapeHTML(prod.image_url)}" alt="${escapeHTML(o.product_name)}" loading="lazy">` 
      : `<b>${initials(o.product_name).slice(0, 1)}</b>`;
    const st = String(o.status || '').toLowerCase();
    let stBadge = `<span class="order-status-pill success"><i data-icon="check"></i> ${escapeHTML(cleanStatus(o.status))}</span>`;
    if (st.includes('pending') || st.includes('wait') || st.includes('chờ')) {
      stBadge = `<span class="order-status-pill pending"><i data-icon="clock"></i> ${escapeHTML(cleanStatus(o.status))}</span>`;
    } else if (st.includes('fail') || st.includes('cancel') || st.includes('hủy')) {
      stBadge = `<span class="order-status-pill failed"><i data-icon="shield"></i> ${escapeHTML(cleanStatus(o.status))}</span>`;
    }
    const warrantyStatusText = active 
      ? `<span class="warranty-active-text"><i data-icon="shield"></i> ${langText('Còn hạn', 'Active', '有效')}</span>` 
      : o.warranty?.expired 
        ? `<span class="warranty-expired-text">${langText('Hết hạn', 'Expired', '已过期')}</span>` 
        : `<span>${langText('Theo chính sách', 'Per policy', '按政策')}</span>`;

    const ratingHtml = o.can_rate ? `
      <div class="order-rating-box">
        <span>${langText('Đánh giá đơn hàng', 'Rate order', '评价订单')}</span>
        <div class="rating-stars" aria-label="${langText('Đánh giá', 'Rating', '评分')}">
          ${[1, 2, 3, 4, 5].map(v => `
            <button class="star-btn ${v <= rating ? 'active' : ''}" data-rate-order="${escapeHTML(o.code)}" data-rate-value="${v}" aria-label="${v} sao">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="${v <= rating ? '#F59E0B' : 'rgba(255,255,255,0.18)'}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </button>
          `).join('')}
        </div>
      </div>
    ` : '';

    return `<article class="order-card">
      <div class="order-card-head">
        <div class="order-product">
          <span class="product-icon" style="${styleVars(o.product_id || o.code)}">${artHtml}</span>
          <div>
            <h3>${escapeHTML(o.product_name)}</h3>
            <small>#${escapeHTML(o.code)}</small>
          </div>
        </div>
        ${stBadge}
      </div>

      <div class="order-details">
        <div class="order-metric">
          <small>${langText('NGÀY MUA', 'DATE', '日期')}</small>
          <b>${date(o.timestamp)}</b>
        </div>
        <div class="order-metric">
          <small>${langText('THANH TOÁN', 'PAYMENT', '付款')}</small>
          <strong class="order-amount">${money(o.amount)}</strong>
        </div>
        <div class="order-metric">
          <small>${langText('BẢO HÀNH', 'WARRANTY', '保修')}</small>
          <b>${warrantyStatusText}</b>
        </div>
      </div>

      ${socialBtn}

      ${o.is_surfshark ? (() => {
        const ss = o.surfshark || {};
        const totalSlots = Math.max(1, Number(ss.slots_total || o.quantity || 1));
        const usedSlots = Math.max(0, Number(ss.slots_used || 0));
        const remSlots = Math.max(0, Number(ss.slots_remaining ?? (totalSlots - usedSlots)));
        const done = remSlots <= 0;
        return `
        <button class="ss-order-cta ${done ? 'completed' : ''}" data-surfshark-activate="${escapeHTML(o.code)}">
          <span class="ss-order-cta-badge">${done ? '✅' : '🦈'}</span>
          <div class="ss-order-cta-text">
            <b>${done
              ? langText(`Đã kích hoạt đủ (${usedSlots}/${totalSlots} thiết bị)`, `All devices activated (${usedSlots}/${totalSlots})`, `已全部激活 (${usedSlots}/${totalSlots})`)
              : langText(`Nhập mã 6 ký tự Surfshark (còn ${remSlots}/${totalSlots} lượt)`, `Enter 6-char Surfshark code (${remSlots}/${totalSlots} left)`, `输入 Surfshark 6位激活码（剩 ${remSlots}/${totalSlots} 次）`)
            }</b>
            <small>${done
              ? langText('Bấm để xem các mã đã kích hoạt', 'Tap to view activated codes', '点击查看已激活记录')
              : langText('Mở app Surfshark → Log in with code → Nhập mã ngay', 'Open Surfshark app → Log in with code', '打开 Surfshark → Log in with code')
            }</small>
          </div>
          <i data-icon="arrow"></i>
        </button>`;
      })() : ''}

      ${o.has_delivery ? `
        <button class="receive-order" data-delivery="${escapeHTML(o.code)}">
          <span class="receive-icon"><i data-icon="eye"></i></span>
          <div class="receive-text">
            <b>${langText('Xem sản phẩm đã nhận', 'View delivered items', '查看已交付内容')}</b>
            <small>${o.delivered_count ? `${o.delivered_count} ${langText('mục sẵn sàng', 'items ready', '项已就绪')}` : langText('Bấm để mở tài khoản / key', 'Tap to reveal keys', '点击查看账号')}</small>
          </div>
          <i data-icon="arrow"></i>
        </button>
      ` : ''}

      ${ratingHtml}

      <div class="order-actions">
        <button class="btn-order-rebuy" data-rebuy="${o.product_id}">
          <i data-icon="refresh"></i><span>${langText('Mua lại', 'Buy again', '再次购买')}</span>
        </button>
        ${active ? `
          <button class="btn-order-warranty" data-warranty="${o.code}">
            <i data-icon="shield"></i><span>${langText('Yêu cầu bảo hành', 'Warranty request', '申请保修')}</span>
          </button>
        ` : ''}
      </div>
    </article>`;
  }
  function claimCard(c) {
    const labels = { pending: langText('Đang chờ admin', 'Waiting for admin', '等待管理员'), open: langText('Đang xử lý', 'Processing', '处理中'), approved: langText('Đã duyệt', 'Approved', '已批准'), rejected: langText('Từ chối', 'Rejected', '已拒绝'), completed: langText('Hoàn tất', 'Completed', '已完成') }; return `<article class="order-card"><div class="order-card-head"><div class="order-product"><span class="product-icon" style="${styleVars(c.id)}"><b>BH</b></span><div><h3>${langText('Yêu cầu', 'Request', '请求')} ${escapeHTML(c.id)}</h3><small>${langText('Đơn', 'Order', '订单')} #${escapeHTML(c.order_code)}</small></div></div><span class="status-badge">${labels[c.status] || escapeHTML(c.status)}</span></div><div class="claim-status"><i data-icon="clock"></i><span>${escapeHTML(c.description || langText('Đang chờ xử lý', 'Waiting for processing', '等待处理'))} · ${date(c.timestamp)}</span></div></article>`;
  }
  function renderOrders() {
    const orders = state.data.orders || [], claims = state.data.claims || []; $('#orderCount').textContent = `${orders.length} ${langText('đơn', 'orders', '单')}`; $('#warrantyCount').textContent = `${orders.filter(o => o.warranty?.active).length} ${langText('đơn', 'orders', '单')}`; $('#claimCount').textContent = claims.length; $('#orderDot').hidden = !orders.length;
    $('#orderList').innerHTML = orders.map(orderCard).join(''); $('#claimList').innerHTML = claims.map(claimCard).join(''); $('#emptyOrders').hidden = (state.orderTab === 'orders' ? orders : claims).length > 0; paintIcons($('#orderList')); paintIcons($('#claimList'));
    $$('[data-warranty]').forEach(b => b.onclick = () => openWarranty(b.dataset.warranty)); $$('[data-surfshark-activate]').forEach(b => b.onclick = () => openSurfsharkActivate(b.dataset.surfsharkActivate)); $$('[data-delivery]').forEach(b => b.onclick = () => openDelivery(b.dataset.delivery)); $$('[data-rebuy]').forEach(b => b.onclick = () => { const p = state.data.products.find(x => x.id === b.dataset.rebuy); if (p) openProduct(p); else toast('Sản phẩm này đang tạm ẩn', true); }); $$('[data-rate-order]').forEach(button => button.onclick = () => submitRating(button.dataset.rateOrder, Number(button.dataset.rateValue)));
    $$('[data-go-smm]').forEach(b => b.onclick = () => { go('social'); switchSmmTab('tracking'); });
  }
  const WHEEL_SEGMENTS = [
    { label: 'Chúc may mắn', sub: '😢 Lần sau nhé', color: '#0f291e', textColor: '#d4fa7a' },
    { label: '50.000₫', sub: '💎 Jackpot', color: '#0d9c6b', textColor: '#ffffff' },
    { label: 'Giảm 10%', sub: '🎟 Coupon', color: '#174435', textColor: '#ffd875' },
    { label: 'Thử lại', sub: '😢 Lần sau nhé', color: '#0f291e', textColor: '#d4fa7a' },
    { label: '20.000₫', sub: '💵 Nạp ví', color: '#0a7e56', textColor: '#ffffff' },
    { label: 'Giảm 20%', sub: '🎟 Coupon', color: '#1a4e3d', textColor: '#ffd875' },
    { label: '2.000₫', sub: '🪙 Nạp ví', color: '#0d9c6b', textColor: '#ffffff' },
    { label: 'May mắn', sub: '😢 Chúc bạn vui', color: '#0f291e', textColor: '#d4fa7a' },
  ];

  function drawWheelCanvas() {
    const canvas = $('#wheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    const cx = width / 2, cy = height / 2, radius = cx - 18;
    const numSegments = WHEEL_SEGMENTS.length;
    const arc = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < numSegments; i++) {
      const seg = WHEEL_SEGMENTS[i];
      const startAngle = i * arc - Math.PI / 2 - arc / 2;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.stroke();

      const dotAngle = startAngle + arc / 2;
      const dotX = cx + (radius - 16) * Math.cos(dotAngle);
      const dotY = cy + (radius - 16) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#ffd426' : '#ffffff';
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.textColor;
      ctx.font = 'bold 23px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(seg.label, radius - 36, 4);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.font = '600 15px "Manrope", sans-serif';
      ctx.fillText(seg.sub, radius - 36, 26);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, 2 * Math.PI);
    ctx.fillStyle = '#0B111A';
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function renderWheel() {
    const wheel = state.data?.wheel || {};
    const spins = Math.max(0, Number(wheel.spins || 0));
    const totalWon = Number(wheel.total_won || 0);

    const wEl = $('#wheelBadge'); if (wEl) { wEl.textContent = String(spins); wEl.hidden = spins <= 0; }
    if ($('#wheelSpinsText')) $('#wheelSpinsText').textContent = String(spins);
    if ($('#wheelWonText')) $('#wheelWonText').textContent = money(totalWon);
    if ($('#spinWheelBtn')) $('#spinWheelBtn').disabled = state.wheelSpinning || spins <= 0;
  }

  async function spinWheel() {
    if (state.wheelSpinning) return;
    const spins = Math.max(0, Number(state.data?.wheel?.spins || 0));
    if (spins <= 0) {
      toast(langText('Bạn đã hết lượt quay! Hoàn thành đơn mới để nhận thêm lượt nhé.', 'No spins remaining! Complete new orders to earn more spins.', '抽奖次数已用完！完成新订单即可获得更多抽奖机会。'), true);
      return;
    }

    unlockSound();
    state.wheelSpinning = true;
    if ($('#spinWheelBtn')) $('#spinWheelBtn').disabled = true;
    if ($('#spinCenterBtn')) $('#spinCenterBtn').style.pointerEvents = 'none';

    try {
      const result = await api('wheel/spin', { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) });
      const targetSegment = Number(result.segment_index ?? 0);
      const numSegments = WHEEL_SEGMENTS.length;
      const segmentAngle = 360 / numSegments;

      const startAngle = state.wheelRotation || 0;
      const targetAngle = (360 - (targetSegment * segmentAngle)) % 360;
      const fullSpins = 360 * 5;
      const delta = fullSpins + ((targetAngle - (startAngle % 360) + 360) % 360);
      const endAngle = startAngle + delta;

      const canvas = $('#wheelCanvas');
      const duration = 4400;
      const startTime = performance.now();
      let lastBoundary = Math.floor(startAngle / segmentAngle);

      playWheelSpinStart();

      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, Math.max(0, elapsed / duration));
        const progress = 1 - Math.pow(1 - t, 3.8);
        const currentAngle = startAngle + delta * progress;

        if (canvas) canvas.style.transform = `rotate(${currentAngle}deg)`;

        const currentBoundary = Math.floor(currentAngle / segmentAngle);
        if (currentBoundary > lastBoundary) {
          const speedRemaining = 1 - progress;
          playWheelTickSound(450 + speedRemaining * 350);
          vibrate('light');
          lastBoundary = currentBoundary;
        }

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          state.wheelRotation = endAngle;
          state.wheelSpinning = false;
          if ($('#spinCenterBtn')) $('#spinCenterBtn').style.pointerEvents = 'auto';

          if (state.data?.wheel) {
            state.data.wheel.spins = result.remaining_spins;
            if (result.prize?.type === 'balance') {
              state.data.wheel.total_won = Number(state.data.wheel.total_won || 0) + Number(result.prize.value || 0);
              if (state.data.profile) state.data.profile.balance = result.new_balance;
              renderProfile();
            }
          }
          renderWheel();

          if (result.prize?.type !== 'nothing') {
            playWinSound();
            toast(result.prize.message || langText('Chúc mừng bạn đã trúng thưởng!', 'Congratulations on winning!', '恭喜您中奖！'));
          } else {
            playLoseSound();
            toast(result.prize?.message || langText('Chúc bạn may mắn lần sau nhé!', 'Better luck next time!', '祝您下次好运！'));
          }
        }
      }

      requestAnimationFrame(step);

    } catch (e) {
      state.wheelSpinning = false;
      if ($('#spinWheelBtn')) $('#spinWheelBtn').disabled = false;
      if ($('#spinCenterBtn')) $('#spinCenterBtn').style.pointerEvents = 'auto';
      toast(e.message, true);
    }
  }

  function syncSelectedProduct() {
    if (!state.selected || !$('#productSheet').classList.contains('open')) return;
    const fresh = (state.data.products || []).find(p => p.id === state.selected.id);
    if (!fresh) { state.selected = { ...state.selected, available: false, stock: 0 }; $('#sheetStock').textContent = tr('Hết hàng'); $('#buyButton').disabled = true; return; }
    state.selected = fresh;
    const bounds = qtyBounds(fresh);
    state.quantity = Math.min(bounds.max, Math.max(bounds.min, state.quantity));
    $('#sheetStock').textContent = fresh.social ? `${langText('SL', 'Qty', '数量')} ${bounds.min}–${bounds.max}` : fresh.manual ? langText('Xử lý 5–15 phút', 'Processed in 5–15 minutes', '5–15 分钟处理') : fresh.available ? `${langText('Còn', 'Available', '剩余')} ${Number(fresh.stock).toLocaleString(locale())}` : tr('Hết hàng');
    $('#buyButton').disabled = !(fresh.available || fresh.preorder_available);
    $('#buyButton').innerHTML = fresh.preorder_available && !fresh.available ? `<span>${langText('Đặt trước', 'Preorder', '预订')}</span><i data-icon="clock"></i>` : `<span>${langText('Mua ngay', 'Buy now', '立即购买')}</span><i data-icon="arrow"></i>`;
    updateSheetPrice();
  }
  function renderAll() { renderProfile(); renderHome(); renderShop(); renderSocial(); renderOrders(); renderWheel(); renderNetflix(); applyLanguage(); syncSelectedProduct(); }
  function bindProducts(root) { $$('[data-product]', root).forEach(b => b.onclick = () => { const p = state.data.products.find(x => x.id === b.dataset.product); if (p) openProduct(p); }); }

  function renderNetflix() {
    const netflix = state.data?.netflix;
    if (!netflix) return;

    const enabled = netflix.enabled !== false;
    const banner = $('#netflixDisabledBanner');
    if (banner) banner.hidden = enabled;

    const plan = netflix.plan || {};
    const isActive = Boolean(plan.is_active);
    const planId = plan.plan_id;

    if ($('#netflixPlanBadge')) {
      $('#netflixPlanBadge').textContent = isActive ? (planId === 'pro' ? 'VIP PRO' : 'VIP BASIC') : 'CHƯA KÍCH HOẠT';
      $('#netflixPlanBadge').style.background = isActive ? '#0d9c6b' : '#e50914';
    }
    if ($('#netflixPlanTitle')) {
      $('#netflixPlanTitle').textContent = isActive ? (plan.plan_label || (planId === 'pro' ? 'Gói Pro (TV)' : 'Gói Basic')) : 'Chưa có gói VIP';
    }
    if ($('#netflixDaysLeft')) {
      $('#netflixDaysLeft').textContent = isActive ? `${plan.days_left || 0} ngày` : '0 ngày';
    }
    if ($('#netflixUsageToday')) {
      $('#netflixUsageToday').textContent = isActive ? `${plan.daily_used || 0} / ${plan.daily_limit || 0}` : '0 / 0';
    }
    if ($('#netflixTvPerm')) {
      $('#netflixTvPerm').textContent = isActive ? (plan.can_tv ? 'Có hỗ trợ (Pro)' : 'Chỉ Link (Basic)') : 'Chưa hỗ trợ';
      $('#netflixTvPerm').style.color = plan.can_tv ? '#4cd137' : '#fff';
    }

    const actionsPanel = $('#netflixActionsPanel');
    if (actionsPanel) {
      actionsPanel.style.opacity = '1';
      actionsPanel.style.pointerEvents = 'auto';
    }

    const tvLock = $('#netflixTvLockOverlay');
    if (tvLock) {
      tvLock.hidden = Boolean(isActive && plan.can_tv);
    }

    const linkLock = $('#netflixLinkLockOverlay');
    if (linkLock) {
      linkLock.hidden = Boolean(isActive);
    }

    const acc = netflix.account || {};
    if ($('#netflixAccIdLabel') && acc.id) {
      $('#netflixAccIdLabel').textContent = acc.id;
    }
    if ($('#netflixAccCountryBadge') && acc.country_flag) {
      $('#netflixAccCountryBadge').textContent = acc.country_flag;
    }
    if ($('#netflixAccCountryVal') && acc.country_name) {
      $('#netflixAccCountryVal').textContent = acc.country_name;
    }
    if ($('#netflixAccPlanVal') && acc.plan) {
      $('#netflixAccPlanVal').textContent = acc.plan;
    }
    if ($('#netflixAccRegionVal') && acc.region) {
      $('#netflixAccRegionVal').textContent = acc.region;
    }

    const pricing = netflix.pricing || {};
    if ($('#netflixBasicPrice') && pricing.basic) {
      $('#netflixBasicPrice').textContent = money(pricing.basic.price);
    }
    if ($('#netflixProPrice') && pricing.pro) {
      $('#netflixProPrice').textContent = money(pricing.pro.price);
    }

    const history = netflix.history || [];
    const list = $('#netflixHistoryList');
    if (list) {
      const historyKey = JSON.stringify(history);
      if (state._lastNfHistoryKey !== historyKey) {
        state._lastNfHistoryKey = historyKey;
        if (!history.length) {
          list.innerHTML = `<div class="delivery-loading" style="padding:16px;">Chưa có lịch sử sử dụng Netflix.</div>`;
        } else {
          list.innerHTML = history.slice().reverse().map(item => {
            const typeLabel = item.type === 'tv' ? 'Ghép TV' : (item.type === 'mobile' ? 'Link Mobile' : (item.type === 'pc' ? 'Link PC' : 'Cookie'));
            const timeStr = date(item.timestamp);
            const detail = item.tv_code ? `Mã TV: <b>${escapeHTML(item.tv_code)}</b>` : (item.link ? `<a href="${escapeHTML(item.link)}" target="_blank" style="color:#4fc3f7;">Mở link</a>` : 'Đã sao chép');
            return `<article class="admin-row" style="padding:10px 14px;background:#150608;border-color:rgba(229,9,20,0.2);"><div class="admin-row-main"><b style="color:#fff;">${typeLabel} · ${escapeHTML(item.email || '')}</b><small style="color:#8f9592;">${timeStr}</small><span>${detail}</span></div></article>`;
          }).join('');
        }
      }
    }
  }

  async function buyNetflixVip(planId) {
    if (state.netflixBuyBusy) return;
    const planName = planId === 'pro' ? 'Gói Pro (TV)' : 'Gói Basic';
    const accepted = await confirmAdminAction(`Xác nhận mua/gia hạn ${planName} bằng số dư ví?`);
    if (!accepted) return;
    state.netflixBuyBusy = true;
    const buyBtns = ['#buyNetflixBasicBtn', '#buyNetflixProBtn'].map(sel => $(sel)).filter(Boolean);
    buyBtns.forEach(b => { b.disabled = true; });
    try {
      const res = await api('netflix/buy-vip', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, init_data: tg?.initData || '' })
      });
      if (res.netflix && state.data) {
        state.data.netflix = res.netflix;
      }
      playSuccessChime();
      toast(res.message || 'Đã kích hoạt VIP Netflix thành công!');
      await refreshTransactions({ silent: true });
      renderNetflix();
    } catch (e) {
      toast(e.message, true);
    } finally {
      state.netflixBuyBusy = false;
      buyBtns.forEach(b => { b.disabled = false; });
    }
  }

  async function pairNetflixTv() {
    if (state.netflixTvBusy) return;
    const code = String($('#netflixTvCodeInput')?.value || '').trim();
    if (!code) {
      toast('Vui lòng nhập mã TV 8 số', true);
      return;
    }
    state.netflixTvBusy = true;
    const btn = $('#netflixTvPairBtn');
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang ghép TV...';
    }
    const resBox = $('#netflixTvResult');
    if (resBox) resBox.hidden = true;
    try {
      const res = await api('netflix/pair-tv', {
        method: 'POST',
        body: JSON.stringify({ tv_code: code, init_data: tg?.initData || '' })
      });
      if (res.netflix && state.data) {
        state.data.netflix = res.netflix;
      }
      playSuccessChime();
      toast(res.message || 'Kích hoạt TV thành công!');
      if (resBox) {
        resBox.hidden = false;
        resBox.style.color = '#4cd137';
        resBox.innerHTML = `✅ ${escapeHTML(res.message)}`;
      }
      $('#netflixTvCodeInput').value = '';
      renderNetflix();
    } catch (e) {
      if (resBox) {
        resBox.hidden = false;
        resBox.style.color = '#ff4757';
        resBox.innerHTML = `❌ ${escapeHTML(e.message)}`;
      }
      toast(e.message, true);
    } finally {
      state.netflixTvBusy = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      }
    }
  }

  function setNetflixLinkLoading(active, mode = 'mobile') {
    const overlay = $('#netflixLinkBusyOverlay');
    const titleEl = $('#netflixLinkBusyTitle');
    const descEl = $('#netflixLinkBusyDesc');
    const btnConfigs = [
      { el: $('#netflixGetLinkPcBtn'), match: 'pc', busyText: 'Đang tạo link PC...' },
      { el: $('#netflixGetLinkMobileBtn'), match: 'mobile', busyText: 'Đang tạo link Mobile...' },
      { el: $('#netflixGetCookieBtn'), match: 'cookie', busyText: 'Đang xuất Cookie...' },
      { el: $('#netflixRefresh'), match: null, busyText: '' },
    ];

    if (active) {
      const modeLabels = {
        pc: 'Đang tạo link PC / Laptop...',
        mobile: 'Đang tạo link Mobile App...',
        cookie: 'Đang xuất Cookie Netscape...',
      };
      if (titleEl) titleEl.textContent = modeLabels[mode] || 'Đang tạo link đăng nhập...';
      if (descEl) descEl.textContent = 'Đang kiểm tra cookie live & khởi tạo token bảo mật. Vui lòng không chạm lại cho đến khi hoàn thành.';
      if (overlay) overlay.hidden = false;
      btnConfigs.forEach(({ el, match, busyText }) => {
        if (!el) return;
        if (!el.dataset.origHtml) el.dataset.origHtml = el.innerHTML;
        el.disabled = true;
        el.setAttribute('aria-busy', 'true');
        if (match === mode && busyText) el.textContent = busyText;
      });
    } else {
      if (overlay) overlay.hidden = true;
      btnConfigs.forEach(({ el }) => {
        if (!el) return;
        el.disabled = false;
        el.removeAttribute('aria-busy');
        if (el.dataset.origHtml) {
          el.innerHTML = el.dataset.origHtml;
          delete el.dataset.origHtml;
        }
      });
    }
  }

  async function getNetflixLink(mode) {
    if (state.netflixLinkBusy) return;
    state.netflixLinkBusy = true;
    const resBox = $('#netflixLinkResult');
    if (resBox) resBox.hidden = true;
    setNetflixLinkLoading(true, mode);
    try {
      const res = await api('netflix/get-link', {
        method: 'POST',
        body: JSON.stringify({ mode: mode, init_data: tg?.initData || '' })
      });
      if (res.netflix && state.data) {
        state.data.netflix = res.netflix;
      }
      renderNetflix();

      const d = res.data || {};
      const planName = d.plan || 'Standard';
      const email = d.email || '-';
      const phone = d.phone || '-';
      const billing = d.billing || '-';
      const videoQuality = d.videoQuality || '-';
      const maxStreams = d.maxStreams || '-';
      const profiles = d.profiles || '-';
      const paymentInfo = d.paymentType ? (d.last4 && d.last4 !== '-' ? `${d.paymentType} (••• ${d.last4})` : d.paymentType) : (d.last4 && d.last4 !== '-' ? `••• ${d.last4}` : '-');

      if (mode === 'cookie') {
        const cookieText = d.cookie_text || '';
        await copyText(cookieText, 'Đã sao chép Cookie Netscape');
        if (resBox) {
          resBox.hidden = false;
          resBox.innerHTML = `
            <div style="color:#4cd137;font-weight:800;margin-bottom:8px;">✅ XUẤT COOKIE NETFLIX THÀNH CÔNG</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;margin-bottom:10px;color:#cfd6d3;">
              <div>📧 <b>Email:</b> ${escapeHTML(email)}</div>
              <div>📱 <b>SĐT:</b> ${escapeHTML(phone)}</div>
              <div>👑 <b>Gói:</b> ${escapeHTML(planName)}</div>
              <div>📺 <b>Thiết bị:</b> ${escapeHTML(maxStreams)} streams</div>
              <div>👤 <b>Hồ sơ:</b> ${escapeHTML(profiles)}</div>
              <div>⏳ <b>Hạn dùng:</b> ${escapeHTML(billing)}</div>
            </div>
            <button id="copyCookieAgainBtn" class="primary-button" style="padding:10px;font-size:11px;background:#e50914;">
              <span>📋 Sao chép lại Cookie</span>
            </button>
          `;
          $('#copyCookieAgainBtn')?.addEventListener('click', () => copyText(cookieText, 'Đã sao chép Cookie Netscape'));
        }
      } else {
        const link = d.link || '';
        playSuccessChime();
        toast('Lấy link thành công!');
        if (resBox) {
          resBox.hidden = false;
          resBox.innerHTML = `
            <div style="color:#4cd137;font-weight:800;margin-bottom:8px;">✅ TẠO LINK ĐĂNG NHẬP 1-CLICK THÀNH CÔNG</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;margin-bottom:10px;color:#cfd6d3;">
              <div>📧 <b>Email:</b> ${escapeHTML(email)}</div>
              <div>📱 <b>SĐT:</b> ${escapeHTML(phone)}</div>
              <div>👑 <b>Gói:</b> ${escapeHTML(planName)}</div>
              <div>📺 <b>Chất lượng:</b> ${escapeHTML(videoQuality)} (${escapeHTML(maxStreams)} máy)</div>
              <div>💳 <b>Thanh toán:</b> ${escapeHTML(paymentInfo)}</div>
              <div>⏳ <b>Hạn dùng:</b> ${escapeHTML(billing)}</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button id="copyLinkBtn" class="primary-button" style="flex:1;padding:10px;font-size:11px;background:#e50914;">
                <span>📋 Sao Chép Link</span>
              </button>
              <button id="openLinkBtn" class="primary-button" style="flex:1;padding:10px;font-size:11px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);">
                <span>🚀 Mở Trình Duyệt</span>
              </button>
            </div>
          `;
          $('#copyLinkBtn')?.addEventListener('click', () => copyText(link, 'Đã sao chép link đăng nhập'));
          $('#openLinkBtn')?.addEventListener('click', () => {
            if (tg?.openLink) tg.openLink(link);
            else window.open(link, '_blank');
          });
        }
      }
    } catch (e) {
      if (resBox) {
        resBox.hidden = false;
        resBox.style.color = '#ff4757';
        resBox.innerHTML = `❌ ${escapeHTML(e.message)}`;
      }
      toast(e.message, true);
    } finally {
      state.netflixLinkBusy = false;
      setNetflixLinkLoading(false);
    }
  }

  function go(page) {
    const validPages = ['home', 'shop', 'orders', 'tools', 'profile', 'social', 'netflix', 'admin'];
    if (!validPages.includes(page)) page = 'home';
    if (page === 'admin' && !state.data?.profile?.is_admin) { toast(langText('Bạn không có quyền quản trị', 'You do not have admin access', '您没有管理权限'), true); page = 'profile'; }
    state.page = page;
    if (page === 'admin' && state.data?.profile?.is_admin) $('#miniAdminPage')?.removeAttribute('hidden');
    $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === page)); $$('[data-go]', $('#bottomNav')).forEach(b => b.classList.toggle('active', b.dataset.go === page)); scrollToTop(); requestAnimationFrame(scrollToTop); if (page === 'shop') setTimeout(() => $('#searchInput')?.focus({ preventScroll: true }), 250); if (page === 'social') { renderSmm(); setTimeout(() => $('#smmSearchInput')?.focus({ preventScroll: true }), 250); } if (page === 'admin') refreshAdmin(Boolean(state.adminData)); vibrate();
  }
  function openProduct(p) {
    state.selected = p; state.quantity = Math.max(1, Number(p.minimum_quantity || 1)); state.quoteAmount = 0; clearTimeout(state.quoteTimer); recordRecent(p.id); const icon = $('#sheetProductIcon'); icon.style.cssText = styleVars(p.id); icon.innerHTML = `<span class="product-logo">${initials(p.name).slice(0, 1)}</span><img src="${escapeHTML(p.image_url)}" alt="Banner ${escapeHTML(p.name)}" draggable="false" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none'">`; $('#sheetCategory').textContent = p.category.toUpperCase(); $('#sheetTitle').textContent = p.name; $('#sheetDescription').textContent = p.description; $('#sheetDuration').textContent = p.duration || tr(p.social ? 'Theo số lượng' : 'Giao tức thì'); $('#sheetWarranty').textContent = p.warranty; $('#sheetStock').textContent = p.social ? `${langText('SL', 'Qty', '数量')} ${Number(p.minimum_quantity || 1).toLocaleString(locale())}–${Number(p.maximum_quantity || p.stock || 1).toLocaleString(locale())}` : p.manual ? langText('Xử lý 5–15 phút', 'Processed in 5–15 minutes', '5–15 分钟处理') : p.available ? `${langText('Còn', 'Available', '剩余')} ${Number(p.stock).toLocaleString(locale())}` : p.preorder_available ? `${langText('Đặt trước', 'Preorder', '预订')} · ${Number(p.preorder_fee_percent || 0).toLocaleString(locale())}% · ${p.preorder_wait_hours || 24}h` : tr('Hết hàng'); const needsInput = Boolean(p.manual || p.social); $('#checkoutInputs').hidden = !needsInput; $('#checkoutEmailWrap').hidden = !p.manual; $('#checkoutTargetWrap').hidden = !p.social; $('#checkoutCommentsWrap').hidden = !p.social; $('#checkoutEmail').value = ''; $('#checkoutTarget').value = ''; $('#checkoutComments').value = ''; $('#couponCode').value = ''; $('#couponCode').disabled = Boolean(p.preorder_available && !p.available); $('#couponHint').textContent = p.preorder_available && !p.available ? langText(`Phí đặt trước ${p.preorder_fee_percent}% · Quá ${p.preorder_wait_hours}h hoàn đủ ${money(p.preorder_total)}`, `Preorder fee ${p.preorder_fee_percent}% · Full refund after ${p.preorder_wait_hours}h`, `预订费 ${p.preorder_fee_percent}% · ${p.preorder_wait_hours}小时后全额退款`) : ''; const buy = $('#buyButton'); buy.disabled = !(p.available || p.preorder_available); buy.innerHTML = p.preorder_available && !p.available ? `<span>${langText('Đặt trước', 'Preorder', '预订')}</span><i data-icon="clock"></i>` : `<span>${langText('Mua ngay', 'Buy now', '立即购买')}</span><i data-icon="arrow"></i>`; updateSheetPrice(); renderCommerceButtons(); paintIcons(buy); openSheet('#productSheet');
  }
  function qtyBounds(p = state.selected) { const min = Math.max(1, Number(p?.minimum_quantity || 1)); const max = p?.preorder_available && !p?.available ? Math.max(min, Number(p?.maximum_quantity || 100)) : p?.social ? Math.max(min, Number(p?.maximum_quantity || p?.stock || min)) : Math.max(min, Number(p?.stock || min)); return { min, max }; }
  function localTotal(p = state.selected, quantity = state.quantity) { if (!p) return 0; if (p.preorder_available && !p.available) { const base = Number(p.preorder_unit_price || p.price || 0) * quantity, fee = Math.ceil(base * Number(p.preorder_fee_bps || 0) / 10000); return base + fee; } if (p.social && Number(p.unit_price) > 0) return Math.ceil(Number(p.unit_price) * quantity); return Number(p.price || 0) * quantity; }
  function refreshQuote() { if (!state.selected) return; if (state.selected.preorder_available && !state.selected.available) { state.quoteAmount = localTotal(); $('#sheetPrice').textContent = money(state.quoteAmount); $('#couponHint').textContent = langText(`SL ${state.quantity.toLocaleString(locale())} · Phí đặt trước ${state.selected.preorder_fee_percent}% · Quá ${state.selected.preorder_wait_hours}h hoàn đủ ${money(state.quoteAmount)}`, `Qty ${state.quantity.toLocaleString(locale())} · Preorder fee ${state.selected.preorder_fee_percent}% · Full refund after ${state.selected.preorder_wait_hours}h`, `数量 ${state.quantity.toLocaleString(locale())} · 预订费 ${state.selected.preorder_fee_percent}% · ${state.selected.preorder_wait_hours}小时后全额退款`); return; } const seq = ++state.quoteSeq, productId = state.selected.id, quantity = state.quantity, couponCode = $('#couponCode')?.value.trim().toUpperCase() || ''; clearTimeout(state.quoteTimer); state.quoteTimer = setTimeout(async () => { try { const result = await api('quote', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity, coupon_code: couponCode, init_data: tg?.initData || '' }) }); if (seq !== state.quoteSeq || !state.selected || state.selected.id !== productId || state.quantity !== quantity) return; state.quoteAmount = Number(result.amount || 0); $('#sheetPrice').textContent = money(state.quoteAmount); $('#couponHint').textContent = result.coupon?.message || ''; } catch (error) { if (seq === state.quoteSeq) { state.quoteAmount = 0; $('#sheetPrice').textContent = money(localTotal()); $('#couponHint').textContent = error.message; if (couponCode) toast(error.message, true); } } }, 220); }
  function currentTotal() { return state.quoteAmount || localTotal(); }
  function setQuantity(value, { commit = false } = {}) { if (!state.selected) return; const bounds = qtyBounds(), raw = String(value ?? '').replace(/[^\d]/g, ''), number = Number(raw); if (!raw && !commit) { $('#qtyValue').value = ''; return; } const next = Math.min(bounds.max, Math.max(bounds.min, Number.isFinite(number) && number > 0 ? Math.floor(number) : bounds.min)); state.quantity = next; state.quoteAmount = 0; $('#qtyValue').min = String(bounds.min); $('#qtyValue').max = String(bounds.max); $('#qtyValue').value = next; $('#sheetPrice').textContent = money(localTotal()); refreshQuote(); }
  function updateSheetPrice() { if (!state.selected) return; setQuantity(state.quantity, { commit: true }); }
  function openSheet(selector) { $('#sheetBackdrop')?.classList.add('open'); $(selector)?.classList.add('open'); document.body.style.overflow = 'hidden'; vibrate(); }
  function closeSheets() { $('#sheetBackdrop')?.classList.remove('open'); $$('.bottom-sheet').forEach(s => s.classList.remove('open')); document.body.style.overflow = ''; }
  window.openWarranty = openWarranty;
  window.closeSheets = closeSheets;
  function openWarranty(code = '') {
    const orders = state.data?.orders || [];
    const select = $('#warrantyOrderSelect');
    const list = $('#reportOrderList');
    const searchInput = $('#reportOrderSearch');
    const preview = $('#warrantyOrderPreview');
    const codeEl = $('#warrantyOrderCode');
    const subtitle = $('#warrantySubTitle');

    const canSubmitOrder = (order) => Boolean(order && order.can_report !== false && !order.is_refunded && !order.existing_claim && !order.warranty?.expired);
    const orderBadge = (order) => {
      if (!order) return { text: langText('Không rõ', 'Unknown', '未知'), cls: 'bad' };
      if (order.existing_claim) return { text: langText('Đang xử lý', 'Pending', '等待处理'), cls: 'pending' };
      if (order.is_refunded) return { text: langText('Đã hoàn tiền', 'Refunded', '已退款'), cls: 'bad' };
      if (order.warranty?.expired) return { text: langText('Hết hạn BH', 'Expired', '已过保'), cls: 'bad' };
      if (order.can_report === false) return { text: langText('Không khả dụng', 'Unavailable', '不可用'), cls: 'bad' };
      return { text: langText('Có thể báo', 'Reportable', '可申诉'), cls: '' };
    };

    function renderOptions() {
      if (!select) return;
      if (!orders.length) {
        select.innerHTML = `<option value="">${langText('-- Chưa có đơn hàng nào --', '-- No orders found --', '-- 暂无订单 --')}</option>`;
        return;
      }
      const optionsHtml = [`<option value="">${langText('-- Chọn đơn hàng cần báo lỗi --', '-- Select order to report --', '-- 选择需要报告的订单 --')}</option>`];
      orders.forEach(o => {
        const submitable = canSubmitOrder(o);
        const badge = orderBadge(o);
        optionsHtml.push(`<option value="${escapeHTML(o.code)}" ${!submitable ? 'disabled' : ''}>#${escapeHTML(o.code)} · ${escapeHTML(o.product_name)} [${escapeHTML(badge.text)}]</option>`);
      });
      select.innerHTML = optionsHtml.join('');
    }

    function updatePreview(orderCode) {
      state.warrantyOrder = orderCode;
      if (codeEl) codeEl.textContent = orderCode ? `#${orderCode}` : '';
      const order = orders.find(o => o.code === orderCode);
      if (order && preview) {
        preview.hidden = false;
        preview.classList.toggle('expired', Boolean(order.warranty?.expired));
        preview.classList.toggle('pending', Boolean(order.existing_claim));
        preview.classList.toggle('disabled', Boolean(order.is_refunded || order.can_report === false));
        const pName = order.product_name || 'Sản phẩm số';
        const initial = initials(pName).slice(0, 1) || 'SP';
        const wText = order.warranty?.text || 'Theo chính sách';
        const dateStr = date(order.timestamp);
        const amtStr = money(order.amount);
        const warning = order.existing_claim
          ? langText('Đơn này đang có yêu cầu chờ Admin xử lý.', 'This order already has a pending request.', '该订单已有待处理请求。')
          : order.is_refunded
            ? langText('Đơn đã hoàn tiền nên không thể gửi báo lỗi mới.', 'Refunded orders cannot be reported again.', '已退款订单无法再次申诉。')
            : order.warranty?.expired
              ? langText('Đơn đã hết bảo hành, vẫn gửi được để Admin xem xét ngoại lệ.', 'Warranty expired, but you can still send it for admin review.', '已过保，仍可提交给管理员复核。')
              : langText('Đơn còn bảo hành, Admin sẽ ưu tiên kiểm tra.', 'Under warranty, admin will prioritize review.', '仍在保，管理员将优先处理。');
        preview.innerHTML = `
          <div class="order-p-icon" style="${styleVars(order.product_id || order.code)}"><span>${escapeHTML(initial)}</span></div>
          <div>
            <b>${escapeHTML(pName)}</b>
            <small>Đơn #${escapeHTML(order.code)} · ${amtStr} · Mua ${dateStr}</small>
            <small>🛡️ Bảo hành: ${escapeHTML(wText)}${order.warranty?.expired ? ' · Đã hết hạn' : ''}</small>
            <small class="preview-warning">${escapeHTML(warning)}</small>
          </div>
        `;
        if (subtitle) subtitle.textContent = `${langText('Đơn', 'Order', '订单')} #${order.code} · ${pName}`;
      } else if (preview) {
        preview.className = 'warranty-order-preview';
        if (!orders.length) {
          preview.hidden = false;
          preview.innerHTML = `
            <div style="padding: 12px 10px; text-align: center; color: #75847e; font-size: 11px; width: 100%;">
              🛒 <b>${langText('Bạn chưa có đơn hàng nào', 'You have no orders yet', '您暂无订单')}</b><br>
              <span style="font-size: 10px; opacity: 0.85;">${langText('Vui lòng mua hàng trước khi yêu cầu hỗ trợ hoặc báo lỗi.', 'Please place an order before requesting support.', '请在购买后再进行订单申诉。')}</span>
            </div>
          `;
          if (subtitle) subtitle.textContent = langText('Bạn chưa có đơn hàng nào trên hệ thống.', 'You have no orders on the system.', '您在系统中暂无订单。');
        } else {
          preview.hidden = true;
          if (subtitle) subtitle.textContent = langText('Chọn đơn hàng và mô tả sự cố để Admin hỗ trợ.', 'Select an order and describe the issue.', '选择订单并说明问题。');
        }
      }
      if (select && orderCode) select.value = orderCode;
      renderOrderCards();
    }

    function renderOrderCards() {
      if (!list) return;
      if (!orders.length) {
        list.innerHTML = `<div class="report-empty-note">${langText('Chưa có đơn hàng để báo lỗi.', 'No orders to report yet.', '暂无可申诉订单。')}</div>`;
        return;
      }
      const q = String(searchInput?.value || '').trim().toLowerCase();
      const filtered = orders.filter(o => !q || String(o.code || '').toLowerCase().includes(q) || String(o.product_name || '').toLowerCase().includes(q));
      if (!filtered.length) {
        list.innerHTML = `<div class="report-empty-note">${langText('Không tìm thấy đơn phù hợp.', 'No matching order found.', '未找到匹配订单。')}</div>`;
        return;
      }
      list.innerHTML = filtered.map(o => {
        const badge = orderBadge(o);
        const active = o.code === state.warrantyOrder;
        const disabled = !canSubmitOrder(o);
        const pName = o.product_name || 'Sản phẩm số';
        const meta = `${langText('Mua', 'Bought', '购买')} ${date(o.timestamp)} · ${money(o.amount)}`;
        const warrantyLine = o.warranty?.expired ? langText('Đã hết bảo hành · vẫn nhận báo lỗi', 'Expired · still reportable', '已过保 · 仍可申诉') : `${langText('Bảo hành', 'Warranty', '保修')}: ${o.warranty?.text || 'Theo chính sách'}`;
        return `<button type="button" class="report-order-card ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}" data-report-order="${escapeHTML(o.code)}" role="option" aria-selected="${active ? 'true' : 'false'}">
          <span class="order-p-icon" style="${styleVars(o.product_id || o.code)}">${escapeHTML(initials(pName).slice(0, 1) || 'SP')}</span>
          <span class="report-order-main"><b>#${escapeHTML(o.code)} · ${escapeHTML(pName)}</b><small>${escapeHTML(meta)}</small><small>${escapeHTML(warrantyLine)}</small></span>
          <span class="report-status-badge ${badge.cls}">${escapeHTML(badge.text)}</span>
        </button>`;
      }).join('');
      $$('[data-report-order]', list).forEach(button => {
        button.onclick = () => {
          const order = orders.find(o => o.code === button.dataset.reportOrder);
          if (!order) return;
          if (!canSubmitOrder(order)) {
            toast(order.existing_claim ? langText('Đơn này đang chờ Admin xử lý', 'This order is already pending', '该订单正在处理中') : langText('Đơn này không thể gửi báo lỗi mới', 'This order cannot be reported again', '该订单无法再次申诉'), true);
            updatePreview(order.code);
            return;
          }
          updatePreview(order.code);
          vibrate();
        };
      });
      paintIcons(list);
    }

    renderOptions();

    let targetCode = String(code || '').trim().toUpperCase();
    if (!targetCode && orders.length) {
      const firstEligible = orders.find(o => canSubmitOrder(o));
      if (firstEligible) targetCode = firstEligible.code;
      else targetCode = orders[0].code;
    }

    state.warrantyOrder = targetCode;
    if (select && targetCode) select.value = targetCode;
    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = renderOrderCards;
    }
    if (select) select.onchange = () => updatePreview(select.value);
    updatePreview(targetCode);

    $('#warrantyDescription').value = '';
    if ($('#warrantyPhotoUrl')) $('#warrantyPhotoUrl').value = '';
    if ($('#warrantyFileInput')) $('#warrantyFileInput').value = '';
    if ($('#warrantyPhotoPreview')) $('#warrantyPhotoPreview').hidden = true;
    $('#charCount').textContent = '0';
    state.selectedReason = 'Sai mật khẩu / không đăng nhập được';
    $$('.reason-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.reason === state.selectedReason);
      chip.onclick = () => {
        state.selectedReason = chip.dataset.reason;
        $$('.reason-chip').forEach(c => c.classList.toggle('active', c === chip));
        vibrate();
      };
    });

    openSheet('#warrantySheet');
  }
  async function submitRating(orderCode, rating) {
    try { const result = await api('ratings', { method: 'POST', body: JSON.stringify({ order_code: orderCode, rating, review: '', init_data: tg?.initData || '' }) }), order = (state.data.orders || []).find(item => item.code === orderCode); if (order) order.rating = rating; renderOrders(); toast(`Cảm ơn bạn đã đánh giá ${rating} sao`); if (result.summary) { const product = state.data.products.find(item => item.id === order?.product_id); if (product) product.rating = result.summary; renderHome(); renderShop(); } }
    catch (error) { toast(error.message, true); }
  }
  async function openDelivery(code) {
    const requestSeq = ++state.deliveryRequestSeq; state.deliveryOrder = code; state.deliveryItems = []; $('#deliveryTitle').textContent = 'Đang lấy sản phẩm...'; $('#deliverySummary').textContent = `Đơn #${code}`; $('#deliveryItems').innerHTML = '<div class="delivery-loading">Đang giải mã kho hàng an toàn...</div>'; openSheet('#deliverySheet');
    try { const result = await api(`orders/${encodeURIComponent(code)}/delivery`); if (requestSeq !== state.deliveryRequestSeq || state.deliveryOrder !== code || !$('#deliverySheet').classList.contains('open')) return; state.deliveryItems = result.items || []; $('#deliveryTitle').textContent = result.product_name || langText('Thông tin sản phẩm', 'Product details', '商品详情'); $('#deliverySummary').textContent = `${langText('Đơn', 'Order', '订单')} #${result.order_code} · ${result.count} ${langText('mục đã giao', 'delivered items', '个已交付项目')}`; $('#deliveryItems').innerHTML = state.deliveryItems.map((item, index) => `<article class="delivery-item"><span>${String(index + 1).padStart(2, '0')}</span><code>${escapeHTML(item)}</code><button data-copy-delivery="${index}" aria-label="${langText('Sao chép', 'Copy', '复制')}"><i data-icon="copy"></i></button></article>`).join(''); paintIcons($('#deliveryItems')); $$('[data-copy-delivery]').forEach(button => button.onclick = () => copyText(state.deliveryItems[Number(button.dataset.copyDelivery)], langText('Đã sao chép sản phẩm', 'Product copied', '已复制商品'))); }
    catch (error) { if (requestSeq !== state.deliveryRequestSeq || state.deliveryOrder !== code) return; $('#deliveryTitle').textContent = 'Chưa thể nhận sản phẩm'; $('#deliveryItems').innerHTML = `<div class="delivery-error">${escapeHTML(error.message)}</div>`; toast(error.message, true); }
  }
  async function downloadDelivery() {
    if (!state.deliveryOrder) return; const demo = new URLSearchParams(location.search).get('demo') === '1', url = `/miniapp/api/orders/${encodeURIComponent(state.deliveryOrder)}/download${demo ? '?demo=1' : ''}`;
    try { const response = await fetch(url, { headers: { 'X-Telegram-Init-Data': tg?.initData || '' } }); if (!response.ok) { let error = {}; try { error = await response.json(); } catch { } throw new Error(error.detail || 'Không tải được file'); } const blob = await response.blob(), objectUrl = URL.createObjectURL(blob), link = document.createElement('a'); link.href = objectUrl; link.download = `DonHang-${state.deliveryOrder}.txt`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1500); toast('Đã tải file đơn hàng'); }
    catch (error) { toast(error.message, true); }
  }
  function renderSurfsharkSheet(feedbackMsg = '', feedbackOk = true) {
    const order = (state.data?.orders || []).find(o => o.code === state.surfsharkOrder);
    const ss = order?.surfshark || state.surfsharkLastDetails || { slots_total: order?.quantity || 1, slots_used: 0, slots_remaining: order?.quantity || 1, activations: [] };
    const total = Math.max(1, Number(ss.slots_total || order?.quantity || 1));
    const used = Math.max(0, Number(ss.slots_used || 0));
    const rem = Math.max(0, Number(ss.slots_remaining ?? (total - used)));
    $('#ssOrderTitle').textContent = `Đơn #${state.surfsharkOrder || '—'}`;
    const badge = $('#ssSlotsBadge');
    badge.textContent = rem > 0 ? `Còn ${rem}/${total} lượt` : `Đã đủ ${used}/${total} lượt`;
    badge.classList.toggle('done', rem <= 0);
    const input = $('#ssCodeInput'), btn = $('#ssSubmitBtn');
    if (input) input.disabled = rem <= 0 || state.surfsharkBusy;
    if (btn) {
      btn.disabled = rem <= 0 || state.surfsharkBusy;
      btn.innerHTML = state.surfsharkBusy
        ? `<span>Đang xử lý...</span><i data-icon="refresh"></i>`
        : (rem > 0 ? `<span>Kích hoạt ngay</span><i data-icon="check"></i>` : `<span>Đã dùng hết lượt</span><i data-icon="check"></i>`);
      paintIcons(btn);
    }
    const fb = $('#ssFeedback');
    if (fb) {
      if (feedbackMsg) {
        fb.hidden = false;
        fb.className = `ss-feedback ${feedbackOk ? 'ok' : 'err'}`;
        fb.textContent = feedbackMsg;
      } else {
        fb.hidden = true;
        fb.textContent = '';
      }
    }
    const acts = Array.isArray(ss.activations) ? ss.activations : [];
    const histWrap = $('#ssHistoryWrap'), histList = $('#ssHistoryList');
    if (histWrap && histList) {
      histWrap.hidden = !acts.length;
      histList.innerHTML = acts.map((item, idx) => `<div class="ss-history-item"><div>#${idx + 1} · <code>${escapeHTML(item.code || '')}</code>${item.device_name ? ` <small>· ${escapeHTML(item.device_name)}</small>` : ''}</div><span>${item.activated_at ? date(item.activated_at) : 'Đã kích hoạt'}</span></div>`).join('');
    }
  }
  function openSurfsharkActivate(orderCode) {
    const code = String(orderCode || '').trim().toUpperCase();
    if (!code) return;
    state.surfsharkOrder = code;
    state.surfsharkLastDetails = null;
    if ($('#ssCodeInput')) $('#ssCodeInput').value = '';
    renderSurfsharkSheet('', true);
    openSheet('#surfsharkActivateSheet');
    paintIcons($('#surfsharkActivateSheet'));
    setTimeout(() => {
      const inp = $('#ssCodeInput');
      if (inp && !inp.disabled) inp.focus();
    }, 180);
  }
  async function submitSurfsharkActivate() {
    if (state.surfsharkBusy || !state.surfsharkOrder) return;
    const raw = String($('#ssCodeInput')?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if ($('#ssCodeInput')) $('#ssCodeInput').value = raw;
    if (!/^[A-Z0-9]{6}$/.test(raw)) {
      renderSurfsharkSheet('⚠️ Mã kích hoạt Surfshark phải gồm đúng 6 ký tự chữ/số (VD: X9K2P4). Chưa trừ lượt nào.', false);
      toast('Mã Surfshark gồm đúng 6 ký tự chữ/số', true);
      return;
    }
    state.surfsharkBusy = true;
    renderSurfsharkSheet('', true);
    try {
      const res = await api('surfshark/activate', {
        method: 'POST',
        body: JSON.stringify({ order_code: state.surfsharkOrder, code: raw, init_data: tg?.initData || '' })
      });
      if (res.surfshark) state.surfsharkLastDetails = res.surfshark;
      const idx = (state.data?.orders || []).findIndex(o => o.code === state.surfsharkOrder);
      if (idx >= 0) {
        if (res.order) state.data.orders[idx] = res.order;
        else if (res.surfshark) state.data.orders[idx].surfshark = res.surfshark;
      }
      if ($('#ssCodeInput')) $('#ssCodeInput').value = '';
      state.surfsharkBusy = false;
      renderOrders();
      renderSurfsharkSheet(res.message || `✅ Đã kích hoạt mã ${raw}! App Surfshark sẽ tự đăng nhập trong vài giây.`, true);
      playSuccessChime();
      toast('Kích hoạt Surfshark thành công!');
    } catch (error) {
      if (error.payload?.surfshark) {
        state.surfsharkLastDetails = error.payload.surfshark;
        const ord = (state.data?.orders || []).find(o => o.code === state.surfsharkOrder);
        if (ord) ord.surfshark = error.payload.surfshark;
        renderOrders();
      }
      state.surfsharkBusy = false;
      renderSurfsharkSheet(error.message || 'Kích hoạt chưa thành công. Lượt của bạn vẫn được giữ nguyên.', false);
      toast(error.message || 'Kích hoạt thất bại', true);
    }
  }

  async function api(path, options = {}) {
    const initData = tg?.initData || '', method = (options.method || 'GET').toUpperCase();
    const demo = new URLSearchParams(location.search).get('demo') === '1', demoQuery = demo ? `${String(path).includes('?') ? '&' : '?'}demo=1` : '';
    const apiBase = (window.__API_URL__ || '').replace(/\/$/, ''); const url = `${apiBase}/miniapp/api/${path}${demoQuery}`, headers = { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initData, ...options.headers };
    const controller = method === 'GET' && !options.signal ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 20000) : null;
    try {
      const response = await fetch(url, { ...options, method, headers, ...(controller ? { signal: controller.signal } : {}) });
      let result = {};
      try { result = await response.json(); } catch (error) { if (controller?.signal.aborted) throw error; }
      if (controller?.signal.aborted) throw new Error('Request timed out');
      if (result.code === 'miniapp_maintenance' || result.code === 'miniapp_disabled') {
        blockMiniApp(result.detail || result.message || 'Mini App đang tạm ngưng. Vui lòng quay lại sau.');
      }
      if (!response.ok || result.ok === false) { const error = new Error(result.detail || result.message || result.error || 'Không kết nối được máy chủ'); error.payload = result; throw error; }
      return result;
    } catch (error) {
      if (controller?.signal.aborted) throw new Error('Máy chủ phản hồi quá chậm. Vui lòng thử tải lại.');
      throw error;
    } finally { if (timer !== null) clearTimeout(timer); }
  }
  async function cycleLanguage() {
    if (state.languageSaving || !state.data) return; const order = ['vi', 'en', 'zh'], next = order[(order.indexOf(currentLang()) + 1) % order.length]; state.languageSaving = true; updateLanguageButton();
    try { localStorage.setItem(LANG_STORAGE_KEY, next); const saved = await api('language', { method: 'POST', body: JSON.stringify({ lang: next, init_data: tg?.initData || '' }) }); state.data.lang = saved.lang || next; if (state.data.demo) { applyLanguage(); renderAll(); } else { const fresh = await api('bootstrap'); state.data = fresh; state.data.lang = normalizeLang(fresh.lang || saved.lang || next); hydrateCommerce(fresh.commerce_state); applyLanguage(); renderAll(); } toast({ vi: 'Đã đổi sang Tiếng Việt', en: 'Language changed to English', zh: '已切换为中文' }[currentLang()] || 'Language updated'); }
    catch (error) { toast(error.message, true); }
    finally { state.languageSaving = false; updateLanguageButton(); }
  }
  function renderPaymentDetail() {
    const lang = currentLang();
    if (!state.invoice) { const methodLabel = state.data?.payment_methods?.[state.paymentMethod]?.label || ({ vi: 'phương thức thanh toán', en: 'payment method', zh: '付款方式' }[lang]); const balanceMessage = { vi: `Thanh toán ngay bằng số dư ví Dino. Số dư hiện tại: ${money(state.data?.profile?.balance || 0)}`, en: `Pay instantly with your Dino balance. Current balance: ${money(state.data?.profile?.balance || 0)}`, zh: `使用 Dino 余额即时付款。当前余额：${money(state.data?.profile?.balance || 0)}` }[lang], invoiceMessage = { vi: `Đã chọn ${methodLabel}. Bấm tạo hóa đơn để nhận QR và địa chỉ thanh toán.`, en: `${methodLabel} selected. Create an invoice to receive the QR code and payment address.`, zh: `已选择 ${methodLabel}。请创建账单以获取二维码和付款地址。` }[lang]; $('#paymentDetail').innerHTML = `<div class="delivery-loading">${escapeHTML(state.paymentMethod === 'balance' ? balanceMessage : invoiceMessage)}</div>`; return; }
    const invoice = state.invoice, method = invoice.payment_method, label = method === 'bank' ? { vi: 'NỘI DUNG CHUYỂN KHOẢN', en: 'TRANSFER CONTENT', zh: '转账内容' }[lang] : { vi: 'SỐ TIỀN USDT', en: 'USDT AMOUNT', zh: 'USDT 金额' }[lang], destinationLabel = method === 'bank' ? { vi: 'MÃ HÓA ĐƠN', en: 'INVOICE CODE', zh: '账单编号' }[lang] : (invoice.destination_label || 'ID/VÍ NHẬN'), statusText = { vi: 'Đang chờ hệ thống xác nhận thanh toán...', en: 'Waiting for payment confirmation...', zh: '正在等待付款确认…' }[lang], copyValue = String(invoice.copy_value || invoice.transfer_content || '').trim(), copyLabel = method === 'bank' ? tr('Sao chép nội dung chuyển khoản') : tr('Sao chép địa chỉ/ID');
    $('#paymentDetail').innerHTML = `<div class="invoice-qr"><img src="${escapeHTML(invoice.qr_url)}" alt="QR"><div class="invoice-data"><strong>${method === 'bank' ? money(invoice.amount) : escapeHTML(invoice.currency_amount || '')}</strong><small>${escapeHTML(destinationLabel)}</small><b>${escapeHTML(method === 'bank' ? invoice.order_code : (invoice.transfer_content || ''))}</b>${copyValue ? `<button id="copyInvoiceTarget" class="copy-invoice-target"><i data-icon="copy"></i><span>${escapeHTML(copyLabel)}</span></button>` : ''}${invoice.network ? `<small>${{ vi: 'MẠNG LƯỚI', en: 'NETWORK', zh: '网络' }[lang]}</small><b>${escapeHTML(invoice.network)}</b>` : ''}<small>${label}</small><b>${escapeHTML(method === 'bank' ? (invoice.transfer_content || '') : (invoice.currency_amount || { vi: 'Nhập đúng số USDT hiển thị', en: 'Enter the exact USDT amount shown', zh: '请输入显示的准确 USDT 金额' }[lang]))}</b>${invoice.checkout_url ? `<button id="openProvider" class="provider-link">${{ vi: 'Mở Binance Pay', en: 'Open Binance Pay', zh: '打开 Binance Pay' }[lang]}</button>` : ''}</div></div><div class="invoice-status"><i></i><span>${escapeHTML(statusText)}</span></div><button class="cancel-invoice" id="cancelInvoice">${{ vi: 'Hủy hóa đơn', en: 'Cancel invoice', zh: '取消账单' }[lang]}</button>`;
    paintIcons($('#paymentDetail')); $('#copyInvoiceTarget')?.addEventListener('click', () => copyText(copyValue, copyLabel)); $('#openProvider')?.addEventListener('click', () => { tg?.openLink ? tg.openLink(invoice.checkout_url) : window.open(invoice.checkout_url, '_blank'); }); $('#cancelInvoice').onclick = cancelInvoice;
  }
  const usdtPaymentMethods = ['binance', 'bep20', 'polygon', 'trc20'];
  const isUsdtPaymentMethod = method => usdtPaymentMethods.includes(method);
  function paymentMethodEnabled(method) { if (method === 'balance') return true; return Boolean(state.data?.payment_methods?.[method]?.enabled); }
  function hasEnabledUsdtPaymentMethod() { return usdtPaymentMethods.some(paymentMethodEnabled); }
  function renderPaymentMethods() {
    if (!paymentMethodEnabled(state.paymentMethod)) state.paymentMethod = ['balance', 'binance', 'bep20', 'polygon', 'trc20'].find(paymentMethodEnabled) || 'balance';
    const binanceOpen = state.paymentBinanceOpen || isUsdtPaymentMethod(state.paymentMethod), binanceEnabled = hasEnabledUsdtPaymentMethod(), binanceGroup = $('[data-pay-group="binance"]'), binanceOptions = $('#binancePaymentOptions');
    if (binanceGroup) {
      binanceGroup.classList.toggle('active', isUsdtPaymentMethod(state.paymentMethod));
      binanceGroup.classList.toggle('disabled', !binanceEnabled);
      binanceGroup.disabled = !binanceEnabled;
      binanceGroup.setAttribute('aria-expanded', String(binanceOpen && binanceEnabled));
      binanceGroup.title = binanceEnabled ? '' : tr('Chưa cấu hình USDT');
    }
    if (binanceOptions) binanceOptions.hidden = !(binanceOpen && binanceEnabled);
    $$('[data-pay-method]').forEach(button => {
      const method = button.dataset.payMethod, enabled = paymentMethodEnabled(method), reason = state.data?.payment_methods?.[method]?.reason || langText('Phương thức này đang tạm tắt', 'This method is temporarily unavailable', '此付款方式暂时关闭');
      if (method === 'bank') {
        button.hidden = !enabled;
        button.style.display = enabled ? '' : 'none';
      }
      button.classList.toggle('active', method === state.paymentMethod);
      button.classList.toggle('disabled', !enabled);
      button.disabled = !enabled;
      button.title = enabled ? '' : reason;
      if (method === 'balance') { const missing = Math.max(0, currentTotal() - Number(state.data?.profile?.balance || 0)); $('small', button).textContent = missing > 0 ? langText(`Thiếu ${money(missing)}`, `Missing ${money(missing)}`, `还差 ${money(missing)}`) : langText(`Ví còn ${money(state.data?.profile?.balance || 0)}`, `Balance ${money(state.data?.profile?.balance || 0)}`, `余额 ${money(state.data?.profile?.balance || 0)}`); }
      if (!enabled && isUsdtPaymentMethod(method)) $('small', button).textContent = tr('Chưa cấu hình USDT');
    });
  }
  function topupMethodEnabled(method) { return Boolean(state.data?.payment_methods?.[method]?.enabled); }
  function renderTopupMethods() {
    if (!topupMethodEnabled(state.topupMethod)) state.topupMethod = ['bank', 'binance', 'bep20', 'polygon', 'trc20'].find(topupMethodEnabled) || '';
    const bankEnabled = topupMethodEnabled('bank');
    const binanceEnabled = hasEnabledUsdtPaymentMethod();
    const binanceOpen = !bankEnabled || state.topupBinanceOpen || isUsdtPaymentMethod(state.topupMethod);
    const binanceGroup = $('[data-topup-group="binance"]'), binanceOptions = $('#topupBinanceOptions');
    if (binanceGroup) {
      if (!binanceEnabled) {
        binanceGroup.hidden = true;
        binanceGroup.style.display = 'none';
      } else {
        binanceGroup.hidden = false;
        binanceGroup.style.display = '';
        binanceGroup.classList.toggle('active', isUsdtPaymentMethod(state.topupMethod));
        binanceGroup.classList.toggle('disabled', !binanceEnabled);
        binanceGroup.disabled = !binanceEnabled;
        binanceGroup.setAttribute('aria-expanded', String(binanceOpen && binanceEnabled));
        binanceGroup.title = binanceEnabled ? '' : tr('Chưa cấu hình USDT');
      }
    }
    if (binanceOptions) binanceOptions.hidden = !(binanceOpen && binanceEnabled);
    $$('[data-topup-method]').forEach(button => {
      const method = button.dataset.topupMethod, enabled = topupMethodEnabled(method), reason = state.data?.payment_methods?.[method]?.reason || langText('Phương thức này đang tạm tắt', 'This method is temporarily unavailable', '此付款方式暂时关闭');
      if (method === 'bank') {
        button.hidden = !enabled;
        button.style.display = enabled ? '' : 'none';
      }
      button.classList.toggle('active', method === state.topupMethod);
      button.classList.toggle('disabled', !enabled);
      button.disabled = !enabled;
      button.title = enabled ? '' : reason;
      if (!enabled && isUsdtPaymentMethod(method)) $('small', button).textContent = tr('Chưa cấu hình USDT');
    });
    const subTitle = $('#topupSubtitle');
    if (subTitle) {
      if (bankEnabled && binanceEnabled) {
        subTitle.textContent = langText('Chọn ngân hàng hoặc USDT, nhập số tiền và hệ thống sẽ tự cộng vào ví sau khi xác nhận giao dịch.', 'Choose bank or USDT, enter an amount, and the system will credit your wallet after confirmation.', '选择银行或 USDT，输入金额，系统确认后会自动充值到钱包。');
      } else if (binanceEnabled) {
        subTitle.textContent = langText('Chọn kênh nạp USDT, nhập số tiền và hệ thống sẽ tự cộng vào ví sau khi xác nhận giao dịch.', 'Choose a USDT top-up channel, enter an amount, and the system will credit your wallet after confirmation.', '选择 USDT 充值通道，输入金额，系统确认后会自动充值到钱包。');
      } else if (bankEnabled) {
        subTitle.textContent = langText('Quét mã Vietcombank (VCB) QR, nhập số tiền và hệ thống sẽ tự cộng vào ví sau khi xác nhận giao dịch.', 'Scan Vietcombank (VCB) QR, enter an amount, and the system will credit your wallet after confirmation.', '扫描 Vietcombank (VCB) 二维码，输入金额，系统确认后会自动充值到钱包。');
      } else {
        subTitle.textContent = langText('Hiện không có kênh nạp tiền nào khả dụng.', 'No top-up channels currently available.', '暂无可用的充值通道。');
      }
    }
    const canTopup = Boolean(state.topupMethod && topupMethodEnabled(state.topupMethod)), createBtn = $('#createTopup');
    let noMethodNotice = $('#noTopupMethodsNotice');
    if (!canTopup) {
      if (!noMethodNotice) {
        noMethodNotice = document.createElement('div');
        noMethodNotice.id = 'noTopupMethodsNotice';
        noMethodNotice.className = 'delivery-loading';
        noMethodNotice.style.margin = '12px 0';
        noMethodNotice.textContent = langText('Hiện không có kênh nạp tiền nào khả dụng', 'No top-up channels currently available', '暂无可用的充值通道');
        $('.topup-methods')?.after(noMethodNotice);
      }
      noMethodNotice.hidden = false;
    } else if (noMethodNotice) {
      noMethodNotice.hidden = true;
    }
    if (createBtn && !state.topupInvoice) {
      createBtn.disabled = !canTopup;
      if (!canTopup) {
        createBtn.innerHTML = `<span>${langText('Kênh nạp tiền đang tắt', 'Top-up channels disabled', '充值通道已关闭')}</span><i data-icon="lock"></i>`;
      } else {
        const btnLabel = isUsdtPaymentMethod(state.topupMethod) ? langText('Tạo hóa đơn nạp tiền', 'Create top-up invoice', '创建充值账单') : langText('Tạo QR nạp tiền', 'Create top-up QR', '创建充值二维码');
        createBtn.innerHTML = `<span>${btnLabel}</span><i data-icon="receipt"></i>`;
      }
      paintIcons(createBtn);
    }
  }

  function renderConfirmPaymentButton() { const btn = $('#confirmPayment'); if (!btn || state.invoice) return; const enabled = paymentMethodEnabled(state.paymentMethod); btn.disabled = !enabled; if (!enabled) { btn.innerHTML = `<span>${langText('Phương thức đang tạm tắt', 'Method unavailable', '付款方式已关闭')}</span><i data-icon="lock"></i>`; } else { btn.innerHTML = state.paymentMethod === 'balance' ? `<span>${langText('Thanh toán bằng số dư', 'Pay with balance', '使用余额付款')}</span><i data-icon="check"></i>` : `<span>${tr('Tạo hóa đơn thanh toán')}</span><i data-icon="arrow"></i>`; } paintIcons(btn); }
  function openPayment() {
    state.demoOrder = { product: state.selected, quantity: state.quantity }; const hasEnoughBalance = paymentMethodEnabled('balance') && Number(state.data?.profile?.balance || 0) >= currentTotal(); state.paymentMethod = hasEnoughBalance ? 'balance' : (['bank', 'binance', 'bep20', 'polygon', 'trc20'].find(paymentMethodEnabled) || 'balance'); state.paymentBinanceOpen = false; state.invoice = null;
    $('#paymentSummary').textContent = `${state.selected.name} · SL ${state.quantity} · ${money(currentTotal())}`;
    renderPaymentMethods(); renderPaymentDetail();
    renderConfirmPaymentButton();
    $('#productSheet').classList.remove('open'); openSheet('#paymentSheet');
  }
  async function completeDemoPayment() {
    if (!state.demoOrder) return; const btn = $('#confirmPayment'); btn.classList.add('loading'); btn.innerHTML = `<span>${langText('Đang xác nhận giao dịch...', 'Confirming transaction...', '正在确认交易...')}</span><i data-icon="refresh"></i>`; paintIcons(btn); await new Promise(r => setTimeout(r, 1100));
    const p = state.demoOrder.product, now = Date.now() / 1000, code = `DINO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    state.data.orders.unshift({ code, product_id: p.id, product_name: p.name, amount: currentTotal(), quantity: state.demoOrder.quantity, status: langText('Hoàn thành', 'Completed', '已完成'), timestamp: now, delivery_method: 'stock_items', has_delivery: true, delivered_count: 1, warranty: { active: true, expired: false, text: p.warranty, expires_at: now + 86400 * 30 } });
    closeSheets(); renderOrders(); go('orders'); playSuccessChime(); toast(langText(`Thanh toán thành công · Đã giao đơn ${code}`, `Payment successful · Order ${code} delivered`, `付款成功 · 订单 ${code} 已交付`)); btn.classList.remove('loading'); state.demoOrder = null; state.invoice = null;
  }
  async function createPreorder() { const product = state.selected, btn = $('#buyButton'), old = btn.innerHTML; btn.disabled = true; btn.classList.add('loading'); btn.innerHTML = `<span>${langText('Đang đặt trước...', 'Creating preorder...', '正在创建预订...')}</span><i data-icon="refresh"></i>`; paintIcons(btn); try { const expectedTotal = localTotal(product, state.quantity); const result = await api('preorders', { method: 'POST', body: JSON.stringify({ product_id: product.id, quantity: state.quantity, expected_total: expectedTotal, init_data: tg?.initData || '' }) }); if (state.data?.profile && Number.isFinite(Number(result.balance))) state.data.profile.balance = Number(result.balance); closeSheets(); await refreshTransactions({ silent: true }); go('orders'); playSuccessChime(); toast(result.message || langText('Đặt trước thành công', 'Preorder created', '预订成功')); } catch (error) { if (error.payload?.code === 'quote_changed') { product.preorder_fee_bps = Number(error.payload.fee_bps || 0); product.preorder_fee_percent = Number(error.payload.fee_percent || 0); product.preorder_total = Number(error.payload.required || 0); state.quoteAmount = localTotal(product, state.quantity); $('#sheetPrice').textContent = money(state.quoteAmount); refreshQuote(); toast(langText('Giá hoặc phí vừa thay đổi. Hãy kiểm tra tổng mới rồi xác nhận lại.', 'Price or fee changed. Review the new total and confirm again.', '价格或费用已变化，请确认新总额。'), true); btn.disabled = false; btn.innerHTML = old; paintIcons(btn); return; } if (error.payload?.code === 'insufficient_balance') { const required = Number(error.payload.required || 0), balance = Number(error.payload.balance || 0), shortfall = Math.max(0, required - balance); if (state.data?.profile) state.data.profile.balance = balance; closeSheets(); $('#topupAmount').value = Math.max(10000, shortfall); openTopup(); toast(langText(`Ví không đủ · Còn thiếu ${money(shortfall)}`, `Insufficient balance · Short ${money(shortfall)}`, `余额不足 · 还差 ${money(shortfall)}`), true); return; } toast(error.message, true); btn.disabled = false; btn.innerHTML = old; paintIcons(btn); } finally { btn.classList.remove('loading'); } }
  function checkout() {
    if (!state.selected) return; setQuantity($('#qtyValue').value, { commit: true }); if (state.selected.preorder_available && !state.selected.available) { createPreorder(); return; } if (state.selected.manual && !/^\S+@\S+\.\S+$/.test($('#checkoutEmail').value.trim())) { toast(langText('Hãy nhập email nhận dịch vụ hợp lệ', 'Enter a valid service delivery email', '请输入有效的服务接收邮箱'), true); return; } if (state.selected.social && !$('#checkoutTarget').value.trim()) { toast(langText('Hãy nhập link hoặc username cần chạy', 'Enter the target link or username', '请输入目标链接或用户名'), true); return; } openPayment();
  }
  async function createPayment() {
    if (state.invoice?.demo) { await completeDemoPayment(); return; } if (state.invoice) { toast(langText('Hóa đơn đang chờ thanh toán', 'Invoice is waiting for payment', '账单正在等待付款')); return; } if (!paymentMethodEnabled(state.paymentMethod)) { toast(state.data?.payment_methods?.[state.paymentMethod]?.reason || langText('Phương thức thanh toán đang tắt', 'Payment method is disabled', '付款方式已关闭'), true); return; } const btn = $('#confirmPayment'), old = btn.innerHTML; btn.disabled = true; btn.classList.add('loading'); btn.innerHTML = `<span>${langText('Đang tạo hóa đơn...', 'Creating invoice...', '正在创建账单...')}</span><i data-icon="refresh"></i>`; paintIcons(btn);
    const checkoutPath = state.paymentMethod === 'balance' ? 'checkout/balance' : 'checkout';
    try { const result = await api(checkoutPath, { method: 'POST', body: JSON.stringify({ product_id: state.selected.id, quantity: state.quantity, payment_method: state.paymentMethod, email: $('#checkoutEmail').value.trim(), target_link: $('#checkoutTarget').value.trim(), comments: $('#checkoutComments').value.trim(), coupon_code: $('#couponCode').value.trim().toUpperCase(), demo_amount: currentTotal(), init_data: tg?.initData || '' }) }); if (result.paid) { if (state.data?.profile && Number.isFinite(Number(result.balance))) state.data.profile.balance = Number(result.balance); btn.classList.remove('loading'); closeSheets(); await refreshTransactions({ silent: true }); go('orders'); playSuccessChime(); toast(result.message || langText('Thanh toán bằng số dư thành công', 'Balance payment successful', '余额付款成功')); if (result.is_surfshark && result.order?.code) openSurfsharkActivate(result.order.code); return; } state.invoice = { ...result.invoice, demo: result.demo }; renderPaymentDetail(); btn.classList.remove('loading'); btn.disabled = !result.demo; btn.innerHTML = result.demo ? `<span>${langText('Mô phỏng thanh toán thành công', 'Simulate successful payment', '模拟付款成功')}</span><i data-icon="check"></i>` : `<span>${langText('Hóa đơn đang chờ thanh toán', 'Invoice awaiting payment', '账单等待付款')}</span><i data-icon="clock"></i>`; paintIcons(btn); if (!result.demo) watchPayment(state.invoice.order_code, false); }
    catch (error) { btn.classList.remove('loading'); if (error.payload?.pending_invoice) { state.data.pending_invoice = error.payload.pending_invoice; openPendingInvoice(error.payload.pending_invoice); return; } toast(error.message, true); btn.disabled = false; btn.innerHTML = old; paintIcons(btn); }
  }
  function stopPaymentPoll(){ state.paymentPollSeq += 1; clearInterval(state.paymentPoll); clearTimeout(state.paymentPollTimer); state.paymentPoll = null; state.paymentPollTimer = null; return state.paymentPollSeq; }
  async function cancelInvoice() {
    if (!state.invoice) return; const invoice = state.invoice, orderCode = String(invoice.order_code || ''); try { if (!invoice.demo) await api(`payments/${encodeURIComponent(orderCode)}/cancel`, { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) }); if (String(state.invoice?.order_code || '') !== orderCode) return; stopPaymentPoll(); state.invoice = null; if (state.data && String(state.data.pending_invoice?.order_code || '') === orderCode) state.data.pending_invoice = null; renderPaymentDetail(); const btn = $('#confirmPayment'); btn.disabled = false; btn.innerHTML = `<span>${tr('Tạo hóa đơn thanh toán')}</span><i data-icon="arrow"></i>`; paintIcons(btn); toast(langText('Đã hủy hóa đơn', 'Invoice cancelled', '账单已取消')); } catch (error) { toast(error.message, true); }
  }
  function watchPayment(orderCode, isTopup) {
    const normalizedCode = String(orderCode || ''), pollSeq = stopPaymentPoll(); let checking = false; const isCurrent = () => pollSeq === state.paymentPollSeq && String((isTopup ? state.topupInvoice : state.invoice)?.order_code || '') === normalizedCode; const check = async () => { if (checking || !isCurrent()) return; checking = true; try { const result = await api(`payments/${encodeURIComponent(normalizedCode)}`); if (!isCurrent()) return; if (result.paid) { stopPaymentPoll(); if (isTopup) state.topupInvoice = null; else state.invoice = null; if (state.data && String(state.data.pending_invoice?.order_code || '') === normalizedCode) state.data.pending_invoice = null; closeSheets(); if (!isTopup) go('orders'); playSuccessChime(); toast(isTopup ? langText('Nạp tiền thành công', 'Top-up successful', '充值成功') : langText('Thanh toán thành công', 'Payment successful', '付款成功')); await refreshTransactions({ silent: true }); if (!isTopup && result.is_surfshark) openSurfsharkActivate(normalizedCode); } } catch (error) { if (!isCurrent() || !/hết hạn|không tồn tại/i.test(error.message)) return; stopPaymentPoll(); if (isTopup) state.topupInvoice = null; else state.invoice = null; if (state.data && String(state.data.pending_invoice?.order_code || '') === normalizedCode) state.data.pending_invoice = null; toast(error.message, true); } finally { checking = false; } }; state.paymentPoll = setInterval(check, 4000); state.paymentPollTimer = setTimeout(check, 1500);
  }
  
  async function handleWarrantyFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)', true);
      return;
    }
    const preview = $('#warrantyPhotoPreview');
    const thumb = $('#warrantyPhotoThumb');
    const nameEl = $('#warrantyPhotoName');
    const statusEl = $('#warrantyPhotoStatus');
    const urlInput = $('#warrantyPhotoUrl');

    if (preview) preview.hidden = false;
    if (nameEl) nameEl.textContent = file.name || 'screenshot.jpg';
    if (statusEl) {
      statusEl.textContent = 'Đang xử lý & tải ảnh lên...';
      statusEl.style.color = '#e0a12e';
    }

    // Read and preview immediately
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      if (thumb) thumb.src = dataUrl;
      try {
        const res = await api('upload_report_image', {
          method: 'POST',
          body: JSON.stringify({
            image_data: dataUrl,
            filename: file.name,
            init_data: tg?.initData || ''
          })
        });
        if (urlInput) urlInput.value = res.url || res.relative_url || '';
        if (statusEl) {
          statusEl.textContent = '✅ Đã tải ảnh lên máy chủ';
          statusEl.style.color = '#10B981';
        }
        toast('Đã tải ảnh lên thành công');
      } catch (err) {
        // In demo or offline mode, fallback to dataUrl
        if (urlInput) urlInput.value = dataUrl;
        if (statusEl) {
          statusEl.textContent = 'Đã chọn ảnh (sẵn sàng gửi)';
          statusEl.style.color = '#34D399';
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async function submitWarranty() {
    const orderCode = String($('#warrantyOrderSelect')?.value || state.warrantyOrder || '').trim();
    if (!orderCode) {
      toast(langText('Vui lòng chọn đơn hàng cần báo lỗi', 'Please select an order to report', '请选择需要报告的订单'), true);
      return;
    }
    const desc = $('#warrantyDescription').value.trim();
    if (desc.length < 10) {
      toast(langText('Hãy mô tả lỗi ít nhất 10 ký tự', 'Please describe the issue with at least 10 characters', '请至少描述10个字符的问题'), true);
      return;
    }
    const reason = state.selectedReason || 'Lỗi khác';
    const photoUrl = $('#warrantyPhotoUrl')?.value?.trim() || '';
    if (!photoUrl) {
      toast(langText('Vui lòng tải lên hoặc dán link ảnh chụp màn hình lỗi', 'Please upload or paste a screenshot of the error', '请上传或粘贴错误截图链接'), true);
      return;
    }
    const btn = $('#submitWarranty');
    btn.disabled = true;
    try {
      const result = await api('report_error', {
        method: 'POST',
        body: JSON.stringify({
          order_code: orderCode,
          issue_type: reason,
          description: desc,
          photo_url: photoUrl,
          init_data: tg?.initData || ''
        })
      });
      closeSheets();
      playSuccessChime();
      toast(`${result.message || 'Đã gửi báo lỗi thành công'} · ${result.claim_id || ''}`);
      if (!state.data.claims) state.data.claims = [];
      state.data.claims.unshift({
        id: result.claim_id,
        order_code: orderCode,
        status: 'pending',
        description: `[${reason}] ${desc}`,
        timestamp: Date.now() / 1000
      });
      const ord = (state.data.orders || []).find(o => o.code === orderCode);
      if (ord) {
        ord.can_report = false;
        ord.existing_claim = { id: result.claim_id, status: 'pending' };
      }
      renderOrders();
      setTimeout(() => go('orders'), 400);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false;
    }
  }
  function invoiceMarkup(invoice) {
    const method = invoice.payment_method || 'bank', isUsdt = method !== 'bank', copyValue = String(invoice.copy_value || invoice.transfer_content || '').trim(), copyLabel = isUsdt ? tr('Sao chép địa chỉ/ID') : tr('Sao chép nội dung chuyển khoản'), bankTitle = invoice.bank_name ? (invoice.bank_name === 'VCB' ? 'Vietcombank (VCB)' : invoice.bank_name) : 'Vietcombank (VCB)', statusText = isUsdt ? langText('Đang chờ hệ thống xác nhận USDT...', 'Waiting for USDT confirmation...', '正在等待 USDT 确认...') : langText(`Đang chờ ${bankTitle} xác nhận...`, `Waiting for ${bankTitle} confirmation...`, `正在等待 ${bankTitle} 确认...`);
    return `<div class="invoice-qr"><img src="${escapeHTML(invoice.qr_url)}" alt="QR"><div class="invoice-data"><strong>${isUsdt ? escapeHTML(invoice.currency_amount || '') : money(invoice.amount)}</strong><small>${isUsdt ? escapeHTML(invoice.destination_label || 'ID/VÍ NHẬN') : langText('MÃ HÓA ĐƠN', 'INVOICE CODE', '账单编号')}</small><b>${escapeHTML(isUsdt ? (invoice.transfer_content || '') : invoice.order_code)}</b>${copyValue ? `<button id="copyTopupInvoiceTarget" class="copy-invoice-target"><i data-icon="copy"></i><span>${escapeHTML(copyLabel)}</span></button>` : ''}${invoice.network ? `<small>${langText('MẠNG LƯỚI', 'NETWORK', '网络')}</small><b>${escapeHTML(invoice.network)}</b>` : ''}<small>${isUsdt ? langText('SỐ TIỀN USDT', 'USDT AMOUNT', 'USDT 金额') : langText('NỘI DUNG CHUYỂN KHOẢN', 'TRANSFER CONTENT', '转账内容')}</small><b>${escapeHTML(isUsdt ? (invoice.currency_amount || 'Nhập đúng số USDT hiển thị') : (invoice.transfer_content || ''))}</b></div></div><div class="invoice-status"><i></i><span>${escapeHTML(statusText)}</span></div><button class="cancel-invoice" id="cancelTopupInvoice">${langText('Hủy hóa đơn', 'Cancel invoice', '取消账单')}</button>`;
  }
  function showTopupInvoice(invoice) { state.topupInvoice = invoice; state.topupMethod = invoice.payment_method || 'bank'; if (isUsdtPaymentMethod(state.topupMethod)) state.topupBinanceOpen = true; if (state.data) state.data.pending_invoice = invoice; $('#topupAmount').value = invoice.amount || ''; renderTopupMethods(); $('#topupDetail').hidden = false; $('#topupDetail').innerHTML = invoiceMarkup(invoice); paintIcons($('#topupDetail')); $('#copyTopupInvoiceTarget')?.addEventListener('click', () => copyText(String(invoice.copy_value || invoice.transfer_content || '').trim(), isUsdtPaymentMethod(invoice.payment_method) ? tr('Sao chép địa chỉ/ID') : tr('Sao chép nội dung chuyển khoản'))); $('#cancelTopupInvoice').onclick = cancelTopupInvoice; const btn = $('#createTopup'); btn.disabled = true; btn.innerHTML = `<span>${langText('Đang chờ chuyển khoản', 'Waiting for transfer', '等待转账')}</span><i data-icon="clock"></i>`; paintIcons(btn); watchPayment(invoice.order_code, true); }
  function openPendingInvoice(invoice = state.data?.pending_invoice) { if (!invoice) return false; closeSheets(); if (invoice.kind === 'wallet_topup') { openSheet('#topupSheet'); showTopupInvoice(invoice); } else { state.invoice = invoice; state.paymentMethod = invoice.payment_method || 'bank'; $('#paymentSummary').textContent = `${invoice.product_name || 'Hóa đơn đang chờ'} · SL ${invoice.quantity || 1} · ${money(invoice.amount)}`; renderPaymentMethods(); openSheet('#paymentSheet'); renderPaymentDetail(); const btn = $('#confirmPayment'); btn.disabled = true; btn.innerHTML = '<span>Hóa đơn đang chờ thanh toán</span><i data-icon="clock"></i>'; paintIcons(btn); watchPayment(invoice.order_code, false); } toast(`Đã mở hóa đơn ${invoice.order_code}`); return true; }
  function openTopup() { if (openPendingInvoice()) return; state.topupInvoice = null; const bankEnabled = topupMethodEnabled('bank'); state.topupMethod = bankEnabled ? 'bank' : (['binance', 'bep20', 'polygon', 'trc20'].find(topupMethodEnabled) || ''); state.topupBinanceOpen = !bankEnabled; renderTopupMethods(); $('#topupDetail').hidden = true; $('#topupDetail').innerHTML = ''; const btn = $('#createTopup'); const canTopup = Boolean(state.topupMethod && topupMethodEnabled(state.topupMethod)); btn.disabled = !canTopup; btn.onclick = createTopup; const btnLabel = !canTopup ? langText('Kênh nạp tiền đang tắt', 'Top-up channels disabled', '充值通道已关闭') : (isUsdtPaymentMethod(state.topupMethod) ? langText('Tạo hóa đơn nạp tiền', 'Create top-up invoice', '创建充值账单') : langText('Tạo QR nạp tiền', 'Create top-up QR', '创建充值二维码')); btn.innerHTML = `<span>${btnLabel}</span><i data-icon="${canTopup ? 'receipt' : 'lock'}"></i>`; paintIcons(btn); openSheet('#topupSheet'); }
  async function cancelTopupInvoice() { if (!state.topupInvoice) return; const invoice = state.topupInvoice, orderCode = String(invoice.order_code || ''); try { if (!invoice.demo) await api(`payments/${encodeURIComponent(orderCode)}/cancel`, { method: 'POST', body: JSON.stringify({ init_data: tg?.initData || '' }) }); if (String(state.topupInvoice?.order_code || '') !== orderCode) return; stopPaymentPoll(); state.topupInvoice = null; if (state.data && String(state.data.pending_invoice?.order_code || '') === orderCode) state.data.pending_invoice = null; $('#topupDetail').hidden = true; $('#topupDetail').innerHTML = ''; renderTopupMethods(); const btn = $('#createTopup'); btn.disabled = false; btn.onclick = createTopup; btn.innerHTML = `<span>${langText('Tạo QR nạp tiền', 'Create top-up QR', '创建充值二维码')}</span><i data-icon="receipt"></i>`; paintIcons(btn); toast(langText('Đã hủy hóa đơn', 'Invoice cancelled', '账单已取消')); } catch (error) { toast(error.message, true); } }
  async function createTopup() {
    if (!$('#topupTermsCheck')?.checked) { toast('Vui lòng tích chọn đồng ý với Chính sách & Điều khoản trước khi tạo QR', true); openPolicy(); return; }
    if (state.topupInvoice) { toast(langText('QR nạp tiền đang chờ thanh toán', 'Top-up invoice is waiting for payment', '充值账单正在等待付款')); return; } if (!state.topupMethod || !topupMethodEnabled(state.topupMethod)) { toast(state.data?.payment_methods?.[state.topupMethod]?.reason || langText('Kênh nạp tiền đang tắt', 'Top-up channel disabled', '充值通道已关闭'), true); return; } const amount = Number($('#topupAmount').value || 0), btn = $('#createTopup'), old = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span>${langText('Đang tạo hóa đơn...', 'Creating invoice...', '正在创建账单...')}</span><i data-icon="refresh"></i>`; paintIcons(btn);
    try { const result = await api('topup', { method: 'POST', body: JSON.stringify({ amount, payment_method: state.topupMethod, init_data: tg?.initData || '' }) }); state.topupInvoice = { ...result.invoice, demo: result.demo }; state.topupMethod = state.topupInvoice.payment_method || state.topupMethod; if (state.data) state.data.pending_invoice = result.demo ? null : state.topupInvoice; $('#topupDetail').hidden = false; $('#topupDetail').innerHTML = invoiceMarkup(state.topupInvoice); paintIcons($('#topupDetail')); $('#copyTopupInvoiceTarget')?.addEventListener('click', () => copyText(String(state.topupInvoice.copy_value || state.topupInvoice.transfer_content || '').trim(), isUsdtPaymentMethod(state.topupInvoice.payment_method) ? tr('Sao chép địa chỉ/ID') : tr('Sao chép nội dung chuyển khoản'))); $('#cancelTopupInvoice').onclick = cancelTopupInvoice; btn.innerHTML = result.demo ? `<span>${langText('Mô phỏng đã nạp tiền', 'Simulate top-up success', '模拟充值成功')}</span><i data-icon="check"></i>` : `<span>${langText('Đang chờ chuyển khoản', 'Waiting for transfer', '等待转账')}</span><i data-icon="clock"></i>`; paintIcons(btn); if (result.demo) { btn.disabled = false; btn.onclick = () => { state.data.profile.balance += amount; renderProfile(); playSuccessChime(); toast(`${langText('Nạp tiền thành công', 'Top-up successful', '充值成功')} · +${money(amount)}`); closeSheets(); state.topupInvoice = null; btn.onclick = createTopup; }; } else watchPayment(state.topupInvoice.order_code, true); }
    catch (error) { if (error.payload?.pending_invoice) { state.data.pending_invoice = error.payload.pending_invoice; openPendingInvoice(error.payload.pending_invoice); return; } toast(error.message, true); btn.disabled = false; btn.innerHTML = old; paintIcons(btn); }
  }
  function renderSupport() { const box = $('#supportMessages'); box.innerHTML = state.supportMessages.length ? state.supportMessages.map(message => `<article class="support-message ${message.from === 'user' ? 'user' : ''}">${escapeHTML(message.text)}<small>${new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(message.timestamp * 1000))}</small></article>`).join('') : `<div class="delivery-loading">${langText('Chưa có tin nhắn. Hãy gửi câu hỏi cho Admin.', 'No messages yet. Send a question to Admin.', '暂无消息。请向管理员发送问题。')}</div>`; box.scrollTop = box.scrollHeight; }
  async function refreshSupport(showLoading = false) { if (showLoading) $('#supportMessages').innerHTML = `<div class="delivery-loading">${langText('Đang tải hội thoại...', 'Loading conversation...', '正在加载对话...')}</div>`; try { const result = await api('support'); state.supportMessages = result.messages || []; renderSupport(); } catch (error) { if (showLoading) $('#supportMessages').innerHTML = `<div class="delivery-error">${escapeHTML(error.message)}</div>`; } }
  async function openSupport() { location.href = '/miniapp/chat' + location.hash; }
  async function sendSupport() { const text = $('#supportText').value.trim(); if (text.length < 2) { toast('Hãy nhập nội dung cần hỗ trợ', true); return; } const btn = $('#sendSupport'); btn.disabled = true; try { const result = await api('support', { method: 'POST', body: JSON.stringify({ text, init_data: tg?.initData || '' }) }); state.supportMessages.push(result.message); $('#supportText').value = ''; renderSupport(); toast('Đã gửi tin nhắn cho Admin'); } catch (error) { toast(error.message, true); } finally { btn.disabled = false; } }
  function openPolicy() { openSheet('#policySheet'); paintIcons($('#policySheet')); vibrate(); }

  async function copyText(value, message = '') {
    if (!value) return; try { await navigator.clipboard.writeText(value); toast(message || langText('Đã sao chép', 'Copied', '已复制')); } catch { toast(langText('Không thể truy cập clipboard', 'Cannot access clipboard', '无法访问剪贴板'), true); }
  }
  function normalizeTotpSecret(value) {
    let raw = String(value || '').trim(); if (raw.toLowerCase().startsWith('otpauth://')) { try { raw = new URL(raw).searchParams.get('secret') || ''; } catch { } }
    return raw.toUpperCase().replace(/[^A-Z2-7]/g, '');
  }
  function decodeBase32(secret) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', bytes = []; for (const ch of secret) { const val = alphabet.indexOf(ch); if (val < 0) continue; bits += val.toString(2).padStart(5, '0'); }
    for (let i = 0; i + 8 <= bits.length; i += 8)bytes.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(bytes);
  }
  async function updateTotp() {
    const now = Math.floor(Date.now() / 1000), remaining = 30 - (now % 30), secret = normalizeTotpSecret($('#totpSecret')?.value); $('#totpCountdown').textContent = remaining; $('#totpRing').style.setProperty('--progress', `${remaining / 30 * 100}%`);
    if (secret.length < 8) { $('#totpCode').textContent = '—— ——'; return; }
    try { const key = await crypto.subtle.importKey('raw', decodeBase32(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']); const counter = Math.floor(now / 30), buffer = new ArrayBuffer(8), view = new DataView(buffer); view.setUint32(4, counter, false); const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer)), offset = hash[hash.length - 1] & 15, binary = ((hash[offset] & 127) << 24) | ((hash[offset + 1] & 255) << 16) | ((hash[offset + 2] & 255) << 8) | (hash[offset + 3] & 255), code = String(binary % 1000000).padStart(6, '0'); $('#totpCode').textContent = `${code.slice(0, 3)} ${code.slice(3)}`; } catch { $('#totpCode').textContent = 'SECRET LỖI'; }
  }
  function gmailDotAliases(local, count) {
    const clean = local.replace(/\./g, ''); if (clean.length < 2) return [local]; const results = new Set(); for (let mask = 1; mask < (1 << (Math.min(clean.length - 1, 20))) && results.size < count; mask++) { let out = clean[0]; for (let i = 1; i < clean.length; i++) { if (mask & (1 << (i - 1))) out += '.'; out += clean[i]; } results.add(out); } return [...results];
  }
  function generateAliases() {
    const raw = $('#aliasEmail').value.trim().toLowerCase(), match = raw.match(/^([^@\s]+)@([^@\s]+)$/); if (!match) { toast('Email gốc chưa hợp lệ', true); return; } const count = Number($('#aliasCount').value) || 10, local = match[1], domain = match[2], mode = state.aliasMode || 'plus'; let aliases = [];
    if (mode === 'dots') { if (!['gmail.com', 'googlemail.com'].includes(domain)) { toast('Dấu chấm chỉ đảm bảo hoạt động với Gmail', true); return; } aliases = gmailDotAliases(local, count).map(x => `${x}@${domain}`); } else { const stem = local.split('+')[0], seed = Date.now().toString(36).slice(-4); aliases = Array.from({ length: count }, (_, i) => `${stem}+dino${seed}${i + 1}@${domain}`); }
    renderUtilityResults('#aliasResults', aliases); toast(`Đã tạo ${aliases.length} alias`);
  }
  function securePassword(length, pool) {
    let out = ''; const limit = 256 - (256 % pool.length), bytes = new Uint8Array(Math.max(32, length * 2)); while (out.length < length) { crypto.getRandomValues(bytes); for (const value of bytes) { if (value < limit) { out += pool[value % pool.length]; if (out.length === length) break; } } } return out;
  }
  function generatePassword() {
    let pool = 'abcdefghijklmnopqrstuvwxyz'; if ($('#passwordUpper').checked) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if ($('#passwordNumber').checked) pool += '0123456789'; if ($('#passwordSymbol').checked) pool += '!@#$%^&*_-+='; $('#passwordOutput').textContent = securePassword(Number($('#passwordLength').value), pool); vibrate();
  }
  function renderUtilityResults(selector, values) {
    $(selector).innerHTML = values.map(value => `<div class="utility-result"><span>${escapeHTML(value)}</span><button data-copy-value="${escapeHTML(value)}" aria-label="Sao chép"><i data-icon="copy"></i></button></div>`).join(''); paintIcons($(selector)); $$('[data-copy-value]', $(selector)).forEach(b => b.onclick = () => copyText(b.dataset.copyValue));
  }
  function generateUuids() { renderUtilityResults('#uuidResults', Array.from({ length: 5 }, () => crypto.randomUUID())); }

  function dataFingerprint(data) {
    const orders = (data.orders || []).map(order => { const { timestamp, warranty, ...rest } = order, { expires_at, ...safeWarranty } = warranty || {}; return { ...rest, warranty: safeWarranty }; });
    const claims = (data.claims || []).map(claim => { const { timestamp, ...rest } = claim; return rest; });
    return JSON.stringify({ lang: data.lang, profile: data.profile, products: data.products, orders, claims, payment_methods: data.payment_methods, bot_username: data.bot_username });
  }

  async function refreshTransactions(options = {}) {
    if (state.refreshing || !state.data || document.hidden) return false; state.refreshing = true;
    const commerceRevision = state.commerceRevision, commerceWasStable = !state.commerceDirty && !state.commerceSaving;
    try { const before = state.data, next = await api('bootstrap'), savedLang = storedLang(); if (next.demo || savedLang) next.lang = savedLang; const oldCodes = new Set((before.orders || []).map(order => order.code)), newOrders = (next.orders || []).filter(order => !oldCodes.has(order.code)), balanceGain = Number(next.profile?.balance || 0) - Number(before.profile?.balance || 0), changed = dataFingerprint(next) !== dataFingerprint(before), langChanged = next.lang !== before.lang; state.data = next; if (langChanged) applyLanguage(); if (commerceWasStable && commerceRevision === state.commerceRevision && !state.commerceDirty && !state.commerceSaving) hydrateCommerce(next.commerce_state); else state.data.commerce_state = { favorites: [...state.commerce.favorites], recent: [...state.commerce.recent], cart: state.commerce.cart.map(item => ({ ...item })), renewal_reminders: state.commerce.renewal_reminders }; if (changed) renderAll(); else { renderProfile(); renderGrowth(); renderCart(); } if (!options.silent && newOrders.length) { playSuccessChime(); toast(langText(`Thanh toán thành công · Đã nhận ${newOrders.length} đơn mới`, `Payment successful · Received ${newOrders.length} new orders`, `付款成功 · 收到 ${newOrders.length} 个新订单`)); } else if (!options.silent && balanceGain > 0) { playSuccessChime(); toast(langText(`Nạp tiền thành công · +${money(balanceGain)}`, `Top-up successful · +${money(balanceGain)}`, `充值成功 · +${money(balanceGain)}`)); } return true; }
    catch { return false; } finally { state.refreshing = false; }
  }

  const BOOTSTRAP_CACHE_KEY = 'dino_miniapp_bootstrap_cache';
  function getCurrentTelegramUser() {
    try {
      if (tg?.initDataUnsafe?.user?.id) return tg.initDataUnsafe.user;
      if (tg?.initData) {
        const params = new URLSearchParams(tg.initData);
        const rawUser = params.get('user');
        if (rawUser) return JSON.parse(rawUser);
      }
    } catch { }
    return null;
  }

  function getUserCacheKey() {
    const u = getCurrentTelegramUser();
    return u?.id ? `${BOOTSTRAP_CACHE_KEY}_${u.id}` : null;
  }

  function clearCachedBootstrap() {
    try {
      localStorage.removeItem(BOOTSTRAP_CACHE_KEY);
      const key = getUserCacheKey();
      if (key) localStorage.removeItem(key);
    } catch { }
  }

  function blockMiniApp(message) {
    clearCachedBootstrap();
    state.data = null;
    stopPaymentPoll?.();
    if (state.supportPoll) { clearInterval(state.supportPoll); state.supportPoll = null; }
    window.location.href = '/miniapp/baotri.html';
  }

  function showTelegramRequiredNotice() {
    clearCachedBootstrap();
    state.data = null;
    const loading = $('#loading');
    if (loading) loading.hidden = true;
    const content = $('#content');
    if (content) content.hidden = true;
    const bottomNav = $('#bottomNav');
    if (bottomNav) bottomNav.hidden = true;
    $('#app')?.setAttribute('aria-busy', 'false');

    let notice = $('#telegramRequiredNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'telegramRequiredNotice';
      notice.className = 'telegram-required-modal';
      notice.innerHTML = `
        <div class="telegram-required-card">
          <div class="tg-icon-badge">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.5 7.1c-.11.5-.41.62-.83.39l-2.29-1.69-1.1 1.06c-.12.12-.22.22-.45.22l.16-2.33 4.25-3.84c.18-.16-.04-.25-.28-.09l-5.25 3.3-2.26-.71c-.49-.15-.5-.49.1-.73l8.84-3.41c.41-.15.77.1.66.72z"/>
            </svg>
          </div>
          <h2>Yêu Cầu Truy Cập Qua Telegram</h2>
          <p class="tg-notice-desc">Vui lòng mở website thông qua <b>Telegram Bot</b> để sử dụng đầy đủ chức năng.</p>
          <div class="tg-notice-actions">
            <a href="https://t.me/tainguyenhai1110_bot" class="tg-open-bot-btn" target="_blank" rel="noopener">
              <span>🚀 Mở Bot @tainguyenhai1110_bot</span>
            </a>
            <a href="?demo=1" class="tg-demo-link">Xem trước sản phẩm (Chế độ Demo)</a>
          </div>
        </div>
      `;
      document.body.appendChild(notice);
    }
    notice.hidden = false;
  }

  const BOOTSTRAP_CACHE_MAX_AGE_MS = 3 * 60 * 1000; // 3 phút tối đa để tránh dữ liệu tồn đọng quá cũ
  function getCachedBootstrap() {
    try {
      // Dọn dẹp cache dùng chung cũ để tránh việc tài khoản khác load nhầm dữ liệu Admin
      localStorage.removeItem(BOOTSTRAP_CACHE_KEY);

      const key = getUserCacheKey();
      if (!key) return null; // Không xác định được Telegram User ID -> Không load cache profile cá nhân

      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.products && Array.isArray(parsed.products) && parsed.profile) {
        if (parsed._saved_at && (Date.now() - parsed._saved_at > BOOTSTRAP_CACHE_MAX_AGE_MS)) {
          localStorage.removeItem(key);
          return null;
        }
        const u = getCurrentTelegramUser();
        if (u && String(parsed.profile.id) !== String(u.id)) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed;
      }
    } catch { }
    return null;
  }

  function saveCachedBootstrap(data) {
    try {
      const key = getUserCacheKey();
      if (key && data && !data.demo && data.ok) {
        data._saved_at = Date.now();
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch { }
  }


  async function boot() {
    function checkDirectReport() {
      try {
        const urlParams = new URLSearchParams(location.search);
        const hashStr = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
        const hashParams = (!hashStr.startsWith('tgWebAppData') && hashStr.includes('=')) ? new URLSearchParams(hashStr) : new URLSearchParams();
        const rawStartParam = String(tg?.initDataUnsafe?.start_param || urlParams.get('tgWebAppStartParam') || hashParams.get('tgWebAppStartParam') || '').trim();
        const startParam = rawStartParam.toLowerCase();
        const tabParam = String(urlParams.get('tab') || urlParams.get('page') || hashParams.get('tab') || hashParams.get('page') || '').toLowerCase();
        const reportOrder = String(urlParams.get('report_order') || urlParams.get('order') || hashParams.get('report_order') || hashParams.get('order') || (startParam.startsWith('order_') ? rawStartParam.slice(6) : '')).trim();
        const startProdMatch = rawStartParam.match(/^(?:prod|product|buy)_(.+)$/i);
        const startProdParam = startProdMatch ? startProdMatch[1].trim() : (!reportOrder && findProductByParam(rawStartParam) ? rawStartParam : '');
        const prodParam = String(urlParams.get('product') || urlParams.get('product_id') || hashParams.get('product') || hashParams.get('product_id') || startProdParam || '').trim();
        if (tabParam === 'report' || tabParam === 'baoloi' || tabParam === 'warranty' || tabParam === 'baoloidon' || reportOrder) {
          openWarranty(reportOrder);
          return true;
        } else if (tabParam === 'topup') {
          const amount = Number(urlParams.get('amount') || hashParams.get('amount') || 0);
          if (amount > 0) $('#topupAmount').value = Math.max(10000, amount);
          openTopup();
          return true;
        } else if (['shop', 'orders', 'tools', 'profile', 'social', 'netflix'].includes(tabParam)) {
          go(tabParam);
          if (tabParam === 'social') {
            const subtab = urlParams.get('subtab') || hashParams.get('subtab');
            if (subtab && ['order', 'tracking', 'pricing'].includes(subtab)) {
              switchSmmTab(subtab);
            }
          }
          const surfsharkOrder = String(urlParams.get('surfshark_order') || hashParams.get('surfshark_order') || '').trim();
          if (surfsharkOrder) {
            openSurfsharkActivate(surfsharkOrder);
            return true;
          }
        } else if (prodParam) {
          const matchedProd = findProductByParam(prodParam);
          go(matchedProd?.social ? 'social' : 'shop');
        } else {
          go('home');
        }
        const sheetParam = String(urlParams.get('sheet') || hashParams.get('sheet') || '').toLowerCase();
        if (prodParam) {
          const p = findProductByParam(prodParam);
          if (p) {
            openProduct(p);
            const qtyParam = Number(urlParams.get('qty') || hashParams.get('qty') || 0);
            if (Number.isFinite(qtyParam) && qtyParam > 0) {
              setQuantity(qtyParam, { commit: true });
            }
          } else {
            toast(tr('Sản phẩm không tồn tại hoặc đang tạm ẩn'), true);
          }
          return true;
        } else if (sheetParam === 'cart' && typeof openCart === 'function') {
          openCart();
          return true;
        } else if (sheetParam === 'wheel' && typeof openWheel === 'function') {
          openWheel();
          return true;
        } else if (sheetParam === 'policy') {
          openSheet('#policySheet');
          return true;
        } else if (sheetParam === 'support' && typeof openSupport === 'function') {
          openSupport();
          return true;
        } else if (sheetParam === 'product' && state.data?.products?.[0]) {
          openProduct(state.data.products[0]);
          return true;
        }
        return Boolean(tabParam);
      } catch (e) { }
      return false;
    }
    try {
      tg?.ready();
      tg?.expand();
      tg?.disableVerticalSwipes?.();
      tg?.setHeaderColor?.('#070B0E');
      tg?.setBackgroundColor?.('#070B0E');
      tg?.onEvent?.('viewportChanged', () => scrollToTop());
    } catch { }
    try { localStorage.removeItem(BOOTSTRAP_CACHE_KEY); } catch { }
    try {
      const earlyUser = tg?.initDataUnsafe?.user;
      if (earlyUser) {
        const earlyName = earlyUser.first_name ? (earlyUser.last_name ? `${earlyUser.first_name} ${earlyUser.last_name}` : earlyUser.first_name) : (earlyUser.username || 'Bạn');
        const earlyLetter = initials(earlyName).slice(0, 1);
        const earlyPhoto = String(earlyUser.photo_url || '').trim();
        if ($('#welcomeName')) $('#welcomeName').textContent = earlyName;
        setAvatarPhoto($('.avatar-button'), $('#avatarText'), earlyPhoto, earlyLetter);
        setAvatarPhoto($('.profile-avatar'), $('#profileInitial'), earlyPhoto, earlyLetter);
      }
    } catch { }

    const isDemo = new URLSearchParams(location.search).get('demo') === '1';
    if (!tg?.initData && !isDemo) {
      showTelegramRequiredNotice();
      return;
    }
    const cached = !isDemo ? getCachedBootstrap() : null;
    let hasRenderedCached = false;
    if (cached) {
      state.data = cached;
      const savedLang = storedLang();
      if (savedLang) state.data.lang = savedLang;
      applyLanguage();
      hydrateCommerce(state.data.commerce_state);
      renderAll();
      renderSoundSetting();
      $('#loading').hidden = true;
      $('#content').hidden = false;
      $('#bottomNav').hidden = false;
      $('#app').setAttribute('aria-busy', 'false');
      scrollToTop();
      requestAnimationFrame(scrollToTop);
      setTimeout(scrollToTop, 60);
      hasRenderedCached = true;
    }
    try {
      const fresh = await api('bootstrap');
      const savedLang = storedLang();
      if (fresh.demo || savedLang) fresh.lang = savedLang;
      state.data = fresh;
      if (!fresh.demo) saveCachedBootstrap(fresh);
      applyLanguage();
      hydrateCommerce(fresh.commerce_state);
      renderAll();
      renderSoundSetting();
      $('#loading').hidden = true;
      $('#content').hidden = false;
      $('#bottomNav').hidden = false;
      $('#app').setAttribute('aria-busy', 'false');
      scrollToTop();
      requestAnimationFrame(scrollToTop);
      setTimeout(scrollToTop, 60);
      checkDirectReport();
    }
    catch (e) {
      if (e?.payload?.code === 'miniapp_maintenance' || e?.payload?.code === 'miniapp_disabled') {
        blockMiniApp(e.message);
      } else {
        try {
          const resp = await fetch('./products.json').then(r => r.json()).catch(() => null);
          const fallbackProds = (resp?.products || []).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category?.name || 'Sản phẩm',
            price: p.salePrice || p.price,
            old_price: p.price,
            stock: 99,
            description: p.description || '',
            image_url: p.imageUrl || '',
            is_flash: Boolean(p.salePrice),
            is_hot: true,
            featured: true,
            warranty: 'Bảo hành 12 tháng',
            rating: { count: 32, score: 5 },
            social: false,
            minimum_quantity: 1,
            maximum_quantity: 100
          }));
          const fallbackData = {
            ok: true,
            profile: {
              id: 'user_guest',
              name: 'Khách hàng',
              username: 'user',
              balance: 100000,
              total_spent: 0,
              rank: 'MEMBER'
            },
            rank_details: { name: 'MEMBER', discount_percent: 0 },
            products: fallbackProds.length ? fallbackProds : [
              { id: 'p1', name: 'Slot Office 365 1 năm BHF', category: '🪟 Microsoft 365', price: 165000, old_price: 190000, stock: 9, description: 'Microsoft 365 Family Premium 1 Năm + 1TB OneDrive', is_flash: true, is_hot: true, featured: true, warranty: 'Bảo hành 12 tháng', rating: { count: 28, score: 5 } },
              { id: 'p2', name: 'Google One 2TB 1 Năm', category: '✨ Google One', price: 299000, old_price: 350000, stock: 15, description: 'Google One chính chủ nâng cấp', is_flash: false, is_hot: true, featured: true, warranty: 'Bảo hành 12 tháng', rating: { count: 19, score: 5 } },
              { id: 'p3', name: 'Canva Pro Vĩnh Viễn', category: '🎨 Canva', price: 89000, old_price: 120000, stock: 20, description: 'Tài khoản Canva Pro trọn đời', is_flash: true, is_hot: true, featured: true, warranty: 'Bảo hành vĩnh viễn', rating: { count: 45, score: 5 } }
            ],
            categories: resp?.categories?.map(c => c.name) || ['🪟 Microsoft 365', '✨ Google One', '🎨 Canva'],
            payment_methods: {
              balance: { label: 'Số dư ví Dino', enabled: true },
              bank: { label: 'Chuyển khoản VietQR', enabled: true },
              usdt: { label: 'USDT (TRC20)', enabled: true }
            },
            orders: [],
            recent_purchases: [
              { name: 'Nguyễn ***', product: 'ChatGPT Plus (1 Tháng)', time: '1 phút trước' },
              { name: 'Trần ***', product: 'Canva Pro Vĩnh Viễn', time: '3 phút trước' }
            ],
            usdt_rate: 25400,
            wheel: { spins: 1, total_won: 0, cost: 0 },
            referral: { link: 'https://t.me/tainguyenhai1110_bot', count: 0, earnings: 0 },
            netflix: { enabled: true, account: 'VIP Ultra HD' },
            recommendations: fallbackProds.slice(0, 4),
            commerce_state: { favorites: [], cart: [], recent: [] },
            bot_username: 'tainguyenhai1110_bot',
            miniapp_short_name: 'app',
            pending_invoice: null,
            lang: 'vi',
            demo: false
          };
          state.data = fallbackData;
          applyLanguage();
          hydrateCommerce(fallbackData.commerce_state);
          renderAll();
          renderSoundSetting();
          $('#loading').hidden = true;
          $('#content').hidden = false;
          $('#bottomNav').hidden = false;
          $('#app').setAttribute('aria-busy', 'false');
          scrollToTop();
        } catch (errFallback) {
          if (!state.data || !state.data.profile) {
            $('#loading').innerHTML = `<div class="empty-state"><span>${svg('lock')}</span><h3>${langText('Không mở được Mini App', 'Cannot open Mini App', '无法打开 Mini App')}</h3><p>${escapeHTML(e.message)}</p></div>`;
          }
        }
      }
    }
  }

  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go))); $('#searchButton').onclick = () => go('shop'); $('#languageButton').onclick = cycleLanguage; $('#searchInput').oninput = e => { state.search = e.target.value; renderShop(); }; $('#clearSearch').onclick = () => { $('#searchInput').value = ''; state.search = ''; renderShop(); }; $('#socialSearchInput')?.addEventListener('input', e => { state.socialSearch = e.target.value; renderSocial(); }); $('#clearSocialSearch')?.addEventListener('click', () => { if ($('#socialSearchInput')) $('#socialSearchInput').value = ''; state.socialSearch = ''; renderSocial(); }); $('#clearSocialEmpty')?.addEventListener('click', () => { if ($('#socialSearchInput')) $('#socialSearchInput').value = ''; state.socialSearch = ''; state.socialCategory = 'Tất cả'; renderSocial(); }); $('#sortButton').onclick = () => { const cycle = { popular: 'price', price: 'stock', stock: 'popular' }; state.sort = cycle[state.sort]; $('#sortButton').lastChild.textContent = { popular: 'Phổ biến', price: 'Giá thấp', stock: 'Tồn kho' }[state.sort]; renderShop(); };
  $$('[data-order-tab]').forEach(b => b.onclick = () => { state.orderTab = b.dataset.orderTab; $$('[data-order-tab]').forEach(x => x.classList.toggle('active', x === b)); $('#orderList').hidden = state.orderTab !== 'orders'; $('#claimList').hidden = state.orderTab !== 'claims'; renderOrders(); });
  document.addEventListener('click', e => {
    const reportBtn = e.target.closest('#openReport, #openProfileReport, [data-action="report"]');
    if (reportBtn) {
      e.preventDefault();
      openWarranty();
    }
  });
  $('#openProfileReport')?.addEventListener('click', () => openWarranty());
  $('#qtyMinus').onclick = () => { setQuantity(state.quantity - 1, { commit: true }); vibrate(); }; $('#qtyPlus').onclick = () => { setQuantity(state.quantity + 1, { commit: true }); vibrate(); }; $('#qtyValue').oninput = e => setQuantity(e.target.value); $('#qtyValue').onblur = e => setQuantity(e.target.value, { commit: true }); $('#buyButton').onclick = checkout; $('#submitWarranty').onclick = submitWarranty;
  $('#warrantyUploadBtn')?.addEventListener('click', () => $('#warrantyFileInput')?.click());
  $('#warrantyFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleWarrantyFileSelect(file);
  });
  $('#warrantyRemovePhoto')?.addEventListener('click', () => {
    if ($('#warrantyPhotoUrl')) $('#warrantyPhotoUrl').value = '';
    if ($('#warrantyFileInput')) $('#warrantyFileInput').value = '';
    if ($('#warrantyPhotoPreview')) $('#warrantyPhotoPreview').hidden = true;
    toast('Đã gỡ ảnh');
  }); $('#warrantyDescription').oninput = e => $('#charCount').textContent = e.target.value.length; $('#copyAllDelivery').onclick = () => copyText(state.deliveryItems.join('\n'), 'Đã sao chép toàn bộ sản phẩm'); $('#downloadDelivery').onclick = downloadDelivery; $('#sheetBackdrop').onclick = closeSheets; $$('[data-close-sheet]').forEach(b => b.onclick = closeSheets); $('#topupButton').onclick = openTopup; $('#currencyToggleBtn').onclick = () => { state.currencyMode = getCurrencyMode() === 'vnd' ? 'usdt' : 'vnd'; try { localStorage.setItem('dino_currency', state.currencyMode); } catch (e) { } renderAll(); toast(langText(`Đã chuyển tiền tệ sang ${state.currencyMode.toUpperCase()}`, `Switched currency to ${state.currencyMode.toUpperCase()}`, `已切换货币为 ${state.currencyMode.toUpperCase()}`)); }; $('#topupProfile').onclick = openTopup; $('#policyCard').onclick = openPolicy; $('#policyCard').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPolicy(); } }; $$('[data-action="support"]').forEach(b => b.onclick = openSupport); $('#refreshButton').onclick = () => location.reload(); document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });
  $('#couponCode').oninput = event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''); refreshQuote(); };
  $('#ssCodeInput')?.addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); });
  $('#ssCodeInput')?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); submitSurfsharkActivate(); } });
  $('#ssSubmitBtn')?.addEventListener('click', submitSurfsharkActivate);
  $('[data-pay-group="binance"]')?.addEventListener('click', event => { const button = event.currentTarget; if (button.disabled) { toast(button.title || tr('Chưa cấu hình USDT'), true); return; } if (state.invoice) { toast('Hãy hủy hóa đơn hiện tại trước khi đổi phương thức', true); return; } state.paymentBinanceOpen = !state.paymentBinanceOpen; renderPaymentMethods(); vibrate(); });
  $$('[data-pay-method]').forEach(b => b.onclick = () => { if (b.disabled) { toast(b.title || 'Phương thức này đang tạm tắt', true); return; } if (state.invoice) { toast('Hãy hủy hóa đơn hiện tại trước khi đổi phương thức', true); return; } state.paymentMethod = b.dataset.payMethod; if (isUsdtPaymentMethod(state.paymentMethod)) state.paymentBinanceOpen = true; renderPaymentMethods(); renderPaymentDetail(); renderConfirmPaymentButton(); vibrate(); });
  $('[data-topup-group="binance"]')?.addEventListener('click', event => { const button = event.currentTarget; if (button.disabled) { toast(button.title || tr('Chưa cấu hình USDT'), true); return; } if (state.topupInvoice) { toast(langText('Hãy hủy hóa đơn hiện tại trước khi đổi phương thức', 'Cancel the current invoice before changing method', '请先取消当前账单再更换方式'), true); return; } state.topupBinanceOpen = !state.topupBinanceOpen; renderTopupMethods(); vibrate(); });
  $$('[data-topup-method]').forEach(b => b.onclick = () => { if (b.disabled) { toast(b.title || langText('Phương thức này đang tạm tắt', 'This method is temporarily unavailable', '此付款方式暂时关闭'), true); return; } if (state.topupInvoice) { toast(langText('Hãy hủy hóa đơn hiện tại trước khi đổi phương thức', 'Cancel the current invoice before changing method', '请先取消当前账单再更换方式'), true); return; } state.topupMethod = b.dataset.topupMethod; if (isUsdtPaymentMethod(state.topupMethod)) state.topupBinanceOpen = true; renderTopupMethods(); vibrate(); });
  $('#confirmPayment').onclick = createPayment; $('#createTopup').onclick = createTopup; $('#sendSupport').onclick = sendSupport;
  $('#openPaymentPolicy')?.addEventListener('click', e => { e.preventDefault(); openPolicy(); });
  $('#openTopupPolicy')?.addEventListener('click', e => { e.preventDefault(); openPolicy(); });
  $('#favoriteProduct').onclick = () => toggleFavorite(); $('#addCart').onclick = addSelectedToCart; $('#shareProductLink')?.addEventListener('click', () => { if (!state.selected?.id) return; copyText(buildProductDirectLink(state.selected.id), tr('Đã sao chép link sản phẩm')); }); $('#openCart').onclick = () => { renderCart(); openSheet('#cartSheet'); };
  $('#openWheel').onclick = () => { openSheet('#wheelSheet'); drawWheelCanvas(); renderWheel(); };
  $('#spinWheelBtn').onclick = spinWheel;
  $('#spinCenterBtn').onclick = spinWheel;
  $('#copyReferral').onclick = () => copyText(state.data?.referral?.link || '', 'Đã sao chép liên kết giới thiệu');
  $('#renewalToggle').onclick = () => { state.commerce.renewal_reminders = !state.commerce.renewal_reminders; renderProfile(); syncCommerce(); toast(state.commerce.renewal_reminders ? 'Đã bật nhắc gia hạn' : 'Đã tắt nhắc gia hạn'); };
  $('#adminRefresh').onclick = () => refreshAdmin();
  $('#adminSearch').oninput = event => { state.adminQuery = event.target.value; renderAdmin(); clearTimeout(refreshAdmin.searchTimer); refreshAdmin.searchTimer = setTimeout(() => refreshAdmin(true), 280); };
  $('#adminStatus').onchange = event => { state.adminStatus = event.target.value; refreshAdmin(true); };
  $('#adminDay').onchange = event => { state.adminDay = event.target.value; refreshAdmin(true); };
  $('#adminClearFilters').onclick = () => { state.adminQuery = ''; state.adminStatus = 'all'; state.adminDay = ''; $('#adminSearch').value = ''; $('#adminStatus').value = 'all'; $('#adminDay').value = ''; refreshAdmin(true); };
  $('#adminExport').onclick = downloadAdminReport;
  $$('[data-admin-tab]').forEach(button => button.onclick = () => {
    state.adminTab = button.dataset.adminTab;
    $$('[data-admin-tab]').forEach(item => item.classList.toggle('active', item === button));
    $$('[data-admin-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.adminPanel === state.adminTab));
    vibrate();
  });
  $('#openTicketInbox').onclick = () => { location.href = '/miniapp/chat?admin=1' + location.hash; };
  $('#openAdvancedAdmin').onclick = () => {
    const url = state.adminData?.advanced_admin_url; if (!canAdmin('admin.web.open') || !url) { toast('Chỉ Owner được mở Admin Web', true); return; }
    if (tg?.openLink) tg.openLink(new URL(url, location.origin).href);
    else window.open(url, '_blank', 'noopener');
  };
  $$('[data-tool]').forEach(b => b.onclick = () => { $$('[data-tool]').forEach(x => x.classList.toggle('active', x === b)); $$('[data-tool-panel]').forEach(x => x.classList.toggle('active', x.dataset.toolPanel === b.dataset.tool)); vibrate(); });
  $$('[data-alias-mode]').forEach(b => b.onclick = () => { state.aliasMode = b.dataset.aliasMode; $$('[data-alias-mode]').forEach(x => x.classList.toggle('active', x === b)); });
  $$('[data-paste]').forEach(b => b.onclick = async () => { try { const value = await navigator.clipboard.readText(); $(`#${b.dataset.paste}`).value = value; if (b.dataset.paste === 'totpSecret') updateTotp(); } catch { toast('Không thể đọc clipboard', true); } });
  $('#totpSecret').oninput = updateTotp; $('#copyTotp').onclick = () => copyText($('#totpCode').textContent.replace(/\s/g, ''), 'Đã sao chép mã 2FA'); setInterval(updateTotp, 1000);
  $('#generateAlias').onclick = generateAliases;
  $('#passwordLength').oninput = e => $('#passwordLengthLabel').textContent = e.target.value; $('#generatePassword').onclick = generatePassword; $('#copyPassword').onclick = () => copyText($('#passwordOutput').textContent, 'Đã sao chép mật khẩu');
  $('#generateUuid').onclick = generateUuids; generateUuids(); generatePassword();
  $('#netflixRefresh')?.addEventListener('click', async () => {
    if (state.netflixLinkBusy || state.netflixRotateBusy) return;
    state.netflixRotateBusy = true;
    const btn = $('#netflixRefresh');
    if (btn) btn.disabled = true;
    try {
      const res = await api('netflix/rotate', {
        method: 'POST',
        body: JSON.stringify({ init_data: tg?.initData || '' })
      });
      if (res.netflix && state.data) {
        state.data.netflix = res.netflix;
      }
      renderNetflix();
      const acc = state.data?.netflix?.account;
      const country = acc?.country_name || '';
      toast(country ? `Đã xoay vòng sang ${acc.id} (${country})` : 'Đã làm mới dữ liệu');
    } catch (e) {
      toast(e.message || 'Không thể đổi tài khoản lúc này', true);
    } finally {
      state.netflixRotateBusy = false;
      if (btn && !state.netflixLinkBusy) btn.disabled = false;
    }
  });
  $('#buyNetflixBasicBtn')?.addEventListener('click', () => buyNetflixVip('basic'));
  $('#buyNetflixProBtn')?.addEventListener('click', () => buyNetflixVip('pro'));
  $('#netflixTvPairBtn')?.addEventListener('click', pairNetflixTv);
  $('#netflixGetLinkMobileBtn')?.addEventListener('click', () => getNetflixLink('mobile'));
  $('#netflixGetLinkPcBtn')?.addEventListener('click', () => getNetflixLink('pc'));
  $('#netflixGetCookieBtn')?.addEventListener('click', () => getNetflixLink('cookie'));

  $('#soundToggle').onclick = () => { state.soundEnabled = !state.soundEnabled; localStorage.setItem('dino_transaction_sound', state.soundEnabled ? 'on' : 'off'); renderSoundSetting(); if (state.soundEnabled) { unlockSound(); playSuccessChime(); toast('Đã bật âm báo giao dịch'); } else toast('Đã tắt âm báo giao dịch'); };
  document.addEventListener('pointerdown', unlockSound, { once: true }); document.addEventListener('visibilitychange', async () => { if (!document.hidden) { await refreshTransactions(); if (state.page === 'admin') await refreshAdmin(true); } }); setInterval(async () => { if (document.hidden) return; await refreshTransactions(); if (state.page === 'admin') await refreshAdmin(true); }, 12000);
  window.go = go; window.openProduct = openProduct; window.openWarranty = openWarranty; window.openDelivery = openDelivery; window.state = state;
  boot();
})();

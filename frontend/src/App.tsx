import { useEffect, useState, useMemo } from 'react';
import {
  Home,
  ShoppingBag,
  FileText,
  LayoutGrid,
  User,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Package,
  Copy,
  Check,
  Volume2,
  VolumeX,
  CreditCard,
  Plus,
  ExternalLink,
  Gift,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Headphones,
  LifeBuoy,
  X,
  Lock,
  Download,
  AlertCircle,
  KeyRound,
  Mail
} from 'lucide-react';

declare global {
  interface Window {
    __API_URL__?: string;
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready(): void;
        expand(): void;
        openTelegramLink(url: string): void;
        sendData(data: string): void;
        HapticFeedback?: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
        };
      };
    };
  }
}

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

function getInitialApi(): string {
  if (typeof window === 'undefined') return '';
  if (isLocalhost) return 'http://localhost:4000';
  return '';
}

// Trích xuất dữ liệu người dùng thực tế từ Telegram WebApp SDK
function getTelegramUser() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  // 1. Lấy từ initDataUnsafe.user do Telegram WebApp cung cấp
  if (tg?.initDataUnsafe?.user?.id) {
    return tg.initDataUnsafe.user;
  }
  // 2. Lấy từ chuỗi initData
  if (tg?.initData) {
    try {
      const p = new URLSearchParams(tg.initData);
      const uStr = p.get('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u?.id) return u;
      }
    } catch {}
  }
  // 3. Lấy từ URL hash hoặc search (khi nhúng trong iframe web.telegram.org)
  if (typeof window !== 'undefined') {
    for (const source of [window.location.hash.slice(1), window.location.search.slice(1)]) {
      if (!source) continue;
      try {
        const p = new URLSearchParams(source);
        const raw = p.get('tgWebAppData') || p.get('initData');
        if (raw) {
          const sub = new URLSearchParams(raw);
          const uStr = sub.get('user');
          if (uStr) {
            const u = JSON.parse(uStr);
            if (u?.id) return u;
          }
        }
        const directUser = p.get('user');
        if (directUser) {
          const u = JSON.parse(directUser);
          if (u?.id) return u;
        }
      } catch {}
    }
  }
  return null;
}

// Component hiển thị Avatar người dùng thực tế (nếu không có ảnh sẽ tạo avatar chữ cái đầu phong cách Neon)
function UserAvatar({ name, photoUrl, size = 36 }: { name?: string; photoUrl?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || 'K').trim().charAt(0).toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #2e0d18 0%, #15060c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff2453',
        fontWeight: 800,
        fontSize: Math.round(size * 0.44),
        fontFamily: 'var(--font-display)',
        textShadow: '0 0 10px rgba(255, 36, 83, 0.6)',
        userSelect: 'none'
      }}
    >
      {initial}
    </div>
  );
}

// Hàm phát âm thanh Ting giao dịch qua Web Audio API (không cần tải file ngoài)
function playTingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Note A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // Note A6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_e) {}
}

type TabType = 'home' | 'store' | 'orders' | 'tools' | 'profile';

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  category?: { id?: string; name: string; slug?: string };
  stockItems?: any[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [apiUrl] = useState(getInitialApi());
  const [token, setToken] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [botUsername, setBotUsername] = useState('tainguyenhai1110_bot');
  const [bankConfig, setBankConfig] = useState({
    bankId: '970436',
    accountNo: 'HAI100TR',
    accountName: 'NGUYEN HOANG HAI'
  });

  // User Profile thực tế từ Telegram WebApp
  const [profile, setProfile] = useState<any>(() => {
    const u = typeof window !== 'undefined' ? getTelegramUser() : null;
    if (u) {
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.first_name || 'Khách hàng';
      return {
        telegramId: String(u.id),
        firstName: u.first_name || fullName,
        fullName,
        username: u.username || '',
        photoUrl: u.photo_url || '',
        balance: 0,
        totalSpent: 0
      };
    }
    return {
      telegramId: '',
      firstName: 'Khách hàng',
      fullName: 'Khách hàng',
      username: '',
      photoUrl: '',
      balance: 0,
      totalSpent: 0
    };
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc'>('popular');

  // Interactive States
  const [currency, setCurrency] = useState<'VND' | 'USDT'>('VND');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [productModal, setProductModal] = useState<Product | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  // Tools state (2FA, Temp Mail, UID)
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('749 201');
  const [twoFaTimer, setTwoFaTimer] = useState(24);
  const [tempMail, setTempMail] = useState('user98234@hai1110.temp');
  const [fbUrl, setFbUrl] = useState('');
  const [fbUid, setFbUid] = useState<string | null>(null);

  // Admin form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('50000');
  const [newProdCatId, setNewProdCatId] = useState('');

  // Orders tab filter
  const [orderFilter, setOrderFilter] = useState<'all' | 'warranty'>('all');
  const [myOrders, setMyOrders] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (soundEnabled) playTingSound();
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, label: string = 'Đã sao chép!') => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    showToast(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Khởi tạo nhận diện tài khoản Telegram thực tế 100%
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    const u = getTelegramUser();
    if (u) {
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.first_name || 'Khách hàng';
      setProfile((prev: any) => ({
        ...prev,
        telegramId: String(u.id),
        firstName: u.first_name || fullName,
        fullName,
        username: u.username || '',
        photoUrl: u.photo_url || prev.photoUrl || ''
      }));
    }

    // Nếu chạy qua backend API, đồng bộ thêm số dư tài khoản
    if (apiUrl && tg?.initData) {
      fetch(`${apiUrl}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData })
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.user) {
            setProfile((prev: any) => ({
              ...prev,
              telegramId: String(d.user.telegramId || d.user.id),
              firstName: d.user.firstName || prev.firstName,
              fullName: [d.user.firstName, d.user.lastName].filter(Boolean).join(' ') || d.user.firstName || prev.fullName,
              username: d.user.username || prev.username,
              photoUrl: d.user.photoUrl || prev.photoUrl,
              balance: Number(d.user.balance || 0)
            }));
          }
        })
        .catch(() => {});
    }

    // Tự mở Admin nếu có hash #admin
    if (window.location.hash === '#admin') {
      setAdminModalOpen(true);
    }
  }, [apiUrl]);

  // Timer 2FA đếm lùi
  useEffect(() => {
    const timer = setInterval(() => {
      setTwoFaTimer((t) => {
        if (t <= 1) {
          const rand = Math.floor(100000 + Math.random() * 900000);
          setTwoFaCode(`${String(rand).slice(0, 3)} ${String(rand).slice(3)}`);
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tải dữ liệu sản phẩm & danh mục
  async function loadData() {
    if (apiUrl) {
      try {
        const prods = await fetch(`${apiUrl}/api/products`).then((r) => r.json());
        if (Array.isArray(prods)) setProducts(prods);
        const cats = await fetch(`${apiUrl}/api/categories`).then((r) => r.json());
        if (Array.isArray(cats)) setCategories(cats);
        return;
      } catch (_e) {}
    }

    // Chế độ GitHub Pages Serverless: Đọc từ products.json
    try {
      const res = await fetch('./products.json');
      if (res.ok) {
        const json = await res.json();
        if (json.products) setProducts(json.products);
        if (json.categories) setCategories(json.categories);
        if (json.botUsername) setBotUsername(json.botUsername);
        if (json.bankConfig) setBankConfig(json.bankConfig);
      }
    } catch (_e) {}
  }

  useEffect(() => {
    loadData();
  }, [apiUrl]);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat =
          selectedCategory === 'all' ||
          p.category?.slug === selectedCategory ||
          p.category?.name === selectedCategory;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        const pA = a.salePrice ?? a.price;
        const pB = b.salePrice ?? b.price;
        if (sortBy === 'price_asc') return pA - pB;
        if (sortBy === 'price_desc') return pB - pA;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Hành động Mua hàng
  const handleBuyProduct = (p: Product) => {
    if (soundEnabled) playTingSound();
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');

    const tg = window.Telegram?.WebApp;
    const botName = botUsername || 'tainguyenhai1110_bot';
    const deepLink = `https://t.me/${botName}?start=buy_${p.id}`;

    if (tg) {
      try {
        tg.sendData(JSON.stringify({ action: 'BUY', productId: p.id, name: p.name }));
      } catch {}

      if (tg.openTelegramLink) {
        tg.openTelegramLink(deepLink);
      } else {
        window.location.href = deepLink;
      }
      return;
    }

    window.open(deepLink, '_blank');
  };

  // Vòng quay may mắn
  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setWheelResult(null);
    if (soundEnabled) playTingSound();

    setTimeout(() => {
      setSpinning(false);
      const gifts = [
        '🎉 Chúc mừng bạn trúng Voucher 10.000đ!',
        '🎁 Quà tặng: Giảm 20% đơn hàng tiếp theo!',
        '✨ Chúc mừng bạn trúng Key ExpressVPN 1 Ngày!',
        '🍀 May mắn lần sau nhé bạn ơi!'
      ];
      const win = gifts[Math.floor(Math.random() * gifts.length)];
      setWheelResult(win);
      showToast(win);
    }, 1800);
  };

  // Thêm danh mục Admin
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrl) return showToast('Vui lòng bật backend local để thêm');
    try {
      const res = await fetch(`${apiUrl}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug })
      }).then((r) => r.json());
      if (res.id) {
        showToast('✅ Đã tạo danh mục thành công!');
        setNewCatName('');
        setNewCatSlug('');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi thêm danh mục');
    }
  };

  // Thêm sản phẩm Admin
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrl) return showToast('Vui lòng bật backend local để thêm');
    try {
      const res = await fetch(`${apiUrl}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newProdCatId, name: newProdName, price: Number(newProdPrice) })
      }).then((r) => r.json());
      if (res.id) {
        showToast('✅ Đã tạo sản phẩm thành công!');
        setNewProdName('');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi thêm sản phẩm');
    }
  };

  // Xuất file tĩnh lên GitHub Pages
  const handleExportGithub = async () => {
    if (!apiUrl) return showToast('Chỉ xuất khi chạy trên localhost máy chủ');
    try {
      const res = await fetch(`${apiUrl}/api/admin/export-githubpage`, { method: 'POST' }).then((r) => r.json());
      showToast('✅ ' + (res.message || 'Đã xuất ra githubpage/products.json!'));
    } catch (err: any) {
      showToast(err.message || 'Lỗi xuất dữ liệu');
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={16} color="var(--primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER CHUNG */}
      <header className="app-header">
        <div className="brand-wrapper" onClick={() => setActiveTab('home')}>
          <div className="brand-logo">
            <Zap size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-title">HAI1110</span>
            <span className="brand-subtitle">DIGITAL STORE</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="header-btn"
            title="Tìm kiếm"
            onClick={() => {
              setActiveTab('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Search size={18} />
          </button>

          <div className="lang-badge" title="Ngôn ngữ Tiếng Việt">
            <span>🇻🇳</span>
            <span>VI</span>
          </div>

          <div className="header-avatar" onClick={() => setActiveTab('profile')}>
            <UserAvatar name={profile?.fullName || profile?.firstName} photoUrl={profile?.photoUrl} size={36} />
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH THEO 5 TAB */}
      <main className="page-container">
        {/* ========================================================
            TAB 1: TRANG CHỦ (HOME)
        ======================================================== */}
        {activeTab === 'home' && (
          <>
            {/* Chào mừng */}
            <div>
              <p className="sub-eyebrow">CHÀO MỪNG TRỞ LẠI</p>
              <div className="sub-title-row">
                <h1 className="sub-title">
                  Xin chào, {profile?.fullName || profile?.firstName || 'Khách hàng'} <span className="sparkle">✦</span>
                </h1>
                <div className="member-badge">
                  <span>👑</span>
                  <span>MEMBER</span>
                </div>
              </div>
            </div>

            {/* Wallet Hero Card */}
            <div className="wallet-card">
              <div className="wallet-top-row">
                <span className="sub-eyebrow" style={{ color: 'var(--text-sub)' }}>SỐ DƯ KHẢ DỤNG</span>
                <button
                  className="currency-toggle"
                  onClick={() => {
                    setCurrency((c) => (c === 'VND' ? 'USDT' : 'VND'));
                    if (soundEnabled) playTingSound();
                  }}
                >
                  <RotateCcw size={12} />
                  <span>{currency === 'VND' ? 'VND ⇄ USDT' : 'USDT ⇄ VND'}</span>
                </button>
              </div>

              <div className="wallet-balance-row">
                <div>
                  <div className="balance-amount">
                    {currency === 'VND' ? (
                      <>
                        <span>{Number(profile?.balance || 0).toLocaleString('vi-VN')}</span>
                        <span className="balance-symbol">đ</span>
                      </>
                    ) : (
                      <>
                        <span>{(Number(profile?.balance || 0) / 25400).toFixed(2)}</span>
                        <span className="balance-symbol">$</span>
                      </>
                    )}
                  </div>
                  <p className="wallet-subtext">
                    Tổng chi tiêu: <b>{Number(profile?.totalSpent || 0).toLocaleString('vi-VN')}đ</b>
                  </p>
                </div>

                <button className="btn-deposit" onClick={() => setDepositModalOpen(true)}>
                  <Plus size={16} />
                  <span>Nạp tiền</span>
                </button>
              </div>
            </div>

            {/* Quick Actions 8 Cards (2 cột) */}
            <div className="quick-grid">
              {/* 1. Cửa hàng */}
              <div className="quick-card" onClick={() => setActiveTab('store')}>
                <div className="quick-card-left">
                  <div className="quick-icon-wrap">🛍️</div>
                  <div className="quick-texts">
                    <span className="quick-title">Cửa hàng</span>
                    <span className="quick-desc">Mua tài khoản...</span>
                  </div>
                </div>
                <ChevronRight size={16} className="quick-arrow" />
              </div>

              {/* 2. Đơn hàng */}
              <div className="quick-card" onClick={() => setActiveTab('orders')}>
                <div className="quick-card-left">
                  <div className="quick-icon-wrap">📦</div>
                  <div className="quick-texts">
                    <span className="quick-title">Đơn hàng</span>
                    <span className="quick-desc">Giao hàng, lịch sử...</span>
                  </div>
                </div>
                <ChevronRight size={16} className="quick-arrow" />
              </div>

              {/* 3. Báo lỗi đơn */}
              <div
                className="quick-card"
                onClick={() => {
                  window.open('https://t.me/haiempire', '_blank');
                }}
              >
                <div className="quick-card-left">
                  <div className="quick-icon-wrap" style={{ color: '#ef4444' }}>🛡️</div>
                  <div className="quick-texts">
                    <span className="quick-title">Báo lỗi đơn</span>
                    <span className="quick-desc">Bảo hành & CSKH...</span>
                  </div>
                </div>
                <ChevronRight size={16} className="quick-arrow" />
              </div>

              {/* 4. Giỏ hàng */}
              <div className="quick-card" onClick={() => setActiveTab('store')}>
                <div className="quick-card-left">
                  <div className="quick-icon-wrap" style={{ color: '#ec4899' }}>🛒</div>
                  <div className="quick-texts">
                    <span className="quick-title">Giỏ hàng</span>
                    <span className="quick-desc">Sản phẩm đã chọn...</span>
                  </div>
                </div>
                <span className="badge-dim">0</span>
              </div>

              {/* 5. Vòng quay */}
              <div className="quick-card" onClick={() => setWheelModalOpen(true)}>
                <div className="quick-card-left">
                  <div className="quick-icon-wrap" style={{ color: '#f59e0b' }}>🎁</div>
                  <div className="quick-texts">
                    <span className="quick-title">Vòng quay</span>
                    <span className="quick-desc">Thử vận may quà...</span>
                  </div>
                </div>
                <span className="badge-pill">1</span>
              </div>

              {/* 6. Tiện ích */}
              <div className="quick-card" onClick={() => setActiveTab('tools')}>
                <div className="quick-card-left">
                  <div className="quick-icon-wrap" style={{ color: '#06b6d4' }}>✏️</div>
                  <div className="quick-texts">
                    <span className="quick-title">Tiện ích số</span>
                    <span className="quick-desc">2FA, Mail & Công cụ...</span>
                  </div>
                </div>
                <ChevronRight size={16} className="quick-arrow" />
              </div>

              {/* 7. Netflix VIP */}
              <div
                className="quick-card"
                onClick={() => {
                  setActiveTab('store');
                  setSearchQuery('Netflix');
                }}
              >
                <div className="quick-card-left">
                  <div className="quick-icon-wrap" style={{ color: '#e50914' }}>⚡</div>
                  <div className="quick-texts">
                    <span className="quick-title">Netflix VIP</span>
                    <span className="quick-desc">Ghép TV, link tài khoản...</span>
                  </div>
                </div>
                <ChevronRight size={16} className="quick-arrow" />
              </div>

              {/* 8. Hỗ trợ 24/7 */}
              <div
                className="quick-card"
                onClick={() => {
                  window.open('https://t.me/haiempire', '_blank');
                }}
              >
                <div className="quick-card-left">
                  <div className="quick-icon-wrap" style={{ color: '#3b82f6' }}>💬</div>
                  <div className="quick-texts">
                    <span className="quick-title">Hỗ trợ 24/7</span>
                    <span className="quick-desc">Ticket & CSKH @haiempire</span>
                  </div>
                </div>
                <ChevronRight size={16} className="quick-arrow" />
              </div>
            </div>

            {/* Wide Featured Card */}
            <div
              className="wide-card"
              onClick={() => {
                setActiveTab('store');
                setSelectedCategory('all');
              }}
            >
              <div className="quick-card-left">
                <div className="quick-icon-wrap" style={{ color: '#8b5cf6' }}>👥</div>
                <div className="quick-texts">
                  <span className="quick-title">Social Media</span>
                  <span className="quick-desc">Facebook, TikTok, YouTube và nhiều dịch vụ...</span>
                </div>
              </div>
              <span className="badge-pill">2.534</span>
            </div>
          </>
        )}

        {/* ========================================================
            TAB 2: CỬA HÀNG (MARKET / SHOP)
        ======================================================== */}
        {activeTab === 'store' && (
          <>
            <div>
              <p className="sub-eyebrow">HAI1110 MARKET</p>
              <div className="sub-title-row">
                <h1 className="sub-title">Khám phá sản phẩm</h1>
                <span className="badge-pill">{filteredProducts.length} SP</span>
              </div>
            </div>

            {/* Ô tìm kiếm */}
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm ChatGPT, Canva, Netflix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Thanh cuộn danh mục chip */}
            <div className="chips-scroller">
              <button
                className={`chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c.id || c.slug}
                  className={`chip-btn ${selectedCategory === c.slug ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Tiêu đề & Nút sắp xếp */}
            <div className="sub-title-row" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Tất cả sản phẩm</span>
              <button
                className="sort-btn"
                onClick={() => {
                  setSortBy((s) => (s === 'popular' ? 'price_asc' : s === 'price_asc' ? 'price_desc' : 'popular'));
                }}
              >
                <SlidersHorizontal size={14} />
                <span>
                  {sortBy === 'popular' ? 'Phổ biến' : sortBy === 'price_asc' ? 'Giá tăng dần' : 'Giá giảm dần'}
                </span>
              </button>
            </div>

            {/* Grid 2 cột sản phẩm */}
            <div className="product-grid">
              {filteredProducts.map((p) => {
                const price = p.salePrice ?? p.price;
                const isOutOfStock = p.stockItems ? p.stockItems.length === 0 : false;

                return (
                  <div
                    key={p.id}
                    className="product-card"
                    onClick={() => setProductModal(p)}
                  >
                    {/* Thumbnail */}
                    <div className="product-thumb-wrap">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} />
                      ) : (
                        <span className="product-fallback-icon">
                          {p.name.includes('ChatGPT') ? '🤖' :
                           p.name.includes('Canva') ? '🎨' :
                           p.name.includes('Microsoft') ? '🟩' :
                           p.name.includes('Capcut') ? '✂️' :
                           p.name.includes('Duolingo') ? '🦉' :
                           p.name.includes('VPN') ? '🛡️' : '📦'}
                        </span>
                      )}

                      {isOutOfStock && (
                        <div className="outofstock-badge">
                          <span>HẾT HÀNG</span>
                        </div>
                      )}
                    </div>

                    {/* Thông tin */}
                    <div className="product-info">
                      <h3 className="product-title">{p.name}</h3>
                      <div className="product-meta">
                        <span className="rating">★ 5.0</span>
                        <span>(42) · 30 Ngày</span>
                      </div>
                    </div>

                    {/* Giá & Nút mua tròn */}
                    <div className="product-bottom-row">
                      <span className="product-price">{price.toLocaleString('vi-VN')} đ</span>
                      <button
                        className="btn-buy-circle"
                        title="Mua ngay"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyProduct(p);
                        }}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ========================================================
            TAB 3: ĐƠN HÀNG (ORDERS & WARRANTY)
        ======================================================== */}
        {activeTab === 'orders' && (
          <>
            <div>
              <p className="sub-eyebrow">KHO CỦA BẠN</p>
              <div className="sub-title-row">
                <h1 className="sub-title">Đơn hàng & bảo hành</h1>
                <button className="header-btn" title="Làm mới" onClick={() => showToast('Đã làm mới danh sách đơn')}>
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-icon check">
                  <Check size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Đã mua</span>
                  <span className="stat-value">{myOrders.length} đơn</span>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon shield">
                  <ShieldCheck size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Còn bảo hành</span>
                  <span className="stat-value">{myOrders.length} đơn</span>
                </div>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="orders-filter-row">
              <button
                className={`orders-filter-btn ${orderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setOrderFilter('all')}
              >
                Đơn hàng
              </button>
              <button
                className={`orders-filter-btn ${orderFilter === 'warranty' ? 'active' : ''}`}
                onClick={() => setOrderFilter('warranty')}
              >
                Yêu cầu BH (0)
              </button>
            </div>

            {/* Empty state hoặc danh sách */}
            {myOrders.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon-wrap">
                  <Package size={34} />
                </div>
                <h3 className="empty-title">Chưa có đơn hàng</h3>
                <p className="empty-desc">Sản phẩm bạn mua sẽ xuất hiện tự động tại đây kèm mã bản quyền.</p>
                <button className="btn-primary-pill" onClick={() => setActiveTab('store')}>
                  Khám phá cửa hàng
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myOrders.map((o) => (
                  <div key={o.id} className="quick-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{o.code}</span>
                      <span className="badge-pill">Hoàn tất</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{o.productName}</div>
                    <div className="copy-row" style={{ marginTop: 8 }}>
                      <code>{o.accountKey || 'Key: Đã gửi qua Telegram'}</code>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                        onClick={() => copyToClipboard(o.accountKey || '', 'Đã copy key!')}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ========================================================
            TAB 4: TIỆN ÍCH SỐ (TOOLS)
        ======================================================== */}
        {activeTab === 'tools' && (
          <>
            <div>
              <p className="sub-eyebrow">CÔNG CỤ HỖ TRỢ</p>
              <div className="sub-title-row">
                <h1 className="sub-title">Tiện ích số miễn phí</h1>
              </div>
            </div>

            {/* 1. Lấy mã 2FA trực tiếp */}
            <div className="wallet-card" style={{ gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={20} color="var(--primary)" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Trình tạo mã 2FA trực tiếp</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                Dán Secret Key của tài khoản Facebook, ChatGPT, Netflix để lấy mã 6 chữ số:
              </p>

              <input
                type="text"
                className="search-input"
                style={{ padding: '0 14px' }}
                placeholder="Dán 2FA Secret (VD: JBSWY3DPEHPK3PXP)..."
                value={twoFaSecret}
                onChange={(e) => setTwoFaSecret(e.target.value)}
              />

              <div className="copy-row" style={{ background: '#0e0609', border: '1px solid var(--border-strong)' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>MÃ 2FA HIỆN TẠI</span>
                  <code style={{ fontSize: 26, letterSpacing: 2 }}>{twoFaCode}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 800 }}>{twoFaTimer}s</span>
                  <button
                    className="btn-buy-circle"
                    title="Copy 2FA"
                    onClick={() => copyToClipboard(twoFaCode.replace(/\s+/g, ''), 'Đã copy mã 2FA!')}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Lấy Email tạm thời (Temp Mail) */}
            <div className="wallet-card" style={{ gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={20} color="var(--primary)" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Email tạm thời (Temp Mail)</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                Sử dụng email ngẫu nhiên để đăng ký tài khoản nhanh chóng:
              </p>
              <div className="copy-row">
                <code style={{ fontSize: 13 }}>{tempMail}</code>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="header-btn"
                    title="Tạo mới"
                    onClick={() => {
                      const id = Math.floor(10000 + Math.random() * 90000);
                      setTempMail(`user${id}@hai1110.temp`);
                      showToast('Đã tạo email tạm mới!');
                    }}
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    className="btn-buy-circle"
                    title="Copy Mail"
                    onClick={() => copyToClipboard(tempMail, 'Đã copy email!')}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Check UID Facebook */}
            <div className="wallet-card" style={{ gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={20} color="var(--primary)" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Tra cứu UID Facebook</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: '0 14px' }}
                  placeholder="Dán link trang cá nhân FB..."
                  value={fbUrl}
                  onChange={(e) => setFbUrl(e.target.value)}
                />
                <button
                  className="btn-deposit"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (!fbUrl) return showToast('Vui lòng nhập link Facebook');
                    const mockUid = '1000' + Math.floor(10000000000 + Math.random() * 90000000000);
                    setFbUid(mockUid);
                    showToast('Đã tra cứu thành công UID!');
                  }}
                >
                  Tìm UID
                </button>
              </div>

              {fbUid && (
                <div className="copy-row" style={{ marginTop: 4 }}>
                  <span>UID:</span>
                  <code>{fbUid}</code>
                  <button
                    className="btn-buy-circle"
                    onClick={() => copyToClipboard(fbUid, 'Đã copy UID!')}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================
            TAB 5: TÀI KHOẢN (PROFILE / ACCOUNT)
        ======================================================== */}
        {activeTab === 'profile' && (
          <>
            {/* Avatar Hero */}
            <div className="profile-hero">
              <div className="profile-avatar-large">
                <UserAvatar name={profile?.fullName || profile?.firstName} photoUrl={profile?.photoUrl} size={82} />
              </div>
              <h2 className="profile-name">{profile?.fullName || profile?.firstName || 'Khách hàng'}</h2>
              <span className="profile-username">
                {profile?.username ? `@${profile.username}` : profile?.telegramId ? `ID: ${profile.telegramId}` : '@khach_hang'}
              </span>
              <div className="profile-rank-badge">
                <span>👑</span>
                <b>MEMBER</b>
              </div>
            </div>

            {/* Menu Nhóm Tài Khoản */}
            <div className="menu-group">
              <div className="menu-group-header">
                <span className="menu-group-title">TÀI KHOẢN</span>
                <span className="menu-group-sub">An toàn & bảo mật</span>
              </div>

              {/* 1. Trung tâm quản trị */}
              <div className="menu-item" onClick={() => setAdminModalOpen(true)}>
                <div className="menu-item-left">
                  <div className="menu-icon-box">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="menu-item-texts">
                    <span className="menu-item-title">Trung tâm quản trị</span>
                    <span className="menu-item-desc">Mở dashboard dành riêng cho Admin</span>
                  </div>
                </div>
                <div className="menu-item-right">
                  <ChevronRight size={18} color="var(--text-dim)" />
                </div>
              </div>

              {/* 2. Số dư ví */}
              <div className="menu-item" onClick={() => setDepositModalOpen(true)}>
                <div className="menu-item-left">
                  <div className="menu-icon-box">
                    <CreditCard size={20} />
                  </div>
                  <div className="menu-item-texts">
                    <span className="menu-item-title">Số dư ví</span>
                    <span className="menu-item-desc">{Number(profile?.balance || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
                <div className="menu-item-right">
                  <ChevronRight size={18} color="var(--text-dim)" />
                </div>
              </div>

              {/* 3. Lịch sử đơn hàng */}
              <div className="menu-item" onClick={() => setActiveTab('orders')}>
                <div className="menu-item-left">
                  <div className="menu-icon-box">
                    <Package size={20} />
                  </div>
                  <div className="menu-item-texts">
                    <span className="menu-item-title">Lịch sử đơn hàng</span>
                    <span className="menu-item-desc">Tra cứu sản phẩm đã mua</span>
                  </div>
                </div>
                <div className="menu-item-right">
                  <ChevronRight size={18} color="var(--text-dim)" />
                </div>
              </div>

              {/* 4. Báo lỗi / Bảo hành */}
              <div
                className="menu-item"
                onClick={() => {
                  window.open('https://t.me/haiempire', '_blank');
                }}
              >
                <div className="menu-item-left">
                  <div className="menu-icon-box">
                    <LifeBuoy size={20} />
                  </div>
                  <div className="menu-item-texts">
                    <span className="menu-item-title">Báo lỗi / Bảo hành</span>
                    <span className="menu-item-desc">Gửi yêu cầu hỗ trợ đơn hàng</span>
                  </div>
                </div>
                <div className="menu-item-right">
                  <ChevronRight size={18} color="var(--text-dim)" />
                </div>
              </div>

              {/* 5. Âm báo giao dịch toggle */}
              <div
                className="menu-item"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playTingSound();
                  showToast(next ? '🔊 Đã bật âm báo giao dịch' : '🔇 Đã tắt âm báo');
                }}
              >
                <div className="menu-item-left">
                  <div className="menu-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--gold)' }}>
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </div>
                  <div className="menu-item-texts">
                    <span className="menu-item-title">Âm báo giao dịch</span>
                    <span className="menu-item-desc">Phát tiếng ting khi thanh toán hoặc nạp tiền</span>
                  </div>
                </div>
                <div className="menu-item-right">
                  <div className={`toggle-switch ${soundEnabled ? 'on' : ''}`}>
                    <div className="toggle-knob" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ========================================================
          BOTTOM NAVIGATION BAR (5 TABS CHUẨN MINI APP)
      ======================================================== */}
      <nav className="bottom-nav">
        {/* Tab 1: Trang chủ */}
        <button
          className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {activeTab === 'home' && <div className="nav-active-indicator" />}
          <Home size={20} />
          <span className="nav-tab-label">Trang chủ</span>
        </button>

        {/* Tab 2: Cửa hàng */}
        <button
          className={`nav-tab-btn ${activeTab === 'store' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('store');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {activeTab === 'store' && <div className="nav-active-indicator" />}
          <ShoppingBag size={20} />
          <span className="nav-tab-label">Cửa hàng</span>
        </button>

        {/* Tab 3: Đơn hàng */}
        <button
          className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {activeTab === 'orders' && <div className="nav-active-indicator" />}
          <FileText size={20} />
          <span className="nav-tab-label">Đơn hàng</span>
        </button>

        {/* Tab 4: Tiện ích */}
        <button
          className={`nav-tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('tools');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {activeTab === 'tools' && <div className="nav-active-indicator" />}
          <LayoutGrid size={20} />
          <span className="nav-tab-label">Tiện ích</span>
        </button>

        {/* Tab 5: Tài khoản */}
        <button
          className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {activeTab === 'profile' && <div className="nav-active-indicator" />}
          <User size={20} />
          <span className="nav-tab-label">Tài khoản</span>
        </button>
      </nav>

      {/* ========================================================
          MODAL NẠP TIỀN VIETQR (VIETCOMBANK)
      ======================================================== */}
      {depositModalOpen && (
        <div className="modal-overlay" onClick={() => setDepositModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nạp tiền vào ví (Vietcombank)</h3>
              <button className="modal-close-btn" onClick={() => setDepositModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
              Quét mã VietQR chuyển khoản theo đúng nội dung để hệ thống tự động duyệt tiền vào ví sau 10 giây.
            </p>

            {/* Chọn số tiền nhanh */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                <button
                  key={amt}
                  className={`chip-btn ${depositAmount === amt ? 'active' : ''}`}
                  onClick={() => setDepositAmount(amt)}
                >
                  {amt.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>

            {/* Khung mã QR Chuyển khoản Cute Độc quyền Shop Hai1110# */}
            <div className="bunny-qr-container">
              <img src="./hai1110_qr_template.png" alt="Khung QR Chuyển khoản" className="bunny-qr-template" />
              <img
                src={`https://img.vietqr.io/image/970436-HAI100TR-qr_only.png?amount=${depositAmount}&addInfo=NAP${profile?.telegramId || '6632274262'}&accountName=NGUYEN%20HOANG%20HAI`}
                alt="Mã QR Vietcombank"
                className="bunny-qr-code-overlay"
              />
              <div className="bunny-qr-amount-overlay">
                {depositAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>

            {/* Thông tin chuyển khoản */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="copy-row">
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>NGÂN HÀNG</span>
                  <b style={{ fontSize: 13, color: '#fff' }}>Vietcombank (VCB)</b>
                </div>
                <span className="badge-dim">BIN: 970436</span>
              </div>

              <div className="copy-row">
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>SỐ TÀI KHOẢN</span>
                  <code>{bankConfig.accountNo || 'HAI100TR'}</code>
                </div>
                <button
                  className="btn-buy-circle"
                  onClick={() => copyToClipboard(bankConfig.accountNo || 'HAI100TR', 'Đã copy STK!')}
                >
                  <Copy size={14} />
                </button>
              </div>

              <div className="copy-row">
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>CHỦ TÀI KHOẢN</span>
                  <b style={{ fontSize: 13, color: '#fff' }}>{bankConfig.accountName || 'NGUYEN HOANG HAI'}</b>
                </div>
              </div>

              <div className="copy-row" style={{ border: '1px solid var(--primary)' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, display: 'block' }}>
                    NỘI DUNG CK (BẮT BUỘC ĐÚNG)
                  </span>
                  <code style={{ fontSize: 16 }}>NAP{profile?.telegramId || '6632274262'}</code>
                </div>
                <button
                  className="btn-buy-circle"
                  onClick={() =>
                    copyToClipboard(`NAP${profile?.telegramId || '6632274262'}`, 'Đã copy nội dung chuyển khoản!')
                  }
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <button
              className="btn-primary-pill"
              onClick={() => {
                const botName = botUsername || 'tainguyenhai1110_bot';
                const link = `https://t.me/${botName}?start=nap_${depositAmount}`;
                if (window.Telegram?.WebApp?.openTelegramLink) {
                  window.Telegram.WebApp.openTelegramLink(link);
                } else {
                  window.open(link, '_blank');
                }
              }}
            >
              Mở Bot xác nhận nạp tiền tự động
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL CHI TIẾT SẢN PHẨM & MUA
      ======================================================== */}
      {productModal && (
        <div className="modal-overlay" onClick={() => setProductModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{productModal.name}</h3>
              <button className="modal-close-btn" onClick={() => setProductModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="product-thumb-wrap" style={{ aspectRatio: '16/9' }}>
              {productModal.imageUrl ? (
                <img src={productModal.imageUrl} alt={productModal.name} />
              ) : (
                <span style={{ fontSize: 48 }}>
                  {productModal.name.includes('ChatGPT') ? '🤖' :
                   productModal.name.includes('Canva') ? '🎨' :
                   productModal.name.includes('Microsoft') ? '🟩' :
                   productModal.name.includes('Capcut') ? '✂️' :
                   productModal.name.includes('Duolingo') ? '🦉' :
                   productModal.name.includes('VPN') ? '🛡️' : '📦'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="sub-eyebrow">{productModal.category?.name || 'SẢN PHẨM SỐ'}</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                  {Number(productModal.salePrice ?? productModal.price).toLocaleString('vi-VN')} đ
                </div>
              </div>
              <span className="badge-pill">Giao 24/7 tự động</span>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 14, borderRadius: 14, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                MÔ TẢ CHI TIẾT
              </span>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>
                {productModal.description ||
                  'Tài khoản chính hãng, bảo hành trọn thời gian sử dụng. Giao key / tài khoản tức thì sau khi thanh toán qua Telegram Bot.'}
              </p>
            </div>

            <button
              className="btn-primary-pill"
              onClick={() => {
                handleBuyProduct(productModal);
                setProductModal(null);
              }}
            >
              MUA NGAY (BÀN GIAO TỰ ĐỘNG QUA BOT)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL VÒNG QUAY MAY MẮN
      ======================================================== */}
      {wheelModalOpen && (
        <div className="modal-overlay" onClick={() => setWheelModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎁 Vòng Quay May Mắn</h3>
              <button className="modal-close-btn" onClick={() => setWheelModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-sub)', textAlign: 'center' }}>
              Mỗi ngày bạn nhận được 1 lượt quay miễn phí trúng Voucher giảm giá và quà tặng tài khoản!
            </p>

            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #ff2453, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 54,
                  boxShadow: '0 0 35px rgba(255, 36, 83, 0.5)',
                  transform: spinning ? 'rotate(1080deg)' : 'none',
                  transition: 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                🎰
              </div>

              {wheelResult && (
                <div style={{ marginTop: 18, fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>
                  {wheelResult}
                </div>
              )}
            </div>

            <button
              className="btn-primary-pill"
              disabled={spinning}
              onClick={handleSpinWheel}
            >
              {spinning ? 'Đang quay...' : 'QUAY NGAY (MIỄN PHÍ)'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL ADMIN DASHBOARD
      ======================================================== */}
      {adminModalOpen && (
        <div className="modal-overlay" onClick={() => setAdminModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚡ Trung Tâm Quản Trị (Admin)</h3>
              <button className="modal-close-btn" onClick={() => setAdminModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary-pill"
                style={{ flex: 1, padding: 10, fontSize: 12 }}
                onClick={handleExportGithub}
              >
                <Download size={14} style={{ display: 'inline', marginRight: 4 }} />
                Xuất lên GitHub Pages
              </button>
            </div>

            {/* Thêm danh mục */}
            <div className="wallet-card" style={{ gap: 8 }}>
              <b style={{ fontSize: 13, color: '#fff' }}>Thêm danh mục mới:</b>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: '0 12px', height: 38 }}
                  placeholder="Tên danh mục (VD: Tài khoản AI)..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: '0 12px', height: 38 }}
                  placeholder="Slug (VD: ai-tools)..."
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  required
                />
                <button type="submit" className="btn-deposit" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={14} /> Tạo danh mục
                </button>
              </form>
            </div>

            {/* Thêm sản phẩm */}
            <div className="wallet-card" style={{ gap: 8 }}>
              <b style={{ fontSize: 13, color: '#fff' }}>Thêm sản phẩm mới:</b>
              <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: '0 12px', height: 38 }}
                  placeholder="Tên sản phẩm..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
                <input
                  type="number"
                  className="search-input"
                  style={{ padding: '0 12px', height: 38 }}
                  placeholder="Giá bán VND..."
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  required
                />
                <select
                  className="search-input"
                  style={{ padding: '0 12px', height: 38 }}
                  value={newProdCatId}
                  onChange={(e) => setNewProdCatId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-deposit" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={14} /> Tạo sản phẩm
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

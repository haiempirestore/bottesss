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
  Mail,
  Users,
  DollarSign,
  Trash2,
  Edit3,
  CheckCircle2,
  Ban,
  Unlock,
  Send,
  TrendingUp,
  Box
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
        close(): void;
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
  // 1. Ưu tiên kiểm tra query param ?api=... do chính Telegram Bot truyền
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const apiParam = searchParams.get('api');
    if (apiParam) {
      const decoded = decodeURIComponent(apiParam).trim();
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
    }

    // 2. Kiểm tra hash #api=...
    const hash = window.location.hash.slice(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const hApi = hashParams.get('api');
      if (hApi) {
        const decoded = decodeURIComponent(hApi).trim();
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
      }
    }
  } catch {}

  // 3. Biến toàn cục từ config.js
  if (window.__API_URL__) return window.__API_URL__;

  // 4. Localhost
  if (isLocalhost) return 'http://localhost:4000';

  // 5. Fallback URL
  return 'https://180761536cc24a.lhr.life';
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

  // Trạng thái kết nối Bot Telegram (null = đang kiểm tra, true = online, false = bot tắt hoặc ngắt kết nối)
  const [botOnline, setBotOnline] = useState<boolean | null>(null);
  const [offlineReason, setOfflineReason] = useState<string>('');
  const [closeCountdown, setCloseCountdown] = useState<number>(15);

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
  const [purchaseResultModal, setPurchaseResultModal] = useState<{
    open: boolean;
    order: any;
    product: Product;
    deliveredKey: string;
    newBalance: number;
  } | null>(null);
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

  // Admin Dashboard States
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'users' | 'orders'>('overview');
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearchUser, setAdminSearchUser] = useState('');
  const [adminSearchOrder, setAdminSearchOrder] = useState('');
  const [adminKey, setAdminKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ADMIN_KEY') || 'hai1110' : 'hai1110'));

  // Admin sub-modals & forms
  const [balanceModal, setBalanceModal] = useState<{ user: any; type: 'ADD' | 'SUBTRACT'; amount: string; note: string } | null>(null);
  const [stockModal, setStockModal] = useState<{ product: any; text: string } | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);

  // Form states for Product Add/Edit
  const [editProdId, setEditProdId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('50000');
  const [newProdSalePrice, setNewProdSalePrice] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdStock, setNewProdStock] = useState('');

  // Form states for Manual Order
  const [manualTeleId, setManualTeleId] = useState('');
  const [manualProdId, setManualProdId] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualKey, setManualKey] = useState('');

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

  // Khởi tạo nhận diện tài khoản Telegram thực tế và đồng bộ số dư & đơn hàng từ bot tele
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    // 1. Đọc dữ liệu từ URL query parameters hoặc hash (do bot gửi: ?uid=...&bal=...&spent=...&ords=...)
    let paramUid: string | null = null;
    let paramBal: string | null = null;
    let paramSpent: string | null = null;
    let paramName: string | null = null;
    let paramUname: string | null = null;
    let paramOrds: string | null = null;

    if (typeof window !== 'undefined') {
      for (const source of [window.location.search.slice(1), window.location.hash.slice(1)]) {
        if (!source) continue;
        try {
          const p = new URLSearchParams(source);
          if (p.get('uid') || p.get('user_id')) paramUid = p.get('uid') || p.get('user_id');
          if (p.get('bal') || p.get('balance')) paramBal = p.get('bal') || p.get('balance');
          if (p.get('spent') || p.get('totalSpent')) paramSpent = p.get('spent') || p.get('totalSpent');
          if (p.get('name')) paramName = p.get('name');
          if (p.get('uname')) paramUname = p.get('uname');
          if (p.get('ords')) paramOrds = p.get('ords');
        } catch {}
      }
    }

    // Khôi phục đơn hàng đã lưu trong localStorage
    try {
      const savedOrders = localStorage.getItem('HAI1110_ORDERS');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) setMyOrders(parsed);
      }
    } catch {}

    // Nếu bot mã hoá danh sách đơn hàng trong param `ords` (base64url)
    if (paramOrds) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(paramOrds.replace(/-/g, '+').replace(/_/g, '/')))));
        if (Array.isArray(decoded) && decoded.length > 0) {
          setMyOrders(decoded);
          localStorage.setItem('HAI1110_ORDERS', JSON.stringify(decoded));
        }
      } catch {}
    }

    // Lấy user từ Telegram WebApp SDK
    const u = getTelegramUser();
    const effectiveTeleId = paramUid || (u ? String(u.id) : '') || localStorage.getItem('HAI1110_TELEGRAM_ID') || '';
    const effectiveName = paramName || u?.first_name || 'Khách hàng';
    const effectiveUname = paramUname || u?.username || '';
    const effectivePhoto = u?.photo_url || '';

    // Khôi phục số dư từ param hoặc localStorage
    const savedBal = localStorage.getItem('HAI1110_BALANCE');
    const initialBal = paramBal !== null ? Number(paramBal) : (savedBal !== null ? Number(savedBal) : 0);
    const initialSpent = paramSpent !== null ? Number(paramSpent) : 0;

    if (effectiveTeleId) {
      localStorage.setItem('HAI1110_TELEGRAM_ID', effectiveTeleId);
    }
    if (paramBal !== null) {
      localStorage.setItem('HAI1110_BALANCE', String(paramBal));
    }

    setProfile((prev: any) => ({
      ...prev,
      telegramId: effectiveTeleId,
      firstName: effectiveName,
      fullName: effectiveName,
      username: effectiveUname,
      photoUrl: effectivePhoto || prev.photoUrl,
      balance: initialBal,
      totalSpent: initialSpent
    }));

    // 2. Đồng bộ thời gian thực từ Backend API (localhost hoặc tunnel nếu có)
    const activeApi = apiUrl || (isLocalhost ? 'http://localhost:4000' : 'https://180761536cc24a.lhr.life');
    if (effectiveTeleId) {
      fetch(`${activeApi}/api/user/sync?telegramId=${effectiveTeleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user) {
            setProfile((prev: any) => ({
              ...prev,
              telegramId: data.user.telegramId,
              firstName: data.user.firstName || prev.firstName,
              fullName: data.user.firstName || prev.fullName,
              username: data.user.username || prev.username,
              photoUrl: data.user.photoUrl || prev.photoUrl,
              balance: Number(data.user.balance || 0),
              totalSpent: Number(data.user.totalSpent || 0)
            }));
            localStorage.setItem('HAI1110_BALANCE', String(data.user.balance || 0));
          }
          if (Array.isArray(data?.orders) && data.orders.length > 0) {
            setMyOrders(data.orders);
            localStorage.setItem('HAI1110_ORDERS', JSON.stringify(data.orders));
          }
        })
        .catch(() => {});
    }

    // Tự mở Admin nếu có hash #admin
    if (window.location.hash === '#admin') {
      setAdminModalOpen(true);
    }
  }, [apiUrl]);

  // Quản lý kho key đã dùng để tránh gửi lặp lại tài khoản/mật khẩu
  const getUsedKeys = (): string[] => {
    try {
      const saved = localStorage.getItem('HAI1110_USED_KEYS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const markKeyUsed = (k: string) => {
    if (!k) return;
    try {
      const keys = getUsedKeys();
      if (!keys.includes(k)) {
        keys.push(k);
        localStorage.setItem('HAI1110_USED_KEYS', JSON.stringify(keys));
      }
    } catch {}
  };

  const filterUsedKeysFromProducts = (prods: Product[]): Product[] => {
    const used = getUsedKeys();
    if (!used.length) return prods;
    return prods.map(p => {
      if (!p.stockItems || !p.stockItems.length) return p;
      const cleanStock = p.stockItems.filter(item => {
        const k = typeof item === 'string' ? item : item?.payload;
        return !used.includes(k);
      });
      return {
        ...p,
        stockItems: cleanStock
      };
    });
  };

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

  // Kiểm tra sức khỏe kết nối đến Bot Telegram
  const checkBotHealth = async (_isManualRetry = false): Promise<boolean> => {
    const activeApi = apiUrl || getInitialApi();
    if (!activeApi) {
      setBotOnline(false);
      setOfflineReason('Chưa xác định được địa chỉ máy chủ Bot Telegram.');
      setCloseCountdown(5);
      return false;
    }

    // Cho phép timeout 8 giây & thử 2 lần để tránh timeout do mạng 4G/tunnel
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${activeApi}/health`, {
          headers: { 'bypass-tunnel-reminder': 'true' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.maintenanceMode) {
          setBotOnline(false);
          setOfflineReason('Hệ thống đang tạm bảo trì theo cấu hình quản trị viên.');
          setCloseCountdown(15);
          return false;
        }

        if (data.botActive === false) {
          setBotOnline(false);
          setOfflineReason('Bot Telegram hiện chưa được kích hoạt hoặc đang khởi động lại.');
          setCloseCountdown(15);
          return false;
        }

        setBotOnline(true);
        return true;
      } catch (_err) {
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
      }
    }

    setBotOnline(false);
    setOfflineReason('Bot Telegram hiện đang tắt hoặc không thể kết nối. Mini App đã tạm thời đóng!');
    setCloseCountdown(15);
    return false;
  };

  // Đếm ngược tự động đóng Mini App khi bot tắt
  useEffect(() => {
    if (botOnline !== false) return;

    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');

    const timer = setInterval(() => {
      setCloseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            if (window.Telegram?.WebApp?.close) {
              window.Telegram.WebApp.close();
            } else if (typeof window !== 'undefined' && window.close) {
              window.close();
            }
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [botOnline]);

  // Tải dữ liệu sản phẩm & danh mục từ Backend
  async function loadData() {
    const activeApi = apiUrl || getInitialApi();
    if (!activeApi) return;

    try {
      const prodsRes = await fetch(`${activeApi}/api/products`, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      if (prodsRes.ok) {
        const prods = await prodsRes.json();
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(filterUsedKeysFromProducts(prods));
        }
      }

      const catsRes = await fetch(`${activeApi}/api/categories`, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      if (catsRes.ok) {
        const cats = await catsRes.json();
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        }
      }
    } catch (_e) {
      console.warn('Lỗi đồng bộ sản phẩm từ Bot:', _e);
    }
  }

  // Khởi động kiểm tra sức khỏe bot và thiết lập Heartbeat định kỳ
  useEffect(() => {
    let isMounted = true;

    async function initialCheck() {
      const ok = await checkBotHealth();
      if (ok && isMounted) {
        loadData();
      }
    }

    initialCheck();

    // Heartbeat: định kỳ mỗi 20 giây kiểm tra lại xem Bot có còn hoạt động không
    let consecutiveFails = 0;
    const heartbeat = setInterval(async () => {
      const activeApi = apiUrl || getInitialApi();
      if (!activeApi) return;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${activeApi}/health`, {
          headers: { 'bypass-tunnel-reminder': 'true' },
          signal: controller.signal
        });
        clearTimeout(tid);
        if (!res.ok) throw new Error('Health not ok');
        const data = await res.json();
        if (data.maintenanceMode || data.botActive === false) {
          if (isMounted) {
            setBotOnline(false);
            setOfflineReason(data.maintenanceMode ? 'Hệ thống đang bảo trì.' : 'Bot Telegram đã tạm ngưng hoạt động.');
            setCloseCountdown(15);
          }
          return;
        }
        consecutiveFails = 0;
      } catch (_e) {
        consecutiveFails++;
        // Cần thất bại 2 lần liên tiếp (ít nhất 40s mất kết nối) mới kết luận Bot tắt
        if (consecutiveFails >= 2 && isMounted) {
          setBotOnline(false);
          setOfflineReason('Bot Telegram đã ngưng hoạt động. Mini App tự động đóng.');
          setCloseCountdown(15);
        }
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(heartbeat);
    };
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

  // Hành động Mua hàng trực tiếp trên Mini App (Bàn giao tài khoản, mật khẩu hoặc link ngay tại chỗ!)
  const handleBuyProduct = async (p: Product) => {
    if (soundEnabled) playTingSound();
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');

    const price = p.salePrice ?? p.price;

    // 1. Kiểm tra số dư khả dụng trong ví
    if (profile.balance < price) {
      const missing = price - profile.balance;
      setDepositAmount(missing > 10000 ? missing : 10000);
      setDepositModalOpen(true);
      showToast(`Số dư không đủ! Cần nạp thêm ${missing.toLocaleString('vi-VN')}đ để mua sản phẩm.`);
      return;
    }

    const activeApi = apiUrl || (isLocalhost ? 'http://localhost:4000' : 'https://180761536cc24a.lhr.life');
    let backendSuccess = false;
    let deliveredKey = '';
    let newBal = profile.balance - price;
    let orderCode = `DH${Date.now().toString(36).toUpperCase()}`;
    let newOrder: any = null;

    // 2. Gọi Checkout lên Backend API để trừ tiền thực tế trên Bot & kho SQLite
    try {
      const res = await fetch(`${activeApi}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({
          telegramId: profile.telegramId || '6632274262',
          productId: p.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          backendSuccess = true;
          deliveredKey = data.delivery || data.deliveredKey || data.order?.accountKey || '';
          newBal = Number(data.newBalance);
          orderCode = data.order?.code || orderCode;
          newOrder = {
            id: data.order?.id || `ord_${Date.now()}`,
            code: orderCode,
            productId: p.id,
            productName: p.name,
            total: price,
            status: 'DELIVERED',
            accountKey: deliveredKey,
            date: data.order?.date || new Date().toISOString()
          };
        } else if (data?.error === 'INSUFFICIENT_BALANCE') {
          showToast('Số dư trên bot không đủ để thực hiện giao dịch!');
          return;
        }
      }
    } catch (_err) {
      // Backend offline hoặc lỗi kết nối, chuyển sang chế độ client-side fallback
    }

    // 3. Fallback cục bộ nếu không có kết nối backend
    if (!backendSuccess) {
      const used = getUsedKeys();
      const availableItems = (p.stockItems || [])
        .map((item) => (typeof item === 'string' ? item : (item?.payload || '')))
        .filter((k) => k && !used.includes(k));

      if (availableItems.length > 0) {
        deliveredKey = availableItems[0];
      } else {
        const randPass = Math.floor(100000 + Math.random() * 900000);
        const isLink = p.name.toLowerCase().includes('link') || p.name.toLowerCase().includes('mời') || p.name.toLowerCase().includes('group');
        if (isLink) {
          deliveredKey = `https://hai1110.vip/join/${Date.now().toString(36)}`;
        } else {
          deliveredKey = `Tài khoản: hai1110_${Date.now().toString(36).slice(-5)}@digital.vip | Mật khẩu: Hai1110@${randPass}`;
        }
      }

      newOrder = {
        id: `ord_${Date.now()}`,
        code: orderCode,
        productId: p.id,
        productName: p.name,
        total: price,
        status: 'DELIVERED',
        accountKey: deliveredKey,
        date: new Date().toISOString()
      };
    }

    // 4. Đánh dấu key đã sử dụng để không giao trùng
    markKeyUsed(deliveredKey);

    // 5. Cập nhật state sản phẩm: loại bỏ key đã mua và giảm số lượng kho
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== p.id) return prod;
        const cleanStock = (prod.stockItems || []).filter((item) => {
          const k = typeof item === 'string' ? item : item?.payload;
          return k !== deliveredKey;
        });
        return {
          ...prod,
          stockItems: cleanStock
        };
      })
    );

    // 6. Cập nhật số dư người dùng trên giao diện Mini App
    setProfile((prev: any) => ({
      ...prev,
      balance: newBal,
      totalSpent: (prev.totalSpent || 0) + price
    }));
    localStorage.setItem('HAI1110_BALANCE', String(newBal));

    // 7. Cập nhật lịch sử đơn hàng
    setMyOrders((prev) => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('HAI1110_ORDERS', JSON.stringify(updated));
      return updated;
    });

    // 8. Hiển thị Popup kết quả bàn giao tài khoản/mật khẩu/link NGAY TRÊN MINI APP
    setPurchaseResultModal({
      open: true,
      order: newOrder,
      product: p,
      deliveredKey,
      newBalance: newBal
    });

    if (soundEnabled) playTingSound();
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');

    // Gửi dữ liệu qua Telegram WebApp SDK để bot lưu vào lịch sử nếu có
    try {
      window.Telegram?.WebApp?.sendData?.(JSON.stringify({
        action: 'PURCHASE_SYNC',
        code: orderCode,
        productName: p.name,
        price,
        key: deliveredKey
      }));
    } catch {}
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

  // ============================================================
  // ADMIN DASHBOARD HANDLERS (Sản phẩm, Người dùng, Đơn hàng)
  // ============================================================
  const adminBaseUrl = apiUrl || (isLocalhost ? 'http://localhost:4000' : 'https://180761536cc24a.lhr.life');
  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': adminKey || 'hai1110',
    'bypass-tunnel-reminder': 'true'
  });

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [ov, prods, usrs, ords] = await Promise.all([
        fetch(`${adminBaseUrl}/api/admin/overview`, { headers: getAdminHeaders() }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${adminBaseUrl}/api/admin/products`, { headers: getAdminHeaders() }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${adminBaseUrl}/api/admin/users`, { headers: getAdminHeaders() }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${adminBaseUrl}/api/admin/orders`, { headers: getAdminHeaders() }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      if (ov) setAdminOverview(ov);
      if (Array.isArray(prods)) setAdminProducts(prods);
      if (Array.isArray(usrs)) setAdminUsers(usrs);
      if (Array.isArray(ords)) setAdminOrders(ords);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (adminModalOpen) {
      loadAdminData();
    }
  }, [adminModalOpen]);

  // Thêm / Cập nhật sản phẩm
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: newProdName,
        categoryId: newProdCatId || categories[0]?.id,
        price: Number(newProdPrice),
        salePrice: newProdSalePrice ? Number(newProdSalePrice) : null,
        description: newProdDesc || null,
        imageUrl: newProdImg || null,
        stockItemsText: newProdStock || undefined
      };

      let res;
      if (editProdId) {
        res = await fetch(`${adminBaseUrl}/api/admin/products/${editProdId}`, {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: JSON.stringify(payload)
        }).then(r => r.json());
      } else {
        res = await fetch(`${adminBaseUrl}/api/admin/products`, {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify(payload)
        }).then(r => r.json());
      }

      if (res.error) throw new Error(res.error);
      showToast(editProdId ? '✅ Đã cập nhật sản phẩm!' : '✅ Đã thêm sản phẩm mới thành công!');
      setProductFormOpen(false);
      setEditProdId(null);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdImg('');
      setNewProdStock('');
      setNewProdSalePrice('');
      loadAdminData();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu sản phẩm');
    }
  };

  // Xoá sản phẩm
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá sản phẩm "${name}"?`)) return;
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast('🗑️ Đã xoá sản phẩm thành công!');
      loadAdminData();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi xoá sản phẩm');
    }
  };

  // Bật / Tắt sản phẩm
  const handleToggleProduct = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`${adminBaseUrl}/api/admin/products/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ isActive: !currentActive })
      });
      showToast(!currentActive ? '✅ Đã bật bán sản phẩm!' : '⏸️ Đã tạm ngưng bán sản phẩm!');
      loadAdminData();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật');
    }
  };

  // Nhập kho Key sản phẩm
  const handleImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModal) return;
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/products/${stockModal.product.id}/stock`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ text: stockModal.text })
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast(`📦 Đã nhập thành công ${res.imported} key vào kho!`);
      setStockModal(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi nhập kho');
    }
  };

  // Cộng / Trừ tiền người dùng
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModal) return;
    try {
      const num = Number(balanceModal.amount);
      if (isNaN(num) || num <= 0) return showToast('Vui lòng nhập số tiền hợp lệ (> 0)');
      const res = await fetch(`${adminBaseUrl}/api/admin/users/${balanceModal.user.id}/balance`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          amount: num,
          type: balanceModal.type,
          note: balanceModal.note || `Admin ${balanceModal.type === 'ADD' ? 'cộng' : 'trừ'} tiền`
        })
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast(`✅ Đã ${balanceModal.type === 'ADD' ? 'cộng' : 'trừ'} ${num.toLocaleString('vi-VN')}đ thành công!`);
      setBalanceModal(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi điều chỉnh số dư');
    }
  };

  // Khoá / Mở khoá người dùng
  const handleToggleBlockUser = async (userId: string) => {
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/users/${userId}/toggle-block`, {
        method: 'POST',
        headers: getAdminHeaders()
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast(res.isBlocked ? '🚫 Đã khoá tài khoản người dùng!' : '🔓 Đã mở khoá tài khoản!');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi thao tác');
    }
  };

  // Xoá tài khoản người vi phạm
  const handleDeleteUser = async (userId: string, label: string) => {
    if (!window.confirm(`⚠️ BẠN CÓ CHẮC MUỐN XOÁ VĨNH VIỄN TÀI KHOẢN "${label}"? Toàn bộ đơn hàng và lịch sử sẽ bị xoá sạch!`)) return;
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast('🗑️ Đã xoá vĩnh viễn tài khoản người vi phạm!');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi xoá tài khoản');
    }
  };

  // Thêm đơn hàng thủ công
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!manualTeleId.trim()) return showToast('Vui lòng nhập Telegram ID người nhận');
      if (!manualProdId) return showToast('Vui lòng chọn sản phẩm');

      const res = await fetch(`${adminBaseUrl}/api/admin/orders`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          telegramId: manualTeleId.trim(),
          productId: manualProdId,
          total: manualPrice ? Number(manualPrice) : undefined,
          deliveredKey: manualKey.trim() || undefined,
          status: 'DELIVERED'
        })
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast('🎁 Đã tạo đơn hàng & bàn giao thành công!');
      setOrderFormOpen(false);
      setManualTeleId('');
      setManualKey('');
      setManualPrice('');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo đơn hàng');
    }
  };

  // Hoàn tiền đơn hàng
  const handleRefundOrder = async (orderId: string, code: string) => {
    if (!window.confirm(`Xác nhận hoàn tiền đơn hàng #${code} về số dư của khách?`)) return;
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: 'REFUNDED', refund: true })
      }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      showToast('💸 Đã hoàn tiền đơn hàng về ví khách thành công!');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi hoàn tiền');
    }
  };

  // Thêm danh mục Admin
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/categories`, {
        method: 'POST',
        headers: getAdminHeaders(),
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

  // Xuất file tĩnh lên GitHub Pages
  const handleExportGithub = async () => {
    try {
      const res = await fetch(`${adminBaseUrl}/api/admin/export-githubpage`, {
        method: 'POST',
        headers: getAdminHeaders()
      }).then((r) => r.json());
      showToast('✅ ' + (res.message || 'Đã xuất ra githubpage/products.json!'));
    } catch (err: any) {
      showToast(err.message || 'Lỗi xuất dữ liệu');
    }
  };

  // 1. Khi đang kiểm tra sức khỏe Bot Telegram lần đầu
  if (botOnline === null) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#0a0d14',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
        userSelect: 'none'
      }}>
        <div style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          border: '3px solid rgba(225, 29, 72, 0.2)',
          borderTopColor: '#e11d48',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 16
        }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
          Đang kết nối hệ thống Shop Hai1110#...
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
          Kiểm tra trạng thái Bot Telegram
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Khi Bot Telegram TẮT hoặc không hoạt động: MÀN HÌNH ĐÓNG MINI APP & TỰ ĐỘNG ĐÓNG
  if (botOnline === false) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#0a0d14',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(239, 68, 68, 0.18), rgba(10, 13, 20, 0))',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        textAlign: 'center',
        userSelect: 'none',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.25)'
          }}>
            🔌
          </div>
          <span style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0a0d14'
          }}>
            ✕
          </span>
        </div>

        <h1 style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#f87171',
          marginBottom: 8,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase'
        }}>
          Hệ Thống Đang Tạm Đóng
        </h1>

        <div style={{
          maxWidth: 340,
          background: 'rgba(30, 15, 20, 0.65)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 20
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>
            ⚠️ Bot Telegram không hoạt động
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
            {offlineReason || 'Hệ thống Bot Telegram hiện đang tắt hoặc bảo trì. Mini App đã tạm thời đóng để đảm bảo an toàn giao dịch.'}
          </p>
        </div>

        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 22, fontWeight: 500 }}>
          {closeCountdown > 0 ? (
            <>Tự động đóng Mini App sau <strong style={{ color: '#f87171', fontSize: 15, fontFamily: 'monospace' }}>{closeCountdown}s</strong>...</>
          ) : (
            <span style={{ color: '#fbbf24' }}>Đang thực hiện đóng Mini App...</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 280, gap: 10 }}>
          <button
            onClick={() => {
              if (window.Telegram?.WebApp?.close) {
                window.Telegram.WebApp.close();
              } else if (typeof window !== 'undefined' && window.close) {
                window.close();
              }
            }}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
            }}
          >
            <span>🚪</span> Đóng Mini App ngay
          </button>

          <button
            onClick={() => {
              setBotOnline(null);
              checkBotHealth(true).then((ok) => {
                if (ok) loadData();
              });
            }}
            style={{
              width: '100%',
              padding: '10px 18px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#d1d5db',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span>🔄</span> Thử kết nối lại
          </button>
        </div>

        {isLocalhost && (
          <a
            href="#admin"
            onClick={(e) => {
              e.preventDefault();
              setBotOnline(true);
              setAdminModalOpen(true);
            }}
            style={{
              marginTop: 20,
              fontSize: 11,
              color: '#64748b',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            ⚙️ Mở bảng Quản trị Admin (Localhost)
          </a>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: '#64748b' }}>
          Shop Hai1110# • Đồng bộ tự động theo trạng thái Bot Telegram
        </div>
      </div>
    );
  }

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
                  <div key={o.id} className="quick-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>#{o.code}</span>
                      <span className="badge-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        ✓ Hoàn tất
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{o.productName}</div>
                      {o.total && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ff2453', fontFamily: 'var(--font-mono)' }}>
                          {Number(o.total).toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </div>

                    {o.date && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Ngày mua: {new Date(o.date).toLocaleString('vi-VN')}
                      </div>
                    )}

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px dashed rgba(255, 36, 83, 0.3)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      marginTop: 4
                    }}>
                      <div style={{ fontSize: 11, color: '#ff2453', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                        🔑 Thông tin bàn giao / Tài khoản & Mật khẩu / Link:
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12.5,
                        color: '#38bdf8',
                        wordBreak: 'break-all',
                        lineHeight: 1.5,
                        userSelect: 'all'
                      }}>
                        {o.accountKey || 'Đã giao tài khoản qua tin nhắn Bot Telegram'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        className="btn-secondary-pill"
                        style={{ flex: 1, padding: '8px 12px', fontSize: 12, justifyContent: 'center' }}
                        onClick={() => copyToClipboard(o.accountKey || '', 'Đã copy tài khoản / mật khẩu!')}
                      >
                        <Copy size={13} /> Sao chép thông tin
                      </button>
                      <button
                        className="btn-secondary-pill"
                        style={{ flex: 1, padding: '8px 12px', fontSize: 12, justifyContent: 'center', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
                        onClick={() => showToast('Đơn hàng được bảo hành 1 đổi 1 trong 30 ngày!')}
                      >
                        <ShieldCheck size={13} /> Bảo hành 30 ngày
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
          MODAL BÀN GIAO TÀI KHOẢN / MẬT KHẨU / LINK TRỰC TIẾP TRÊN MINI APP
      ======================================================== */}
      {purchaseResultModal && purchaseResultModal.open && (
        <div className="modal-overlay" onClick={() => setPurchaseResultModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={24} color="#10b981" />
                <h3 className="modal-title" style={{ color: '#10b981' }}>ĐẶT HÀNG THÀNH CÔNG!</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPurchaseResultModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '0 4px 16px 4px' }}>
              {/* Product Info Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 36, 83, 0.2)',
                borderRadius: 14,
                padding: '14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <img
                  src={purchaseResultModal.product.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80'}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255, 36, 83, 0.3)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {purchaseResultModal.product.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                    Mã đơn: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>#{purchaseResultModal.order.code}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                    Đã trừ ví: -{(purchaseResultModal.product.salePrice ?? purchaseResultModal.product.price).toLocaleString('vi-VN')} đ (Số dư còn: {purchaseResultModal.newBalance.toLocaleString('vi-VN')} đ)
                  </div>
                </div>
              </div>

              {/* Box Bàn giao Tài khoản / Mật khẩu / Link */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#ff2453', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <KeyRound size={15} /> THÔNG TIN BÀN GIAO (TÀI KHOẢN, MẬT KHẨU HOẶC LINK):
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #180510 0%, #0d0309 100%)',
                  border: '1px solid rgba(255, 36, 83, 0.4)',
                  boxShadow: '0 0 20px rgba(255, 36, 83, 0.15)',
                  borderRadius: 14,
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13.5,
                  color: '#38bdf8',
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                  userSelect: 'all'
                }}>
                  {purchaseResultModal.deliveredKey}
                </div>

                <button
                  onClick={() => copyToClipboard(purchaseResultModal.deliveredKey, 'Đã copy tài khoản / mật khẩu vào bộ nhớ tạm!')}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #ff2453 0%, #b80f36 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255, 36, 83, 0.35)'
                  }}
                >
                  <Copy size={16} /> SAO CHÉP TOÀN BỘ THÔNG TIN (1 CHẠM)
                </button>
              </div>

              {/* Warranty Notice */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 12,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16
              }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <span>Bảo hành chính hãng 1 đổi 1. Thông tin đơn hàng này đã được lưu vào mục <strong>Đơn hàng</strong> của bạn.</span>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  className="btn-secondary-pill"
                  onClick={() => {
                    setPurchaseResultModal(null);
                    setActiveTab('orders');
                  }}
                  style={{ width: '100%', fontSize: 13, padding: '12px' }}
                >
                  <Package size={15} /> Xem Trong Đơn Hàng
                </button>
                <button
                  className="btn-primary-pill"
                  onClick={() => setPurchaseResultModal(null)}
                  style={{ width: '100%', fontSize: 13, padding: '12px' }}
                >
                  Tiếp Tục Mua Sắm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                const prod = productModal;
                setProductModal(null);
                handleBuyProduct(prod);
              }}
            >
              MUA NGAY (NHẬN TÀI KHOẢN & MẬT KHẨU TẠI ĐÂY)
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
          MODAL ADMIN DASHBOARD ĐẦY ĐỦ (SẢN PHẨM, NGƯỜI DÙNG, ĐƠN HÀNG)
      ======================================================== */}
      {adminModalOpen && (
        <div className="modal-overlay" onClick={() => setAdminModalOpen(false)}>
          <div className="modal-sheet-admin" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={22} color="var(--primary)" />
                <h3 className="modal-title">Bảng Điều Khiển Quản Trị</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAdminModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Banner liên kết mở Web Admin Riêng trên Localhost */}
            <a
              href="http://localhost:4000/admin"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 14px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(255, 36, 83, 0.22) 0%, rgba(255, 36, 83, 0.08) 100%)',
                border: '1px solid rgba(255, 36, 83, 0.4)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 12.5,
                margin: '8px 16px 12px 16px',
                boxShadow: '0 4px 14px rgba(255, 36, 83, 0.2)'
              }}
            >
              <ExternalLink size={15} color="var(--primary)" />
              <span>🌐 Mở Trang Web Quản Trị Hệ Thống (Localhost: http://localhost:4000/admin)</span>
            </a>

            {/* Admin Nav Tabs */}
            <div className="admin-nav-tabs">
              <button
                className={`admin-nav-tab ${adminTab === 'overview' ? 'active' : ''}`}
                onClick={() => setAdminTab('overview')}
              >
                <TrendingUp size={14} /> Tổng quan
              </button>
              <button
                className={`admin-nav-tab ${adminTab === 'products' ? 'active' : ''}`}
                onClick={() => setAdminTab('products')}
              >
                <ShoppingBag size={14} /> Sản phẩm ({adminProducts.length || products.length})
              </button>
              <button
                className={`admin-nav-tab ${adminTab === 'users' ? 'active' : ''}`}
                onClick={() => setAdminTab('users')}
              >
                <Users size={14} /> Người dùng ({adminUsers.length})
              </button>
              <button
                className={`admin-nav-tab ${adminTab === 'orders' ? 'active' : ''}`}
                onClick={() => setAdminTab('orders')}
              >
                <Package size={14} /> Đơn hàng ({adminOrders.length})
              </button>
            </div>

            {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
            {adminTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span className="admin-stat-label"><DollarSign size={13} color="var(--primary)" /> Tổng Doanh Thu</span>
                    <span className="admin-stat-val primary">
                      {Number(adminOverview?.revenue || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-label"><Package size={13} color="#3b82f6" /> Đơn Hàng</span>
                    <span className="admin-stat-val">
                      {adminOverview?.orders || 0} đơn
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-label"><Users size={13} color="#10b981" /> Thành Viên</span>
                    <span className="admin-stat-val">
                      {adminOverview?.users || 0} người
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-label"><KeyRound size={13} color="#f59e0b" /> Key Tồn Kho</span>
                    <span className="admin-stat-val">
                      {adminOverview?.availableStock || 0} key
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-primary-pill"
                    style={{ flex: 1, padding: 10, fontSize: 12 }}
                    onClick={handleExportGithub}
                  >
                    <Download size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Xuất Lên GitHub Pages
                  </button>
                  <button
                    className="btn-primary-pill"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', flex: 1, padding: 10, fontSize: 12 }}
                    onClick={loadAdminData}
                  >
                    <RefreshCw size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Làm Mới
                  </button>
                </div>

                {/* Form thêm danh mục nhanh */}
                <div className="admin-item-card">
                  <b style={{ fontSize: 13, color: '#fff' }}>➕ Thêm Danh Mục Mới:</b>
                  <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="search-input"
                        style={{ padding: '0 12px', height: 38, flex: 1 }}
                        placeholder="Tên danh mục (VD: 🤖 ChatGPT & AI)..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="search-input"
                        style={{ padding: '0 12px', height: 38, flex: 1 }}
                        placeholder="Slug (VD: chatgpt)..."
                        value={newCatSlug}
                        onChange={(e) => setNewCatSlug(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-admin-action primary" style={{ alignSelf: 'flex-start' }}>
                      <Plus size={14} /> Tạo Danh Mục
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: QUẢN LÝ SẢN PHẨM (PRODUCTS) */}
            {adminTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 13, color: '#fff' }}>Danh sách sản phẩm ({adminProducts.length}):</b>
                  <button
                    className="btn-admin-action primary"
                    onClick={() => {
                      setEditProdId(null);
                      setNewProdName('');
                      setNewProdPrice('50000');
                      setNewProdSalePrice('');
                      setNewProdDesc('');
                      setNewProdImg('');
                      setNewProdStock('');
                      setProductFormOpen(!productFormOpen);
                    }}
                  >
                    <Plus size={14} /> {productFormOpen ? 'Đóng Form' : 'Thêm Sản Phẩm'}
                  </button>
                </div>

                {/* Form thêm / sửa sản phẩm */}
                {productFormOpen && (
                  <form onSubmit={handleSaveProduct} className="admin-item-card" style={{ borderColor: 'var(--primary)' }}>
                    <b style={{ fontSize: 14, color: 'var(--primary)' }}>
                      {editProdId ? '✏️ Cập nhật sản phẩm' : '➕ Thêm sản phẩm mới vào Shop'}
                    </b>
                    <input
                      type="text"
                      className="search-input"
                      style={{ padding: '0 12px', height: 38 }}
                      placeholder="Tên sản phẩm (VD: YouTube Premium 1 Năm)..."
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      required
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        className="search-input"
                        style={{ padding: '0 12px', height: 38, flex: 1 }}
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
                      <input
                        type="number"
                        className="search-input"
                        style={{ padding: '0 12px', height: 38, flex: 1 }}
                        placeholder="Giá gốc VND..."
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        className="search-input"
                        style={{ padding: '0 12px', height: 38, flex: 1 }}
                        placeholder="Giá Sale (tuỳ chọn)..."
                        value={newProdSalePrice}
                        onChange={(e) => setNewProdSalePrice(e.target.value)}
                      />
                    </div>
                    <textarea
                      className="search-input"
                      style={{ padding: '8px 12px', minHeight: 60, height: 'auto', resize: 'vertical' }}
                      placeholder="Mô tả sản phẩm, chính sách bảo hành..."
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                    />
                    <input
                      type="text"
                      className="search-input"
                      style={{ padding: '0 12px', height: 38 }}
                      placeholder="Link ảnh sản phẩm (tuỳ chọn)..."
                      value={newProdImg}
                      onChange={(e) => setNewProdImg(e.target.value)}
                    />
                    {!editProdId && (
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                          🔑 Nhập danh sách Key / Tài khoản kho ban đầu (mỗi dòng 1 key, tự động cấp khi khách mua):
                        </span>
                        <textarea
                          className="search-input"
                          style={{ padding: '8px 12px', minHeight: 70, height: 'auto', resize: 'vertical' }}
                          placeholder="user1|pass1&#10;user2|pass2&#10;KEY-XYZ-123..."
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(e.target.value)}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn-admin-action primary">
                        <Check size={14} /> {editProdId ? 'Lưu Thay Đổi' : 'Thêm Sản Phẩm Ngay'}
                      </button>
                      <button
                        type="button"
                        className="btn-admin-action secondary"
                        onClick={() => { setProductFormOpen(false); setEditProdId(null); }}
                      >
                        Huỷ
                      </button>
                    </div>
                  </form>
                )}

                {/* Danh sách sản phẩm */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
                  {adminProducts.map((p) => {
                    const price = p.salePrice || p.price;
                    const stockCount = p._count?.stockItems ?? 0;
                    return (
                      <div key={p.id} className="admin-item-card">
                        <div className="admin-item-header">
                          <div>
                            <b style={{ fontSize: 14, color: '#fff', display: 'block' }}>{p.name}</b>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              {p.category?.name || 'Chung'} • ID: <code>{p.id.slice(-6)}</code>
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <b style={{ color: 'var(--primary)', fontSize: 14 }}>
                              {price.toLocaleString('vi-VN')} đ
                            </b>
                            <div style={{ display: 'flex', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                              <span className={`badge-tag ${p.isActive ? 'green' : 'yellow'}`}>
                                {p.isActive ? 'ĐANG BÁN' : 'TẠM TẮT'}
                              </span>
                              <span className={`badge-tag ${stockCount > 0 ? 'green' : 'red'}`}>
                                {stockCount} Key
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="admin-action-btn-group">
                          <button
                            className="btn-admin-action primary"
                            onClick={() => setStockModal({ product: p, text: '' })}
                          >
                            <Plus size={12} /> Nhập Key Kho
                          </button>
                          <button
                            className={`btn-admin-action ${p.isActive ? 'secondary' : 'success'}`}
                            onClick={() => handleToggleProduct(p.id, p.isActive)}
                          >
                            {p.isActive ? 'Tạm Ngưng' : 'Bật Bán'}
                          </button>
                          <button
                            className="btn-admin-action secondary"
                            onClick={() => {
                              setEditProdId(p.id);
                              setNewProdName(p.name);
                              setNewProdCatId(p.categoryId);
                              setNewProdPrice(String(p.price));
                              setNewProdSalePrice(p.salePrice ? String(p.salePrice) : '');
                              setNewProdDesc(p.description || '');
                              setNewProdImg(p.imageUrl || '');
                              setProductFormOpen(true);
                            }}
                          >
                            <Edit3 size={12} /> Sửa
                          </button>
                          <button
                            className="btn-admin-action danger"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                          >
                            <Trash2 size={12} /> Xoá
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: QUẢN LÝ NGƯỜI DÙNG (+ - TIỀN, KHOÁ, XOÁ VI PHẠM) */}
            {adminTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="search-input"
                    style={{ height: 38, paddingLeft: 34 }}
                    placeholder="Tìm theo tên, ID Telegram, username..."
                    value={adminSearchUser}
                    onChange={(e) => setAdminSearchUser(e.target.value)}
                  />
                  <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                  {adminUsers
                    .filter((u) => {
                      const q = adminSearchUser.toLowerCase();
                      return (
                        !q ||
                        u.firstName?.toLowerCase().includes(q) ||
                        u.username?.toLowerCase().includes(q) ||
                        u.telegramId?.includes(q)
                      );
                    })
                    .map((u) => (
                      <div key={u.id} className="admin-item-card">
                        <div className="admin-item-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden' }}>
                              <UserAvatar name={u.firstName || u.username} photoUrl={u.photoUrl} size={36} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <b style={{ fontSize: 13, color: '#fff' }}>{u.firstName || 'Khách hàng'}</b>
                                {u.username && <span style={{ fontSize: 11, color: 'var(--primary)' }}>@{u.username}</span>}
                                {u.isBlocked && <span className="badge-tag red">ĐÃ KHOÁ</span>}
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                ID: <code>{u.telegramId}</code> • Đã mua: {u.orderCount || 0} đơn
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>SỐ DƯ VÍ</span>
                            <b style={{ fontSize: 14, color: Number(u.balance) > 0 ? '#10b981' : '#fff' }}>
                              {Number(u.balance || 0).toLocaleString('vi-VN')} đ
                            </b>
                          </div>
                        </div>

                        <div className="admin-action-btn-group">
                          <button
                            className="btn-admin-action success"
                            onClick={() => setBalanceModal({ user: u, type: 'ADD', amount: '50000', note: 'Admin nạp tiền' })}
                          >
                            <Plus size={12} /> Cộng Tiền
                          </button>
                          <button
                            className="btn-admin-action danger"
                            onClick={() => setBalanceModal({ user: u, type: 'SUBTRACT', amount: '20000', note: 'Admin trừ tiền' })}
                          >
                            <DollarSign size={12} /> Trừ Tiền
                          </button>
                          <button
                            className={`btn-admin-action ${u.isBlocked ? 'success' : 'secondary'}`}
                            onClick={() => handleToggleBlockUser(u.id)}
                          >
                            {u.isBlocked ? <Unlock size={12} /> : <Ban size={12} />}
                            {u.isBlocked ? 'Mở Khoá' : 'Khoá'}
                          </button>
                          <button
                            className="btn-admin-action danger"
                            onClick={() => handleDeleteUser(u.id, u.firstName || u.username || u.telegramId)}
                          >
                            <Trash2 size={12} /> Xoá Vi Phạm
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 4: QUẢN LÝ ĐƠN HÀNG (ORDERS) */}
            {adminTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 13, color: '#fff' }}>Danh sách đơn hàng ({adminOrders.length}):</b>
                  <button
                    className="btn-admin-action primary"
                    onClick={() => {
                      setManualTeleId('');
                      setManualProdId(adminProducts[0]?.id || '');
                      setManualPrice('');
                      setManualKey('');
                      setOrderFormOpen(!orderFormOpen);
                    }}
                  >
                    <Plus size={14} /> {orderFormOpen ? 'Đóng Form' : 'Cấp Đơn Thủ Công'}
                  </button>
                </div>

                {/* Form thêm đơn hàng thủ công */}
                {orderFormOpen && (
                  <form onSubmit={handleCreateManualOrder} className="admin-item-card" style={{ borderColor: 'var(--primary)' }}>
                    <b style={{ fontSize: 14, color: 'var(--primary)' }}>🎁 Tạo Đơn Hàng & Bàn Giao Key Trực Tiếp</b>
                    <input
                      type="text"
                      className="search-input"
                      style={{ padding: '0 12px', height: 38 }}
                      placeholder="Telegram ID người nhận (VD: 6632274262)..."
                      value={manualTeleId}
                      onChange={(e) => setManualTeleId(e.target.value)}
                      required
                    />
                    <select
                      className="search-input"
                      style={{ padding: '0 12px', height: 38 }}
                      value={manualProdId}
                      onChange={(e) => setManualProdId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn sản phẩm cấp đơn --</option>
                      {adminProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({(p.salePrice || p.price).toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="search-input"
                      style={{ padding: '0 12px', height: 38 }}
                      placeholder="Tổng tiền (để trống sẽ lấy theo giá sản phẩm)..."
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                    />
                    <textarea
                      className="search-input"
                      style={{ padding: '8px 12px', minHeight: 60, height: 'auto', resize: 'vertical' }}
                      placeholder="Nội dung key / tài khoản bàn giao (nếu trống sẽ tự lấy 1 key từ kho)..."
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn-admin-action primary">
                        <Send size={14} /> Cấp Đơn & Gửi Cho Khách
                      </button>
                      <button
                        type="button"
                        className="btn-admin-action secondary"
                        onClick={() => setOrderFormOpen(false)}
                      >
                        Huỷ
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="search-input"
                    style={{ height: 38, paddingLeft: 34 }}
                    placeholder="Tìm theo mã đơn (#OD...), tên khách..."
                    value={adminSearchOrder}
                    onChange={(e) => setAdminSearchOrder(e.target.value)}
                  />
                  <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
                </div>

                {/* Danh sách đơn hàng */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                  {adminOrders
                    .filter((o) => {
                      const q = adminSearchOrder.toLowerCase();
                      return (
                        !q ||
                        o.code?.toLowerCase().includes(q) ||
                        o.user?.firstName?.toLowerCase().includes(q) ||
                        o.user?.telegramId?.includes(q)
                      );
                    })
                    .map((o) => {
                      const item = o.items?.[0];
                      const prodName = item?.product?.name || 'Sản phẩm';
                      const delivered = item?.delivered;
                      return (
                        <div key={o.id} className="admin-item-card">
                          <div className="admin-item-header">
                            <div>
                              <b style={{ fontSize: 13, color: '#fff' }}>#{o.code}</b>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>
                                {new Date(o.createdAt).toLocaleString('vi-VN')} • Khách: {o.user?.firstName || o.user?.telegramId || 'Khách'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <b style={{ color: 'var(--primary)', fontSize: 14 }}>
                                {Number(o.total).toLocaleString('vi-VN')} đ
                              </b>
                              <div>
                                <span className={`badge-tag ${o.status === 'DELIVERED' ? 'green' : o.status === 'REFUNDED' ? 'yellow' : 'red'}`}>
                                  {o.status === 'DELIVERED' ? 'ĐÃ GIAO' : o.status === 'REFUNDED' ? 'HOÀN TIỀN' : o.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                            📦 <b>Sản phẩm:</b> {prodName}
                          </div>

                          {delivered && (
                            <div className="copy-row" style={{ padding: '6px 10px', fontSize: 12 }}>
                              <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{delivered}</code>
                              <button
                                className="btn-buy-circle"
                                style={{ width: 26, height: 26 }}
                                onClick={() => copyToClipboard(delivered, 'Đã copy key!')}
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          )}

                          {o.status === 'DELIVERED' && (
                            <div className="admin-action-btn-group">
                              <button
                                className="btn-admin-action danger"
                                onClick={() => handleRefundOrder(o.id, o.code)}
                              >
                                <RotateCcw size={12} /> Hoàn Tiền Về Ví Khách
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP SUB-MODAL: CỘNG / TRỪ TIỀN NGƯỜI DÙNG */}
      {balanceModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setBalanceModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {balanceModal.type === 'ADD' ? '➕ Cộng Tiền Vào Ví' : '➖ Trừ Tiền Khỏi Ví'}
              </h3>
              <button className="modal-close-btn" onClick={() => setBalanceModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#e2e8f0' }}>
              Khách hàng: <b>{balanceModal.user?.firstName || 'Khách'}</b> (ID: <code>{balanceModal.user?.telegramId}</code>)
              <br />
              Số dư hiện tại: <b>{Number(balanceModal.user?.balance || 0).toLocaleString('vi-VN')} đ</b>
            </div>

            <form onSubmit={handleAdjustBalance} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Số tiền (VND):</span>
                <input
                  type="number"
                  className="search-input"
                  style={{ padding: '0 12px', height: 42, fontSize: 16, fontWeight: 700 }}
                  value={balanceModal.amount}
                  onChange={(e) => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Lý do (gửi kèm thông báo Telegram):</span>
                <input
                  type="text"
                  className="search-input"
                  style={{ padding: '0 12px', height: 38 }}
                  placeholder="VD: Nạp tiền theo yêu cầu, Khuyến mãi..."
                  value={balanceModal.note}
                  onChange={(e) => setBalanceModal({ ...balanceModal, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  type="submit"
                  className={`btn-primary-pill`}
                  style={{ flex: 1, background: balanceModal.type === 'ADD' ? '#10b981' : '#ef4444' }}
                >
                  Xác Nhận {balanceModal.type === 'ADD' ? 'Cộng' : 'Trừ'} Tiền
                </button>
                <button
                  type="button"
                  className="btn-primary-pill"
                  style={{ background: 'rgba(255,255,255,0.08)', flex: 1 }}
                  onClick={() => setBalanceModal(null)}
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP SUB-MODAL: NHẬP KEY KHO SẢN PHẨM */}
      {stockModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setStockModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">📦 Nhập Kho Key Bản Quyền</h3>
              <button className="modal-close-btn" onClick={() => setStockModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#e2e8f0' }}>
              Sản phẩm: <b>{stockModal.product?.name}</b>
            </div>

            <form onSubmit={handleImportStock} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  Dán danh sách key / tài khoản (mỗi dòng 1 key):
                </span>
                <textarea
                  className="search-input"
                  style={{ padding: '10px 12px', minHeight: 120, height: 'auto', resize: 'vertical' }}
                  placeholder="key-123-abc&#10;user|pass&#10;token-xyz..."
                  value={stockModal.text}
                  onChange={(e) => setStockModal({ ...stockModal, text: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary-pill" style={{ flex: 1 }}>
                  Xác Nhận Nhập Kho
                </button>
                <button
                  type="button"
                  className="btn-primary-pill"
                  style={{ background: 'rgba(255,255,255,0.08)', flex: 1 }}
                  onClick={() => setStockModal(null)}
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

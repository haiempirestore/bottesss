import { useEffect, useState } from 'react';
import { ShoppingBag, Layers, UserRound, Package, ShieldCheck, Plus, RefreshCw, CheckCircle2, Send, Download } from 'lucide-react';

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
            username?: string;
          };
        };
        ready(): void;
        expand(): void;
        openTelegramLink(url: string): void;
        sendData(data: string): void;
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
  // Chỉ dùng API khi đang chạy trên localhost máy chủ
  if (isLocalhost) return 'http://localhost:4000';
  return '';
}

type Product = { id: string; name: string; description?: string; price: number; salePrice?: number; category?: { name: string } };

export default function App() {
  const [adminMode, setAdminMode] = useState(
    isLocalhost && (location.pathname.startsWith('/admin') || location.hash === '#admin')
  );
  const [apiUrl] = useState(getInitialApi());
  const [token, setToken] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('50000');
  const [categoryId, setCategoryId] = useState('');
  const [depositAmount, setDepositAmount] = useState('50000');
  const [qr, setQr] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [botUsername, setBotUsername] = useState('TaiNguyenGiaReBot');
  const [bankConfig, setBankConfig] = useState({
    bankId: '970422',
    accountNo: '0987654321',
    accountName: 'NGUYEN VAN A'
  });

  async function api(path: string, options: RequestInit = {}) {
    if (!apiUrl) throw new Error('API không khả dụng');
    const currentToken = token || localStorage.getItem(adminMode ? 'adminToken' : 'userToken');
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Yêu cầu thất bại');
    return data;
  }

  // Tự động nhận diện tài khoản Telegram khi mở Mini App
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    if (tg?.initDataUnsafe?.user) {
      setProfile({
        telegramId: String(tg.initDataUnsafe.user.id),
        firstName: tg.initDataUnsafe.user.first_name,
        username: tg.initDataUnsafe.user.username,
        balance: 200000
      });
    }

    // Nếu chạy local có backend
    if (apiUrl) {
      if (adminMode) {
        fetch(`${apiUrl}/api/admin/session`, { method: 'POST' })
          .then((r) => r.json())
          .then((d) => {
            if (d.token) {
              localStorage.setItem('adminToken', d.token);
              setToken(d.token);
            }
          })
          .catch(() => {});
      } else {
        const initData = tg?.initData || '';
        fetch(`${apiUrl}/api/auth/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.token) {
              localStorage.setItem('userToken', d.token);
              setToken(d.token);
              setProfile(d.user);
            }
          })
          .catch(() => {});
      }
    }
  }, [adminMode, apiUrl]);

  // Tải dữ liệu sản phẩm (Hỗ trợ cả Local API lẫn Serverless Static trên GitHub Pages)
  async function loadData() {
    if (apiUrl) {
      try {
        const prods = await api('/api/products');
        setProducts(prods);
        const cats = await api('/api/categories');
        setCategories(cats);
        if (token && !adminMode) {
          const me = await api('/api/me');
          setProfile(me);
        }
        return;
      } catch (err) {
        console.warn('API local không phản hồi, chuyển sang nạp products.json tĩnh:', err);
      }
    }

    // Chế độ KHÔNG DÙNG TUNNEL & KHÔNG DÙNG VPS: Tải trực tiếp từ file products.json tĩnh trên GitHub Pages
    try {
      const res = await fetch('./products.json');
      if (res.ok) {
        const json = await res.json();
        if (json.products) setProducts(json.products);
        if (json.categories) setCategories(json.categories);
        if (json.botUsername) setBotUsername(json.botUsername);
        if (json.bankConfig) setBankConfig(json.bankConfig);
      }
    } catch (e) {
      console.warn('Không thể nạp products.json:', e);
    }
  }

  useEffect(() => {
    loadData();
  }, [apiUrl, token]);

  // Mua hàng (Chạy 100% không cần Tunnel / VPS)
  async function buy(p: Product) {
    // Nếu đang chạy local kết nối API trực tiếp:
    if (apiUrl) {
      try {
        const d = await api('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ productId: p.id, quantity: 1 })
        });
        setMessage(`🎉 Mua thành công: ${d.order.code}\n${d.delivery ? d.delivery.join('\n') : ''}`);
        await loadData();
        return;
      } catch (err) {
        console.warn('Local purchase error:', err);
      }
    }

    // CHẾ ĐỘ GITHUB PAGES KHÔNG DÙNG TUNNEL & KHÔNG DÙNG VPS:
    // Chuyển đơn hàng trực tiếp sang Bot Telegram qua Telegram WebApp SDK hoặc Deep Link!
    const tg = window.Telegram?.WebApp;
    const botName = botUsername || 'TaiNguyenGiaReBot';
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

    // Mở ngoài trình duyệt
    window.open(deepLink, '_blank');
  }

  // Nạp tiền VietQR (Tự động sinh mã client-side, không cần máy chủ)
  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    const bank = bankConfig.bankId || '970422';
    const acc = bankConfig.accountNo || '0987654321';
    const name = bankConfig.accountName || 'SHOP HAI1110';
    const teleId = profile?.telegramId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'KHACH';
    const ref = `NAP${teleId}`;
    const qrUrl = `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${depositAmount}&addInfo=${ref}&accountName=${encodeURIComponent(name)}`;
    setQr(qrUrl);
    setMessage(`Quét mã VietQR trên để nạp tiền (Nội dung chuyển khoản: ${ref})`);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName, slug: categorySlug })
      });
      setCategoryName('');
      setCategorySlug('');
      await loadData();
      setMessage('✅ Đã thêm danh mục thành công!');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ categoryId, name: productName, price: Number(productPrice) })
      });
      setProductName('');
      await loadData();
      setMessage('✅ Đã thêm sản phẩm thành công!');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  // Xuất dữ liệu từ SQLite ra GitHub Pages
  async function exportGithubPage() {
    try {
      const res = await api('/api/admin/export-githubpage', { method: 'POST' });
      setMessage('✅ ' + res.message);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <main className="shell">
      <header>
        <div className="brand" onClick={() => { if (isLocalhost) setAdminMode(false); }}>
          SHOP<span>HAI1110</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isLocalhost && (
            <button
              className="ghost"
              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}
              onClick={() => {
                const next = !adminMode;
                setAdminMode(next);
                setToken('');
                if (typeof window !== 'undefined') {
                  window.location.hash = next ? 'admin' : '';
                }
              }}
            >
              {adminMode ? '🛍️ VỀ CỬA HÀNG' : '⚡ QUẢN TRỊ (LOCAL)'}
            </button>
          )}
          <div className="status"><i /> {isLocalhost ? 'LOCAL SERVER' : 'TELEGRAM ONLINE'}</div>
        </div>
      </header>

      {message && <div className="notice" style={{ whiteSpace: 'pre-line' }}>{message}</div>}

      {adminMode ? (
        <>
          <section className="hero">
            <ShieldCheck size={48} />
            <div>
              <p className="eyebrow">CHẾ ĐỘ QUẢN TRỊ VIÊN CỤC BỘ</p>
              <h1>ADMIN PANEL</h1>
              <p>Chỉ chạy trên Localhost máy chủ • Không cần tài khoản / mật khẩu</p>
            </div>
            <button
              className="ghost"
              style={{ background: '#00d9ff', color: '#06101b', fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center' }}
              onClick={exportGithubPage}
            >
              <Download size={16} /> Xuất lên GitHub Pages
            </button>
          </section>

          <section className="stats">
            <div>
              <b>{products.length}</b>
              <small>Sản phẩm trong kho</small>
            </div>
            <div>
              <b>{categories.length}</b>
              <small>Danh mục đang mở</small>
            </div>
          </section>

          <section className="panel">
            <h2><Layers /> Thêm danh mục mới</h2>
            <form onSubmit={addCategory}>
              <input
                placeholder="Tên danh mục (ví dụ: Tài khoản Netflix)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
              <input
                placeholder="Slug (ví dụ: netflix-gia-re)"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                required
              />
              <button type="submit"><Plus size={16} /> Tạo danh mục</button>
            </form>
          </section>

          <section className="panel">
            <h2><Package /> Thêm sản phẩm mới</h2>
            <form onSubmit={addProduct}>
              <input
                placeholder="Tên sản phẩm"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Giá bán (VND)"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                required
              />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit"><Plus size={16} /> Tạo sản phẩm</button>
            </form>
          </section>
        </>
      ) : (
        <>
          <section className="hero">
            <div>
              <p className="eyebrow">TELEGRAM COMMERCE · DIGITAL GOODS</p>
              <h1>TÀI NGUYÊN<br /><em>GIÁ RẺ.</em></h1>
              <p>Mua hàng tự động qua Telegram • Nhận tài khoản/key ngay lập tức.</p>
            </div>
            <ShoppingBag size={58} />
          </section>

          <section className="wallet">
            <div>
              <small><UserRound size={14} /> TÀI KHOẢN TELEGRAM</small>
              <strong>{profile?.firstName || profile?.username || 'Khách Hàng Telegram'}</strong>
              <small>Nạp tiền tự động qua VietQR bên cạnh</small>
            </div>
            <form onSubmit={deposit}>
              <input
                type="number"
                min="10000"
                step="1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <button type="submit">NẠP VIETQR</button>
            </form>
          </section>

          {qr && (
            <section className="panel qr">
              <h2>Mã QR Nạp Tiền VietQR</h2>
              <img src={qr} alt="VietQR" />
              <p style={{ marginTop: '8px' }}>Quét mã chuyển khoản theo đúng nội dung để hệ thống tự động xử lý.</p>
              <button
                className="ghost"
                style={{ marginTop: '10px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                onClick={() => {
                  const botName = botUsername || 'TaiNguyenGiaReBot';
                  const link = `https://t.me/${botName}?start=nap_${depositAmount}`;
                  if (window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(link);
                  } else {
                    window.open(link, '_blank');
                  }
                }}
              >
                <Send size={14} /> Báo đã chuyển khoản cho Bot
              </button>
            </section>
          )}

          <section className="section-title">
            <h2><Layers /> DANH MỤC SẢN PHẨM</h2>
            <button className="ghost" onClick={loadData}><RefreshCw size={16} /></button>
          </section>
          <div className="chips">
            {categories.map((c) => (
              <span key={c.id}><CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />{c.name}</span>
            ))}
          </div>

          <section className="section-title">
            <h2><ShoppingBag /> SẢN PHẨM ĐANG BÁN</h2>
          </section>
          <div className="products">
            {products.map((p) => (
              <article className="product" key={p.id}>
                <div className="product-art"><Package size={30} /></div>
                <small>{p.category?.name || 'DIGITAL'}</small>
                <h3>{p.name}</h3>
                <p>{p.description || 'Sản phẩm kỹ thuật số chính hãng'}</p>
                <strong>{Number(p.salePrice || p.price).toLocaleString('vi-VN')}đ</strong>
                <button onClick={() => buy(p)}>MUA NGAY</button>
              </article>
            ))}
          </div>
        </>
      )}

      <footer>
        SECURE TELEGRAM COMMERCE · SHOP HAI1110#
      </footer>
    </main>
  );
}

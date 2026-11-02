import { useEffect, useState } from 'react';
import { ShoppingBag, Layers, UserRound, Package, ShieldCheck, Plus, RefreshCw, Settings, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready(): void;
        expand(): void;
        openLink(url: string): void;
      };
    };
  }
}

// Lấy apiUrl từ query parameter (?apiUrl=...) hoặc localStorage hoặc biến môi trường Vite
const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const queryApi = searchParams?.get('apiUrl');
if (queryApi && typeof window !== 'undefined') {
  localStorage.setItem('apiUrl', queryApi);
}
const initialApi = ((typeof window !== 'undefined' && localStorage.getItem('apiUrl')) || (import.meta as any).env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

type Product = { id: string; name: string; description?: string; price: number; salePrice?: number; category?: { name: string } };

export default function App() {
  const [adminMode, setAdminMode] = useState(
    typeof window !== 'undefined' && (location.pathname.startsWith('/admin') || location.hash === '#admin')
  );
  const [apiUrl, setApiUrl] = useState(initialApi);
  const [showConfig, setShowConfig] = useState(false);
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

  async function api(path: string, options: RequestInit = {}) {
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

  // Tự động đăng nhập
  useEffect(() => {
    let isMounted = true;
    const autoAuthenticate = async () => {
      try {
        if (adminMode) {
          // Tự động cấp quyền Quản trị viên (KHÔNG CẦN TÀI KHOẢN MẬT KHẨU ADMIN)
          const res = await fetch(`${apiUrl}/api/admin/session`, { method: 'POST' });
          const data = await res.json();
          if (isMounted && data.token) {
            localStorage.setItem('adminToken', data.token);
            setToken(data.token);
            setMessage('Đã kết nối quyền Quản trị viên tự động');
          }
        } else {
          // Tự động đăng nhập người dùng từ Telegram WebApp trên GitHub Pages
          const tg = window.Telegram?.WebApp;
          tg?.ready();
          tg?.expand();
          const initData = tg?.initData || '';

          const res = await fetch(`${apiUrl}/api/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
          });
          const data = await res.json();
          if (isMounted && data.token) {
            localStorage.setItem('userToken', data.token);
            setToken(data.token);
            setProfile(data.user);
          }
        }
      } catch (e) {
        console.warn('Lỗi kết nối tự động:', e);
        if (isMounted) setMessage('Chưa kết nối được Backend: ' + (e as Error).message);
      }
    };

    autoAuthenticate();
    return () => { isMounted = false; };
  }, [adminMode, apiUrl]);

  async function loadData() {
    try {
      const prods = await api('/api/products');
      setProducts(prods);
      const cats = await api('/api/categories');
      setCategories(cats);
      if (token && !adminMode) {
        const me = await api('/api/me');
        setProfile(me);
      }
      setMessage('');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    if (token) loadData();
  }, [token, apiUrl]);

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

  async function buy(id: string) {
    try {
      const d = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ productId: id, quantity: 1 })
      });
      setMessage(`🎉 Mua thành công! Mã đơn: ${d.order.code}\n${d.delivery ? d.delivery.join('\n') : ''}`);
      await loadData();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const d = await api('/api/payments/deposits', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(depositAmount) })
      });
      setQr(d.qrUrl);
      setMessage(`Quét mã chuyển đúng ${Number(d.amount).toLocaleString('vi-VN')}đ với nội dung: ${d.reference}`);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  function saveCustomApi(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('apiUrl', apiUrl);
    setShowConfig(false);
    setToken('');
    setMessage('Đã lưu địa chỉ Backend mới. Đang kết nối lại...');
  }

  return (
    <main className="shell">
      <header>
        <div className="brand" onClick={() => { setAdminMode(false); }}>
          SHOP<span>HAI1110</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            {adminMode ? '🛍️ VỀ CỬA HÀNG' : '⚡ QUẢN TRỊ'}
          </button>
          <button
            className="ghost"
            style={{ padding: '6px 8px', borderRadius: '8px' }}
            title="Cài đặt API Backend"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings size={14} />
          </button>
          <div className="status"><i /> {apiUrl.includes('localhost') ? 'LOCAL' : 'TUNNEL'}</div>
        </div>
      </header>

      {showConfig && (
        <section className="panel" style={{ border: '1px solid #00d9ff' }}>
          <h2><Settings /> Cấu hình API Backend</h2>
          <p style={{ margin: '6px 0 12px' }}>
            Nếu chạy Mini App trên GitHub Pages, nhập URL Tunnel (ví dụ <code>https://xxx.trycloudflare.com</code>) trỏ về máy tính:
          </p>
          <form onSubmit={saveCustomApi} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://xxx.trycloudflare.com hoặc http://localhost:4000"
            />
            <button type="submit" style={{ whiteSpace: 'nowrap' }}>LƯU & KẾT NỐI</button>
          </form>
        </section>
      )}

      {message && <div className="notice">{message}</div>}

      {adminMode ? (
        <>
          <section className="hero">
            <ShieldCheck size={48} />
            <div>
              <p className="eyebrow">CHẾ ĐỘ QUẢN TRỊ VIÊN</p>
              <h1>ADMIN PANEL</h1>
              <p>Tự động xác thực • Không cần tài khoản / mật khẩu</p>
            </div>
            <button className="ghost" onClick={() => { setAdminMode(false); window.location.hash = ''; }}>
              Xem Shop
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
              <p>Tự động nhận diện tài khoản Telegram • Mua hàng nhận key tức thì.</p>
            </div>
            <ShoppingBag size={58} />
          </section>

          <section className="wallet">
            <div>
              <small><UserRound size={14} /> TÀI KHOẢN TELEGRAM</small>
              <strong>{profile?.firstName || profile?.username || 'Khách Hàng'}</strong>
              <small>Số dư khả dụng: <b style={{ color: '#00e6a8', fontSize: '13px' }}>{Number(profile?.balance || 0).toLocaleString('vi-VN')}đ</b></small>
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
              <p style={{ marginTop: '8px' }}>Chuyển khoản theo mã QR trên để hệ thống tự động cộng số dư.</p>
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
                <button onClick={() => buy(p.id)}>MUA NGAY</button>
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

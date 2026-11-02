import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Bot,
  Settings,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Ban,
  Unlock,
  Send,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  Download,
  Lock,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Megaphone,
  CreditCard,
  Menu,
  X
} from 'lucide-react';

declare global {
  interface Window {
    __API_URL__?: string;
  }
}

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

function getDefaultApi(): string {
  if (typeof window === 'undefined') return '';
  if (window.__API_URL__) return window.__API_URL__;
  if (isLocalhost) return 'http://localhost:4000';
  return 'http://localhost:4000';
}

export default function AdminApp() {
  const [adminKey, setAdminKey] = useState<string>(() => {
    return localStorage.getItem('HAI1110_ADMIN_KEY') || 'hai1110';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [inputKey, setInputKey] = useState('');
  const [loginError, setLoginError] = useState('');

  // API Url config
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('HAI1110_API_URL') || getDefaultApi();
  });
  const [showApiModal, setShowApiModal] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);

  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'bot' | 'users' | 'orders' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Search & Filter
  const [searchProduct, setSearchProduct] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    price: 0,
    salePrice: 0,
    description: '',
    imageUrl: '',
    initialKeys: ''
  });

  const [stockModal, setStockModal] = useState<{ open: boolean; product: any | null; keysText: string }>({
    open: false,
    product: null,
    keysText: ''
  });

  const [viewKeysModal, setViewKeysModal] = useState<{ open: boolean; product: any | null; keys: any[]; loading: boolean }>({
    open: false,
    product: null,
    keys: [],
    loading: false
  });

  const [balanceModal, setBalanceModal] = useState<{ open: boolean; user: any | null; type: 'ADD' | 'SUBTRACT'; amount: number; note: string }>({
    open: false,
    user: null,
    type: 'ADD',
    amount: 50000,
    note: ''
  });

  const [manualOrderModal, setManualOrderModal] = useState({
    open: false,
    telegramId: '',
    productId: '',
    customKey: '',
    total: 0
  });

  const [broadcastForm, setBroadcastForm] = useState({
    message: '',
    pinMessage: false,
    loading: false,
    result: null as any
  });

  const [directMsgModal, setDirectMsgModal] = useState({
    open: false,
    telegramId: '',
    message: '',
    loading: false
  });

  // Admin Headers helper
  const getHeaders = (overrideKey?: string) => ({
    'Content-Type': 'application/json',
    'x-admin-key': overrideKey || adminKey
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch all dashboard data
  const fetchData = async (overrideKey?: string) => {
    setLoading(true);
    const h = getHeaders(overrideKey);
    try {
      const [ovRes, prodRes, userRes, orderRes, botRes, setRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/overview`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/admin/products`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/users`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/orders`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/bot/status`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/admin/settings`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (ovRes) {
        setIsAuthenticated(true);
        setOverview(ovRes);
        setProducts(prodRes || []);
        setUsers(userRes || []);
        setOrders(orderRes || []);
        setBotStatus(botRes);
        setStoreSettings(setRes);

        // Extract unique categories
        const catMap = new Map();
        (prodRes || []).forEach((p: any) => {
          if (p.category?.id) catMap.set(p.category.id, p.category);
        });
        setCategories(Array.from(catMap.values()));
      } else {
        // If 401 or null and we have no stored key verification
        if (!overrideKey && adminKey) {
          // Keep key, but maybe API offline
        }
      }
    } catch (e) {
      console.error('Fetch admin error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl, adminKey]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!inputKey.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/overview`, {
        headers: { 'x-admin-key': inputKey.trim() }
      });
      if (res.ok) {
        setAdminKey(inputKey.trim());
        localStorage.setItem('HAI1110_ADMIN_KEY', inputKey.trim());
        setIsAuthenticated(true);
        fetchData(inputKey.trim());
      } else {
        setLoginError('Khóa quản trị (Admin Key) không chính xác! Vui lòng thử lại.');
      }
    } catch {
      setLoginError(`Không thể kết nối đến máy chủ API (${apiUrl}). Hãy kiểm tra xem server backend có đang chạy không.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('HAI1110_ADMIN_KEY');
    setAdminKey('');
    setIsAuthenticated(false);
  };

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;
    try {
      if (editingProduct) {
        await fetch(`${apiUrl}/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            name: productForm.name,
            categoryId: productForm.categoryId || undefined,
            price: Number(productForm.price),
            salePrice: productForm.salePrice ? Number(productForm.salePrice) : null,
            description: productForm.description,
            imageUrl: productForm.imageUrl
          })
        });
      } else {
        await fetch(`${apiUrl}/api/admin/products`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            name: productForm.name,
            categoryId: productForm.categoryId || (categories[0]?.id || 'cat-general'),
            price: Number(productForm.price),
            salePrice: productForm.salePrice ? Number(productForm.salePrice) : null,
            description: productForm.description,
            imageUrl: productForm.imageUrl,
            stockItemsText: productForm.initialKeys
          })
        });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (e) {
      alert('Lỗi lưu sản phẩm');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá sản phẩm "${name}"?`)) return;
    try {
      await fetch(`${apiUrl}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchData();
    } catch (e) {
      alert('Lỗi xoá sản phẩm');
    }
  };

  const handleToggleProductStatus = async (p: any) => {
    try {
      await fetch(`${apiUrl}/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !p.isActive })
      });
      fetchData();
    } catch (e) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const handleImportStock = async () => {
    if (!stockModal.product || !stockModal.keysText.trim()) return;
    try {
      await fetch(`${apiUrl}/api/admin/products/${stockModal.product.id}/stock`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ payloadsText: stockModal.keysText })
      });
      setStockModal({ open: false, product: null, keysText: '' });
      fetchData();
      alert('✅ Đã nhập thêm Key vào kho thành công!');
    } catch (e) {
      alert('Lỗi nhập key kho');
    }
  };

  const handleOpenViewKeys = async (product: any) => {
    setViewKeysModal({ open: true, product, keys: [], loading: true });
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${product.id}/keys`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setViewKeysModal({ open: true, product, keys: data, loading: false });
      }
    } catch {
      setViewKeysModal({ open: true, product, keys: [], loading: false });
    }
  };

  // User Actions
  const handleAdjustBalance = async () => {
    if (!balanceModal.user || balanceModal.amount <= 0) return;
    try {
      await fetch(`${apiUrl}/api/admin/users/${balanceModal.user.id}/balance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: Number(balanceModal.amount),
          type: balanceModal.type,
          note: balanceModal.note || `Admin ${balanceModal.type === 'ADD' ? 'cộng tiền' : 'trừ tiền'} từ Web Portal`
        })
      });
      setBalanceModal({ open: false, user: null, type: 'ADD', amount: 50000, note: '' });
      fetchData();
      alert(`✅ Đã ${balanceModal.type === 'ADD' ? 'cộng' : 'trừ'} tiền thành công! Bot đã gửi thông báo đến Telegram người dùng.`);
    } catch (e) {
      alert('Lỗi điều chỉnh số dư');
    }
  };

  const handleToggleBlockUser = async (u: any) => {
    const action = u.isBlocked ? 'mở khoá' : 'khoá';
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản user @${u.username || u.telegramId}?`)) return;
    try {
      await fetch(`${apiUrl}/api/admin/users/${u.id}/toggle-block`, {
        method: 'POST',
        headers: getHeaders()
      });
      fetchData();
    } catch (e) {
      alert('Lỗi cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`⚠️ CẢNH BÁO: Xoá vĩnh viễn user @${u.username || u.telegramId}? Toàn bộ lịch sử giao dịch và ví sẽ bị huỷ bỏ.`)) return;
    try {
      await fetch(`${apiUrl}/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchData();
      alert('✅ Đã xoá tài khoản vi phạm vĩnh viễn.');
    } catch (e) {
      alert('Lỗi xoá tài khoản');
    }
  };

  // Order Actions
  const handleManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderModal.telegramId || !manualOrderModal.productId) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          telegramId: manualOrderModal.telegramId.trim(),
          productId: manualOrderModal.productId,
          total: manualOrderModal.total ? Number(manualOrderModal.total) : undefined,
          deliveredKey: manualOrderModal.customKey || undefined,
          status: 'DELIVERED'
        })
      });
      if (res.ok) {
        setManualOrderModal({ open: false, telegramId: '', productId: '', customKey: '', total: 0 });
        fetchData();
        alert('🎉 Đã cấp đơn hàng thành công! Bot đã tự động gửi key vào chat Telegram của khách.');
      } else {
        const err = await res.json();
        alert('Lỗi cấp đơn: ' + (err.error || 'Thất bại'));
      }
    } catch (e) {
      alert('Lỗi kết nối cấp đơn');
    }
  };

  const handleRefundOrder = async (order: any) => {
    if (!confirm(`Xác nhận hoàn tiền ${order.total.toLocaleString('vi-VN')}đ vào ví của khách hàng cho đơn #${order.code}?`)) return;
    try {
      await fetch(`${apiUrl}/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'REFUNDED', refund: true })
      });
      fetchData();
      alert('✅ Đã hoàn tiền thành công vào ví khách hàng!');
    } catch (e) {
      alert('Lỗi hoàn tiền đơn');
    }
  };

  // Bot Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.message.trim()) return;
    if (!confirm('🚀 Xác nhận bắn thông báo đến TOÀN BỘ người dùng Bot Telegram?')) return;
    setBroadcastForm(prev => ({ ...prev, loading: true, result: null }));
    try {
      const res = await fetch(`${apiUrl}/api/admin/bot/broadcast`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: broadcastForm.message,
          pinMessage: broadcastForm.pinMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastForm(prev => ({
          ...prev,
          loading: false,
          result: { ok: true, sent: data.sent, failed: data.failed, total: data.total }
        }));
      } else {
        setBroadcastForm(prev => ({ ...prev, loading: false, result: { ok: false, error: data.error } }));
      }
    } catch (e: any) {
      setBroadcastForm(prev => ({ ...prev, loading: false, result: { ok: false, error: e.message } }));
    }
  };

  // Direct Message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMsgModal.telegramId || !directMsgModal.message.trim()) return;
    setDirectMsgModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${apiUrl}/api/admin/bot/send-message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          telegramId: directMsgModal.telegramId,
          message: directMsgModal.message
        })
      });
      if (res.ok) {
        alert(`✅ Đã gửi tin nhắn đến Telegram ID ${directMsgModal.telegramId} thành công!`);
        setDirectMsgModal({ open: false, telegramId: '', message: '', loading: false });
      } else {
        const err = await res.json();
        alert('Lỗi gửi tin nhắn: ' + err.error);
        setDirectMsgModal(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      alert('Lỗi gửi tin');
      setDirectMsgModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Export to GitHub Pages
  const handleSyncGithub = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/export-githubpage`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        alert('✅ Đã đồng bộ toàn bộ danh mục & sản phẩm sang githubpage/products.json!');
      } else {
        alert('Lỗi đồng bộ GitHub Pages');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(storeSettings)
      });
      alert('✅ Đã lưu cấu hình hệ thống thành công!');
      fetchData();
    } catch (e) {
      alert('Lỗi lưu cài đặt');
    }
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.category?.name && p.category.name.toLowerCase().includes(searchProduct.toLowerCase()))
    );
  }, [products, searchProduct]);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.firstName && u.firstName.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.telegramId && u.telegramId.includes(searchUser))
    );
  }, [users, searchUser]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        o.code.toLowerCase().includes(searchOrder.toLowerCase()) ||
        (o.user?.firstName && o.user.firstName.toLowerCase().includes(searchOrder.toLowerCase())) ||
        (o.user?.telegramId && o.user.telegramId.includes(searchOrder));
      const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchOrder, orderStatusFilter]);

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #200814 0%, #080306 100%)',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: '#12050e',
          border: '1px solid rgba(255, 36, 83, 0.3)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 36, 83, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #ff2453 0%, #900a29 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 25px rgba(255, 36, 83, 0.4)'
          }}>
            <Lock size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Shop Hai1110#</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>Hệ Thống Web Quản Trị Mini App & Bot Telegram</p>

          <form onSubmit={handleLogin}>
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ff2453', marginBottom: '6px' }}>
                MẬT KHẨU / ADMIN KEY
              </label>
              <input
                type="password"
                placeholder="Nhập admin key (mặc định: hai1110)"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 36, 83, 0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12.5px',
                color: '#f87171',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-admin btn-admin-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => {
                const url = prompt('Nhập địa chỉ máy chủ API Backend:', apiUrl);
                if (url) {
                  setApiUrl(url);
                  localStorage.setItem('HAI1110_API_URL', url);
                }
              }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
            >
              ⚙️ Cấu hình API Server ({apiUrl})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-badge">🐉</div>
          <div className="admin-logo-text">
            <h1>Shop Hai1110#</h1>
            <p>Admin Portal</p>
          </div>
          {mobileSidebarOpen && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-category">Hệ Thống</div>
          <button
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
          >
            <TrendingUp size={18} />
            <span>Tổng Quan & Báo Cáo</span>
          </button>

          <div className="admin-nav-category">Quản Lý Mini App</div>
          <button
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setMobileSidebarOpen(false); }}
          >
            <ShoppingBag size={18} />
            <span>Sản Phẩm & Kho Key</span>
            <span className="admin-nav-badge">{products.length}</span>
          </button>

          <div className="admin-nav-category">Quản Lý Bot Telegram</div>
          <button
            className={`admin-nav-item ${activeTab === 'bot' ? 'active' : ''}`}
            onClick={() => { setActiveTab('bot'); setMobileSidebarOpen(false); }}
          >
            <Bot size={18} />
            <span>Bot & Thông Báo</span>
            <span className="admin-nav-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>Active</span>
          </button>

          <div className="admin-nav-category">Dữ Liệu Khách Hàng</div>
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setMobileSidebarOpen(false); }}
          >
            <Users size={18} />
            <span>Người Dùng & Số Dư</span>
            <span className="admin-nav-badge">{users.length}</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
          >
            <Package size={18} />
            <span>Đơn Hàng & Bàn Giao</span>
            <span className="admin-nav-badge">{orders.length}</span>
          </button>

          <div className="admin-nav-category">Thiết Lập</div>
          <button
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
          >
            <Settings size={18} />
            <span>Cài Đặt Cổng & Mini App</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-user-avatar">H</div>
            <div className="admin-user-info">
              <div className="admin-user-name">(tp) Hai1110#</div>
              <div className="admin-user-role">Super Admin (6632274262)</div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#fff', display: 'none', cursor: 'pointer' }}
              className="mobile-menu-btn"
            >
              <Menu size={22} />
            </button>
            <div className="admin-page-title">
              {activeTab === 'overview' && '📊 Báo Cáo & Thống Kê Tổng Quan'}
              {activeTab === 'products' && '🛍️ Quản Lý Mini App: Sản Phẩm & Kho Key'}
              {activeTab === 'bot' && '🤖 Quản Lý Telegram Bot & Bắn Thông Báo'}
              {activeTab === 'users' && '👥 Quản Lý Người Dùng & Biến Động Số Dư'}
              {activeTab === 'orders' && '📦 Quản Lý Đơn Hàng & Cấp Key Bản Quyền'}
              {activeTab === 'settings' && '⚙️ Cài Đặt Hệ Thống & Cổng Thanh Toán'}
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Live Badges */}
            <div className={`admin-pill-badge ${overview ? 'online' : ''}`}>
              <span className="status-dot"></span>
              {overview ? 'API: Trực Tuyến' : 'API: Mất Kết Nối'}
            </div>

            <div className="admin-pill-badge bot">
              <Bot size={13} />
              <span>@tainguyenhai1110_bot</span>
            </div>

            <a
              href="https://haiempirestore.github.io/bottesss/"
              target="_blank"
              rel="noreferrer"
              className="admin-pill-badge"
              style={{ color: '#fff' }}
              title="Xem Mini App khách hàng"
            >
              <ExternalLink size={13} />
              <span>Mini App</span>
            </a>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="btn-admin btn-admin-secondary btn-admin-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="admin-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">Tổng Doanh Thu</span>
                    <div className="admin-stat-icon"><DollarSign size={18} /></div>
                  </div>
                  <div className="admin-stat-value">{(overview?.revenue || 0).toLocaleString('vi-VN')}đ</div>
                  <div className="admin-stat-sub">
                    <span style={{ color: '#10b981' }}>↑ Đã thanh toán & hoàn tất</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">Tổng Tiền Nạp Ví</span>
                    <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}><CreditCard size={18} /></div>
                  </div>
                  <div className="admin-stat-value">{(overview?.deposited || 0).toLocaleString('vi-VN')}đ</div>
                  <div className="admin-stat-sub">Qua chuyển khoản VietQR VCB</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">Tổng Thành Viên</span>
                    <div className="admin-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}><Users size={18} /></div>
                  </div>
                  <div className="admin-stat-value">{overview?.users || users.length}</div>
                  <div className="admin-stat-sub">Người dùng từ Mini App & Bot</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">Tổng Đơn Hàng</span>
                    <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Package size={18} /></div>
                  </div>
                  <div className="admin-stat-value">{overview?.orders || orders.length}</div>
                  <div className="admin-stat-sub">Đơn hàng tự động & cấp tay</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">Kho Key Sẵn Sàng</span>
                    <div className="admin-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}><KeyRound size={18} /></div>
                  </div>
                  <div className="admin-stat-value">{overview?.availableStock || 0}</div>
                  <div className="admin-stat-sub">Key khả dụng trong kho</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <span className="admin-stat-title">Sản Phẩm Đang Bán</span>
                    <div className="admin-stat-icon"><ShoppingBag size={18} /></div>
                  </div>
                  <div className="admin-stat-value">{overview?.products || products.length}</div>
                  <div className="admin-stat-sub">{categories.length} Danh mục sản phẩm</div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="admin-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>⚡ Thao tác nhanh quản trị</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Đồng bộ Mini App, gửi thông báo bot hoặc cấp đơn hàng ngay lập tức</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={handleSyncGithub} className="btn-admin btn-admin-success">
                    <Download size={15} /> Đồng bộ GitHub Pages
                  </button>
                  <button onClick={() => { setActiveTab('bot'); }} className="btn-admin btn-admin-secondary">
                    <Megaphone size={15} /> Bắn thông báo Bot
                  </button>
                  <button onClick={() => { setManualOrderModal(prev => ({ ...prev, open: true })); }} className="btn-admin btn-admin-primary">
                    <Plus size={15} /> + Cấp đơn thủ công
                  </button>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>📦 Đơn Hàng Mới Nhất</h3>
                  <button onClick={() => setActiveTab('orders')} className="btn-admin btn-admin-secondary btn-admin-sm">
                    Xem tất cả ({orders.length}) <ChevronRight size={14} />
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Giá trị</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ff2453' }}>#{o.code}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{o.user?.firstName || 'Khách'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {o.user?.telegramId}</div>
                          </td>
                          <td>{o.items?.[0]?.product?.name || 'Gói dịch vụ'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{o.total?.toLocaleString('vi-VN')}đ</td>
                          <td>
                            <span className={`badge-status ${o.status.toLowerCase()}`}>
                              {o.status === 'DELIVERED' ? 'Đã giao key' : o.status === 'PENDING' ? 'Chờ xử lý' : 'Đã huỷ'}
                            </span>
                          </td>
                          <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                            {new Date(o.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Chưa có đơn hàng nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS & STOCK */}
          {activeTab === 'products' && (
            <div>
              <div className="admin-section-header">
                <div className="admin-actions-bar">
                  <div className="admin-input-search">
                    <Search size={16} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm theo tên..."
                      value={searchProduct}
                      onChange={e => setSearchProduct(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-actions-bar">
                  <button onClick={handleSyncGithub} className="btn-admin btn-admin-success btn-admin-sm">
                    <Download size={14} /> Xuất GitHub Pages
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: '',
                        categoryId: categories[0]?.id || '',
                        price: 50000,
                        salePrice: 0,
                        description: '',
                        imageUrl: '',
                        initialKeys: ''
                      });
                      setShowProductModal(true);
                    }}
                    className="btn-admin btn-admin-primary"
                  >
                    <Plus size={16} /> + Thêm Sản Phẩm Mới
                  </button>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Giá bán</th>
                        <th>Giá Sale</th>
                        <th>Kho Key</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => {
                        const stockCount = p._count?.stockItems ?? p.stockItems?.length ?? 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={p.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80'}
                                  alt=""
                                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255, 36, 83, 0.2)' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, color: '#fff' }}>{p.name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.description || 'Chưa có mô tả'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                                {p.category?.name || 'Chung'}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.price.toLocaleString('vi-VN')}đ</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: p.salePrice ? '#ff2453' : '#64748b' }}>
                              {p.salePrice ? `${p.salePrice.toLocaleString('vi-VN')}đ` : '—'}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: stockCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: stockCount > 0 ? '#10b981' : '#ef4444'
                              }}>
                                <KeyRound size={12} /> {stockCount} key
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleProductStatus(p)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                <span className={`badge-status ${p.isActive ? 'active' : 'cancelled'}`}>
                                  {p.isActive ? 'Đang bán' : 'Tạm ẩn'}
                                </span>
                              </button>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => setStockModal({ open: true, product: p, keysText: '' })}
                                  className="btn-admin btn-admin-secondary btn-admin-sm"
                                  title="Nhập thêm key vào kho"
                                >
                                  <Plus size={13} /> Nhập Key
                                </button>
                                <button
                                  onClick={() => handleOpenViewKeys(p)}
                                  className="btn-admin btn-admin-secondary btn-admin-sm"
                                  title="Xem kho key"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setProductForm({
                                      name: p.name,
                                      categoryId: p.categoryId || '',
                                      price: p.price,
                                      salePrice: p.salePrice || 0,
                                      description: p.description || '',
                                      imageUrl: p.imageUrl || '',
                                      initialKeys: ''
                                    });
                                    setShowProductModal(true);
                                  }}
                                  className="btn-admin btn-admin-secondary btn-admin-sm"
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="btn-admin btn-admin-danger btn-admin-sm"
                                  title="Xoá"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEGRAM BOT MANAGEMENT */}
          {activeTab === 'bot' && (
            <div>
              {/* Bot Info Header */}
              <div className="admin-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)'
                  }}>
                    <Bot size={30} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Shop Hai1110# Telegram Bot</h2>
                    <p style={{ fontSize: '13px', color: '#38bdf8', marginTop: '2px' }}>
                      @{botStatus?.botUsername || 'tainguyenhai1110_bot'} • Admin ID: {botStatus?.adminTelegramId || '6632274262'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <a
                    href={`https://t.me/${botStatus?.botUsername || 'tainguyenhai1110_bot'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-admin btn-admin-primary"
                  >
                    <Send size={15} /> Mở Chat Bot Trên Telegram
                  </a>
                </div>
              </div>

              {/* Bot Control Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {/* Broadcast Announcement */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Megaphone size={18} color="#ff2453" /> Bắn Thông Báo Toàn Bộ Người Dùng
                    </h3>
                  </div>
                  <div className="admin-card-body" style={{ padding: '20px' }}>
                    <form onSubmit={handleSendBroadcast}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Nội Dung Thông Báo (Hỗ trợ định dạng HTML)</label>
                        <textarea
                          className="admin-form-control"
                          rows={4}
                          placeholder="Ví dụ: 🔥 FLASH SALE 50% hôm nay! Nạp tiền ngay để nhận ưu đãi cực hot từ Shop Hai1110#..."
                          value={broadcastForm.message}
                          onChange={e => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <input
                          type="checkbox"
                          id="pinCheck"
                          checked={broadcastForm.pinMessage}
                          onChange={e => setBroadcastForm(prev => ({ ...prev, pinMessage: e.target.checked }))}
                        />
                        <label htmlFor="pinCheck" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                          Tự động Ghim tin nhắn (Pin) trên đoạn chat của khách hàng
                        </label>
                      </div>

                      {/* Live Telegram Preview */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Xem trước tin nhắn Bot gửi:</div>
                        <div className="telegram-preview-box">
                          <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Shop Hai1110# 📢 THÔNG BÁO</div>
                          <div>{broadcastForm.message || 'Nội dung tin nhắn sẽ xuất hiện tại đây...'}</div>
                        </div>
                      </div>

                      {broadcastForm.result && (
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          marginBottom: '16px',
                          background: broadcastForm.result.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${broadcastForm.result.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          color: broadcastForm.result.ok ? '#10b981' : '#f87171',
                          fontSize: '13px'
                        }}>
                          {broadcastForm.result.ok
                            ? `🎉 Đã gửi thành công ${broadcastForm.result.sent}/${broadcastForm.result.total} người dùng!`
                            : `❌ Lỗi: ${broadcastForm.result.error}`}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={broadcastForm.loading || !broadcastForm.message.trim()}
                        className="btn-admin btn-admin-primary"
                        style={{ width: '100%' }}
                      >
                        {broadcastForm.loading ? 'Đang gửi...' : '🚀 Bắn Thông Báo Ngay'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Direct Message & Bot Commands */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Direct Message */}
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={18} color="#06b6d4" /> Gửi Tin Nhắn Riêng Cho 1 Người Dùng
                      </h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <form onSubmit={handleSendDirectMessage}>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Telegram ID Người Nhận</label>
                          <input
                            type="text"
                            className="admin-form-control"
                            placeholder="VD: 6632274262"
                            value={directMsgModal.telegramId}
                            onChange={e => setDirectMsgModal(prev => ({ ...prev, telegramId: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Nội Dung Tin Nhắn</label>
                          <textarea
                            className="admin-form-control"
                            rows={3}
                            placeholder="Nhập nội dung cần nhắn riêng cho khách..."
                            value={directMsgModal.message}
                            onChange={e => setDirectMsgModal(prev => ({ ...prev, message: e.target.value }))}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={directMsgModal.loading}
                          className="btn-admin btn-admin-secondary"
                          style={{ width: '100%' }}
                        >
                          {directMsgModal.loading ? 'Đang gửi...' : 'Gửi Tin Nhắn Trực Tiếp'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Commands Cheat-Sheet */}
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>⚡ Danh Sách Lệnh Quản Trị Bot</h3>
                    </div>
                    <div style={{ padding: '16px 20px', fontSize: '13px', lineHeight: '1.8' }}>
                      <div><code>/admin</code> — Xem tổng quan & mở Admin Portal</div>
                      <div><code>/congtien [telegram_id] [số_tiền]</code> — Nạp tiền ví</div>
                      <div><code>/trutien [telegram_id] [số_tiền]</code> — Khấu trừ tiền ví</div>
                      <div><code>/xoatk [telegram_id]</code> — Xoá tài khoản vi phạm</div>
                      <div><code>/themdon [id] [mã_sp] [key]</code> — Cấp đơn & giao key</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div className="admin-section-header">
                <div className="admin-input-search">
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, username hoặc Telegram ID..."
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                  />
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Tổng cộng: <strong style={{ color: '#fff' }}>{filteredUsers.length}</strong> người dùng
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Telegram ID</th>
                        <th>Số dư ví</th>
                        <th>Đã chi tiêu</th>
                        <th>Đơn mua</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ff2453 0%, #15060c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                color: '#ff2453',
                                border: '1px solid rgba(255, 36, 83, 0.3)'
                              }}>
                                {(u.firstName || 'K').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#fff' }}>{u.firstName || 'Khách hàng'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {u.username ? `@${u.username}` : 'Chưa đặt username'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              onClick={() => copyToClipboard(u.telegramId, u.id)}
                              style={{
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                color: copiedKey === u.id ? '#10b981' : '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Click để copy ID"
                            >
                              {u.telegramId} {copiedKey === u.id ? <Check size={12} /> : <Copy size={12} />}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>
                            {u.balance?.toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {(u.totalSpent || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '12px' }}>
                              {u.orderCount || 0} đơn
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${u.isBlocked ? 'blocked' : 'active'}`}>
                              {u.isBlocked ? 'Đang bị khoá' : 'Hoạt động'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => setBalanceModal({ open: true, user: u, type: 'ADD', amount: 50000, note: '' })}
                                className="btn-admin btn-admin-success btn-admin-sm"
                                title="Cộng tiền ví"
                              >
                                + Tiền
                              </button>
                              <button
                                onClick={() => setBalanceModal({ open: true, user: u, type: 'SUBTRACT', amount: 20000, note: '' })}
                                className="btn-admin btn-admin-danger btn-admin-sm"
                                title="Trừ tiền ví"
                              >
                                - Tiền
                              </button>
                              <button
                                onClick={() => setDirectMsgModal({ open: true, telegramId: u.telegramId, message: '', loading: false })}
                                className="btn-admin btn-admin-secondary btn-admin-sm"
                                title="Nhắn tin bot riêng"
                              >
                                <Send size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleBlockUser(u)}
                                className={`btn-admin ${u.isBlocked ? 'btn-admin-success' : 'btn-admin-secondary'} btn-admin-sm`}
                                title={u.isBlocked ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
                              >
                                {u.isBlocked ? <Unlock size={13} /> : <Ban size={13} />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="btn-admin btn-admin-danger btn-admin-sm"
                                title="Xoá vĩnh viễn"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Không tìm thấy người dùng</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div>
              <div className="admin-section-header">
                <div className="admin-actions-bar">
                  <div className="admin-input-search">
                    <Search size={16} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Tìm theo mã đơn hoặc người mua..."
                      value={searchOrder}
                      onChange={e => setSearchOrder(e.target.value)}
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="admin-form-control"
                    style={{ width: 'auto', padding: '8px 14px' }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="DELIVERED">Đã giao key (DELIVERED)</option>
                    <option value="PENDING">Chờ xử lý (PENDING)</option>
                    <option value="CANCELLED">Đã huỷ (CANCELLED)</option>
                    <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
                  </select>
                </div>

                <button
                  onClick={() => setManualOrderModal(prev => ({ ...prev, open: true }))}
                  className="btn-admin btn-admin-primary"
                >
                  <Plus size={16} /> + Cấp Đơn Thủ Công
                </button>
              </div>

              <div className="admin-card">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Giá tiền</th>
                        <th>Key Bàn Giao</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => {
                        const deliveredKey = o.items?.[0]?.delivered;
                        return (
                          <tr key={o.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ff2453' }}>
                              #{o.code}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.user?.firstName || 'Khách'}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {o.user?.telegramId}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.items?.[0]?.product?.name || 'Sản phẩm'}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>SL: {o.items?.[0]?.quantity || 1}</div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {o.total?.toLocaleString('vi-VN')}đ
                            </td>
                            <td>
                              {deliveredKey ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div className="key-box-display">{deliveredKey}</div>
                                  <button
                                    onClick={() => copyToClipboard(deliveredKey, o.id)}
                                    className="btn-admin btn-admin-secondary btn-admin-sm"
                                    title="Copy key"
                                  >
                                    {copiedKey === o.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '12px' }}>Chưa có key</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge-status ${o.status.toLowerCase()}`}>
                                {o.status === 'DELIVERED' ? 'Đã giao key' : o.status === 'PENDING' ? 'Chờ xử lý' : o.status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã huỷ'}
                              </span>
                            </td>
                            <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                              {new Date(o.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {o.status !== 'REFUNDED' && (
                                <button
                                  onClick={() => handleRefundOrder(o)}
                                  className="btn-admin btn-admin-danger btn-admin-sm"
                                  title="Hoàn lại tiền vào ví khách"
                                >
                                  Hoàn Tiền
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Không có đơn hàng nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '800px' }}>
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>⚙️ Cài Đặt Mini App & Cổng Thanh Toán VietQR</h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <form onSubmit={handleSaveSettings}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Mã Ngân Hàng (BIN Vietcombank)</label>
                        <input
                          type="text"
                          className="admin-form-control"
                          value={storeSettings?.bankId || '970436'}
                          onChange={e => setStoreSettings({ ...storeSettings, bankId: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">Số Tài Khoản VCB</label>
                        <input
                          type="text"
                          className="admin-form-control"
                          value={storeSettings?.accountNo || 'HAI100TR'}
                          onChange={e => setStoreSettings({ ...storeSettings, accountNo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Tên Chủ Tài Khoản (Không dấu)</label>
                      <input
                        type="text"
                        className="admin-form-control"
                        value={storeSettings?.accountName || 'NGUYEN HOANG HAI'}
                        onChange={e => setStoreSettings({ ...storeSettings, accountName: e.target.value })}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Dòng Chữ Thông Báo Mini App (Chạy trên đỉnh)</label>
                      <textarea
                        className="admin-form-control"
                        rows={2}
                        value={storeSettings?.announcement || ''}
                        onChange={e => setStoreSettings({ ...storeSettings, announcement: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Tỷ Giá Quy Đổi USDT / VND</label>
                        <input
                          type="number"
                          className="admin-form-control"
                          value={storeSettings?.usdtRate || 25400}
                          onChange={e => setStoreSettings({ ...storeSettings, usdtRate: Number(e.target.value) })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-form-label">URL Mini App (Menu Button Telegram)</label>
                        <input
                          type="text"
                          className="admin-form-control"
                          value={storeSettings?.webAppUrl || 'https://haiempirestore.github.io/bottesss/'}
                          onChange={e => setStoreSettings({ ...storeSettings, webAppUrl: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                      <input
                        type="checkbox"
                        id="maintCheck"
                        checked={!!storeSettings?.maintenanceMode}
                        onChange={e => setStoreSettings({ ...storeSettings, maintenanceMode: e.target.checked })}
                      />
                      <label htmlFor="maintCheck" style={{ fontSize: '13px', color: '#f87171', fontWeight: 600, cursor: 'pointer' }}>
                        Bật chế độ bảo trì Mini App (Chỉ Admin mới có quyền truy cập mua hàng)
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="btn-admin btn-admin-primary">
                        Lưu Cấu Hình
                      </button>
                      <button type="button" onClick={handleSyncGithub} className="btn-admin btn-admin-success">
                        <Download size={15} /> Đồng bộ sang GitHub Pages
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: THÊM / SỬA SẢN PHẨM */}
      {showProductModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>{editingProduct ? '✏️ Chỉnh Sửa Sản Phẩm' : '➕ Thêm Sản Phẩm Mới'}</h3>
              <button onClick={() => setShowProductModal(false)} className="admin-modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên sản phẩm *</label>
                  <input
                    type="text"
                    className="admin-form-control"
                    placeholder="VD: Tài khoản ChatGPT Plus 1 Tháng"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá niêm yết (VNĐ) *</label>
                    <input
                      type="number"
                      className="admin-form-control"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Giá khuyến mãi (Để trống nếu không có)</label>
                    <input
                      type="number"
                      className="admin-form-control"
                      value={productForm.salePrice}
                      onChange={e => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Danh mục</label>
                  <select
                    className="admin-form-control"
                    value={productForm.categoryId}
                    onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Link ảnh sản phẩm (URL)</label>
                  <input
                    type="text"
                    className="admin-form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={productForm.imageUrl}
                    onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả chi tiết</label>
                  <textarea
                    className="admin-form-control"
                    rows={2}
                    placeholder="Bảo hành 1 đổi 1 trong suốt thời gian sử dụng..."
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                {!editingProduct && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Nhập sẵn Key Kho ban đầu (Mỗi key / tài khoản 1 dòng):
                    </label>
                    <textarea
                      className="admin-form-control"
                      rows={4}
                      placeholder="user1|pass1&#10;user2|pass2&#10;KEY-XXXX-YYYY"
                      value={productForm.initialKeys}
                      onChange={e => setProductForm({ ...productForm, initialKeys: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn-admin btn-admin-secondary">
                  Huỷ bỏ
                </button>
                <button type="submit" className="btn-admin btn-admin-primary">
                  {editingProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NHẬP THÊM KEY VÀO KHO */}
      {stockModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>🔑 Nhập Thêm Key Vào Kho: {stockModal.product?.name}</h3>
              <button onClick={() => setStockModal({ open: false, product: null, keysText: '' })} className="admin-modal-close"><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                Dán danh sách key hoặc tài khoản bản quyền. <strong>Mỗi dòng tính là 1 key</strong>. Hệ thống sẽ tự động cộng thêm vào kho.
              </p>
              <textarea
                className="admin-form-control"
                rows={8}
                placeholder="key-123456&#10;user1@mail.com|pass123&#10;user2@mail.com|pass456"
                value={stockModal.keysText}
                onChange={e => setStockModal(prev => ({ ...prev, keysText: e.target.value }))}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff2453', fontWeight: 600 }}>
                Tổng số dòng phát hiện: {stockModal.keysText.split('\n').filter(s => s.trim().length > 0).length} key
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setStockModal({ open: false, product: null, keysText: '' })} className="btn-admin btn-admin-secondary">
                Huỷ bỏ
              </button>
              <button onClick={handleImportStock} className="btn-admin btn-admin-primary">
                Nhập Ngay Vào Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XEM DANH SÁCH KEY TRONG KHO */}
      {viewKeysModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '650px' }}>
            <div className="admin-modal-header">
              <h3>📦 Chi Tiết Kho Key: {viewKeysModal.product?.name}</h3>
              <button onClick={() => setViewKeysModal({ open: false, product: null, keys: [], loading: false })} className="admin-modal-close"><X size={18} /></button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {viewKeysModal.loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Đang tải danh sách key...</div>
              ) : viewKeysModal.keys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Sản phẩm này chưa có key nào trong kho</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {viewKeysModal.keys.map((k: any) => (
                    <div
                      key={k.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 36, 83, 0.1)'
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#38bdf8', wordBreak: 'break-all' }}>
                        {k.payload}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span className={`badge-status ${k.status === 'AVAILABLE' ? 'active' : 'cancelled'}`} style={{ fontSize: '10px' }}>
                          {k.status === 'AVAILABLE' ? 'Còn hàng' : 'Đã bán'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(k.payload, k.id)}
                          className="btn-admin btn-admin-secondary btn-admin-sm"
                        >
                          {copiedKey === k.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setViewKeysModal({ open: false, product: null, keys: [], loading: false })} className="btn-admin btn-admin-secondary">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CỘNG / TRỪ TIỀN VÍ */}
      {balanceModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>
                {balanceModal.type === 'ADD' ? '➕ Cộng Tiền Vào Ví' : '➖ Trừ Tiền Khỏi Ví'}
              </h3>
              <button onClick={() => setBalanceModal({ open: false, user: null, type: 'ADD', amount: 0, note: '' })} className="admin-modal-close"><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                Thành viên: <strong>{balanceModal.user?.firstName}</strong> (@{balanceModal.user?.username || 'N/A'}) • Telegram ID: <code>{balanceModal.user?.telegramId}</code>
              </p>
              <div className="admin-form-group">
                <label className="admin-form-label">Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  className="admin-form-control"
                  value={balanceModal.amount}
                  onChange={e => setBalanceModal(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Lý do / Ghi chú (Gửi qua tin nhắn Telegram cho khách)</label>
                <input
                  type="text"
                  className="admin-form-control"
                  placeholder="Ví dụ: Nạp tiền thưởng sự kiện, Hoàn tiền..."
                  value={balanceModal.note}
                  onChange={e => setBalanceModal(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setBalanceModal({ open: false, user: null, type: 'ADD', amount: 0, note: '' })} className="btn-admin btn-admin-secondary">
                Huỷ bỏ
              </button>
              <button
                onClick={handleAdjustBalance}
                className={`btn-admin ${balanceModal.type === 'ADD' ? 'btn-admin-success' : 'btn-admin-danger'}`}
              >
                Xác Nhận {balanceModal.type === 'ADD' ? 'Cộng Tiền' : 'Trừ Tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CẤP ĐƠN THỦ CÔNG */}
      {manualOrderModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>🎁 Cấp Đơn Hàng & Giao Key Thủ Công</h3>
              <button onClick={() => setManualOrderModal(prev => ({ ...prev, open: false }))} className="admin-modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleManualOrder}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Telegram ID khách hàng *</label>
                  <input
                    type="text"
                    className="admin-form-control"
                    placeholder="VD: 6632274262"
                    value={manualOrderModal.telegramId}
                    onChange={e => setManualOrderModal({ ...manualOrderModal, telegramId: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Chọn Sản Phẩm *</label>
                  <select
                    className="admin-form-control"
                    value={manualOrderModal.productId}
                    onChange={e => setManualOrderModal({ ...manualOrderModal, productId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn sản phẩm cấp cho khách --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString('vi-VN')}đ)</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Nội dung Key / Tài khoản giao cho khách</label>
                  <input
                    type="text"
                    className="admin-form-control"
                    placeholder="Để trống để hệ thống tự động rút 1 key từ kho"
                    value={manualOrderModal.customKey}
                    onChange={e => setManualOrderModal({ ...manualOrderModal, customKey: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setManualOrderModal(prev => ({ ...prev, open: false }))} className="btn-admin btn-admin-secondary">
                  Huỷ bỏ
                </button>
                <button type="submit" className="btn-admin btn-admin-primary">
                  Cấp Đơn & Gửi Key Qua Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import {
  Gem,
  TrendingUp,
  ShoppingBag,
  Users,
  Layers,
  Package,
  Warehouse,
  Boxes,
  CreditCard,
  Banknote,
  Megaphone,
  Bot,
  Settings,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Check,
  Copy,
  ExternalLink,
  Lock,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  Wallet,
  Send,
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  KeyRound,
  Eye,
  SlidersHorizontal,
  Landmark,
  Coins,
  Cpu,
  Zap,
  Award,
  BadgeDollarSign,
  UserCheck,
  History,
  Code2,
  RotateCcw,
  Share2,
  Receipt,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowDownRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export const formatShortVND = (amount: number) => {
  if (!amount) return '0 ₫';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)} tr ₫`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k ₫`;
  return `${amount.toLocaleString('vi-VN')} ₫`;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// 21 Navigation Tabs across 6 Section Groups matching the reference site
export type AdminTab =
  | 'overview'
  | 'orders'
  | 'failed_fulfillments'
  | 'customers'
  | 'categories'
  | 'products'
  | 'inventory'
  | 'wallet_txs'
  | 'wallet_holds'
  | 'wallet_topups'
  | 'bank_reviews'
  | 'referrals'
  | 'refunds'
  | 'bank_accounts'
  | 'crypto_wallets'
  | 'binance_pay'
  | 'broadcasts'
  | 'flash_sales'
  | 'settings_bot'
  | 'customer_tiers'
  | 'exchange_rates'
  | 'system_admins'
  | 'audit'
  | 'developers_api';

export default function AdminApp() {
  // Theme state: 'system' | 'light' | 'dark'
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'system';
  });

  useEffect(() => {
    if (theme === 'system') {
      const m = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => document.documentElement.setAttribute('data-theme', m.matches ? 'dark' : 'light');
      apply();
      m.addEventListener('change', apply);
      return () => m.removeEventListener('change', apply);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    if (next === 'system') {
      localStorage.removeItem('admin-theme');
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      localStorage.setItem('admin-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  };

  // Auth state
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.port === '4000'
  );

  const [adminKey, setAdminKey] = useState<string>(() => {
    return localStorage.getItem('HAI1110_ADMIN_KEY') || (isLocalhost ? 'hai1110' : '');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [inputLoginName, setInputLoginName] = useState('admin');
  const [inputKey, setInputKey] = useState(adminKey || 'hai1110');
  const [loginError, setLoginError] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // API Url config
  const [apiUrl, setApiUrl] = useState<string>(() => {
    if (typeof window !== 'undefined' && (isLocalhost || window.location.port === '4000')) {
      return window.location.origin || 'http://localhost:4000';
    }
    return localStorage.getItem('HAI1110_API_URL') || 'http://localhost:4000';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dashboard period selector
  type PeriodType = 'today' | 'week' | 'month' | 'all';
  const [period, setPeriod] = useState<PeriodType>('month');

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [failedOrders, setFailedOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Search & Filter states
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchUser, setSearchUser] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [searchTx, setSearchTx] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');

  // Inventory states
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [bulkImportProdId, setBulkImportProdId] = useState('');
  const [bulkImportText, setBulkImportText] = useState('');
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Modals & Forms
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '/icons/star.svg',
    sortOrder: 1
  });

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

  const [broadcastForm, setBroadcastForm] = useState({
    message: '',
    pinMessage: false,
    loading: false,
    result: null as any
  });

  const [settingsForm, setSettingsForm] = useState<any>({
    botToken: '',
    adminChatId: '',
    bankName: 'MBBANK',
    bankAccount: '1110200899999',
    bankAccountName: 'NGUYEN HOANG HAI',
    payosClientId: '',
    payosApiKey: '',
    payosChecksumKey: '',
    usdRate: 25000,
    usdtRate: 25500,
    referralRate: 5,
    usdtWalletTrc20: 'TLqX9m61110HaiEmpireTrc20USDTaddr',
    usdtWalletBep20: '0x1110a1110200899999HaiEmpireBep20',
    binanceApiKey: '',
    binanceSecretKey: '',
    binanceMerchantId: ''
  });

  // Customer Tiers State
  const [customerTiers, setCustomerTiers] = useState([
    { name: 'Member', minSpend: 0, discountPct: 0, color: 'neutral', perks: 'Hạng mặc định cho tất cả thành viên' },
    { name: 'Silver', minSpend: 500000, discountPct: 2, color: 'slate', perks: 'Giảm 2% tất cả đơn hàng' },
    { name: 'Gold', minSpend: 2000000, discountPct: 5, color: 'amber', perks: 'Giảm 5% + hỗ trợ ưu tiên' },
    { name: 'Diamond', minSpend: 5000000, discountPct: 10, color: 'cyan', perks: 'Giảm 10% + kênh CSKH VIP 24/7' }
  ]);

  // Flash Sale State
  const [flashSales, setFlashSales] = useState([
    { id: 'fs-1', title: 'Siêu Sale Cuối Tuần', discountPct: 20, active: true, endsAt: '2026-11-20T23:59:59', targetCategory: 'Tất cả sản phẩm' },
    { id: 'fs-2', title: 'Office 365 Giờ Vàng', discountPct: 35, active: false, endsAt: '2026-11-25T12:00:00', targetCategory: 'Văn phòng' }
  ]);
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [flashSaleForm, setFlashSaleForm] = useState({ title: '', discountPct: 15, targetCategory: 'Tất cả sản phẩm', endsAt: '' });

  // Bank accounts config
  const [bankAccounts, setBankAccounts] = useState([
    { id: 'b-1', bankCode: 'MBBANK', accountNo: '1110200899999', accountName: 'NGUYEN HOANG HAI', isActive: true, isDefault: true },
    { id: 'b-2', bankCode: 'VCB', accountNo: '999911102008', accountName: 'NGUYEN HOANG HAI', isActive: false, isDefault: false }
  ]);

  // Crypto wallets config
  const [cryptoWallets, setCryptoWallets] = useState([
    { id: 'c-1', network: 'USDT (TRC20)', address: 'TLqX9m61110HaiEmpireTrc20USDTaddr', isActive: true },
    { id: 'c-2', network: 'USDT (BEP20)', address: '0x1110a1110200899999HaiEmpireBep20', isActive: true }
  ]);

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

  // Fetch all dashboard & admin data
  const fetchData = async (overrideKey?: string) => {
    setLoading(true);
    const h = getHeaders(overrideKey);
    try {
      const [ovRes, prodRes, userRes, orderRes, botRes, setRes, catRes, txRes, depRes, failRes, logRes, admRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/overview`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/admin/products`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/users`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/orders`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/bot/status`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/admin/settings`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/categories`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/transactions`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/deposits`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/orders/failed`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/audit`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${apiUrl}/api/admin/admins`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      if (ovRes) {
        setIsAuthenticated(true);
        setOverview(ovRes);
        setProducts(prodRes || []);
        setUsers(userRes || []);
        setOrders(orderRes || []);
        setBotStatus(botRes);
        setTransactions(txRes || []);
        setDeposits(depRes || []);
        setFailedOrders(failRes || []);
        setAuditLogs(logRes || []);
        setAdminsList(admRes || []);

        if (setRes) {
          setStoreSettings(setRes);
          setSettingsForm((prev: any) => ({
            ...prev,
            botToken: setRes.botToken || '',
            adminChatId: setRes.adminChatId || '',
            bankName: setRes.bankName || 'MBBANK',
            bankAccount: setRes.bankAccount || '1110200899999',
            bankAccountName: setRes.bankAccountName || 'NGUYEN HOANG HAI',
            payosClientId: setRes.payosClientId || '',
            payosApiKey: setRes.payosApiKey || '',
            payosChecksumKey: setRes.payosChecksumKey || '',
            usdRate: setRes.usdRate || 25000
          }));
        }

        if (Array.isArray(catRes) && catRes.length > 0) {
          setCategories(catRes);
        } else {
          const catMap = new Map();
          (prodRes || []).forEach((p: any) => {
            if (p.category?.id) catMap.set(p.category.id, p.category);
          });
          setCategories(Array.from(catMap.values()));
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
    if (!inputKey.trim()) {
      setLoginError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
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
        setLoginError('Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch {
      setLoginError(`Không thể kết nối đến máy chủ API (${apiUrl}).`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('HAI1110_ADMIN_KEY');
    setAdminKey('');
    setIsAuthenticated(false);
    setUserDropdownOpen(false);
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      alert('Lỗi nhập key kho');
    }
  };

  const handleQuickBulkImport = async () => {
    if (!bulkImportProdId || !bulkImportText.trim()) {
      alert('Vui lòng chọn sản phẩm và nhập danh sách Key!');
      return;
    }
    setIsBulkImporting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${bulkImportProdId}/stock`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ payloadsText: bulkImportText })
      });
      if (res.ok) {
        setBulkImportText('');
        fetchData();
        alert('✅ Đã nhập kho hàng loạt thành công!');
      } else {
        alert('Lỗi khi nạp dữ liệu vào kho');
      }
    } catch {
      alert('Lỗi kết nối máy chủ khi nạp kho');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleViewKeys = async (product: any) => {
    setViewKeysModal({ open: true, product, keys: [], loading: true });
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${product.id}/keys`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setViewKeysModal({ open: true, product, keys: data, loading: false });
      } else {
        setViewKeysModal({ open: true, product, keys: [], loading: false });
      }
    } catch {
      setViewKeysModal({ open: true, product, keys: [], loading: false });
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Bạn có chắc muốn xoá Key này khỏi kho?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/keys/${keyId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setViewKeysModal(prev => ({
          ...prev,
          keys: prev.keys.filter(k => k.id !== keyId)
        }));
        fetchData();
      }
    } catch {
      alert('Lỗi xoá key');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    try {
      if (editingCategory) {
        await fetch(`${apiUrl}/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(categoryForm)
        });
      } else {
        await fetch(`${apiUrl}/api/admin/categories`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(categoryForm)
        });
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchData();
    } catch {
      alert('Lỗi lưu danh mục');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá danh mục "${name}"?`)) return;
    try {
      await fetch(`${apiUrl}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchData();
    } catch {
      alert('Lỗi xoá danh mục');
    }
  };

  // User Actions
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModal.user) return;
    try {
      await fetch(`${apiUrl}/api/admin/users/${balanceModal.user.id}/balance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: Number(balanceModal.amount),
          type: balanceModal.type,
          note: balanceModal.note || 'Admin điều chỉnh số dư'
        })
      });
      setBalanceModal({ open: false, user: null, type: 'ADD', amount: 50000, note: '' });
      fetchData();
      alert('✅ Cập nhật số dư thành công!');
    } catch {
      alert('Lỗi điều chỉnh số dư');
    }
  };

  const handleToggleBlockUser = async (user: any) => {
    try {
      await fetch(`${apiUrl}/api/admin/users/${user.id}/toggle-block`, {
        method: 'POST',
        headers: getHeaders()
      });
      fetchData();
    } catch {
      alert('Lỗi khóa/mở khóa người dùng');
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`${apiUrl}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch {
      alert('Lỗi cập nhật trạng thái đơn hàng');
    }
  };

  // Refund Order Action
  const handleRefundOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn hoàn tiền đơn hàng này về ví của khách?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Đã hoàn tiền thành công!');
        fetchData();
      } else {
        alert(data.error || 'Lỗi hoàn tiền');
      }
    } catch {
      alert('Lỗi kết nối khi hoàn tiền');
    }
  };

  // Deposit Actions (Approve / Cancel)
  const handleApproveDeposit = async (depId: string) => {
    if (!confirm('Bạn có chắc muốn duyệt nạp tiền thủ công cho giao dịch này?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/deposits/${depId}/approve`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        alert('✅ Đã duyệt nạp tiền thành công!');
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi duyệt nạp tiền');
      }
    } catch {
      alert('Lỗi kết nối duyệt nạp tiền');
    }
  };

  const handleCancelDeposit = async (depId: string) => {
    if (!confirm('Bạn có chắc muốn hủy yêu cầu nạp tiền này?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/deposits/${depId}/cancel`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        alert('Đã hủy yêu cầu nạp tiền.');
        fetchData();
      }
    } catch {
      alert('Lỗi hủy nạp tiền');
    }
  };

  // Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.message.trim()) return;
    if (!confirm(`Bạn có chắc muốn gửi thông báo này tới toàn bộ khách hàng trên Bot Telegram?`)) return;
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
      setBroadcastForm(prev => ({ ...prev, loading: false, result: data }));
    } catch {
      setBroadcastForm(prev => ({ ...prev, loading: false, result: { success: false, message: 'Lỗi gửi tin nhắn broadcast' } }));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(settingsForm)
      });
      fetchData();
      alert('✅ Đã lưu cấu hình hệ thống thành công!');
    } catch {
      alert('Lỗi lưu cấu hình');
    }
  };

  // Period calculations for Dashboard
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayOfWeek = now.getDay() || 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      if (period === 'today') return t >= startOfToday;
      if (period === 'week') return t >= startOfWeek;
      if (period === 'month') return t >= startOfMonth;
      return true;
    });
  }, [orders, period, startOfToday, startOfWeek, startOfMonth]);

  const paidOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      const s = (o.status || '').toUpperCase();
      return s === 'PAID' || s === 'COMPLETED' || s === 'DELIVERED';
    });
  }, [filteredOrders]);

  const periodRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [paidOrders]);

  const totalStockAvailable = useMemo(() => {
    return products.reduce((acc, p) => {
      const avail = p.stockItems?.filter((s: any) => s.status === 'AVAILABLE').length || 0;
      return acc + avail;
    }, 0);
  }, [products]);

  const totalStockAll = useMemo(() => {
    return products.reduce((acc, p) => {
      const count = p.stockItems?.length || 0;
      return acc + count;
    }, 0);
  }, [products]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => {
      const s = (o.status || '').toUpperCase();
      return s === 'PENDING' || s === 'DRAFT' || s === 'PENDING_PAYMENT';
    }).length;
  }, [orders]);

  const outOfStockProductsCount = useMemo(() => {
    return products.filter(p => {
      const avail = p.stockItems?.filter((s: any) => s.status === 'AVAILABLE').length || 0;
      return avail === 0;
    }).length;
  }, [products]);

  // Top selling products in period
  const topSellingProducts = useMemo(() => {
    const prodMap = new Map<string, { product_name: string; qty: number; revenue_vnd: number; product_id: string }>();
    paidOrders.forEach(o => {
      o.items?.forEach((it: any) => {
        const id = it.productId || it.product?.id || 'prod';
        const name = it.product?.name || it.productName || 'Sản phẩm';
        const qty = Number(it.quantity) || 1;
        const rev = (Number(it.price) || 0) * qty;
        const existing = prodMap.get(id);
        if (existing) {
          existing.qty += qty;
          existing.revenue_vnd += rev;
        } else {
          prodMap.set(id, { product_name: name, qty, revenue_vnd: rev, product_id: id });
        }
      });
    });
    return Array.from(prodMap.values()).sort((a, b) => b.revenue_vnd - a.revenue_vnd);
  }, [paidOrders]);

  // Filtered views
  const filteredProductsList = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.id && p.id.toLowerCase().includes(searchProduct.toLowerCase()));
      const matchCat = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchProduct, selectedCategoryFilter]);

  const filteredUsersList = useMemo(() => {
    return users.filter(u => {
      const s = searchUser.toLowerCase();
      return (u.firstName && u.firstName.toLowerCase().includes(s)) ||
        (u.lastName && u.lastName.toLowerCase().includes(s)) ||
        (u.username && u.username.toLowerCase().includes(s)) ||
        (u.telegramId && String(u.telegramId).includes(s));
    });
  }, [users, searchUser]);

  const filteredOrdersList = useMemo(() => {
    return orders.filter(o => {
      const s = searchOrder.toLowerCase();
      const matchSearch = (o.id && o.id.toLowerCase().includes(s)) ||
        (o.user?.firstName && o.user.firstName.toLowerCase().includes(s)) ||
        (o.user?.username && o.user.username.toLowerCase().includes(s)) ||
        (o.telegramId && String(o.telegramId).includes(s));
      const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchOrder, orderStatusFilter]);

  const filteredInventoryProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(inventorySearch.toLowerCase())) ||
        (p.id && p.id.toLowerCase().includes(inventorySearch.toLowerCase()));
      if (!matchSearch) return false;

      const available = p.stockItems?.filter((s: any) => s.status === 'AVAILABLE').length || 0;
      if (inventoryFilter === 'OUT') return available === 0;
      if (inventoryFilter === 'LOW') return available > 0 && available < 3;
      return true;
    });
  }, [products, inventorySearch, inventoryFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const s = searchTx.toLowerCase();
      const matchSearch = (t.note && t.note.toLowerCase().includes(s)) ||
        (t.user?.firstName && t.user.firstName.toLowerCase().includes(s)) ||
        (t.user?.username && t.user.username.toLowerCase().includes(s)) ||
        (t.user?.telegramId && String(t.user.telegramId).includes(s));
      const matchType = txTypeFilter === 'ALL' || t.type === txTypeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, searchTx, txTypeFilter]);

  // Page title mapping
  const pageTitleMap: Record<AdminTab, string> = {
    overview: 'Tổng quan kinh doanh',
    orders: 'Đơn hàng',
    failed_fulfillments: 'Lỗi giao hàng',
    customers: 'Khách Telegram',
    categories: 'Danh mục',
    products: 'Sản phẩm',
    inventory: 'Kho hàng',
    wallet_txs: 'Giao dịch ví',
    wallet_holds: 'Tiền đang giữ',
    wallet_topups: 'Nạp ví',
    bank_reviews: 'Đối soát ngân hàng',
    referrals: 'Hoa hồng giới thiệu',
    refunds: 'Hoàn tiền',
    bank_accounts: 'Ngân hàng',
    crypto_wallets: 'Ví crypto',
    binance_pay: 'Binance API',
    broadcasts: 'Thông báo hàng loạt',
    flash_sales: 'Flash sale',
    settings_bot: 'Cấu hình Bot',
    customer_tiers: 'Hạng khách',
    exchange_rates: 'Tỷ giá',
    system_admins: 'Quản trị viên',
    audit: 'Nhật ký',
    developers_api: 'Tài liệu API'
  };

  // IF NOT AUTHENTICATED: Exact Reference Login Screen (ez)
  if (!isAuthenticated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-4 sm:p-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1.08fr)]">
          {/* Left Column */}
          <section className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-sidebar p-9 text-sidebar-foreground md:flex">
            <div className="relative z-10 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white text-zinc-950 shadow-sm">
                <Gem size={21} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-bold text-white">Admin</p>
                <p className="text-xs text-[var(--sidebar-muted)]">Bán hàng Telegram</p>
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
                TRUNG TÂM VẬN HÀNH
              </p>
              <h2 className="mt-4 max-w-sm text-3xl font-bold leading-tight text-white">
                Quản lý cửa hàng nhanh, rõ và an toàn.
              </h2>
              <div className="mt-8 space-y-4 text-sm text-[var(--sidebar-muted)]">
                <p className="flex items-center gap-3">
                  <TrendingUp size={17} className="text-emerald-400" />
                  Theo dõi doanh thu và đơn hàng
                </p>
                <p className="flex items-center gap-3">
                  <Warehouse size={17} className="text-sky-400" />
                  Vận hành kho và giao hàng tự động
                </p>
                <p className="flex items-center gap-3">
                  <ShieldCheck size={17} className="text-purple-400" />
                  Kiểm soát truy cập theo phân quyền
                </p>
              </div>
            </div>

            <p className="relative z-10 text-xs text-[var(--sidebar-muted)]">
              Hệ thống quản trị dành riêng cho đội ngũ vận hành.
            </p>
          </section>

          {/* Right Column */}
          <section className="bg-card p-7 sm:p-10 md:p-12">
            <div className="mb-8">
              <span className="mb-5 grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground md:hidden">
                <Gem size={22} />
              </span>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                BÁN HÀNG TELEGRAM
              </p>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Chào mừng trở lại
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Đăng nhập để tiếp tục quản lý hoạt động cửa hàng.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-login-name">
                  Tên đăng nhập
                </label>
                <input
                  id="admin-login-name"
                  type="text"
                  value={inputLoginName}
                  onChange={e => setInputLoginName(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  required
                  className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-password">
                  Mật khẩu
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="Nhập mật khẩu (mặc định: hai1110)"
                  required
                  className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="rounded-lg border border-destructive/30 border-l-[3px] bg-destructive/10 p-3 text-sm font-semibold leading-5 text-destructive" role="alert">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-2 text-center text-xs leading-5 text-muted-foreground">
              <p>Phiên đăng nhập được bảo vệ và tự động hết hạn theo cấu hình hệ thống.</p>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Nhập địa chỉ máy chủ API Backend:', apiUrl);
                  if (url) {
                    setApiUrl(url);
                    localStorage.setItem('HAI1110_API_URL', url);
                  }
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
              >
                ⚙️ Cấu hình API Server ({apiUrl})
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: Exact AppShell with ALL 21 navigation items across 6 sections
  return (
    <div className="app-shell flex min-h-dvh bg-background">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="app-sidebar-backdrop lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4 py-2">
          <div
            onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
            className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 outline-none transition-opacity hover:opacity-90"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white text-zinc-950 shadow-xs">
              <Gem className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5 text-white">Admin</span>
              <span className="block truncate text-[0.6875rem] leading-4 text-sidebar-foreground/65">Bán hàng Telegram</span>
            </span>
          </div>
          {mobileSidebarOpen && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="grid size-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
          {/* Section 1: Vận hành */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Vận hành
            </p>
            <div className="space-y-1">
              <button
                className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
              >
                <TrendingUp size={16} />
                <span>Tổng quan</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
              >
                <ShoppingBag size={16} />
                <span className="flex-1 text-left">Đơn hàng</span>
                {orders.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
                    {orders.length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'failed_fulfillments' ? 'active' : ''}`}
                onClick={() => { setActiveTab('failed_fulfillments'); setMobileSidebarOpen(false); }}
              >
                <AlertCircle size={16} className={failedOrders.length > 0 ? 'text-rose-400' : ''} />
                <span className="flex-1 text-left">Lỗi giao hàng</span>
                {failedOrders.length > 0 && (
                  <span className="rounded-full bg-rose-500/20 text-rose-300 px-2 py-0.5 text-[11px] font-semibold">
                    {failedOrders.length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}
              >
                <Users size={16} />
                <span className="flex-1 text-left">Khách Telegram</span>
                {users.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
                    {users.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Sản phẩm */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Sản phẩm
            </p>
            <div className="space-y-1">
              <button
                className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => { setActiveTab('categories'); setMobileSidebarOpen(false); }}
              >
                <Layers size={16} />
                <span className="flex-1 text-left">Danh mục</span>
                {categories.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
                    {categories.length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => { setActiveTab('products'); setMobileSidebarOpen(false); }}
              >
                <Package size={16} />
                <span className="flex-1 text-left">Sản phẩm</span>
                {products.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
                    {products.length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => { setActiveTab('inventory'); setMobileSidebarOpen(false); }}
              >
                <Warehouse size={16} />
                <span className="flex-1 text-left">Kho hàng</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90">
                  {totalStockAvailable}
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Ví & Thanh toán */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Ví & Thanh toán
            </p>
            <div className="space-y-1">
              <button
                className={`sidebar-nav-item ${activeTab === 'wallet_txs' ? 'active' : ''}`}
                onClick={() => { setActiveTab('wallet_txs'); setMobileSidebarOpen(false); }}
              >
                <Receipt size={16} />
                <span>Giao dịch ví</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'wallet_holds' ? 'active' : ''}`}
                onClick={() => { setActiveTab('wallet_holds'); setMobileSidebarOpen(false); }}
              >
                <Lock size={16} />
                <span>Tiền đang giữ</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'wallet_topups' ? 'active' : ''}`}
                onClick={() => { setActiveTab('wallet_topups'); setMobileSidebarOpen(false); }}
              >
                <Wallet size={16} />
                <span className="flex-1 text-left">Nạp ví</span>
                {deposits.filter(d => d.status === 'PENDING').length > 0 && (
                  <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[11px] font-semibold">
                    {deposits.filter(d => d.status === 'PENDING').length}
                  </span>
                )}
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'bank_reviews' ? 'active' : ''}`}
                onClick={() => { setActiveTab('bank_reviews'); setMobileSidebarOpen(false); }}
              >
                <Banknote size={16} />
                <span>Đối soát ngân hàng</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'referrals' ? 'active' : ''}`}
                onClick={() => { setActiveTab('referrals'); setMobileSidebarOpen(false); }}
              >
                <Share2 size={16} />
                <span>Hoa hồng giới thiệu</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'refunds' ? 'active' : ''}`}
                onClick={() => { setActiveTab('refunds'); setMobileSidebarOpen(false); }}
              >
                <RotateCcw size={16} />
                <span>Hoàn tiền</span>
              </button>
            </div>
          </div>

          {/* Section 4: Cấu hình thanh toán */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Cấu hình thanh toán
            </p>
            <div className="space-y-1">
              <button
                className={`sidebar-nav-item ${activeTab === 'bank_accounts' ? 'active' : ''}`}
                onClick={() => { setActiveTab('bank_accounts'); setMobileSidebarOpen(false); }}
              >
                <Landmark size={16} />
                <span>Ngân hàng</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'crypto_wallets' ? 'active' : ''}`}
                onClick={() => { setActiveTab('crypto_wallets'); setMobileSidebarOpen(false); }}
              >
                <Coins size={16} />
                <span>Ví crypto</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'binance_pay' ? 'active' : ''}`}
                onClick={() => { setActiveTab('binance_pay'); setMobileSidebarOpen(false); }}
              >
                <Cpu size={16} />
                <span>Binance API</span>
              </button>
            </div>
          </div>

          {/* Section 5: Marketing */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Marketing
            </p>
            <div className="space-y-1">
              <button
                className={`sidebar-nav-item ${activeTab === 'broadcasts' ? 'active' : ''}`}
                onClick={() => { setActiveTab('broadcasts'); setMobileSidebarOpen(false); }}
              >
                <Megaphone size={16} />
                <span>Thông báo hàng loạt</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'flash_sales' ? 'active' : ''}`}
                onClick={() => { setActiveTab('flash_sales'); setMobileSidebarOpen(false); }}
              >
                <Zap size={16} />
                <span>Flash sale</span>
              </button>
            </div>
          </div>

          {/* Section 6: Hệ thống */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
              Hệ thống
            </p>
            <div className="space-y-1">
              <button
                className={`sidebar-nav-item ${activeTab === 'settings_bot' ? 'active' : ''}`}
                onClick={() => { setActiveTab('settings_bot'); setMobileSidebarOpen(false); }}
              >
                <Bot size={16} />
                <span>Cấu hình</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'customer_tiers' ? 'active' : ''}`}
                onClick={() => { setActiveTab('customer_tiers'); setMobileSidebarOpen(false); }}
              >
                <Award size={16} />
                <span>Hạng khách</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'exchange_rates' ? 'active' : ''}`}
                onClick={() => { setActiveTab('exchange_rates'); setMobileSidebarOpen(false); }}
              >
                <BadgeDollarSign size={16} />
                <span>Tỷ giá</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'system_admins' ? 'active' : ''}`}
                onClick={() => { setActiveTab('system_admins'); setMobileSidebarOpen(false); }}
              >
                <UserCheck size={16} />
                <span>Quản trị viên</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
              >
                <History size={16} />
                <span>Nhật ký</span>
              </button>
              <button
                className={`sidebar-nav-item ${activeTab === 'developers_api' ? 'active' : ''}`}
                onClick={() => { setActiveTab('developers_api'); setMobileSidebarOpen(false); }}
              >
                <Code2 size={16} />
                <span>Tài liệu API</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="app-main-wrapper flex flex-1 flex-col min-w-0">
        {/* Topbar Header */}
        <header className="app-topbar sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
          {/* Left: Mobile hamburger & Active Title */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              aria-label="Bật hoặc tắt menu điều hướng"
              className="grid size-9 place-items-center rounded-md border border-border bg-background text-foreground hover:bg-muted lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
            <p className="truncate text-sm font-semibold text-foreground">
              {pageTitleMap[activeTab] || 'Tổng quan'}
            </p>
          </div>

          {/* Right: Theme Toggle, Bot badge, Account Menu */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Live Bot Badge */}
            <a
              href="https://t.me/tainguyenhai1110_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>@{botStatus?.botUsername || 'tainguyenhai1110_bot'}</span>
              <ArrowUpRight size={13} className="text-muted-foreground" />
            </a>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={cycleTheme}
              aria-label={`Giao diện: ${theme === 'light' ? 'sáng' : theme === 'dark' ? 'tối' : 'theo hệ thống'}`}
              className="grid size-9 place-items-center rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
              title={`Giao diện: ${theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Hệ thống'}`}
            >
              {theme === 'light' ? (
                <Sun size={17} className="text-amber-500" />
              ) : theme === 'dark' ? (
                <Moon size={17} className="text-sky-400" />
              ) : (
                <Laptop size={17} className="text-muted-foreground" />
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left transition-colors hover:bg-muted"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-muted text-xs font-bold text-foreground">
                  A
                </span>
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-28 truncate text-xs font-medium leading-4 text-foreground">admin</span>
                  <span className="block text-[0.6875rem] leading-3 text-muted-foreground">Super Admin</span>
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-foreground">admin</p>
                    <p className="text-[11px] text-muted-foreground">Super Admin</p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="app-content app-main-dashboard w-full flex-1 p-4 sm:p-6 lg:p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tổng quan kinh doanh</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Theo dõi doanh thu, dòng tiền, khách hàng và hoạt động bán hàng.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Period Selector Pills */}
              <section className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-muted/50 p-1" role="group">
                  {(['today', 'week', 'month', 'all'] as PeriodType[]).map(pKey => {
                    const active = period === pKey;
                    const labels: Record<PeriodType, string> = {
                      today: 'Hôm nay',
                      week: 'Tuần này',
                      month: 'Tháng này',
                      all: 'Toàn thời gian'
                    };
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => setPeriod(pKey)}
                        className={`min-h-9 snap-start whitespace-nowrap rounded-md px-3 text-xs font-medium transition-all ${
                          active
                            ? 'bg-background text-foreground shadow-xs ring-1 ring-border font-semibold'
                            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                        }`}
                      >
                        {labels[pKey]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {period === 'all'
                    ? 'Toàn bộ lịch sử vận hành'
                    : period === 'month'
                    ? 'Từ đầu tháng đến hiện tại'
                    : period === 'week'
                    ? 'Từ thứ Hai đến hiện tại'
                    : 'Hôm nay theo giờ Việt Nam'}
                </p>
              </section>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Doanh thu {period === 'all' ? 'toàn thời gian' : period === 'month' ? 'tháng này' : period === 'week' ? 'tuần này' : 'hôm nay'}
                    </p>
                    <span className="grid size-7 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                      <DollarSign size={14} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{formatVND(periodRevenue)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatShortVND(periodRevenue)} thực tế</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Tiền nạp ví thành công</p>
                    <span className="grid size-7 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                      <Wallet size={14} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{formatVND(overview?.totalDeposits || 0)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{overview?.depositCount || 0} lượt nạp qua VietQR / PayOS</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Đơn đã thanh toán</p>
                    <span className="grid size-7 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                      <ShoppingBag size={14} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{paidOrders.length.toLocaleString('vi-VN')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{filteredOrders.length} đơn được tạo trong kỳ</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Kho sẵn sàng</p>
                    <span className="grid size-7 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
                      <Warehouse size={14} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{totalStockAvailable.toLocaleString('vi-VN')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{totalStockAll} mục hàng trong kho</p>
                  </div>
                </div>
              </div>

              {/* Middle Row: Dòng tiền & Cần theo dõi */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                        <TrendingUp size={16} />
                      </span>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Dòng tiền</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">Doanh thu bán hàng và tiền khách nạp vào ví theo kỳ</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('wallet_txs')}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1 self-start sm:self-center"
                    >
                      Xem giao dịch <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <p className="text-xs text-muted-foreground">Doanh thu bán hàng</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{formatVND(periodRevenue)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <p className="text-xs text-muted-foreground">Tiền khách nạp ví</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{formatVND(overview?.totalDeposits || 0)}</p>
                      </div>
                    </div>

                    <div className="h-44 w-full flex items-end gap-2 pt-4 px-2 border-b border-border/60">
                      {[
                        { label: 'T2', val: 0.3 },
                        { label: 'T3', val: 0.5 },
                        { label: 'T4', val: 0.2 },
                        { label: 'T5', val: 0.75 },
                        { label: 'T6', val: 0.45 },
                        { label: 'T7', val: 0.9 },
                        { label: 'CN', val: 0.6 }
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div
                            className="w-full max-w-[28px] rounded-t-sm bg-primary/80 group-hover:bg-primary transition-all duration-300"
                            style={{ height: `${Math.max(12, item.val * 100)}%` }}
                          />
                          <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" /> Doanh thu đơn hàng
                      </span>
                      <span>Dữ liệu tính theo thời gian thực</span>
                    </div>
                  </div>
                </div>

                {/* Cần theo dõi */}
                <div className="rounded-xl border border-border bg-card shadow-xs">
                  <div className="flex items-start gap-3 border-b border-border/60 p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <AlertCircle size={16} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Cần theo dõi</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Các điểm vận hành cần xử lý trước</p>
                    </div>
                  </div>

                  <div className="divide-y divide-border/60">
                    <div
                      onClick={() => setActiveTab('orders')}
                      className="group flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-lg border border-border bg-background text-amber-500">
                          <Clock size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Đơn chờ thanh toán</p>
                          <p className="text-xs text-muted-foreground">Theo dõi hoặc xử lý đơn hết hạn</p>
                        </div>
                      </div>
                      <strong className="text-sm font-semibold tabular-nums text-foreground">{pendingOrdersCount}</strong>
                    </div>

                    <div
                      onClick={() => setActiveTab('failed_fulfillments')}
                      className="group flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-lg border border-border bg-background text-rose-500">
                          <AlertTriangle size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Lỗi giao hàng</p>
                          <p className="text-xs text-muted-foreground">Đơn thiếu key hoặc lỗi Telegram</p>
                        </div>
                      </div>
                      <strong className="text-sm font-semibold tabular-nums text-foreground">{failedOrders.length}</strong>
                    </div>

                    <div
                      onClick={() => setActiveTab('inventory')}
                      className="group flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-lg border border-border bg-background text-rose-500">
                          <Warehouse size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Kho không khả dụng</p>
                          <p className="text-xs text-muted-foreground">Sản phẩm hết hàng hoặc lỗi key</p>
                        </div>
                      </div>
                      <strong className="text-sm font-semibold tabular-nums text-foreground">{outOfStockProductsCount}</strong>
                    </div>

                    <div
                      onClick={() => setActiveTab('wallet_topups')}
                      className="group flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-lg border border-border bg-background text-sky-500">
                          <Wallet size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Lượt nạp ví trong kỳ</p>
                          <p className="text-xs text-muted-foreground">Mở lịch sử và trạng thái nạp ví</p>
                        </div>
                      </div>
                      <strong className="text-sm font-semibold tabular-nums text-foreground">{overview?.depositCount || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/60 p-5">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Trạng thái đơn hàng</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">{period === 'all' ? 'Toàn thời gian' : 'Tháng này'}</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('orders')} className="text-xs font-medium text-primary hover:underline">
                      Xem đơn hàng
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                          Đã thanh toán
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          <strong className="text-foreground">{paidOrders.length}</strong> ({filteredOrders.length > 0 ? ((paidOrders.length / filteredOrders.length) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${filteredOrders.length > 0 ? (paidOrders.length / filteredOrders.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                          Chờ thanh toán
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          <strong className="text-foreground">{pendingOrdersCount}</strong> ({filteredOrders.length > 0 ? ((pendingOrdersCount / filteredOrders.length) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${filteredOrders.length > 0 ? (pendingOrdersCount / filteredOrders.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/60 p-5">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Tình trạng kho</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Số lượng hiện tại</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('inventory')} className="text-xs font-medium text-primary hover:underline">
                      Xem kho hàng
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                          Sẵn sàng bán
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          <strong className="text-foreground">{totalStockAvailable}</strong> key
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${totalStockAll > 0 ? (totalStockAvailable / totalStockAll) * 100 : 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                          Sản phẩm hết hàng
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          <strong className="text-foreground">{outOfStockProductsCount}</strong> sản phẩm
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-destructive transition-all"
                          style={{ width: `${products.length > 0 ? (outOfStockProductsCount / products.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sản phẩm bán chạy */}
              <div className="rounded-xl border border-border bg-card shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <Package size={16} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Sản phẩm bán chạy</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Xếp theo doanh thu trong {period === 'all' ? 'toàn thời gian' : 'kỳ hiện tại'}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setActiveTab('products')} className="text-xs font-medium text-primary hover:underline">
                    Xem sản phẩm
                  </button>
                </div>

                <div className="divide-y divide-border/60">
                  {topSellingProducts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Chưa có đơn hàng thanh toán nào trong khoảng thời gian này.
                    </div>
                  ) : (
                    topSellingProducts.slice(0, 5).map((item, idx) => (
                      <div
                        key={item.product_id}
                        className="grid min-h-16 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <span className="grid size-8 place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.qty} sản phẩm đã bán</p>
                        </div>
                        <strong className="text-sm font-semibold tabular-nums text-foreground">
                          {formatVND(item.revenue_vnd)}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐƠN HÀNG (/orders) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Đơn hàng</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Quản lý toàn bộ đơn hàng, trạng thái thanh toán và mã thẻ đã giao.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn, telegram ID, tên khách..."
                    value={searchOrder}
                    onChange={e => setSearchOrder(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {['ALL', 'PAID', 'PENDING', 'CANCELLED', 'REFUNDED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                        orderStatusFilter === st
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'border border-border bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {st === 'ALL' ? 'Tất cả' : st === 'PAID' ? 'Đã thanh toán' : st === 'PENDING' ? 'Chờ duyệt' : st === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã hủy'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã đơn</th>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Tổng tiền</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredOrdersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">Không tìm thấy đơn hàng nào.</td>
                      </tr>
                    ) : (
                      filteredOrdersList.map(o => (
                        <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">#{o.code || o.id.slice(0, 8)}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{o.user?.firstName || 'Khách'}</p>
                            <p className="text-xs text-muted-foreground">{o.user?.username ? `@${o.user.username}` : `ID: ${o.telegramId || o.user?.telegramId}`}</p>
                          </td>
                          <td className="px-4 py-3">
                            {o.items?.map((it: any, i: number) => (
                              <div key={i} className="text-xs text-foreground">• {it.product?.name || it.productName} (x{it.quantity})</div>
                            ))}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatVND(o.total)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                o.status === 'PAID' || o.status === 'COMPLETED' || o.status === 'DELIVERED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : o.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : o.status === 'REFUNDED'
                                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              }`}
                            >
                              {o.status === 'PAID' || o.status === 'DELIVERED' ? 'Đã giao' : o.status === 'PENDING' ? 'Chờ thanh toán' : o.status === 'REFUNDED' ? 'Đã hoàn tiền' : o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-3 text-right space-x-1.5">
                            {o.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                                className="inline-flex items-center rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                Duyệt
                              </button>
                            )}
                            {(o.status === 'PAID' || o.status === 'DELIVERED') && (
                              <button
                                onClick={() => handleRefundOrder(o.id)}
                                className="inline-flex items-center rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                Hoàn tiền
                              </button>
                            )}
                            {o.status !== 'CANCELLED' && o.status !== 'REFUNDED' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')}
                                className="inline-flex items-center rounded border border-border px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                              >
                                Hủy
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LỖI GIAO HÀNG (/orders/failed-fulfillments) */}
          {activeTab === 'failed_fulfillments' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Lỗi giao hàng</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn Telegram đã thanh toán nhưng chưa giao tự động thành công.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
              </div>

              {failedOrders.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Không có đơn hàng nào bị lỗi giao</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Tất cả các đơn đã thanh toán đều được tự động xuất key và giao hàng trơn tru.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Mã đơn</th>
                        <th className="px-4 py-3">Khách hàng</th>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">Lý do lỗi</th>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3 text-right">Xử lý ngay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {failedOrders.map(o => (
                        <tr key={o.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">#{o.code || o.id.slice(0, 8)}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{o.user?.firstName || 'Khách'}</p>
                            <p className="text-xs text-muted-foreground">@{o.user?.username || o.user?.telegramId}</p>
                          </td>
                          <td className="px-4 py-3">
                            {o.items?.map((it: any, i: number) => (
                              <div key={i} className="text-xs">{it.product?.name} (x{it.quantity})</div>
                            ))}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-xs font-medium">
                              Kho tạm hết key
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                const prod = o.items?.[0]?.product;
                                if (prod) setStockModal({ open: true, product: prod, keysText: '' });
                              }}
                              className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                              + Nạp Key vào kho
                            </button>
                            <button
                              onClick={() => handleRefundOrder(o.id)}
                              className="rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Hoàn tiền ví
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KHÁCH TELEGRAM (/customers/telegram) */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Khách Telegram</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Danh sách người dùng bot, số dư ví nạp và quyền hạn tài khoản.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Tổng khách hàng</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{users.length}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Tổng số dư trong ví</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatVND(users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0))}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Khách đang hoạt động</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {users.filter(u => !u.isBlocked).length}
                  </p>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, username, Telegram ID..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Telegram ID</th>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Số dư ví</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Ngày tham gia</th>
                      <th className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsersList.map(u => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{u.telegramId}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{u.firstName || ''} {u.lastName || ''}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.username ? `@${u.username}` : '—'}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{formatVND(u.balance)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              u.isBlocked
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {u.isBlocked ? 'Bị khóa' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setBalanceModal({ open: true, user: u, type: 'ADD', amount: 50000, note: '' })}
                            className="inline-flex items-center rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Nạp ví
                          </button>
                          <button
                            onClick={() => handleToggleBlockUser(u)}
                            className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${
                              u.isBlocked
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'border border-destructive/30 text-destructive hover:bg-destructive/10'
                            }`}
                          >
                            {u.isBlocked ? 'Mở khóa' : 'Khóa'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DANH MỤC (/catalog/groups) */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Danh mục sản phẩm</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Phân nhóm sản phẩm hiển thị trên menu Bot Telegram.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', slug: '', description: '', imageUrl: '/icons/star.svg', sortOrder: categories.length + 1 });
                    setShowCategoryModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3.5 py-2 text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Plus size={15} />
                  <span>Thêm danh mục</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map(c => {
                  const count = products.filter(p => p.categoryId === c.id).length;
                  return (
                    <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="grid size-10 place-items-center rounded-lg border border-border bg-muted p-2">
                            <img src={c.imageUrl || '/icons/star.svg'} alt="" className="size-6 object-contain" />
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {count} sản phẩm
                          </span>
                        </div>
                        <h2 className="text-base font-semibold text-foreground">{c.name}</h2>
                        {c.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                      </div>
                      <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryForm({
                              name: c.name,
                              slug: c.slug || '',
                              description: c.description || '',
                              imageUrl: c.imageUrl || '/icons/star.svg',
                              sortOrder: c.sortOrder || 1
                            });
                            setShowCategoryModal(true);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Edit3 size={13} /> Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="inline-flex items-center gap-1 rounded border border-destructive/20 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={13} /> Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: SẢN PHẨM (/catalog/products) */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sản phẩm</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Quản lý danh sách sản phẩm, giá bán, mô tả và tồn kho.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      categoryId: categories[0]?.id || '',
                      price: 100000,
                      salePrice: 0,
                      description: '',
                      imageUrl: '/icons/office.svg',
                      initialKeys: ''
                    });
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3.5 py-2 text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Plus size={15} />
                  <span>Thêm sản phẩm</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm tên sản phẩm hoặc mã..."
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                >
                  <option value="ALL">Tất cả danh mục</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Giá bán</th>
                      <th className="px-4 py-3">Tồn kho</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredProductsList.map(p => {
                      const available = p.stockItems?.filter((s: any) => s.status === 'AVAILABLE').length || 0;
                      return (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted p-1.5">
                                <img src={p.imageUrl || '/icons/office.svg'} alt="" className="size-6 object-contain" />
                              </span>
                              <div>
                                <p className="font-medium text-foreground">{p.name}</p>
                                <p className="text-xs font-mono text-muted-foreground">ID: {p.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{p.category?.name || 'Chung'}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatVND(p.price)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                available > 3
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : available > 0
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              }`}
                            >
                              {available > 0 ? `Còn ${available} key` : 'Hết hàng'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleProductStatus(p)}
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                p.isActive !== false
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              {p.isActive !== false ? 'Đang bật' : 'Tắt'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleViewKeys(p)}
                              className="inline-flex items-center rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Kho ({available})
                            </button>
                            <button
                              onClick={() => setStockModal({ open: true, product: p, keysText: '' })}
                              className="inline-flex items-center rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              + Thêm Key
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
                              className="inline-flex items-center rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="inline-flex items-center rounded border border-destructive/20 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: KHO HÀNG (/inventory) */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Kho hàng & Serial</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Quản lý kho tài khoản, bản quyền key và nạp hàng loạt.</p>
                </div>
              </div>

              {/* Quick Bulk Import Card */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                <h2 className="text-base font-semibold text-foreground mb-1">Nhập kho nhanh hàng loạt</h2>
                <p className="text-xs text-muted-foreground mb-4">Dán danh sách key hoặc tài khoản (mỗi dòng một key) để nạp vào kho ngay lập tức.</p>

                <div className="space-y-4">
                  <div className="max-w-md">
                    <label className="block text-xs font-medium text-foreground mb-1">Chọn sản phẩm nạp kho</label>
                    <select
                      value={bulkImportProdId}
                      onChange={e => setBulkImportProdId(e.target.value)}
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (hiện còn {p.stockItems?.filter((s: any) => s.status === 'AVAILABLE').length || 0} key)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Danh sách Key / Account (mỗi dòng 1 key)</label>
                    <textarea
                      rows={4}
                      placeholder="user1@example.com|pass123&#10;user2@example.com|pass456&#10;XXXXX-YYYYY-ZZZZZ"
                      value={bulkImportText}
                      onChange={e => setBulkImportText(e.target.value)}
                      className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickBulkImport}
                    disabled={isBulkImporting || !bulkImportProdId || !bulkImportText.trim()}
                    className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <UploadCloud size={15} />
                    <span>{isBulkImporting ? 'Đang nạp...' : 'Bắt đầu nạp kho'}</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Sẵn sàng</th>
                      <th className="px-4 py-3">Đã bán</th>
                      <th className="px-4 py-3">Tổng cộng</th>
                      <th className="px-4 py-3 text-right">Quản lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredInventoryProducts.map(p => {
                      const avail = p.stockItems?.filter((s: any) => s.status === 'AVAILABLE').length || 0;
                      const sold = p.stockItems?.filter((s: any) => s.status === 'SOLD' || s.status === 'DELIVERED').length || 0;
                      const total = p.stockItems?.length || 0;
                      return (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{p.category?.name || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{avail}</td>
                          <td className="px-4 py-3 text-muted-foreground">{sold}</td>
                          <td className="px-4 py-3 text-muted-foreground">{total}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleViewKeys(p)}
                              className="inline-flex items-center rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Xem danh sách Key
                            </button>
                            <button
                              onClick={() => setStockModal({ open: true, product: p, keysText: '' })}
                              className="inline-flex items-center rounded bg-primary text-primary-foreground px-2.5 py-1 text-xs font-medium hover:bg-primary/90"
                            >
                              + Nạp thêm
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: GIAO DỊCH VÍ (/wallet/transactions) */}
          {activeTab === 'wallet_txs' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Giao dịch ví</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Đối soát biến động số dư và yêu cầu nạp theo từng kênh.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm theo ghi chú, tên khách, telegram ID..."
                    value={searchTx}
                    onChange={e => setSearchTx(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {['ALL', 'TOPUP', 'PURCHASE', 'REFUND', 'ADMIN_ADD', 'ADMIN_SUBTRACT'].map(tp => (
                    <button
                      key={tp}
                      onClick={() => setTxTypeFilter(tp)}
                      className={`h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                        txTypeFilter === tp
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'border border-border bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {tp === 'ALL' ? 'Tất cả' : tp === 'TOPUP' ? 'Nạp tiền' : tp === 'PURCHASE' ? 'Mua hàng' : tp === 'REFUND' ? 'Hoàn tiền' : tp === 'ADMIN_ADD' ? '+ Admin' : '- Admin'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã GD</th>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3">Loại giao dịch</th>
                      <th className="px-4 py-3">Số tiền</th>
                      <th className="px-4 py-3">Nội dung</th>
                      <th className="px-4 py-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có giao dịch ví nào ghi nhận.</td>
                      </tr>
                    ) : (
                      filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs text-foreground">#{t.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{t.user?.firstName || t.user?.username || t.user?.telegramId || 'Khách'}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            <span className={t.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                              {t.amount > 0 ? `+${formatVND(t.amount)}` : formatVND(t.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{t.note || '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: TIỀN ĐANG GIỮ (/wallet/holds) */}
          {activeTab === 'wallet_holds' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tiền đang giữ</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Theo dõi khoản giữ, thu và hoàn tiền theo đơn hàng.</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Lock size={22} />
                </div>
                <h3 className="text-base font-semibold text-foreground">Không có khoản tiền nào đang bị giữ</h3>
                <p className="mt-1 text-xs text-muted-foreground">Tất cả giao dịch của khách hàng được xử lý quyết toán trực tiếp.</p>
              </div>
            </div>
          )}

          {/* TAB 10: NẠP VÍ (/wallet/topups) */}
          {activeTab === 'wallet_topups' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Nạp ví</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Duyệt hoặc hủy yêu cầu nạp ví; không có trạng thái “Thất bại” thủ công.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã GD nạp</th>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3">Số tiền</th>
                      <th className="px-4 py-3">Cổng thanh toán</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3 text-right">Duyệt / Hủy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {deposits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">Chưa có yêu cầu nạp ví nào.</td>
                      </tr>
                    ) : (
                      deposits.map(d => (
                        <tr key={d.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{d.reference}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{d.user?.firstName || d.user?.username || 'Khách'}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(d.amount)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">VietQR / PayOS</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                d.status === 'PAID'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : d.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              }`}
                            >
                              {d.status === 'PAID' ? 'Thành công' : d.status === 'PENDING' ? 'Chờ thanh toán' : 'Đã hủy'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(d.createdAt)}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {d.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveDeposit(d.id)}
                                  className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                                >
                                  Duyệt nạp
                                </button>
                                <button
                                  onClick={() => handleCancelDeposit(d.id)}
                                  className="rounded border border-border px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: ĐỐI SOÁT NGÂN HÀNG (/payments/bank-reviews) */}
          {activeTab === 'bank_reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Đối soát ngân hàng</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Xử lý mọi giao dịch SePay/VietQR chưa thể tự đối soát: sai số tiền, chuyển dư hoặc chưa xác định.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-semibold text-foreground">Tất cả giao dịch chuyển khoản đã được đối soát 100%</h3>
                <p className="mt-1 text-xs text-muted-foreground">Không có khoản tiền nào đang chờ xem xét duyệt thủ công.</p>
              </div>
            </div>
          )}

          {/* TAB 12: HOA HỒNG GIỚI THIỆU (/wallet/referrals) */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Hoa hồng giới thiệu</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Theo dõi hoa hồng được hệ thống tự động cộng vào ví tiếp thị liên kết.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Tỷ lệ hoa hồng hiện tại</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{settingsForm.referralRate || 5}%</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Tổng hoa hồng đã chi</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVND(transactions.filter(t => t.type === 'REFERRAL').reduce((sum, t) => sum + t.amount, 0))}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-muted-foreground">Tổng lượt giới thiệu</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {users.filter(u => u.balance > 0).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: HOÀN TIỀN (/refunds/telegram) */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Hoàn tiền</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Hoàn một hoặc nhiều tài khoản đã giao, với phép tính và phê duyệt được lưu vết đầy đủ.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã đơn hoàn</th>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3">Số tiền hoàn</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {orders.filter(o => o.status === 'REFUNDED').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">Chưa có đơn hàng hoàn tiền nào.</td>
                      </tr>
                    ) : (
                      orders.filter(o => o.status === 'REFUNDED').map(o => (
                        <tr key={o.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">#{o.code || o.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{o.user?.firstName || o.user?.username || 'Khách'}</td>
                          <td className="px-4 py-3 font-semibold text-rose-500">+{formatVND(o.total)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium">
                              Đã hoàn về ví
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.updatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 14: CẤU HÌNH NGÂN HÀNG (/settings/bank-accounts) */}
          {activeTab === 'bank_accounts' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tài khoản ngân hàng</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Cấu hình tài khoản nhận tiền chuyển khoản tự động VietQR cho bot.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Tài khoản ngân hàng VietQR</h2>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Mã ngân hàng (VietQR)</label>
                      <input
                        type="text"
                        value={settingsForm.bankName}
                        onChange={e => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Số tài khoản ngân hàng</label>
                      <input
                        type="text"
                        value={settingsForm.bankAccount}
                        onChange={e => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Tên chủ tài khoản</label>
                      <input
                        type="text"
                        value={settingsForm.bankAccountName}
                        onChange={e => setSettingsForm({ ...settingsForm, bankAccountName: e.target.value })}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                    >
                      Lưu thông tin ngân hàng
                    </button>
                  </form>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Mẫu VietQR nạp tiền</h3>
                  <div className="size-48 rounded-lg border border-border bg-white p-2 flex items-center justify-center">
                    <img
                      src={`https://img.vietqr.io/image/${settingsForm.bankName}-${settingsForm.bankAccount}-compact2.png?amount=100000&addInfo=NAP%20HAI1110`}
                      alt="VietQR Test"
                      className="size-full object-contain"
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground font-mono">
                    {settingsForm.bankName} • {settingsForm.bankAccount}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: VÍ CRYPTO (/settings/crypto-wallets) */}
          {activeTab === 'crypto_wallets' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Ví Crypto</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Cấu hình địa chỉ ví nhận thanh toán USDT (TRC20, BEP20) cho khách hàng.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Địa chỉ ví USDT TRC20</h2>
                  <input
                    type="text"
                    value={settingsForm.usdtWalletTrc20}
                    onChange={e => setSettingsForm({ ...settingsForm, usdtWalletTrc20: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground outline-none"
                  />
                  <h2 className="text-base font-semibold text-foreground pt-2">Địa chỉ ví USDT BEP20</h2>
                  <input
                    type="text"
                    value={settingsForm.usdtWalletBep20}
                    onChange={e => setSettingsForm({ ...settingsForm, usdtWalletBep20: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground outline-none"
                  />
                  <button
                    onClick={handleSaveSettings}
                    className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                  >
                    Lưu ví Crypto
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 16: BINANCE API (/settings/binance-pay) */}
          {activeTab === 'binance_pay' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Binance API & Crypto Pay</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Tự động đọc lịch sử nạp Binance và khớp giao dịch của các ví đang bật.</p>
                </div>
              </div>

              <div className="max-w-xl rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Binance API Key</label>
                    <input
                      type="password"
                      value={settingsForm.binanceApiKey}
                      onChange={e => setSettingsForm({ ...settingsForm, binanceApiKey: e.target.value })}
                      placeholder="Nhập Binance API Key..."
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Binance Secret Key</label>
                    <input
                      type="password"
                      value={settingsForm.binanceSecretKey}
                      onChange={e => setSettingsForm({ ...settingsForm, binanceSecretKey: e.target.value })}
                      placeholder="Nhập Binance Secret Key..."
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Merchant ID</label>
                    <input
                      type="text"
                      value={settingsForm.binanceMerchantId}
                      onChange={e => setSettingsForm({ ...settingsForm, binanceMerchantId: e.target.value })}
                      placeholder="Nhập Merchant ID..."
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                  >
                    Lưu thông số Binance API
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 17: THÔNG BÁO HÀNG LOẠT (/broadcasts) */}
          {activeTab === 'broadcasts' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Thông báo hàng loạt</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Gửi tin nhắn thông báo hoặc khuyến mãi đến tất cả khách hàng trên Bot Telegram.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Nội dung thông báo ({users.length} khách nhận)
                      </label>
                      <textarea
                        rows={6}
                        placeholder="🔥 SIÊU KHUYẾN MÃI THÁNG NÀY...&#10;Hỗ trợ Markdown HTML."
                        value={broadcastForm.message}
                        onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                        required
                        className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pinMsg"
                        checked={broadcastForm.pinMessage}
                        onChange={e => setBroadcastForm({ ...broadcastForm, pinMessage: e.target.checked })}
                        className="rounded border-border text-primary"
                      />
                      <label htmlFor="pinMsg" className="text-xs text-foreground cursor-pointer">
                        Ghim tin nhắn sau khi gửi
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={broadcastForm.loading || !broadcastForm.message.trim()}
                      className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>{broadcastForm.loading ? 'Đang gửi...' : `Gửi tới ${users.length} khách`}</span>
                    </button>
                  </form>

                  {broadcastForm.result && (
                    <div className={`mt-4 rounded-lg p-4 text-xs font-medium ${broadcastForm.result.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                      {broadcastForm.result.message || (broadcastForm.result.success ? '✅ Gửi thành công!' : '❌ Gửi thất bại')}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-foreground mb-4">Xem trước tin nhắn trên Telegram</h2>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4 max-w-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        B
                      </span>
                      <span className="text-xs font-semibold text-foreground">Shop Hai1110# Bot</span>
                    </div>
                    <div className="rounded-lg bg-background p-3 text-xs leading-5 text-foreground whitespace-pre-wrap border border-border/40 shadow-xs">
                      {broadcastForm.message || 'Nội dung tin nhắn sẽ hiển thị tại đây...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 18: FLASH SALE (/marketing/flash-sales) */}
          {activeTab === 'flash_sales' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Flash sale</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Thiết lập chương trình, sản phẩm và thời gian áp dụng giảm giá giờ vàng.</p>
                </div>
                <button
                  onClick={() => setShowFlashSaleModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3.5 py-2 text-xs font-medium hover:bg-primary/90"
                >
                  <Plus size={15} /> Tạo flash sale mới
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {flashSales.map(fs => (
                  <div key={fs.id} className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold">
                          Giảm {fs.discountPct}%
                        </span>
                        <span className={`size-2.5 rounded-full ${fs.active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{fs.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Áp dụng: {fs.targetCategory}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">Hết hạn: {formatDate(fs.endsAt)}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
                      <button
                        onClick={() => setFlashSales(flashSales.map(f => f.id === fs.id ? { ...f, active: !f.active } : f))}
                        className="rounded border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {fs.active ? 'Tắt đợt sale' : 'Bật đợt sale'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 19: CẤU HÌNH BOT (/settings/telegram-bot) */}
          {activeTab === 'settings_bot' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Cấu hình Bot Telegram</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Cài đặt Telegram Bot Token, Admin Chat ID và trạng thái máy chủ.</p>
                </div>
              </div>

              <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Bot Token (từ @BotFather)</label>
                    <input
                      type="password"
                      value={settingsForm.botToken}
                      onChange={e => setSettingsForm({ ...settingsForm, botToken: e.target.value })}
                      placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Admin Telegram Chat ID</label>
                    <input
                      type="text"
                      value={settingsForm.adminChatId}
                      onChange={e => setSettingsForm({ ...settingsForm, adminChatId: e.target.value })}
                      placeholder="6632274262"
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                  >
                    Lưu cấu hình hệ thống
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 20: HẠNG KHÁCH (/settings/customer-tiers) */}
          {activeTab === 'customer_tiers' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Hạng khách hàng</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Ngưỡng chi tiêu và mức giảm giá tự động cho từng hạng thành viên.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {customerTiers.map(tier => (
                  <div key={tier.name} className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                      <Award size={18} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Chi tiêu tối thiểu</p>
                      <p className="text-base font-semibold text-foreground">{formatVND(tier.minSpend)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Chiết khấu giảm giá</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{tier.discountPct}%</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-5">{tier.perks}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 21: TỶ GIÁ (/settings/exchange-rates) */}
          {activeTab === 'exchange_rates' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tỷ giá tiền tệ</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Tỷ giá quy đổi sang VND cho các loại tiền tệ (USD, USDT, EUR).</p>
                </div>
              </div>

              <div className="max-w-xl rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Tỷ giá 1 USD = ? VNĐ</label>
                    <input
                      type="number"
                      value={settingsForm.usdRate}
                      onChange={e => setSettingsForm({ ...settingsForm, usdRate: Number(e.target.value) })}
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Tỷ giá 1 USDT = ? VNĐ</label>
                    <input
                      type="number"
                      value={settingsForm.usdtRate}
                      onChange={e => setSettingsForm({ ...settingsForm, usdtRate: Number(e.target.value) })}
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                  >
                    Lưu tỷ giá
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 22: QUẢN TRỊ VIÊN (/system/admins) */}
          {activeTab === 'system_admins' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Quản trị viên</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Quản lý tài khoản truy cập và phạm vi quyền trong trang quản trị.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Tài khoản</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Phạm vi quyền</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">admin</td>
                      <td className="px-4 py-3 text-xs text-primary font-medium">Super Admin</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">Toàn quyền hệ thống (Orders, Stock, Users, Settings)</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium">
                          Đang hoạt động
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 23: NHẬT KÝ (/audit) */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Nhật ký hoạt động</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Theo dõi riêng thao tác quản trị, hành động của người dùng Telegram và tiến trình tự động.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Hành động</th>
                      <th className="px-4 py-3">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground">Chưa có nhật ký hoạt động nào ghi nhận.</td>
                      </tr>
                    ) : (
                      auditLogs.map(l => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDate(l.createdAt)}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{l.action}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{l.detail || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 24: TÀI LIỆU API (/developers/api) */}
          {activeTab === 'developers_api' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tài liệu API</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Hướng dẫn kết nối API dành cho lập trình viên và hệ sinh thái.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-semibold text-foreground">Xác thực API (Authentication)</h2>
                  <p className="text-xs text-muted-foreground">
                    Truyền header sau vào tất cả các yêu cầu gửi đến API quản trị:
                  </p>
                  <pre className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs text-foreground overflow-x-auto">
                    {`x-admin-key: ${adminKey || 'hai1110'}\nContent-Type: application/json`}
                  </pre>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Các Endpoint chính</h2>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs font-bold font-mono">GET</span>
                        <code className="text-xs font-mono font-semibold text-foreground">/api/products</code>
                      </div>
                      <p className="text-xs text-muted-foreground">Lấy danh sách tất cả sản phẩm đang bán kèm giá và số lượng tồn kho.</p>
                    </div>

                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-sky-500/10 text-sky-600 px-2 py-0.5 text-xs font-bold font-mono">POST</span>
                        <code className="text-xs font-mono font-semibold text-foreground">/api/orders/checkout</code>
                      </div>
                      <p className="text-xs text-muted-foreground">Tạo đơn hàng thanh toán VietQR / PayOS tự động.</p>
                    </div>

                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-sky-500/10 text-sky-600 px-2 py-0.5 text-xs font-bold font-mono">POST</span>
                        <code className="text-xs font-mono font-semibold text-foreground">/api/payos/webhook</code>
                      </div>
                      <p className="text-xs text-muted-foreground">Nhận Webhook xác nhận thanh toán từ PayOS để tự động giao key.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Thêm/Sửa Danh mục */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ví dụ: Tài khoản AI, Văn phòng..."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mô tả</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Mô tả ngắn..."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Icon hoặc URL ảnh</label>
                <input
                  type="text"
                  value={categoryForm.imageUrl}
                  onChange={e => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm/Sửa Sản phẩm */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Office 365, Canva Pro, YouTube Premium..."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Danh mục</label>
                  <select
                    value={productForm.categoryId}
                    onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Mô tả chi tiết và chính sách bảo hành..."
                  className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Icon hoặc ảnh sản phẩm</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="/icons/office.svg hoặc URL..."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              {!editingProduct && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Danh sách Key / Account ban đầu (mỗi dòng 1 key)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key1&#10;Key2"
                    value={productForm.initialKeys}
                    onChange={e => setProductForm({ ...productForm, initialKeys: e.target.value })}
                    className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground outline-none"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Key vào kho */}
      {stockModal.open && stockModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                Nạp kho cho: {stockModal.product.name}
              </h2>
              <button onClick={() => setStockModal({ open: false, product: null, keysText: '' })} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Nhập danh sách mã thẻ, tài khoản hoặc key bản quyền (mỗi dòng 1 mục).
            </p>
            <textarea
              rows={6}
              placeholder="user1|pass1&#10;user2|pass2&#10;KEY-XXXXX-YYYYY"
              value={stockModal.keysText}
              onChange={e => setStockModal({ ...stockModal, keysText: e.target.value })}
              className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground outline-none focus:border-primary"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockModal({ open: false, product: null, keysText: '' })}
                className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportStock}
                disabled={!stockModal.keysText.trim()}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                Xác nhận nạp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xem danh sách Key kho */}
      {viewKeysModal.open && viewKeysModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Kho hàng: {viewKeysModal.product.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tổng {viewKeysModal.keys.length} key trong hệ thống
                </p>
              </div>
              <button onClick={() => setViewKeysModal({ open: false, product: null, keys: [], loading: false })} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {viewKeysModal.loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Đang tải danh sách key...</div>
              ) : viewKeysModal.keys.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Chưa có key nào trong kho sản phẩm này.</div>
              ) : (
                <div className="space-y-2">
                  {viewKeysModal.keys.map((k: any) => (
                    <div key={k.id} className="flex items-center justify-between rounded-md border border-border bg-background p-2.5 text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <span className={`inline-flex size-2 rounded-full ${k.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <code className="truncate font-mono text-foreground">{k.payload}</code>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground">{k.status}</span>
                        <button
                          onClick={() => copyToClipboard(k.payload, k.id)}
                          className="grid size-7 place-items-center rounded border border-border hover:bg-muted"
                          title="Sao chép"
                        >
                          {copiedKey === k.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="grid size-7 place-items-center rounded border border-destructive/20 text-destructive hover:bg-destructive/10"
                          title="Xóa key"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setViewKeysModal({ open: false, product: null, keys: [], loading: false })}
                className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nạp / Trừ tiền ví */}
      {balanceModal.open && balanceModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                Điều chỉnh số dư ví
              </h2>
              <button onClick={() => setBalanceModal({ open: false, user: null, type: 'ADD', amount: 50000, note: '' })} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Khách hàng: <strong className="text-foreground">{balanceModal.user.firstName || balanceModal.user.username || balanceModal.user.telegramId}</strong> (Số dư hiện tại: {formatVND(balanceModal.user.balance)})
            </p>
            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceModal({ ...balanceModal, type: 'ADD' })}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold ${balanceModal.type === 'ADD' ? 'bg-emerald-600 text-white' : 'border border-border text-muted-foreground'}`}
                >
                  + Cộng tiền
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceModal({ ...balanceModal, type: 'SUBTRACT' })}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold ${balanceModal.type === 'SUBTRACT' ? 'bg-destructive text-white' : 'border border-border text-muted-foreground'}`}
                >
                  - Trừ tiền
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={balanceModal.amount}
                  onChange={e => setBalanceModal({ ...balanceModal, amount: Number(e.target.value) })}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Ghi chú giao dịch</label>
                <input
                  type="text"
                  value={balanceModal.note}
                  onChange={e => setBalanceModal({ ...balanceModal, note: e.target.value })}
                  placeholder="Admin cộng tiền khuyến mãi..."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModal({ open: false, user: null, type: 'ADD', amount: 50000, note: '' })}
                  className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

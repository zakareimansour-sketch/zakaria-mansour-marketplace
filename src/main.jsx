import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { legalPages } from './legal.js';

const logo = '/assets/brand/original/zakaria-mansour-logo-original.png';

const Icon = ({ name, size = 20 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6"/></>,
    cart: <><path d="M3 4h2l2.3 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/></>,
    code: <><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h3a6 6 0 0 0 6-6c0-3-4-5-9-5Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="15" cy="7" r="1"/></>,
    play: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2"/></>,
    package: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9"/></>,
    shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3 8 7.5 9.5 4.5-1.5 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-5"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
    message: <><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></>,
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h11"/><path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z"/></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    chevron: <path d="m8 10 4 4 4-4"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></>,
    facebook: <path d="M14 21v-8h3l.5-3H14V8.5c0-1 .3-1.5 1.7-1.5H18V4.2c-.6-.1-1.5-.2-2.7-.2-2.8 0-4.6 1.7-4.6 4.7V10H8v3h2.7v8H14Z"/>,
    whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.8 7l-4.2 1 1.1-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.5 3 2 4.5 5 5"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM5 14l.7 2 2 .7-2 .7L5 19.5l-.7-2.1-2-.7 2-.7L5 14Z"/></>,
    bot: <><rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 3v4M9 12h.01M15 12h.01M8 16h8"/></>,
    send: <><path d="m3 4 18 8-18 8 3-8-3-8Z"/><path d="M6 12h15"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const categories = [
  { icon: 'download', title: 'منتجات رقمية', en: 'Digital Products', desc: 'ملفات، كتب، قوالب وأدوات جاهزة', color: 'cyan' },
  { icon: 'code', title: 'برمجيات', en: 'Software', desc: 'حلول وأكواد ومنتجات تقنية', color: 'blue' },
  { icon: 'palette', title: 'تصميم وإبداع', en: 'Creative', desc: 'هويات، تصاميم وأصول إبداعية', color: 'violet' },
  { icon: 'briefcase', title: 'خدمات احترافية', en: 'Services', desc: 'خبراء ينفذون مشروعك باحتراف', color: 'gold' },
  { icon: 'play', title: 'كورسات', en: 'Courses', desc: 'تعلم مهارات جديدة من الخبراء', color: 'rose' },
  { icon: 'package', title: 'منتجات مختارة', en: 'Products', desc: 'منتجات مميزة من بائعين موثوقين', color: 'emerald' }
];

const products = [
  { id:'demo-1', type: 'digital', typeLabel:'قالب احترافي', title: 'حزمة إدارة الأعمال المتكاملة', seller: 'ZM Studio', price: '$24', priceValue:24, currency:'USD', old: '$39', rating: '4.9', color: 'blue', icon: 'briefcase', description:'حزمة رقمية منظمة تساعدك على إدارة مشروعك وملفاتك وخططك بكفاءة.' },
  { id:'demo-2', type: 'course', typeLabel:'كورس رقمي', title: 'ابدأ مشروعك الرقمي من الصفر', seller: 'Zakaria Academy', price: '$18', priceValue:18, currency:'USD', old: '$30', rating: '4.8', color: 'violet', icon: 'play', description:'مسار تعليمي عملي يحول فكرتك إلى مشروع رقمي منظم قابل للتطوير.' },
  { id:'demo-3', type: 'service', typeLabel:'خدمة', title: 'تصميم هوية بصرية احترافية', seller: 'Creative House', price: '$45', priceValue:45, currency:'USD', old: '', rating: '5.0', color: 'gold', icon: 'palette', description:'خدمة تصميم متكاملة لبناء هوية واضحة ومتناسقة تناسب نشاطك.' },
  { id:'demo-4', type: 'software', typeLabel:'برنامج', title: 'لوحة متابعة المبيعات الذكية', seller: 'ZM Software', price: '$32', priceValue:32, currency:'USD', old: '$49', rating: '4.7', color: 'emerald', icon: 'code', description:'لوحة سهلة لمتابعة المبيعات والنتائج واتخاذ قرارات أفضل.' }
];

const cookieValue = name => typeof document === 'undefined' ? '' : document.cookie.split('; ').find(row=>row.startsWith(`${name}=`))?.split('=').slice(1).join('=') || '';
const sessionFetch = (url, options={}) => {
  const method=(options.method||'GET').toUpperCase();
  const headers={...(options.headers||{})};
  if(['POST','PUT','PATCH','DELETE'].includes(method)){const csrf=decodeURIComponent(cookieValue('zm_csrf'));if(csrf)headers['x-csrf-token']=csrf;}
  return fetch(url,{...options,headers,credentials:'include'});
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lang, setLang] = useState('AR');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState({ items: [], count: 0, subtotalCents: 0, currency: 'USD' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuery, setProductQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [storeNotice, setStoreNotice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [legalPage, setLegalPage] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: 'أهلًا بك! أنا مساعد ZM الذكي. أخبرني ماذا تبحث عنه وسأساعدك في الوصول إليه.' }
  ]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({ name:'Zakaria Mansour', email:'zakareimansour@gmail.com', password:'', token:'' });
  const [setupError, setSetupError] = useState('');
  const [apiProducts, setApiProducts] = useState([]);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({ orders: [], library: [], adminOrders: [], products: [], application: null, overview: null, applications: [], reviews: [], categories: [] });
  const [sellerApplicationForm, setSellerApplicationForm] = useState({ storeName: '', description: '' });
  const [productForm, setProductForm] = useState({ categoryId: '1', titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', productType: 'digital', price: '', currency: 'USD', publishNow: false });

  const saveSession = (_token, user) => {
    setCurrentUser(user);
    setAuthOpen(false);
    setAuthError('');
    if (location.protocol !== 'file:') sessionFetch(`/api/cart?lang=${lang.toLowerCase()}`).then(r=>r.ok?r.json():Promise.reject()).then(data=>setCart(data.cart)).catch(()=>{});
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true); setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login' ? { email: authForm.email, password: authForm.password } : { name: authForm.name, email: authForm.email, password: authForm.password, preferredLanguage: lang.toLowerCase() };
      const response = await sessionFetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'تعذر إتمام العملية.');
      saveSession(data.token, data.user);
    } catch (error) {
      setAuthError(location.protocol === 'file:' ? 'تسجيل الدخول يحتاج تشغيل نسخة الخادم، أما ملف المعاينة المستقل فهو لمراجعة التصميم.' : error.message);
    } finally { setAuthLoading(false); }
  };

  const submitOwnerSetup = async event => {
    event.preventDefault(); setAuthLoading(true); setSetupError('');
    try { const response=await sessionFetch('/api/setup/owner',{method:'POST',headers:{'content-type':'application/json','x-setup-token':setupForm.token},body:JSON.stringify({name:setupForm.name,email:setupForm.email,password:setupForm.password})}); const data=await response.json(); if(!response.ok)throw new Error(data.message||'تعذر إعداد حساب المالك.'); saveSession(data.token,data.user); setSetupRequired(false); setSetupOpen(false); setStoreNotice('تم إنشاء حساب المالك وتأمينه بنجاح.'); } catch(error){setSetupError(error.message)} finally{setAuthLoading(false)}
  };

  const logout = async () => { try { if(location.protocol!=='file:') await sessionFetch('/api/auth/logout',{method:'POST'}); } catch {} setCurrentUser(null); setCart({ items: [], count: 0, subtotalCents: 0, currency: 'USD' }); setAuthOpen(false); };

  const addToCart = async (product) => {
    if (String(product.id).startsWith('demo-') || location.protocol === 'file:') {
      setCart(current => {
        const exists = current.items.some(item=>item.product_id===product.id);
        const items = exists ? current.items : [...current.items,{ product_id:product.id,title:product.title,seller_name:product.seller,quantity:1,price_cents:Math.round(product.priceValue*100),currency:product.currency,product_type:product.type }];
        return { items, count:items.length, subtotalCents:items.reduce((sum,item)=>sum+item.price_cents*item.quantity,0), currency:product.currency };
      }); setCartOpen(true); return;
    }
    if (!currentUser) { setAuthMode('login'); setAuthOpen(true); setStoreNotice('سجل الدخول أولًا لإضافة المنتج إلى سلتك.'); return; }
    try {
      const response = await sessionFetch('/api/cart/items',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId:Number(product.id),quantity:1})});
      const data=await response.json(); if(!response.ok) throw new Error(data.message||'تعذر إضافة المنتج.'); setCart(data.cart); setCartOpen(true);
    } catch(error){ setStoreNotice(error.message); }
  };

  const removeCartItem = async (productId) => {
    if (String(productId).startsWith('demo-') || location.protocol === 'file:') {
      setCart(current=>{const items=current.items.filter(item=>item.product_id!==productId);return{...current,items,count:items.length,subtotalCents:items.reduce((sum,item)=>sum+item.price_cents*item.quantity,0)}}); return;
    }
    const response=await sessionFetch(`/api/cart/items/${productId}`,{method:'DELETE'}); const data=await response.json(); if(response.ok)setCart(data.cart);
  };

  const createOrder = async () => {
    if (location.protocol === 'file:' || cart.items.some(item=>String(item.product_id).startsWith('demo-'))) { setStoreNotice('هذه سلة معاينة. إنشاء الطلب الحقيقي يعمل عند تشغيل الموقع مع الخادم.'); return; }
    try { const response=await sessionFetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({paymentMethod})}); const data=await response.json(); if(!response.ok)throw new Error(data.message||'تعذر إنشاء الطلب.'); setCart({items:[],count:0,subtotalCents:0,currency:'USD'}); setCartOpen(false); setStoreNotice(`تم إنشاء الطلب ${data.order.order_number} بنجاح.`); } catch(error){setStoreNotice(error.message)}
  };

  const apiRequest = async (path, options={}) => {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response=await sessionFetch(path,{...options,headers:{...(options.body&&!isFormData?{'content-type':'application/json'}:{}),...(options.headers||{})}});
    const data=await response.json(); if(!response.ok)throw new Error(data.message||'تعذر تنفيذ العملية.'); return data;
  };

  const loadDashboard = async () => {
    if (!currentUser || location.protocol==='file:') { setDashboardOpen(true); return; }
    setDashboardOpen(true); setDashboardLoading(true);
    try {
      const base=await Promise.all([apiRequest('/api/orders'),fetch('/api/categories').then(r=>r.json()),apiRequest('/api/seller/application'),apiRequest('/api/library')]);
      const next={orders:base[0].orders||[],categories:base[1].categories||[],application:base[2].application,library:base[3].items||[],adminOrders:[],products:[],overview:null,applications:[],reviews:[]};
      if(['seller','owner','admin'].includes(currentUser.role)) next.products=(await apiRequest('/api/seller/products')).products||[];
      if(['owner','admin','moderator','support','finance'].includes(currentUser.role)) next.overview=(await apiRequest('/api/admin/overview')).overview;
      if(['owner','admin','support','finance'].includes(currentUser.role)) next.adminOrders=(await apiRequest('/api/admin/orders')).orders||[];
      if(['owner','admin','moderator'].includes(currentUser.role)){next.applications=(await apiRequest('/api/admin/seller-applications')).applications||[];next.reviews=(await apiRequest('/api/admin/products/review')).products||[];}
      setDashboardData(next);
    } catch(error){setStoreNotice(error.message)} finally{setDashboardLoading(false)}
  };

  const submitSellerApplication = async event => {
    event.preventDefault();
    try{await apiRequest('/api/seller/applications',{method:'POST',body:JSON.stringify(sellerApplicationForm)});setStoreNotice('تم إرسال طلب البائع للمراجعة.');loadDashboard();}catch(error){setStoreNotice(error.message)}
  };

  const submitProduct = async event => {
    event.preventDefault();
    const directPublish = productForm.publishNow && ['owner','admin'].includes(currentUser?.role);
    const body={categoryId:Number(productForm.categoryId),titleAr:productForm.titleAr,titleEn:productForm.titleEn,descriptionAr:productForm.descriptionAr,descriptionEn:productForm.descriptionEn,productType:productForm.productType,priceCents:Math.round(Number(productForm.price)*100),currency:productForm.currency,submitForReview:!directPublish,publishNow:directPublish};
    try{const created=await apiRequest('/api/seller/products',{method:'POST',body:JSON.stringify(body)});setStoreNotice(created.fileRequiredBeforePublish?'تم حفظ المنتج كمسودة. ارفع الملف الرقمي ثم اضغط نشر.':directPublish?'تم نشر منتجك مباشرة.':'تم إرسال المنتج لمراجعة الإدارة.');setProductForm({...productForm,titleAr:'',titleEn:'',descriptionAr:'',descriptionEn:'',price:'',publishNow:false});loadDashboard();}catch(error){setStoreNotice(error.message)}
  };

  const decideSeller = async (id,decision) => {try{await apiRequest(`/api/admin/seller-applications/${id}`,{method:'PATCH',body:JSON.stringify({decision,note:''})});setStoreNotice(decision==='approved'?'تم قبول البائع.':'تم رفض الطلب.');loadDashboard();}catch(error){setStoreNotice(error.message)}};
  const decideProduct = async (id,decision) => {try{await apiRequest(`/api/admin/products/${id}/review`,{method:'PATCH',body:JSON.stringify({decision,note:''})});setStoreNotice(decision==='published'?'تم نشر المنتج.':'تم رفض المنتج.');loadDashboard();}catch(error){setStoreNotice(error.message)}};
  const uploadProductAsset = async (productId, file, kind) => {
    if(!file)return; const form=new FormData(); form.append(kind==='image'?'image':'file',file); if(kind==='file')form.append('version','1.0');
    try{await apiRequest(`/api/seller/products/${productId}/${kind==='image'?'images':'digital-files'}`,{method:'POST',body:form});setStoreNotice(kind==='image'?'تم رفع الصورة وتحسينها بنجاح.':'تم حفظ الملف في التخزين الخاص المحمي.');loadDashboard();}catch(error){setStoreNotice(error.message)}
  };
  const publishProduct = async productId => {try{const result=await apiRequest(`/api/seller/products/${productId}/publish`,{method:'POST'});setStoreNotice(result.status==='published'?'تم نشر المنتج وأصبح متاحًا للبيع.':'تم إرسال المنتج للمراجعة.');loadDashboard();}catch(error){setStoreNotice(error.message)}};
  const updateOrderStatus = async (orderId,status) => {try{await apiRequest(`/api/admin/orders/${orderId}/status`,{method:'PATCH',body:JSON.stringify({status})});setStoreNotice(status==='paid'?'تم تأكيد الدفع وإصدار صلاحيات التحميل.':'تم تحديث حالة الطلب.');loadDashboard();}catch(error){setStoreNotice(error.message)}};
  const downloadLibraryItem = async grantId => {try{const data=await apiRequest(`/api/library/${grantId}/link`,{method:'POST'});window.open(data.url,'_blank','noopener');setStoreNotice(`رابط صالح لمدة 5 دقائق. متبقي ${data.remainingDownloads} تحميلات قبل هذه العملية.`);}catch(error){setStoreNotice(error.message)}};

  const sendAiMessage = () => {
    const value = aiInput.trim();
    if (!value) return;
    setAiMessages(messages => [...messages, { role: 'user', text: value }, { role: 'assistant', text: 'فهمت طلبك. هذه نسخة تجريبية محلية الآن؛ بعد ربط Groq سأبحث في المنتجات والخدمات الحقيقية وأعطيك اقتراحات دقيقة بلغتك.' }]);
    setAiInput('');
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'AR' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if(location.protocol!=='file:') sessionFetch('/api/setup/status').then(r=>r.json()).then(data=>{setSetupRequired(!data.ownerConfigured);setSetupOpen(!data.ownerConfigured)}).catch(()=>{});
  }, []);

  useEffect(() => {
    if (location.protocol !== 'file:') sessionFetch('/api/me')
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { setCurrentUser(data.user); return sessionFetch(`/api/cart?lang=${lang.toLowerCase()}`); })
      .then(response=>response?.ok?response.json():Promise.reject())
      .then(data=>setCart(data.cart))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (location.protocol === 'file:') return;
    fetch(`/api/products?lang=${lang.toLowerCase()}`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setApiProducts(data.products || []))
      .catch(() => setApiProducts([]));
  }, [lang]);

  const displayedProducts = apiProducts.length ? apiProducts.map((item, index) => ({
    id:item.id, type:item.product_type, typeLabel:item.product_type, title:item.title, seller:item.seller_name, description:item.description, imageUrl:item.image_url,
    price: new Intl.NumberFormat(lang === 'AR' ? 'ar-EG' : 'en-US', { style: 'currency', currency: item.currency }).format(item.price_cents / 100), priceValue:item.price_cents/100, currency:item.currency,
    old: '', rating: 'جديد', color: ['blue','violet','gold','emerald'][index % 4],
    icon: ({ digital:'download', software:'code', creative:'palette', service:'briefcase', course:'play', physical:'package' })[item.product_type] || 'package'
  })) : products;
  const filteredProducts = displayedProducts.filter(product => (productFilter==='all'||product.type===productFilter) && (!productQuery.trim()||`${product.title} ${product.seller} ${product.description||''}`.toLowerCase().includes(productQuery.trim().toLowerCase())));

  return <div className="app">
    <div className="announcement">
      <div className="container announcement-inner">
        <span><span className="live-dot"/> انضم إلى الجيل الجديد من التجارة الرقمية</span>
        <div className="announcement-links"><a href="#seller">ابدأ البيع</a><span/> <a href="#support">الدعم</a></div>
      </div>
    </div>

    <header className="header">
      <div className="container nav">
        <a className="brand" href="#home" aria-label="Zakaria Mansour home">
          <span className="brand-mark">ZM</span>
          <span className="brand-copy"><b>ZAKARIA MANSOUR</b><small>السوق الرقمي العالمي</small></span>
        </a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#home" className="active" onClick={()=>setMenuOpen(false)}>الرئيسية</a>
          <a href="#categories" onClick={()=>setMenuOpen(false)}>التصنيفات</a>
          <a href="#featured" onClick={()=>setMenuOpen(false)}>الأكثر تميزًا</a>
          <a href="#services" onClick={()=>setMenuOpen(false)}>الخدمات</a>
          <a href="#seller" onClick={()=>setMenuOpen(false)}>كن بائعًا</a>
        </nav>
        <div className="nav-actions">
          <button className="text-action" onClick={()=>setLang(lang === 'AR' ? 'EN' : 'AR')}>{lang}</button>
          <button className="icon-button" aria-label="بحث" onClick={()=>setSearchOpen(true)}><Icon name="search"/></button>
          {currentUser ? <div className="account-chip"><button onClick={()=>setAuthOpen(true)} title={currentUser.name}>{currentUser.name.charAt(0).toUpperCase()}</button><span>{currentUser.name.split(' ')[0]}</span><button className="logout-mini" onClick={logout} aria-label="تسجيل الخروج"><Icon name="logout" size={16}/></button></div> : <button className="icon-button hide-small" aria-label="تسجيل الدخول" onClick={()=>{setAuthMode('login');setAuthOpen(true)}}><Icon name="user"/></button>}
          <button className="icon-button cart" aria-label="السلة" onClick={()=>setCartOpen(true)}><Icon name="cart"/><i>{cart.count}</i></button>
          <button className="icon-button mobile-menu" aria-label="القائمة" onClick={()=>setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'}/></button>
        </div>
      </div>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="orb orb-one"/><div className="orb orb-two"/>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span><Icon name="star" size={15}/></span> منصة واحدة، فرص بلا حدود</div>
            <h1>اكتشف. تعلّم.<br/><em>ابنِ مستقبلك.</em></h1>
            <p>سوق عالمي يجمع أفضل المنتجات الرقمية والخدمات والكورسات، من مبدعين وخبراء تثق بهم.</p>
            <div className="hero-actions">
              <a href="#categories" className="primary-btn">استكشف السوق <Icon name="arrow"/></a>
              <a href="#seller" className="secondary-btn">ابدأ البيع الآن</a>
            </div>
            <div className="hero-stats">
              <div><strong>100%</strong><span>تجربة رقمية</span></div>
              <i/><div><strong>24/7</strong><span>وصول ودعم</span></div>
              <i/><div><strong>عالمي</strong><span>لغات وعملات</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="gold-ring ring-a"/><div className="gold-ring ring-b"/>
            <div className="logo-stage"><div className="stage-shine"/><img src={logo} alt="شعار زكريا منصور الأصلي"/></div>
            <div className="floating-card card-top"><span className="mini-icon violet"><Icon name="globe"/></span><div><b>سوق عالمي</b><small>تسوّق من أي مكان</small></div><span className="status-dot"/></div>
            <div className="floating-card card-bottom"><span className="mini-icon gold"><Icon name="shield"/></span><div><b>تجربة موثوقة</b><small>حماية ومراجعة مستمرة</small></div><Icon name="check" size={18}/></div>
          </div>
        </div>
        <div className="scroll-hint"><span>اكتشف المزيد</span><i/></div>
      </section>

      <section className="section categories" id="categories">
        <div className="container">
          <div className="section-head"><div><span className="section-kicker">كل ما تحتاجه في مكان واحد</span><h2>اكتشف عالمًا من <em>الإمكانيات</em></h2></div><a href="#all">عرض كل التصنيفات <Icon name="arrow" size={18}/></a></div>
          <div className="category-grid">{categories.map((cat, i)=><a className="category-card" href="#featured" key={cat.title} style={{'--delay': `${i*60}ms`}}><span className={`category-icon ${cat.color}`}><Icon name={cat.icon} size={27}/></span><div><h3>{cat.title}</h3><small>{cat.en}</small><p>{cat.desc}</p></div><span className="card-arrow"><Icon name="arrow" size={18}/></span></a>)}</div>
        </div>
      </section>

      <section className="section ai-section" id="ai-assistant">
        <div className="ai-particles" aria-hidden="true">{Array.from({length: 18}).map((_,i)=><i key={i} style={{'--i':i}}/>)}</div>
        <div className="container ai-grid">
          <div className="ai-copy">
            <div className="ai-label"><Icon name="sparkles" size={16}/> ZM INTELLIGENCE</div>
            <h2>مساعد ذكي يفهمك.<br/><em>ويقربك من هدفك.</em></h2>
            <p>ابحث بلغتك، صف ما تحتاجه بطريقتك، واحصل على اقتراحات من المنتجات والخدمات والكورسات المناسبة—مع بقاء القرار دائمًا لك.</p>
            <div className="ai-capabilities">
              <span><Icon name="check" size={15}/> بحث واقتراح ذكي</span>
              <span><Icon name="check" size={15}/> دعم متعدد اللغات</span>
              <span><Icon name="check" size={15}/> أدوات احترافية للبائع</span>
              <span><Icon name="check" size={15}/> تحويل آمن للدعم البشري</span>
            </div>
            <button className="ai-try-btn" onClick={()=>setAiOpen(true)}><Icon name="sparkles"/> جرّب المساعد الآن</button>
          </div>
          <div className="ai-visual" aria-label="رسم متحرك لشبكة الذكاء الاصطناعي">
            <svg className="neural-lines" viewBox="0 0 600 470" role="img">
              <defs><linearGradient id="aiGold" x1="0" x2="1"><stop offset="0" stopColor="#5d3b12"/><stop offset=".5" stopColor="#f1ce83"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
              <path className="neural-path p1" d="M70 230 C150 70 260 110 300 230 S450 390 535 235"/>
              <path className="neural-path p2" d="M105 105 C220 190 205 340 310 340 S430 130 520 135"/>
              <path className="neural-path p3" d="M80 355 C175 275 220 260 300 230 S430 200 530 330"/>
              {[ [70,230],[105,105],[80,355],[300,230],[310,340],[520,135],[535,235],[530,330] ].map((p,i)=><circle className="neural-node" key={i} cx={p[0]} cy={p[1]} r={i===3?8:5}/>) }
            </svg>
            <div className="ai-core"><div className="core-ring r1"/><div className="core-ring r2"/><div className="core-ring r3"/><span><Icon name="sparkles" size={38}/></span><b>ZM AI</b><small>INTELLIGENT MARKETPLACE</small></div>
            <div className="ai-float af-one"><Icon name="search"/><span>بحث ذكي</span></div>
            <div className="ai-float af-two"><Icon name="globe"/><span>متعدد اللغات</span></div>
            <div className="ai-float af-three"><Icon name="shield"/><span>خصوصية وتحكم</span></div>
          </div>
        </div>
      </section>

      <section className="section featured" id="featured">
        <div className="container">
          <div className="section-head"><div><span className="section-kicker">اختيارات تستحق اهتمامك</span><h2>منتجات <em>مميزة</em></h2></div><div className="product-search"><Icon name="search" size={17}/><input value={productQuery} onChange={e=>setProductQuery(e.target.value)} placeholder="ابحث في المنتجات..."/></div></div>
          <div className="store-filters">{[['all','الكل'],['digital','رقمي'],['software','برمجيات'],['creative','تصميم'],['service','خدمات'],['course','كورسات'],['physical','مادي']].map(([value,label])=><button key={value} className={productFilter===value?'active':''} onClick={()=>setProductFilter(value)}>{label}</button>)}</div>
          <div className="product-grid">{filteredProducts.map((product)=><article className="product-card" key={product.id||product.title} onClick={()=>setSelectedProduct(product)}>
            <div className={`product-art ${product.color}`}>{product.imageUrl?<img src={product.imageUrl} alt={product.title}/>:<><span className="art-icon"><Icon name={product.icon} size={48}/></span><div className="art-lines"/></>}<span className="product-badge">{product.typeLabel||product.type}</span></div>
            <div className="product-info"><div className="rating"><Icon name="star" size={14}/> {product.rating} <span>{product.rating==='جديد'?'':'(+120)'}</span></div><h3>{product.title}</h3><p>بواسطة <b>{product.seller}</b></p><div className="price-row"><div><strong>{product.price}</strong>{product.old && <del>{product.old}</del>}</div><button aria-label="إضافة للسلة" onClick={event=>{event.stopPropagation();addToCart(product)}}><Icon name="cart" size={18}/></button></div></div>
          </article>)}</div>
          {!filteredProducts.length && <div className="empty-products"><Icon name="search" size={30}/><b>لا توجد نتائج مطابقة</b><span>جرّب كلمة أو تصنيفًا مختلفًا.</span></div>}
          <div className="center-action"><button className="outline-btn">مشاهدة جميع المنتجات <Icon name="arrow"/></button></div>
        </div>
      </section>

      <section className="section trust-section" id="services">
        <div className="container trust-grid">
          <div className="trust-copy"><span className="section-kicker">تجربة بُنيت من أجلك</span><h2>أكثر من متجر.<br/><em>منظومة متكاملة.</em></h2><p>من أول فكرة وحتى التسليم، نوفر لك تجربة منظمة وواضحة تساعدك على الوصول إلى ما تحتاجه بثقة.</p><div className="feature-list">
            <div><span><Icon name="shield"/></span><p><b>مراجعة قبل النشر</b><small>كل منتج وخدمة يراجعها فريق المنصة.</small></p></div>
            <div><span><Icon name="message"/></span><p><b>تواصل داخل الطلب</b><small>رسائل، ملفات، مراحل وتسليمات في مكان واحد.</small></p></div>
            <div><span><Icon name="wallet"/></span><p><b>إدارة مالية واضحة</b><small>عمولات وأرصدة وطلبات سحب قابلة للمتابعة.</small></p></div>
          </div></div>
          <div className="dashboard-preview"><div className="dash-top"><span/><span/><span/><b>ZM Seller Dashboard</b></div><div className="dash-body"><aside><i className="on"/><i/><i/><i/><i/></aside><div className="dash-content"><div className="dash-title"><span><small>إجمالي المبيعات</small><b>$12,480</b></span><em>+18.4%</em></div><div className="chart"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="dash-cards"><i/><i/><i/></div></div></div></div>
        </div>
      </section>

      <section className="section seller-section" id="seller">
        <div className="container seller-card"><div className="seller-glow"/><div className="seller-content"><span className="section-kicker light">مساحتك للانطلاق</span><h2>حوّل خبرتك وإبداعك<br/>إلى <em>فرصة حقيقية.</em></h2><p>انضم كبائع، اعرض منتجاتك وخدماتك، وتابع طلباتك وأرباحك من لوحة واحدة احترافية.</p><div className="seller-actions"><button className="light-btn" onClick={()=>{setAuthMode(currentUser ? 'account' : 'register');setAuthOpen(true)}}>قدّم طلب انضمام <Icon name="arrow"/></button><a href="#learn">اعرف كيف تعمل المنصة</a></div></div><div className="seller-mark">ZM<span>SELLER</span></div></div>
      </section>
    </main>

    <footer className="footer" id="support"><div className="container footer-grid"><div className="footer-brand"><div className="brand"><span className="brand-mark">ZM</span><span className="brand-copy"><b>ZAKARIA MANSOUR</b><small>Global Digital Marketplace</small></span></div><p>طموح · تعلم · تطوير · إنجاز</p><small>الأحلام لا تتحقق بالصدفة، بل بالتخطيط والعمل.</small><div className="socials"><a href="https://www.instagram.com/zakarei_mansour/" target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram"/></a><a href="https://www.facebook.com/share/1Do9QD4YsW/" target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook"/></a><a href="https://wa.me/201019420011" target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp"/></a></div></div>
      <div><h4>السوق</h4><a href="#categories">المنتجات الرقمية</a><a href="#categories">الخدمات</a><a href="#categories">الكورسات</a><a href="#featured">العروض</a></div><div><h4>البائعون</h4><a href="#seller">ابدأ البيع</a><a href="#seller">مركز البائع</a><a href="#seller">العمولات</a><a href="#support">سياسة البائعين</a></div><div><h4>تواصل معنا</h4><a href="mailto:zakareimansour@gmail.com"><Icon name="mail" size={17}/> zakareimansour@gmail.com</a><a href="https://wa.me/201019420011" target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17}/> +20 101 942 0011</a><span>العربية · English</span><span>عملات متعددة</span></div></div><div className="container footer-bottom"><span>© 2026 ZAKARIA MANSOUR. جميع الحقوق محفوظة.</span><div><button onClick={()=>setLegalPage('privacy')}>الخصوصية</button><button onClick={()=>setLegalPage('terms')}>الشروط</button><button onClick={()=>setLegalPage('refund')}>الاسترجاع</button></div></div></footer>

    {storeNotice && <div className="store-notice"><Icon name="check"/><span>{storeNotice}</span><button onClick={()=>setStoreNotice('')}><Icon name="close" size={16}/></button></div>}

    {dashboardOpen && <div className="dashboard-overlay"><section className="account-dashboard"><header><div className="brand"><span className="brand-mark">ZM</span><span className="brand-copy"><b>مركز الحساب</b><small>{currentUser?.name||'ZAKARIA MANSOUR'}</small></span></div><button onClick={()=>setDashboardOpen(false)}><Icon name="close"/></button></header>{dashboardLoading?<div className="dashboard-loading"><span/><b>جارٍ تحميل بيانات حسابك...</b></div>:<div className="account-dashboard-body">
      {dashboardData.overview&&<div className="overview-block"><div className="dash-section-title"><span><Icon name="dashboard"/></span><div><h2>نظرة عامة</h2><p>ملخص مباشر لحالة المنصة.</p></div></div><div className="overview-cards">{[['المستخدمون',dashboardData.overview.users],['البائعون',dashboardData.overview.sellers],['طلبات بائع',dashboardData.overview.pendingSellers],['منتجات منشورة',dashboardData.overview.publishedProducts],['بانتظار المراجعة',dashboardData.overview.pendingProducts],['الطلبات',dashboardData.overview.orders]].map(([label,value])=><article key={label}><small>{label}</small><b>{value}</b></article>)}</div></div>}
      <div className="dashboard-columns"><div className="dashboard-main">
        <div className="dashboard-card"><div className="dash-card-head"><div><Icon name="orders"/><span><b>طلباتي</b><small>تابع الطلبات وحالة الدفع.</small></span></div><em>{dashboardData.orders.length}</em></div>{dashboardData.orders.length?<div className="order-list">{dashboardData.orders.map(order=><article key={order.id}><span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleDateString('ar-EG')}</small></span><em>{({pending_payment:'بانتظار الدفع',paid:'مدفوع',processing:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',refunded:'مسترجع'})[order.status]}</em><strong>{new Intl.NumberFormat('ar-EG',{style:'currency',currency:order.currency}).format(order.total_cents/100)}</strong></article>)}</div>:<div className="dash-empty">لا توجد طلبات حتى الآن.</div>}</div>
        <div className="dashboard-card"><div className="dash-card-head"><div><Icon name="download"/><span><b>مكتبتي الرقمية</b><small>ملفاتك التي تم تأكيد دفعها.</small></span></div><em>{dashboardData.library.length}</em></div>{dashboardData.library.length?<div className="library-list">{dashboardData.library.map(item=><article key={item.grant_id}><span className="library-icon"><Icon name="download"/></span><div><b>{item.title}</b><small>{item.file_name} · إصدار {item.version}</small><em>متبقي {item.max_downloads-item.download_count} من {item.max_downloads}</em></div><button onClick={()=>downloadLibraryItem(item.grant_id)}>تحميل آمن</button></article>)}</div>:<div className="dash-empty">ستظهر مشترياتك الرقمية هنا بعد تأكيد الدفع.</div>}</div>
        {['owner','admin','support','finance'].includes(currentUser?.role)&&<div className="dashboard-card"><div className="dash-card-head"><div><Icon name="wallet"/><span><b>إدارة الطلبات والدفع</b><small>تأكيد الدفع يصدر صلاحيات التحميل تلقائيًا.</small></span></div><em>{dashboardData.adminOrders.length}</em></div>{dashboardData.adminOrders.length?<div className="admin-order-list">{dashboardData.adminOrders.map(order=><article key={order.id}><div><b>{order.order_number}</b><small>{order.customer_name} · {order.customer_email}</small></div><strong>{new Intl.NumberFormat('ar-EG',{style:'currency',currency:order.currency}).format(order.total_cents/100)}</strong><em className={`status-${order.status}`}>{({pending_payment:'بانتظار الدفع',paid:'مدفوع',processing:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',refunded:'مسترجع'})[order.status]}</em>{['owner','admin','finance'].includes(currentUser?.role)&&order.status==='pending_payment'&&<button onClick={()=>updateOrderStatus(order.id,'paid')}>تأكيد الدفع</button>}</article>)}</div>:<div className="dash-empty">لا توجد طلبات.</div>}</div>}
        {['seller','owner','admin'].includes(currentUser?.role)&&<div className="dashboard-card"><div className="dash-card-head"><div><Icon name="package"/><span><b>منتجاتي</b><small>المسودات والمنتجات المرسلة والمنشورة.</small></span></div><em>{dashboardData.products.length}</em></div>{dashboardData.products.length?<div className="seller-product-list">{dashboardData.products.map(product=><article key={product.id}><span><b>{product.title_ar}</b><small>{product.category_name}</small></span><strong>{new Intl.NumberFormat('en-US',{style:'currency',currency:product.currency}).format(product.price_cents/100)}</strong><em className={`status-${product.status}`}>{({draft:'مسودة',pending_review:'قيد المراجعة',published:'منشور',rejected:'مرفوض',archived:'مؤرشف'})[product.status]}</em><div className="asset-actions"><label>+ صورة<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>uploadProductAsset(product.id,e.target.files?.[0],'image')}/></label>{['digital','software','creative','course'].includes(product.product_type)&&<label>+ ملف<input type="file" accept=".xlsx,.xls,.csv,.zip,.pdf,.docx,.pptx,.txt" onChange={e=>uploadProductAsset(product.id,e.target.files?.[0],'file')}/></label>}{['draft','rejected'].includes(product.status)&&<button onClick={()=>publishProduct(product.id)}>{['owner','admin'].includes(currentUser?.role)?'نشر':'مراجعة'}</button>}</div></article>)}</div>:<div className="dash-empty">لم تضف منتجات بعد.</div>}</div>}
        {['owner','admin','moderator'].includes(currentUser?.role)&&<><div className="dashboard-card"><div className="dash-card-head"><div><Icon name="user"/><span><b>طلبات البائعين</b><small>راجع بيانات المتقدمين قبل الموافقة.</small></span></div><em>{dashboardData.applications.filter(a=>a.status==='pending').length}</em></div><div className="review-list">{dashboardData.applications.filter(a=>a.status==='pending').map(app=><article key={app.id}><div><b>{app.store_name}</b><small>{app.name} · {app.email}</small><p>{app.description}</p></div><span><button className="approve" onClick={()=>decideSeller(app.id,'approved')}>قبول</button><button onClick={()=>decideSeller(app.id,'rejected')}>رفض</button></span></article>)}{!dashboardData.applications.some(a=>a.status==='pending')&&<div className="dash-empty">لا توجد طلبات معلقة.</div>}</div></div><div className="dashboard-card"><div className="dash-card-head"><div><Icon name="shield"/><span><b>مراجعة المنتجات</b><small>لا يظهر المنتج قبل موافقة الإدارة.</small></span></div><em>{dashboardData.reviews.length}</em></div><div className="review-list">{dashboardData.reviews.map(product=><article key={product.id}><div><b>{product.title_ar}</b><small>{product.seller_name} · {product.category_name}</small><p>{product.description_ar}</p></div><span><button className="approve" onClick={()=>decideProduct(product.id,'published')}>نشر</button><button onClick={()=>decideProduct(product.id,'rejected')}>رفض</button></span></article>)}{!dashboardData.reviews.length&&<div className="dash-empty">لا توجد منتجات بانتظار المراجعة.</div>}</div></div></>}
      </div><aside className="dashboard-side">
        {currentUser?.role==='customer'&&<div className="dashboard-card seller-apply"><div className="dash-card-head"><div><Icon name="briefcase"/><span><b>كن بائعًا</b><small>قدّم خدماتك ومنتجاتك على المنصة.</small></span></div></div>{dashboardData.application?<div className="application-status"><span className={`status-${dashboardData.application.status}`}>{({pending:'قيد المراجعة',approved:'مقبول',rejected:'مرفوض'})[dashboardData.application.status]}</span><b>{dashboardData.application.store_name}</b><p>{dashboardData.application.review_note||'سيراجع فريق الإدارة بيانات طلبك.'}</p></div>:<form className="compact-form" onSubmit={submitSellerApplication}><label>اسم المتجر<input required minLength="2" value={sellerApplicationForm.storeName} onChange={e=>setSellerApplicationForm({...sellerApplicationForm,storeName:e.target.value})}/></label><label>عرّفنا بنشاطك<textarea required minLength="20" value={sellerApplicationForm.description} onChange={e=>setSellerApplicationForm({...sellerApplicationForm,description:e.target.value})}/></label><button>إرسال الطلب</button></form>}</div>}
        {['seller','owner','admin'].includes(currentUser?.role)&&<div className="dashboard-card add-product"><div className="dash-card-head"><div><Icon name="plus"/><span><b>إضافة منتج</b><small>سيُرسل المنتج للمراجعة قبل النشر.</small></span></div></div><form className="compact-form" onSubmit={submitProduct}><label>النوع<select value={productForm.productType} onChange={e=>{const type=e.target.value;const category=dashboardData.categories.find(c=>c.type===type);setProductForm({...productForm,productType:type,categoryId:String(category?.id||'')})}}>{[['digital','رقمي'],['software','برمجيات'],['creative','تصميم'],['service','خدمة'],['course','كورس'],['physical','مادي']].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>التصنيف<select required value={productForm.categoryId} onChange={e=>setProductForm({...productForm,categoryId:e.target.value})}>{dashboardData.categories.filter(c=>c.type===productForm.productType).map(c=><option value={c.id} key={c.id}>{c.name_ar}</option>)}</select></label><label>العنوان بالعربية<input required minLength="2" value={productForm.titleAr} onChange={e=>setProductForm({...productForm,titleAr:e.target.value})}/></label><label>English title<input required minLength="2" dir="ltr" value={productForm.titleEn} onChange={e=>setProductForm({...productForm,titleEn:e.target.value})}/></label><label>الوصف بالعربية<textarea required minLength="20" value={productForm.descriptionAr} onChange={e=>setProductForm({...productForm,descriptionAr:e.target.value})}/></label><label>English description<textarea required minLength="20" dir="ltr" value={productForm.descriptionEn} onChange={e=>setProductForm({...productForm,descriptionEn:e.target.value})}/></label><div className="form-row"><label>السعر<input required min="0" step="0.01" type="number" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label><label>العملة<select value={productForm.currency} onChange={e=>setProductForm({...productForm,currency:e.target.value})}><option>USD</option><option>EGP</option><option>EUR</option></select></label></div>{['owner','admin'].includes(currentUser?.role)&&<label className="publish-check"><input type="checkbox" checked={productForm.publishNow} onChange={e=>setProductForm({...productForm,publishNow:e.target.checked})}/><span>نشر منتجي مباشرة بدون انتظار مراجعة</span></label>}<button>{productForm.publishNow&&['owner','admin'].includes(currentUser?.role)?'نشر الآن':'إرسال للمراجعة'}</button></form></div>}
      </aside></div>
    </div>}</section></div>}

    {selectedProduct && <div className="product-modal-overlay" onMouseDown={()=>setSelectedProduct(null)}><section className="product-modal" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedProduct(null)}><Icon name="close"/></button><div className={`product-modal-art ${selectedProduct.color}`}>{selectedProduct.imageUrl?<img src={selectedProduct.imageUrl} alt={selectedProduct.title}/>:<><span className="art-icon"><Icon name={selectedProduct.icon} size={66}/></span><div className="art-lines"/></>}</div><div className="product-modal-copy"><span className="product-kind">{selectedProduct.typeLabel||selectedProduct.type}</span><h2>{selectedProduct.title}</h2><p className="seller-line">بواسطة <b>{selectedProduct.seller}</b> · <Icon name="star" size={14}/> {selectedProduct.rating}</p><p className="product-description">{selectedProduct.description||'سيظهر وصف المنتج التفصيلي هنا بعد إضافته من لوحة البائع ومراجعته بواسطة الإدارة.'}</p><div className="product-benefits"><span><Icon name="shield"/> منتج تمت مراجعته</span><span><Icon name="message"/> دعم داخل الطلب</span><span><Icon name="download"/> وصول من حسابك</span></div><div className="product-buy"><div><small>السعر</small><strong>{selectedProduct.price}</strong>{selectedProduct.old&&<del>{selectedProduct.old}</del>}</div><button onClick={()=>{addToCart(selectedProduct);setSelectedProduct(null)}}><Icon name="cart"/> أضف إلى السلة</button></div></div></section></div>}

    {cartOpen && <div className="cart-overlay" onMouseDown={()=>setCartOpen(false)}><aside className="cart-drawer" onMouseDown={e=>e.stopPropagation()}><header><div><Icon name="cart"/><span><b>سلة التسوق</b><small>{cart.count} عنصر</small></span></div><button onClick={()=>setCartOpen(false)}><Icon name="close"/></button></header><div className="cart-items">{cart.items.length?cart.items.map(item=><article key={item.product_id}><span className="cart-item-icon"><Icon name={({digital:'download',software:'code',creative:'palette',service:'briefcase',course:'play',physical:'package'})[item.product_type]||'package'}/></span><div><b>{item.title}</b><small>{item.seller_name}</small><em>{new Intl.NumberFormat(lang==='AR'?'ar-EG':'en-US',{style:'currency',currency:item.currency||cart.currency||'USD'}).format(item.price_cents/100)}</em></div><button onClick={()=>removeCartItem(item.product_id)} aria-label="حذف"><Icon name="close" size={16}/></button></article>):<div className="empty-cart"><span><Icon name="cart" size={32}/></span><b>سلتك فارغة</b><p>اكتشف المنتجات والخدمات وأضف ما يناسبك.</p><button onClick={()=>{setCartOpen(false);document.querySelector('#featured')?.scrollIntoView()}}>استكشف السوق</button></div>}</div>{cart.items.length>0&&<footer><div><span>الإجمالي المبدئي</span><strong>{new Intl.NumberFormat(lang==='AR'?'ar-EG':'en-US',{style:'currency',currency:cart.currency||'USD'}).format(cart.subtotalCents/100)}</strong></div><small>الضرائب والخصومات—إن وجدت—تُحسب عند إتمام الطلب.</small><label className="payment-choice"><span>طريقة الدفع المؤقتة</span><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="bank_transfer">تحويل بنكي / محفظة — مراجعة يدوية</option><option value="pending">تحديد طريقة الدفع لاحقًا</option>{cart.items.every(item=>item.product_type==='physical')&&<option value="cash_on_delivery">الدفع عند الاستلام</option>}</select></label><button onClick={createOrder}>إنشاء الطلب <Icon name="arrow"/></button></footer>}</aside></div>}

    {legalPage&&<div className="legal-overlay" onMouseDown={()=>setLegalPage(null)}><article className="legal-modal" onMouseDown={e=>e.stopPropagation()}><header><div><span>ZM</span><h2>{legalPages[legalPage].title}</h2></div><button onClick={()=>setLegalPage(null)}><Icon name="close"/></button></header><p className="legal-warning">نسخة تشغيلية أولية تحتاج مراجعة قانونية متخصصة قبل التوسع الدولي.</p>{legalPages[legalPage].sections.map(([title,text])=><section key={title}><h3>{title}</h3><p>{text}</p></section>)}</article></div>}

    {setupRequired && !setupOpen && <button className="setup-banner" onClick={()=>setSetupOpen(true)}><Icon name="shield"/> إكمال إعداد حساب المالك</button>}
    {setupOpen && <div className="auth-overlay"><section className="auth-modal owner-setup-modal"><div className="auth-brand"><span className="brand-mark">ZM</span><div><b>إعداد مالك المنصة</b><small>خطوة واحدة فقط قبل بدء الإدارة</small></div></div><div className="auth-intro"><span><Icon name="shield"/></span><h3>أنشئ حسابك الإداري</h3><p>الرمز موجود في إعدادات الاستضافة باسم SETUP_TOKEN.</p></div><form className="auth-form" onSubmit={submitOwnerSetup}><label><span>الاسم</span><input required minLength="2" value={setupForm.name} onChange={e=>setSetupForm({...setupForm,name:e.target.value})}/></label><label><span>البريد</span><input required type="email" dir="ltr" value={setupForm.email} onChange={e=>setSetupForm({...setupForm,email:e.target.value})}/></label><label><span>كلمة مرور قوية</span><input required minLength="8" type="password" dir="ltr" value={setupForm.password} onChange={e=>setSetupForm({...setupForm,password:e.target.value})} placeholder="حروف وأرقام — 8 أحرف على الأقل"/></label><label><span>رمز إعداد المالك</span><input required type="password" dir="ltr" value={setupForm.token} onChange={e=>setSetupForm({...setupForm,token:e.target.value})}/></label>{setupError&&<div className="auth-error">{setupError}</div>}<button className="auth-submit" disabled={authLoading}>{authLoading?'جارٍ التأمين...':'إنشاء حساب المالك'} <Icon name="arrow"/></button></form><p className="auth-note"><Icon name="lock"/> لا يمكن إنشاء مالك ثانٍ بعد نجاح هذه الخطوة.</p></section></div>}

    {authOpen && <div className="auth-overlay" onMouseDown={()=>setAuthOpen(false)}><section className="auth-modal" onMouseDown={event=>event.stopPropagation()}>
      <button className="auth-close" onClick={()=>setAuthOpen(false)} aria-label="إغلاق"><Icon name="close"/></button>
      <div className="auth-brand"><span className="brand-mark">ZM</span><div><b>ZAKARIA MANSOUR</b><small>حسابك في السوق الرقمي العالمي</small></div></div>
      {currentUser ? <div className="account-panel"><div className="account-avatar">{currentUser.name.charAt(0).toUpperCase()}</div><h3>أهلًا، {currentUser.name}</h3><p>{currentUser.email}</p><span>{({owner:'المالك',admin:'مدير',moderator:'مراجع',support:'دعم',finance:'مالية',seller:'بائع',customer:'عميل'})[currentUser.role] || currentUser.role}</span><button className="dashboard-launch" onClick={()=>{setAuthOpen(false);loadDashboard()}}><Icon name="dashboard"/> فتح مركز الحساب</button><button onClick={logout}><Icon name="logout"/> تسجيل الخروج</button></div> : <>
        <div className="auth-tabs"><button className={authMode==='login'?'active':''} onClick={()=>{setAuthMode('login');setAuthError('')}}>تسجيل الدخول</button><button className={authMode==='register'?'active':''} onClick={()=>{setAuthMode('register');setAuthError('')}}>حساب جديد</button></div>
        <div className="auth-intro"><span><Icon name="lock"/></span><h3>{authMode==='login'?'مرحبًا بعودتك':'ابدأ رحلتك معنا'}</h3><p>{authMode==='login'?'ادخل إلى مشترياتك وطلباتك ولوحة حسابك.':'أنشئ حسابًا آمنًا للتسوق أو التقديم كبائع.'}</p></div>
        <form className="auth-form" onSubmit={submitAuth}>
          {authMode==='register' && <label><span>الاسم الكامل</span><input required minLength="2" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="اكتب اسمك" autoComplete="name"/></label>}
          <label><span>البريد الإلكتروني</span><input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="name@example.com" autoComplete="email" dir="ltr"/></label>
          <label><span>كلمة المرور</span><input required minLength="8" type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="8 أحرف على الأقل، تشمل حرفًا ورقمًا" autoComplete={authMode==='login'?'current-password':'new-password'} dir="ltr"/></label>
          {authError && <div className="auth-error">{authError}</div>}
          <button className="auth-submit" disabled={authLoading}>{authLoading?'جارٍ التنفيذ...':authMode==='login'?'دخول آمن':'إنشاء الحساب'} <Icon name="arrow"/></button>
        </form>
        <p className="auth-note"><Icon name="shield" size={15}/> كلمات المرور مشفرة ولا تظهر في قاعدة البيانات.</p>
      </>}
    </section></div>}

    <button className={aiOpen ? 'ai-fab active' : 'ai-fab'} onClick={()=>setAiOpen(!aiOpen)} aria-label="فتح مساعد ZM الذكي"><span className="fab-pulse"/><Icon name={aiOpen ? 'close' : 'sparkles'} size={24}/><b>AI</b></button>
    {aiOpen && <aside className="ai-chat" aria-label="مساعد ZM الذكي">
      <header><span><Icon name="sparkles"/><i/></span><div><b>مساعد ZM الذكي</b><small>نسخة تجريبية · متصل</small></div><button onClick={()=>setAiOpen(false)}><Icon name="close"/></button></header>
      <div className="ai-chat-body">{aiMessages.map((message,i)=><div className={`chat-message ${message.role}`} key={i}>{message.role === 'assistant' && <span><Icon name="bot" size={16}/></span>}<p>{message.text}</p></div>)}</div>
      <div className="quick-prompts"><button onClick={()=>setAiInput('أريد كورسًا لبدء مشروع رقمي')}>رشّح لي كورسًا</button><button onClick={()=>setAiInput('أبحث عن خدمة تصميم احترافية')}>خدمة تصميم</button></div>
      <footer><input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAiMessage()} placeholder="اكتب ما تبحث عنه..."/><button onClick={sendAiMessage} aria-label="إرسال"><Icon name="send"/></button></footer>
      <small className="ai-disclaimer">قد يخطئ الذكاء الاصطناعي. راجع المعلومات المهمة.</small>
    </aside>}

    {searchOpen && <div className="search-overlay" onMouseDown={()=>setSearchOpen(false)}><div className="search-box smart-search" onMouseDown={e=>e.stopPropagation()}><div className="smart-search-label"><Icon name="sparkles" size={16}/> بحث مدعوم بالذكاء الاصطناعي</div><div><Icon name="search" size={25}/><input autoFocus value={productQuery} onChange={e=>setProductQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){setSearchOpen(false);document.querySelector('#featured')?.scrollIntoView()}}} placeholder="صف ما تحتاجه بطريقتك..."/><button onClick={()=>setSearchOpen(false)}><Icon name="close"/></button></div><p>سيفهم المساعد مقصدك ويبحث في منتجات وخدمات المنصة بعد ربط قاعدة البيانات.</p></div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);

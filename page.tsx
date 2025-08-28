import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import './HomePage.css';

// تهيئة Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXZ8wXkN1R2DOjinoYFrX-7xd1grdatOs",
  authDomain: "ali-akaad.firebaseapp.com",
  projectId: "ali-akaad",
  storageBucket: "ali-akaad.appspot.com",
  messagingSenderId: "806404765627",
  appId: "1:806404765627:web:287cae0c0c004bfae0369e",
  measurementId: "G-5YG0RJ3KT4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function HomePage() {
  const [elements, setElements] = useState([]);
  const [filteredElements, setFilteredElements] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // تحميل العناصر من Firebase
  useEffect(() => {
    const loadElements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ui-elements'));
        if (!querySnapshot.empty) {
          const elementsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setElements(elementsData);
          setFilteredElements(elementsData);
        } else {
          // إذا لم توجد عناصر، نضيف الأمثلة الافتراضية
          await addSampleElements();
          loadElements(); // إعادة تحميل العناصر
        }
      } catch (error) {
        console.error('Error loading elements:', error);
        showToast('فشل في تحميل العناصر', 'error');
      }
    };

    loadElements();
  }, []);

  // تصفية العناصر عند تغيير البحث أو التصنيف
  useEffect(() => {
    let result = elements;
    
    if (currentCategory !== 'all') {
      result = result.filter(el => el.category === currentCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(el => 
        el.title.toLowerCase().includes(term) ||
        el.description.toLowerCase().includes(term) ||
        el.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredElements(result);
  }, [searchTerm, currentCategory, elements]);

  // إضافة عناصر نموذجية إذا كانت القاعدة فارغة
  const addSampleElements = async () => {
    const sampleElements = [
      {
        title: "زر متدرج",
        description: "زر جميل بتدرج لوني",
        category: "buttons",
        code: `<button class="gradient-btn">انقر هنا</button>
<style>
.gradient-btn {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.3s;
}
.gradient-btn:hover {
  transform: translateY(-2px);
}
</style>`,
        tags: ["زر", "تدرج", "تفاعلي"],
        views: 0,
        likes: 0
      },
      {
        title: "بطاقة منتج",
        description: "بطاقة أنيقة لعرض المنتجات",
        category: "cards",
        code: `<div class="product-card">
  <img src="product.jpg" alt="منتج">
  <div class="card-content">
    <h3>اسم المنتج</h3>
    <p class="price">$99</p>
    <button class="buy-btn">شراء الآن</button>
  </div>
</div>
<style>
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s;
  max-width: 300px;
}
.product-card:hover {
  transform: translateY(-5px);
}
.card-content {
  padding: 20px;
}
.price {
  color: #e74c3c;
  font-size: 24px;
  font-weight: bold;
}
.buy-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
}
</style>`,
        tags: ["بطاقة", "منتج", "تسوق"],
        views: 0,
        likes: 0
      }
    ];

    try {
      for (const element of sampleElements) {
        await addDoc(collection(db, 'ui-elements'), element);
      }
      showToast('تم إضافة العناصر النموذجية', 'success');
    } catch (error) {
      console.error('Error adding sample elements:', error);
      showToast('فشل في إضافة العناصر النموذجية', 'error');
    }
  };

  // عرض الرسائل للمستخدم
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // نسخ النص إلى الحافظة
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('تم نسخ الكود!', 'success');
    } catch (err) {
      showToast('فشل في نسخ الكود', 'error');
    }
  };

  // زيادة عدد المشاهدات عند عرض عنصر
  const incrementViews = async (elementId) => {
    try {
      const elementRef = doc(db, 'ui-elements', elementId);
      await updateDoc(elementRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  // فتح عنصر وعرض الكود
  const handleElementClick = (element) => {
    setSelectedElement(element);
    setModalOpen(true);
    incrementViews(element.id);
  };

  return (
    <div className="app">
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
      />
      
      {/* Blur Overlay */}
      {sidebarOpen && <div className="blur-overlay" onClick={() => setSidebarOpen(false)} />}
      
      {/* Main Content */}
      <main className="main-content">
        <HeroSection />
        
        <div className="container">
          <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          
          <ElementsGrid 
            elements={filteredElements} 
            onElementClick={handleElementClick}
          />
        </div>
      </main>
      
      {/* Code Modal */}
      {modalOpen && (
        <CodeModal 
          element={selectedElement}
          onClose={() => setModalOpen(false)}
          onCopy={copyToClipboard}
        />
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} />
      )}
    </div>
  );
}

// مكونات فرعية
function Header({ sidebarOpen, setSidebarOpen }) {
  return (
    <header>
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-palette"></i>
            <span>عناصر UI</span>
          </div>
          <button 
            className="menu-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ sidebarOpen, setSidebarOpen, currentCategory, setCurrentCategory }) {
  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'buttons', name: 'أزرار' },
    { id: 'cards', name: 'بطاقات' },
    { id: 'loaders', name: 'أدوات التحميل' },
    { id: 'inputs', name: 'حقول الإدخال' },
    { id: 'nav', name: 'أشرطة التنقل' },
    { id: 'effects', name: 'تأثيرات' }
  ];

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>الأقسام</h3>
        <button 
          className="close-sidebar" 
          onClick={() => setSidebarOpen(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <ul className="sidebar-categories">
        {categories.map(category => (
          <li key={category.id}>
            <a 
              href="#" 
              className={currentCategory === category.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setCurrentCategory(category.id);
                setSidebarOpen(false);
              }}
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <h1>عناصر واجهة المستخدم باللغة العربية</h1>
        <p>اكتشف مجموعة رائعة من عناصر واجهة المستخدم الجاهزة للاستخدام في مشاريعك. نسخ العناصر بنقرة واحدة!</p>
      </div>
    </section>
  );
}

function SearchBox({ searchTerm, setSearchTerm }) {
  return (
    <div className="search-container">
      <div className="search-box">
        <input 
          type="text" 
          placeholder="ابحث عن العناصر..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="fas fa-search"></i>
      </div>
    </div>
  );
}

function ElementsGrid({ elements, onElementClick }) {
  if (elements.length === 0) {
    return <div className="no-results">لا توجد نتائج</div>;
  }

  return (
    <div className="elements-grid">
      {elements.map(element => (
        <div 
          key={element.id} 
          className="element-card"
          onClick={() => onElementClick(element)}
        >
          <div className="element-preview">
            <div dangerouslySetInnerHTML={{ __html: element.code.split('<style>')[0] }} />
          </div>
          <div className="element-info">
            <h3>{element.title}</h3>
            <p>{element.description}</p>
            <div className="element-tags">
              {element.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CodeModal({ element, onClose, onCopy }) {
  if (!element) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>كود العنصر: {element.title}</h3>
          <button className="close-modal" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="code-content">
            <pre>{element.code}</pre>
          </div>
          <button 
            className="copy-button" 
            onClick={() => onCopy(element.code)}
          >
            <i className="fas fa-copy"></i> نسخ الكود
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}

import { useState, Fragment } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { auth } from './services/firebase';
import { signOut } from 'firebase/auth';
import { Menu, Transition } from '@headlessui/react';

// Import komponen proteksi
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';

// Import semua halaman
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import TransactionsPage from './pages/Transactions';
import SettingsPage from './pages/Settings';
import ReportsPage from './pages/ReportsPage';

function App() {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); 
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password';


  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  return (
    <div className={`min-h-screen ${isAuthPage ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900'}`}>
      {/* --- 3. Tampilkan Navbar HANYA JIKA BUKAN Halaman Otentikasi --- */}
      {!isAuthPage && (
        <nav className="bg-gray-800 p-4 text-white shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-white-900 dark:text-white">ArusKu</Link>
            
            {/* Navigasi Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {currentUser ? (
                <>
                  <Link to="/" className="hover:text-gray-300">Dashboard</Link>
                  <Link to="/transactions" className="hover:text-gray-300">Transaksi</Link>
                  <Link to="/reports" className="hover:text-gray-300">Laporan</Link>
                  <div className="text-gray-600">|</div>
                  

                {/* Dropdown Menu Pengguna */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 hover:text-gray-300 focus:outline-none">
                    <span>{currentUser.email}</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <Link to="/settings" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                            Pengaturan Akun
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={handleLogout} className={`${active ? 'bg-gray-100' : ''} w-full text-left block px-4 py-2 text-sm text-gray-700`}>
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300">Login</Link>
                <Link to="/register" className="hover:text-gray-300">Register</Link>
              </>
            )}
          </div>

          {/* Tombol Hamburger untuk Mobile (di bawah md) */}
          <div className="md:hidden">
            {currentUser && (
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Menu Dropdown Mobile dengan Animasi */}
        <div className={`
            md:hidden mt-3 transition-all duration-300 ease-in-out origin-top bg-gray-700 rounded-md py-1 px-4
            ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 h-0 p-0 m-0 pointer-events-none'}
        `}>
          {currentUser && (
            <ul className="flex flex-col space-y-2">
              <li className="text-gray-300 border-b border-gray-600 pb-2 mb-2">{currentUser.email}</li>
              <li><Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2">Dashboard</Link></li>
              <li><Link to="/transactions" onClick={() => setIsMenuOpen(false)} className="block py-2">Transaksi</Link></li>
              <li><Link to="/reports" onClick={() => setIsMenuOpen(false)} className="block py-2">Laporan</Link></li>
              <li><Link to="/settings" onClick={() => setIsMenuOpen(false)} className="block py-2">Pengaturan Akun</Link></li>
              <li>
                <button onClick={handleLogout} className="w-full text-left bg-red-600 hover:bg-red-700 px-3 py-2 mt-2 rounded">
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
      )}
      
      {/* Konten Utama Halaman */}
      <main className={!isAuthPage ? 'p-4' : ''}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
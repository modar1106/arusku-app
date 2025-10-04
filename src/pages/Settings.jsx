import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, deleteUser } from 'firebase/auth';
import { Tab } from '@headlessui/react';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

// Fungsi helper untuk classNames
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Panggil hook tema

  // Deklarasi semua state
  const [budgets, setBudgets] = useState({});
  const [budgetInputs, setBudgetInputs] = useState({});
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('expense');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [passwordForEmail, setPasswordForEmail] = useState('');
  const [passwordForDelete, setPasswordForDelete] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Efek untuk mengambil data Kategori dan Anggaran
  useEffect(() => {
    if (!currentUser) return;
    const catQuery = query(collection(db, 'categories'), where('userId', '==', currentUser.uid));
    const unsubCategories = onSnapshot(catQuery, (snapshot) => {
      const userCategories = { expense: [], income: [] };
      snapshot.forEach((doc) => userCategories[doc.data().type].push({ id: doc.id, ...doc.data() }));
      setCategories(userCategories);
    });

    const budgetQuery = query(collection(db, 'budgets'), where('userId', '==', currentUser.uid));
    const unsubBudgets = onSnapshot(budgetQuery, (snapshot) => {
      const fetchedBudgets = {};
      const initialInputs = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedBudgets[data.category] = { id: doc.id, amount: data.amount };
        initialInputs[data.category] = data.amount;
      });
      setBudgets(fetchedBudgets);
      setBudgetInputs(initialInputs);
    });
    return () => { unsubCategories(); unsubBudgets(); };
  }, [currentUser]);
  
  const clearMessages = () => { setError(''); setSuccess(''); };
  
  const handleBudgetInputChange = (category, value) => setBudgetInputs(prev => ({ ...prev, [category]: value }));

  const handleSaveBudgets = async () => {
    clearMessages();
    setLoading(true);
    try {
      const batch = writeBatch(db);
      for (const category of categories.expense) {
        const inputAmount = parseFloat(budgetInputs[category.name]) || 0;
        const existingBudget = budgets[category.name];

        if (existingBudget) {
          if (inputAmount !== existingBudget.amount) {
            const docRef = doc(db, 'budgets', existingBudget.id);
            batch.update(docRef, { amount: inputAmount });
          }
        } else if (inputAmount > 0) {
          const docRef = doc(collection(db, 'budgets'));
          batch.set(docRef, { userId: currentUser.uid, category: category.name, amount: inputAmount });
        }
      }
      await batch.commit();
      setSuccess('Anggaran berhasil disimpan!');
    } catch(err) {
      setError('Gagal menyimpan anggaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!newCategoryName) return;
    try {
      await addDoc(collection(db, 'categories'), { userId: currentUser.uid, name: newCategoryName, type: newCategoryType });
      setNewCategoryName('');
      setSuccess('Kategori berhasil ditambahkan!');
    } catch (err) {
      setError('Gagal menambahkan kategori.');
    }
  };

  const handleDeleteCategory = async (id) => {
    clearMessages();
    try {
      await deleteDoc(doc(db, 'categories', id));
      setSuccess('Kategori berhasil dihapus!');
    } catch (err) {
      setError('Gagal menghapus kategori.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmPassword) return setError('Password baru tidak cocok.');
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setSuccess('Password berhasil diperbarui!');
    } catch (err) {
      setError('Gagal mengubah password. Pastikan password saat ini benar.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForEmail);
      await reauthenticateWithCredential(currentUser, credential);
      await verifyBeforeUpdateEmail(currentUser, newEmail);
      setSuccess(`Email verifikasi telah dikirim ke ${newEmail}.`);
    } catch (err) {
      setError('Gagal mengubah email. Pastikan password Anda benar.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteUserAccount = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForDelete);
      await reauthenticateWithCredential(currentUser, credential);
      await deleteUser(currentUser);
    } catch (err) {
      setError('Gagal menghapus akun. Pastikan password Anda benar.');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Pengaturan</h1>
      
      {error && <p className="max-w-2xl mx-auto bg-red-100 text-red-700 p-3 rounded-md text-center mb-4">{error}</p>}
      {success && <p className="max-w-2xl mx-auto bg-green-100 text-green-700 p-3 rounded-md text-center mb-4">{success}</p>}

      <div className="w-full max-w-2xl mx-auto px-2 py-4 sm:px-0">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white/60', selected ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white')}>
              Data Aplikasi
            </Tab>
            <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white/60', selected ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white')}>
              Profil & Keamanan
            </Tab>
          </Tab.List>

          <Tab.Panels className="mt-2">
            <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-4 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Anggaran Bulanan</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Atur batas pengeluaran bulanan untuk setiap kategori.</p>
                  <div className="space-y-3">
                    {categories.expense.map(cat => (
                      <div key={cat.id} className="grid grid-cols-2 gap-4 items-center">
                        <label htmlFor={`budget-${cat.name}`} className="font-medium text-gray-800 dark:text-gray-300">{cat.name}</label>
                        <Input id={`budget-${cat.name}`} type="number" placeholder="0" value={budgetInputs[cat.name] || ''} onChange={(e) => handleBudgetInputChange(cat.name, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveBudgets} disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300">{loading ? 'Menyimpan...' : 'Simpan Anggaran'}</button>
                </div>
                
                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manajemen Kategori</h2>
                  <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-end gap-3 mb-4">
                    <div className="flex-grow w-full"><label className="text-sm text-gray-700 dark:text-gray-300">Nama Kategori</label><Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="cth: Pendidikan" /></div>
                    <div className="w-full sm:w-auto"><label className="text-sm text-gray-700 dark:text-gray-300">Tipe</label><select value={newCategoryType} onChange={(e) => setNewCategoryType(e.target.value)} className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></div>
                    <button type="submit" className="w-full sm:w-auto bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">Tambah</button>
                  </form>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="mt-4">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">Kategori Pengeluaran</h3><ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">{categories.expense.map(cat => (<li key={cat.id} className="flex justify-between items-center">{cat.name}<button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 text-lg font-bold hover:text-red-700">&times;</button></li>))}</ul></div><div>
                      <h3 className="font-semibold mt-4 text-gray-800 dark:text-gray-200">Kategori Pemasukan</h3><ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">{categories.income.map(cat => (<li key={cat.id} className="flex justify-between items-center">{cat.name}<button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 text-lg font-bold hover:text-red-700">&times;</button></li>))}</ul></div></div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-4 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tampilan</h2>
                  <div className="flex justify-between items-center"><span className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</span><button onClick={toggleTheme} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Ubah Email</h2>
                  <form onSubmit={handleChangeEmail} className="space-y-4"><p className="text-sm text-gray-600 dark:text-gray-400">Email saat ini: <strong>{currentUser.email}</strong></p><Input type="email" placeholder="Email Baru" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /><Input type="password" placeholder="Konfirmasi dengan Password" value={passwordForEmail} onChange={(e) => setPasswordForEmail(e.target.value)} /><button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300">{loading ? 'Mengirim...' : 'Kirim Verifikasi Email'}</button></form>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />
                
                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Ubah Password</h2>
                  <form onSubmit={handleChangePassword} className="space-y-4"><Input type="password" placeholder="Password Saat Ini" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /><Input type="password" placeholder="Password Baru" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><Input type="password" placeholder="Konfirmasi Password Baru" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /><button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300">{loading ? 'Menyimpan...' : 'Ubah Password'}</button></form>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="border-2 border-red-500 rounded-lg p-4">
                  <h2 className="text-xl font-bold mb-2 text-red-600">Zona Berbahaya</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Tindakan ini tidak dapat diurungkan. Akun otentikasi Anda akan dihapus secara permanen.</p>
                  <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">Hapus Akun Saya</button>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus Akun">
        <form onSubmit={handleDeleteUserAccount} className="space-y-4"><p className="text-sm text-gray-700 dark:text-gray-300">Yakin? Tindakan ini bersifat permanen. Untuk melanjutkan, masukkan password Anda.</p><Input type="password" placeholder="Masukkan Password Anda" value={passwordForDelete} onChange={(e) => setPasswordForDelete(e.target.value)} /><div className="flex justify-end space-x-3"><button type="button" onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 dark:text-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button><button type="submit" disabled={loading} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-300">{loading ? 'Menghapus...' : 'Ya, Hapus Akun Saya'}</button></div></form>
      </Modal>
    </div>
  );
}
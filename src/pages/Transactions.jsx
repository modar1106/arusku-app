import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function TransactionsPage() {
  const { currentUser } = useAuth();
  
  // State untuk data dari Firestore
  const [transactions, setTransactions] = useState([]);
  const [userCategories, setUserCategories] = useState({ expense: ['Semua'], income: ['Semua'] });

  // State untuk semua filter
  const [filterMode, setFilterMode] = useState('month');
  const [monthOffset, setMonthOffset] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  
  // State untuk Search & Paginasi
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk UI
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0, count: 0 });

  // State untuk modal edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentlyEditing, setCurrentlyEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('expense');
  const [editCategory, setEditCategory] = useState('');

  // Efek untuk mengambil kategori kustom
  useEffect(() => {
    if (currentUser) {
      const q = query(collection(db, 'categories'), where('userId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const categoriesData = { expense: ['Semua'], income: ['Semua'] };
        querySnapshot.forEach((doc) => {
          categoriesData[doc.data().type].push(doc.data().name);
        });
        setUserCategories(categoriesData);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Efek UTAMA untuk mengambil transaksi berdasarkan SEMUA filter
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    let queryStartDate, queryEndDate;
    const now = new Date();

    if (filterMode === 'custom') {
      if (!startDate || !endDate) {
        setLoading(false);
        setTransactions([]); // Kosongkan transaksi jika tanggal tidak lengkap
        return; 
      }
      queryStartDate = startDate;
      queryEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
    } else if (filterMode === 'today') {
      queryStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      queryEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (filterMode === 'last_7_days') {
      queryStartDate = new Date();
      queryStartDate.setDate(now.getDate() - 7);
      queryEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else { // filterMode === 'month'
      const targetDate = new Date();
      targetDate.setMonth(now.getMonth() + monthOffset);
      queryStartDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      queryEndDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
    }

    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      where('createdAt', '>=', queryStartDate),
      where('createdAt', '<=', queryEndDate)
    );

    if (filterType !== 'all') {
      q = query(q, where('type', '==', filterType));
    }
    if (filterCategory !== 'Semua') {
      q = query(q, where('category', '==', filterCategory));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transactionsData);
      
      let income = 0, expense = 0;
      transactionsData.forEach(trans => {
        if (trans.type === 'income') income += trans.amount;
        else expense += trans.amount;
      });
      setSummary({ income, expense, net: income - expense, count: transactionsData.length });

      setLoading(false);
    }, (err) => {
      console.error("Firebase Error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, filterType, filterCategory, filterMode, monthOffset, startDate, endDate]);

  // Logika untuk Search
  const searchedTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter(trans =>
      trans.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // Logika untuk Paginasi
  const totalPages = Math.ceil(searchedTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchedTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Efek untuk mengisi form edit
  useEffect(() => {
    if (currentlyEditing) {
      setEditTitle(currentlyEditing.title);
      setEditAmount(currentlyEditing.amount);
      setEditType(currentlyEditing.type);
      setEditCategory(currentlyEditing.category);
    }
  }, [currentlyEditing]);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      setFilterMode('custom');
      setCurrentPage(1);
    }
  };

  const handleOpenEditModal = (transaction) => { setCurrentlyEditing(transaction); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setCurrentlyEditing(null); };
  const handleDeleteTransaction = async (id) => { await deleteDoc(doc(db, 'transactions', id)); };
  
  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!currentlyEditing) return;
    const docRef = doc(db, 'transactions', currentlyEditing.id);
    await updateDoc(docRef, { title: editTitle, amount: parseFloat(editAmount), type: editType, category: editCategory });
    handleCloseEditModal();
  };

  const changeMonth = (direction) => {
    setFilterMode('month');
    setMonthOffset(prev => prev + direction);
    setCurrentPage(1);
  };

  const getMonthName = () => {
    if (filterMode !== 'month') return 'Periode Kustom';
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Semua Transaksi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="font-bold mb-2 dark:text-gray-200">Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Periode</label>
              <div className="flex items-center mt-1">
                <button onClick={() => changeMonth(-1)} className="px-2 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <div onClick={() => { setFilterMode('month'); setMonthOffset(0); setCurrentPage(1); }} className="flex-grow text-center px-4 py-2 bg-gray-100 dark:bg-gray-900 dark:text-gray-300 text-sm font-semibold cursor-pointer">
                  {getMonthName()}
                </div>
                <button onClick={() => changeMonth(1)} disabled={monthOffset === 0 && filterMode === 'month'} className="px-2 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
              </div>
              <div className="flex text-xs mt-1 space-x-2">
                <button onClick={() => { setFilterMode('today'); setCurrentPage(1); }} className={`px-2 py-1 rounded ${filterMode === 'today' ? 'bg-blue-100 text-blue-700' : 'dark:text-gray-300'}`}>Hari Ini</button>
                <button onClick={() => { setFilterMode('last_7_days'); setCurrentPage(1); }} className={`px-2 py-1 rounded ${filterMode === 'last_7_days' ? 'bg-blue-100 text-blue-700' : 'dark:text-gray-300'}`}>7 Hari</button>
                <button onClick={() => { setFilterMode('month'); setMonthOffset(0); setCurrentPage(1); }} className={`px-2 py-1 rounded ${filterMode === 'month' && monthOffset === 0 ? 'bg-blue-100 text-blue-700' : 'dark:text-gray-300'}`}>Bulan Ini</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe & Kategori</label>
              <div className="flex flex-col space-y-2 mt-1">
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCategory('Semua'); setCurrentPage(1); }} className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md">
                  <option value="all">Semua Tipe</option>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
                <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }} className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md" disabled={filterType === 'all'}>
                  {filterType !== 'all' && userCategories[filterType].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  {filterType === 'all' && <option>Pilih tipe dulu</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rentang Tanggal Kustom</label>
              <div className="mt-1 react-datepicker-wrapper">
                <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={handleDateChange} className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" dateFormat="dd/MM/yyyy" isClearable={true} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="font-bold mb-2 dark:text-gray-200">Ringkasan Periode Ini</h3>
          <div className="space-y-2 text-sm dark:text-gray-300">
            <div className="flex justify-between"><span>Pemasukan:</span> <span className="font-semibold text-green-600">Rp {summary.income.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span>Pengeluaran:</span> <span className="font-semibold text-red-600">Rp {summary.expense.toLocaleString('id-ID')}</span></div>
            <hr className="my-1 border-gray-200 dark:border-gray-700"/>
            <div className="flex justify-between font-bold dark:text-white"><span>Selisih:</span> <span>Rp {summary.net.toLocaleString('id-ID')}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-xl font-bold dark:text-white">Daftar Transaksi</h3>
          <div className="w-full md:w-1/3">
            <Input type="text" placeholder="Cari berdasarkan judul..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        {loading ? <p className="text-center py-10 dark:text-gray-400">Memuat transaksi...</p> : (
          <>
            <ul className="space-y-3 min-h-[200px]">
              {currentItems.map((trans) => (
                <li key={trans.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div>
                    <span className="block font-medium dark:text-white">{trans.title}</span>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">{trans.category} - {trans.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-semibold ${trans.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {trans.type === 'income' ? '+' : '-'} Rp {trans.amount.toLocaleString('id-ID')}
                    </span>
                    <button onClick={() => handleOpenEditModal(trans)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                    <button onClick={() => handleDeleteTransaction(trans.id)} className="text-red-500 hover:text-red-700 text-sm">Hapus</button>
                  </div>
                </li>
              ))}
            </ul>

            {searchedTransactions.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">Tidak ada transaksi yang cocok.</p>}
            
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button onClick={goToPreviousPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded disabled:opacity-50">
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button onClick={goToNextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded disabled:opacity-50">
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Transaksi">
        <form onSubmit={handleUpdateTransaction} className="space-y-4">
            <Input placeholder="Judul" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <Input type="number" placeholder="Jumlah" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm">
                {userCategories[editType] && userCategories[editType].filter(cat => cat !== 'Semua').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex space-x-4">
              <label><input type="radio" name="editType" value="expense" checked={editType === 'expense'} onChange={(e) => setEditType(e.target.value)} className="mr-2" />Pengeluaran</label>
              <label><input type="radio" name="editType" value="income" checked={editType === 'income'} onChange={(e) => setEditType(e.target.value)} className="mr-2" />Pemasukan</label>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">Simpan Perubahan</button>
        </form>
      </Modal>
    </div>
  );
}
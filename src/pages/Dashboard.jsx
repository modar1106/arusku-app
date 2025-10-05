import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore'; 
import Input from '../components/ui/Input';
import { Link } from 'react-router-dom';
import DonutChart from '../components/dashboard/DonutChart';

const BudgetProgress = ({ category, spent, budget }) => {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = percentage > 100;

  return (
    <div>
      <div className="flex justify-between mb-1 text-sm text-gray-800 dark:text-gray-300">
        <span className="font-medium">{category}</span>
        <span>
          Rp {spent.toLocaleString('id-ID')} / 
          <span className="text-gray-500 dark:text-gray-400"> Rp {budget.toLocaleString('id-ID')}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { currentUser } = useAuth();
  
  // State untuk data dari Firestore
  const [transactions, setTransactions] = useState([]);
  const [userCategories, setUserCategories] = useState({ expense: [], income: [] });
  const [budgets, setBudgets] = useState([]);

  // State untuk form tambah transaksi
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('expense');
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  // State untuk data yang diolah
  const [chartData, setChartData] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalTurnover, setTotalTurnover] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState({});
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    const catQuery = query(collection(db, 'categories'), where('userId', '==', currentUser.uid));
    const unsubCategories = onSnapshot(catQuery, (snapshot) => {
      const categoriesData = { expense: [], income: [] };
      snapshot.forEach((doc) => categoriesData[doc.data().type].push(doc.data().name));
      setUserCategories(categoriesData);
    });

    const budgetQuery = query(collection(db, 'budgets'), where('userId', '==', currentUser.uid));
    const unsubBudgets = onSnapshot(budgetQuery, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => doc.data()));
    });

    const transQuery = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
    const unsubTransactions = onSnapshot(transQuery, (snapshot) => {
      const transData = snapshot.docs.map(doc => doc.data());
      setTransactions(transData);
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubBudgets();
      unsubTransactions();
    };
  }, [currentUser]);

  useEffect(() => {
    const balance = transactions.reduce((acc, trans) => trans.type === 'income' ? acc + trans.amount : acc - trans.amount, 0);
    setTotalBalance(balance);

    const dataByCategory = transactions.reduce((acc, trans) => {
      const category = trans.category || 'Lainnya';
      acc[category] = (acc[category] || 0) + trans.amount;
      return acc;
    }, {});
    const turnover = Object.values(dataByCategory).reduce((sum, value) => sum + value, 0);
    setTotalTurnover(turnover);
    setChartData(Object.keys(dataByCategory).map(key => ({ name: key, value: dataByCategory[key] })));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const spending = transactions
      .filter(trans => trans.type === 'expense' && trans.createdAt && trans.createdAt.toDate() >= startOfMonth)
      .reduce((acc, trans) => {
        acc[trans.category] = (acc[trans.category] || 0) + trans.amount;
        return acc;
      }, {});
    setMonthlySpending(spending);

  }, [transactions]);

  useEffect(() => {
    if (newType === 'expense' && userCategories.expense.length > 0) {
      setNewCategory(userCategories.expense[0]);
    } else if (newType === 'income' && userCategories.income.length > 0) {
      setNewCategory(userCategories.income[0]);
    } else {
      setNewCategory('');
    }
  }, [newType, userCategories]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTitle || !newAmount || !newCategory) return setError('Semua field harus diisi.');
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        title: newTitle,
        amount: parseFloat(newAmount),
        type: newType,
        category: newCategory,
        createdAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewAmount('');
      setError('');
    } catch (err) {
      setError('Gagal menambahkan transaksi.');
    }
  };

  if (loading) {
    return <div className="text-center p-10 dark:text-gray-300">Memuat data...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl text-gray-900 dark:text-white font-bold">Dashboard</h1>
        <Link to="/transactions" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 font-bold py-2 px-4 rounded w-full md:w-auto text-center">
          Lihat Semua Transaksi &rarr;
        </Link>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
          <div>
            <h3 className="text-lg text-gray-800 dark:text-gray-200 font-semibold mb-2">Total Saldo</h3>
            <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {totalBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div>
            <h3 className="text-lg text-gray-800 dark:text-gray-200 font-semibold mb-2">Rincian Transaksi</h3>
            <DonutChart data={chartData} totalValue={totalTurnover} />
          </div>
          <div>
            <hr className="border-gray-200 dark:border-gray-700" />
            <h3 className="text-lg text-gray-800 dark:text-gray-200 font-semibold my-4">Progress Anggaran Bulan Ini</h3>
            <div className="space-y-4">
              {budgets.map(budget => (
                <BudgetProgress 
                  key={budget.category}
                  category={budget.category}
                  spent={monthlySpending[budget.category] || 0}
                  budget={budget.amount}
                />
              ))}
              {budgets.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Anda belum mengatur anggaran. Atur di halaman Pengaturan.</p>}
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tambah Transaksi Baru</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <Input placeholder="Judul (cth: Belanja Bulanan)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Input type="number" placeholder="Jumlah (cth: 500000)" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
              <select 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)} 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={userCategories[newType].length === 0}
              >
                {userCategories[newType].length > 0 ? (
                  userCategories[newType].map(cat => <option key={cat} value={cat}>{cat}</option>)
                ) : (
                  <option>Buat kategori dulu di Pengaturan</option>
                )}
              </select>
            </div>
            <div className="flex space-x-4 text-gray-800 dark:text-gray-300">
              <label className="flex items-center">
                <input type="radio" name="type" value="expense" checked={newType === 'expense'} onChange={(e) => setNewType(e.target.value)} className="mr-2" />
                Pengeluaran
              </label>
              <label className="flex items-center">
                <input type="radio" name="type" value="income" checked={newType === 'income'} onChange={(e) => setNewType(e.target.value)} className="mr-2" />
                Pemasukan
              </label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300" disabled={userCategories[newType].length === 0}>
              Tambah Transaksi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
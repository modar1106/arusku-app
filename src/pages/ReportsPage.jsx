import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import TrendChart from '../components/reports/TrendChart';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('daily');
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);

      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthOffset);
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),  
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactionsData = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push(doc.data());
        });
        setTransactions(transactionsData);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser, monthOffset]); 

  const changeMonth = (direction) => {
    setMonthOffset(prev => prev + direction);
  };

  const getMonthName = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Laporan Keuangan</h1>
      
      <div className="flex justify-center items-center mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className="text-center px-6 py-2 bg-gray-100 dark:bg-gray-900 text-lg font-semibold text-gray-800 dark:text-gray-300">
          {getMonthName()}
        </div>
        <button onClick={() => changeMonth(1)} disabled={monthOffset === 0} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tren Pemasukan vs Pengeluaran</h2>
        </div>
        {loading ? (
          <p className="text-center py-10 text-gray-500 dark:text-gray-400">Memuat data grafik...</p>
        ) : (
          <TrendChart transactions={transactions} timeFrame={timeFrame} />
        )}
      </div>
    </div>
  );
}
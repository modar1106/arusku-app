import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import TrendChart from '../components/reports/TrendChart';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('daily'); // <-- 1. State baru: 'daily' atau 'monthly'

  useEffect(() => {
    if (currentUser) {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
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
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Laporan Keuangan</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tren Pemasukan vs Pengeluaran</h2>
          
          {/* --- 2. Tombol Kontrol Waktu --- */}
          <div className="flex mt-2 sm:mt-0 rounded-md shadow-sm">
            <button
              onClick={() => setTimeFrame('daily')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none ${
                timeFrame === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setTimeFrame('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 dark:border-gray-600 focus:outline-none ${
                timeFrame === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-500 dark:text-gray-400">Memuat data grafik...</p>
        ) : (
          // --- 3. Kirim timeFrame sebagai prop ---
          <TrendChart transactions={transactions} timeFrame={timeFrame} />
        )}
      </div>
    </div>
  );
}
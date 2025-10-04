import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fungsi untuk memformat tanggal (misal: "Oct 2")
const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

export default function TrendChart({ transactions }) {
  // useMemo digunakan agar data tidak diolah ulang setiap kali render, kecuali jika transaksinya berubah
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Kelompokkan transaksi berdasarkan hari
    const groupedByDay = transactions.reduce((acc, trans) => {
      const date = trans.createdAt.toDate().toISOString().split('T')[0]; // Ambil tanggalnya saja (YYYY-MM-DD)
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0 };
      }
      if (trans.type === 'income') {
        acc[date].income += trans.amount;
      } else {
        acc[date].expense += trans.amount;
      }
      return acc;
    }, {});

    // Ubah menjadi array dan urutkan berdasarkan tanggal
    return Object.keys(groupedByDay)
      .map(date => ({
        date,
        Pemasukan: groupedByDay[date].income,
        Pengeluaran: groupedByDay[date].expense,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions]);

  if (chartData.length === 0) {
    return <div className="text-center text-gray-500 py-10">Data tidak cukup untuk menampilkan grafik.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={formatDate} />
        <YAxis tickFormatter={(value) => `Rp ${(value/1000).toLocaleString('id-ID')}k`} />
        <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
        <Legend />
        <Line type="monotone" dataKey="Pemasukan" stroke="#00C49F" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="Pengeluaran" stroke="#FF8042" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import EmptyState from '../ui/EmptyState';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#4CAF50', '#FF5722', '#673AB7'];

export default function DonutChart({ data, totalValue }) {
  const { theme } = useTheme();

  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <EmptyState
        title="Data Belum Cukup"
        message="Tambahkan transaksi pemasukan atau pengeluaran untuk melihat ringkasan visual di sini."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        
        <Tooltip
          formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
          }}
          labelStyle={{ color: theme === 'dark' ? '#d1d5db' : '#111827' }}
        />
        <Legend wrapperStyle={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }} />
        
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-gray-500 dark:fill-gray-400">
          Total
        </text>
        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-800 dark:fill-white">
          Rp {(totalValue / 1000).toLocaleString('id-ID')}k
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

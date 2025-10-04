import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext'; // <-- 1. Import useTheme

// Sediakan lebih banyak warna untuk berbagai kategori
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#4CAF50', '#FF5722', '#673AB7'];

export default function DonutChart({ data, totalValue }) {
  const { theme } = useTheme(); // <-- 2. Dapatkan tema yang sedang aktif

  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Belum ada data untuk ditampilkan.
      </div>
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
        
        {/* --- 3. Perubahan Styling Tooltip & Legenda --- */}
        <Tooltip
          formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
          contentStyle={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', // bg-gray-800 atau bg-white
            borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db', // border-gray-600 atau border-gray-300
          }}
          labelStyle={{ color: theme === 'dark' ? '#d1d5db' : '#111827' }} // text-gray-300 atau text-gray-900
        />
        <Legend wrapperStyle={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }} />
        
        {/* Teks kustom di tengah */}
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
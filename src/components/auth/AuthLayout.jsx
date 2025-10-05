export default function AuthLayout({ title, children }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="relative flex flex-col m-6 space-y-8 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl md:flex-row md:space-y-0">
        <div className="flex flex-col justify-center p-8 md:p-14">
          <span className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">{title}</span>
          <span className="font-light text-gray-500 dark:text-gray-400 mb-8">
            Selamat datang! Silakan masukkan detail Anda.
          </span>
          {children}
        </div>

        <div className="relative hidden md:block">
          <img
            src="https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="img"
            className="w-[400px] h-full hidden rounded-r-2xl md:block object-cover"
          />
          <div className="absolute hidden md:block top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center p-4 rounded-lg">
            <p className="font-bold text-4xl">ArusKu</p>
            <p className="mt-2">Lacak Keuanganmu, Raih Mimpimu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
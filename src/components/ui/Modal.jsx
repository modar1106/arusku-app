export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    // Latar belakang gelap (overlay)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Konten Modal */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
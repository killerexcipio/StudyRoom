export default function MobileHeader() {
  return (
    <header className="md:hidden p-4 bg-white border-b border-gray-200 flex items-center justify-between">
      <h1 id="mobile-header-title" className="text-xl font-bold">
        My Notes
      </h1>
      <div>
        <button
          id="toggle-right-sidebar"
          className="text-gray-600 hover:text-gray-900 mr-2"
        >
          <i className="fas fa-info-circle"></i>
        </button>
        <button id="toggle-left-sidebar" className="text-gray-600 hover:text-gray-900">
          <i className="fas fa-bars"></i>
        </button>
      </div>
    </header>
  );
}

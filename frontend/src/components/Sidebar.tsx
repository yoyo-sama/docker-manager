import type { View } from '../types';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Sidebar({ currentView, onViewChange }: Props) {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Docker Manager</h1>
      </div>
      <nav className="flex-1 p-2">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
            currentView === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          Dashboard
        </button>
      </nav>
    </div>
  );
}

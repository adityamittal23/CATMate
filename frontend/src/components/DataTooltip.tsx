import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DataTooltipProps {
  columnKey: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const DataTooltip: React.FC<DataTooltipProps> = ({
  columnKey,
  label,
  className = '',
  iconOnly = false
}) => {
  const { dataDictionary, theme } = useApp();
  const [show, setShow] = useState(false);

  const description = dataDictionary[columnKey] || `Dataset field: ${columnKey}`;

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {!iconOnly && label && (
        <span className="font-semibold">{label}</span>
      )}
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(prev => !prev)}
        className="text-slate-400 hover:text-[#FFCD11] transition-colors p-0.5 rounded focus:outline-none"
        title="View field dictionary description"
        aria-label={`Description for ${columnKey}`}
      >
        <HelpCircle size={14} className="opacity-70 hover:opacity-100" />
      </button>

      {show && (
        <div
          className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-lg text-xs leading-relaxed shadow-xl border pointer-events-none transition-opacity duration-150 ${
            theme === 'day'
              ? 'bg-slate-900 text-white border-slate-700 shadow-slate-900/40'
              : 'bg-[#222222] text-slate-100 border-[#FFCD11]/40 shadow-black/80'
          }`}
        >
          <div className="font-bold text-[#FFCD11] mb-1 flex items-center justify-between font-mono text-[10px] uppercase">
            <span>{columnKey}</span>
            <span className="text-slate-400">DATA DICT</span>
          </div>
          <p>{description}</p>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
              theme === 'day' ? 'border-t-slate-900' : 'border-t-[#222222]'
            }`}
          />
        </div>
      )}
    </div>
  );
};

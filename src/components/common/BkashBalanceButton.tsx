import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { RotateCw } from 'lucide-react';

interface BkashBalanceButtonProps {
  className?: string;
  compact?: boolean;
}

export const BkashBalanceButton: React.FC<BkashBalanceButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const {
    lang,
    employee,
    isEmployeeAuthenticated,
    refreshEmployeeProfile,
    setActivePortal,
    showToast,
  } = useApp();

  const [isShowingBalance, setIsShowingBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently showing balance, tap again hides it immediately
    if (isShowingBalance) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsShowingBalance(false);
      return;
    }

    // If not authenticated, prompt to login
    if (!isEmployeeAuthenticated || !employee) {
      showToast(
        lang === 'bn'
          ? 'ব্যালেন্স দেখতে রিসেলার অ্যাকাউন্টে লগইন করুন।'
          : 'Please login to view reseller balance.',
        'info'
      );
      setActivePortal('employee');
      return;
    }

    // Trigger refreshing animation and fetch latest balance
    setIsRefreshing(true);
    try {
      await refreshEmployeeProfile();
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
      setIsShowingBalance(true);

      // Auto-hide balance after 4.5 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsShowingBalance(false);
      }, 4500);
    }
  };

  const availableBalance = employee?.wallet?.availableBalance ?? 0;

  // Format currency with Bengali or English digits
  const formattedBalance = lang === 'bn'
    ? `৳ ${availableBalance.toLocaleString('bn-BD')}`
    : `৳ ${availableBalance.toLocaleString('en-US')}`;

  return (
    <button
      type="button"
      onClick={handleTap}
      title={
        !isEmployeeAuthenticated
          ? (lang === 'bn' ? 'লগইন করে ব্যালেন্স দেখুন' : 'Login to view balance')
          : (isShowingBalance
              ? (lang === 'bn' ? 'ব্যালেন্স লুকাতে চাপুন' : 'Tap to hide balance')
              : (lang === 'bn' ? 'ব্যালেন্স দেখতে চাপুন' : 'Tap to view balance'))
      }
      aria-label="Check Balance"
      className={`group relative overflow-hidden rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 shadow-sm hover:shadow transition-all duration-200 select-none cursor-pointer flex items-center shrink-0 w-[88px] sm:w-auto ${
        compact ? 'pl-1.5 pr-2 py-1 sm:pl-2 sm:pr-3 sm:py-1 gap-1' : 'pl-2 pr-2.5 py-1.5 gap-1.5'
      } ${className}`}
    >
      {/* Left Icon Badge */}
      <div
        className={`rounded-md bg-[#009245] text-white flex items-center justify-center font-bold shadow-xs transition-transform duration-200 shrink-0 ${
          compact ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 text-[11px]' : 'w-6 h-6 text-[12px]'
        } ${isRefreshing ? 'animate-spin' : 'group-hover:scale-105'}`}
      >
        {isRefreshing ? (
          <RotateCw className="w-3 h-3 animate-spin" />
        ) : (
          <span className="leading-none select-none font-bold text-center">৳</span>
        )}
      </div>

      {/* Center Label / Balance Value (bKash style: shows 'ব্যালেন্স' by default, tap to toggle amount strictly inside frame) */}
      <div className="flex items-center justify-center min-w-0 flex-1 overflow-hidden">
        {isRefreshing ? (
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center animate-pulse truncate w-full">
            <span>লোড হচ্ছে</span>
          </span>
        ) : isShowingBalance ? (
          <div className="flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 w-full truncate">
            <span className="text-xs sm:text-sm font-black text-[#009245] dark:text-emerald-400 tracking-tight whitespace-nowrap truncate text-center">
              {formattedBalance}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center animate-in fade-in duration-200 w-full truncate">
            <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap truncate text-center">
              {lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

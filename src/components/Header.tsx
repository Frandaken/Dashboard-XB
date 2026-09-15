import React, { useState, useEffect } from 'react';

export const Header: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="classroom-header"
      className="flex items-center justify-between border-b border-[#E4DDCE] pb-2 flex-shrink-0"
    >
      <div>
        <h1 className="font-display font-semibold text-xl sm:text-2xl text-[#2B2A28] tracking-tight">
          Jadwal Kelas XB
        </h1>
      </div>

      <div className="text-right">
        <div className="font-display text-xl sm:text-2xl font-semibold text-[#2B2A28] tabular-nums leading-none tracking-tight">
          {timeStr} <span className="text-xs sm:text-sm font-sans font-medium text-[#6B6862]">WIB</span>
        </div>
      </div>
    </header>
  );
};

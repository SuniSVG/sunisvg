'use client';

import React, { useState, useEffect } from 'react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set target date to next National High School Exam (approx late June)
    const currentYear = new Date().getFullYear();
    let targetDate = new Date(currentYear, 5, 27); // June 27th
    
    if (new Date() > targetDate) {
      targetDate = new Date(currentYear + 1, 5, 27);
    }

    const timer = setInterval(() => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white text-center max-w-4xl mx-auto transform -translate-y-1/2 mt-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <h3 className="text-2xl md:text-3xl font-bold mb-8 relative z-10">Đếm ngược đến Kỳ thi THPT Quốc gia</h3>
      <div className="flex justify-center gap-4 md:gap-8 relative z-10">
        {[
          { label: 'Ngày', value: timeLeft.days },
          { label: 'Giờ', value: timeLeft.hours },
          { label: 'Phút', value: timeLeft.minutes },
          { label: 'Giây', value: timeLeft.seconds }
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center text-2xl md:text-4xl font-black shadow-inner border border-white/30 mb-2">
              {item.value.toString().padStart(2, '0')}
            </div>
            <span className="text-sm md:text-base font-medium uppercase tracking-wider opacity-90">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

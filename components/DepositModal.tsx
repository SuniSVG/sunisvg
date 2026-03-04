'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';
import type { Account } from '@/types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Account;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [amount, setAmount] = useState(100000);
  const qrBaseUrl = 'https://qr.sepay.vn/img?acc=VQRQAFCMX0448&bank=MBBank';
  const description = `NAPTIEN${currentUser.Email.replace(/[@.]/g, '')}`;
  const qrUrl = `${qrBaseUrl}&amount=${amount}&des=${encodeURIComponent(description)}`;
  const { refreshCurrentUser } = useAuth();
  const { addToast } = useToast();
  const initialBalance = useMemo(() => currentUser.Money || 0, [currentUser.Money]); 

  useEffect(() => {
    if (!isOpen) return;

    let pollCount = 0;
    const maxPolls = 40; // 40 polls * 3s/poll = 120s = 2 minutes timeout

    const interval = setInterval(async () => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(interval);
        addToast('Không thể xác nhận giao dịch tự động. Vui lòng kiểm tra lại số dư sau.', 'info');
        onClose();
        return;
      }
      
      const updatedUser = await refreshCurrentUser({ silent: true });
      if (updatedUser && (updatedUser.Money || 0) > initialBalance) {
        onSuccess();
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, initialBalance, refreshCurrentUser, onSuccess, currentUser.Email, addToast, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nạp tiền vào tài khoản
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Icon name="close" className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-8 text-center space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-3">
              Nhập số tiền cần nạp (VND)
            </label>
            <div className="relative">
              <input 
                id="amount" 
                type="number" 
                value={amount} 
                onChange={e => setAmount(Math.max(10000, parseInt(e.target.value) || 10000))} 
                className="w-full text-center text-3xl font-bold p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-br from-white to-gray-50" 
                min="10000" 
                step="10000" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">đ</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl blur-xl opacity-50"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrUrl} 
                alt="Mã QR thanh toán SePay" 
                className="mx-auto w-64 h-64 rounded-xl" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Icon name="user" className="w-5 h-5 text-blue-500" />
              <p className="text-sm">Quét mã QR bằng ứng dụng ngân hàng</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Icon name="information-circle" className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 text-left">
                  Số dư sẽ <span className="font-bold">tự động cập nhật</span> sau khi giao dịch thành công (khoảng 3-5 giây)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-3xl border-t border-gray-100">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

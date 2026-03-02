'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAccounts, redeemVoucher, fetchVouchers, activateVoucher } from '@/services/googleSheetService';
import { motion } from 'motion/react';
import { Copy, CheckCircle2, Clock, Ticket, Zap, HelpCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// Định nghĩa kiểu dữ liệu cho Voucher
interface Voucher {
    Code: string;
    Title: string;
    Description: string;
    Discount: string;
    ExpiryDate: string;
    Status: 'Active' | 'Inactive';
}

export default function VouchersPage() {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
    const [usedVouchers, setUsedVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeemCode, setRedeemCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isActivating, setIsActivating] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                // 1. Lấy lại thông tin account mới nhất để đảm bảo có cột Voucher
                // Tối ưu: Gọi song song fetchAccounts và fetchVouchers
                const [accounts, allVouchersRaw] = await Promise.all([
                    fetchAccounts(),
                    fetchVouchers()
                ]);

                const currentAcc = accounts.find(a => a.Email.toLowerCase() === currentUser.Email.toLowerCase());
                
                // Lấy mã voucher từ cột "Voucher" (cần đảm bảo tên cột trong sheet Accounts là "Voucher")
                // Ép kiểu any để truy cập cột động nếu type Account chưa có field này
                const voucherCode = (currentAcc as any)?.['Voucher'];

                if (voucherCode && typeof voucherCode === 'string') {
                    const voucherList: Voucher[] = Array.isArray(allVouchersRaw) ? allVouchersRaw : [];
                    
                    // 3. Tách chuỗi "CODE1, CODE2" thành mảng
                    const rawCodes = voucherCode.split(',').map(c => c.trim().toUpperCase());
                    
                    // Phân loại mã thành active và history
                    const activeCodes: string[] = [];
                    const historyCodes: string[] = [];

                    rawCodes.forEach(code => {
                        // Kiểm tra format 00...00
                        if (code.startsWith('00') && code.endsWith('00') && code.length > 4) {
                            // Lấy mã gốc ở giữa (bỏ 2 ký tự đầu và 2 ký tự cuối)
                            historyCodes.push(code.slice(2, -2));
                        } else {
                            activeCodes.push(code);
                        }
                    });

                    // Tạo map để tra cứu thông tin chi tiết voucher
                    const voucherDetailsMap = new Map(voucherList.map(v => [v.Code.toUpperCase(), v]));

                    // Lấy thông tin chi tiết, giữ nguyên thứ tự từ chuỗi của user
                    const foundVouchers = activeCodes
                        .map(code => voucherDetailsMap.get(code))
                        .filter((v): v is Voucher => !!v && v.Status === 'Active');
                    // Với lịch sử, đảo ngược để hiển thị cái mới nhất lên đầu
                    const foundUsed = historyCodes.reverse()
                        .map(code => voucherDetailsMap.get(code))
                        .filter((v): v is Voucher => !!v);
                    setMyVouchers(foundVouchers);
                    setUsedVouchers(foundUsed);
                } else {
                    setMyVouchers([]);
                    setUsedVouchers([]);
                }
            } catch (error) {
                console.error('Lỗi tải voucher:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser, refreshKey]);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        addToast('Đã sao chép mã voucher!', 'success');
    };

    const handleActivate = async (code: string) => {
        if (!currentUser) return;
        if (!window.confirm(`Bạn có chắc muốn kích hoạt voucher ${code} để cộng tiền vào tài khoản?`)) return;

        setIsActivating(code);
        try {
            const result = await activateVoucher(currentUser.Email, code);
            if (result.success) {
                addToast(`Kích hoạt thành công! Số dư mới: ${(result.newBalance || 0).toLocaleString()}đ`, 'success');
                setRefreshKey(prev => prev + 1); // Tải lại để voucher biến mất (vì đã dùng)
            } else {
                addToast(result.error || 'Kích hoạt thất bại.', 'error');
            }
        } catch (error) {
            addToast('Lỗi kết nối.', 'error');
        } finally {
            setIsActivating(null);
        }
    };

    const handleRedeem = async () => {
        if (!currentUser) return;
        if (!redeemCode.trim()) {
            addToast('Vui lòng nhập mã voucher.', 'info');
            return;
        }

        setIsRedeeming(true);
        try {
            const result = await redeemVoucher(currentUser.Email, redeemCode.trim());
            if (result.success) {
                addToast('Áp dụng voucher thành công!', 'success');
                setRedeemCode('');
                setRefreshKey(prev => prev + 1); // Tải lại dữ liệu để hiện voucher mới
            } else {
                addToast(result.error || 'Mã voucher không hợp lệ hoặc đã hết hạn.', 'error');
            }
        } catch (error: any) {
            addToast(error?.message || 'Có lỗi xảy ra khi đổi mã.', 'error');
        } finally {
            setIsRedeeming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Kho Voucher</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icon name="ticket" className="w-6 h-6" />
                        <span>{myVouchers.length} voucher</span>
                        
                        <Link 
                            href="/support/how-to-get-code" 
                            className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Cách lấy mã code"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {myVouchers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myVouchers.map((voucher, index) => (
                            <motion.div 
                                key={voucher.Code}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-1 shadow-xl overflow-hidden group"
                            >
                                {/* Ticket Cutouts */}
                                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full"></div>
                                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full"></div>

                                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 h-full flex flex-col text-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <Ticket className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">
                                            {voucher.Discount} OFF
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-xl font-black mb-2">{voucher.Title}</h3>
                                    <p className="text-orange-50 text-sm mb-6 flex-1">{voucher.Description}</p>
                                    
                                    <div className="border-t border-white/20 pt-4 flex items-center justify-between">
                                        <div className="flex flex-col min-w-0 mr-2">
                                            <span className="text-[10px] uppercase opacity-70 font-bold">Mã voucher</span>
                                            <code className="font-mono font-bold text-lg tracking-wider truncate">{voucher.Code}</code>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => copyToClipboard(voucher.Code)}
                                                className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                                                title="Sao chép mã"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleActivate(voucher.Code)}
                                                disabled={isActivating === voucher.Code}
                                                className="px-3 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
                                                title="Kích hoạt ngay để cộng tiền"
                                            >
                                                {isActivating === voucher.Code ? <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4 fill-orange-600" />}
                                                Kích hoạt
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-100 opacity-80">
                                        <Clock className="w-3.5 h-3.5" /> HSD: {voucher.ExpiryDate}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Icon name="tag" className="w-16 h-16 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Bạn chưa có voucher nào</h2>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Tham gia các sự kiện, hoàn thành nhiệm vụ hoặc theo dõi fanpage để nhận voucher giảm giá hấp dẫn.
                        </p>
                        <button className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
                            <Icon name="gift" className="w-5 h-5" />
                            Tìm hiểu thêm
                        </button>
                    </div>
                )}

                {/* Redeem Section */}
                <div className="mt-10 pt-8 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Nhập mã voucher</h3>
                    <div className="flex gap-3 max-w-md">
                        <input 
                            type="text" 
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value)}
                            placeholder="Nhập mã quà tặng..." 
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all uppercase placeholder:normal-case"
                        />
                        <button 
                            onClick={handleRedeem}
                            disabled={isRedeeming || !redeemCode}
                            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                            {isRedeeming ? 'Đang xử lý...' : 'Áp dụng'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">* Mã voucher sẽ được lưu vào tài khoản và tự động áp dụng khi thanh toán.</p>
                </div>

                {/* History Section */}
                {usedVouchers.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            Lịch sử sử dụng
                        </h3>
                        <div className="space-y-3">
                            {usedVouchers.map((voucher) => (
                                <div key={voucher.Code} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 opacity-75 grayscale hover:grayscale-0 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{voucher.Title}</h4>
                                            <p className="text-xs text-gray-500">Mã: {voucher.Code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-bold text-gray-600">Đã dùng</span>
                                        <span className="text-xs text-gray-400">{voucher.Discount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchPremiumArticles, fetchPurchasedCategories, purchasePremiumCategory } from '@/services/googleSheetService';
import type { ScientificArticle, Account } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Icon } from '@/components/shared/Icon';

const DepositModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentUser: Account;
  onSuccess: () => void;
}> = ({ isOpen, onClose, currentUser, onSuccess }) => {
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

const PremiumArticleCard = React.memo<{ 
  article: ScientificArticle; 
  isPurchased: boolean;
  index: number;
}>(({ article, isPurchased, index }) => {
  if (isPurchased) {
    return (
      <a 
        href={article.DocumentURL} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group block bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Icon name="check-circle" className="w-5 h-5 text-green-600" />
        </div>
        
        <div className="mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-3">
            <Icon name="document" className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {article.Title}
          </h3>
        </div>

        {article.Abstract && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
            {article.Abstract}
          </p>
        )}

        <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mt-auto pt-4 border-t border-gray-100">
          <span>Xem tài liệu</span>
          <Icon name="arrowRight" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
    );
  }

  return (
    <div 
      className="relative block bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-400/5 to-gray-600/5 rounded-2xl backdrop-blur-sm"></div>
      
      <div className="relative">
        <div className="absolute top-0 right-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <Icon name="lock" className="w-5 h-5 text-gray-400" />
        </div>

        <div className="mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-3">
            <Icon name="document" className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-bold text-lg text-gray-500 line-clamp-2 mb-2">
            {article.Title}
          </h3>
        </div>

        {article.Abstract && (
          <p className="text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">
            {article.Abstract}
          </p>
        )}

        <div className="flex items-center gap-2 text-gray-400 font-semibold text-sm mt-auto pt-4 border-t border-gray-200">
          <Icon name="lock" className="w-4 h-4" />
          <span>Mở khóa khi mua gói</span>
        </div>
      </div>
    </div>
  );
});

PremiumArticleCard.displayName = 'PremiumArticleCard';

const CategoryCard = React.memo<{
  category: { name: string; price: number; count: number };
  isPurchased: boolean;
  onClick: () => void;
  index: number;
}>(({ category, isPurchased, onClick, index }) => {
  const gradient = useMemo(() => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-purple-500 to-pink-600',
      'from-pink-500 to-rose-600',
      'from-rose-500 to-orange-600',
      'from-orange-500 to-amber-600',
      'from-amber-500 to-yellow-600',
      'from-yellow-500 to-lime-600',
      'from-lime-500 to-green-600',
      'from-green-500 to-emerald-600',
      'from-emerald-500 to-teal-600',
      'from-teal-500 to-cyan-600',
      'from-cyan-500 to-blue-600',
    ];
    return gradients[index % gradients.length];
  }, [index]);

  return (
    <button 
      onClick={onClick} 
      className="group relative p-6 bg-white rounded-2xl shadow-lg text-left transform hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${gradient}`}></div>
      
      {isPurchased && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
          <Icon name="check-circle" className="w-3 h-3" />
          Đã sở hữu
        </div>
      )}

      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon name="document" className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
        {category.name}
      </h3>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="flex items-center gap-2 text-gray-600">
          <Icon name="document" className="w-4 h-4" />
          <span className="font-medium">{category.count} tài liệu</span>
        </span>
      </div>

      <div className="pt-3 border-t border-gray-100">
        {category.price > 0 ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {category.price.toLocaleString('vi-VN')}
            </span>
            <span className="text-sm text-gray-500 font-semibold">VNĐ</span>
          </div>
        ) : (
          <span className="text-lg font-bold text-green-600 flex items-center gap-2">
            <Icon name="user" className="w-5 h-5" />
            Miễn phí
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
        <span>Xem chi tiết</span>
        <Icon name="arrowRight" className="w-4 h-4" />
      </div>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

export default function Premium() {
    const [articles, setArticles] = useState<ScientificArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [purchasedCategories, setPurchasedCategories] = useState<Set<string>>(new Set());
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

    const { currentUser, refreshCurrentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [artData, purchasedData] = await Promise.all([
                fetchPremiumArticles(),
                currentUser ? fetchPurchasedCategories(currentUser.Email) : Promise.resolve([])
            ]);
            setArticles(artData.filter(a => a.Status === 'Approved'));
            setPurchasedCategories(new Set(purchasedData));
        } catch (err) {
            setError('Không thể tải tài liệu Premium. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const categories = useMemo(() => {
        const categoryMap = new Map<string, { price: number, count: number }>();
        articles.forEach(article => {
            const price = parseFloat(article.Price || '0');
            if (!categoryMap.has(article.Category)) {
                categoryMap.set(article.Category, { price: price, count: 0 });
            }
            const existing = categoryMap.get(article.Category)!;
            categoryMap.set(article.Category, { ...existing, count: existing.count + 1 });
        });
        return Array.from(categoryMap.entries()).map(([name, data]) => ({ name, ...data }));
    }, [articles]);
    
    const articlesByCategory = useMemo(() => 
        articles.filter(a => a.Category === selectedCategory),
        [articles, selectedCategory]
    );

    const handlePurchase = async (categoryName: string, price: number) => {
        if (!currentUser) {
            addToast('Vui lòng đăng nhập để mua hàng.', 'info');
            router.push('/login');
            return;
        }
        if ((currentUser.Money || 0) < price) {
            addToast('Số dư không đủ. Vui lòng nạp thêm tiền.', 'error');
            setIsDepositModalOpen(true);
            return;
        }

        const confirmPurchase = window.confirm(
            `Bạn có chắc chắn muốn mua gói "${categoryName}" với giá ${price.toLocaleString('vi-VN')}đ không?`
        );
        if (!confirmPurchase) return;

        setIsPurchasing(categoryName);
        try {
            const result = await purchasePremiumCategory(currentUser.Email, categoryName);
            if (result.success) {
                addToast('Mua thành công! Vui lòng kiểm tra email để nhận tài liệu.', 'success');
                await refreshCurrentUser();
                setPurchasedCategories(prev => new Set(prev).add(categoryName));
            } else {
                addToast(result.error || 'Giao dịch thất bại.', 'error');
            }
        } catch (e: any) {
            addToast(e.message || 'Lỗi kết nối.', 'error');
        } finally {
            setIsPurchasing(null);
        }
    };
    
    const handleDepositSuccess = useCallback(async () => {
        setIsDepositModalOpen(false);
        await refreshCurrentUser();
        addToast('Nạp tiền thành công! Số dư của bạn đã được cập nhật.', 'success');
    }, [addToast, refreshCurrentUser]);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 space-y-6">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200"></div>
                    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-purple-600 absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="star" className="w-8 h-8 text-purple-600 animate-pulse" />
                    </div>
                </div>
                <p className="text-gray-600 font-medium animate-pulse">Đang tải nội dung Premium...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10 bg-red-50 rounded-2xl border border-red-200">
                <Icon name="alert" className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-700 mb-2">Đã xảy ra lỗi</h3>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="text-center space-y-6 py-8">
                <div className="inline-block relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-2xl">
                            <Icon name="star" className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                            Thị trường Premium
                        </h1>
                        <div className="h-1.5 bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 rounded-full mt-3 w-48 mx-auto"></div>
                    </div>
                </div>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Khám phá kho tài liệu cao cấp và các sản phẩm tri thức độc quyền
                </p>
            </section>

            {/* Balance Card */}
            <section className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-8 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
                
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="user" className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold">Số dư của bạn</h2>
                        </div>
                        <p className="text-5xl font-extrabold mt-3 drop-shadow-lg">
                            {(currentUser?.Money || 0).toLocaleString('vi-VN')}
                            <span className="text-3xl ml-2">đ</span>
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => { 
                            if (!currentUser) { 
                                addToast('Vui lòng đăng nhập để nạp tiền.', 'info'); 
                                router.push('/login'); 
                                return; 
                            } 
                            setIsDepositModalOpen(true); 
                        }} 
                        className="group bg-white text-green-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <Icon name="plus" className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-lg">Nạp tiền</span>
                    </button>
                </div>
            </section>

            {/* Main Content */}
            <main>
                {selectedCategory ? (
                    <div className="space-y-6">
                        <button 
                            onClick={() => setSelectedCategory(null)} 
                            className="flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all group"
                        >
                            <Icon name="arrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform"/>
                            <span>Quay lại danh sách</span>
                        </button>

                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedCategory}</h2>
                                    <p className="text-gray-600 flex items-center gap-2">
                                        <Icon name="document" className="w-4 h-4" />
                                        {articlesByCategory.length} tài liệu có sẵn
                                    </p>
                                </div>
                                
                                {(() => {
                                    const price = articlesByCategory.length > 0 ? parseFloat(articlesByCategory[0].Price || '0') : 0;
                                    const isPurchased = purchasedCategories.has(selectedCategory);
                                    const isBeingPurchased = isPurchasing === selectedCategory;

                                    if (isPurchased) {
                                        return (
                                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg">
                                                <Icon name="check-circle" className="w-5 h-5" />
                                                <span>Đã sở hữu</span>
                                            </div>
                                        );
                                    }
                                    if (price > 0) {
                                        return (
                                            <button 
                                                onClick={() => handlePurchase(selectedCategory, price)} 
                                                disabled={isBeingPurchased}
                                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-wait shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 min-w-[200px]"
                                            >
                                                {isBeingPurchased ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                        <span>Đang xử lý...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon name="user" className="w-5 h-5" />
                                                        <span>Mua gói ({price.toLocaleString('vi-VN')}đ)</span>
                                                    </>
                                                )}
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articlesByCategory.map((article, index) => (
                                <PremiumArticleCard 
                                    key={article.ID}
                                    article={article}
                                    isPurchased={purchasedCategories.has(selectedCategory)}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Danh mục tài liệu</h2>
                            <p className="text-gray-600">Chọn danh mục để xem và mua tài liệu cao cấp</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {categories.map((cat, index) => (
                                <CategoryCard 
                                    key={cat.name}
                                    category={cat}
                                    isPurchased={purchasedCategories.has(cat.name)}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {currentUser && (
                <DepositModal 
                    isOpen={isDepositModalOpen} 
                    onClose={() => setIsDepositModalOpen(false)} 
                    currentUser={currentUser} 
                    onSuccess={handleDepositSuccess}
                />
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes fade-in-up {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                    opacity: 0;
                }
            `}} />
        </div>
    );
}

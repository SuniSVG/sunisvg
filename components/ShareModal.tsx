'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Copy, Check, Link as LinkIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url: string;
    thumbnail?: string;
    platformName?: string;
}

export const ShareModal = ({ 
    isOpen, 
    onClose, 
    title, 
    url, 
    thumbnail, 
    platformName = 'SuniSVG' 
}: ShareModalProps) => {
    const [isCopied, setIsCopied] = useState(false);

    // Reset copy state when modal closes
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setIsCopied(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-blue-600" />
                                Chia sẻ nội dung này
                            </h3>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Preview Frame */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Xem trước</p>
                                <div className="flex gap-4 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 relative">
                                        {thumbnail ? (
                                            <Image 
                                                src={thumbnail} 
                                                alt="Thumbnail" 
                                                fill 
                                                className="object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <FileText className="w-8 h-8 text-blue-500/50" />
                                        )}
                                    </div>
                                    
                                    {/* Content Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug mb-1">
                                            {title}
                                        </h4>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            {platformName}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Copy Link Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Liên kết chia sẻ</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 text-gray-400 pointer-events-none z-10">
                                        <LinkIcon className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={url} 
                                        readOnly 
                                        disabled
                                        className="w-full pl-10 pr-32 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none select-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`absolute right-1 top-1 bottom-1 px-4 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm z-20 ${
                                            isCopied 
                                            ? 'bg-green-500 text-white hover:bg-green-600' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Đã chép!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Sao chép
                                            </>
                                        )}
                                    </button>
                                </div>
                                {isCopied && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-green-100"
                                    >
                                        <Check className="w-3 h-3" />
                                        Đã sao chép liên kết vào bộ nhớ tạm!
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchForumPosts, fetchForumComments, addForumComment, fetchAccounts, uploadForumImage } from '@/services/googleSheetService';
import type { ForumPost, ForumComment, Account } from '@/types';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { timeAgo } from '@/utils/dateUtils';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import 'katex/dist/katex.min.css';

const InlineMath = dynamic(() => import('react-katex').then(mod => mod.InlineMath), { ssr: false });
const BlockMath = dynamic(() => import('react-katex').then(mod => mod.BlockMath), { ssr: false });

const MathRenderer = React.memo(({ text }: { text: string }) => {
  if (typeof text !== 'string' || !text) {
    return <>{text}</>;
  }
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try {
            return <BlockMath key={index} math={part.slice(2, -2)} />;
          } catch (e) {
            console.error("KaTeX BlockMath Error:", e);
            return <span key={index} className="text-red-500 font-mono">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          try {
            return <InlineMath key={index} math={part.slice(1, -1)} />;
          } catch(e) {
            console.error("KaTeX InlineMath Error:", e);
            return <span key={index} className="text-red-500 font-mono">{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
});
MathRenderer.displayName = 'MathRenderer';

const parseForumDate = (dateStr: string | undefined): Date => {
    if (!dateStr) return new Date(0);
    
    // Handle format: HH:mm:ss dd/MM/yyyy (e.g., 13:10:12 11/9/2025)
    const timeDateRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.trim().match(timeDateRegex);
    
    if (match) {
        const [_, h, m, s, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s));
    }

    // Handle format: dd/MM/yyyy HH:mm:ss (Standard VN)
    const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match2 = dateStr.trim().match(dateTimeRegex);
    
    if (match2) {
        const [_, day, month, year, h, m, s] = match2;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(m), Number(s));
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

export default function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
    const resolvedParams = use(params);
    const postId = resolvedParams.postId;
    const [post, setPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
    
    // Comment image upload state
    const [commentImages, setCommentImages] = useState<string[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const tempCommentId = useMemo(() => crypto.randomUUID(), []);
    
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!lightbox) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(null);
            if (e.key === 'ArrowRight') setLightbox(l => l && ({ ...l, index: (l.index + 1) % l.urls.length }));
            if (e.key === 'ArrowLeft') setLightbox(l => l && ({ ...l, index: (l.index - 1 + l.urls.length) % l.urls.length }));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightbox]);

    useEffect(() => {
        const loadData = async () => {
            if (!postId) {
                setError("ID bài viết không hợp lệ.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [postData, commentData, accountData] = await Promise.all([
                    fetchForumPosts(false),
                    fetchForumComments(false),
                    fetchAccounts(),
                ]);

                const foundPost = postData.find(p => p.ID === postId);
                if (foundPost) {
                    setPost(foundPost);
                    const postComments = commentData.filter(c => c.PostID === postId);
                    setComments(postComments);
                    setAccounts(accountData);
                } else {
                    setError("Không tìm thấy bài viết.");
                }
            } catch (err) {
                setError("Lỗi khi tải dữ liệu bài viết.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [postId]);

    const handleCommentImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = 3 - commentImages.length; // Comment giới hạn 3 ảnh
        const toUpload = files.slice(0, remaining);

        setIsUploadingImage(true);
        try {
            for (const file of toUpload) {
                const url = await uploadForumImage(file, tempCommentId);
                setCommentImages(prev => [...prev, url]);
            }
        } catch {
            addToast('Upload ảnh thất bại.', 'error');
        } finally {
            setIsUploadingImage(false);
            e.target.value = '';
        }
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length === 0) return;
        
        e.preventDefault();
        
        const remaining = 3 - commentImages.length;
        if (remaining <= 0) {
            addToast('Đã đạt giới hạn ảnh.', 'info');
            return;
        }

        setIsUploadingImage(true);
        try {
            for (const item of imageItems.slice(0, remaining)) {
                const file = item.getAsFile();
                if (!file) continue;
                const url = await uploadForumImage(file, tempCommentId);
                setCommentImages(prev => [...prev, url]);
            }
        } catch {
            addToast('Upload ảnh thất bại.', 'error');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newComment.trim() && commentImages.length === 0) || !currentUser || !post) return;

        setIsSubmitting(true);
const commentData = {
    PostID: post.ID,
    ParentID: 'root',
    Content: newComment,
    AuthorEmail: currentUser.Email,
    AuthorName: currentUser['Tên tài khoản'],
    ImageURLs: commentImages.join(','),
};

console.log('💬 commentImages khi submit:', commentImages); // ← thêm dòng này
console.log('💬 commentData:', commentData);
        
        
        const result = await addForumComment(commentData);
        if (result.success) {
            // Optimistically add comment to UI
            const optimisticComment = {
                ...commentData,
                ID: `temp-${Date.now()}`,
                Timestamp: new Date().toLocaleString('vi-VN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }),
                ImageURLs: commentImages.join(','),
            } as unknown as ForumComment;
            setComments(prev => [...prev, optimisticComment]);
            setNewComment('');
            setCommentImages([]);
            addToast('Bình luận của bạn đã được đăng.', 'success');
        } else {
            addToast(result.error || 'Không thể đăng bình luận.', 'error');
        }
        setIsSubmitting(false);
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4">
                <div className="text-center p-10 text-red-700 bg-red-50 border border-red-200 rounded-2xl max-w-2xl mx-auto shadow-sm">
                    <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold">{error || "Không thể hiển thị bài viết."}</h2>
                    <Link href="/forum" className="mt-6 inline-block bg-white px-6 py-2 rounded-xl text-red-700 font-bold border border-red-200 hover:bg-red-50 transition-colors">
                        Quay lại diễn đàn
                    </Link>
                </div>
            </div>
        );
    }

    const sortedComments = [...comments].sort((a, b) => {
        const timeA = parseForumDate(a.Timestamp).getTime();
        const timeB = parseForumDate(b.Timestamp).getTime();
        return timeB - timeA;
    });

    const postAuthorAccount = accounts.find(acc => 
        (post.AuthorEmail && acc.Email.toLowerCase() === post.AuthorEmail.toLowerCase()) || 
        acc['Tên tài khoản'] === post.AuthorName
    );
    const profileLink = postAuthorAccount?.Email ? `/profile/${postAuthorAccount.Email}` : '#';

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 space-y-8">
                <Link href="/forum" prefetch={true} className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2 text-sm w-fit transition-colors bg-blue-50 px-4 py-2 rounded-xl">
                    <Icon name="arrowLeft" className="w-4 h-4" />
                    Quay lại diễn đàn
                </Link>

                <article className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                        <Link href={profileLink} className="flex items-center gap-3 group" onClick={e => !postAuthorAccount?.Email && e.preventDefault()}>
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden relative">
                            {postAuthorAccount?.AvatarURL ? (
                                <Image
                                    src={convertGoogleDriveUrl(postAuthorAccount.AvatarURL)}
                                    alt={post.AuthorName}
                                    fill
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                    priority
                                />
                            ) : (
                                post.AuthorName.charAt(0)
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{post.AuthorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span>trong <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"># {post.Channel}</span></span>
                                <span>•</span>
                                <span>{timeAgo(parseForumDate(post.Timestamp).toISOString())}</span>
                            </div>
                        </div>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-6 leading-tight"><MathRenderer text={post.Title} /></h1>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg"><MathRenderer text={post.Content} /></div>

                    {/* Hiển thị danh sách ảnh đính kèm */}
                    {post.ImageURLs && post.ImageURLs.trim() && (() => {
                        const imgs = post.ImageURLs.split(',').filter(Boolean);
                        return (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {imgs.map((url, index) => (
                                    <div 
                                        key={index}
                                        onClick={() => setLightbox({ urls: imgs, index })}
                                        className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm group block hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <Image
                                            src={convertGoogleDriveUrl(url.trim())}
                                            alt={`Ảnh đính kèm ${index + 1}`}
                                            fill
                                            className="object-contain"
                                            referrerPolicy="no-referrer"
                                            priority={index === 0}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </article>

                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                        <Icon name="message-circle" className="w-6 h-6 text-gray-400" />
                        <h2 className="text-2xl font-black text-gray-900">{sortedComments.length} Bình luận</h2>
                    </div>
                    
                    {currentUser ? (
                        <form onSubmit={handleCommentSubmit} className="mb-10 flex items-start gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden relative">
                                {currentUser.AvatarURL ? (
                                    <Image
                                        src={convertGoogleDriveUrl(currentUser.AvatarURL)}
                                        alt={currentUser['Tên tài khoản']}
                                        fill
                                        className="object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    currentUser['Tên tài khoản'].charAt(0)
                                )}
                            </div>
                            <div className="flex-grow flex flex-col gap-3">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder="Viết bình luận của bạn..."
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-medium"
                                    rows={3}
                                />
                                
                                {/* Thanh công cụ dưới textarea */}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    
                                    {/* Nút upload ảnh + preview */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Preview thumbnails */}
                                        {commentImages.map((url, i) => (
                                            <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group flex-shrink-0">
                                                <Image
                                                    src={convertGoogleDriveUrl(url)}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setCommentImages(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <Icon name="x" className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Nút chọn ảnh */}
                                        {commentImages.length < 3 && (
                                            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${isUploadingImage ? 'bg-blue-50 text-blue-400 pointer-events-none' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}>
                                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleCommentImageSelect} disabled={isUploadingImage} className="hidden" />
                                                {isUploadingImage ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-blue-300 border-t-blue-500 animate-spin" />Đang tải...</> : <><Icon name="image" className="w-3.5 h-3.5" />Thêm ảnh {commentImages.length > 0 && `(${commentImages.length}/3)`}</>}
                                            </label>
                                        )}
                                    </div>

                                    {/* Nút gửi */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isUploadingImage || (!newComment.trim() && commentImages.length === 0)}
                                        className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        ) : (
                                            <>
                                                <Icon name="send" className="w-4 h-4" />
                                                Gửi
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-10 p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
                            <Icon name="lock" className="w-8 h-8 text-blue-400" />
                            <p className="text-gray-600 font-medium">Bạn cần đăng nhập để tham gia bình luận.</p>
                            <Link href="/login" prefetch={true} className="font-bold text-white bg-blue-600 px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    )}
                    
                    <div className="space-y-8">
                        {sortedComments.length > 0 ? (
                            sortedComments.map(comment => {
                                const commenterAccount = accounts.find(acc => 
                                    (comment.AuthorEmail && acc.Email.toLowerCase() === comment.AuthorEmail.toLowerCase()) || 
                                    acc['Tên tài khoản'] === comment.AuthorName
                                );
                                const displayName = commenterAccount ? commenterAccount['Tên tài khoản'] : comment.AuthorName;
                                const commenterAvatar = commenterAccount?.AvatarURL;
                                const commenterProfileLink = commenterAccount?.Email ? `/profile/${commenterAccount.Email}` : '#';
                                
                                return (
                                    <div key={comment.ID} className="flex items-start gap-4">
                                        <Link href={commenterProfileLink} className="flex-shrink-0 group" onClick={e => !commenterAccount?.Email && e.preventDefault()}>
                                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold border border-gray-200 overflow-hidden relative">
                                            {commenterAvatar ? (
                                                <Image
                                                    src={convertGoogleDriveUrl(commenterAvatar)}
                                                    alt={displayName}
                                                    fill
                                                    className="object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                displayName.charAt(0)
                                            )}
                                        </div>
                                        </Link>
                                        <div className="flex-grow bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <Link href={commenterProfileLink} className="font-bold text-gray-900 hover:text-blue-600 transition-colors" onClick={e => !commenterAccount?.Email && e.preventDefault()}>{displayName}</Link>
                                                <span className="text-xs font-bold text-gray-400 ml-auto">{timeAgo(parseForumDate(comment.Timestamp).toISOString())}</span>
                                            </div>
                                            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed"><MathRenderer text={comment.Content} /></div>
                                            
                                            {/* Hiển thị ảnh trong comment */}
{comment.ImageURLs && comment.ImageURLs.trim() && (() => {
    const imgs = comment.ImageURLs!.split(',').filter(Boolean);
    return (
        <div className={`mt-2 grid gap-1 ${imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {imgs.map((url, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox({ urls: imgs, index: i })}
                    className={`relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in ${imgs.length === 1 ? 'h-40' : 'h-24'}`}
                >
                    <Image
                        src={convertGoogleDriveUrl(url.trim())}
                        alt=""
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                    />
                </button>
            ))}
        </div>
    );
})()}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                                <Icon name="message-square" className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50"
                        onClick={() => setLightbox(null)}
                    >
                        <Icon name="x" className="w-6 h-6" />
                    </button>

                    {lightbox.urls.length > 1 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox(l => l && ({ ...l, index: (l.index - 1 + l.urls.length) % l.urls.length }));
                            }}
                        >
                            <Icon name="chevron-left" className="w-8 h-8" />
                        </button>
                    )}

                    <div
                        className="relative max-w-5xl max-h-[85vh] w-full h-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <Image
                            src={convertGoogleDriveUrl(lightbox.urls[lightbox.index].trim())}
                            alt=""
                            fill
                            className="object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </div>

                    {lightbox.urls.length > 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox(l => l && ({ ...l, index: (l.index + 1) % l.urls.length }));
                            }}
                        >
                            <Icon name="chevron-right" className="w-8 h-8" />
                        </button>
                    )}

                    {lightbox.urls.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
                            {lightbox.index + 1} / {lightbox.urls.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

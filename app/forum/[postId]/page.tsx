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
import { Reply, FileText, Download } from 'lucide-react';
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

// Helper để phân loại file từ URL
const parseAttachments = (urlsStr: string | undefined) => {
    if (!urlsStr || !urlsStr.trim()) return { images: [], files: [] };
    
    const rawUrls = urlsStr.split(',').filter(Boolean);
    const images: string[] = [];
    const files: { url: string; name: string; mime: string }[] = [];

    rawUrls.forEach(url => {
        let cleanUrl = url.trim();
        let mime = '';
        let name = 'File đính kèm';

        if (url.includes('#')) {
            const [u, hash] = url.split('#');
            cleanUrl = u.trim();
            const params = new URLSearchParams(hash);
            mime = params.get('mime') || '';
            name = params.get('name') || 'File đính kèm';
        }

        // Nếu là ảnh hoặc không có metadata (ảnh cũ) -> gom vào images
        if (mime.startsWith('image/') || (!mime && !url.includes('#'))) {
            images.push(url); // Giữ nguyên URL gốc (có thể có hash) để xử lý sau nếu cần, hoặc cleanUrl
        } else {
            files.push({ url: cleanUrl, name, mime });
        }
    });

    return { images, files };
};

// Component hiển thị file đính kèm (không phải ảnh)
const FileAttachmentList = ({ files }: { files: { url: string; name: string; mime: string }[] }) => {
    if (files.length === 0) return null;
    return (
        <div className="flex flex-col gap-2 mt-2">
            {files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-500 border border-gray-100">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-700">{f.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{f.mime.split('/')[1] || 'FILE'}</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </a>
            ))}
        </div>
    );
};

// --- Sub-components ---

interface CommentInputProps {
    postId: string;
    parentId: string;
    onSuccess: (newComment: ForumComment) => void;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

function CommentInput({ postId, parentId, onSuccess, onCancel, placeholder, autoFocus }: CommentInputProps) {
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const tempId = useMemo(() => crypto.randomUUID(), []);
    
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = 3 - images.length;
        const toUpload = files.slice(0, remaining);
        setIsUploading(true);
        try {
            for (const file of toUpload) {
                const url = await uploadForumImage(file, tempId);
                setImages(prev => [...prev, url]);
            }
        } catch {
            addToast('Upload ảnh thất bại.', 'error');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        if (imageItems.length === 0) return;
        e.preventDefault();
        const remaining = 3 - images.length;
        if (remaining <= 0) {
            addToast('Đã đạt giới hạn ảnh.', 'info');
            return;
        }
        setIsUploading(true);
        try {
            for (const item of imageItems.slice(0, remaining)) {
                const file = item.getAsFile();
                if (!file) continue;
                const url = await uploadForumImage(file, tempId);
                setImages(prev => [...prev, url]);
            }
        } catch {
            addToast('Upload ảnh thất bại.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!content.trim() && images.length === 0) || !currentUser) return;

        setIsSubmitting(true);
        const commentData = {
            PostID: postId,
            ParentID: parentId,
            Content: content,
            AuthorEmail: currentUser.Email,
            AuthorName: currentUser['Tên tài khoản'],
            ImageURLs: images.join(','),
        };

        const result = await addForumComment(commentData);
        if (result.success) {
            const optimisticComment = {
                ...commentData,
                ID: `temp-${Date.now()}`,
                Timestamp: new Date().toLocaleString('vi-VN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }),
                ImageURLs: images.join(','),
            } as unknown as ForumComment;
            onSuccess(optimisticComment);
            setContent('');
            setImages([]);
            if (onCancel) onCancel();
        } else {
            addToast(result.error || 'Không thể đăng bình luận.', 'error');
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder={placeholder || "Viết bình luận..."}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-sm min-h-[80px]"
                autoFocus={autoFocus}
            />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    {images.map((url, i) => (
                        <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50 flex items-center justify-center">
                            {url.includes('mime=image') || !url.includes('#') ? <Image src={convertGoogleDriveUrl(url.split('#')[0])} alt="" fill className="object-cover" referrerPolicy="no-referrer" /> : <FileText className="w-5 h-5 text-blue-500" />}
                            <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Icon name="x" className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ))}
                    {images.length < 3 && (
                        <label className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${isUploading ? 'bg-blue-50 text-blue-400 pointer-events-none' : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
                            <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" multiple onChange={handleImageSelect} disabled={isUploading} className="hidden" />
                            {isUploading ? <div className="w-3 h-3 rounded-full border-2 border-blue-300 border-t-blue-500 animate-spin" /> : <Icon name="paperclip" className="w-3.5 h-3.5" />}
                        </label>
                    )}
                </div>

                <div className="flex gap-2">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
                            Hủy
                        </button>
                    )}
                    <button type="submit" disabled={isSubmitting || isUploading || (!content.trim() && images.length === 0)} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-1.5">
                        {isSubmitting ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Icon name="send" className="w-3 h-3" />}
                        Gửi
                    </button>
                </div>
            </div>
        </form>
    );
}

function CommentItem({ comment, allComments, accounts, postId, onReplySuccess, setLightbox }: any) {
    const [isReplying, setIsReplying] = useState(false);
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const replies = allComments.filter((c: any) => c.ParentID === comment.ID).sort((a: any, b: any) => {
        return parseForumDate(a.Timestamp).getTime() - parseForumDate(b.Timestamp).getTime();
    });

    const authorAccount = accounts.find((acc: any) => 
        (comment.AuthorEmail && acc.Email.toLowerCase() === comment.AuthorEmail.toLowerCase()) || 
        acc['Tên tài khoản'] === comment.AuthorName
    );
    const displayName = authorAccount ? authorAccount['Tên tài khoản'] : comment.AuthorName;
    const avatarUrl = authorAccount?.AvatarURL;
    const profileLink = authorAccount?.Email ? `/profile/${authorAccount.Email}` : '#';

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <Link href={profileLink} className="flex-shrink-0 group" onClick={e => !authorAccount?.Email && e.preventDefault()}>
                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold border border-gray-200 overflow-hidden relative">
                        {avatarUrl ? <Image src={convertGoogleDriveUrl(avatarUrl)} alt={displayName} fill className="object-cover" referrerPolicy="no-referrer" /> : displayName.charAt(0)}
                    </div>
                </Link>
                <div className="flex-grow">
                    <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Link href={profileLink} className="font-bold text-sm text-gray-900 hover:text-blue-600 transition-colors" onClick={e => !authorAccount?.Email && e.preventDefault()}>{displayName}</Link>
                            <span className="text-xs font-bold text-gray-400 ml-auto">{timeAgo(parseForumDate(comment.Timestamp).toISOString())}</span>
                        </div>
                        <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed"><MathRenderer text={comment.Content} /></div>
                        {(comment as any).ImageURLs && (comment as any).ImageURLs.trim() && (() => {
                            const { images, files } = parseAttachments((comment as any).ImageURLs);
                            return (
                                <>
                                    {images.length > 0 && (
                                        <div className={`mt-2 grid gap-1 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {images.map((url, i) => (
                                                <button key={i} type="button" onClick={() => setLightbox({ urls: images, index: i })} className={`relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in ${images.length === 1 ? 'h-32' : 'h-20'}`}>
                                                    <Image src={convertGoogleDriveUrl(url.split('#')[0].trim())} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <FileAttachmentList files={files} />
                                </>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-4 mt-1 ml-2">
                        <button onClick={() => currentUser ? setIsReplying(!isReplying) : addToast('Vui lòng đăng nhập để trả lời.', 'info')} className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                            <Reply className="w-3 h-3" /> Trả lời
                        </button>
                    </div>
                    {isReplying && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <CommentInput postId={postId} parentId={comment.ID} onSuccess={(newC) => { onReplySuccess(newC); setIsReplying(false); }} onCancel={() => setIsReplying(false)} autoFocus />
                        </div>
                    )}
                </div>
            </div>
            {replies.length > 0 && (
                <div className="pl-11 flex flex-col gap-3 relative before:absolute before:left-4 before:top-0 before:bottom-4 before:w-0.5 before:bg-gray-100">
                    {replies.map((reply: any) => (
                        <CommentItem key={reply.ID} comment={reply} allComments={allComments} accounts={accounts} postId={postId} onReplySuccess={onReplySuccess} setLightbox={setLightbox} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
    const resolvedParams = use(params);
    const postId = resolvedParams.postId;
    const [post, setPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
    
    const { currentUser } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

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

    // Filter root comments (ParentID is empty, 'root', or 'null')
    const rootComments = comments.filter(c => !c.ParentID || c.ParentID === 'root' || c.ParentID === 'null').sort((a, b) => {
        return parseForumDate(b.Timestamp).getTime() - parseForumDate(a.Timestamp).getTime();
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
                        const { images, files } = parseAttachments(post.ImageURLs);
                        return (
                            <>
                                {images.length > 0 && (
                                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {images.map((url, index) => (
                                            <div 
                                                key={index}
                                                onClick={() => setLightbox({ urls: images, index })}
                                                className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm group block hover:shadow-md transition-all cursor-pointer"
                                            >
                                                <Image
                                                    src={convertGoogleDriveUrl(url.split('#')[0].trim())}
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
                                )}
                                <div className="mt-4">
                                    <FileAttachmentList files={files} />
                                </div>
                            </>
                        );
                    })()}

                    {/* Hiển thị tài liệu đính kèm (DocURLs) */}
                    {post.DocURLs && post.DocURLs.trim() && (() => {
                        const { files } = parseAttachments(post.DocURLs);
                        return (
                            <>
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Icon name="paperclip" className="w-4 h-4" /> Tài liệu đính kèm</h4>
                                    <FileAttachmentList files={files} />
                                </div>
                            </>
                        );
                    })()}
                </article>

                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                        <Icon name="message-circle" className="w-6 h-6 text-gray-400" />
                        <h2 className="text-2xl font-black text-gray-900">{comments.length} Bình luận</h2>
                    </div>
                    
                    {currentUser ? (
                        <div className="mb-10 flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden relative">
                                {currentUser.AvatarURL ? <Image src={convertGoogleDriveUrl(currentUser.AvatarURL)} alt={currentUser['Tên tài khoản']} fill className="object-cover" referrerPolicy="no-referrer" /> : currentUser['Tên tài khoản'].charAt(0)}
                            </div>
                            <div className="flex-grow">
                                <CommentInput 
                                    postId={post.ID} 
                                    parentId="root" 
                                    onSuccess={(newC) => {
                                        setComments(prev => [...prev, newC]);
                                        addToast('Bình luận của bạn đã được đăng.', 'success');
                                    }} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-10 p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
                            <Icon name="lock" className="w-8 h-8 text-blue-400" />
                            <p className="text-gray-600 font-medium">Bạn cần đăng nhập để tham gia bình luận.</p>
                            <Link href="/login" prefetch={true} className="font-bold text-white bg-blue-600 px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Đăng nhập ngay</Link>
                        </div>
                    )}
                    
                    <div className="space-y-8">
                        {rootComments.length > 0 ? (
                            rootComments.map(comment => (
                                <CommentItem 
                                    key={comment.ID} 
                                    comment={comment} 
                                    allComments={comments} 
                                    accounts={accounts} 
                                    postId={post.ID} 
                                    onReplySuccess={(newC: ForumComment) => {
                                        setComments(prev => [...prev, newC]);
                                        addToast('Đã gửi câu trả lời.', 'success');
                                    }}
                                    setLightbox={setLightbox}
                                />
                            ))
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

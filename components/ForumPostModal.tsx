// e:\NEW\components\ForumPostModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/shared/Icon';
import { ForumPost, ForumComment, Account } from '@/types';
import { fetchForumComments, addForumComment, fetchAccounts } from '@/services/googleSheetService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { convertGoogleDriveUrl } from '@/utils/imageUtils';
import { FileText, Download } from 'lucide-react';

// Hàm parseAttachments và FileAttachmentList được định nghĩa lại ở đây
// để component này có thể hoạt động độc lập.
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

      if (mime.startsWith('image/') || (!mime && !url.includes('#'))) {
          images.push(url);
      } else {
          files.push({ url: cleanUrl, name, mime });
      }
  });

  return { images, files };
};

const FileAttachmentList = ({ files }: { files: { url: string; name: string; mime: string }[] }) => {
  if (files.length === 0) return null;
  return (
      <div className="flex flex-col gap-2 mt-4">
          {files.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-500 border border-gray-100"><FileText className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-700">{f.name}</p><p className="text-xs text-gray-400 uppercase">{f.mime.split('/')[1] || 'FILE'}</p></div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              </a>
          ))}
      </div>
  );
};

interface ForumPostModalProps {
  post: ForumPost;
  onClose: () => void;
}

export function ForumPostModal({ post, onClose }: ForumPostModalProps) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  // Tải bình luận và tài khoản khi component được mở
  useEffect(() => {
    const loadComments = async () => {
      try {
        const [allComments, allAccounts] = await Promise.all([
          fetchForumComments(true), // true để bỏ qua cache, luôn lấy mới nhất
          fetchAccounts()
        ]);
        // Lọc ra các comment thuộc về bài post này
        const filtered = allComments.filter(c => c.PostID === post.ID);
        setComments(filtered);
        setAccounts(allAccounts);
      } catch (error) {
        console.error('Failed to load comments', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadComments();
  }, [post.ID]);

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

  // Hàm gửi bình luận mới
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      addToast('Vui lòng đăng nhập để bình luận', 'info');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addForumComment({
        PostID: post.ID,
        ParentID: '',
        Content: newComment.trim(),
        AuthorEmail: currentUser.Email,
        AuthorName: currentUser['Tên tài khoản'],
      });

      if (result.success) {
        setNewComment('');
        // Tải lại danh sách bình luận để cập nhật
        const allComments = await fetchForumComments(true);
        setComments(allComments.filter(c => c.PostID === post.ID));
        addToast('Đã gửi bình luận', 'success');
      } else {
        addToast(result.error || 'Lỗi khi gửi bình luận', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postAuthorAccount = accounts.find(acc => 
    (post.AuthorEmail && acc.Email.toLowerCase() === post.AuthorEmail.toLowerCase()) || 
    acc['Tên tài khoản'] === post.AuthorName
  );

  const profileLink = postAuthorAccount?.Email ? `/profile/${postAuthorAccount.Email}` : '#';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header của Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href={profileLink} onClick={(e) => { if(!postAuthorAccount?.Email) e.preventDefault(); else onClose(); }} className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold overflow-hidden relative">
              {postAuthorAccount?.AvatarURL ? (
                <Image
                  src={convertGoogleDriveUrl(postAuthorAccount.AvatarURL)}
                  alt={post.AuthorName}
                  fill
                  sizes="40px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                post.AuthorName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">{post.Title}</h3>
              <p className="text-xs text-gray-500">Bởi <span className="font-bold group-hover:text-blue-600 transition-colors">{post.AuthorName}</span> • {post.Timestamp || 'Vừa xong'}</p>
            </div>
            </Link>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Nội dung chính có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Nội dung text của bài post */}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.Content}
          </div>

          {/* Hiển thị ảnh và file của bài post */}
          {(() => {
            const { images, files } = parseAttachments(post.ImageURLs);
            const { files: docFiles } = parseAttachments(post.DocURLs);
            const allFiles = [...files, ...docFiles];

            return (
              <div className="mt-4">
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                    {images.map((url, i) => (
                      <div 
                        key={i} 
                        onClick={() => setLightbox({ urls: images, index: i })}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img 
                          src={convertGoogleDriveUrl(url.split('#')[0])} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ))}
                  </div>
                )}
                <FileAttachmentList files={allFiles} />
              </div>
            );
          })()}

          {/* Phần thảo luận */}
          <div className="pt-8 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Icon name="message-circle" className="w-5 h-5 text-blue-500" />
              Thảo luận ({comments.length})
            </h4>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.length > 0 ? (
                  // Lặp qua và hiển thị từng bình luận
                  comments.map((comment, idx) => {
                    const commenterAccount = accounts.find(acc => 
                        (comment.AuthorEmail && acc.Email.toLowerCase() === comment.AuthorEmail.toLowerCase()) || 
                        acc['Tên tài khoản'] === comment.AuthorName
                    );
                    const commenterProfileLink = commenterAccount?.Email ? `/profile/${commenterAccount.Email}` : '#';
                    
                    // Parse ảnh/file của bình luận
                    const { images: cImages, files: cFiles } = parseAttachments((comment as any).ImageURLs);

                    return (
                      <div key={idx} className="flex gap-4">
                        <Link href={commenterProfileLink} onClick={(e) => { if(!commenterAccount?.Email) e.preventDefault(); else onClose(); }} className="flex-shrink-0 group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden relative">
                          {commenterAccount?.AvatarURL ? (
                            <Image
                              src={convertGoogleDriveUrl(commenterAccount.AvatarURL)}
                              alt={comment.AuthorName}
                              fill
                              sizes="32px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            comment.AuthorName.charAt(0)
                          )}
                        </div>
                        </Link>
                        <div className="flex-1 bg-gray-50 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <Link href={commenterProfileLink} onClick={(e) => { if(!commenterAccount?.Email) e.preventDefault(); else onClose(); }} className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors">{comment.AuthorName}</Link>
                            <span className="text-[10px] text-gray-400">{comment.Timestamp || 'Vừa xong'}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.Content}</p>
                          
                          {/* Hiển thị ảnh/file của bình luận */}
                          {cImages.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {cImages.map((url, i) => (
                                <div 
                                  key={i} 
                                  onClick={() => setLightbox({ urls: cImages, index: i })}
                                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer hover:opacity-90 transition-opacity"
                                >
                                  <img 
                                    src={convertGoogleDriveUrl(url.split('#')[0])} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer" 
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <FileAttachmentList files={cFiles} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-gray-400 italic text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Khung nhập bình luận */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleSubmitComment} className="flex gap-3">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={currentUser ? "Viết bình luận..." : "Đăng nhập để bình luận"}
              disabled={!currentUser || isSubmitting}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button 
              type="submit"
              disabled={!currentUser || isSubmitting || !newComment.trim()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Icon name="send" className="w-4 h-4" />
              )}
              Gửi
            </button>
          </form>
        </div>
      </motion.div>

      {/* Lightbox */}
      {lightbox && (
        <div
            className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
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
                className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={convertGoogleDriveUrl(lightbox.urls[lightbox.index].split('#')[0].trim())}
                    alt=""
                    className="max-w-full max-h-full object-contain"
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

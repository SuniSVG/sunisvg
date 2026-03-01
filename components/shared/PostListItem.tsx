import React from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { BadgePill } from './BadgePill';
import { timeAgo } from '@/utils/dateUtils';
import type { ForumPost, Badge } from '@/types';

interface PostListItemProps {
    post: ForumPost;
    commentCount: number;
    currentUserEmail: string | null;
    onUpdate: (updatedPost: ForumPost) => void;
    authorBadges: Badge[];
}

export default function PostListItem({ post, commentCount, currentUserEmail, onUpdate, authorBadges }: PostListItemProps) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Icon name="chevron-up" className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-gray-700">{post.Upvotes || 0}</span>
                </div>
                
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mb-2">
                        <span className="font-bold text-gray-700">{post.AuthorName}</span>
                        {authorBadges.map(badge => <BadgePill key={badge.name} badge={badge} />)}
                        <span>•</span>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{post.Channel}</span>
                        <span>•</span>
                        <span>{timeAgo(post.Timestamp)}</span>
                    </div>
                    
                    <Link href={`/forum/${post.ID}`} className="block group">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                            {post.Title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 text-sm">
                            {post.Content}
                        </p>
                    </Link>
                    
                    <div className="flex items-center gap-4 mt-4">
                        <Link href={`/forum/${post.ID}`} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                            <Icon name="message-circle" className="w-4 h-4" />
                            {commentCount} bình luận
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

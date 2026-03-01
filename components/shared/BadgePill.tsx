import React from 'react';
import type { Badge } from '@/types';
import { Icon } from './Icon';

export const BadgePill: React.FC<{ badge: Badge }> = ({ badge }) => {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${badge.color}`} title={badge.description}>
            <Icon name={badge.icon as any} className="w-3.5 h-3.5" />
            <span>{badge.name}</span>
        </div>
    );
};

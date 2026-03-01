import { Account, ScientificArticle, Badge } from '../types';

export const getUserBadges = (user: Account, articles: ScientificArticle[]) => {
  // Mock implementation
  const displayBadges: Badge[] = [{
    name: 'Tân thủ',
    icon: 'star',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Người dùng mới'
  }];
  return {
    displayBadges
  };
};

import React from 'react';
import { CheckCircle, XCircle, Eye, EyeOff, AlertCircle, ShieldCheck, Check, Users, FileText, HelpCircle, GraduationCap, ArrowRight, User, Star, BookOpen, Lock, Plus, ArrowLeft, Info, X, PlayCircle, UserPlus, Bookmark, Heart, Trophy, Medal, Settings, LogOut, Search, Smartphone, Book, Monitor, Headphones, BarChart, Mail, Send, RefreshCw, Calendar, MapPin, TrendingUp, Zap, Video, Grid, Tag, Clipboard, ChevronLeft, ChevronRight, ChevronUp, Sparkles, Folder, Hash, List, Layers, MessageCircle, AlertTriangle, Clock, Pause, Play, RotateCcw, Edit3, Calculator } from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  switch (name) {
    case 'check-circle':
      return <CheckCircle className={className} />;
    case 'x-circle':
      return <XCircle className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'eye-slash':
      return <EyeOff className={className} />;
    case 'alert-circle':
    case 'alert':
      return <AlertCircle className={className} />;
    case 'logo':
      return <ShieldCheck className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'mail':
      return <Mail className={className} />;
    case 'file-text':
    case 'document':
      return <FileText className={className} />;
    case 'help-circle':
      return <HelpCircle className={className} />;
    case 'graduation-cap':
      return <GraduationCap className={className} />;
    case 'arrow-right':
    case 'arrowRight':
      return <ArrowRight className={className} />;
    case 'user':
      return <User className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'plus':
      return <Plus className={className} />;
    case 'arrowLeft':
    case 'arrow-left':
      return <ArrowLeft className={className} />;
    case 'information-circle':
      return <Info className={className} />;
    case 'close':
    case 'x':
      return <X className={className} />;
    case 'play-circle':
      return <PlayCircle className={className} />;
    case 'user-plus':
      return <UserPlus className={className} />;
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'medal':
      return <Medal className={className} />;
    case 'settings':
      return <Settings className={className} />;
    case 'log-out':
      return <LogOut className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'book':
      return <Book className={className} />;
    case 'monitor':
      return <Monitor className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'bar-chart':
      return <BarChart className={className} />;
    case 'send':
      return <Send className={className} />;
    case 'refresh-cw':
      return <RefreshCw className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'map-pin':
      return <MapPin className={className} />;
    case 'trending-up':
      return <TrendingUp className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'video':
      return <Video className={className} />;
    case 'grid':
      return <Grid className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'clipboard':
      return <Clipboard className={className} />;
    case 'chevron-left':
      return <ChevronLeft className={className} />;
    case 'chevron-right':
      return <ChevronRight className={className} />;
    case 'chevron-up':
      return <ChevronUp className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'folder':
      return <Folder className={className} />;
    case 'hash':
      return <Hash className={className} />;
    case 'list':
      return <List className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'message-circle':
      return <MessageCircle className={className} />;
    case 'alert-triangle':
      return <AlertTriangle className={className} />;
    case 'academic-cap':
      return <GraduationCap className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'pause':
      return <Pause className={className} />;
    case 'play':
      return <Play className={className} />;
    case 'rotate-ccw':
      return <RotateCcw className={className} />;
    case 'edit-3':
      return <Edit3 className={className} />;
    case 'calculator':
      return <Calculator className={className} />;
    default:
      return <Check className={className} />;
  }
};

'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { registerUser, resendVerificationEmail as resendVerificationEmailService, updateUserQuizStats, updateStudyTime, requestPasswordReset as requestPasswordResetService, resetPasswordWithOTP as resetPasswordWithOTPService, updateUsername as updateUsernameService, updatePassword as updatePasswordService, getAccountByEmail } from '@/services/googleSheetService';
import type { Account } from '@/types';
import { useToast } from './ToastContext';

interface LoginResult {
  success: boolean;
  error?: string;
  reason?: 'unverified';
  email?: string;
}

interface AuthContextType {
  currentUser: Account | null;
  loading: boolean;
  /** true sau khi sessionStorage đã được đọc xong — dùng để tránh fetch 2 lần ở profile page */
  isAuthReady: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    pass: string,
    schoolName: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPasswordWithOTP: (email: string, otp: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateUserStats: (attempted: number, correct: number) => void;
  deductTokensForPractice: () => void;
  isStudying: boolean;
  sessionStartTime: number | null;
  startStudySession: () => void;
  endStudySession: () => Promise<void>;
  updateUsername: (newName: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshCurrentUser: (options?: { silent?: boolean }) => Promise<Account | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  // isAuthReady: true sau khi đọc sessionStorage xong (sync, không phải async)
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const { addToast } = useToast();
  const showToast = addToast;
  const studyIntervalRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      const startTime = sessionStorage.getItem('sessionStartTime');
      const lastSavedTime = sessionStorage.getItem('lastSavedTime');
      if (startTime) {
        setIsStudying(true);
        setSessionStartTime(Number(startTime));
        lastSavedTimeRef.current = lastSavedTime ? Number(lastSavedTime) : Number(startTime);
      }
    } catch (error) {
      console.error("Failed to parse from sessionStorage", error);
      sessionStorage.clear();
    } finally {
      setLoading(false);
      // Đánh dấu auth đã sẵn sàng — các component có thể bắt đầu fetch dữ liệu
      setIsAuthReady(true);
    }
  }, []);

  const saveIncrementalStudyTime = useCallback(async () => {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (!user || !lastSavedTimeRef.current) return;

    const now = Date.now();
    const durationInMinutes = Math.floor((now - lastSavedTimeRef.current) / (60 * 1000));

    if (durationInMinutes < 1) return;

    const result = await updateStudyTime(user.Email, durationInMinutes);
    if (result.success && result.studyTime) {
      lastSavedTimeRef.current = now;
      sessionStorage.setItem('lastSavedTime', String(now));

      setCurrentUser(prev => {
        if (!prev) return null;
        const updatedUser = {
          ...prev,
          'Tổng thời gian học': result.studyTime!.allTime,
          'Thời gian học hôm nay': result.studyTime!.today,
          'Ngày cập nhật học': result.studyTime!.lastUpdateDate,
        };
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } else {
      console.error("Failed to save incremental study time:", result.error);
    }
  }, []);

  useEffect(() => {
    if (isStudying && currentUser) {
      if (studyIntervalRef.current) clearInterval(studyIntervalRef.current);
      studyIntervalRef.current = window.setInterval(saveIncrementalStudyTime, 60 * 1000);
    }
    return () => {
      if (studyIntervalRef.current) {
        clearInterval(studyIntervalRef.current);
        studyIntervalRef.current = null;
      }
    };
  }, [isStudying, currentUser, saveIncrementalStudyTime]);

  const startStudySession = useCallback(() => {
    const startTime = Date.now();
    setIsStudying(true);
    setSessionStartTime(startTime);
    lastSavedTimeRef.current = startTime;
    sessionStorage.setItem('sessionStartTime', String(startTime));
    sessionStorage.setItem('lastSavedTime', String(startTime));
    showToast('Bắt đầu phiên học!', 'info');
  }, [showToast]);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    try {
      const user = await getAccountByEmail(email.trim());

      if (!user) {
        return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
      }

      const storedPassword = user['Mật khẩu'];

      if (typeof storedPassword !== 'string' || storedPassword.length === 0) {
        console.error(`Password for user ${email} is missing or invalid.`);
        return { success: false, error: 'Đã xảy ra lỗi với tài khoản của bạn. Vui lòng liên hệ quản trị viên.' };
      }

      if (user['Đã xác minh'] !== 'Có') {
        return {
          success: false,
          reason: 'unverified',
          error: 'Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email.',
          email: user.Email,
        };
      }

      if (storedPassword === pass || storedPassword === pass.trim()) {
        setCurrentUser(user);
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        startStudySession();
        return { success: true };
      } else {
        return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.' };
    }
  };

  const endStudySession = useCallback(async () => {
    if (studyIntervalRef.current) {
      clearInterval(studyIntervalRef.current);
      studyIntervalRef.current = null;
    }

    const lastSaved = lastSavedTimeRef.current;
    if (!lastSaved || !currentUser) {
      setIsStudying(false);
      setSessionStartTime(null);
      lastSavedTimeRef.current = null;
      sessionStorage.removeItem('sessionStartTime');
      sessionStorage.removeItem('lastSavedTime');
      return;
    }

    const now = Date.now();
    const durationInMinutes = Math.floor((now - lastSaved) / (1000 * 60));

    setIsStudying(false);
    setSessionStartTime(null);
    lastSavedTimeRef.current = null;
    sessionStorage.removeItem('sessionStartTime');
    sessionStorage.removeItem('lastSavedTime');

    if (durationInMinutes > 0) {
      const result = await updateStudyTime(currentUser.Email, durationInMinutes);
      if (result.success && result.studyTime) {
        setCurrentUser(prev => {
          if (!prev) return null;
          const updatedUser = {
            ...prev,
            'Tổng thời gian học': result.studyTime!.allTime,
            'Thời gian học hôm nay': result.studyTime!.today,
            'Ngày cập nhật học': result.studyTime!.lastUpdateDate,
          };
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
          return updatedUser;
        });
        showToast(`Đã ghi nhận ${durationInMinutes} phút học cuối cùng.`, 'success');
      } else {
        showToast('Không thể lưu thời gian học cuối cùng.', 'error');
      }
    } else {
      showToast('Kết thúc phiên học.', 'info');
    }
  }, [currentUser, showToast]);

  const logout = () => {
    endStudySession();
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const register = async (username: string, email: string, pass: string, schoolName: string) => {
    try {
      const existingUser = await getAccountByEmail(email);
      if (existingUser) {
        return { success: false, error: 'Email này đã được sử dụng.' };
      }

      const response = await registerUser({
        'Tên tài khoản': username,
        Email: email,
        'Mật khẩu': pass,
        schoolName: schoolName
      });

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Đã xảy ra lỗi khi đăng ký.' };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await resendVerificationEmailService(email);
      if (response && (response as any).status === 'success') {
        return { success: true, message: (response as any).message };
      }
      return response;
    } catch (error: any) {
      console.error('Resending verification email failed:', error);
      return { success: false, error: error.message || 'Đã xảy ra lỗi khi gửi lại email.' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      return await requestPasswordResetService(email);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPasswordWithOTP = async (email: string, otp: string, newPass: string) => {
    try {
      return await resetPasswordWithOTPService(email, otp, newPass);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUsername = useCallback(async (newName: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Bạn phải đăng nhập.' };
    }

    const originalUser = { ...currentUser };
    const updatedUser = { ...currentUser, 'Tên tài khoản': newName };

    setCurrentUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

    try {
      const result = await updateUsernameService(currentUser.Email, newName);
      if (result.success) {
        showToast('Tên đã được cập nhật thành công!', 'success');
        return { success: true };
      } else {
        setCurrentUser(originalUser);
        sessionStorage.setItem('currentUser', JSON.stringify(originalUser));
        showToast(result.error || 'Cập nhật tên thất bại.', 'error');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      setCurrentUser(originalUser);
      sessionStorage.setItem('currentUser', JSON.stringify(originalUser));
      showToast(error.message || 'Lỗi mạng, không thể cập nhật tên.', 'error');
      return { success: false, error: error.message };
    }
  }, [currentUser, showToast]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Bạn phải đăng nhập.' };
    }

    if (currentUser['Mật khẩu'] !== currentPassword) {
      showToast('Mật khẩu hiện tại không đúng.', 'error');
      return { success: false, error: 'Mật khẩu hiện tại không đúng.' };
    }

    try {
      const result = await updatePasswordService(currentUser.Email, currentPassword, newPassword);
      if (result.success) {
        const updatedUser = { ...currentUser, 'Mật khẩu': newPassword };
        setCurrentUser(updatedUser);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        showToast('Mật khẩu đã được thay đổi thành công!', 'success');
        return { success: true };
      } else {
        showToast(result.error || 'Đổi mật khẩu thất bại.', 'error');
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi mạng, không thể đổi mật khẩu.', 'error');
      return { success: false, error: error.message };
    }
  }, [currentUser, showToast]);

  const updateUserStats = useCallback(async (attempted: number, correct: number) => {
    const userToUpdate = JSON.parse(sessionStorage.getItem('currentUser') || 'null') as Account | null;

    if (!userToUpdate) return;

    const updatedUserForStats: Account = {
      ...userToUpdate,
      'Tổng số câu hỏi đã làm': (userToUpdate['Tổng số câu hỏi đã làm'] || 0) + attempted,
      'Tổng số câu hỏi đã làm đúng': (userToUpdate['Tổng số câu hỏi đã làm đúng'] || 0) + correct,
      'Tổng số câu hỏi đã làm trong tuần': (userToUpdate['Tổng số câu hỏi đã làm trong tuần'] || 0) + attempted,
      'Tổng số câu hỏi đã làm đúng trong tuần': (userToUpdate['Tổng số câu hỏi đã làm đúng trong tuần'] || 0) + correct,
    };

    setCurrentUser(updatedUserForStats);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUserForStats));

    updateUserQuizStats(userToUpdate.Email, attempted, correct)
      .catch(err => {
        console.error("Error calling updateUserQuizStats service:", err);
      });
  }, [showToast]);

  const deductTokensForPractice = useCallback(() => {
    showToast('Chức năng token đang được bảo trì. Lần luyện tập này miễn phí!', 'info');
  }, [showToast]);

  const refreshCurrentUser = useCallback(async (options?: { silent?: boolean }): Promise<Account | null> => {
    const userInSession = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (!userInSession?.Email) return null;
    try {
      const updatedAccount = await getAccountByEmail(userInSession.Email, true);
      if (updatedAccount) {
        setCurrentUser(updatedAccount);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedAccount));
        return updatedAccount;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh current user:", error);
      return null;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    isAuthReady,
    login,
    logout,
    register,
    resendVerificationEmail,
    requestPasswordReset,
    resetPasswordWithOTP,
    updateUserStats,
    deductTokensForPractice,
    isStudying,
    sessionStartTime,
    startStudySession,
    endStudySession,
    updateUsername,
    updatePassword,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
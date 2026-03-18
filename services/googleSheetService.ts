import type { AnatomyQuestion, MedicalQuestion, Account, DocumentData, AnyQuestion, ScientificArticle, ForumPost, ForumComment, CustomQuizQuestion, UserQuiz, Classroom, ClassMember, AssignedQuiz, ScheduleEvent, QuizResult, NewStudentCredential, Course, Book, SubscriptionPlan, UserSubscription, Purchase } from '@/types';

// This is the correct, user-provided Google Apps Script URL.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwg7YM7xq9v1Z3p4G8wWqNVHAMZ3iaoJjioD09slMjBopE1gBSnZbM7FEhmPySpxccv/exec";

// --- CONFIG ---
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_LOCAL_CACHE = 4_000_000; // 4MB limit for local storage
const MAX_MEMORY_CACHE = 50; // Max items in m

// --- TYPES ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

if (typeof window !== 'undefined') {
  localStorage.removeItem('edifyx_cache_post:Accounts');
}

// --- MEMORY CACHE (LRU) ---
const memoryCache = new Map<string, CacheEntry<any>>();

function setMemoryCache<T>(key: string, entry: CacheEntry<T>) {
  if (memoryCache.size >= MAX_MEMORY_CACHE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, entry);
}

function getMemoryCache<T>(key: string): CacheEntry<T> | null {
  return memoryCache.get(key) || null;
}

// --- COMPRESSION ---
function compress(data: any) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  } catch { return ""; }
}

function decompress(data: string) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(data))));
  } catch { return null; }
}

// --- SERVER CACHE REPLACEMENT ---
async function setLocalCache(key: string, data: any) {
  // Lưu cache 24h (86400s) để hỗ trợ SWR (Stale-While-Revalidate)
  // Dữ liệu cũ vẫn được trả về trong khi fetch mới chạy ngầm
  if (typeof window !== 'undefined') return;
  try {
    const { cache } = await import('@/lib/cache');
    await cache.set(`edifyx_cache_${key}`, data, 86400);
  } catch { /* ignore cache errors */ }
}

async function getLocalCache<T>(key: string): Promise<CacheEntry<T> | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const { cache } = await import('@/lib/cache');
    return await cache.get<CacheEntry<T>>(`edifyx_cache_${key}`);
  } catch { return null; }
}

// --- REQUEST DEDUPE ---
const pendingRequests = new Map<string, Promise<any>>();

// --- CORE REQUEST (GET) ---
const getFromAppsScript = async (
  action: string,
  params: Record<string, any> = {},
  retries = 2,
  timeout = 25000,
  noNextCache = false
): Promise<any> => {
  const queryString = new URLSearchParams({ action, ...params }).toString();
  
  // Use proxy on client to avoid CORS, direct on server
  const baseUrl = typeof window !== 'undefined' ? '/api/apps-script' : APPS_SCRIPT_URL;
  const url = `${baseUrl}?${queryString}`;
  const key = url;

  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    // Tắt Next.js Data Cache cho các sheet khổng lồ để không bị báo lỗi vượt quá 2MB
    const fetchOptions: RequestInit = noNextCache 
      ? { cache: 'no-store' } 
      : { next: { revalidate: 300 } };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        signal: controller.signal,
        ...fetchOptions
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}\n` +
          errorText.substring(0, 300)
        );
      }

      const text = await response.text();

      if (!text || !text.trim()) {
        throw new Error("Empty response from Apps Script");
      }

      let result: any;
      try {
        result = JSON.parse(text);
      } catch (err: any) {
        throw new Error(
          "Invalid JSON from Apps Script:\n" +
          text.substring(0, 500)
        );
      }

      if (result.status === "error") {
        throw new Error(result.message || "Apps Script error");
      }

      return result;

    } catch (error: any) {
      const retryable =
        error.name === "AbortError" ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("HTTP 500") ||
        error.message.includes("HTTP 404");

      if (retries > 0 && retryable) {
        await new Promise(r => setTimeout(r, 1200));
        return getFromAppsScript(action, params, retries - 1, timeout);
      }
      throw error;
    } finally {
      pendingRequests.delete(key);
      clearTimeout(timer);
    }
  })();

  pendingRequests.set(key, request);
  return request;
};

// --- CORE REQUEST ---
const postToAppsScript = async (
  payload: Record<string, any>,
  retries = 2,
  timeout = 25000,
  noNextCache = false
): Promise<any> => {
  let lastError: any;

  // Tắt Next.js Data Cache cho các sheet khổng lồ
  const fetchOptions: RequestInit = noNextCache 
    ? { cache: 'no-store' } 
    : { next: { revalidate: 30 } };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const baseUrl = typeof window !== 'undefined' ? '/api/apps-script' : APPS_SCRIPT_URL;
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        ...fetchOptions
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n` + errorText.substring(0, 300));
      }

      const text = await response.text();
      if (!text || !text.trim()) throw new Error("Empty response from Apps Script");

      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON:\n" + text.substring(0, 500));
      }

      if (result.status === "error") {
        const msg = typeof result.message === 'string'
          ? result.message
          : String(result.message ?? "Apps Script error");
        throw new Error(msg);
      }

      return result;

    } catch (error: any) {
      clearTimeout(timer);
      lastError = error;

      const retryable =
        error.name === "AbortError" ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("HTTP 500") ||
        error.message?.includes("HTTP 404");

      if (!retryable || attempt >= retries) break;
      await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
    }
  }

  throw lastError;
};

// --- REVALIDATION TRACKER ---
// --- GENERIC FETCH (CACHE + SWR) ---
const revalidationRequests = new Map<string, Promise<any>>();

const fetchDataFromAppsScript = async <T>(
  sheetName: string,
  ignoreCache = false,
  skipLocalCache = false,
  fields?: string
): Promise<T[]> => {

  const cacheKey = fields ? `post:${sheetName}_${fields.replace(/[\s,]/g, '_')}` : `post:${sheetName}`;
  const isHugeSheet = sheetName === 'Research_Accounts' || sheetName === 'Premium' || sheetName === 'Questions_ABCD' || sheetName === 'Questions_TLN';
  const timeoutLimit = isHugeSheet ? 60000 : 25000;

  let cached = getMemoryCache<T[]>(cacheKey);

  if (!cached && !ignoreCache && !skipLocalCache) {
    cached = await getLocalCache<T[]>(cacheKey);
    if (cached) setMemoryCache(cacheKey, cached);
  }

  if (cached && !ignoreCache) {

    const stale = Date.now() - cached.timestamp > CACHE_DURATION;

    if (stale && !revalidationRequests.has(cacheKey)) {

      const params: any = { sheetName };
      if (fields) params.fields = fields;

      const revalidate = getFromAppsScript("getSheetData", {
        ...params,
        ignoreCache: true // Force refresh on server side if needed, though GAS handles its own cache
      }, 2, timeoutLimit, isHugeSheet)
      .then(res => {

        if (res.status === "success" && Array.isArray(res.data)) {

          const entry = {
            data: res.data,
            timestamp: Date.now()
          };

          setMemoryCache(cacheKey, entry);

          if (!skipLocalCache) {
            setLocalCache(cacheKey, entry);
          }

        }

      })
      .finally(() => {
        revalidationRequests.delete(cacheKey);
      });

      revalidationRequests.set(cacheKey, revalidate);

    }

    return cached.data;

  }

  let result;
  try {
    const params: Record<string, any> = { sheetName };
    if (fields) params.fields = fields;

    result = await getFromAppsScript("getSheetData", params, 2, timeoutLimit, isHugeSheet);
    
    // Fallback to POST if GET returns the default "API running" message (Old Deployment)
    if (result.status === "ok" && result.message === "API running") {
      throw new Error("Old Deployment");
    }
  } catch (e) {
    result = await postToAppsScript({
      action: "getSheetData",
      sheetName,
      ...(fields ? { fields } : {})
    }, 2, timeoutLimit, isHugeSheet);
  }

  if (result.status === "success" && Array.isArray(result.data)) {

    const entry = {
      data: result.data,
      timestamp: Date.now()
    };

    setMemoryCache(cacheKey, entry);

    if (!skipLocalCache) {
      await setLocalCache(cacheKey, entry);
    }

    return result.data as T[];

  }

  throw new Error(result.message || `Failed to fetch sheet: ${sheetName}`);
};

const clientCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

async function cachedPost<T>(cacheKey: string, body: object, ttl = CACHE_TTL): Promise<T> {
  const hit = clientCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < ttl) return hit.data as T;

  const baseUrl = typeof window !== 'undefined' ? '/api/apps-script' : APPS_SCRIPT_URL;
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  clientCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}


// --- PAGINATION & SEARCH API ---
export async function fetchSheetPage<T>(sheetName: string, offset: number, limit: number, query?: Record<string, any>): Promise<T[]> {
  const res = await postToAppsScript({ action: "getSheetPage", sheetName, offset, limit, query });
  return res.data || [];
}

export async function searchSheet<T>(sheetName: string, keyword: string): Promise<T[]> {
  const res = await postToAppsScript({ action: "searchSheet", sheetName, keyword });
  return res.data || [];
}

export async function fetchQuestionsPage(offset: number, limit: number, subject?: string): Promise<any[]> {
  const result = await postToAppsScript({ action: "getQuestionsPage", offset, limit, subject });
  return result.data || [];
}

// --- CACHE CLEANUP ---
export function clearExpiredCache() {
  // Server cache (Redis/Mem) tự động hết hạn (TTL), không cần cleanup thủ công
}
clearExpiredCache();

// Cache riêng cho getAccountByEmail (không dùng localStorage vì nhạy cảm)
const accountCache = new Map<string, { data: Account; timestamp: number }>();
const ACCOUNT_CACHE_DURATION = 30 * 1000; // 30 giây

export const getAccountByEmail = async (
  email: string,
  ignoreCache = false
): Promise<Account | null> => {
  const key = email.toLowerCase().trim();

  // Trả cache nếu còn hạn
  if (!ignoreCache) {
    const cached = accountCache.get(key);
    if (cached && Date.now() - cached.timestamp < ACCOUNT_CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    let result;
    try {
      result = await getFromAppsScript('getAccountByEmail', {
        email: email.toLowerCase().trim(),
      });
      if (result.status === "ok" && result.message === "API running") throw new Error("Old Deployment");
    } catch {
      result = await postToAppsScript({
        action: 'getAccountByEmail',
        email: email.toLowerCase().trim(),
      });
    }

    if (result.status === 'success' && result.data) {
      const acc = result.data;
      const account: Account = {
        'Tên tài khoản': String(acc['Tên tài khoản'] || '').trim(),
        'Email': String(acc['Email'] || '').trim(),
        'Mật khẩu': String(acc['Mật khẩu'] || '').trim(),
        'Danh hiệu': String(acc['Danh hiệu'] || '').trim(),
        'Đã xác minh': String(acc['Đã xác minh'] || '').trim(),
        'Vai trò': String(acc['Vai trò'] || '').trim() as any,
        'Tuổi': parseInt(acc['Tuổi'] || '0', 10) || 0,
        'Tổng số câu hỏi đã làm': parseInt(acc['Tổng số câu hỏi đã làm'] || '0', 10) || 0,
        'Tổng số câu hỏi đã làm đúng': parseInt(acc['Tổng số câu hỏi đã làm đúng'] || '0', 10) || 0,
        'Tổng số câu hỏi đã làm trong tuần': parseInt(acc['Tổng số câu hỏi đã làm trong tuần'] || '0', 10) || 0,
        'Tổng số câu hỏi đã làm đúng trong tuần': parseInt(acc['Tổng số câu hỏi đã làm đúng trong tuần'] || '0', 10) || 0,
        'Tokens': parseInt(acc['Tokens'] || '0', 10) || 0,
        'Tổng thời gian học': parseInt(acc['Tổng thời gian học'] || '0', 10) || 0,
        'Thời gian học hôm nay': parseInt(acc['Thời gian học hôm nay'] || '0', 10) || 0,
        'Ngày cập nhật học': String(acc['Ngày cập nhật học'] || '').trim(),
        'Money': parseInt(acc['Money'] || '0', 10) || 0,
        'AvatarURL': String(acc['AvatarURL'] || '').trim(),
        'Plan': String(acc['Plan'] || 'Basic').trim(),
        'Credits_Left': parseInt(acc['Credits_Left'] || '0', 10) || 0,
        'Thông tin mô tả': String(acc['Thông tin mô tả'] || '').trim(),
        'Môn học': String(acc['Bạn bè'] || acc['Môn học'] || '').trim(),
        'Bạn bè': String(acc['Bạn bè'] || acc['Môn học'] || '').trim(),
        'Goal': String(acc['Goal'] || '').trim(),
        'Voucher': String(acc['Voucher'] || '').trim(),
        'Tiêu chí 1': acc['Tiêu chí 1'] ?? null,
        'Tiêu chí 2': acc['Tiêu chí 2'] ?? null,
        'Tiêu chí 3': acc['Tiêu chí 3'] ?? null,
        'Tiêu chí 4': acc['Tiêu chí 4'] ?? null,
        'Tiêu chí 5': acc['Tiêu chí 5'] ?? null,
        'Tiêu chí 6': acc['Tiêu chí 6'] ?? null,
      };

      // Lưu vào memory cache
      accountCache.set(key, { data: account, timestamp: Date.now() });
      return account;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch account by email:', error);
    return null;
  }
};

// Gọi hàm này sau khi update avatar/username để xóa cache cũ
export function invalidateAccountCache(email: string) {
  accountCache.delete(email.toLowerCase().trim());
}


export interface ClassDocument {
    DocumentID: string;
    ClassID: string;
    Title: string;
    Description: string;
    AuthorEmail: string;
    Timestamp: string;
    DocumentURL: string;
    DueDate: string;
}

// --- Classroom Services ---
export const getPublicClasses = async (): Promise<(Classroom & { JoinCode: string })[]> => {
  try {
    // Tải song song các sheet để tối ưu tốc độ
    const [rawClasses, classMembers, classQuizzes, classDocuments] = await Promise.all([
      fetchDataFromAppsScript<any>('Classes'),
      fetchDataFromAppsScript<any>('ClassMembers'),
      fetchDataFromAppsScript<any>('ClassQuizzes'),
      fetchDataFromAppsScript<any>('ClassDocuments'),
    ]);

    // Lọc ra các lớp công khai
    const publicClasses = rawClasses.filter((c: any) => {
      const p = String(c['Public'] || '').trim().toLowerCase();
      return p === 'yes' || p === 'true' || p === '1';
    });

    // Đếm trước số lượng thành viên cho mỗi lớp để tối ưu
    const memberCounts = classMembers.reduce((acc, member) => {
      const classId = String(member.ClassID || '').trim();
      if (classId) {
        acc[classId] = (acc[classId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Đếm trước số lượng bài tập cho mỗi lớp
    const quizCounts = classQuizzes.reduce((acc, quiz) => {
      const classId = String(quiz.ClassID || '').trim();
      if (classId) {
        acc[classId] = (acc[classId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Đếm trước số lượng tài liệu cho mỗi lớp
    const docCounts = classDocuments.reduce((acc: any, doc: any) => {
      const classId = String(doc.ClassID || '').trim();
      if (classId) {
        acc[classId] = (acc[classId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Map dữ liệu lớp học với số lượng đã đếm
    return publicClasses.map((c: any) => {
      const classId = String(c['ClassID'] || '').trim();
      return {
        ...c, // Giữ lại các trường gốc từ sheet Classrooms
        memberCount: memberCounts[classId] || 0, // Ghi đè/thêm số lượng thành viên
        quizCount: (quizCounts[classId] || 0) + (docCounts[classId] || 0), // Tổng số bài tập + tài liệu
      };
    });
  } catch (error) {
    console.error('Failed to fetch public classes:', error);
    return [];
  }
};

export const createClass = async (classData: { className: string; subject: string; description: string; }, creatorEmail: string): Promise<{ success: boolean; error?: string; classId?: string; joinCode?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'createClass',
            ...classData,
            creatorEmail
        });

        if (typeof result !== 'object' || result === null) {
          throw new Error('Phản hồi không hợp lệ từ máy chủ.');
        }

        if (result.status !== 'success') {
            throw new Error(result.message || 'Lỗi không xác định từ máy chủ khi tạo lớp.');
        }
        return { success: true, classId: result.classId, joinCode: result.joinCode };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const fetchVouchers = async (): Promise<any[]> => {
    try {
        const rawVouchers = await fetchDataFromAppsScript<any>('Vouchers');
        return rawVouchers.map((v: any) => ({
            Code: String(v['Code'] || '').trim(),
            Title: String(v['Title'] || '').trim(),
            Description: String(v['Description'] || '').trim(),
            Discount: String(v['Discount'] || '').trim(),
            ExpiryDate: String(v['ExpiryDate'] || '').trim(),
            Status: String(v['Status'] || '').trim(),
        }));
    } catch (error) {
        console.error("Failed to fetch vouchers:", error);
        return [];
    }
};

export const redeemVoucher = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'redeemVoucher',
            email,
            code
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const joinClass = async (joinCode: string, studentEmail: string): Promise<{ success: boolean; error?: string; details?: any; message?: string; }> => {
    try {
        const result = await postToAppsScript({
            action: 'joinClass',
            joinCode,
            studentEmail
        });
        if (result.status === 'success' && result.details) {
            return { success: true, details: result.details, message: result.message };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getClassesForUser = async (email: string): Promise<Classroom[]> => {
    try {
        const result = await getFromAppsScript('getClassesForUser', {
            email: email.trim()
        });
        return result.classes || [];
    } catch (error) {
        console.error("Failed to fetch user classes:", error);
        return [];
    }
};

export const getClassDetails = async (classId: string): Promise<{ info: Classroom; members: ClassMember[]; quizzes: AssignedQuiz[] } | null> => {
    try {
        const result = await getFromAppsScript('getClassDetails', {
            classId: classId.trim(),
        });
        return result.details || null;
    } catch (error) {
        console.error("Failed to fetch class details:", error);
        return null;
    }
};

export const getClassDocuments = async (classId: string): Promise<ClassDocument[]> => {
    try {
        const rawDocs = await fetchDataFromAppsScript<any>('ClassDocuments');
        return rawDocs
            .filter((d: any) => String(d.ClassID || '').trim() === classId)
            .map((d: any) => ({
                DocumentID: String(d.DocumentID || '').trim(),
                ClassID: String(d.ClassID || '').trim(),
                Title: String(d.Title || '').trim(),
                Description: String(d.Description || '').trim(),
                AuthorEmail: String(d.AuthorEmail || '').trim(),
                Timestamp: String(d.Timestamp || '').trim(),
                DocumentURL: String(d.DocumentURL || '').trim(),
                DueDate: String(d.DueDate || '').trim(),
            }));
    } catch (error) {
        console.error("Failed to fetch class documents:", error);
        return [];
    }
};

export const batchAddStudents = async (classId: string, names: string[]): Promise<{ success: boolean; error?: string; createdStudents?: NewStudentCredential[] }> => {
    try {
        const result = await postToAppsScript({
            action: 'batchAddStudents',
            classId,
            names
        });
        if (result.status === 'success') {
            return { success: true, createdStudents: result.createdStudents };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const assignTestToClass = async (classId: string, quizId: string, dueDate: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'assignTestToClass',
            classId,
            quizId,
            dueDate
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const assignDocumentToClass = async (
    classId: string,
    file: File,
    title: string,
    description: string,
    dueDate: string,
    authorEmail: string
): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const content = reader.result as string;
                const base64 = content.split(',')[1];
                const result = await postToAppsScript({
                    action: 'assignDocumentToClass',
                    classId,
                    title,
                    description,
                    dueDate,
                    authorEmail,
                    fileInfo: {
                        fileContent: base64,
                        mimeType: file.type,
                        fileName: file.name
                    }
                });
                resolve({ success: result.status === 'success', error: result.message });
            } catch (error: any) {
                resolve({ success: false, error: error.message });
            }
        };
        reader.onerror = () => resolve({ success: false, error: 'Lỗi khi đọc file.' });
    });
};

export const getScheduleForUser = async (email: string): Promise<ScheduleEvent[]> => {
    try {
        const result = await getFromAppsScript('getScheduleForUser', {
            email: email.trim(),
        });
        return result.schedule || [];
    } catch (error) {
        console.error("Failed to fetch user schedule:", error);
        return [];
    }
};

export const fetchPurchasedCategories = async (
  email: string
): Promise<{ CategoryName: string; PurchaseDate: string }[]> => {
  try {
    // Thử dùng API action trước để tối ưu và tránh lỗi fetch toàn bộ sheet
    try {
      const result = await postToAppsScript({
        action: 'getPurchasedCategories',
        email: email
      });
      if (result.status === 'success' && Array.isArray(result.data)) {
        return result.data.map((item: any) => ({
          CategoryName: String(item.CategoryName || item.categoryName || item[1] || '').trim(),
          PurchaseDate: String(item.PurchaseDate || item.purchaseDate || item[2] || '').trim(),
        }));
      }
    } catch (e) {
      console.warn('getPurchasedCategories action failed, falling back to sheet fetch', e);
    }

    // Fallback lấy từ sheet Purchases
    const allPurchases = await fetchDataFromAppsScript<Purchase>('Purchases');
    const normalizedEmail = email.trim().toLowerCase();

    return allPurchases
      .filter(p => String(p.UserEmail || '').trim().toLowerCase() === normalizedEmail)
      .map(p => ({
        CategoryName: String(p.CategoryName || '').trim(),
        PurchaseDate: String(p.PurchaseDate || '').trim(),
      }));
  } catch (error) {
    console.error('Failed to fetch purchased categories:', error);
    return [];
  }
};

export const fetchPurchaseStats = async (): Promise<Record<string, number>> => {
    try {
        const rawPurchases = await fetchDataFromAppsScript<Purchase>('Purchases');
        if (!Array.isArray(rawPurchases)) {
            return {};
        }
        
        const categoryUsers: Record<string, Set<string>> = {};

        rawPurchases.forEach((p) => {
            let category = String(p.CategoryName || '').trim();
            const email = String(p.UserEmail || '').trim().toLowerCase();
            
            // Loại bỏ phần giá tiền trong ngoặc, ví dụ: "Bài tập 2023 (2.229.000 đ)" -> "Bài tập 2023"
            // Xử lý cả trường hợp (Miễn phí) hoặc (0 đ)
            category = category.replace(/\s*\((?:[\d.,]+\s*đ|Miễn phí|0\s*đ)\)$/i, '').trim();

            if (category && email) {
                if (!categoryUsers[category]) {
                    categoryUsers[category] = new Set();
                }
                categoryUsers[category].add(email);
            }
        });

        const stats: Record<string, number> = {};
        for (const [cat, users] of Object.entries(categoryUsers)) {
            stats[cat] = users.size;
        }
        return stats;
    } catch (error) {
        console.error("Failed to fetch purchase stats:", error);
        return {};
    }
};

export const purchasePremiumCategory = async (
  userEmail: string,
  categoryName: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  try {
    const result = await postToAppsScript({
      action: 'purchasePremiumCategory',
      userEmail,
      categoryName,
    }, 0, 45000);

    if (result.status === 'success') {
      return { success: true, newBalance: result.newBalance };
    }
    return { success: false, error: result.message };
  } catch (error: any) {
    // ✅ Bỏ window.location.reload() — không reload khi lỗi
    return { success: false, error: error.message };
  }
};

const mapBankQuestionToMedicalQuestion = (raw: any): MedicalQuestion => ({
    ID: raw.ID || raw.id || Math.random().toString(36).substring(7),
    Question_Text: raw['Câu hỏi'] || raw.question || '',
    Option_A: raw.A || '',
    Option_B: raw.B || '',
    Option_C: raw.C || '',
    Option_D: raw.D || '',
    Correct_Answer: (raw['Đúng'] || raw.correct || '').trim().toUpperCase() as 'A' | 'B' | 'C' | 'D',
    Explanation: raw['Lời giải'] || raw.explanation || '',
    Specialty: raw['Môn'] || raw.subject || '', // Using specialty to hold the subject
    Paragraph: undefined, 
    GroupID: undefined,
    Image_URL: raw.Image_URL || undefined,
});


export const fetchDocuments = async (): Promise<DocumentData[]> => {
const rawDocs = await fetchDataFromAppsScript<any>('Documents');
return rawDocs.map((doc: any) => ({
    title: doc.title || '',
    author: doc.author || '',
    category: doc.category || '',
    pages: parseInt(doc.pages || '0', 10),
    imageUrl: doc.imageUrl || '',
    documentUrl: doc.documentUrl || '',
    uploader: doc.uploader || '',
    uploadDate: doc.uploadDate || '',
}));
};

export const fetchAccounts = async (ignoreCache = false): Promise<Account[]> => {
  // Chỉ lấy những thông tin thực sự cần thiết để render Avatar ở Forum, bài viết (giảm từ 4MB -> 300KB)
  const fields = 'Tên tài khoản,Email,Danh hiệu,Đã xác minh,Vai trò,AvatarURL';
const rawAccounts = await fetchDataFromAppsScript<any>('Accounts', ignoreCache, false, fields); 
return rawAccounts.map((acc: any) => ({
    'Tên tài khoản': String(acc['Tên tài khoản'] || '').trim(),
    'Email': String(acc['Email'] || '').trim(),
    'Mật khẩu': '',
    'Gói đăng ký': '',
    'Danh hiệu': String(acc['Danh hiệu'] || '').trim(),
    'Đã xác minh': String(acc['Đã xác minh'] || '').trim(),
    'Vai trò': String(acc['Vai trò'] || '').trim() as 'Sinh viên' | 'Nhà nghiên cứu tự do' | 'Học sinh' | 'Nhà báo (nhà tuyển dụng)',
    'Đặc biệt': '',
    'Phái': 'Chính Đạo',
    'Tuổi': 0,
    'Tổng số câu hỏi đã làm': 0,
    'Tổng số câu hỏi đã làm đúng': 0,
    'Tổng số câu hỏi đã làm trong tuần': 0,
    'Tổng số câu hỏi đã làm đúng trong tuần': 0,
    'Tokens': 0,
    'Tổng thời gian học': 0,
    'Thời gian học hôm nay': 0,
    'Ngày cập nhật học': '',
    'Money': 0,
    'AvatarURL': String(acc['AvatarURL'] || '').trim(),
    'Thông tin mô tả': '',
    'Bạn bè': '',
    'Trường': '',
    'Owned': '',
    'Goal': '',
    'Voucher': '',
    'Tiêu chí 1': null,
    'Tiêu chí 2': null,
    'Tiêu chí 3': null,
    'Tiêu chí 4': null,
    'Tiêu chí 5': null,
    'Tiêu chí 6': null,
}));
};

export const fetchArticles = async (): Promise<ScientificArticle[]> => {
    // Bỏ qua localStorage cho sheet này vì dữ liệu rất lớn, chỉ dùng memory cache.
    // Đã bỏ ThumbnailURL để tiết kiệm dung lượng payload
    const fields = 'ID,Title,Authors,Abstract,Keywords,Category,DocumentURL,SubmitterEmail,SubmissionDate,Status,Pending,Feedback';
    const rawArticles = await fetchDataFromAppsScript<any>('Research_Accounts', false, true, fields);
    return rawArticles.map((art: any) => {
    const id = String(art['ID'] || '').trim();
    return {
        ID: id,
        SM_DOI: `080727${id}`,
        Title: String(art['Title'] || '').trim(),
        Authors: String(art['Authors'] || '').trim(),
        Abstract: String(art['Abstract'] || '').trim(),
        Keywords: String(art['Keywords'] || '').trim(),
        Category: String(art['Category'] || '').trim(),
        DocumentURL: String(art['DocumentURL'] || '').trim(),
        SubmitterEmail: String(art['SubmitterEmail'] || '').trim(),
        SubmissionDate: String(art['SubmissionDate'] || '').trim(),
        Status: String(art['Pending'] || art['Status'] || 'Pending').trim(), 
        Feedback: String(art['Feedback'] || '').trim(),
        ThumbnailURL: '',
    };
    });
};

export const fetchArticlesForSitemap = async (): Promise<Partial<ScientificArticle>[]> => {
    const fields = 'ID,Title,Category,SubmissionDate';
    const rawArticles = await fetchDataFromAppsScript<any>('Research_Accounts', false, false, fields);
    return rawArticles.map((art: any) => ({
        ID: String(art['ID'] || '').trim(),
        Title: String(art['Title'] || '').trim(),
        Category: String(art['Category'] || '').trim(),
        SubmissionDate: String(art['SubmissionDate'] || '').trim(),
    }));
};

export const fetchPremiumArticles = async (): Promise<ScientificArticle[]> => {
    // Đã bỏ ThumbnailURL
    const fields = 'ID,Title,Authors,Abstract,Keywords,Category,DocumentURL,SubmitterEmail,SubmissionDate,Status,Price,Part,Feedback';
    const rawArticles = await fetchDataFromAppsScript<any>('Premium', false, false, fields);
    return rawArticles.map((art: any) => {
        const id = String(art['ID'] || '').trim();
        return {
            ID: id,
            SM_DOI: `080727${id}`,
            Title: String(art['Title'] || '').trim(),
            Authors: String(art['Authors'] || '').trim(),
            Abstract: String(art['Abstract'] || '').trim(),
            Keywords: String(art['Keywords'] || '').trim(),
            Category: String(art['Category'] || '').trim(),
            DocumentURL: String(art['DocumentURL'] || '').trim(),
            SubmitterEmail: String(art['SubmitterEmail'] || '').trim(),
            SubmissionDate: String(art['SubmissionDate'] || '').trim(),
            Status: String(art['Status'] || 'Approved').trim() as 'Pending' | 'Approved' | 'Rejected',
            Feedback: String(art['Feedback'] || '').trim(),
            Price: String(art['Price'] || '0').trim().replace(/,/g, ''),
            Part: String(art['Part'] || '').trim(),
            ThumbnailURL: '',
        };
    });
};


export const fetchCourses = async (): Promise<Course[]> => {
    try {
        const fields = 'ID,Title,Authors,Category,SubmissionDate,Price,ImageURL,For,Update,Expiry,Sales,Goal,MainTeacher';
        const rawCourses = await fetchDataFromAppsScript<any>('Courses', false, false, fields);
        
        if (!Array.isArray(rawCourses)) {
            console.error('fetchCourses: Expected array but got:', typeof rawCourses);
            return [];
        }

        return rawCourses.map((c: any) => ({
            ID: String(c['ID'] || '').trim(),
            Title: String(c['Title'] || '').trim(),
            Authors: String(c['Authors'] || '').trim(),
            Abstract: String(c['Abstract'] || '').trim(),
            Keywords: String(c['Keywords'] || '').trim(),
            Category: String(c['Category'] || '').trim(),
            SubmissionDate: String(c['SubmissionDate'] || '').trim(),
            Price: parseInt(String(c['Price'] || '0').replace(/,/g, ''), 10),
            ImageURL: String(c['ImageURL'] || '').trim().replace(/^["']|["']$/g, ''), // Remove quotes if present
            For: String(c['For'] || '').trim(),
            Update: String(c['Update'] || '').trim(),
            Expiry: String(c['Expiry'] || '').trim(),
            Sales: String(c['Sales'] || '').trim(),
            Goal: String(c['Goal'] || '').trim(),
            MainTeacher: String(c['MainTeacher'] || '').trim(),
        })).filter(c => c.ID || c.Title); // Relaxed filter: ID OR Title
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
};

export const getCourseById = async (id: string): Promise<Course | null> => {
    if (!id) return null;
    // Tận dụng cache của fetchCourses thay vì gọi API riêng lẻ
    // Điều này giúp tránh việc fetch lại toàn bộ sheet nếu đã có cache
    const courses = await fetchCourses();
    // Tìm khóa học trong danh sách đã cache
    const course = courses.find(c => String(c.ID).trim() === String(id).trim());
    return course || null;
};

export const fetchCourseDetail = async (courseId: string): Promise<{ course: Course; articles: ScientificArticle[]; teacher: Account | null }> => {
  try {
    let result;
    try {
      result = await getFromAppsScript('getCourseDetail', { courseId });
      if (result.status === "ok" && result.message === "API running") throw new Error("Old Deployment");
    } catch {
      // Fallback to POST if GET fails
      result = await postToAppsScript({ action: 'getCourseDetail', courseId });
    }
    return {
      course: result.course,
      articles: result.articles,
      teacher: result.teacher
    };
  } catch (error) {
    console.error('Failed to fetch course detail:', error);
    throw error;
  }
};

export const fetchForumPosts = async (ignoreCache: boolean = false, skipLocalCache: boolean = false): Promise<ForumPost[]> => {
const fields = 'ID,Title,Content,AuthorEmail,AuthorName,Channel,Timestamp,TimeStamp,Date,Time,Upvotes,UpvotedBy,ImageURLs,DocURLs';
const rawPosts = await fetchDataFromAppsScript<any>('Forum_Posts', ignoreCache, skipLocalCache, fields);
return rawPosts.map((p: any) => ({
    ID: String(p.ID || '').trim(),
    Title: String(p.Title || '').trim().replace(/^\\\|\//, ''),
    Content: String(p.Content || '').trim().replace(/^\\\|\//, ''),
    AuthorEmail: String(p.AuthorEmail || '').trim(),
    AuthorName: String(p.AuthorName || '').trim(),
    Channel: String(p.Channel || '').trim(),
    Timestamp: String(p.Timestamp || p.TimeStamp || p.Date || p.Time || '').trim(),
    Upvotes: String(p.Upvotes || '').trim(),
    UpvotedBy: String(p.UpvotedBy || '').trim(),
    ImageURLs: String(p.ImageURLs || '').trim(),
    DocURLs: String(p.DocURLs || '').trim(),
}));
};

export const fetchForumComments = async (ignoreCache: boolean = false, skipLocalCache: boolean = false): Promise<ForumComment[]> => {
const fields = 'ID,PostID,ParentID,Content,AuthorEmail,AuthorName,Timestamp,TimeStamp,Date,Time,ImageURLs,DocURLs';
const rawComments = await fetchDataFromAppsScript<any>('Forum_Comments', ignoreCache, skipLocalCache, fields);
return rawComments.map((c: any) => ({
    ID: String(c.ID || '').trim(),
    PostID: String(c.PostID || '').trim(),
    ParentID: String(c.ParentID || '').trim(),
    Content: String(c.Content || '').trim().replace(/^\\\|\//, ''),
    AuthorEmail: String(c.AuthorEmail || '').trim(),
    AuthorName: String(c.AuthorName || '').trim(),
    Timestamp: String(c.Timestamp || c.TimeStamp || c.Date || c.Time || '').trim(),
    ImageURLs: String(c.ImageURLs || '').trim(),
    DocURLs: String(c.DocURLs || '').trim(),
}));
};

export const registerUser = async (userData: Pick<Account, 'Tên tài khoản' | 'Email' | 'Mật khẩu'> & { schoolName?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
        const payload = {
            action: 'registerUser',
            username: userData['Tên tài khoản'],
            email: userData.Email,
            password: userData['Mật khẩu'],
            schoolName: userData.schoolName || '',
        };
        const result = await postToAppsScript(payload);
        if (result.status === 'success') {
            return { success: true };
        }
        return { success: false, error: result.message || 'Đăng ký thất bại' };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message || 'Đã xảy ra lỗi khi đăng ký.' };
    }
};

export const fetchBooks = async (): Promise<Book[]> => {
    try {
        const fields = 'ID,Title,Authors,Category,SubmissionDate,Price,ImageURL,Saled,Pages,Coupon';
        const rawBooks = await fetchDataFromAppsScript<any>('Books', false, false, fields);
        if (!Array.isArray(rawBooks)) {
            console.error('fetchBooks: Expected array but got:', typeof rawBooks);
            return [];
        }

        return rawBooks.map((b: any) => ({
            ID: String(b['ID'] || '').trim(),
            Title: String(b['Title'] || '').trim(),
            Authors: String(b['Authors'] || '').trim(),
            Abstract: String(b['Abstract'] || '').trim(),
            Category: String(b['Category'] || '').trim(),
            SubmissionDate: String(b['SubmissionDate'] || '').trim(),
            Price: parseInt(String(b['Price'] || '0').replace(/,/g, ''), 10),
            ImageURL: String(b['ImageURL'] || '').trim().replace(/^["']|["']$/g, ''),
            DemoFileURL: String(b['DemoFileURL'] || '').trim(),
            Saled: parseInt(String(b['Saled'] || '0').replace(/,/g, ''), 10),
            Pages: parseInt(String(b['Pages'] || '0').replace(/,/g, ''), 10),
            MoreImageURLs: String(b['MoreImageURLs'] || '').split(',').map(url => url.trim()).filter(url => url.length > 0),
            Coupon: String(b['Coupon'] || '').trim(),
        })).filter(b => b.ID || b.Title);
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
};
export const addArticle = async (
    articleData: Omit<ScientificArticle, 'ID' | 'SM_DOI' | 'SubmissionDate' | 'SubmitterEmail' | 'Status' | 'Feedback'> & { fileInfo?: any },
    submitterEmail: string
): Promise<{ success: boolean; error?: string; newId?: string }> => {
    try {
        const payload = {
            action: 'addArticle',
            ...articleData,
            submitterEmail: submitterEmail,
        };
        const result = await postToAppsScript(payload);
        if (result.status === 'success') {
            return { success: true, newId: result.paperId };
        }
        console.error("addArticle failed:", result);
        return { success: false, error: result.message || result.error || 'An unknown error occurred while adding the article.' };
    } catch (error: any) {
        console.error("addArticle exception:", error);
        return { success: false, error: error.message };
    }
};

export const addForumPost = async (postData: Omit<ForumPost, 'ID' | 'Timestamp' | 'Upvotes' | 'UpvotedBy'>): Promise<{ success: boolean; error?: string }> => {
    try {
        // Tạo timestamp tại client (Frontend) theo định dạng dd/MM/yyyy HH:mm:ss
        const now = new Date();
        const timestamp = now.toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }).replace(',', '');

        const result = await postToAppsScript({
            action: 'addForumPost',
            ...postData,
            Timestamp: timestamp, // Gửi thời gian từ client
            Title: `\\|/${postData.Title}`,
            Content: `\\|/${postData.Content}`
        });
        return result.status === 'success' ? { success: true } : { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const addForumComment = async (commentData: Omit<ForumComment, 'ID' | 'Timestamp'>): Promise<{ success: boolean; error?: string }> => {
    try {
        // Tạo timestamp tại client (Frontend)
        const now = new Date();
        const timestamp = now.toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }).replace(',', '');

        const result = await postToAppsScript({
            action: 'addForumComment',
            ...commentData,
            Timestamp: timestamp, // Gửi thời gian từ client
            Content: `\\|/${commentData.Content}`
        });
        return result.status === 'success' ? { success: true } : { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updatePostUpvote = async (postId: string, userEmail: string): Promise<{ success: boolean; error?: string; newUpvotes?: number; newUpvotedBy?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updatePostUpvote',
            postId,
            userEmail
        });
        if (result.status === 'success') {
            return { success: true, newUpvotes: result.newUpvotes, newUpvotedBy: result.newUpvotedBy };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};


export const updateArticleStatus = async (articleId: string, status: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateArticleStatus',
            id: articleId,
            status: status
        });
        if (result.status === 'success') {
            return { success: true };
        }
        return { success: false, error: result.message || 'An unknown error occurred while updating article status.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateArticleFeedback = async (articleId: string, feedback: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateArticleFeedback',
            id: articleId,
            feedback: feedback
        });
        if (result.status === 'success') {
            return { success: true };
        }
        return { success: false, error: result.message || 'An unknown error occurred while updating article feedback.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'resendVerificationEmail',
            email: email,
        });
        if (result.status === 'success') {
            return { success: true };
        }
        return { success: false, error: result.message || 'Lỗi không xác định.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'requestPasswordReset',
            email: email,
        });
        if (result.status === 'success') {
            return { success: true, message: result.message };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'resetPasswordWithOTP',
            email: email,
            otp: otp,
            newPassword: newPassword,
        });
        if (result.status === 'success') {
            return { success: true };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateUsername = async (email: string, newName: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateUsername',
            email,
            newName,
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updatePassword = async (email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updatePassword',
            email,
            currentPassword,
            newPassword,
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateUserQuizStats = async (email: string, questionsAttempted: number, questionsCorrect: number): Promise<{ success: boolean; error?: string; stats?: any }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateQuizStats',
            email: email,
            questionsAttempted: questionsAttempted,
            questionsCorrect: questionsCorrect,
        });
        if (result.status === 'success') {
            return { success: true, stats: result.stats };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateUserLevel = async (email: string, levelString: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateUserLevel',
            email,
            levelString
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateUserTitle = async (email: string, title: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateUserTitle',
            email,
            title
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateStudyTime = async (email: string, durationInMinutes: number): Promise<{ success: boolean; error?: string, studyTime?: any }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateStudyTime',
            email,
            durationInMinutes,
        });
        if (result.status === 'success') {
            return { success: true, studyTime: result.studyTime };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const addFriend = async (userEmail: string, friendEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'addFriend',
            userEmail,
            friendEmail
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const sendFriendRequest = async (senderEmail: string, receiverEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'sendFriendRequest',
            senderEmail,
            receiverEmail
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const acceptFriendRequest = async (userEmail: string, friendEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'acceptFriendRequest',
            userEmail,
            friendEmail
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const rejectFriendRequest = async (userEmail: string, friendEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'rejectFriendRequest',
            userEmail,
            friendEmail
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const removeFriend = async (userEmail: string, friendEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'removeFriend',
            userEmail,
            friendEmail
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const shareCourseWithFriend = async (payload: {
    ownerEmail: string;
    friendEmail: string;
    courseId: string;
    courseName: string;
    message?: string;
    expiryDays?: number | null;
}): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'shareCourseWithFriend',
            ...payload
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const acceptSharedCourse = async (shareId: string, userEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({ action: 'acceptSharedCourse', shareId, userEmail });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const rejectSharedCourse = async (shareId: string, userEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({ action: 'rejectSharedCourse', shareId, userEmail });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const revokeSharedCourse = async (shareId: string, userEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({ action: 'revokeSharedCourse', shareId, userEmail });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getSharedCoursesInbox = async (userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
        const result = await getFromAppsScript('getSharedCoursesInbox', { userEmail });
        if (result.status === 'success') {
            return { success: true, data: result.data };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getSharedCoursesOutbox = async (userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    try {
        const result = await getFromAppsScript('getSharedCoursesOutbox', { userEmail });
        if (result.status === 'success') {
            return { success: true, data: result.data };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const saveUserQuiz = async (
quizData: { id: string; title: string; description: string; questions: CustomQuizQuestion[] },
authorEmail: string,
isFree: boolean,
oneAttemptOnly: boolean
): Promise<{ success: boolean; error?: string }> => {
    try {
        const payload = {
            action: 'saveUserQuiz',
            quizData: {
                quizId: quizData.id,
                title: quizData.title,
                description: quizData.description,
                authorEmail: authorEmail,
                questions: quizData.questions,
                isFree: isFree,
                oneAttemptOnly: oneAttemptOnly,
            }
        };
        const result = await postToAppsScript(payload);
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export async function uploadForumImage(
  file: File,
  tempPostId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const content = reader.result as string;
        const base64 = content.includes(',') ? content.split(',')[1] : content;

        // Use postToAppsScript to ensure Content-Type is text/plain (avoids CORS preflight)
        const result = await postToAppsScript({
            action: 'uploadForumImage',
            imageBase64: base64,
            mimeType: file.type,
            fileName: file.name,
            postId: tempPostId,
        });

        if (result.status === 'success') {
            // Quan trọng: Đính kèm metadata vào URL để frontend phân biệt ảnh/tài liệu
            const meta = new URLSearchParams();
            meta.set('mime', file.type);
            meta.set('name', file.name);
            resolve(`${result.url}#${meta.toString()}`);
        }
        else reject(new Error(result.message));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file.'));
    reader.readAsDataURL(file);
  });
}

export const fetchUserQuiz = async (quizId: string): Promise<UserQuiz | null> => {
    try {
        const result = await getFromAppsScript('getUserQuiz', {
            quizId: quizId.trim(),
        });
        if (result.status === 'success' && result.quizData) {
            return result.quizData as UserQuiz;
        }
        console.error(result.message);
        return null;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const submitTestResult = async (
    quizId: string,
    participantName: string,
    score: number,
    totalQuestions: number,
    participantEmail: string,
    answers: { [key: number]: number }
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'submitTestResult',
            quizId: quizId,
            participantName: participantName,
            score: score,
            totalQuestions: totalQuestions,
            participantEmail: participantEmail,
            answers: answers,
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const fetchQuizzesByAuthor = async (authorEmail: string): Promise<UserQuiz[]> => {
    try {
        const result = await postToAppsScript({
            action: 'getQuizzesByAuthor',
            sheetId: '1Heb9lcC2PMS6xCT1tRuGS9fJmomqyQ1xCcyd7bq-gsQ',
            sheetName: 'Quizzes',
            authorEmail: authorEmail,
        });
        if (result.status === 'success' && Array.isArray(result.quizzes)) {
            return result.quizzes as UserQuiz[];
        }
        return [];
    } catch (error: any) {
        console.error(error.message);
        return [];
    }
};

const parseRawDataToQuiz = (raw: any): UserQuiz => {
    const isTruthy = (val: any): boolean => {
        if (typeof val === 'boolean') return val;
        if (val === undefined || val === null) return false;
        const lowerVal = String(val).trim().toLowerCase();
        return ['true', 'yes', 'có', '1'].includes(lowerVal);
    };

    let questions: CustomQuizQuestion[] = [];
    try {
        const parsed = JSON.parse(raw.Questions || '[]');
        if (Array.isArray(parsed)) {
            questions = parsed;
        }
    } catch (e) {
        console.error(`Failed to parse Questions for quiz ID ${raw.QuizID}:`, raw.Questions, e);
        questions = [];
    }

    let results: QuizResult[] = [];
    try {
        const parsed = JSON.parse(raw.Results || '[]');
        if (Array.isArray(parsed)) {
            results = parsed;
        }
    } catch (e) {
        console.error(`Failed to parse Results for quiz ID ${raw.QuizID}:`, raw.Results, e);
        results = [];
    }

    return {
        quizId: raw.QuizID || '',
        title: raw.Title || '',
        description: raw.Description || '',
        authorEmail: raw.AuthorEmail || '',
        questions: questions,
        results: results,
        isFree: isTruthy(raw.Free),
        oneAttemptOnly: isTruthy(raw.OneAttemptOnly),
        createdAt: raw.CreatedAt || '',
        price: parseInt(raw.Price || '0', 10),
        category: raw.Category || '',
        difficulty: raw.Difficulty || 'Trung bình',
        timeLimit: parseInt(raw.Time || raw.TimeLimit || '90', 10),
        attemptsCount: parseInt(raw.AttemptsCount || '0', 10),
    };
};

export const fetchAllQuizzes = async (): Promise<UserQuiz[]> => {
    try {
        const rawQuizzes = await fetchDataFromAppsScript<any>('Quizzes');
        if (!rawQuizzes) {
            return [];
        }
        return rawQuizzes.map(parseRawDataToQuiz);
    } catch (error: any) {
        console.error("Đã xảy ra lỗi khi tải tất cả các bài kiểm tra:", error.message);
        throw error;
    }
};

export const fetchFreeQuizzes = async (): Promise<UserQuiz[]> => {
    try {
        const rawQuizzes = await fetchDataFromAppsScript<any>('Quizzes');
        if (!rawQuizzes) {
            return [];
        }
        const allQuizzes = rawQuizzes.map(parseRawDataToQuiz);
        // Filter for quizzes that are free and have at least one question.
        const freeQuizzes = allQuizzes.filter(quiz => quiz.isFree && quiz.questions.length > 0);
        return freeQuizzes;
    } catch (error: any) {
        console.error("Đã xảy ra lỗi khi tải các bài kiểm tra miễn phí:", error.message);
        throw error;
    }
};

export const exportQuizToDoc = async (quizId: string): Promise<{ success: boolean; error?: string; docUrl?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'exportQuizToDoc',
            quizId: quizId,
        });
        if (result.status === 'success' && result.docUrl) {
            return { success: true, docUrl: result.docUrl };
        }
        return { success: false, error: result.message || 'Không thể xuất tài liệu.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const exportQuizResultsToSheet = async (quizId: string): Promise<{ success: boolean; error?: string; sheetUrl?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'exportQuizResultsToSheet',
            quizId: quizId,
        });
        if (result.status === 'success' && result.sheetUrl) {
            return { success: true, sheetUrl: result.sheetUrl };
        }
        return { success: false, error: result.message || 'Không thể xuất kết quả.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const updateCriterion = async (email: string, index: number, label: string, score: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateCriterion',
            email,
            index,
            label,
            score
        });
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const activateVoucher = async (email: string, code: string): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
    try {
        const result = await postToAppsScript({
            action: 'activateVoucher',
            email,
            code
        });
        return { success: result.status === 'success', error: result.message, newBalance: result.newBalance };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export async function uploadAvatar(
  email: string,
  imageFile: File
): Promise<string> {
  const compressed = await compressImage(imageFile, 1024, 0.8);
  const base64 = compressed.split(',')[1];

  const result = await postToAppsScript({
      action:      'uploadAvatar',
      email,
      imageBase64: base64,
      mimeType:    'image/jpeg',
      fileName:    `${email}_avatar.jpg`,
  });

  if (result.status !== 'success') throw new Error(result.message ?? 'Upload thất bại');
  return result.avatarUrl as string;
}

function compressImage(file: File, maxSize = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// --- SUBSCRIPTION / COMBO SERVICES ---

export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
    try {
        const rawPlans = await fetchDataFromAppsScript<any>('Subscriptions');
        return rawPlans
            .map((p: any) => ({
                ID: String(p['ID'] || '').trim(),
                Title: String(p['Title'] || '').trim(),
                Price: parseInt(String(p['Price'] || '0').replace(/,/g, ''), 10),
                Credits: parseInt(String(p['Credits'] || '0').replace(/,/g, ''), 10),
                Description: String(p['Description'] || '').trim(),
                Features: String(p['Features'] || '').split(',').map(f => f.trim()).filter(f => f),
                Color: String(p['Color'] || 'blue').trim(),
                Active: ['true', 'active', 'yes'].includes(
                    String(p['Active'] || '').trim().toLowerCase()
                ),
                Except: String(p['Except'] || '').trim(),
                ValidityDays: parseInt(String(p['ValidityDays'] || '0'), 10)
            }))
            .filter(p => p.Active && p.ID); // Chỉ lấy gói đang hoạt động
    } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
        return [];
    }
};

export const fetchUserSubscriptions = async (email: string): Promise<UserSubscription[]> => {
    try {
        // Không cache local lâu vì số dư credits thay đổi thường xuyên
        const rawSubs = await fetchDataFromAppsScript<any>('Subscription_Purchases', true); 
        return rawSubs
            .filter((s: any) => String(s['UserEmail'] || '').trim().toLowerCase() === email.toLowerCase().trim())
            .map((s: any) => ({
                PurchaseID: String(s['PurchaseID'] || '').trim(),
                UserEmail: String(s['UserEmail'] || '').trim(),
                PlanID: String(s['PlanID'] || '').trim(),
                PlanName: String(s['PlanName'] || '').trim(),
                TotalCredits: parseInt(String(s['TotalCredits'] || '0'), 10),
                RemainingCredits: parseInt(String(s['RemainingCredits'] || '0'), 10),
                PurchaseDate: String(s['PurchaseDate'] || '').trim(),
                ExpiryDate: String(s['ExpiryDate'] || '').trim(),
                Status: String(s['Status'] || 'Active').trim() as any,
            }));
    } catch (error) {
        console.error("Failed to fetch user subscriptions:", error);
        return [];
    }
};

export const buySubscription = async (email: string, planId: string): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
    try {
        // Hàm này gọi action 'buySubscription' bên GAS (Bạn cần implement bên GAS để trừ tiền và thêm dòng vào Subscription_Purchases)
        const result = await postToAppsScript({
            action: 'buySubscription',
            email,
            planId
        });
        
        return { success: result.status === 'success', error: result.message, newBalance: result.newBalance };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const useCreditForCourse = async (email: string, courseId: string): Promise<{ success: boolean; error?: string; }> => {
    try {
        // Hàm này gọi action 'useCreditForCourse' bên GAS
        const result = await postToAppsScript({
            action: 'useCreditForCourse',
            email,
            courseId
        });
        
        return { success: result.status === 'success', error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export interface PracticeQuestion {
    questionId: string;
    baiGiangID: string;
    section: string;
    questionText: string;
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    key: string;
    answer: string;
    videoUrl: string;
    date: string;
    type: 'MCQ' | 'TLN';
}

export async function fetchPracticeQuestionsWithMoon(
  baiGiangID: string
): Promise<PracticeQuestion[]> {
  try {
    // Thử lấy từ Moon API trước
    const res = await fetch(`/api/moon-question?id=${baiGiangID}`);
    if (res.ok) {
      const q = await res.json();
      return [q]; // Moon trả về 1 câu theo baiGiangID
    }
  } catch {
    console.warn('[Moon] Lỗi → fallback Google Sheet');
  }

  // Fallback về Google Sheet cũ
  return fetchPracticeQuestions(baiGiangID);
}

export const fetchPracticeQuestions = async (baiGiangID: string): Promise<PracticeQuestion[]> => {
    try {
        const [mcqRaw, tlnRaw] = await Promise.all([
            fetchDataFromAppsScript<any>('Questions_ABCD'),
            fetchDataFromAppsScript<any>('Questions_TLN')
        ]);

        const mcq: PracticeQuestion[] = mcqRaw
            .filter(q => String(q.baiGiangID) === String(baiGiangID))
            .map(q => ({
                questionId: String(q.questionId || ''),
                baiGiangID: String(q.baiGiangID || ''),
                section: String(q.section || ''),
                questionText: String(q.questionText || ''),
                A: String(q.A || ''),
                B: String(q.B || ''),
                C: String(q.C || ''),
                D: String(q.D || ''),
                key: String(q.key || ''),
                answer: String(q.answer || ''),
                videoUrl: String(q.videoUrl || ''),
                date: String(q.date || ''),
                type: 'MCQ'
            }));

        const tln: PracticeQuestion[] = tlnRaw
            .filter(q => String(q.baiGiangID) === String(baiGiangID))
            .map(q => ({
                questionId: String(q.questionId || ''),
                baiGiangID: String(q.baiGiangID || ''),
                section: String(q.section || ''),
                questionText: String(q.questionText || ''),
                key: String(q.key || ''),
                answer: String(q.answer || ''),
                videoUrl: String(q.videoUrl || ''),
                date: String(q.date || ''),
                type: 'TLN'
            }));

        return [...mcq, ...tln].sort((a, b) => {
            // Ưu tiên sắp xếp theo số của ID câu hỏi
            const numA = parseInt(a.questionId, 10);
            const numB = parseInt(b.questionId, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.questionId.localeCompare(b.questionId);
        });
    } catch (error) {
        console.error("Failed to fetch practice questions:", error);
        return [];
    }
};

export const searchPracticeQuestions = async (keyword: string): Promise<PracticeQuestion[]> => {
    try {
        const [mcqRaw, tlnRaw] = await Promise.all([
            fetchDataFromAppsScript<any>('Questions_ABCD'),
            fetchDataFromAppsScript<any>('Questions_TLN')
        ]);
        
        const kw = keyword.toLowerCase().trim();
        const match = (q: any) => 
            String(q.questionText || '').toLowerCase().includes(kw) ||
            String(q.baiGiangID || '').toLowerCase().includes(kw);

        const mcq: PracticeQuestion[] = mcqRaw.filter(match).map((q: any) => ({
            questionId: String(q.questionId || ''),
            baiGiangID: String(q.baiGiangID || ''),
            section: String(q.section || ''),
            questionText: String(q.questionText || ''),
            A: String(q.A || ''),
            B: String(q.B || ''),
            C: String(q.C || ''),
            D: String(q.D || ''),
            key: String(q.key || ''),
            answer: String(q.answer || ''),
            videoUrl: String(q.videoUrl || ''),
            date: String(q.date || ''),
            type: 'MCQ'
        }));

        const tln: PracticeQuestion[] = tlnRaw.filter(match).map((q: any) => ({
            questionId: String(q.questionId || ''),
            baiGiangID: String(q.baiGiangID || ''),
            section: String(q.section || ''),
            questionText: String(q.questionText || ''),
            key: String(q.key || ''),
            answer: String(q.answer || ''),
            videoUrl: String(q.videoUrl || ''),
            date: String(q.date || ''),
            type: 'TLN'
        }));

        return [...mcq, ...tln].slice(0, 50); // Giới hạn 50 kết quả để tránh lag
    } catch (error) {
        console.error("Failed to search practice questions:", error);
        return [];
    }
};

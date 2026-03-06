import type { AnatomyQuestion, MedicalQuestion, Account, DocumentData, AnyQuestion, ScientificArticle, ForumPost, ForumComment, CustomQuizQuestion, UserQuiz, Classroom, ClassMember, AssignedQuiz, ScheduleEvent, QuizResult, NewStudentCredential, Course, Book } from '../types';

// This is the correct, user-provided Google Apps Script URL.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtbZ4cjQbvCb9cpffo8LQtB-WKqPAr8rDgUAgSpK5ZELFXgLkuWb7QcXLNy_BZzu-0/exec'; // ⚠️ HÃY THAY URL MỚI VỪA DEPLOY VÀO ĐÂY

// --- CONFIG ---
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_LOCAL_CACHE = 4_000_000; // 4MB limit for local storage
const MAX_MEMORY_CACHE = 50; // Max items in memory

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

// --- LOCAL STORAGE CACHE ---
function setLocalCache(key: string, data: any) {
  const cacheKey = `edifyx_cache_${key}`;
  const compressedData = compress(data);

  // Thêm bước kiểm tra kích thước trước khi lưu để tránh lỗi
  if (compressedData.length > MAX_LOCAL_CACHE) {
    console.warn(`Data for ${key} is too large for local cache (${(compressedData.length / 1024).toFixed(1)}KB). Skipping.`);
  }

  try {
    localStorage.setItem(cacheKey, compressedData);
  } catch (e) {
    console.warn('LocalStorage full, clearing old cache...', e);
    
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('edifyx_cache_')) keysToDelete.push(k);
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
    try {
      localStorage.setItem(cacheKey, compressedData);
    } catch {
      console.warn(`Still full after clearing. Skipping local cache for: ${key}`);
    }
  }
}

function getLocalCache<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(`edifyx_cache_${key}`);
    return item ? decompress(item) : null;
  } catch { return null; }
}

// --- REQUEST DEDUPE ---
const pendingRequests = new Map<string, Promise<any>>();

// --- CORE REQUEST ---
const postToAppsScript = async (payload: Record<string, any>, retries = 2, timeout = 15000): Promise<any> => {
  const key = JSON.stringify(payload);
  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  const request = (async () => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: 'follow', // ✅ Quan trọng: Tự động follow redirect của Google Apps Script
      });
      clearTimeout(id);

      const text = await response.text();
      if (!text) throw new Error('Empty response');

      let result;
      try { result = JSON.parse(text); } catch { throw new Error('Invalid JSON'); }

      if (result.status === 'error') return result;
      if (!response.ok) throw new Error(`Server error ${response.status}`);

      return result;
    } catch (error: any) {
      if (retries > 0 && (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        await new Promise(r => setTimeout(r, 1200));
        return postToAppsScript(payload, retries - 1, timeout);
      }
      throw error;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, request);
  return request;
};

// --- REVALIDATION TRACKER ---
const revalidationRequests = new Map<string, Promise<any>>();

// --- GENERIC FETCH (CACHE + SWR) ---
const fetchDataFromAppsScript = async <T>(
  sheetName: string,
  ignoreCache: boolean = false,
  skipLocalCache: boolean = false  // ← thêm tham số mới
): Promise<T[]> => {
  const cacheKey = `post:${sheetName}`;
  let cached = getMemoryCache<T[]>(cacheKey);

  if (!cached && !ignoreCache && !skipLocalCache) {  // ← thêm điều kiện
    cached = getLocalCache<T[]>(cacheKey);
    if (cached) setMemoryCache(cacheKey, cached);
  }

  if (cached && !ignoreCache) {
    const stale = Date.now() - cached.timestamp > CACHE_DURATION;
    if (stale && !revalidationRequests.has(cacheKey)) {
      const p = postToAppsScript({ action: 'getSheetData', sheetName })
        .then(res => {
          if (res.status === 'success' && Array.isArray(res.data)) {
            const entry = { data: res.data, timestamp: Date.now() };
            setMemoryCache(cacheKey, entry);
            if (!skipLocalCache) setLocalCache(cacheKey, entry);  // ← thêm điều kiện
          }
        })
        .finally(() => revalidationRequests.delete(cacheKey));
      revalidationRequests.set(cacheKey, p);
    }
    return cached.data;
  }

  const result = await postToAppsScript({ action: 'getSheetData', sheetName });
  if (result.status === 'success' && Array.isArray(result.data)) {
    const entry = { data: result.data, timestamp: Date.now() };
    setMemoryCache(cacheKey, entry);
    if (!skipLocalCache) setLocalCache(cacheKey, entry);  // ← thêm điều kiện
    return result.data as T[];
  }
  throw new Error(result.message || `Failed to fetch sheet: ${sheetName}`);
};

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
  if (typeof window === 'undefined') return;
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith('edifyx_cache_')) return;
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const entry = decompress(item);
        if (entry && Date.now() - entry.timestamp > CACHE_DURATION * 5) localStorage.removeItem(key);
      }
    } catch {}
  });
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
    const result = await postToAppsScript({
      action: 'getAccountByEmail',
      email,
    });

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
        'Thông tin mô tả': String(acc['Thông tin mô tả'] || '').trim(),
        'Môn học': String(acc['Môn học'] || '').trim(),
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


// --- Classroom Services ---
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
        const result = await postToAppsScript({
            action: 'getClassesForUser',
            email
        });
        return result.classes || [];
    } catch (error) {
        console.error("Failed to fetch user classes:", error);
        return [];
    }
};

export const getClassDetails = async (classId: string): Promise<{ info: Classroom; members: ClassMember[]; quizzes: AssignedQuiz[] } | null> => {
    try {
        const result = await postToAppsScript({
            action: 'getClassDetails',
            classId,
        });
        return result.details || null;
    } catch (error) {
        console.error("Failed to fetch class details:", error);
        return null;
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

export const getScheduleForUser = async (email: string): Promise<ScheduleEvent[]> => {
    try {
        const result = await postToAppsScript({
            action: 'getScheduleForUser',
            email,
        });
        return result.schedule || [];
    } catch (error) {
        console.error("Failed to fetch user schedule:", error);
        return [];
    }
};

export const fetchPurchasedCategories = async (email: string): Promise<{ CategoryName: string; PurchaseDate: string }[]> => {
  try {
    // Thay vì gọi action riêng, ta lấy trực tiếp dữ liệu từ sheet Purchases và lọc tại client
    // Điều này đảm bảo lấy được cột PurchaseDate chính xác như trong sheet
    const rawPurchases = await fetchDataFromAppsScript<any>('Purchases');

    if (Array.isArray(rawPurchases)) {
      const normalizedEmail = email.trim().toLowerCase();
      return rawPurchases
        .filter((p: any) => String(p.UserEmail || '').trim().toLowerCase() === normalizedEmail)
        .map((p: any) => ({
          CategoryName: String(p.CategoryName || '').trim(),
          PurchaseDate: String(p.PurchaseDate || p.Timestamp || '').trim(),
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch purchased categories:', error);
    return [];
  }
};

export const fetchPurchaseStats = async (): Promise<Record<string, number>> => {
    try {
        const rawPurchases = await fetchDataFromAppsScript<any>('Purchases');
        if (!Array.isArray(rawPurchases)) {
            return {};
        }
        
        const categoryUsers: Record<string, Set<string>> = {};

        rawPurchases.forEach((p: any) => {
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

export const purchasePremiumCategory = async (userEmail: string, categoryName: string): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'purchasePremiumCategory',
            userEmail,
            categoryName,
        });
        if (result.status === 'success') {
            return { success: true, newBalance: result.newBalance };
        }
        return { success: false, error: result.message };
    } catch (error: any) {
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


// --- Other Services ---
const isValidMedicalQuestion = (q: MedicalQuestion): boolean => {
return !!(
    q.ID &&
    q.Question_Text &&
    q.Option_A &&
    q.Option_B &&
    q.Option_C &&
    q.Option_D &&
    q.Correct_Answer
);
};

export const fetchAnatomyQuestions = async (): Promise<AnatomyQuestion[]> => {
const questions = await fetchDataFromAppsScript<AnatomyQuestion>('Questions_Anatomy');
return questions.filter(q => q.ID && q.Question_Text && q.Image_URL && q.Correct_Coordinates);
};

export const fetchPharmacyQuestions = async (): Promise<MedicalQuestion[]> => {
const questions = await fetchDataFromAppsScript<MedicalQuestion>('Questions_Pharmacy');
return questions.filter(isValidMedicalQuestion).map(q => ({...q, Specialty: 'Dược học'}));
};

export const fetchMedicineQuestions = async (): Promise<MedicalQuestion[]> => {
const questions = await fetchDataFromAppsScript<MedicalQuestion>('Questions_Medicine');
return questions.filter(isValidMedicalQuestion).map(q => ({...q, Specialty: 'Y đa khoa'}));
};

const mapRawQuestionToMedicalQuestion = (raw: any): MedicalQuestion => ({
    ID: raw.STT || raw.ID || Math.random().toString(36).substring(7),
    Question_Text: raw.Question || '',
    Option_A: raw.A || '',
    Option_B: raw.B || '',
    Option_C: raw.C || '',
    Option_D: raw.D || '',
    Correct_Answer: (raw.Correct || '').trim() as 'A' | 'B' | 'C' | 'D',
    Explanation: raw.Solution || '',
    Paragraph: raw.Paragraph || undefined,
    GroupID: raw.GroupID || undefined,
    Image_URL: raw.Image_URL || undefined,
});

export const fetchMathQuestions = async (): Promise<MedicalQuestion[]> => {
const rawQuestions = await fetchDataFromAppsScript<any>('Toán');
return rawQuestions.map(mapRawQuestionToMedicalQuestion).filter(isValidMedicalQuestion);
};

export const fetchLiteratureQuestions = async (): Promise<MedicalQuestion[]> => {
const rawQuestions = await fetchDataFromAppsScript<any>('NguVan');
return rawQuestions.map(mapRawQuestionToMedicalQuestion).filter(isValidMedicalQuestion);
};

const fetchEnglishQuestionsFromSheet = async (): Promise<MedicalQuestion[]> => {
    const questionsRaw = await fetchDataFromAppsScript<MedicalQuestion>('Questions_English');
    return questionsRaw.filter(isValidMedicalQuestion).map(q => ({...q, Specialty: 'Tiếng Anh'}));
};

const fetchEnglishReadingQuestionsFromSheet = async (): Promise<MedicalQuestion[]> => {
    const questionsRaw = await fetchDataFromAppsScript<MedicalQuestion>('Questions_English_Reading');
    return questionsRaw.filter(isValidMedicalQuestion).map(q => ({...q, Specialty: 'Reading'}));
};

export const fetchVocabularyMCQ = async (): Promise<MedicalQuestion[]> => {
    const questions = await fetchDataFromAppsScript<MedicalQuestion>('Vocabulary');
    return questions.filter(isValidMedicalQuestion).map(q => ({...q, Specialty: 'Từ vựng'}));
};

export const fetchQuizQuestions = async (subject: string, config?: { questions: number }): Promise<MedicalQuestion[]> => {
    let allQuestions: MedicalQuestion[] = [];

    const subjectKeyMap: { [key: string]: string[] } = {
        'toan': ['toán', 'toán học'],
        'hoa': ['hóa học', 'dược học', 'hóa'],
        'sinh': ['sinh học', 'y đa khoa', 'sinh'],
        'van': ['ngữ văn', 'văn'],
        'anh': ['tiếng anh', 'reading', 'anh'],
        'ly': ['vật lý', 'lý'],
        'su': ['lịch sử', 'sử'],
        'dia': ['địa lý', 'địa'],
        'gdcd': ['giáo dục công dân', 'gdcd'],
        'vocabulary': ['từ vựng'],
    };

    const targetSubjects = subjectKeyMap[subject.toLowerCase()] || [];

    // 1. Fetch from new unified bank
    let questionsFromBank: MedicalQuestion[] = [];
    try {
        const bankQuestionsRaw = await fetchDataFromAppsScript<any>('Questions_Banks');
        const bankQuestions = bankQuestionsRaw
            .map(mapBankQuestionToMedicalQuestion)
            .filter(isValidMedicalQuestion);

        if (targetSubjects.length > 0) {
            questionsFromBank = bankQuestions.filter(q => 
                targetSubjects.some(s => (q.Specialty || '').trim().toLowerCase().includes(s))
            );
        }
    } catch (e) {
        console.error("Could not fetch from Questions_Banks, will use fallbacks.", e);
    }
    
    // 2. Fetch from old sheets for backward compatibility
    let questionsFromOldSheets: MedicalQuestion[] = [];
    switch (subject.toLowerCase()) {
        case 'anh':
            const [grammarQuestions, readingQuestions] = await Promise.all([
                fetchEnglishQuestionsFromSheet(),
                fetchEnglishReadingQuestionsFromSheet(),
            ]);
            questionsFromOldSheets = [...grammarQuestions, ...readingQuestions];
            break;
        case 'hoa':
            questionsFromOldSheets = await fetchPharmacyQuestions();
            break;
        case 'sinh':
            questionsFromOldSheets = await fetchMedicineQuestions();
            break;
        case 'van':
            questionsFromOldSheets = await fetchLiteratureQuestions();
            break;
        case 'vocabulary':
            questionsFromOldSheets = await fetchVocabularyMCQ();
            break;
        default:
            // No specific old sheet for this subject key
            break;
    }

    // 3. Combine and deduplicate
    const combinedQuestions = [...questionsFromBank, ...questionsFromOldSheets];
    const uniqueQuestions = Array.from(new Map(combinedQuestions.map(q => [q.Question_Text, q])).values());
    allQuestions = uniqueQuestions;
    
    if (config) {
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(config.questions, allQuestions.length));
    }
    
    return allQuestions;
};

export const fetchAllQuestionsFromBank = async (): Promise<MedicalQuestion[]> => {
    try {
        const bankQuestionsRaw = await fetchDataFromAppsScript<any>('Questions_Banks');
        return bankQuestionsRaw
            .map(mapBankQuestionToMedicalQuestion)
            .filter(isValidMedicalQuestion);
    } catch (e) {
        console.error("Failed to fetch all questions from bank", e);
        return [];
    }
};


export const fetchAllQuestions = async (): Promise<AnyQuestion[]> => {
try {
    const [anatomy, medicine, pharmacy] = await Promise.all([
    fetchDataFromAppsScript<AnatomyQuestion>('Questions_Anatomy'),
    fetchDataFromAppsScript<MedicalQuestion>('Questions_Medicine'),
    fetchDataFromAppsScript<MedicalQuestion>('Questions_Pharmacy'),
    ]);

    const anatomyQuestions: AnyQuestion[] = anatomy
        .filter(q => q.ID && q.Question_Text && q.Image_URL && q.Correct_Coordinates)
        .map(q => ({ ...q, type: 'Anatomy' }));
    const medicineQuestions: AnyQuestion[] = medicine.filter(isValidMedicalQuestion).map(q => ({ ...q, type: 'Medicine' }));
    const pharmacyQuestions: AnyQuestion[] = pharmacy.filter(isValidMedicalQuestion).map(q => ({ ...q, type: 'Pharmacy' }));
    
    return [...anatomyQuestions, ...medicineQuestions, ...pharmacyQuestions];
} catch (error) {
    console.error("Failed to fetch all questions:", error);
    throw new Error("Could not load all question types.");
}
};

export const fetchAllMCQQuestions = async (): Promise<MedicalQuestion[]> => {
    try {
        // Primary source is the new unified question bank
        const bankQuestionsRaw = await fetchDataFromAppsScript<any>('Questions_Banks');
        const bankQuestions = bankQuestionsRaw.map(mapBankQuestionToMedicalQuestion).filter(isValidMedicalQuestion);
        
        // For backwards compatibility and subjects not yet migrated, fetch from old sheets.
        const [medicine, pharmacy, english, englishReading, vocabulary] = await Promise.all([
            fetchMedicineQuestions(),
            fetchPharmacyQuestions(),
            fetchEnglishQuestionsFromSheet(),
            fetchEnglishReadingQuestionsFromSheet(),
            fetchVocabularyMCQ()
        ]);
        
        const allQuestions = [
            ...bankQuestions,
            ...medicine,
            ...pharmacy,
            ...english,
            ...englishReading,
            ...vocabulary,
        ];
        
        // Create a unique set based on Question_Text to avoid duplicates
        const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.Question_Text, q])).values());

        return uniqueQuestions;
    } catch (error) {
        console.error("Failed to fetch all MCQ questions:", error);
        throw new Error("Could not load all MCQ question types.");
    }
};

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

export const fetchPublications = async (): Promise<DocumentData[]> => {
const rawDocs = await fetchDataFromAppsScript<any>('Publications');
return rawDocs.map((doc: any) => ({
    title: doc.title || '',
    author: doc.author || '',
    category: doc.category || '', // In Publications.tsx, this is used as 'Vinh danh'
    pages: parseInt(doc.pages || '0', 10),
    imageUrl: doc.imageUrl || '',
    documentUrl: doc.documentUrl || '',
    uploader: doc.uploader || '',
    uploadDate: doc.uploadDate || '',
}));
};

export const fetchAccounts = async (): Promise<Account[]> => {
const rawAccounts = await fetchDataFromAppsScript<any>('Accounts'); 
return rawAccounts.map((acc: any) => ({
    'Tên tài khoản': String(acc['Tên tài khoản'] || '').trim(),
    'Email': String(acc['Email'] || '').trim(),
    'Mật khẩu': String(acc['Mật khẩu'] || ''), // Do not trim passwords
    'Gói đăng ký': String(acc['Gói đăng ký'] || '').trim(),
    'Danh hiệu': String(acc['Danh hiệu'] || '').trim(),
    'Đã xác minh': String(acc['Đã xác minh'] || '').trim(),
    'Vai trò': String(acc['Vai trò'] || '').trim() as 'Sinh viên' | 'Nhà nghiên cứu tự do' | 'Học sinh' | 'Nhà báo (nhà tuyển dụng)',
    'Đặc biệt': String(acc['Đặc biệt'] || '').trim(),
    'Phái': String(acc['Phái'] || '').trim() as 'Chính Đạo' | 'Tà Đạo',
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
    'Thông tin mô tả': String(acc['Thông tin mô tả'] || '').trim(),
    'Môn học': String(acc['Môn học'] || '').trim(),
    'Owned': String(acc['Owned'] || '').trim(),
    'Goal': String(acc['Goal'] || '').trim(),
    'Voucher': String(acc['Voucher'] || '').trim(),
    'Tiêu chí 1': acc['Tiêu chí 1'] ?? null,
    'Tiêu chí 2': acc['Tiêu chí 2'] ?? null,
    'Tiêu chí 3': acc['Tiêu chí 3'] ?? null,
    'Tiêu chí 4': acc['Tiêu chí 4'] ?? null,
    'Tiêu chí 5': acc['Tiêu chí 5'] ?? null,
    'Tiêu chí 6': acc['Tiêu chí 6'] ?? null,
}));
};

export const fetchArticles = async (): Promise<ScientificArticle[]> => {
    // Bỏ qua localStorage cho sheet này vì dữ liệu rất lớn, chỉ dùng memory cache.
    const rawArticles = await fetchDataFromAppsScript<any>('Research_Accounts', false, true);
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
        Status: String(art['Pending'] || 'Pending').trim(), 
        Feedback: String(art['Feedback'] || '').trim(),
    };
    });
};

export const fetchPremiumArticles = async (): Promise<ScientificArticle[]> => {
    const rawArticles = await fetchDataFromAppsScript<any>('Premium');
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
        };
    });
};


export const fetchCourses = async (): Promise<Course[]> => {
    try {
        const rawCourses = await fetchDataFromAppsScript<any>('Courses');
        console.log('Raw Courses Data:', rawCourses); // Debugging log
        
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

export const fetchForumPosts = async (ignoreCache: boolean = false): Promise<ForumPost[]> => {
const rawPosts = await fetchDataFromAppsScript<any>('Forum_Posts', ignoreCache);
return rawPosts.map((p: any) => ({
    ID: String(p.ID || '').trim(),
    Title: String(p.Title || '').trim(),
    Content: String(p.Content || '').trim(),
    AuthorEmail: String(p.AuthorEmail || '').trim(),
    AuthorName: String(p.AuthorName || '').trim(),
    Channel: String(p.Channel || '').trim(),
    Timestamp: String(p.Timestamp || p.TimeStamp || '').trim(),
    Upvotes: String(p.Upvotes || '').trim(),
    UpvotedBy: String(p.UpvotedBy || '').trim(),
}));
};

export const fetchForumComments = async (ignoreCache: boolean = false): Promise<ForumComment[]> => {
const rawComments = await fetchDataFromAppsScript<any>('Forum_Comments', ignoreCache);
return rawComments.map((c: any) => ({
    ID: String(c.ID || '').trim(),
    PostID: String(c.PostID || '').trim(),
    ParentID: String(c.ParentID || '').trim(),
    Content: String(c.Content || '').trim(),
    AuthorEmail: String(c.AuthorEmail || '').trim(),
    AuthorName: String(c.AuthorName || '').trim(),
    Timestamp: String(c.Timestamp || c.TimeStamp || '').trim(),
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
        const rawBooks = await fetchDataFromAppsScript<any>('Books');
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
    articleData: Omit<ScientificArticle, 'ID' | 'SM_DOI' | 'SubmissionDate' | 'SubmitterEmail' | 'Status' | 'Feedback'>,
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
            return { success: true, newId: result.newId };
        }
        return { success: false, error: result.message || 'An unknown error occurred while adding the article.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const addForumPost = async (postData: Omit<ForumPost, 'ID' | 'Timestamp' | 'Upvotes' | 'UpvotedBy'>): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'addForumPost',
            ...postData
        });
        return result.status === 'success' ? { success: true } : { success: false, error: result.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const addForumComment = async (commentData: Omit<ForumComment, 'ID' | 'Timestamp'>): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'addForumComment',
            ...commentData
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

export const fetchUserQuiz = async (quizId: string): Promise<UserQuiz | null> => {
    try {
        const result = await postToAppsScript({
            action: 'getUserQuiz',
            quizId: quizId,
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

export const purchaseCourse = async (email: string, courseId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await postToAppsScript({
            action: 'updateOwnedCourses',
            email: email,
            courseId: courseId
        });
        return { success: result.status === 'success', error: result.message };
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
  const compressed = await compressImage(imageFile, 400, 0.8);
  const base64 = compressed.split(',')[1];

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action:      'uploadAvatar',
      email,
      imageBase64: base64,
      mimeType:    'image/jpeg',
      fileName:    `${email}_avatar.jpg`,
    }),
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const result = await res.json();
  if (result.status !== 'success') throw new Error(result.message ?? 'Upload thất bại');
  return result.avatarUrl as string;
}

function compressImage(file: File, maxSize = 400, quality = 0.8): Promise<string> {
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

// src/services/moonApiService.ts
// ⚠️ CHỈ chạy trên server - KHÔNG import vào 'use client'

const IDENTITY_URL = 'https://identity.moon.vn/api/user/login';
const COURSE_API = 'https://courseapi.moon.vn/api/Course';

// Cache token riêng cho từng tài khoản
let _tokenCaches: Array<{ token: string; expireAt: number } | null> = [null, null];

// ─── NETLIFY BLOBS ────────────────────────────────────────
async function readTokenFromBlobs(index: number): Promise<string | null> {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('moon-cache');
    const raw = await store.get(`token_${index}`, { type: 'text' });
    if (!raw) return null;
    const parsed = JSON.parse(raw as string);
    if (Date.now() > parsed.expireAt) {
      console.log(`[Moon/Blobs] Token ${index} đã hết hạn`);
      return null;
    }
    console.log(`[Moon/Blobs] Lấy token ${index} từ Blobs thành công`);
    return parsed.token;
  } catch {
    return null;
  }
}

async function saveTokenToBlobs(index: number, token: string, expireAt: number) {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('moon-cache');
    await store.set(`token_${index}`, JSON.stringify({ token, expireAt }));
    console.log(`[Moon/Blobs] Đã lưu token ${index} vào Blobs`);
  } catch {
    // bỏ qua nếu local dev
  }
}

// ─── LOGIN 1 TÀI KHOẢN ───────────────────────────────────
async function loginAccount(index: number): Promise<string | null> {
  const accounts = [
    { user: process.env.MOON_USERNAME,   pass: process.env.MOON_PASSWORD },
    { user: process.env.MOON_USERNAME_2, pass: process.env.MOON_PASSWORD_2 },
  ];

  const account = accounts[index];
  if (!account?.user || !account?.pass) {
    console.log(`[Moon/Login] Tài khoản ${index + 1} chưa cấu hình`);
    return null;
  }

  try {
    console.log(`[Moon/Login] Đăng nhập tài khoản ${index + 1}:`, account.user);
    const res = await fetch(IDENTITY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: account.user, password: account.pass, rememberMe: true }),
    });

    if (!res.ok) {
      console.warn(`[Moon/Login] Tài khoản ${index + 1} HTTP`, res.status);
      return null;
    }

    const data = await res.json();
    const token: string =
      data.token || data.accessToken || data.access_token ||
      data.data?.token || data.data?.accessToken || data.result?.token;

    if (!token) {
      console.warn(`[Moon/Login] Tài khoản ${index + 1} không có token`);
      return null;
    }

    const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const expireAt = Date.now() + 6 * 60 * 60 * 1000;
    _tokenCaches[index] = { token: bearerToken, expireAt };
    await saveTokenToBlobs(index, bearerToken, expireAt);

    console.log(`[Moon/Login] ✅ Tài khoản ${index + 1} OK`);
    return bearerToken;
  } catch (err) {
    console.warn(`[Moon/Login] Tài khoản ${index + 1} lỗi:`, err);
    return null;
  }
}

// ─── LẤY TOKEN THEO INDEX ────────────────────────────────
async function getToken(index: number): Promise<string | null> {
  // 1. In-memory
  const cached = _tokenCaches[index];
  if (cached && Date.now() < cached.expireAt) {
    return cached.token;
  }

  // 2. Blobs
  const blobToken = await readTokenFromBlobs(index);
  if (blobToken) {
    _tokenCaches[index] = { token: blobToken, expireAt: Date.now() + 60 * 60 * 1000 };
    return blobToken;
  }

  // 3. Re-login
  return await loginAccount(index);
}

// ─── STRIP HTML ───────────────────────────────────────────
function stripHTML(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<img[^>]*src\s*=\s*["']?\s*(https?:\/\/[^\s"'>]+)\s*["']?[^>]*>/gi, '[IMG:$1]')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── MAP SANG PRACTICE QUESTION ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuestion(q: any, baiGiangID: string) {
  return {
    questionId:   String(q.questionId),
    baiGiangID:   baiGiangID,
    type:         q.typeID === 0 ? 'MCQ' : 'SHORT_ANSWER',
    section:      stripHTML(q.titleEnglish),
    questionText: stripHTML(q.questionText),
    A:            stripHTML(q.a),
    B:            stripHTML(q.b),
    C:            stripHTML(q.c),
    D:            stripHTML(q.d),
    key:          q.key?.trim() || '',
    answer:       stripHTML(q.answer),
    videoUrl:     q.listTikTokVideoModel?.[0]?.urlVideo || '',
  };
}

// ─── GỌI API VỚI 1 TOKEN ─────────────────────────────────
async function tryFetchWithToken(baiGiangID: string, token: string) {
  console.log('[Moon/API] SearchID:', baiGiangID);
  const searchRes = await fetch(`${COURSE_API}/SearchID/${baiGiangID}`, {
    headers: { Accept: 'application/json', Authorization: token },
  });
  console.log('[Moon/API] SearchID status:', searchRes.status);

  if (searchRes.status === 401) throw new Error('401');
  if (!searchRes.ok) throw new Error(`SearchID HTTP ${searchRes.status}`);

  const search = await searchRes.json();
  console.log('[Moon/API] isSuccessful:', search.isSuccessful, '| id:', search.id);

  if (!search?.isSuccessful) return null; // bài giảng này tài khoản không có

  console.log('[Moon/API] ItemQuestion:', search.id);
  const qRes = await fetch(`${COURSE_API}/ItemQuestion/${String(search.id)}`, {
    headers: { Accept: 'application/json', Authorization: token },
  });
  console.log('[Moon/API] ItemQuestion status:', qRes.status);

  if (qRes.status === 401) throw new Error('401');
  if (!qRes.ok) throw new Error(`ItemQuestion HTTP ${qRes.status}`);

  const q = await qRes.json();
  console.log('[Moon/API] typeID:', q.typeID, '| key:', q.key);

  if (!q || (!q.questionText && !q.key?.trim())) return null;
  return mapQuestion(q, baiGiangID);
}

// ─── PUBLIC ───────────────────────────────────────────────
export async function fetchQuestionFromMoon(baiGiangID: string) {
  console.log('\n[Moon] ═══ fetchQuestionFromMoon START:', baiGiangID, '═══');

  const accountCount = 2;

  for (let i = 0; i < accountCount; i++) {
    console.log(`[Moon] Thử tài khoản ${i + 1}...`);

    let token = await getToken(i);
    if (!token) {
      console.log(`[Moon] Tài khoản ${i + 1} không có token, bỏ qua`);
      continue;
    }

    try {
      const result = await tryFetchWithToken(baiGiangID, token);

      if (result) {
        console.log(`[Moon] ✅ Tài khoản ${i + 1} tìm thấy câu hỏi`);
        console.log('[Moon] ═══ END ═══\n');
        return result;
      }

      // isSuccessful = false → tài khoản này không có bài giảng → thử tài khoản tiếp
      console.log(`[Moon] Tài khoản ${i + 1} không có bài giảng ${baiGiangID}, thử tiếp...`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('401')) {
        // Token hết hạn → re-login rồi thử lại 1 lần
        console.log(`[Moon] Tài khoản ${i + 1} 401 → re-login...`);
        _tokenCaches[i] = null;
        token = await loginAccount(i);
        if (!token) continue;

        try {
          const result = await tryFetchWithToken(baiGiangID, token);
          if (result) {
            console.log(`[Moon] ✅ Tài khoản ${i + 1} retry thành công`);
            return result;
          }
        } catch {
          console.warn(`[Moon] Tài khoản ${i + 1} retry thất bại`);
        }
        continue;
      }

      console.warn(`[Moon] Tài khoản ${i + 1} lỗi:`, msg);
    }
  }

  console.log('[Moon] ⚠️ Không tài khoản nào tìm thấy câu hỏi:', baiGiangID);
  console.log('[Moon] ═══ END ═══\n');
  return null;
}
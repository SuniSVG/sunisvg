'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAccounts, updateCriterion } from '@/services/googleSheetService';

// ============================================================
// CONSTANTS
// ============================================================
const SUBJECT_OPTIONS = [
  'Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh',
  'Sử', 'Địa', 'GDCD', 'Tin học', 'Thể dục', 'Tiến bộ', 'Thời gian',
];

const SUBJECT_PREFIX_MAP: Record<string, string> = {
  'Toán': '99999991',
  'Văn': '99999992',
  'Anh': '99999993',
  'Hóa': '99999994',
  'Sinh': '99999995',
  'Sử': '99999996',
  'Địa': '99999997',
  'Lý': '99999998',
};

const DEFAULT_LABELS: { label: string; desc: string }[] = [
  { label: 'Tiêu chí 1', desc: 'Chưa đặt tên.' },
  { label: 'Tiêu chí 2', desc: 'Chưa đặt tên.' },
  { label: 'Tiêu chí 3', desc: 'Chưa đặt tên.' },
  { label: 'Tiêu chí 4', desc: 'Chưa đặt tên.' },
  { label: 'Tiêu chí 5', desc: 'Chưa đặt tên.' },
  { label: 'Tiêu chí 6', desc: 'Chưa đặt tên.' },
];

interface RadarItem {
  label: string;
  value: number | null;
  desc: string;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Parse ô Tiêu chí có format "[Toán, 60]" → { label: "Toán", value: 60 }
 * Nếu ô trống hoặc không đúng format → { label: null, value: null }
 */
const parseTieuChi = (raw: unknown): { label: string | null; value: number | null } => {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { label: null, value: null };
  }
  let str = String(raw).trim();

  if (str.startsWith('[') && str.endsWith(']')) {
    str = str.slice(1, -1).trim();
  }

  let label: string | null = null;
  let valStr = '';

  const match = str.match(/^(.*?)[\s,;:-]+(\d+(?:\.\d+)?)$/);

  if (match) {
    label = match[1].trim() || null;
    valStr = match[2];
  } else if (/^\d+(?:\.\d+)?$/.test(str)) {
    valStr = str;
  } else {
    const lastNum = str.match(/(\d+(?:\.\d+)?)$/);
    if (lastNum) {
      valStr = lastNum[1];
      label = str.substring(0, str.lastIndexOf(valStr)).trim().replace(/[\s,;:-]+$/, '') || null;
    } else {
      return { label: str, value: null };
    }
  }

  const n = parseFloat(valStr);
  let value: number | null = null;
  if (!isNaN(n)) {
    if (n === 0)        value = 0;
    else if (n <= 10)   value = Math.round(n * 10);
    else                value = Math.min(100, Math.round(n));
  }

  return { label, value };
};

const normalizeKey = (key: string) =>
  key.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const getField = (obj: Record<string, unknown>, fieldName: string): unknown => {
  if (!obj) return undefined;
  if (obj[fieldName] !== undefined) return obj[fieldName];
  const target = normalizeKey(fieldName);
  for (const key of Object.keys(obj)) {
    if (normalizeKey(key) === target) return obj[key];
  }
  return undefined;
};

const LABEL_KEY = (email: string) => `radar_labels_${email}`;

const loadLabels = (email: string): { label: string; desc: string }[] | null => {
  try {
    const raw = localStorage.getItem(LABEL_KEY(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 6 ? parsed : null;
  } catch {
    return null;
  }
};

const saveLabelsLocal = (email: string, items: { label: string; desc: string }[]) => {
  try {
    localStorage.setItem(LABEL_KEY(email), JSON.stringify(items));
  } catch {
    // ignore
  }
};

const scoreColor = (v: number | null) => {
  if (v === null) return { bg: 'bg-gray-100', text: 'text-gray-400', bar: 'bg-gray-200', svgFill: '#9ca3af' };
  if (v >= 80)    return { bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-500',  svgFill: '#374151' };
  if (v >= 60)    return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500', svgFill: '#374151' };
  return            { bg: 'bg-red-100',   text: 'text-red-600',   bar: 'bg-red-500',   svgFill: '#374151' };
};

// ============================================================
// LABEL POPUP
// ============================================================
interface LabelPopupProps {
  index: number;
  item: RadarItem;
  anchor: { x: number; y: number };
  onSave: (index: number, label: string, desc: string) => void;
  onClose: () => void;
}

function LabelPopup({ index, item, anchor, onSave, onClose }: LabelPopupProps) {
  const isKnown = SUBJECT_OPTIONS.includes(item.label);
  const [selected, setSelected] = useState(isKnown ? item.label : '__custom__');
  const [custom, setCustom]     = useState(isKnown ? '' : item.label);
  const [desc, setDesc]         = useState(
    item.desc === 'Chưa đặt tên.' || item.desc === 'Chưa có dữ liệu.' ? '' : item.desc
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);

  const W    = 292;
  const H    = 370;
  const left = Math.min(
    Math.max(anchor.x - W / 2, 8),
    (typeof window !== 'undefined' ? window.innerWidth : 800) - W - 8
  );
  const top = (typeof window !== 'undefined' && anchor.y + 14 + H > window.innerHeight)
    ? anchor.y - H - 14
    : anchor.y + 14;

  const finalLabel = selected === '__custom__' ? custom.trim() : selected;

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, width: W, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Vị trí {index + 1}
          </span>
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
            Tiêu chí {index + 1}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-400 font-medium mb-2">Chọn môn học</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUBJECT_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selected === s
                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
            }`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setSelected('__custom__')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            selected === '__custom__'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-400'
          }`}
        >
          ✏️ Tùy chỉnh
        </button>
      </div>

      {selected === '__custom__' && (
        <input
          autoFocus
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Nhập tên tiêu chí..."
          className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      )}

      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Mô tả ngắn về tiêu chí này..."
        rows={2}
        className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3 leading-relaxed">
        💡 Điểm số ({item.value !== null ? `${item.value}%` : 'trống'}) đọc tự động từ cột{' '}
        <strong>Tiêu chí {index + 1}</strong> — sheet{' '}
        <code className="bg-blue-100 px-1 rounded">Accounts</code>.
        Chỉ tên hiển thị được lưu tại đây.
      </p>

      <button
        disabled={!finalLabel}
        onClick={() => {
          if (finalLabel) {
            onSave(index, finalLabel, desc.trim() || 'Chưa có mô tả.');
            onClose();
          }
        }}
        className="w-full py-2.5 bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-bold hover:bg-green-700 active:scale-95 transition-all shadow"
      >
        Lưu thay đổi
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function ProgressPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const email = currentUser?.Email ?? '';

  const [radarData, setRadarData] = useState<RadarItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [popup,     setPopup]     = useState<{ index: number; anchor: { x: number; y: number } } | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState<string | null>(null);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);

  // ── Fetch dữ liệu ──────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!email) {
      setRadarData(DEFAULT_LABELS.map(it => ({ ...it, value: null })));
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const accounts = await fetchAccounts();

        console.log('🔍 [Progress] Email hiện tại:', email);
        console.log('🔍 [Progress] Số lượng accounts:', accounts.length);

        const acc = accounts.find(
          a => String(a.Email ?? '').trim().toLowerCase() === email.toLowerCase()
        );

        if (!acc) {
          console.warn('❌ [Progress] Không tìm thấy email. Danh sách:', accounts.map(a => a.Email));
          setRadarData(DEFAULT_LABELS.map(it => ({ ...it, value: null })));
          setError('Không tìm thấy tài khoản trong sheet Accounts.');
          return;
        }

        const raw = acc as unknown as Record<string, unknown>;

        console.log('🔍 [Progress] Account:', raw);
        console.log('🔍 [Progress] Keys:', Object.keys(raw));

        const sheetParsed = [1, 2, 3, 4, 5, 6].map(n =>
          parseTieuChi(getField(raw, `Tiêu chí ${n}`))
        );

        const local = loadLabels(email);

        const baseItems = sheetParsed.map((parsed, i) => ({
          label: parsed.label || local?.[i]?.label || DEFAULT_LABELS[i].label,
          desc:  local?.[i]?.desc || DEFAULT_LABELS[i].desc,
        }));

        setRadarData(
          baseItems.map((item, i) => ({
            label: item.label,
            desc:  item.desc,
            value: sheetParsed[i].value,
          }))
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Lỗi không xác định.';
        setError(msg);
        setRadarData(DEFAULT_LABELS.map(it => ({ ...it, value: null })));
      } finally {
        setLoading(false);
      }
    })();
  }, [email, authLoading]);

  // ── Open popup ─────────────────────────────────────────────
  const openFromSvg = useCallback((index: number) => {
    const el = labelRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopup({ index, anchor: { x: rect.left + rect.width / 2, y: rect.bottom } });
  }, []);

  const openFromRow = useCallback((index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setPopup({ index, anchor: { x: rect.left + rect.width / 2, y: rect.bottom } });
  }, []);

  // ── Save label ─────────────────────────────────────────────
  const handleSave = useCallback(async (index: number, label: string, desc: string) => {
    const updated = radarData.map((it, i) => i === index ? { ...it, label, desc } : it);
    setRadarData(updated);

    const labelsMeta = updated.map(d => ({ label: d.label, desc: d.desc }));
    saveLabelsLocal(email, labelsMeta);

    if (!email) return;

    setSaving(true);
    setSaveMsg(null);

    try {
      const currentScore = updated[index].value ?? 0;
      const result = await updateCriterion(email, index + 1, label, currentScore);

      // Log toàn bộ result để debug
      console.log('🔍 [handleSave] updateCriterion result:', JSON.stringify(result));

      if (result?.success) {
        setSaveMsg('Đã lưu!');
      } else {
        // Lấy error message từ mọi field có thể có
        const r = result as Record<string, unknown> | undefined;
        const serverMsg =
          (typeof r?.['error'] === 'string' && (r['error'] as string).trim())
            ? (r['error'] as string)
            : (typeof r?.['message'] === 'string' && (r['message'] as string).trim())
            ? (r['message'] as string)
            : null;

        console.warn('🔍 [handleSave] Server failure, msg:', serverMsg, '| full:', r);
        setSaveMsg(serverMsg ?? 'Lưu thất bại. Kiểm tra GAS.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('🔍 [handleSave] Exception:', errMsg);

      if (errMsg.includes('Unknown action') || errMsg.includes('Script function')) {
        setSaveMsg('Lỗi: Chưa update GAS!');
      } else if (!errMsg || errMsg === 'undefined' || errMsg === 'null') {
        setSaveMsg('Lỗi lưu server.');
      } else {
        setSaveMsg(errMsg);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  }, [email, radarData]);

  // ── SVG Radar geometry ─────────────────────────────────────
  const SZ = 300;
  const CX = SZ / 2;
  const R  = CX - 46;

  const pt = (pct: number, i: number, maxR: number) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const r = (pct / 100) * maxR;
    return { x: CX + r * Math.cos(a), y: CX + r * Math.sin(a) };
  };

  const ringPts = (pct: number) =>
    radarData.map((_, i) => pt(pct, i, R)).map(p => `${p.x},${p.y}`).join(' ');

  const dataPts = radarData
    .map((d, i) => pt(d.value ?? 0, i, R))
    .map(p => `${p.x},${p.y}`)
    .join(' ');

  const validVals  = radarData.map(d => d.value).filter((v): v is number => v !== null);
  const allEmpty   = validVals.length === 0;
  const avg        = allEmpty ? null : Math.round(validVals.reduce((s, v) => s + v, 0) / validVals.length);
  const sorted     = [...radarData].filter(d => d.value !== null).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const strongest  = sorted[0] ?? null;
  const weakest    = sorted[sorted.length - 1] ?? null;

  // ── Loading ────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {authLoading ? 'Đang xác thực…' : 'Đang tải'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] font-sans text-[#0f2419] pb-24">
      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors mb-4 font-medium text-sm"
          >
            <Icon name="arrow-left" className="w-4 h-4" />
            Quay lại trang chủ
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0f2419] mb-1">Biểu đồ năng lực</h1>
              <p className="text-gray-500 text-sm">
                {currentUser
                  ? <>
                      Xin chào, <strong>{currentUser['Tên tài khoản'] as string}</strong> · Điểm từ cột{' '}
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Tiêu chí 1–6</code>
                    </>
                  : 'Vui lòng đăng nhập để xem biểu đồ năng lực.'
                }
              </p>
            </div>

            {/* Save toast */}
            {(saving || saveMsg) && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all ${
                saving ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
              }`}>
                {saving
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }
                {saving ? 'Đang lưu…' : saveMsg}
              </div>
            )}
          </div>

          {/* Chưa đăng nhập */}
          {!currentUser && (
            <div className="mt-3 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Chưa đăng nhập</p>
                <p className="text-xs text-amber-600">Đăng nhập để xem điểm số và tùy chỉnh biểu đồ.</p>
              </div>
              <Link href="/login" className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">
                Đăng nhập
              </Link>
            </div>
          )}

          {/* Error */}
          {error && currentUser && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Hint */}
          {currentUser && !allEmpty && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              ✏️ Nhấn vào <strong>tên môn</strong> trên biểu đồ hoặc vào hàng bất kỳ bên phải để đổi nhãn hiển thị.
            </div>
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ─ Chart ─ */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-lg flex flex-col items-center relative overflow-visible">

            {allEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/85 backdrop-blur-sm z-10 gap-2 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-1">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-sm">Chưa có điểm số</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {currentUser
                    ? <>Admin nhập vào cột <strong>Tiêu chí 1–6</strong> định dạng <code className="bg-gray-100 px-1 rounded">[Toán, 85]</code></>
                    : 'Đăng nhập để xem dữ liệu của bạn.'
                  }
                </p>
              </div>
            )}

            <svg
              width={SZ} height={SZ}
              viewBox={`0 0 ${SZ} ${SZ}`}
              className="overflow-visible drop-shadow-xl"
            >
              {/* Grid rings */}
              {[25, 50, 75, 100].map(pct => (
                <polygon
                  key={pct}
                  points={radarData.length ? ringPts(pct) : ''}
                  fill={pct === 100 ? '#f0fdf4' : 'none'}
                  stroke="#bbf7d0"
                  strokeWidth="1"
                  strokeDasharray={pct < 100 ? '4 4' : undefined}
                />
              ))}

              {/* Axes */}
              {radarData.map((_, i) => {
                const p = pt(100, i, R);
                return <line key={i} x1={CX} y1={CX} x2={p.x} y2={p.y} stroke="#dcfce7" strokeWidth="1" />;
              })}

              {/* Data polygon */}
              {!allEmpty && (
                <polygon
                  points={dataPts}
                  fill="rgba(34,197,94,0.25)"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  className="transition-all duration-700"
                />
              )}

              {/* Labels + dots */}
              {radarData.map((d, i) => {
                const dot     = pt(d.value ?? 0, i, R);
                const labelP  = pt(122, i, R);
                const c       = scoreColor(d.value);
                const isEmpty = d.value === null;
                const canEdit = !!currentUser;

                return (
                  <g
                    key={i}
                    className={canEdit ? 'cursor-pointer' : 'cursor-default'}
                    onClick={() => canEdit && openFromSvg(i)}
                  >
                    {canEdit && (
                      <rect
                        x={labelP.x - 36} y={labelP.y - 15}
                        width={72} height={34} rx={7}
                        fill="transparent"
                        className="hover:fill-green-50 transition-colors"
                      />
                    )}

                    {!isEmpty ? (
                      <circle cx={dot.x} cy={dot.y} r={5} fill="#15803d" stroke="white" strokeWidth="2" />
                    ) : (
                      <circle cx={CX} cy={CX} r={3} fill="#d1d5db" stroke="white" strokeWidth="1.5" />
                    )}

                    <text
                      ref={el => { labelRefs.current[i] = el; }}
                      x={labelP.x} y={labelP.y}
                      textAnchor="middle" dominantBaseline="middle"
                      style={{
                        fontSize: 11, fontWeight: 700,
                        fill: c.svgFill,
                        userSelect: 'none',
                        transition: 'fill 0.15s',
                      }}
                    >
                      {d.label}
                    </text>

                    <text
                      x={labelP.x} y={labelP.y + 14}
                      textAnchor="middle" dominantBaseline="middle"
                      style={{
                        fontSize: 10, fontWeight: 700,
                        fill: isEmpty ? '#d1d5db' : '#16a34a',
                        userSelect: 'none',
                      }}
                    >
                      {isEmpty ? '—' : `${d.value}%`}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="mt-5 text-center">
              {allEmpty ? (
                <span className="inline-block px-4 py-2 bg-gray-100 rounded-full text-gray-400 font-medium text-sm">
                  Chưa có điểm số
                </span>
              ) : (
                <span className="inline-block px-4 py-2 bg-green-100 rounded-full text-green-800 font-bold text-sm">
                  Điểm trung bình: {avg}/100
                </span>
              )}
            </div>
          </div>

          {/* ─ Detail list ─ */}
          <div className="space-y-3">
            {radarData.map((item, idx) => {
              const c = scoreColor(item.value);
              return (
                <div
                  key={idx}
                  onClick={e => currentUser && openFromRow(idx, e)}
                  className={`group bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-4 transition-all ${
                    currentUser
                      ? 'cursor-pointer hover:shadow-md hover:bg-white hover:scale-[1.01]'
                      : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${c.bg} ${c.text}`}>
                      {item.value === null ? '—' : item.value}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-sm">{item.label}</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                          Tiêu chí {idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${c.bar}`}
                          style={{ width: `${item.value ?? 0}%` }}
                        />
                      </div>

                      {currentUser && item.value !== null && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            const prefix = SUBJECT_PREFIX_MAP[item.label];
                            if (prefix) {
                              // Chuyển sang trang trung gian để lọc các đề có ID bắt đầu bằng prefix này
                              router.push(`/exams/subject?prefix=${prefix}&title=${encodeURIComponent(item.label)}`);
                            } else {
                              // Nếu môn đó chưa có ID (ví dụ môn GDCD, Tin học) -> Đẩy về trang tổng và dùng query để lọc
                              router.push(`/exams?subject=${encodeURIComponent(item.label)}`);
                            }
                          }}
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                          title={`Kiểm tra môn ${item.label}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="cursor-pointer">Thi</span>
                        </div>
                      )}

                      {currentUser && (
                        <svg
                          className="w-3.5 h-3.5 text-gray-300 group-hover:text-green-500 transition-colors"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Recommendation */}
            {!allEmpty && strongest && weakest && strongest.label !== weakest.label && (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0">
                    <Icon name="star" className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">Đánh giá tổng quan</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Thế mạnh của bạn là <strong>{strongest.label}</strong> ({strongest.value}%).
                      Cần cải thiện <strong>{weakest.label}</strong> ({weakest.value}%) để cân bằng biểu đồ.
                      Nhấn <strong className="text-yellow-300">Thi</strong> để luyện tập ngay!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {allEmpty && (
              <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center bg-white/40">
                <p className="text-gray-400 font-medium text-sm">Dữ liệu điểm chưa được nhập</p>
                <p className="text-gray-400 text-xs mt-1">
                  Admin điền cột <code className="bg-gray-100 px-1 rounded">Tiêu chí 1–6</code>{' '}
                  định dạng <code className="bg-gray-100 px-1 rounded">[Toán, 85]</code>{' '}
                  trong sheet <code className="bg-gray-100 px-1 rounded">Accounts</code>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { label: 'Xếp hạng',   value: 'Top 15%' },
            { label: 'Chuỗi ngày', value: '12 Ngày'  },
            { label: 'Mục tiêu',   value: '900+'      },
          ].map(s => (
            <div key={s.label} className="bg-white/50 p-4 rounded-2xl text-center border border-white/50">
              <div className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">{s.label}</div>
              <div className="text-2xl font-black text-gray-800">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup */}
      {popup && radarData[popup.index] && (
        <LabelPopup
          index={popup.index}
          item={radarData[popup.index]}
          anchor={popup.anchor}
          onSave={handleSave}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
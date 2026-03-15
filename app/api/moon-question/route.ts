import { NextRequest, NextResponse } from 'next/server';
import { fetchQuestionFromMoon } from '@/services/moonApiService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baiGiangID = searchParams.get('id');

  console.log('[API/moon-question] Request id:', baiGiangID);

  if (!baiGiangID) {
    return NextResponse.json({ error: 'Thiếu ?id=' }, { status: 400 });
  }

  try {
    const question = await fetchQuestionFromMoon(baiGiangID);

    if (!question) {
      console.log('[API/moon-question] Không tìm thấy câu hỏi cho id:', baiGiangID);
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    console.log('[API/moon-question] ✅ Trả về câu hỏi:', question.questionId);
    return NextResponse.json(question);

  } catch (err) {
    console.error('[API/moon-question] ❌ Server error:', err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}
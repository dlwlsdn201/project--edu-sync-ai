import type { Question } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// 기본: 2.5-flash. 429가 잦으면 EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-lite 권장(할당량이 별도일 수 있음).
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-2.5-flash';
/** 주 모델이 429로 끝까지 실패하면 한 번 시도 (무료 티어에서 쿼터가 분리된 경우가 있음) */
const GEMINI_FALLBACK_MODEL =
  process.env.EXPO_PUBLIC_GEMINI_FALLBACK_MODEL ?? 'gemini-2.5-flash-lite';

function geminiUrl(modelId: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
}

/** 503·429 는 일시적 과부하/속도 제한 → 재시도 */
const GEMINI_RETRY_STATUSES = new Set([503, 429]);
const GEMINI_MAX_ATTEMPTS_PER_MODEL = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Google 오류 본문에 "retry in 42.3s" 형태가 있으면 그만큼 대기 */
function parseRetryAfterMs(errorBody: string): number | null {
  try {
    const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
    const msg = parsed?.error?.message ?? '';
    const m = /[Rr]etry in ([\d.]+)\s*s/i.exec(msg);
    if (m) return Math.min(Math.ceil(parseFloat(m[1]) * 1000), 120_000);
  } catch {
    /* ignore */
  }
  return null;
}

function backoffMsForRetry(status: number, attemptIndex: number, errorBody: string): number {
  const fromApi = parseRetryAfterMs(errorBody);
  if (fromApi != null) return fromApi;
  // 429 는 분당 한도라 짧은 백오프만으로는 부족한 경우가 많음 → 더 길게
  if (status === 429) {
    return Math.min(10_000 * (attemptIndex + 1), 90_000);
  }
  return 1000 * 2 ** attemptIndex;
}

function toUserFacingGeminiError(status: number, body: string): Error {
  if (status === 503) {
    return new Error(
      'Gemini 서버가 일시적으로 혼잡합니다. 자동으로 재시도했어요. 잠시 후 다시 눌러 주세요.',
    );
  }
  if (status === 429) {
    return new Error(
      'Gemini 요청 한도(분당·일일)에 걸렸습니다. 수 분 뒤 재시도하거나, Google AI Studio에서 할당량·결제를 확인하고, .env 에서 EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-lite 로 바꿔 보세요.',
    );
  }
  return new Error(`Gemini API 오류: ${status} ${body}`);
}

async function callGemini(prompt: string): Promise<string> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });

  const modelChain = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL].filter(
    (m, i, arr) => m && arr.indexOf(m) === i,
  );

  let lastErrorText = '';
  let lastStatus = 0;

  for (const modelId of modelChain) {
    const url = geminiUrl(modelId);

    for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return text;
      }

      const errorText = await res.text();
      const status = res.status;
      lastErrorText = errorText;
      lastStatus = status;

      const willRetry =
        GEMINI_RETRY_STATUSES.has(status) &&
        attempt < GEMINI_MAX_ATTEMPTS_PER_MODEL - 1;

      if (willRetry) {
        await sleep(backoffMsForRetry(status, attempt, errorText));
        continue;
      }

      // 재시도 불가(400 등)이거나 이 모델에서 마지막 시도까지 실패 → 다음 폴백 모델
      if (!GEMINI_RETRY_STATUSES.has(status)) {
        throw toUserFacingGeminiError(status, errorText);
      }
      break;
    }
  }

  throw toUserFacingGeminiError(lastStatus || 429, lastErrorText);
}

/**
 * 수업 자료 텍스트를 분석하여 4지선다 퀴즈 5개를 생성합니다.
 */
export async function generateQuizQuestions(text: string): Promise<Question[]> {
  const prompt = `당신은 교육 퀴즈 전문가입니다. 아래 수업 자료를 분석하여 4지선다 객관식 문제 5개를 생성하세요.

반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 설명이나 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

형식:
[
  {
    "id": "q1",
    "content": "문제 내용",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correct_index": 0,
    "concept_tag": "핵심 개념 태그"
  }
]

규칙:
- correct_index는 0~3 사이의 정수 (options 배열의 인덱스)
- concept_tag는 해당 문제의 핵심 개념을 한 단어 또는 짧은 구로 표현
- 선택지는 명확하게 구분되어야 함
- 문제는 수업 자료의 핵심 내용을 다루어야 함

수업 자료:
${text}`;

  const raw = await callGemini(prompt);

  // JSON 파싱 (마크다운 코드블록 제거 대응)
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const questions: Question[] = JSON.parse(cleaned);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('퀴즈 생성 결과가 올바르지 않습니다.');
  }

  return questions;
}

/**
 * 오답 시 소크라테스식 힌트를 생성합니다.
 */
export async function generateHint(
  question: Question,
  selectedIndex: number,
): Promise<string> {
  const prompt = `학생이 퀴즈 문제를 틀렸습니다. 소크라테스식 질문으로 학생이 스스로 답을 찾을 수 있도록 짧은 힌트(2~3문장)를 한국어로 작성해주세요.

문제: ${question.content}
학생이 선택한 오답: ${question.options[selectedIndex]}
정답: ${question.options[question.correct_index]}
핵심 개념: ${question.concept_tag}

힌트는 정답을 직접 알려주지 말고, 학생이 생각해볼 수 있는 질문이나 단서만 제공하세요.`;

  const hint = await callGemini(prompt);
  return hint.trim();
}

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxQ7P80RVJYr7-3GQkqi1sGtzsPVWKqWAybU-uJHOQKKiS1xLWRIiDglGgkFRBLMxja/exec";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const response = await fetch(
    `${APPS_SCRIPT_URL}?${searchParams.toString()}`,
    { method: "GET" }
  );

  const text = await response.text();

  return new Response(text, {
    status: response.ok ? 200 : response.status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(req: Request) {
  // Read the body as raw text because the client sends 'text/plain'
  const bodyAsText = await req.text();

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: bodyAsText,
  });

  const text = await response.text();

  return new Response(text, {
    status: response.ok ? 200 : response.status,
    headers: { "Content-Type": "application/json" }
  });
}
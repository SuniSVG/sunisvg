const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzA9XZQx-x-YlLaEjDTqZSqeJfQehWLIQLHi5HSXhd9ztm_TcflJRpYQU1D0e8OE_8Z/exec";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const response = await fetch(
    `${APPS_SCRIPT_URL}?${searchParams.toString()}`,
    { method: "GET" }
  );

  const text = await response.text();

  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(body)
  });

  const text = await response.text();

  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
export async function POST(req: Request) {

  const body = await req.json();

  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbzWByAnxvclArXHU1uOM7N-G8r2JLNbVi_P9yAzlhvgO6WwAKIHB3fefUJNq6sd-z6i/exec",
    {
      method: "POST",
      body: JSON.stringify(body)
    }
  );

  const text = await response.text();

  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
const BACKEND_URL = "https://medstack-x86l.onrender.com";

async function post(path: string, body: any) {
  console.log("API call:", `${BACKEND_URL}${path}`);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("API status:", res.status);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return res.json();
  } catch (e) {
    console.log("API error:", e);
    throw e;
  }
}

export const api = {
  scan: (image: string, mimeType: string) =>
    post("/api/scan", { image, mimeType }),
  stackCheck: (drugs: string[]) => post("/api/stack-check", { drugs }),
  beersCheck: (age: number, drugs: string[]) =>
    post("/api/beers-check", { age, drugs }),
};

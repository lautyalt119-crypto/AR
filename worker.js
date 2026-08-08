// Guardian AR — Cloudflare Worker
// Guarda la API key como secreto del Worker, NO en GitHub Pages.
// Secret name: SAFE_BROWSING_KEY
//
// Endpoint: POST /check
// Body: {"url":"https://example.com"}
//
// Solo comprueba la URL concreta contra Google Safe Browsing.
// No descarga la página ni rastrea enlaces.

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    if (request.method === "OPTIONS")
      return new Response("", {headers:cors});

    const u = new URL(request.url);
    if (u.pathname !== "/check" || request.method !== "POST")
      return new Response("Not found", {status:404,headers:cors});

    try {
      const body = await request.json();
      const target = new URL(body.url);

      if (!["http:","https:"].includes(target.protocol))
        throw new Error("Solo se permiten URLs HTTP/HTTPS.");

      const apiUrl =
        "https://safebrowsing.googleapis.com/v5/urls:search" +
        "?key=" + encodeURIComponent(env.SAFE_BROWSING_KEY) +
        "&urls=" + encodeURIComponent(target.href);

      const r = await fetch(apiUrl);
      const data = await r.json();

      if (!r.ok)
        return new Response(JSON.stringify({error:"Safe Browsing devolvió un error."}),
          {status:502,headers:{"Content-Type":"application/json",...cors}});

      const threats = Array.isArray(data.threats) ? data.threats : [];
      return new Response(JSON.stringify({
        safe: threats.length === 0,
        threats: threats.map(t => t.threatTypes || []),
        message: threats.length
          ? "La URL coincide con una amenaza conocida."
          : "No hubo coincidencias en las listas consultadas."
      }), {headers:{"Content-Type":"application/json",...cors}});
    } catch (e) {
      return new Response(JSON.stringify({error:e.message || "Solicitud inválida."}),
        {status:400,headers:{"Content-Type":"application/json",...cors}});
    }
  }
};

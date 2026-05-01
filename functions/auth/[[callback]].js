// GitHub OAuth handler for Sveltia CMS — Cloudflare Pages Function.
// Handles two phases on the same endpoint (/auth/callback):
//   1. Initial request from the CMS  → redirect to GitHub authorize URL.
//   2. GitHub redirect with `?code=` → exchange code for token, postMessage
//      the result back to the opener window, close the popup.
//
// Required Pages env vars: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.

export const onRequest = async ({ request, env }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("code")) {
    return handleCallback({ env, url });
  }
  return startAuth({ env, url });
};

const startAuth = ({ env, url }) => {
  const provider = url.searchParams.get("provider") || "github";
  if (provider !== "github") {
    return new Response("Unsupported provider", { status: 400 });
  }

  const scope = url.searchParams.get("scope") || "repo,user";
  const state = btoa(JSON.stringify({ provider, csrf: crypto.randomUUID() }));
  const redirectUri = `${url.origin}${url.pathname}`;

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", scope);
  authorize.searchParams.set("state", state);

  return Response.redirect(authorize.toString(), 302);
};

const handleCallback = async ({ env, url }) => {
  let provider = "github";
  try {
    const decoded = JSON.parse(atob(url.searchParams.get("state") || ""));
    provider = decoded.provider || "github";
  } catch {
    return renderHandshake(provider, null, "invalid_state");
  }

  let token;
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: url.searchParams.get("code"),
      }),
    });
    const data = await res.json();
    if (data.error) {
      return renderHandshake(provider, null, data.error_description || data.error);
    }
    token = data.access_token;
  } catch {
    return renderHandshake(provider, null, "token_exchange_failed");
  }

  return renderHandshake(provider, token);
};

const renderHandshake = (provider, token, error) => {
  const status = error ? "error" : "success";
  const payload = error ? { provider, error } : { provider, token };
  const message = `authorization:${provider}:${status}:${JSON.stringify(payload)}`;

  const html = `<!doctype html>
<html>
  <body>
    <script>
      (() => {
        const send = (target, origin) => {
          target.postMessage(${JSON.stringify(message)}, origin || "*");
        };
        window.addEventListener("message", (e) => {
          if (e.data === "authorizing:${provider}" && (e.source || window.opener)) {
            send(e.source || window.opener, e.origin);
          }
        });
        if (window.opener) {
          window.opener.postMessage("authorizing:${provider}", "*");
        }
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
};

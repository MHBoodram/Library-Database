export function router() {
  const routes = [];
  const add = (method, path, handler) => routes.push({ method, path, handler });

  const match = (method, urlPath) => {
    for (const r of routes) {
      if (r.method !== method) continue;
      const params = {};
      const a = urlPath.split("/").filter(Boolean);
      const b = r.path.split("/").filter(Boolean);
      if (a.length !== b.length) continue;
      let ok = true;
      for (let i = 0; i < a.length; i++) {
        if (b[i].startsWith(":")) params[b[i].slice(1)] = decodeURIComponent(a[i]);
        else if (a[i] !== b[i]) { ok = false; break; }
      }
      if (ok) return { handler: r.handler, params };
    }
    return null;
  };

  return { add, match };
}

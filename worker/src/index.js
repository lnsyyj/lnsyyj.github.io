const cors = {
  'Access-Control-Allow-Origin': 'https://lnsyyj.github.io',
  'Cache-Control': 'public, max-age=3600',
  'Content-Type': 'application/json; charset=utf-8'
};

const query = `query ($accountTag: string!, $start: Time!, $end: Time!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    rumPageloadEventsAdaptiveGroups(
      filter: { datetime_geq: $start, datetime_lt: $end, requestHost: "lnsyyj.github.io" }
      limit: 1000
      orderBy: [count_DESC]
    ) { count dimensions { requestPath } }
  }}
}`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/analytics') return new Response('Not found', { status: 404 });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const cacheKey = new Request(url.toString());
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { accountTag: env.CLOUDFLARE_ACCOUNT_ID, start: start.toISOString(), end: end.toISOString() } })
    });
    const result = await response.json();
    if (!response.ok || result.errors) return Response.json({ error: 'Analytics unavailable' }, { status: 502, headers: cors });

    const rows = result.data.viewer.accounts[0]?.rumPageloadEventsAdaptiveGroups || [];
    const pages = Object.fromEntries(rows.map((row) => [row.dimensions.requestPath || '/', row.count]));
    const payload = { periodDays: 30, totalPageviews: rows.reduce((sum, row) => sum + row.count, 0), pages };
    const output = Response.json(payload, { headers: cors });
    ctx.waitUntil(caches.default.put(cacheKey, output.clone()));
    return output;
  }
};

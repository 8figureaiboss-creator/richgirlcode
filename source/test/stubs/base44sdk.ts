// Test stub for npm:@base44/sdk — the test sets the "logged-in user" per request via a header.
export function createClientFromRequest(req: Request) {
  return {
    auth: {
      async me() {
        const raw = req.headers.get('x-test-user');
        return raw ? JSON.parse(raw) : null;
      },
    },
  };
}

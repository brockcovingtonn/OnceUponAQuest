// A fresh explorer for every run (cleaned up by scripts/e2e.mjs afterwards).
const stamp = String(Date.now());
output.email = 'e2e-' + stamp + '@example.com';
output.username = 'e2e_' + stamp.slice(-9);

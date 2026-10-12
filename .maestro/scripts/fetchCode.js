// Reads the 6-digit sign-in code from the local test inbox (Mailpit).
const inbox = 'http://127.0.0.1:54324/api/v1';
const list = json(http.get(inbox + '/search?query=to:' + encodeURIComponent(EMAIL)).body);
if (!list.messages || list.messages.length === 0) throw new Error('No sign-in email yet for ' + EMAIL);
const message = json(http.get(inbox + '/message/' + list.messages[0].ID).body);
const match = (message.HTML || message.Text).match(/\b(\d{6})\b/);
if (!match) throw new Error('No code in the sign-in email');
output.code = match[1];

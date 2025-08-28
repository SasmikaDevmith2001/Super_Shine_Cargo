// supabase/functions/send-contact-email/index.ts
status: 400,
headers: corsHeaders(origin),
});
}


const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRe.test(email)) {
return new Response(JSON.stringify({ error: "Invalid email" }), {
status: 400,
headers: corsHeaders(origin),
});
}


// Compose email
const subject = `New contact form submission: ${name}`;
const plain = `You received a new message from the website.\n\n`
+ `Name: ${name}\n`
+ `Email: ${email}\n`
+ (phone ? `Phone: ${phone}\n` : "")
+ `\nMessage:\n${message}\n`;


const html = `
<div style="font-family: Arial, sans-serif; line-height:1.6">
<h2>New contact form submission</h2>
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
<hr />
<p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
</div>
`;


// Send via Gmail SMTP
const client = new SmtpClient();
await client.connectTLS({
hostname: SMTP_HOST,
port: SMTP_PORT,
username: GMAIL_USER,
password: GMAIL_APP_PASSWORD,
});


await client.send({
from: `Super Shine Website <${GMAIL_USER}>`,
to: RECIPIENT_EMAIL,
subject,
content: plain,
html,
// Some SMTP libs support custom headers; if supported, uncomment:
// headers: { "Reply-To": email },
});


await client.close();


return new Response(JSON.stringify({ ok: true }), {
status: 200,
headers: corsHeaders(origin),
});
} catch (err) {
console.error("send-contact-email error", err);
return new Response(JSON.stringify({ error: "Failed to send message" }), {
status: 500,
headers: corsHeaders(origin),
});
}
});


function escapeHtml(input: string) {
return input
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}
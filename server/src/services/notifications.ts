/** Stubs for SendGrid/Twilio — no PII in structured logs. */

export function sendEmail(to: string, subject: string, body: string): void {
  console.log("[notify:email]", { to: mask(to), subjectLen: subject.length, bodyLen: body.length });
}

export function sendSms(to: string, body: string): void {
  console.log("[notify:sms]", { to: maskPhone(to), bodyLen: body.length });
}

function mask(email: string): string {
  const [u, d] = email.split("@");
  if (!d) return "***";
  return `${u?.slice(0, 2) ?? ""}***@${d}`;
}

function maskPhone(p: string): string {
  return p.replace(/\d(?=\d{4})/g, "*");
}

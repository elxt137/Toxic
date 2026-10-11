// Public business contact. Deployment settings can override it.
export function getWhatsappNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492984252129";
}

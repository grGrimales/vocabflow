export type SpeechLang = "en-US" | "es-ES" | "pt-BR";

export function speak(text: string, lang: SpeechLang = "en-US") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

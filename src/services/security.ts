export function validateUpload(file: File) {
  const maxSize = 25 * 1024 * 1024;
  const blockedExtensions = [".exe", ".bat", ".cmd", ".ps1", ".scr", ".js"];
  const lowerName = file.name.toLowerCase();

  if (file.size > maxSize) {
    return { ok: false, reason: "Dosya 25 MB sınırını aşıyor." };
  }
  if (blockedExtensions.some((extension) => lowerName.endsWith(extension))) {
    return { ok: false, reason: "Bu dosya türü güvenlik nedeniyle engellendi." };
  }
  return { ok: true, reason: "" };
}

export function maskPrivateContent(content: string, aiConsent: boolean) {
  if (!aiConsent) return "";
  return content.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[email]").replace(/\b\d{10,}\b/g, "[number]");
}

(function initFnolNotes(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const NOTES_MAX_LENGTH = 500;
  const NOTES_MAX_CAP = 2000;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function resolveNotesMaxLength(maxLength) {
    if (typeof maxLength !== "number" || !Number.isFinite(maxLength)) {
      return NOTES_MAX_LENGTH;
    }
    const floor = Math.floor(maxLength);
    if (floor < NOTES_MAX_LENGTH) {
      return NOTES_MAX_LENGTH;
    }
    return Math.min(NOTES_MAX_CAP, floor);
  }

  function truncateNoteText(text, maxLength) {
    const limit = resolveNotesMaxLength(maxLength);
    const normalized = normalizeText(text);
    if (normalized.length <= limit) {
      return { text: normalized, trimmed: false };
    }
    return {
      text: normalized.slice(0, limit),
      trimmed: true
    };
  }

  function getNoteTextFromPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }
    return normalizeText(payload.notes || payload.notesUser);
  }

  function buildAdjusterBackupBlock(adjuster) {
    const name = normalizeText(adjuster && adjuster.adjusterName);
    const phone = normalizeText(adjuster && adjuster.adjusterPhone);
    const email = normalizeText(adjuster && adjuster.adjusterEmail);
    if (!name && !phone && !email) {
      return "";
    }
    const lines = ["--- Adjuster (backup) ---"];
    if (name) {
      lines.push("Name: " + name);
    }
    if (phone) {
      lines.push("Phone: " + phone);
    }
    if (email) {
      lines.push("Email: " + email);
    }
    return lines.join("\n");
  }

  function buildFnolNotes(userNotes, adjuster) {
    const base = normalizeText(userNotes);
    const block = buildAdjusterBackupBlock(adjuster);
    if (!block) {
      return base;
    }
    if (!base) {
      return block;
    }
    return base + "\n\n" + block;
  }

  root.fnolNotes = {
    NOTES_MAX_LENGTH,
    NOTES_MAX_CAP,
    resolveNotesMaxLength,
    truncateNoteText,
    getNoteTextFromPayload,
    buildFnolNotes,
    buildAdjusterBackupBlock
  };
})(typeof window !== "undefined" ? window : self);

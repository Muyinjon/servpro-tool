(function initFnolNotes(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  const NOTES_MAX_LENGTH = 500;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function truncateNoteText(text, maxLength) {
    const limit = typeof maxLength === "number" ? maxLength : NOTES_MAX_LENGTH;
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
    truncateNoteText,
    getNoteTextFromPayload,
    buildFnolNotes,
    buildAdjusterBackupBlock
  };
})(typeof window !== "undefined" ? window : self);

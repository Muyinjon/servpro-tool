(function initFnolNotes(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
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
    buildFnolNotes,
    buildAdjusterBackupBlock
  };
})(typeof window !== "undefined" ? window : self);

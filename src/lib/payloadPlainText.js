(function initPayloadPlainText(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function line(label, value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }
    return label + ": " + text;
  }

  function section(title, lines) {
    const body = lines.filter(Boolean);
    if (!body.length) {
      return "";
    }
    return title + "\n" + body.join("\n");
  }

  function formatPayloadAsPlainText(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }

    const basic = section("Basic information", [
      line("Full name", payload.customerName || payload.Customer),
      line("Business", payload.businessName || payload.Business),
      line("Phone 1", payload.primaryPhone || payload.phone1),
      line("Phone 2", payload.secondaryPhone || payload.phone2),
      line("Email", payload.email || payload.EMail),
      line("Property type", payload.propertyType),
      line("Pay type", payload.payType),
      line("Bus. unit", payload.businessUnit),
      line("Loss type", payload.lossType || payload.LossType),
      line("Job status", payload.jobStatus),
      line("Coordinator", payload.coordinator)
    ]);

    const a1 = normalizeText(payload.address1 || payload.Address1 || payload.address);
    const a2 = normalizeText(payload.address2 || payload.Address2);
    const city = normalizeText(payload.city || payload.City);
    const state = normalizeText(payload.state || payload.State);
    const zip = normalizeText(payload.zip || payload.Zip);
    const stateZip = [state, zip].filter(Boolean).join(" ");
    const cityStateZip = [city, stateZip].filter(Boolean).join(", ");
    const addressLines = [a1, a2, cityStateZip].filter(Boolean);
    const address = addressLines.length ? section("Address", addressLines) : "";

    const insurance = section("Insurance & adjuster", [
      line("Insurance company", payload.insuranceCarrier || payload.insurance),
      line("Claim #", payload.claimNumber || payload.claim),
      line("Adjuster name", payload.adjusterName),
      line("Adjuster phone", payload.adjusterPhone),
      line("Adjuster email", payload.adjusterEmail)
    ]);

    const notesText = normalizeText(payload.notes || payload.notesUser);
    const notes = notesText ? section("Notes", [notesText]) : "";

    return [basic, address, insurance, notes].filter(Boolean).join("\n\n");
  }

  root.payloadPlainText = {
    formatPayloadAsPlainText
  };
})(typeof window !== "undefined" ? window : self);

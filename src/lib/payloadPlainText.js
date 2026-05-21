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
      line("Coordinator", payload.coordinator)
    ]);

    const addressParts = [];
    const a1 = normalizeText(payload.address1 || payload.Address1 || payload.address);
    const a2 = normalizeText(payload.address2 || payload.Address2);
    const city = normalizeText(payload.city || payload.City);
    const state = normalizeText(payload.state || payload.State);
    const zip = normalizeText(payload.zip || payload.Zip);
    if (a1) {
      addressParts.push(line("Address 1", a1));
    }
    if (a2) {
      addressParts.push(line("Address 2", a2));
    }
    const cityLine = [city, state].filter(Boolean).join(", ");
    const cityZip = [cityLine, zip].filter(Boolean).join(cityLine && zip ? " " : "");
    if (cityZip) {
      addressParts.push(line("City / State / Zip", cityZip));
    }
    const address = addressParts.length ? section("Address", addressParts) : "";

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

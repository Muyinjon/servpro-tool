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

  function objectSection(title, obj, fieldLines) {
    if (!obj || typeof obj !== "object") {
      return "";
    }
    return section(title, fieldLines(obj));
  }

  function formatAlacritySections(payload) {
    const claim = payload.claim || {};
    const loss = payload.loss || {};
    const insured = payload.insured || {};
    const contractor = payload.contractor || {};
    const carrier = payload.carrier || {};
    const altimeter = payload.altimeter || {};
    const policy = payload.policy || {};

    const claimBlock = objectSection("Claim information", claim, function fields(c) {
      return [
        line("Claim #", c.claimNumber),
        line("Trade", c.trade),
        line("Company", c.company),
        line("Assignment", c.assignment),
        line("Emergency", c.emergency ? "Yes" : ""),
        line("Input by", c.inputBy)
      ];
    });

    const lossBlock = objectSection("Loss information", loss, function fields(l) {
      const addr = [
        normalizeText(l.address1),
        [normalizeText(l.city), normalizeText(l.state), normalizeText(l.zip)].filter(Boolean).join(" ")
      ]
        .filter(Boolean)
        .join(", ");
      return [
        line("Address", addr),
        line("Kind of loss", l.kindOfLoss),
        line("Date of loss", l.dateOfLoss),
        line("Reported", l.reportedDate),
        line("CAT code", l.catCode),
        l.lossDescription ? "Loss description:\n" + normalizeText(l.lossDescription) : "",
        line("Instructions", l.instructions)
      ];
    });

    const insuredBlock = objectSection("Insured information", insured, function fields(i) {
      return [
        line("Name", [i.firstName, i.lastName].filter(Boolean).join(" ")),
        line("Email", i.email),
        line("Home phone", i.homePhone),
        line("Cell phone", i.cellPhone),
        line("Business phone", i.businessPhone)
      ];
    });

    const contractorBlock = objectSection("Contractor information", contractor, function fields(c) {
      return [
        line("Contractor", c.name),
        line("Office", c.office),
        line("Point of contact", c.pointOfContact),
        line("POC phone", c.pocPhone),
        line("POC email", c.pocEmail)
      ];
    });

    const carrierBlock = objectSection("Carrier information", carrier, function fields(c) {
      return [
        line("MCO", c.mco),
        line("Adjuster", c.adjuster),
        line("Adjuster phone", c.adjusterPhone),
        line("Adjuster email", c.adjusterEmail)
      ];
    });

    const altimeterBlock = objectSection("Altimeter information", altimeter, function fields(a) {
      return [
        line("CSG", a.csg),
        line("CSG phone", a.csgPhone),
        line("RFM", a.rfm),
        line("RFA", a.rfa),
        line("Quality review", a.qualityReview)
      ];
    });

    const policyBlock = objectSection("Policy information", policy, function fields(p) {
      return [
        line("Policy #", p.policyNumber),
        line("Coverage", p.policyCoverage),
        line("Type", p.policyType),
        line("Deductible", p.deductible)
      ];
    });

    return [
      claimBlock,
      lossBlock,
      insuredBlock,
      contractorBlock,
      carrierBlock,
      altimeterBlock,
      policyBlock
    ].filter(Boolean);
  }

  function formatExtraSection(payload) {
    const lines = [];

    if (Array.isArray(payload.fnolCustomFields)) {
      payload.fnolCustomFields.forEach(function eachCustom(item) {
        if (!item) {
          return;
        }
        lines.push(line(item.label || item.key, item.value));
      });
    } else if (payload.custom && typeof payload.custom === "object") {
      Object.keys(payload.custom).forEach(function eachKey(key) {
        lines.push(line(key, payload.custom[key]));
      });
    }

    return section("Custom fields", lines);
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
      line("Secondary email", payload.secondaryEmail),
      line("Property type", payload.propertyType),
      line("Pay type", payload.payType),
      line("Bus. unit", payload.businessUnit),
      line("Loss type", payload.lossType || payload.LossType),
      line("Job status", payload.jobStatus),
      line("Coordinator", payload.coordinator),
      line("Project manager", payload.projectManager),
      line("Recon manager", payload.reconManager),
      line("Date of loss", payload.dateOfLoss),
      line("Cause of loss", payload.causeOfLoss)
    ]);

    const a1 = normalizeText(payload.address1 || payload.Address1 || payload.address);
    const a2 = normalizeText(payload.address2 || payload.Address2);
    const city = normalizeText(payload.city || payload.City);
    const state = normalizeText(payload.state || payload.State);
    const zip = normalizeText(payload.zip || payload.Zip);
    const stateZip = [state, zip].filter(Boolean).join(" ");
    const cityStateZip = [city, stateZip].filter(Boolean).join(", ");
    const addressLines = [
      a1,
      a2,
      cityStateZip,
      line("Year built", payload.yearBuilt)
    ].filter(Boolean);
    const address = addressLines.length ? section("Address", addressLines) : "";

    const insurance = section("Insurance & adjuster", [
      line("Insurance company", payload.insuranceCarrier || payload.insurance),
      line("Claim #", payload.claimNumber || payload.claim),
      line("Policy #", payload.policyNumber),
      line("Deductible", payload.deductible),
      line("Adjuster name", payload.adjusterName),
      line("Adjuster phone", payload.adjusterPhone),
      line("Adjuster email", payload.adjusterEmail)
    ]);

    const notesText = normalizeText(payload.notes || payload.notesUser);
    const notes = notesText ? section("Notes", [notesText]) : "";
    const extras = formatExtraSection(payload);

    const isAlacrity =
      payload.source === "alacrity" ||
      (payload.claim && payload.loss && payload.insured);

    if (isAlacrity) {
      return [basic, address, insurance, extras, notes, formatAlacritySections(payload)]
        .flat()
        .filter(Boolean)
        .join("\n\n");
    }

    return [basic, address, insurance, extras, notes].filter(Boolean).join("\n\n");
  }

  root.payloadPlainText = {
    formatPayloadAsPlainText
  };
})(typeof window !== "undefined" ? window : self);

(function initAlacrityFields(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const wcFields = root.workcenterFields || {};

  const PREFIX = "ctl00_bodyContentPlaceHolder_ClaimInfoControl1_";

  const ALACRITY_SELECTORS = {
    claim: {
      claimNumber: { id: PREFIX + "ClaimRoundPanel_ClaimNumberLabel", kind: "text" },
      xactwareId: { id: PREFIX + "ClaimRoundPanel_XactIdHyperLink", kind: "linkText" },
      coreLogicLink: { id: PREFIX + "ClaimRoundPanel_CoreLogicHyperLink", kind: "linkText" },
      trade: { id: PREFIX + "ClaimRoundPanel_TradeNameLabel", kind: "text" },
      emergency: { id: PREFIX + "ClaimRoundPanel_EmergencyCheckBox", kind: "checkbox" },
      company: { id: PREFIX + "ClaimRoundPanel_CompanyNameLabel", kind: "text" },
      assignment: { id: PREFIX + "ClaimRoundPanel_SystemClaimNoLabel", kind: "text" },
      inputBy: { id: PREFIX + "ClaimRoundPanel_InputerLabel", kind: "text" },
      inputByPhone: { id: PREFIX + "ClaimRoundPanel_InputerPhoneLabel", kind: "text" },
      inputByEmail: { id: PREFIX + "ClaimRoundPanel_InputerEmailLabel", kind: "text" }
    },
    loss: {
      address1: { id: PREFIX + "LossLocationRoundPanel_LossLocationAddressLabel", kind: "text" },
      city: { id: PREFIX + "LossLocationRoundPanel_LossLoactionCityLabel", kind: "text" },
      state: { id: PREFIX + "LossLocationRoundPanel_LossLocationStateLabel", kind: "text" },
      zip: { id: PREFIX + "LossLocationRoundPanel_LossLocationZipCodeLabel", kind: "text" },
      kindOfLoss: { id: PREFIX + "LossLocationRoundPanel_KindOfLossLabel", kind: "text" },
      homeBuilt: { id: PREFIX + "LossLocationRoundPanel_HomeBuiltLabel", kind: "text" },
      dateOfLoss: { id: PREFIX + "LossLocationRoundPanel_DateOfLossLabel", kind: "text" },
      reportedDate: { id: PREFIX + "LossLocationRoundPanel_ReportDateLabel", kind: "text" },
      potentialLoss: { id: PREFIX + "LossLocationRoundPanel_PotentialLossAmountLabel", kind: "text" },
      aleInvolved: { id: PREFIX + "LossLocationRoundPanel_ALEInvolvedCheckBox", kind: "checkbox" },
      catCode: { id: PREFIX + "LossLocationRoundPanel_CATCodeLabel", kind: "text" },
      reportedBy: { id: PREFIX + "LossLocationRoundPanel_lblReportedBy", kind: "text" },
      lossDescription: { id: PREFIX + "LossLocationRoundPanel_LossDescriptionLabel", kind: "text" },
      instructions: { id: PREFIX + "LossLocationRoundPanel_InstructionLabel", kind: "text" }
    },
    insured: {
      firstName: { id: PREFIX + "InsuredRoundPanel_FirstNameLabel", kind: "text" },
      lastName: { id: PREFIX + "InsuredRoundPanel_LastNameLabel", kind: "text" },
      email: { id: PREFIX + "InsuredRoundPanel_InsuredEmailHyperLink", kind: "linkText" },
      address1: { id: PREFIX + "InsuredRoundPanel_AddressLabel", kind: "text" },
      city: { id: PREFIX + "InsuredRoundPanel_CityLabel", kind: "text" },
      state: { id: PREFIX + "InsuredRoundPanel_StateLabel", kind: "text" },
      zip: { id: PREFIX + "InsuredRoundPanel_ZipCodeLabel", kind: "text" },
      businessPhone: { id: PREFIX + "InsuredRoundPanel_BusinessPhoneLabel", kind: "text" },
      homePhone: { id: PREFIX + "InsuredRoundPanel_HomePhoneLabel", kind: "text" },
      cellPhone: { id: PREFIX + "InsuredRoundPanel_CellPhoneLabel", kind: "text" }
    },
    contractor: {
      name: { id: PREFIX + "ContractorRoundPanel_ContractorLabel", kind: "text" },
      office: { id: PREFIX + "ContractorRoundPanel_OfficeLabel", kind: "text" },
      address1: { id: PREFIX + "ContractorRoundPanel_ContractorAddressLabel", kind: "text" },
      cityState: { id: PREFIX + "ContractorRoundPanel_ContractorCityNStateLabel", kind: "text" },
      zip: { id: PREFIX + "ContractorRoundPanel_ContractorZipCodeLabel", kind: "text" },
      phone: { id: PREFIX + "ContractorRoundPanel_ContractorPhoneLabel", kind: "text" },
      email: { id: PREFIX + "ContractorRoundPanel_ContractorEmailHyperLink", kind: "linkText" },
      xactNetAddress: { id: PREFIX + "ContractorRoundPanel_ContractorXactNetAddressLabel", kind: "text" },
      symbilityId: { id: PREFIX + "ContractorRoundPanel_SymbilityIdLabel", kind: "text" },
      pointOfContact: { id: PREFIX + "ContractorRoundPanel_PointOfContactSelect", kind: "selectText" },
      pocPhone: { id: PREFIX + "ContractorRoundPanel_PhoneLabel", kind: "text" },
      pocEmail: { id: PREFIX + "ContractorRoundPanel_EmailLabel", kind: "text" },
      contractorId: { id: PREFIX + "ContractorRoundPanel_ContractorIdLabel", kind: "text" }
    },
    carrier: {
      mco: { id: PREFIX + "CarrierRoundPanel_MCOHyperLinkLabel", kind: "linkText" },
      mcoPhone: { id: PREFIX + "CarrierRoundPanel_MCOPhoneLabel", kind: "text" },
      mcoEmail: { id: PREFIX + "CarrierRoundPanel_MCOEmailLabel", kind: "linkText" },
      adjuster: { id: PREFIX + "CarrierRoundPanel_AdjusterLabel", kind: "text" },
      adjusterPhone: { id: PREFIX + "CarrierRoundPanel_AdjusterTelephoneLabel", kind: "text" },
      adjusterEmail: { id: PREFIX + "CarrierRoundPanel_AdjusterEmailHyperLink", kind: "linkText" },
      estimateReviewer: { id: PREFIX + "CarrierRoundPanel_EstimateReviewerLabel", kind: "text" },
      estimateReviewerPhone: { id: PREFIX + "CarrierRoundPanel_EstimateReviewerPhoneLabel", kind: "text" },
      estimateReviewerEmail: { id: PREFIX + "CarrierRoundPanel_EstimateReviewerEmailHyperLink", kind: "linkText" }
    },
    altimeter: {
      csg: { id: PREFIX + "CsgRoundPanel_CsgNameLabel", kind: "text" },
      csgPhone: { id: PREFIX + "CsgRoundPanel_CsgPhoneLabel", kind: "text" },
      csgEmail: { id: PREFIX + "CsgRoundPanel_CsgEmailHyperLink", kind: "linkText" },
      rfm: { id: PREFIX + "CsgRoundPanel_RfmNameLabel", kind: "text" },
      rfmPhone: { id: PREFIX + "CsgRoundPanel_RfmPhoneLabel", kind: "text" },
      rfmEmail: { id: PREFIX + "CsgRoundPanel_RfmEmailHyperLink", kind: "linkText" },
      rfa: { id: PREFIX + "CsgRoundPanel_RfaNameLabel", kind: "text" },
      rfaPhone: { id: PREFIX + "CsgRoundPanel_RfaPhoneLabel", kind: "text" },
      rfaEmail: { id: PREFIX + "CsgRoundPanel_RfaEmailHyperLink", kind: "linkText" },
      qualityReview: { id: PREFIX + "CsgRoundPanel_LblAuditor", kind: "text" },
      qualityReviewPhone: { id: PREFIX + "CsgRoundPanel_LblAuditorPhn", kind: "text" },
      qualityReviewEmail: { id: PREFIX + "CsgRoundPanel_HplAuditorEmail", kind: "linkText" }
    },
    policy: {
      policyNumber: { id: PREFIX + "PolicyRoundPanel_PolicyNumberLabel", kind: "text" },
      policyCoverage: { id: PREFIX + "PolicyRoundPanel_PolicyCoverageLabel", kind: "text" },
      policyType: { id: PREFIX + "PolicyRoundPanel_PolicyTypeLabel", kind: "text" },
      policyLimit: { id: PREFIX + "PolicyRoundPanel_PolicyLimitLabel", kind: "text" },
      mortgagor: { id: PREFIX + "PolicyRoundPanel_MortgagorLabel", kind: "text" },
      deductible: { id: PREFIX + "PolicyRoundPanel_DeductibleLabel", kind: "text" }
    }
  };

  function normalizeText(value) {
    return String(value || "").replace(/[\u00a0\s]+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
  }

  function firstNonEmpty(values) {
    return values.find(function hasValue(value) {
      return Boolean(normalizeText(value));
    }) || "";
  }

  function byIdText(id) {
    const node = document.getElementById(id);
    return normalizeText(node ? node.textContent : "");
  }

  function byIdValue(id) {
    const node = document.getElementById(id);
    if (!node) {
      return "";
    }
    if (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT") {
      return normalizeText(node.value);
    }
    return normalizeText(node.textContent);
  }

  function byLinkText(id) {
    const node = document.getElementById(id);
    if (!node) {
      return "";
    }
    return firstNonEmpty([normalizeText(node.textContent), normalizeText(node.getAttribute("href"))]);
  }

  function byCheckbox(id) {
    const node = document.getElementById(id);
    return Boolean(node && node.checked);
  }

  function bySelectText(id) {
    const select = document.getElementById(id);
    if (!select || select.tagName !== "SELECT") {
      return "";
    }
    const option = select.options[select.selectedIndex];
    const text = normalizeText(option ? option.textContent : "");
    if (!text || text.toLowerCase() === "select") {
      return "";
    }
    return text;
  }

  function readField(spec) {
    if (!spec || !spec.id) {
      return "";
    }
    switch (spec.kind) {
      case "checkbox":
        return byCheckbox(spec.id);
      case "selectText":
        return bySelectText(spec.id);
      case "linkText":
        return byLinkText(spec.id);
      case "inputValue":
        return byIdValue(spec.id);
      default:
        return byIdText(spec.id);
    }
  }

  function readSection(sectionKey) {
    const section = ALACRITY_SELECTORS[sectionKey] || {};
    const result = {};
    Object.keys(section).forEach(function eachField(fieldKey) {
      result[fieldKey] = readField(section[fieldKey]);
    });
    return result;
  }

  function parseCityState(value) {
    const text = normalizeText(value);
    const match = text.match(/^(.+?)\s+([A-Z]{2})$/i);
    if (match) {
      return { city: normalizeText(match[1]), state: normalizeText(match[2]).toUpperCase() };
    }
    return { city: text, state: "" };
  }

  function digitsOnlyPhone(value) {
    return normalizeText(value).replace(/\D+/g, "");
  }

  function isMeaningfulPhone(value) {
    const digits = digitsOnlyPhone(value);
    return digits.length >= 7;
  }

  function pickInsuredPhone(insured) {
    return firstNonEmpty([
      isMeaningfulPhone(insured.cellPhone) ? insured.cellPhone : "",
      isMeaningfulPhone(insured.homePhone) ? insured.homePhone : "",
      isMeaningfulPhone(insured.businessPhone) ? insured.businessPhone : ""
    ]);
  }

  function pickSecondaryPhone(insured, primaryDigits) {
    const candidates = [insured.homePhone, insured.cellPhone, insured.businessPhone]
      .map(digitsOnlyPhone)
      .filter(function keep(digits) {
        return digits.length >= 7 && digits !== primaryDigits;
      });
    return candidates[0] || "";
  }

  function parseTitleCustomerName() {
    const title = normalizeText(document.title);
    const match = title.match(/Claim\s*\([^)]+\s+(.+?)\)\s*Detail/i);
    return match ? normalizeText(match[1]) : "";
  }

  function parseUrlParams(location) {
    const loc = location || global.location;
    const params = new URLSearchParams(loc.search || "");
    function pick(key) {
      return normalizeText(params.get(key));
    }
    return {
      claimId: pick("ClaimId"),
      assignmentId: pick("AssignmentId"),
      workOrderId: pick("WorkOrderId"),
      wfWorkflowStepId: pick("WFWorkflowStepId"),
      wfWorkflowId: pick("WFWorkflowId")
    };
  }

  function mapPolicyTypeToPropertyType(policyType, policyCoverage) {
    const combined = normalizeKey([policyType, policyCoverage].join(" "));
    if (combined.indexOf("commercial") !== -1 || combined.indexOf("business") !== -1) {
      return "Commercial";
    }
    if (
      combined.indexOf("home") !== -1 ||
      combined.indexOf("residential") !== -1 ||
      combined.indexOf("dwelling") !== -1
    ) {
      return "Residential";
    }
    return "";
  }

  function derivePayType(insuranceCarrier, claimNumber, policyNumber) {
    if (normalizeText(insuranceCarrier) || normalizeText(claimNumber) || normalizeText(policyNumber)) {
      return "INSURANCE";
    }
    return "";
  }

  function buildNotesFromLoss(loss) {
    const parts = [];
    if (normalizeText(loss.lossDescription)) {
      parts.push(normalizeText(loss.lossDescription));
    }
    if (normalizeText(loss.instructions)) {
      parts.push("Instructions: " + normalizeText(loss.instructions));
    }
    return parts.join("\n\n");
  }

  function deriveLossType(kindOfLoss, lossDescription) {
    const direct = normalizeText(kindOfLoss);
    if (direct) {
      return wcFields.mapLossTypeForTeamAllen
        ? wcFields.mapLossTypeForTeamAllen(direct)
        : direct.toUpperCase();
    }
    const desc = normalizeKey(lossDescription);
    if (!desc) {
      return "";
    }
    const keywords = [
      ["water", "WATER"],
      ["pipe", "WATER"],
      ["mold", "MOLD"],
      ["fire", "FIRE"],
      ["smoke", "SMOKE"],
      ["sewer", "SEWER"],
      ["storm", "STORM"]
    ];
    for (let i = 0; i < keywords.length; i += 1) {
      if (desc.indexOf(keywords[i][0]) !== -1) {
        return keywords[i][1];
      }
    }
    return "";
  }

  function buildFullAddress(address1, city, state, zip) {
    const line1 = normalizeText(address1);
    const cityLine = [normalizeText(city), normalizeText(state), normalizeText(zip)]
      .filter(Boolean)
      .join(" ");
    return [line1, cityLine].filter(Boolean).join(", ");
  }

  function buildImportPayload(doc, location) {
    const claim = readSection("claim");
    const loss = readSection("loss");
    const insured = readSection("insured");
    const contractor = readSection("contractor");
    const carrier = readSection("carrier");
    const altimeter = readSection("altimeter");
    const policy = readSection("policy");

    const customerName = firstNonEmpty([
      [insured.firstName, insured.lastName].filter(Boolean).join(" "),
      parseTitleCustomerName()
    ]);

    const primaryPhoneRaw = pickInsuredPhone(insured);
    const primaryPhone = digitsOnlyPhone(primaryPhoneRaw);
    const secondaryPhone = pickSecondaryPhone(insured, primaryPhone);

    const propertyType = mapPolicyTypeToPropertyType(policy.policyType, policy.policyCoverage);
    const insuranceCarrier = firstNonEmpty([claim.company, carrier.mco]);
    const claimNumber = normalizeText(claim.claimNumber).replace(/\s+/g, "");
    const policyNumber = normalizeText(policy.policyNumber);
    const payType = derivePayType(insuranceCarrier, claimNumber, policyNumber);
    const lossType = deriveLossType(loss.kindOfLoss, loss.lossDescription);
    const notes = buildNotesFromLoss(loss);
    const fullAddress = buildFullAddress(loss.address1, loss.city, loss.state, loss.zip);
    const addLocationFn = wcFields.mapAddLocationForTeamAllen || function noop() {
      return "";
    };

    return {
      source: "alacrity",
      scrapedAt: new Date().toISOString(),
      sourceUrl: (location || global.location).href,
      urlParams: parseUrlParams(location),

      customerName: customerName,
      businessName: "",
      primaryPhone: primaryPhone,
      secondaryPhone: secondaryPhone,
      email: insured.email,
      address1: loss.address1,
      address2: "",
      city: loss.city,
      state: loss.state,
      zip: loss.zip,
      yearBuilt: loss.homeBuilt,
      claimNumber: claimNumber,
      policyNumber: policyNumber,
      insuranceCarrier: insuranceCarrier,
      propertyType: propertyType,
      payType: payType,
      lossType: lossType,
      adjusterName: carrier.adjuster,
      adjusterPhone: digitsOnlyPhone(carrier.adjusterPhone),
      adjusterEmail: carrier.adjusterEmail,
      coordinator: contractor.pointOfContact,
      dateOfLoss: loss.dateOfLoss,
      notes: notes,
      notesUser: notes,
      fullAddress: fullAddress,
      addLocation: addLocationFn(propertyType),
      billAddress: true,

      claim: claim,
      loss: loss,
      insured: insured,
      contractor: contractor,
      carrier: carrier,
      altimeter: altimeter,
      policy: policy
    };
  }

  root.alacrityFields = {
    ALACRITY_SELECTORS,
    PREFIX,
    normalizeText,
    byIdText,
    byIdValue,
    byLinkText,
    bySelectText,
    readSection,
    parseCityState,
    parseUrlParams,
    mapPolicyTypeToPropertyType,
    derivePayType,
    buildNotesFromLoss,
    deriveLossType,
    buildImportPayload,
    buildFullAddress
  };
})(typeof window !== "undefined" ? window : self);

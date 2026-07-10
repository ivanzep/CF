/**
 * Cashflow Tracker — Google Sheets–backed JSON API.
 *
 * Bind this script to a Google Sheet (Extensions > Apps Script), deploy it
 * as a web app (Deploy > New deployment > Web app, access: Anyone), and
 * use the resulting /exec URL as the API endpoint for the static frontend
 * in docs/apps-script-v0.2.html (hosted separately, e.g. on GitHub Pages). All
 * data lives in tabs on the bound spreadsheet.
 *
 * Apps Script web app responses don't carry CORS headers, so a visiting
 * page's fetch()/XHR calls to this URL get blocked reading the response
 * even though the server executes fine ("Load failed" / "Failed to
 * fetch"). To work around that without any header control on our side,
 * this API is designed to be called two CORS-exempt ways instead:
 *
 *   - Reads (GET, action=getProject|loadExampleData): called via a
 *     dynamic <script> tag (JSONP). Pass &callback=NAME and the response
 *     is NAME(<json>) as JavaScript, instead of bare JSON.
 *   - Writes (POST, action=saveProject): called via a hidden
 *     <form target="hidden-iframe"> submission, which is also exempt
 *     from CORS. Fields arrive in e.parameter same as a GET's query
 *     string; "project" is a JSON string field, parsed server-side.
 *
 * Calling either endpoint directly with plain JSON (no callback, a
 * same-origin fetch, or Postman/curl) still works exactly as a normal
 * JSON API — the callback wrapping only kicks in when ?callback=... is
 * present.
 *
 * Optional protection: set a Script Property named API_TOKEN (Project
 * Settings > Script Properties) and every request must then include a
 * matching "token" parameter/field, or it's rejected. Leave it unset for
 * no token check (anyone with the URL can read/write this sheet either way
 * — the token only adds a shared-secret gate on top).
 */

var TAB_SCHEMA = {
  Project: ["id", "name", "client", "address", "description", "projectDate", "capTablePrefPercent", "capTableStartDate", "capTableEndDate"],
  Categories: ["id", "name", "sortOrder"],
  LineItems: ["id", "categoryId", "code", "description", "totalBudget", "scheduleMode", "startDate", "endDate", "sortOrder", "color"],
  Payments: ["id", "lineItemId", "date", "amount"],
  Draws: ["id", "name", "date", "amount", "source", "sortOrder"],
  CapTable: ["id", "name", "role", "ownershipPercent", "sortOrder"],
  Contributions: ["id", "memberId", "date", "amount", "note"],
  Distributions: ["id", "memberId", "date", "amount", "note"],
  CapitalReturns: ["id", "memberId", "date", "amount", "note"],
  BudgetSections: ["id", "name", "sortOrder"],
  BudgetItems: ["id", "sectionId", "description", "linkedLineItemId", "totalBudget", "scheduleMode", "startDate", "endDate", "sortOrder"],
  BudgetPayments: ["id", "budgetItemId", "date", "amount"],
  CellColors: ["lineItemId", "month", "color"],
};

// 1-indexed column numbers that hold dates, per tab. Formatted as plain
// text so Sheets never silently reinterprets "2026-01-01" as a date serial.
var DATE_COLUMNS = {
  Project: [6, 8, 9],
  LineItems: [7, 8],
  Payments: [3],
  Draws: [3],
  Contributions: [3],
  Distributions: [3],
  CapitalReturns: [3],
  BudgetItems: [7, 8],
  BudgetPayments: [3],
  CellColors: [2],
};

function doGet(e) {
  ensureSheetsExist_();
  var params = (e && e.parameter) || {};
  var result = computeAction_(params.action || "getProject", params);
  if (params.callback) {
    return ContentService
      .createTextOutput(params.callback + "(" + JSON.stringify(result) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOutput_(result);
}

function doPost(e) {
  ensureSheetsExist_();
  var payload;
  if (e && e.postData && e.postData.type === "application/json") {
    // Plain JSON POST (same-origin fetch, curl, Postman, etc).
    try {
      payload = JSON.parse(e.postData.contents || "{}");
    } catch (err) {
      return jsonOutput_({ error: "Invalid JSON body" });
    }
  } else {
    // Hidden-form submission: fields arrive as e.parameter, "project" as a JSON string.
    payload = Object.assign({}, (e && e.parameter) || {});
    if (typeof payload.project === "string") {
      try {
        payload.project = JSON.parse(payload.project);
      } catch (err) {
        return jsonOutput_({ error: "Invalid project JSON" });
      }
    }
  }
  var result = computeAction_(payload.action, payload);
  if (payload.callback) {
    return ContentService
      .createTextOutput(payload.callback + "(" + JSON.stringify(result) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOutput_(result);
}

/** Runs the requested action and returns a plain result object (never wraps it — callers decide JSON vs JSONP). */
function computeAction_(action, payload) {
  payload = payload || {};
  if (!checkToken_(payload)) {
    return { error: "Unauthorized: missing or incorrect token" };
  }
  try {
    if (action === "getProject") return getProject();
    if (action === "saveProject") {
      saveProject(payload.project);
      return { ok: true };
    }
    if (action === "loadExampleData") return loadExampleData();
    return { error: "Unknown action: " + action };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  }
}

function checkToken_(payload) {
  var required = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
  if (!required) return true;
  return payload && payload.token === required;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function genId_(prefix) {
  return prefix + "_" + Utilities.getUuid().slice(0, 8);
}

function getSs_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Creates any missing tabs (with header rows) and locks date columns to plain text. Safe to call repeatedly. */
function ensureSheetsExist_() {
  var ss = getSs_();
  var names = Object.keys(TAB_SCHEMA);
  names.forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, TAB_SCHEMA[name].length).setValues([TAB_SCHEMA[name]]);
    }
    (DATE_COLUMNS[name] || []).forEach(function (col) {
      sheet.getRange(1, col, Math.max(sheet.getMaxRows(), 1000)).setNumberFormat("@");
    });
  });
  // Remove the default "Sheet1" Google adds to brand-new spreadsheets, if it's still empty and unused.
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && names.indexOf("Sheet1") === -1 && defaultSheet.getLastRow() === 0 && ss.getSheets().length > names.length) {
    ss.deleteSheet(defaultSheet);
  }
}

function readTab_(name) {
  var sheet = getSs_().getSheetByName(name);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = TAB_SCHEMA[name].length;
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.filter(function (row) {
    return row.some(function (cell) { return cell !== "" && cell !== null; });
  });
}

function writeTab_(name, rows) {
  var sheet = getSs_().getSheetByName(name);
  var lastCol = TAB_SCHEMA[name].length;
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).clearContent();
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, lastCol).setValues(rows);
  }
}

function str_(v) {
  if (v == null || v === "") return "";
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(v);
}
function strOrNull_(v) {
  var s = str_(v);
  return s === "" ? null : s;
}
function num_(v) {
  return v === "" || v == null ? 0 : Number(v);
}
function numOrNull_(v) {
  return v === "" || v == null ? null : Number(v);
}

/** Reads every tab and assembles the nested Project object the client expects. */
function getProject() {
  ensureSheetsExist_();

  var projectRow = readTab_("Project")[0] || [];
  var lineItems = readTab_("LineItems").map(function (row) {
    return {
      id: str_(row[0]),
      categoryId: strOrNull_(row[1]),
      code: strOrNull_(row[2]),
      description: str_(row[3]),
      totalBudget: num_(row[4]),
      scheduleMode: str_(row[5]) || "EVEN",
      startDate: strOrNull_(row[6]),
      endDate: strOrNull_(row[7]),
      sortOrder: num_(row[8]),
      color: strOrNull_(row[9]),
      payments: [],
    };
  });
  var lineItemsById = {};
  lineItems.forEach(function (li) { lineItemsById[li.id] = li; });
  readTab_("Payments").forEach(function (row) {
    var li = lineItemsById[str_(row[1])];
    if (li) li.payments.push({ id: str_(row[0]), date: str_(row[2]), amount: num_(row[3]) });
  });

  var capTable = readTab_("CapTable").map(function (row) {
    return {
      id: str_(row[0]),
      name: str_(row[1]),
      role: str_(row[2]) || "LP",
      ownershipPercent: numOrNull_(row[3]),
      sortOrder: num_(row[4]),
      contributions: [],
      distributions: [],
      capitalReturns: [],
    };
  });
  var membersById = {};
  capTable.forEach(function (m) { membersById[m.id] = m; });
  readTab_("Contributions").forEach(function (row) {
    var m = membersById[str_(row[1])];
    if (m) m.contributions.push({ id: str_(row[0]), date: str_(row[2]), amount: num_(row[3]), note: strOrNull_(row[4]) });
  });
  readTab_("Distributions").forEach(function (row) {
    var m = membersById[str_(row[1])];
    if (m) m.distributions.push({ id: str_(row[0]), date: str_(row[2]), amount: num_(row[3]), note: strOrNull_(row[4]) });
  });
  readTab_("CapitalReturns").forEach(function (row) {
    var m = membersById[str_(row[1])];
    if (m) m.capitalReturns.push({ id: str_(row[0]), date: str_(row[2]), amount: num_(row[3]), note: strOrNull_(row[4]) });
  });

  var budgetItems = readTab_("BudgetItems").map(function (row) {
    return {
      id: str_(row[0]),
      sectionId: strOrNull_(row[1]),
      description: str_(row[2]),
      linkedLineItemId: strOrNull_(row[3]),
      totalBudget: num_(row[4]),
      scheduleMode: str_(row[5]) || "EVEN",
      startDate: strOrNull_(row[6]),
      endDate: strOrNull_(row[7]),
      sortOrder: num_(row[8]),
      payments: [],
    };
  });
  var budgetItemsById = {};
  budgetItems.forEach(function (bi) { budgetItemsById[bi.id] = bi; });
  readTab_("BudgetPayments").forEach(function (row) {
    var bi = budgetItemsById[str_(row[1])];
    if (bi) bi.payments.push({ id: str_(row[0]), date: str_(row[2]), amount: num_(row[3]) });
  });

  return {
    id: getSs_().getId(),
    name: str_(projectRow[1]) || "Untitled Project",
    client: strOrNull_(projectRow[2]),
    address: strOrNull_(projectRow[3]),
    description: strOrNull_(projectRow[4]),
    projectDate: str_(projectRow[5]) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    capTableSettings: {
      prefPercent: num_(projectRow[6]),
      startDate: strOrNull_(projectRow[7]),
      endDate: strOrNull_(projectRow[8]),
    },
    categories: readTab_("Categories").map(function (row) {
      return { id: str_(row[0]), name: str_(row[1]), sortOrder: num_(row[2]) };
    }),
    lineItems: lineItems,
    draws: readTab_("Draws").map(function (row) {
      return { id: str_(row[0]), name: str_(row[1]), date: str_(row[2]), amount: num_(row[3]), source: strOrNull_(row[4]), sortOrder: num_(row[5]) };
    }),
    capTable: capTable,
    budgetSections: readTab_("BudgetSections").map(function (row) {
      return { id: str_(row[0]), name: str_(row[1]), sortOrder: num_(row[2]) };
    }),
    budgetItems: budgetItems,
    cashflowCellColors: readTab_("CellColors").map(function (row) {
      return { lineItemId: str_(row[0]), month: str_(row[1]), color: str_(row[2]) };
    }),
  };
}

/** Overwrites every tab from the client's in-memory project object. */
function saveProject(project) {
  ensureSheetsExist_();

  var capSettings = project.capTableSettings || {};
  writeTab_("Project", [[project.id, project.name || "", project.client || "", project.address || "", project.description || "", project.projectDate || "",
    capSettings.prefPercent || 0, capSettings.startDate || "", capSettings.endDate || ""]]);
  writeTab_("Categories", project.categories.map(function (c) { return [c.id, c.name, c.sortOrder]; }));
  writeTab_("LineItems", project.lineItems.map(function (li) {
    return [li.id, li.categoryId || "", li.code || "", li.description, li.totalBudget, li.scheduleMode, li.startDate || "", li.endDate || "", li.sortOrder, li.color || ""];
  }));
  writeTab_("Payments", project.lineItems.reduce(function (acc, li) {
    return acc.concat(li.payments.map(function (p) { return [p.id, li.id, p.date, p.amount]; }));
  }, []));
  writeTab_("Draws", project.draws.map(function (d) { return [d.id, d.name, d.date, d.amount, d.source || "", d.sortOrder]; }));
  writeTab_("CapTable", project.capTable.map(function (m) { return [m.id, m.name, m.role, m.ownershipPercent == null ? "" : m.ownershipPercent, m.sortOrder]; }));
  writeTab_("Contributions", project.capTable.reduce(function (acc, m) {
    return acc.concat(m.contributions.map(function (c) { return [c.id, m.id, c.date, c.amount, c.note || ""]; }));
  }, []));
  writeTab_("Distributions", project.capTable.reduce(function (acc, m) {
    return acc.concat(m.distributions.map(function (d) { return [d.id, m.id, d.date, d.amount, d.note || ""]; }));
  }, []));
  writeTab_("CapitalReturns", project.capTable.reduce(function (acc, m) {
    return acc.concat((m.capitalReturns || []).map(function (r) { return [r.id, m.id, r.date, r.amount, r.note || ""]; }));
  }, []));
  writeTab_("BudgetSections", (project.budgetSections || []).map(function (s) { return [s.id, s.name, s.sortOrder]; }));
  writeTab_("BudgetItems", (project.budgetItems || []).map(function (bi) {
    return [bi.id, bi.sectionId || "", bi.description, bi.linkedLineItemId || "", bi.totalBudget, bi.scheduleMode, bi.startDate || "", bi.endDate || "", bi.sortOrder];
  }));
  writeTab_("BudgetPayments", (project.budgetItems || []).reduce(function (acc, bi) {
    return acc.concat(bi.payments.map(function (p) { return [p.id, bi.id, p.date, p.amount]; }));
  }, []));
  writeTab_("CellColors", (project.cashflowCellColors || []).map(function (c) { return [c.lineItemId, c.month, c.color]; }));

  return true;
}

/** Populates the bound sheet with the La Costa Hotel example dataset, then returns the reloaded project. */
function loadExampleData() {
  var data = EXAMPLE_DATA;
  var categories = data.categories.map(function (c) { return { id: genId_("cat"), name: c.name, sortOrder: c.sortOrder }; });
  var categoryIdByName = {};
  categories.forEach(function (c) { categoryIdByName[c.name] = c.id; });

  var lineItems = data.lineItems.map(function (li) {
    return {
      id: genId_("li"),
      categoryId: li.category ? categoryIdByName[li.category] || null : null,
      code: li.code,
      description: li.description,
      totalBudget: li.totalBudget,
      scheduleMode: li.scheduleMode,
      startDate: li.startDate,
      endDate: li.endDate,
      sortOrder: li.sortOrder,
      payments: li.payments.map(function (p) { return { id: genId_("pay"), date: p.date, amount: p.amount }; }),
    };
  });

  var draws = data.draws.map(function (d) {
    return { id: genId_("draw"), name: d.name, date: d.date, amount: d.amount, source: d.source, sortOrder: d.sortOrder };
  });

  var capTable = data.capTable.map(function (m, i) {
    return {
      id: genId_("member"),
      name: m.name,
      role: m.role,
      ownershipPercent: m.ownershipPercent,
      sortOrder: i,
      contributions: m.contributions.map(function (c) { return { id: genId_("contrib"), date: c.date, amount: c.amount, note: c.note }; }),
      distributions: m.distributions.map(function (d) { return { id: genId_("dist"), date: d.date, amount: d.amount, note: d.note }; }),
      capitalReturns: [],
    };
  });

  var project = getProject();
  project.name = "La Costa Hotel";
  project.categories = categories;
  project.lineItems = lineItems;
  project.draws = draws;
  project.capTable = capTable;
  // Line items get fresh ids above, so any existing budget items/cell colors that
  // reference the old ids would be orphaned — reset along with everything else.
  project.budgetSections = [];
  project.budgetItems = [];
  project.cashflowCellColors = [];

  saveProject(project);
  return project;
}

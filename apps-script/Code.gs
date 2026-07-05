/**
 * Cashflow Tracker — Google Sheets–backed web app.
 *
 * Bind this script to a Google Sheet (Extensions > Apps Script), deploy it
 * as a web app (Deploy > New deployment > Web app), and open the resulting
 * URL. All data lives in tabs on the bound spreadsheet; this file is the
 * only server-side logic, everything else runs in Index.html in the
 * visitor's browser.
 */

var TAB_SCHEMA = {
  Project: ["id", "name", "client", "address", "description", "projectDate"],
  Categories: ["id", "name", "sortOrder"],
  LineItems: ["id", "categoryId", "code", "description", "totalBudget", "scheduleMode", "startDate", "endDate", "sortOrder"],
  Payments: ["id", "lineItemId", "date", "amount"],
  Draws: ["id", "name", "date", "amount", "source", "sortOrder"],
  CapTable: ["id", "name", "role", "ownershipPercent", "sortOrder"],
  Contributions: ["id", "memberId", "date", "amount", "note"],
  Distributions: ["id", "memberId", "date", "amount", "note"],
};

// 1-indexed column numbers that hold dates, per tab. Formatted as plain
// text so Sheets never silently reinterprets "2026-01-01" as a date serial.
var DATE_COLUMNS = {
  Project: [6],
  LineItems: [7, 8],
  Payments: [3],
  Draws: [3],
  Contributions: [3],
  Distributions: [3],
};

function doGet() {
  ensureSheetsExist_();
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Cashflow Tracker")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
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

  return {
    id: getSs_().getId(),
    name: str_(projectRow[1]) || "Untitled Project",
    client: strOrNull_(projectRow[2]),
    address: strOrNull_(projectRow[3]),
    description: strOrNull_(projectRow[4]),
    projectDate: str_(projectRow[5]) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    categories: readTab_("Categories").map(function (row) {
      return { id: str_(row[0]), name: str_(row[1]), sortOrder: num_(row[2]) };
    }),
    lineItems: lineItems,
    draws: readTab_("Draws").map(function (row) {
      return { id: str_(row[0]), name: str_(row[1]), date: str_(row[2]), amount: num_(row[3]), source: strOrNull_(row[4]), sortOrder: num_(row[5]) };
    }),
    capTable: capTable,
  };
}

/** Overwrites every tab from the client's in-memory project object. */
function saveProject(project) {
  ensureSheetsExist_();

  writeTab_("Project", [[project.id, project.name || "", project.client || "", project.address || "", project.description || "", project.projectDate || ""]]);
  writeTab_("Categories", project.categories.map(function (c) { return [c.id, c.name, c.sortOrder]; }));
  writeTab_("LineItems", project.lineItems.map(function (li) {
    return [li.id, li.categoryId || "", li.code || "", li.description, li.totalBudget, li.scheduleMode, li.startDate || "", li.endDate || "", li.sortOrder];
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
    };
  });

  var project = getProject();
  project.name = "La Costa Hotel";
  project.categories = categories;
  project.lineItems = lineItems;
  project.draws = draws;
  project.capTable = capTable;

  saveProject(project);
  return project;
}

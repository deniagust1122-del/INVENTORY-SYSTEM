export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: SISTEM INVENTARIS GUDANG KYOKKO BEACH (WEB APP BACKEND)
 * ==============================================================================
 * Skrip ini dipasang di Google Sheets (Extensions > Apps Script).
 * Deploy sebagai Web App dengan akses: "Anyone" (Siapa saja).
 */

const SPREADSHEET_ID = "1Qd3WWCAgsftGsVf1VMX-ZXgopA9QzYPL33VvpHMgn9o";

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

/**
 * Handle GET requests (Reads)
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    var ss = getSpreadsheet();
    
    if (action === "read") {
      var sheetName = e.parameter.sheet;
      var rangeStr = e.parameter.range || "";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return createJsonResponse({ status: "error", error: "Sheet '" + sheetName + "' tidak ditemukan." });
      }
      
      var values;
      if (rangeStr) {
        values = sheet.getRange(rangeStr).getValues();
      } else {
        values = sheet.getDataRange().getValues();
      }
      
      // Convert dates to ISO string or formatted string to avoid JSON serialisation issues
      var formattedValues = values.map(function(row) {
        return row.map(function(cell) {
          if (cell instanceof Date) {
            return Utilities.formatDate(cell, Session.getScriptTimeZone(), "yyyy-MM-dd");
          }
          return cell;
        });
      });
      
      return createJsonResponse({ status: "success", values: formattedValues });
    }
    
    return createJsonResponse({ status: "error", error: "Action tidak valid." });
  } catch (err) {
    return createJsonResponse({ status: "error", error: err.toString() });
  }
}

/**
 * Handle POST requests (Writes: Update / Append)
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var ss = getSpreadsheet();
    
    if (action === "update") {
      var sheetName = payload.sheet;
      var rangeStr = payload.range;
      var values = payload.values;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return createJsonResponse({ status: "error", error: "Sheet '" + sheetName + "' tidak ditemukan." });
      }
      
      var range = sheet.getRange(rangeStr);
      range.setValues(values);
      return createJsonResponse({ status: "success" });
    }
    
    if (action === "append") {
      var sheetName = payload.sheet;
      var values = payload.values;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return createJsonResponse({ status: "error", error: "Sheet '" + sheetName + "' tidak ditemukan." });
      }
      
      for (var i = 0; i < values.length; i++) {
        sheet.appendRow(values[i]);
      }
      return createJsonResponse({ status: "success" });
    }
    
    return createJsonResponse({ status: "error", error: "Action tidak dikenal." });
  } catch (err) {
    return createJsonResponse({ status: "error", error: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
`;

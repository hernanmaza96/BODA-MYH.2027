// Pegá este código en Google Apps Script (ver LEEME.txt)
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(["Fecha", "Nombre", "Apellido", "Personas", "Asiste", "Dieta", "Mensaje"]);
  }
  hoja.appendRow([new Date(), d.nombre, d.apellido, d.personas, d.asiste, d.dieta, d.mensaje]);
  return ContentService.createTextOutput("ok");
}

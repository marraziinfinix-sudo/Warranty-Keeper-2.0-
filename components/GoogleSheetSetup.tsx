
import React, { useState } from 'react';
import { GoogleDriveIcon } from './icons/Icons';

interface GoogleSheetSetupProps {
    currentUrl: string;
    onSave: (url: string) => void;
    onClose: () => void;
}

const GoogleSheetSetup: React.FC<GoogleSheetSetupProps> = ({ currentUrl, onSave, onClose }) => {
    const [url, setUrl] = useState(currentUrl);
    const [showInstructions, setShowInstructions] = useState(false);

    const handleSave = () => {
        onSave(url);
    };

    const appsScriptCode = `const SHEET_NAME = "Sheet1";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const json = data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const body = JSON.parse(e.postData.contents);
  try {
    switch(body.action) {
      case 'add': return addRecord(sheet, body.payload);
      case 'update': return updateRecord(sheet, body.payload);
      case 'delete': return deleteRecord(sheet, body.payload);
      default: return createResponse({ status: "error", message: "Invalid action" });
    }
  } catch (err) {
    return createResponse({ status: "error", message: err.message });
  }
}

function addRecord(sheet, payload) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => payload[header] ?? "");
  sheet.appendRow(newRow);
  return createResponse({ status: "success", data: payload });
}

function updateRecord(sheet, payload) {
  const idToUpdate = payload.id;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumnIndex = headers.indexOf('id');
  const rowIndexToUpdate = data.findIndex(row => row[idColumnIndex] == idToUpdate);
  if (rowIndexToUpdate > 0) {
    const newRow = headers.map(header => payload[header] ?? "");
    sheet.getRange(rowIndexToUpdate + 1, 1, 1, newRow.length).setValues([newRow]);
    return createResponse({ status: "success", data: payload });
  }
  return createResponse({ status: "error", message: "Record not found" });
}

function deleteRecord(sheet, payload) {
   const idToDelete = payload.id;
   const data = sheet.getDataRange().getValues();
   const headers = data[0];
   const idColumnIndex = headers.indexOf('id');
   const rowIndexToDelete = data.findIndex(row => row[idColumnIndex] == idToDelete);
   if (rowIndexToDelete > 0) {
     sheet.deleteRow(rowIndexToDelete + 1);
     return createResponse({ status: "success", message: "Record deleted" });
   }
   return createResponse({ status: "error", message: "Record not found" });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">Connect to Google Drive</h2>
                    
                    {!showInstructions ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-6">
                                To export your data, connect this app to a Google Sheet in your Google Drive.
                            </p>
                            <button
                                onClick={() => setShowInstructions(true)}
                                className="inline-flex items-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50"
                            >
                                <GoogleDriveIcon />
                                Select File from Google Drive
                            </button>
                            <p className="text-xs text-gray-400 mt-4">
                                This will guide you through a one-time setup process.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-6">
                                Please follow the steps below carefully to create a secure connection to your sheet.
                            </p>

                            <div className="space-y-4 text-sm text-gray-800">
                                <details className="bg-gray-50 p-3 rounded-lg" open>
                                    <summary className="font-semibold cursor-pointer">Step 1: Create your Google Sheet</summary>
                                    <div className="mt-2 pl-4 border-l-2">
                                        <p>1. Create a new sheet at <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sheets.new</a>.</p>
                                        <p>2. In the first row, create the following headers exactly (from cell A1 to Q1):</p>
                                        <code className="block bg-gray-200 p-2 rounded-md text-xs mt-1 overflow-x-auto">
                                            id customerName phoneNumber email productName serialNumber purchaseDate installDate productWarrantyPeriod productWarrantyUnit installationWarrantyPeriod installationWarrantyUnit state district postcode buildingType otherBuildingType
                                        </code>
                                    </div>
                                </details>
                                <details className="bg-gray-50 p-3 rounded-lg" open>
                                    <summary className="font-semibold cursor-pointer">Step 2: Create & Deploy a Web App Script</summary>
                                    <div className="mt-2 pl-4 border-l-2 space-y-2">
                                        <p>1. In your sheet, go to <strong>Extensions &gt; Apps Script</strong>.</p>
                                        <p>2. Delete any existing code and paste the entire script below:</p>
                                        <textarea readOnly className="w-full h-32 text-xs bg-gray-200 p-2 rounded-md font-mono mt-1" defaultValue={appsScriptCode} />
                                        <p>3. Click <strong>Deploy &gt; New deployment</strong>.</p>
                                        <p>4. Next to "Select type", click the gear icon and select <strong>Web app</strong>.</p>
                                        <p>5. For "Who has access", select <strong>"Anyone"</strong> (this allows the app to send data, but only you can access the sheet).</p>
                                        <p>6. Click <strong>Deploy</strong>, authorize the permissions, and <strong>copy the Web app URL</strong>.</p>
                                    </div>
                                </details>
                                <details className="bg-gray-50 p-3 rounded-lg" open>
                                    <summary className="font-semibold cursor-pointer">Step 3: Paste the URL below</summary>
                                    <div className="mt-2">
                                        <label htmlFor="scriptUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                           Your Web App URL
                                        </label>
                                        <input
                                            type="url"
                                            id="scriptUrl"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://script.google.com/macros/s/..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                                        />
                                    </div>
                                </details>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                    {showInstructions && (
                        <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition">Save & Connect</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoogleSheetSetup;

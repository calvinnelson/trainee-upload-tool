const { google } = require("googleapis");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });
const FOLDER_ID = "1vLWDxwkILKsEtsJzF9ASgKM6ACSAbw1R";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { filename, fileData, traineeInfo } = body;

    if (!filename || !fileData || !traineeInfo.name || !traineeInfo.type) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const buffer = Buffer.from(fileData.split(",")[1], "base64");

    const response = await drive.files.create({
      requestBody: {
        name: `[${traineeInfo.type}] ${traineeInfo.name} - ${filename}`,
        parents: [FOLDER_ID],
        description: `Uploaded by ${traineeInfo.name} on ${new Date().toISOString()}`,
      },
      media: {
        mimeType: "application/octet-stream",
        body: buffer,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fileId: response.data.id,
        message: `Uploaded ${filename}`,
      }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Upload failed",
        details: error.message,
      }),
    };
  }
};

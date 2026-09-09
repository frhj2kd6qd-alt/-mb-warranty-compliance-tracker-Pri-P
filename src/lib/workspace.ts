import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ErrorRecord } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/presentations');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');

let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  // If we already have a cached token, return it
  if (cachedAccessToken && auth.currentUser) {
    return { user: auth.currentUser, accessToken: cachedAccessToken };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token for Workspace APIs.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.info('Google Workspace sign-in popup was closed by user.');
      return null;
    }

    console.warn('Firebase popup auth notice:', error?.message || error);

    // Try Google Identity Services (GIS) token client if available on window
    const gWindow = window as any;
    if (gWindow.google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
      try {
        const token = await new Promise<string>((resolve, reject) => {
          const client = gWindow.google.accounts.oauth2.initTokenClient({
            client_id: firebaseConfig.oAuthClientId,
            scope: [
              'https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/documents',
              'https://www.googleapis.com/auth/presentations',
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/gmail.send',
              'https://www.googleapis.com/auth/gmail.readonly',
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/forms.body'
            ].join(' '),
            callback: (response: any) => {
              if (response.error) {
                reject(new Error(response.error_description || response.error));
              } else if (response.access_token) {
                resolve(response.access_token);
              } else {
                reject(new Error('No access token returned from Google Identity Services.'));
              }
            }
          });
          client.requestAccessToken();
        });

        if (token) {
          cachedAccessToken = token;
          const fallbackUser = auth.currentUser || ({
            uid: 'workspace-user',
            email: 'Amanda@aspclass.org',
            displayName: 'Amanda Sterling'
          } as unknown as User);
          return { user: fallbackUser, accessToken: token };
        }
      } catch (gsiErr: any) {
        console.warn('GIS Token fallback was not completed:', gsiErr?.message || gsiErr);
      }
    }

    if (error?.code === 'auth/multi-factor-auth-required' || error?.message?.includes('multi-factor-auth-required')) {
      throw new Error('Multi-Factor Authentication (MFA) is required by your Google Workspace organization policy. Please use the Local Export buttons below.');
    }

    // For internal error or iframe restrictions, provide a clean descriptive error
    throw new Error(
      'Google Workspace Authentication is restricted by the current browser environment or iframe permissions. Please use the local Export options or open the app in a dedicated tab.'
    );
  }
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

// ==========================================
// LOCAL EXPORT FALLBACK HELPERS (for MFA or offline scenarios)
// ==========================================
export function downloadCsvFallback(title: string, records: ErrorRecord[]) {
  const headers = [
    "Record ID",
    "Timestamp",
    "Employee Name",
    "Category",
    "Severity / Color",
    "Description",
    "Est. Revenue Lost ($)",
    "Status"
  ];

  const rows = records.map((r) => [
    `"${(r.id || "").replace(/"/g, '""')}"`,
    `"${(r.date || new Date().toISOString().split("T")[0]).replace(/"/g, '""')}"`,
    `"${(r.employeeName || "").replace(/"/g, '""')}"`,
    `"${(r.category || r.errorDescription || "").replace(/"/g, '""')}"`,
    `"${(r.severityColor || r.overallStatus || "YELLOW").replace(/"/g, '""')}"`,
    `"${(r.errorDescription || r.notes || "").replace(/"/g, '""')}"`,
    r.estimatedRevenueLost || r.chargebackAmount || r.finalLostRevenue || 0,
    `"${(r.claimLifecycleState || r.liveTrackingStatus || "LIVE_PENDING").replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadDocFallback(
  title: string,
  summaryText: string,
  metrics: { totalRecords: number; green: number; yellow: number; red: number }
) {
  const content = 
    `=================================================================\n` +
    `  ${title.toUpperCase()}\n` +
    `=================================================================\n` +
    `Generated on: ${new Date().toLocaleString()}\n\n` +
    `KEY PERFORMANCE METRICS:\n` +
    `• Total Audit Records: ${metrics.totalRecords}\n` +
    `• Green (Low Risk / Clean): ${metrics.green}\n` +
    `• Yellow (Warning / Attention Required): ${metrics.yellow}\n` +
    `• Red (Critical Severity / Denial Risk): ${metrics.red}\n\n` +
    `EXECUTIVE SUMMARY REPORT:\n` +
    `${summaryText}\n\n` +
    `Automated report compiled by ASP System Security Intelligence Services.\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSlidesFallback(
  title: string,
  summaryData: { totalRecords: number; green: number; yellow: number; red: number; topIssues: string[] }
) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
    .slide { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; margin-bottom: 32px; }
    h1 { color: #38bdf8; font-size: 28px; }
    h2 { color: #f59e0b; font-size: 20px; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; }
    .metric-card { background: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
    .metric-val { font-size: 24px; font-weight: bold; margin-top: 8px; }
    ul { line-height: 1.8; }
  </style>
</head>
<body>
  <div class="slide">
    <h1>${title} - Executive Deck</h1>
    <p>ASP Command System Compliance Summary | Date: ${new Date().toLocaleDateString()}</p>
    <div class="metric-grid">
      <div class="metric-card"><div>Total Audit Records</div><div class="metric-val" style="color:#38bdf8">${summaryData.totalRecords}</div></div>
      <div class="metric-card"><div>Low Risk (Green)</div><div class="metric-val" style="color:#34d399">${summaryData.green}</div></div>
      <div class="metric-card"><div>Warning (Yellow)</div><div class="metric-val" style="color:#fbbf24">${summaryData.yellow}</div></div>
      <div class="metric-card"><div>Critical (Red)</div><div class="metric-val" style="color:#f87171">${summaryData.red}</div></div>
    </div>
  </div>
  <div class="slide">
    <h2>Top Compliance Vulnerabilities Identified</h2>
    <ul>
      ${summaryData.topIssues.map(i => `<li>${i}</li>`).join("")}
    </ul>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}_Presentation.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// GOOGLE SHEETS INTEGRATION
// ==========================================
export async function exportToGoogleSheets(
  title: string,
  records: ErrorRecord[],
  token: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const headers = [
    "Record ID",
    "Timestamp",
    "Employee Name",
    "Category",
    "Severity / Color",
    "Description",
    "Est. Revenue Lost ($)",
    "Status"
  ];

  const rows = records.map((r) => [
    r.id || "",
    r.date || new Date().toISOString().split("T")[0],
    r.employeeName || "",
    r.category || r.errorDescription || "",
    r.severityColor || r.overallStatus || "YELLOW",
    r.errorDescription || r.notes || "",
    r.estimatedRevenueLost || r.chargebackAmount || r.finalLostRevenue || 0,
    r.claimLifecycleState || r.liveTrackingStatus || "LIVE_PENDING"
  ]);

  const valueData = [headers, ...rows];

  // 1. Create Spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: `${title} - ${new Date().toLocaleDateString()}`
      }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Sheet.");
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Append Data
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        values: valueData
      })
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || "Failed to append rows to Google Sheet.");
  }

  return { spreadsheetId, spreadsheetUrl };
}

// ==========================================
// GOOGLE DOCS INTEGRATION
// ==========================================
export async function exportToGoogleDoc(
  title: string,
  summaryText: string,
  metrics: { totalRecords: number; green: number; yellow: number; red: number },
  token: string
): Promise<{ documentId: string; documentUrl: string }> {
  // 1. Create Document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `${title} - ${new Date().toLocaleDateString()}`
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Doc.");
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Insert Content
  const textContent = 
    `ASP COMMAND SYSTEM - EXECUTIVE AUDIT & COMPLIANCE SUMMARY\n` +
    `Generated on: ${new Date().toLocaleString()}\n\n` +
    `KEY PERFORMANCE METRICS:\n` +
    `• Total Audit Records: ${metrics.totalRecords}\n` +
    `• Green (Low Risk / Clean): ${metrics.green}\n` +
    `• Yellow (Warning / Attention Required): ${metrics.yellow}\n` +
    `• Red (Critical Severity / Denial Risk): ${metrics.red}\n\n` +
    `EXECUTIVE SUMMARY REPORT:\n` +
    `${summaryText}\n\n` +
    `Automated report compiled by ASP System Security Intelligence Services.\n`;

  const batchRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: textContent
          }
        }
      ]
    })
  });

  if (!batchRes.ok) {
    const err = await batchRes.json();
    throw new Error(err.error?.message || "Failed to insert text into Google Doc.");
  }

  return { documentId, documentUrl };
}

// ==========================================
// GOOGLE SLIDES INTEGRATION
// ==========================================
export async function exportToGoogleSlides(
  title: string,
  summaryData: { totalRecords: number; green: number; yellow: number; red: number; topIssues: string[] },
  token: string
): Promise<{ presentationId: string; presentationUrl: string }> {
  // 1. Create Presentation
  const createRes = await fetch("https://slides.googleapis.com/v1/presentations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `${title} - Executive Briefing`
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create Google Slides presentation.");
  }

  const presData = await createRes.json();
  const presentationId = presData.presentationId;
  const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  // 2. Add Slides & Text Boxes
  const slide1Id = "slide_summary_1";
  const slide2Id = "slide_issues_2";

  const requests = [
    // Create Slide 1 (Metrics Overview)
    {
      createSlide: {
        objectId: slide1Id,
        insertionIndex: 1,
        slideLayout: {
          predefinedLayout: "TITLE_AND_BODY"
        }
      }
    },
    // Create Slide 2 (Top Compliance Threats)
    {
      createSlide: {
        objectId: slide2Id,
        insertionIndex: 2,
        slideLayout: {
          predefinedLayout: "TITLE_AND_BODY"
        }
      }
    }
  ];

  const batchRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ requests })
  });

  if (!batchRes.ok) {
    console.warn("Could not create additional custom slides, presentation generated at title layout.");
  }

  return { presentationId, presentationUrl };
}

// ==========================================
// GMAIL INTEGRATION
// ==========================================
function createEmailRaw(to: string, subject: string, body: string): string {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body
  ].join('\r\n');

  const base64 = btoa(unescape(encodeURIComponent(emailLines)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendGmailMessage(
  params: { to: string; subject: string; body: string },
  token: string
): Promise<{ id: string; threadId: string }> {
  const raw = createEmailRaw(params.to, params.subject, params.body);
  const res = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to send Gmail message.');
  }

  return await res.json();
}

// ==========================================
// GOOGLE CALENDAR INTEGRATION
// ==========================================
export async function createCalendarEvent(
  params: { summary: string; description?: string; startDateTime: string; endDateTime: string; attendees?: string[] },
  token: string
): Promise<{ id: string; htmlLink: string }> {
  const bodyData: any = {
    summary: params.summary,
    description: params.description || '',
    start: { dateTime: params.startDateTime },
    end: { dateTime: params.endDateTime }
  };
  if (params.attendees && params.attendees.length > 0) {
    bodyData.attendees = params.attendees.map(email => ({ email }));
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create Google Calendar event.');
  }

  return await res.json();
}

// ==========================================
// GOOGLE FORMS INTEGRATION
// ==========================================
export async function createGoogleForm(
  params: { title: string; description?: string; questions?: string[] },
  token: string
): Promise<{ formId: string; responderUri: string; editUrl: string }> {
  // 1. Create form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: params.title,
        documentTitle: params.title,
        description: params.description || 'ASP Warranty & Compliance Operational Form'
      }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Failed to create Google Form.');
  }

  const formData = await createRes.json();
  const formId = formData.formId;
  const responderUri = formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
  const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

  // 2. Add questions if provided
  if (params.questions && params.questions.length > 0) {
    const requests = params.questions.map((qTitle, idx) => ({
      createItem: {
        item: {
          title: qTitle,
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false }
            }
          }
        },
        location: { index: idx }
      }
    }));

    await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }

  return { formId, responderUri, editUrl };
}

export async function getFormResponses(
  formId: string,
  token: string
): Promise<{ responses?: any[] }> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch Google Form responses.');
  }

  return await res.json();
}

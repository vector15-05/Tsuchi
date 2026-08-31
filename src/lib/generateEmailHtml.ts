export const generateEmailHtml = (animeTitle: string, episodeNumber: number) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const dashboardUrl = `${frontendUrl}/dashboard`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px; border-bottom: 1px solid #27272a;">
              <span style="font-family: 'Geist Mono', SFMono-Regular, Consolas, monospace; font-size: 16px; font-weight: 700; letter-spacing: 3px; color: #ffffff;">
                TSUCHI
              </span>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 8px 0; font-family: 'Geist Mono', SFMono-Regular, Consolas, monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #a1a1aa;">
                New Episode Released
              </p>
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                ${animeTitle}
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #d4d4d8; line-height: 1.5;">
                Episode ${episodeNumber} is now out.
              </p>
              
              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #ffffff;">
                    <a href="${dashboardUrl}" target="_blank" style="font-family: 'Geist Mono', SFMono-Regular, Consolas, monospace; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; color: #09090b; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #09090b; border-top: 1px solid #27272a;">
              <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                You are receiving this notification because you subscribed to updates for ${animeTitle} on Tsuchi.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
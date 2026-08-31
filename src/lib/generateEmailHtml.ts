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
<body style="margin: 0; padding: 0; background-color: #050508; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card with Red/Blue Aesthetic -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0d0e17; border: 1px solid #232238; border-top: 3px solid #3437a0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px; border-bottom: 1px solid #1b192e; background-color: #0b0b13;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: 'Geist Mono', SFMono-Regular, Consolas, monospace; font-size: 16px; font-weight: 800; letter-spacing: 4px; color: #ffffff;">
                      TSUCHI
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #b41e3c;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <!-- Episode Badge -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="background-color: #1a1b3a; border: 1px solid #3437a0; border-radius: 6px; padding: 4px 10px;">
                    <span style="font-family: 'Geist Mono', SFMono-Regular, Consolas, monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #7eb3ff;">
                      NEW EPISODE RELEASED
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                ${animeTitle}
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #a1a1aa; line-height: 1.5;">
                Episode <span style="color: #7eb3ff; font-weight: 600;">${episodeNumber}</span> is now out and available to watch.
              </p>
              
              <!-- CTA Button (matching background color) -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #0d0e17; border: 1px solid #3437a0;">
                    <a href="${dashboardUrl}" target="_blank" style="font-family: 'Geist Mono', SFMono-Regular, Consolas, monospace; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block;">
                      VIEW DASHBOARD
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 18px 28px; background-color: #07070c; border-top: 1px solid #1a1829;">
              <p style="margin: 0; font-size: 12px; color: #616173; line-height: 1.5;">
                You are receiving this notification because you subscribed to updates for <strong style="color: #8b8ba7;">${animeTitle}</strong> on Tsuchi.
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
/**
 * Tessbin Academy - Bulletproof A4 Hardcopy Print Helper
 * High-fidelity printing supporting both isolated off-screen iframe print and clean popup preview.
 */

const getPrintStyles = (title) => {
  let stylesHtml = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
    try {
      stylesHtml += el.outerHTML + '\n';
    } catch {
      // Ignore cross-origin stylesheet read restrictions if any
    }
  });

  const printOverrides = `
    <style>
      @page {
        size: A4 portrait;
        margin: 4mm 5mm;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Helvetica, sans-serif !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        display: block !important;
        visibility: visible !important;
        -webkit-font-smoothing: antialiased !important;
      }
      .tessbin-a4-screen-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
        display: block !important;
        visibility: visible !important;
        width: 100% !important;
      }
      .tessbin-a4-sheet {
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        visibility: visible !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .tessbin-a4-sheet * {
        visibility: visible !important;
      }
      .tessbin-a4-frame {
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        visibility: visible !important;
        border: 1.5px solid #0f172a !important;
        outline: 0.5px solid #0f172a !important;
        outline-offset: 1px !important;
        padding: 3.5mm 5mm 2.5mm !important;
        box-sizing: border-box !important;
        height: auto !important;
        min-height: 270mm !important;
        max-height: 284mm !important;
        background: #ffffff !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .no-print {
        display: none !important;
        visibility: hidden !important;
      }
      table thead {
        display: table-header-group !important;
      }
      tr, .tessbin-a4-section, .tessbin-a4-sign-grid, .tessbin-a4-doc-grid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      img {
        max-width: 100% !important;
      }
    </style>
  `;

  return { stylesHtml, printOverrides };
};

/**
 * Smart DOM element resolver for A4 containers
 */
const resolveA4Element = (elementId) => {
  if (!elementId) {
    return document.querySelector('.tessbin-a4-sheet') || document.querySelector('.tessbin-a4-frame');
  }

  // Exact ID
  let el = document.getElementById(elementId);
  if (el) return el;

  // Prefix matching ID
  el = document.querySelector(`[id^="${elementId}"]`);
  if (el) return el;

  // Generic class matches
  el = document.querySelector('.tessbin-a4-sheet') || document.querySelector('.tessbin-a4-frame');
  return el;
};

export const printA4Element = (elementId, title = 'TESBINN_Trade_Ethiopia_School_of_Business_and_Innovation') => {
  const element = resolveA4Element(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Remove previous iframe if present
  const oldFrame = document.getElementById('tessbin-print-frame');
  if (oldFrame) {
    oldFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'tessbin-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const { stylesHtml, printOverrides } = getPrintStyles(title);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${stylesHtml}
        ${printOverrides}
      </head>
      <body>
        <div class="tessbin-a4-sheet">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  const images = Array.from(doc.images);
  const imagePromises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Iframe print failed, falling back to new window:', err);
      openA4InNewWindow(elementId, title);
    }
  };

  Promise.all(imagePromises).then(() => {
    setTimeout(doPrint, 250);
  });
};

export const openA4InNewWindow = (elementId, title = 'Tessbin_Official_A4_Registration_Dossier') => {
  const element = resolveA4Element(elementId);
  if (!element) return;

  const { stylesHtml, printOverrides } = getPrintStyles(title);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    printA4Element(elementId, title);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${stylesHtml}
        ${printOverrides}
      </head>
      <body style="background: #0b0f19; padding: 20px 0;">
        <div class="tessbin-a4-screen-wrapper">
          <div class="tessbin-a4-sheet" style="box-shadow: 0 4px 20px rgba(0,0,0,0.4); border: 1px solid #cbd5e1;">
            ${element.innerHTML}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

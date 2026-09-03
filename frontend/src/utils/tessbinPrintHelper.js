/**
 * Tessbin Academy - Bulletproof A4 Hardcopy Print Helper
 * Fixes the blank/empty print bug caused by zero-sized or visibility:hidden iframes.
 * Provides both isolated off-screen iframe printing and new-tab preview printing.
 */

const getPrintStyles = (title) => {
  // Collect all active stylesheets and style tags from current document
  let stylesHtml = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
    stylesHtml += el.outerHTML + '\n';
  });

  const printOverrides = `
    <style>
      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Segoe UI', Arial, Helvetica, sans-serif !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        display: block !important;
        visibility: visible !important;
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
        display: block !important;
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
        display: block !important;
        visibility: visible !important;
        border: 1.5px solid #0f172a !important;
        outline: 0.5px solid #0f172a !important;
        outline-offset: 1px !important;
        padding: 4mm 6mm !important;
        box-sizing: border-box !important;
        height: auto !important;
        background: #ffffff !important;
      }
      .no-print {
        display: none !important;
        visibility: hidden !important;
      }
    </style>
  `;

  return { stylesHtml, printOverrides };
};

export const printA4Element = (elementId, title = 'TESBINN_Trade_Ethiopia_School_of_Business_and_Innovation') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Remove any previously created print iframe
  const oldFrame = document.getElementById('tessbin-print-frame');
  if (oldFrame) {
    oldFrame.remove();
  }

  // Create an off-screen iframe with REAL positive layout dimensions (NOT visibility:hidden or 0x0)
  const iframe = document.createElement('iframe');
  iframe.id = 'tessbin-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.style.width = '794px'; // standard A4 96 DPI pixel width
  iframe.style.height = '1123px'; // standard A4 96 DPI pixel height
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

  // Ensure all images are loaded before invoking print
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
      console.error('Iframe print failed, falling back to window.print():', err);
      window.print();
    }
  };

  Promise.all(imagePromises).then(() => {
    setTimeout(doPrint, 250);
  });
};

/**
 * Alternative fallback: opens the hardcopy in a dedicated clean window for viewing and printing
 */
export const openA4InNewWindow = (elementId, title = 'Tessbin_Official_A4_Registration_Dossier') => {
  const element = document.getElementById(elementId);
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
      <body>
        <div class="tessbin-a4-screen-wrapper" style="padding: 20px 0;">
          <div class="tessbin-a4-sheet" style="box-shadow: 0 4px 16px rgba(0,0,0,0.15); border: 1px solid #cbd5e1;">
            ${element.innerHTML}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

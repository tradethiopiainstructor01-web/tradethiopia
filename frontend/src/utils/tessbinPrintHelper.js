/**
 * Tessbin Academy - Bulletproof A4 Hardcopy Print Helper
 * High-fidelity printing supporting seamless direct print and isolated popup preview.
 */

const getStandalonePrintCss = () => `
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
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Helvetica, 'Times New Roman', sans-serif !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    display: block !important;
    visibility: visible !important;
    -webkit-font-smoothing: antialiased !important;
  }
  .no-print, header, nav, aside, button {
    display: none !important;
    visibility: hidden !important;
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
    padding: 3mm 4.5mm 2.5mm !important;
    box-sizing: border-box !important;
    height: auto !important;
    min-height: 270mm !important;
    max-height: 282mm !important;
    background: #ffffff !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .tessbin-a4-header {
    border-bottom: 2px solid #0f172a !important;
    padding-bottom: 3.5px !important;
    margin-bottom: 3px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
  }
  .tessbin-a4-title-bar {
    background: #0f172a !important;
    color: #ffffff !important;
    text-align: center !important;
    padding: 2.5px 5px !important;
    margin: 2px 0 4px !important;
    border-radius: 2px !important;
  }
  .tessbin-a4-title-text-en {
    font-size: 8.5pt !important;
    font-weight: 900 !important;
    letter-spacing: 1px !important;
    text-transform: uppercase !important;
    margin: 0 !important;
    color: #ffffff !important;
  }
  .tessbin-a4-title-text-am {
    font-size: 7pt !important;
    font-weight: 700 !important;
    margin: 1px 0 0 !important;
    color: #cbd5e1 !important;
  }
  .tessbin-a4-section-title {
    background: #1e293b !important;
    color: #ffffff !important;
    font-size: 6.8pt !important;
    font-weight: 800 !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
    padding: 2px 5px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border: 1px solid #0f172a !important;
    border-bottom: none !important;
  }
  .tessbin-a4-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 6.8pt !important;
    margin: 0 !important;
  }
  .tessbin-a4-table th, .tessbin-a4-table td {
    border: 1px solid #1e293b !important;
    padding: 2px 4px !important;
    text-align: left !important;
    vertical-align: middle !important;
  }
  .tessbin-a4-table th {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    font-weight: 800 !important;
    font-size: 6.5pt !important;
    text-transform: uppercase !important;
  }
  .tessbin-a4-table td.label-cell {
    background-color: #f8fafc !important;
    color: #334155 !important;
    font-weight: 700 !important;
    width: 24% !important;
  }
  .tessbin-a4-table td.value-cell {
    color: #000000 !important;
    font-weight: 700 !important;
  }
  .tessbin-a4-photo-frame {
    width: 26mm !important;
    height: 32mm !important;
    border: 1.5px solid #0f172a !important;
    background: #f8fafc !important;
    overflow: hidden !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .tessbin-a4-photo-stamp {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background: #0f172a !important;
    color: #ffffff !important;
    font-size: 4.8pt !important;
    font-weight: 900 !important;
    text-align: center !important;
    padding: 1px !important;
  }
  .tessbin-a4-pledge-box {
    border: 1px solid #1e293b !important;
    background: #fafafa !important;
    padding: 2.5px 5px !important;
    margin-top: 2.5px !important;
    font-size: 5.8pt !important;
    line-height: 1.2 !important;
    color: #1e293b !important;
    text-align: justify !important;
  }
  .tessbin-a4-sign-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr 1fr !important;
    gap: 6px !important;
    align-items: center !important;
    border: 1px solid #1e293b !important;
    padding: 3px 6px !important;
    background: #ffffff !important;
    margin-top: 2.5px !important;
  }
  .tessbin-a4-sign-col {
    text-align: center !important;
    font-size: 6.2pt !important;
  }
  .tessbin-a4-sign-line {
    border-bottom: 1px solid #0f172a !important;
    width: 88% !important;
    margin: 10px auto 2px !important;
  }
  .tessbin-a4-hardcopy-footer {
    border-top: 1px solid #0f172a !important;
    padding-top: 2px !important;
    margin-top: 3px !important;
    font-size: 5.5pt !important;
    color: #475569 !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
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
`;

const resolveA4Element = (elementId) => {
  if (!elementId) {
    return document.querySelector('.tessbin-a4-sheet') || document.querySelector('.tessbin-a4-frame');
  }
  let el = document.getElementById(elementId);
  if (el) return el;
  el = document.querySelector(`[id^="${elementId}"]`);
  if (el) return el;
  el = document.querySelector('.tessbin-a4-sheet') || document.querySelector('.tessbin-a4-frame');
  return el;
};

/**
 * Direct, high-fidelity A4 document printing
 */
export const printA4Element = (elementId, title = 'TESBINN_Trade_Ethiopia_School_of_Business_and_Innovation') => {
  const element = resolveA4Element(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not found, invoking native window.print()`);
    window.print();
    return;
  }

  // Mark print target and trigger print directly
  element.classList.add('tessbin-print-active-target');
  document.body.classList.add('tessbin-printing-active');

  const cleanup = () => {
    element.classList.remove('tessbin-print-active-target');
    document.body.classList.remove('tessbin-printing-active');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Short delay to ensure browser layout is updated before opening print dialog
  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 1500);
  }, 100);
};

/**
 * Opens document in a dedicated preview tab with full CSS and auto-print
 */
export const openA4InNewWindow = (elementId, title = 'Tessbin_Official_A4_Registration_Dossier') => {
  const element = resolveA4Element(elementId);
  if (!element) return;

  const standaloneCss = getStandalonePrintCss();
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
        <style>
          ${standaloneCss}
          body {
            background-color: #0b0f19;
            padding: 20px 0;
            display: flex;
            justify-content: center;
          }
          .tessbin-a4-sheet {
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 1px solid #cbd5e1;
          }
          @media screen {
            .preview-toolbar {
              position: fixed;
              top: 10px;
              right: 10px;
              z-index: 9999;
              display: flex;
              gap: 8px;
            }
            .preview-btn {
              padding: 8px 16px;
              background: #2563eb;
              color: #fff;
              border: none;
              border-radius: 6px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .preview-btn:hover {
              background: #1d4ed8;
            }
            .close-btn {
              background: #374151;
            }
            .close-btn:hover {
              background: #4b5563;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar no-print">
          <button class="preview-btn" onclick="window.print()">Print A4 Document</button>
          <button class="preview-btn close-btn" onclick="window.close()">Close</button>
        </div>
        <div class="tessbin-a4-screen-wrapper">
          <div class="tessbin-a4-sheet">
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

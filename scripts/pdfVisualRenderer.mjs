import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

export async function renderPdfToPng(pdfBuffer, outputPrefix) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  const base64Pdf = pdfBuffer.toString('base64')
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        body { margin: 0; padding: 0; background: #222; }
        .page-canvas { display: block; margin: 10px auto; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
      </style>
    </head>
    <body>
      <div id="pages-container"></div>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const raw = atob('${base64Pdf}');
        const uint8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          uint8Array[i] = raw.charCodeAt(i);
        }

        async function renderAll() {
          const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
          const pdf = await loadingTask.promise;
          window.totalPages = pdf.numPages;
          const container = document.getElementById('pages-container');
          for (let p = 1; p <= pdf.numPages; p++) {
            const pageObj = await pdf.getPage(p);
            const viewport = pageObj.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.id = 'canvas-page-' + p;
            canvas.className = 'page-canvas';
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            container.appendChild(canvas);
            await pageObj.render({
              canvasContext: canvas.getContext('2d'),
              viewport: viewport
            }).promise;
          }
          window.renderDone = true;
        }
        renderAll().catch(e => { window.renderError = e.message; });
      </script>
    </body>
    </html>
  `

  await page.setContent(htmlContent)
  await page.waitForFunction(() => window.renderDone === true || window.renderError !== undefined, { timeout: 20000 })
  
  const error = await page.evaluate(() => window.renderError)
  if (error) {
    await browser.close()
    throw new Error('PDF.js render error: ' + error)
  }

  const numPages = await page.evaluate(() => window.totalPages)
  const savedImages = []

  for (let p = 1; p <= numPages; p++) {
    const canvas = await page.$('#canvas-page-' + p)
    const imgPath = `${outputPrefix}_page_${p}.png`
    await canvas.screenshot({ path: imgPath })
    savedImages.push(imgPath)
  }

  await browser.close()
  return { numPages, savedImages }
}

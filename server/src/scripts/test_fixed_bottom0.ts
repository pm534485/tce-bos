import puppeteer from 'puppeteer';
import fs from 'fs';

async function test() {
  const browser = await puppeteer.launch({ headless: true, pipe: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    .print-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #000;
      padding-top: 4px;
      font-size: 8pt;
      font-family: Arial, sans-serif;
      background: #fff;
    }
    .content-body {
      padding-bottom: 25px;
    }
  </style>
  </head>
  <body>
    <div class="print-footer">
      <span>Passed in BoS Meeting 30.05.2026</span>
      <span>Approved in 71<sup>st</sup> Academic council meeting 27.06.2026</span>
    </div>
    <div class="content-body">
      <div style="height: 800px; background: #eee;">Page 1 content</div>
      <div style="height: 800px; background: #ddd;">Page 2 content</div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  fs.writeFileSync('exports/test_fixed_bottom0.pdf', pdf);
  console.log('Saved exports/test_fixed_bottom0.pdf');
  await browser.close();
}

test().catch(console.error);

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
      margin-top: 18mm;
      margin-bottom: 20mm;
      margin-left: 15mm;
      margin-right: 15mm;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    .running-header {
      position: fixed;
      top: -12mm;
      left: 0;
      right: 0;
      text-align: right;
      font-size: 8.5pt;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
    }
    .running-footer {
      position: fixed;
      bottom: -14mm;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #000;
      border-top: 1px solid #000;
      padding-top: 4px;
      font-family: Arial, Helvetica, sans-serif;
    }
  </style>
  </head>
  <body>
    <div class="running-header">M.Sc. (Data Science) Degree Program 2026-27</div>
    <div class="running-footer">
      <span>Passed in BoS Meeting 30.05.2026</span>
      <span>Approved in 71<sup>st</sup> Academic council meeting 27.06.2026</span>
    </div>

    <div style="height: 900px; background: #fafafa; border: 1px solid #ccc; padding: 20px;">
      <h1>Page 1 Content</h1>
      <p>Content goes here...</p>
    </div>
    <div style="height: 900px; background: #f0f0f0; border: 1px solid #ccc; padding: 20px;">
      <h1>Page 2 Content</h1>
      <p>Content goes here...</p>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  fs.writeFileSync('exports/test_fixed_pos.pdf', pdf);
  console.log('Success! Saved exports/test_fixed_pos.pdf');
  await browser.close();
}

test().catch(console.error);

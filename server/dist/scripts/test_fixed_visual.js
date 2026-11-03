import puppeteer from 'puppeteer';
async function test() {
    const browser = await puppeteer.launch({ headless: true, pipe: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
    <style>
      @page {
        size: A4 portrait;
        margin: 15mm 15mm 15mm 15mm;
      }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 25px;
        border-top: 1px solid #000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 8pt;
        background: #fff;
      }
      .page-header {
        position: fixed;
        top: 0;
        right: 0;
        height: 20px;
        font-size: 8.5pt;
        text-align: right;
      }
      .content {
        padding-top: 25px;
        padding-bottom: 35px;
      }
    </style>
    </head>
    <body>
      <div class="page-header">M.Sc. (Data Science) Degree Program 2026-27</div>
      <div class="page-footer">
        <span>Passed in BoS Meeting 30.05.2026</span>
        <span>Approved in 71<sup>st</sup> Academic council meeting 27.06.2026</span>
      </div>
      <div class="content">
        <div style="height: 800px; background: #eee;">Page 1 Content</div>
        <div style="height: 800px; background: #ddd;">Page 2 Content</div>
      </div>
    </body>
    </html>
  `);
    await page.pdf({ format: 'A4', path: 'exports/test_fixed_visual.pdf', printBackground: true });
    console.log('Done test_fixed_visual.pdf');
    await browser.close();
}
test().catch(console.error);

// import fs from 'fs';
// import path from 'path';
// import Handlebars from 'handlebars';
// import puppeteer, { PaperFormat } from 'puppeteer';

// export interface PdfOptions {
//   html: string;
//   format?: 'letter' | 'legal' | 'tabloid' | 'ledger' | 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6';
//   printBackground?: boolean;
//   margin?: { top?: string; right?: string; bottom?: string; left?: string };
// }

// export default class PdfHelper {
//   private static templatesDir = path.join(process.cwd(), 'src/lib/templates');
//   private static cache: Record<string, Handlebars.TemplateDelegate> = {};

//   /**
//    * Load and compile a Handlebars template by name (filename without extension)
//    */
//   private static loadTemplate(name: string): Handlebars.TemplateDelegate {
//     if (this.cache[name]) {
//       return this.cache[name];
//     }

//     const filePath = path.join(this.templatesDir, `${name}.html`);
//     if (!fs.existsSync(filePath)) {
//       throw new Error(`Template file not found: ${filePath}`);
//     }

//     const source = fs.readFileSync(filePath, 'utf8');
//     const template = Handlebars.compile(source);
//     this.cache[name] = template;
//     return template;
//   }

//   /**
//    * Generate a PDF Buffer from a named template and data payload
//    * @param templateName  Template filename (without .html)
//    * @param data          Key/value map for template placeholders
//    * @param options       PDF formatting options
//    */
//   public static async generate(
//     templateName: string,
//     data: any,
//     options?: PdfOptions
//   ): Promise<Uint8Array<ArrayBufferLike>> {
//     const tpl = this.loadTemplate(templateName);
//     const html = tpl(data);

//     const browser = await puppeteer.launch({
//       args: ['--no-sandbox', '--disable-setuid-sandbox'],
//       headless: true
//     });

//     try {
//       const page = await browser.newPage();
//       await page.setContent(html, {
//         waitUntil: 'networkidle0',
//         timeout: 30000
//       });

//       const pdfBuffer = await page.pdf({
//         format: (options?.format?.toUpperCase() || 'A4') as PaperFormat,
//         printBackground: options?.printBackground ?? true,
//         margin: options?.margin || undefined,
//         timeout: 30000
//       });

//       return pdfBuffer;
//     } finally {
//       await browser.close();
//     }
//   }
// }
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { PDFDocument, PageSizes } = require("pdf-lib");
const info = require("../bookInfo");
const { footerTemplate } = require("./templates");

const savePath = ext => path.join(__dirname, "../book/book." + ext);

async function printPDF() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(info.localURL, {
      waitUntil: "networkidle2",
      timeout: 0
    });
    const book = await page.pdf({
      displayHeaderFooter: true,
      printBackground: true,
      format: "A4",
      margin: {
        top: "100px",
        bottom: "100px"
      },
      headerTemplate: " ",
      footerTemplate
    });
    await browser.close();
    const pdfDoc = await PDFDocument.load(book);
    const newPage = pdfDoc.insertPage(0, PageSizes.A4);
    const imageBytes = fs.readFileSync(path.join(__dirname, info.cover));
    const image = await pdfDoc.embedPng(imageBytes);
    pdfDoc.setTitle(info.title);
    pdfDoc.setAuthor(info.author);
    pdfDoc.setSubject(info.subject);
    pdfDoc.setKeywords(info.keywords);

    // Get the width and height of the first page
    const { width, height } = newPage.getSize();

    newPage.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();
    fs.writeFile(savePath("pdf"), pdfBytes, function(err) {
      if (err) {
        return console.log(err);
      }

      console.log("pdf built");
    });
  } catch (e) {
    console.log(e);
  }
}

printPDF();

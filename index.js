import puppeteer from "puppeteer";
import fs from "fs/promises";
import { createWriteStream, existsSync, mkdir } from "fs";
import * as url from "url";
import path from "path";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

var browser = await puppeteer.launch({ headless: "new" });
var page = await browser.newPage();

const link =
  "https://www.nettruyenmax.com/truyen-tranh/crayon-shin-chan-cau-be-but-chi-51660";

await page.goto(link);

var tenTruyen = await page.evaluate(
  () => document.querySelector("#item-detail > h1").textContent
);

console.log(tenTruyen);

try {
  await fs.mkdir(tenTruyen);
} catch (error) {
  console.log("mkdir: " + error);
}

// const getChap = async (url, chap) => {
//   await page.goto(url);
//   console.log(chap);
//   const content = await page.evaluate((chap1) => {
//     return (
//       `<section><h2>Chap ${chap1} </h2>` +
//       document.querySelector(".reading").innerHTML +
//       "</section>"
//     );
//   }, chap);

//   await fs.writeFile("./test.html", content, { flag: "a+" });
// };

// const forLoop = async () => {
//   console.log("Start");

//   console.log("End");
// };

// await forLoop();

const links = await page.evaluate(() => {
  const a = document.querySelectorAll(
    "#nt_listchapter > nav > ul > li > div > a"
  );
  let res = [];
  for (let i = 0; i < a.length; i++) {
    res = [...res, a[i].href];
  }
  return res;
});

// console.log(links);

// const img = await page.evaluate(() => {
//   return document.querySelector("#page_4 > img").src;
// });

// const imgPage = await page.goto(img);
// await fs.writeFile("test.jpg", await imgPage.buffer());

let soChap;

page.on("response", async (response) => {
  if (response.request().resourceType() === "document") {
    const html = await response.text(); // lấy nội dung của phản hồi dưới dạng chuỗi HTML
    let soChap2 = await page.evaluate((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html"); // chuyển đổi chuỗi HTML thành DOM document
      return doc.querySelector("h1 > span").innerHTML.replace("- ", "");
    }, html);

    if (soChap2) soChap = soChap2;
    if (!existsSync(`${tenTruyen}/${soChap}`))
      await fs.mkdir(`${tenTruyen}/${soChap}`);
  }
  console.log(`soChap: ${soChap}`);

  // await fs.mkdir(`${tenTruyen}/${soChap}`);

  const url = response.url();
  if (response.request().resourceType() === "image") {
    // response
    //   .buffer()
    //   .then(async (file) => {
    //     const fileName = url.split("/").pop();
    //     if (fileName.includes("jpg?data")) {
    //       const filePath = path.resolve(`${tenTruyen}/${soChap}`, fileName);
    //       const writeStream = createWriteStream(filePath);
    //       writeStream.write(file);
    //     }
    //   })
    //   .catch((err) => {
    //     console.error("buffer error: " + err);
    //   });
    try {
      const file = await response.buffer();
      const fileName = url.split("/").pop();
      if (fileName.includes("jpg?data")) {
        if (!existsSync(`${tenTruyen}/${soChap}`))
          await fs.mkdir(`${tenTruyen}/${soChap}`);
        const filePath = path.resolve(`${tenTruyen}/${soChap}`, fileName);
        const writeStream = createWriteStream(filePath);
        writeStream.write(file);
      }
    } catch (err) {
      console.error("buffer error: " + err);
    }
  }
});

for (let link of links) {
  await page.goto(link);
  await timeout(10000);
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// await page.goto(links[links.length - 1]);

await browser.close();

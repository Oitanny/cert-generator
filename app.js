const fs=require("fs")
const moment=require("moment")
const express=require("express")
const PDFDocument=require("pdfkit")
const QRCode = require("qrcode");
const { createCanvas } = require("canvas");
const csvparse = require("csv-parse");
const path = require('path');


let parsedData; 
const csvData = fs.readFileSync('./data_file/GDSC_MSCW.csv', 'utf8');
const parseCSV = () => {
    return new Promise((resolve, reject) => {
      const parser = csvparse.parse(csvData, { columns: true, delimiter: "," });
      const data = [];
  
      parser.on("data", (row) => {
        data.push(row);
      });
  
      parser.on("end", () => {
        parsedData = data;
        resolve();
      });
  
      parser.on("error", (err) => {
        reject(err);
      });
    });
  };

parseCSV()
    .then(() => {
      console.log("CSV parsing completed");
    })
    .catch((error) => {
      console.error("Error parsing CSV:", error);
    });
  
const app = express();
const port = 3000;
const generateCertificate = async (name, link, res) => {
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    bufferPages: true,
  });

  doc.image("images/certificate_2.png", 0, 0, { width: 842 });
  doc.fillColor("#3D3D3D");
  doc.font("fonts/OpenSans-Bold.ttf");
  doc.fontSize(29).text(name, 249, 157, {
    align: "left",
  });
  const qrCodeDataURL = await QRCode.toDataURL(link, {
    version: 6, // QR code version
  });
  doc.image(qrCodeDataURL, 738, 497, { width: 70 });

  doc.end();
  // Pipe the PDF content directly to the response
  doc.pipe(res, { end: false });

  // Handle end event to close the response stream
  doc.on('end', () => {
    res.end();
  });
};


app.use(express.static(path.join(__dirname, 'public'))); 

app.get("/getUserInfo", async (req, res) => {
  const userEmail = req.query.email;
  const user = parsedData.find((entry) => entry.Email === userEmail);

  if (user) {
    try {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${user.Name}.pdf`);
      generateCertificate(user.Name, user.ProfileLink, res);
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  } else {
    res.status(404).send("User not found");
  }
});



  
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const fs=require("fs")
const moment=require("moment")
const express=require("express")
const PDFDocument=require("pdfkit")
const QRCode = require("qrcode");
const { createCanvas } = require("canvas");
const csvparse = require("csv-parse");
const path = require('path');

let parsedData; // Initialize parsedData variable

const csvData = fs.readFileSync('./data_file/GDSC_MSCW.csv', 'utf8');
// const parsedData = csvparse.parse(csvData, { columns: true, delimiter:',' }).on("data", function (row) {
//     console.log(row);
//   });

const parseCSV = () => {
    return new Promise((resolve, reject) => {
      const parser = csvparse.parse(csvData, { columns: true, delimiter: "," });
      const data = [];
  
      parser.on("data", (row) => {
        console.log(row);
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
  
  // Initialize parsedData by calling parseCSV
  parseCSV()
    .then(() => {
      console.log("CSV parsing completed");
    })
    .catch((error) => {
      console.error("Error parsing CSV:", error);
    });
  
const app = express();
const port = 3000;
console.log(csvData)
const generateCertificate = async (name,link) => {
const doc=new PDFDocument({
    layout:"landscape",
    size:"A4",
})

const fileName = `${name}.pdf`;
const filePath = path.join(__dirname, fileName);


doc.pipe(fs.createWriteStream(`${name}.pdf`))

doc.image("images/certificate_2.png",0,0,{width:842})

doc.fillColor("#3D3D3D")

doc.font("fonts/OpenSans-Bold.ttf")

doc.fontSize(29).text(name,249,157,{
align:"left",

})

// Generate QR code
// await QRCode.toFile(`./images/qr_code/${name}.png`, link,{
//     version: 6, // QR code version

// });

const qrCodeDataURL = await QRCode.toDataURL(link, {
    version: 6, // QR code version
});
// Draw QR code on the PDF
// doc.image(`images/qr_code/${name}.png`, 738, 497, {width:70});


doc.image(qrCodeDataURL, 738, 497, { width: 70 });

doc.end()
await fs.promises.readFile(filePath);

return filePath;

}

app.use(express.static(path.join(__dirname, 'public')));

// app.get('/getUserInfo', (req, res) => {
//     const userEmail = req.query.email;
//     console.log("Hello")
//     // Find user in the CSV data
//     const user = parsedData.find(entry => entry.Email === userEmail);

//     if (user) {
//         // Generate and send certificate
//         generateCertificate(user.name, user.link)
//             .then((fileName) => {
//                 // Send the generated PDF as an attachment
//                 res.attachment(fileName);
//                 res.sendFile(fileName, { root: __dirname }, (err) => {
//                     if (err) {
//                         console.error('Error sending file:', err);
//                         res.status(500).send('Internal Server Error');
//                     } else {
//                         // Remove the generated PDF file after it's sent
//                         fs.unlinkSync(fileName);
//                     }
//                 });
//             })
//             .catch((error) => {
//                 console.error('Error generating certificate:', error);
//                 res.status(500).json({ error: 'Internal Server Error' });
//             });
//     } else {
//         res.status(404).json({ error: 'User not found' });
//     }
// });
app.get("/getUserInfo", (req, res) => {
    const userEmail = req.query.email;
    console.log("Hello");
  
    // Find user in the CSV data
    const user = parsedData.find((entry) => entry.Email === userEmail);
  
    if (user) {
      // Generate and send certificate
      generateCertificate(user.Name, user.ProfileLink)
        .then((fileName) => {
          // Send the generated PDF as an attachment
          res.attachment(fileName);
  
          // Ensure that the file exists before trying to send it
          if (fs.existsSync(fileName)) {
            res.json({ success: true, message: "Downloading your document..."});

            res.sendFile(fileName, (err) => {
              if (err) {
                console.error("Error sending file:", err);
                res.status(500).send("Internal Server Error");
              } else {
                
                // Remove the generated PDF file after it's sent
                fs.unlinkSync(fileName);

              }
            });
          } else {
            console.error("Error: File does not exist");
            res.status(500).send("Internal Server Error");
          }
        })
        .catch((error) => {
          console.error("Error generating certificate:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
    } else {
        res.json({ success: false, message:"Unable to find participant, please make sure you input the correct email id" });
      res.status(404).json({ error: "User not found" });
    }
  });
  
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

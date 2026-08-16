const qr = require("qrcode-terminal");

const expoUrl = process.argv[2] || "exp://172.20.10.2:8081";
console.log(`Expo Go : ${expoUrl}\n`);
qr.generate(expoUrl, { small: false });

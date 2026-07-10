const sharp = require("sharp");

const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
    '<rect width="600" height="400" fill="#6d8bff"/>' +
    '<circle cx="300" cy="200" r="120" fill="#2fd47e"/>' +
    '<text x="300" y="360" font-size="40" fill="#fff" text-anchor="middle">Hello</text>' +
    "</svg>"
);

Promise.all([
  sharp(svg).jpeg({ quality: 92 }).toFile("test-assets/sample.jpg"),
  sharp(svg).png().toFile("test-assets/sample.png"),
])
  .then(() => console.log("images created"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

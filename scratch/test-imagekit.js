const fs = require("fs");
const path = require("path");
const ImageKit = require("imagekit");

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

console.log("Testing ImageKit with:");
console.log("Public Key:", env.IMAGEKIT_PUBLIC_KEY ? "Present (starts with " + env.IMAGEKIT_PUBLIC_KEY.slice(0, 10) + "...)" : "Missing");
console.log("Private Key:", env.IMAGEKIT_PRIVATE_KEY ? "Present" : "Missing");
console.log("URL Endpoint:", env.IMAGEKIT_URL_ENDPOINT);

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

async function testUpload() {
  try {
    // 1x1 transparent PNG as base64
    const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const res = await imagekit.upload({
      file: sampleBase64,
      fileName: `test-${Date.now()}.png`,
      folder: "/school_lms/test",
    });

    console.log("✓ ImageKit Upload Success!");
    console.log("File ID:", res.fileId);
    console.log("File URL:", res.url);
  } catch (err) {
    console.error("✗ ImageKit Upload Failed:", err);
  }
}

testUpload();

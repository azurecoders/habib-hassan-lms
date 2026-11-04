const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

async function purge() {
  await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 10 });
  const db = mongoose.connection.db;

  console.log("Connected to MongoDB. Purging all collections except Admin users & school...");

  // Collections to wipe completely
  const collectionsToWipe = [
    "schoolclasses",
    "subjects",
    "timetables",
    "academicyears",
    "studentprofiles",
    "staffprofiles",
    "attendances",
    "staffattendances",
    "exams",
    "examresults",
    "feestructures",
    "feeinvoices",
    "notices",
  ];

  for (const colName of collectionsToWipe) {
    try {
      const col = db.collection(colName);
      const count = await col.countDocuments();
      if (count > 0) {
        await col.deleteMany({});
        console.log(`Cleared ${count} documents from ${colName}`);
      }
    } catch (e) {
      // collection might not exist
    }
  }

  // Delete all users EXCEPT the two admin accounts
  const usersCol = db.collection("users");
  const userDeleteResult = await usersCol.deleteMany({
    email: { $nin: ["superadmin@lms.com", "principal@apex.edu"] },
  });
  console.log(`Removed ${userDeleteResult.deletedCount} non-admin users.`);

  const remainingUsers = await usersCol.find({}, { projection: { email: 1, role: 1, name: 1 } }).toArray();
  console.log("Remaining accounts in DB:", remainingUsers);

  await mongoose.disconnect();
  console.log("Purge complete! Only Admin credentials remain in database.");
}

purge();

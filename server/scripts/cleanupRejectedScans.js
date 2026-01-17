/**
 * Cleanup Script: Remove Old Rejected Scan Logs
 *
 * This script deletes all rejected scan logs from the database.
 * Since rejected scans are no longer persisted (as of recent code changes),
 * this removes old rejected records that were saved before the update.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const ScanLog = require("../models/ScanLog");

async function cleanupRejectedScans() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n📊 Counting rejected scan logs...");
    const rejectedCount = await ScanLog.countDocuments({ result: "REJECTED" });
    console.log(`Found ${rejectedCount} rejected scan logs in database`);

    if (rejectedCount === 0) {
      console.log("✨ No rejected scans to clean up!");
      process.exit(0);
    }

    console.log("\n⚠️  These are old records from before the code update.");
    console.log("Rejected scans are no longer saved to the database.\n");

    // Show sample of what will be deleted
    const samples = await ScanLog.find({ result: "REJECTED" })
      .limit(3)
      .select("scanId containerId rejectionReason createdAt")
      .lean();

    console.log("Sample records to be deleted:");
    samples.forEach((scan) => {
      console.log(
        `  - ${scan.scanId}: ${scan.rejectionReason} (${scan.createdAt})`,
      );
    });

    console.log("\n🗑️  Deleting all rejected scan logs...");
    const deleteResult = await ScanLog.deleteMany({ result: "REJECTED" });

    console.log(`✅ Deleted ${deleteResult.deletedCount} rejected scan logs`);
    console.log("\n✨ Cleanup complete!");
    console.log(
      "From now on, rejected scans will NOT be saved to the database.",
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
    process.exit(0);
  }
}

// Run the cleanup
cleanupRejectedScans();

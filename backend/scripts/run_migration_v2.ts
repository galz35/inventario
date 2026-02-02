
import * as dotenv from 'dotenv';
dotenv.config();
import { ejecutarQuery } from '../src/db/base.repo';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/create_sps_v2.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by GO is common in SSMS but node drivers might need split
        // Simple split by GO (case insensitive, separate line)
        const batches = sql.split(/^\s*GO\s*$/im);

        console.log(`Found ${batches.length} batches to execute.`);

        for (const batch of batches) {
            if (batch.trim()) {
                console.log("Executing batch...");
                await ejecutarQuery(batch);
            }
        }
        console.log("✅ Migration completed successfully.");
    } catch (e) {
        console.error("❌ Error migrating:", e);
    }
}

runMigration();

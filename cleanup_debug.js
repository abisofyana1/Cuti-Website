import pg from 'pg';

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'ecuti_db',
    password: 'admin',
    port: 5432,
};

const pool = new pg.Pool(dbConfig);

async function cleanup() {
    try {
        console.log("Cleaning up debug data...");
        // Delete the entry with debug.jpg
        await pool.query("DELETE FROM balance_history WHERE proof_file = 'debug.jpg'");
        console.log("Deleted debug records.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

cleanup();

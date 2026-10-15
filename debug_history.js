import pg from 'pg';

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'ecuti_db',
    password: 'admin',
    port: 5432,
};

const pool = new pg.Pool(dbConfig);

async function test() {
    try {
        console.log("Connecting...");
        const email = 'Abi.Sofyana@bni.co.id'; // Use the user email from screenshot

        // 1. Insert dummy
        console.log("Inserting dummy record...");
        const resInsert = await pool.query(
            `INSERT INTO balance_history (user_email, amount, description, proof_file, admin_name) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [email, 5, 'Debug Manual Insert', 'debug.jpg', 'Debug Admin']
        );
        console.log("Inserted ID:", resInsert.rows[0].id);

        // 2. Fetch
        console.log("Fetching history...");
        const resFetch = await pool.query(
            'SELECT * FROM balance_history WHERE user_email = $1',
            [email]
        );
        console.log("Found records:", resFetch.rows.length);
        console.log(resFetch.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

test();

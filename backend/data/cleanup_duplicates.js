require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // Check connection
    const test = await client.query('SELECT 1 as ok');
    console.log('Connected:', test.rows[0]);

    // Check person_details
    const pd = await client.query('SELECT id, person_id, employee_code, biometric_pin FROM person_details ORDER BY id');
    console.log('person_details rows:', pd.rows.length);
    pd.rows.forEach(r => console.log(`  id=${r.id} person_id=${r.person_id} code=${r.employee_code} pin=${r.biometric_pin}`));

    // Find duplicates on employee_code
    const dupes = await client.query(`
      SELECT employee_code, array_agg(id ORDER BY id) as ids, COUNT(*) as cnt
      FROM person_details
      WHERE employee_code IS NOT NULL
      GROUP BY employee_code
      HAVING COUNT(*) > 1
    `);
    console.log('\nDuplicate employee_codes:', dupes.rows.length);

    for (const row of dupes.rows) {
      console.log(`  ${row.employee_code}: ids=${row.ids}`);
      // Keep first, delete rest
      const keepId = row.ids[0];
      const deleteIds = row.ids.slice(1);
      console.log(`    Keeping id=${keepId}, deleting ids=${deleteIds}`);
      await client.query(`DELETE FROM person_details WHERE id = ANY($1::bigint[])`, [deleteIds]);
      console.log(`    Deleted ${deleteIds.length} rows`);
    }

    // Check attendance duplicates
    const attDupes = await client.query(`
      SELECT person_id, punch_date::text, punch_time::text, array_agg(id ORDER BY id) as ids, COUNT(*) as cnt
      FROM attendance
      WHERE person_id IS NOT NULL
      GROUP BY person_id, punch_date, punch_time
      HAVING COUNT(*) > 1
    `);
    console.log('\nDuplicate attendance:', attDupes.rows.length);

    for (const row of attDupes.rows) {
      const keepId = row.ids[0];
      const deleteIds = row.ids.slice(1);
      await client.query(`DELETE FROM attendance WHERE id = ANY($1::bigint[])`, [deleteIds]);
      console.log(`  Deleted ${deleteIds.length} dupe attendance rows`);
    }

    // Final state
    const final = await client.query('SELECT id, employee_code, biometric_pin FROM person_details ORDER BY id');
    console.log('\nFinal person_details:');
    final.rows.forEach(r => console.log(`  id=${r.id} code=${r.employee_code} pin=${r.biometric_pin}`));

    console.log('\n✅ Cleanup complete!');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Detail:', err.detail || 'none');
  } finally {
    client.release();
    await pool.end();
  }
}

run();

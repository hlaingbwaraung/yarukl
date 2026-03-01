require('dotenv').config();
const pool = require('./pool');

// Import all kanji seed data
const n5Kanji = require('./seed-kanji-n5');
const n4Kanji = require('./seed-kanji-n4');
const n3Kanji = require('./seed-kanji-n3');
const n2Kanji = require('./seed-kanji-n2');
const n1Kanji = require('./seed-kanji-n1');

async function seedAllKanji() {
  try {
    console.log('🈁 Seeding JLPT Kanji Dictionary (N5–N1)...\n');

    // Remove only kanji category entries (keep vocabulary)
    const deleteResult = await pool.query("DELETE FROM dictionary WHERE category = 'kanji'");
    console.log(`🗑️  Cleared ${deleteResult.rowCount} old kanji entries.\n`);

    // Helper: build parameterized INSERT values
    function buildInsert(rows) {
      const values = [];
      const params = [];
      let idx = 1;
      for (const row of rows) {
        values.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5}, $${idx+6}, $${idx+7}, $${idx+8})`);
        params.push(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]);
        idx += 9;
      }
      return { values: values.join(',\n        '), params };
    }

    // Insert a batch of kanji entries
    async function insertBatch(kanjiArray, label) {
      const batchSize = 50;
      let total = 0;
      for (let i = 0; i < kanjiArray.length; i += batchSize) {
        const batch = kanjiArray.slice(i, i + batchSize);
        const ins = buildInsert(batch);
        await pool.query(`
          INSERT INTO dictionary (japanese, reading, english, burmese, level, category, example_sentence, example_reading, example_burmese)
          VALUES ${ins.values}
        `, ins.params);
        total += batch.length;
      }
      console.log(`  ✅ ${label}: ${total} kanji`);
      return total;
    }

    let grandTotal = 0;
    grandTotal += await insertBatch(n5Kanji, 'N5 Kanji');
    grandTotal += await insertBatch(n4Kanji, 'N4 Kanji');
    grandTotal += await insertBatch(n3Kanji, 'N3 Kanji');
    grandTotal += await insertBatch(n2Kanji, 'N2 Kanji');
    grandTotal += await insertBatch(n1Kanji, 'N1 Kanji');

    console.log(`\n🎉 Total: ${grandTotal} kanji entries seeded!`);
    console.log(`   N5: ${n5Kanji.length} kanji`);
    console.log(`   N4: ${n4Kanji.length} kanji`);
    console.log(`   N3: ${n3Kanji.length} kanji`);
    console.log(`   N2: ${n2Kanji.length} kanji`);
    console.log(`   N1: ${n1Kanji.length} kanji`);

  } catch (err) {
    console.error('❌ Error seeding kanji:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

seedAllKanji();

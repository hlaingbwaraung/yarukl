require('dotenv').config();
const pool = require('./pool');

function translateQuestion(q) {
  let m;

  // Pattern 1: "What is the reading of X?" → "X ကို ဘယ်လိုဖတ်သလဲ?"
  m = q.match(/^What is the reading of (.+)\?$/);
  if (m) return `${m[1]} ကို ဘယ်လိုဖတ်သလဲ?`;

  // Pattern 2: "What does X mean?" → "X ရဲ့ အဓိပ္ပာယ်ကဘာလဲ?"
  m = q.match(/^What does (.+) mean\?$/);
  if (m) return `${m[1]} ရဲ့ အဓိပ္ပာယ်ကဘာလဲ?`;

  // Pattern 3: "Fill in: ..." → "ဖြည့်ပါ: ..."
  if (q.startsWith('Fill in: ')) return 'ဖြည့်ပါ: ' + q.slice(9);

  // Pattern 4: "Choose the correct X:" → "မှန်ကန်သော X ကိုရွေးပါ:"
  if (q.startsWith('Choose the correct ')) return 'မှန်ကန်သော ' + q.slice(19);

  // Pattern 5: Which means "X"?  → "X" ဟူသောအဓိပ္ပာယ်မှာ မည်သည်နည်း?
  m = q.match(/^Which means "(.+)"\?$/);
  if (m) return `"${m[1]}" ဟူသောအဓိပ္ပာယ်မှာ မည်သည်နည်း?`;

  // Pattern 6: Which is correct? "X"  → မည်သည်မှာ မှန်ကန်သနည်း? "X"
  m = q.match(/^Which is correct\? "(.+)"$/);
  if (m) return `မည်သည်မှာ မှန်ကန်သနည်း? "${m[1]}"`;

  // Pattern 7: Which is correct for "X"?  → "X" အတွက် မည်သည်မှာ မှန်ကန်သနည်း?
  m = q.match(/^Which is correct for "(.+)"\?$/);
  if (m) return `"${m[1]}" အတွက် မည်သည်မှာ မှန်ကန်သနည်း?`;

  // Pattern 8: Which is past tense of X?  → X ၏ လွန်ခဲ့သောကာလ ပုံစံမှာ မည်သည်နည်း?
  m = q.match(/^Which is past tense of (.+)\?$/);
  if (m) return `${m[1]} ၏ လွန်ခဲ့သောကာလ ပုံစံမှာ မည်သည်နည်း?`;

  // Pattern 9: Which is て-form of X?  → X ၏ て-ပုံစံမှာ မည်သည်နည်း?
  m = q.match(/^Which is て-form of (.+)\?$/);
  if (m) return `${m[1]} ၏ て-ပုံစံမှာ မည်သည်နည်း?`;

  // Pattern 10: Which expresses ability? "X"  → တတ်နိုင်မှုကို ဆိုလိုသည်မှာ မည်သည်နည်း? "X"
  m = q.match(/^Which expresses ability\? "(.+)"$/);
  if (m) return `တတ်နိုင်မှုကို ဆိုလိုသည်မှာ မည်သည်နည်း? "${m[1]}"`;

  // Pattern 11: Which is the conditional? "X"  → အခြေအနေ ပုံစံမှာ မည်သည်နည်း? "X"
  m = q.match(/^Which is the conditional\? "(.+)"$/);
  if (m) return `အခြေအနေ ပုံစံမှာ မည်သည်နည်း? "${m[1]}"`;

  // Pattern 12: Which is the causative? "X"  → ခိုင်းစေသောပုံစံမှာ မည်သည်နည်း? "X"
  m = q.match(/^Which is the causative\? "(.+)"$/);
  if (m) return `ခိုင်းစေသောပုံစံမှာ မည်သည်နည်း? "${m[1]}"`;

  // Pattern 13: "There is a cat" → ねこが ___。
  m = q.match(/^"There is a cat" → (.+)$/);
  if (m) return `"ကြောင်ရှိပါတယ်" → ${m[1]}`;

  // Pattern 14: "There is a book" → ほんが ___。
  m = q.match(/^"There is a book" → (.+)$/);
  if (m) return `"စာအုပ်ရှိပါတယ်" → ${m[1]}`;

  // Pattern 15: "Don't run!" → ___。
  m = q.match(/^"Don't run!" → (.+)$/);
  if (m) return `"မပြေးပါနှင့်!" → ${m[1]}`;

  // Pattern 16: "Please sit" → ___。
  m = q.match(/^"Please sit" → (.+)$/);
  if (m) return `"ထိုင်ပါ" → ${m[1]}`;

  // Pattern 17: Which means "X" or ...? (multiple meanings)
  m = q.match(/^Which means (.+)\?$/);
  if (m) return `${m[1]} ဟူသောအဓိပ္ပာယ်မှာ မည်သည်နည်း?`;

  // Return unchanged if nothing matched
  return q;
}

async function translateQuestions() {
  try {
    console.log('🔤 Fetching all quiz questions...');
    const { rows } = await pool.query('SELECT id, question FROM quiz_questions ORDER BY id');

    let updated = 0;
    let unchanged = 0;
    const unmatched = [];

    for (const row of rows) {
      const translated = translateQuestion(row.question);
      if (translated !== row.question) {
        await pool.query('UPDATE quiz_questions SET question = $1 WHERE id = $2', [translated, row.id]);
        updated++;
      } else {
        unchanged++;
        unmatched.push({ id: row.id, q: row.question });
      }
    }

    console.log(`\n✅ Updated:   ${updated} questions`);
    console.log(`⏭️  Unchanged: ${unchanged} questions`);

    if (unmatched.length > 0) {
      console.log(`\n⚠️  Unmatched patterns (${unmatched.length}):`);
      unmatched.forEach(u => console.log(`  [${u.id}] ${u.q}`));
    } else {
      console.log('🎉 All questions translated successfully!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

translateQuestions();

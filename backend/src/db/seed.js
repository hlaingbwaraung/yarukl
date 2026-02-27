require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create default admin/teacher user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Sensei Tanaka', 'teacher@yaruki.com', $1, 'teacher'),
        ('Admin', 'admin@yaruki.com', $1, 'admin'),
        ('Aung Aung', 'student@yaruki.com', $2, 'student')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword, studentPassword]);

    // Create sample assignments
    await pool.query(`
      INSERT INTO assignments (title, description, due_date, level, created_by) VALUES
        ('Hiragana Practice - Week 1', 'Write each hiragana character 10 times. Take a photo and upload.', '2026-03-15', 'N5', 1),
        ('Kanji Writing N5 - Lesson 1', 'Practice writing the following kanji: 一 二 三 四 五. Submit your handwriting.', '2026-03-20', 'N5', 1),
        ('Grammar Exercise - て form', 'Complete the worksheet on て-form conjugation. Upload your answers.', '2026-03-25', 'N4', 1),
        ('Reading Comprehension N4', 'Read the passage and answer the questions. Upload your written answers.', '2026-04-01', 'N4', 1),
        ('Kanji Compound Words N3', 'Write sentences using the given N3 kanji compound words.', '2026-04-10', 'N3', 1)
      ON CONFLICT DO NOTHING
    `);

    // Seed quiz questions - N5 (5 questions)
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
        ('N5', 'kanji', 'What is the reading of 山?', 'かわ (kawa)', 'やま (yama)', 'もり (mori)', 'うみ (umi)', 'B', '山 means mountain and is read as やま (yama). မြန်မာလို - တောင်'),
        ('N5', 'kanji', 'What does 水 mean?', 'Fire', 'Water', 'Earth', 'Wind', 'B', '水 (みず/mizu) means water. မြန်မာလို - ရေ'),
        ('N5', 'grammar', 'Fill in: わたし ___ がくせいです。', 'を', 'に', 'は', 'で', 'C', 'は is the topic marker particle. "I am a student." မြန်မာလို - ကျွန်တော်/ကျွန်မ ကျောင်းသားပါ။'),
        ('N5', 'grammar', 'Which is correct? "I eat sushi."', 'すしを たべます', 'すしは たべます', 'すしに たべます', 'すしで たべます', 'A', 'を marks the direct object. すしを たべます。 မြန်မာလို - ဆူရှီ စားပါတယ်။'),
        ('N5', 'kanji', 'What is the reading of 日本?', 'にっぽん (nippon)', 'ちゅうごく (chuugoku)', 'かんこく (kankoku)', 'たいわん (taiwan)', 'A', '日本 means Japan and can be read as にほん or にっぽん. မြန်မာလို - ဂျပန်')
      ON CONFLICT DO NOTHING
    `);

    // Seed quiz questions - N4 (5 questions)
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
        ('N4', 'kanji', 'What is the reading of 会社?', 'がっこう (gakkou)', 'かいしゃ (kaisha)', 'びょういん (byouin)', 'えき (eki)', 'B', '会社 means company. မြန်မာလို - ကုမ္ပဏီ'),
        ('N4', 'grammar', 'Choose the correct て-form of 書く:', '書いて', '書って', '書きて', '書して', 'A', '書く → 書いて (く→いて pattern). မြန်မာလို - ရေးပြီးတော့...'),
        ('N4', 'grammar', 'Fill in: 雨が ふって___、さんぽに いきませんでした。', 'いたから', 'いるので', 'いたので', 'いますから', 'C', '〜ていたので expresses reason in past progressive. မြန်မာလို - မိုးရွာနေလို့ လမ်းမလျှောက်ဖြစ်ခဲ့ပါ'),
        ('N4', 'kanji', 'What does 教える mean?', 'To learn', 'To teach', 'To read', 'To speak', 'B', '教える (おしえる) means to teach. မြန်မာလို - သင်ပေးသည်'),
        ('N4', 'grammar', 'Which expresses ability? "I can speak Japanese."', 'にほんごを はなします', 'にほんごが はなせます', 'にほんごを はなしたい', 'にほんごに はなします', 'B', '〜が + potential form expresses ability. မြန်မာလို - ဂျပန်စကား ပြောတတ်ပါတယ်')
      ON CONFLICT DO NOTHING
    `);

    // Seed quiz questions - N3 (5 questions)
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
        ('N3', 'kanji', 'What is the reading of 経験?', 'けいけん (keiken)', 'けっかん (kekkan)', 'きけん (kiken)', 'しけん (shiken)', 'A', '経験 means experience. မြန်မာလို - အတွေ့အကြုံ'),
        ('N3', 'grammar', 'Fill in: この問題は 難しすぎて、___。', 'できました', 'できません', 'できます', 'できるでしょう', 'B', '〜すぎて implies excessive degree leading to negative result. မြန်မာလို - ဒီပြဿနာက ခက်လွန်းလို့ မလုပ်နိုင်ပါ'),
        ('N3', 'grammar', 'Choose the correct usage of ようにする:', '毎日 運動する ようにしています', '毎日 運動した ようにしています', '毎日 運動の ようにしています', '毎日 運動 ようにしています', 'A', '〜ようにする means to make an effort to do. မြန်မာလို - နေ့တိုင်း လေ့ကျင့်ခန်းလုပ်အောင် ကြိုးစားနေပါတယ်'),
        ('N3', 'kanji', 'What does 届ける mean?', 'To receive', 'To deliver', 'To return', 'To borrow', 'B', '届ける (とどける) means to deliver. မြန်မာလို - ပို့ပေးသည်'),
        ('N3', 'grammar', 'Which means "according to the news"?', 'ニュースによると', 'ニュースについて', 'ニュースに対して', 'ニュースにとって', 'A', '〜によると means "according to". မြန်မာလို - သတင်းအရ')
      ON CONFLICT DO NOTHING
    `);

    // Seed dictionary with 10 Burmese-translated words
    await pool.query(`
      INSERT INTO dictionary (japanese, reading, english, burmese, level, category, example_sentence, example_reading, example_burmese) VALUES
        ('食べる', 'たべる', 'to eat', 'စားသည်', 'N5', 'verb', '毎日ごはんを食べます。', 'まいにちごはんをたべます。', 'နေ့တိုင်း ထမင်းစားပါတယ်။'),
        ('飲む', 'のむ', 'to drink', 'သောက်သည်', 'N5', 'verb', 'お茶を飲みます。', 'おちゃをのみます。', 'လက်ဖက်ရည်သောက်ပါတယ်။'),
        ('学校', 'がっこう', 'school', 'ကျောင်း', 'N5', 'noun', '学校に行きます。', 'がっこうにいきます。', 'ကျောင်းသွားပါတယ်။'),
        ('先生', 'せんせい', 'teacher', 'ဆရာ/ဆရာမ', 'N5', 'noun', '先生はやさしいです。', 'せんせいはやさしいです。', 'ဆရာ/ဆရာမ သဘောကောင်းပါတယ်။'),
        ('友達', 'ともだち', 'friend', 'သူငယ်ချင်း', 'N5', 'noun', '友達と遊びます。', 'ともだちとあそびます。', 'သူငယ်ချင်းနဲ့ ကစားပါတယ်။'),
        ('天気', 'てんき', 'weather', 'ရာသီဥတု', 'N4', 'noun', '今日はいい天気ですね。', 'きょうはいいてんきですね。', 'ဒီနေ့ ရာသီဥတု ကောင်းတယ်နော်။'),
        ('練習', 'れんしゅう', 'practice', 'လေ့ကျင့်ခန်း', 'N4', 'noun', '毎日日本語を練習します。', 'まいにちにほんごをれんしゅうします。', 'နေ့တိုင်း ဂျပန်စကား လေ့ကျင့်ပါတယ်။'),
        ('経験', 'けいけん', 'experience', 'အတွေ့အကြုံ', 'N3', 'noun', 'いい経験になりました。', 'いいけいけんになりました。', 'အတွေ့အကြုံ ကောင်းတစ်ခု ဖြစ်ခဲ့ပါတယ်။'),
        ('頑張る', 'がんばる', 'to do one''s best', 'ကြိုးစားသည်', 'N4', 'verb', '試験のために頑張ります。', 'しけんのためにがんばります。', 'စာမေးပွဲအတွက် ကြိုးစားပါမယ်။'),
        ('嬉しい', 'うれしい', 'happy/glad', 'ပျော်ရွှင်သော', 'N4', 'adjective', '合格して嬉しいです。', 'ごうかくしてうれしいです。', 'အောင်မြင်လို့ ပျော်ပါတယ်။')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('   Teacher: teacher@yaruki.com / admin123');
    console.log('   Admin:   admin@yaruki.com / admin123');
    console.log('   Student: student@yaruki.com / student123');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
  } finally {
    await pool.end();
  }
}

seed();

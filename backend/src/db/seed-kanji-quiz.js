require('dotenv').config();
const pool = require('./pool');

async function seedKanjiQuiz() {
  try {
    console.log('📝 Seeding Minna no Nihongo Kanji Quiz Data...');

    // Clear old quiz questions to replace with comprehensive data
    await pool.query(`DELETE FROM quiz_questions`);
    console.log('🗑️  Cleared old quiz questions.');

    // =====================================================
    // N5 KANJI — Minna no Nihongo I (Lessons 1–25)
    // =====================================================
    const n5Kanji = [
      // --- Numbers ---
      [`What is the reading of 一?`, `いち (ichi)`, `に (ni)`, `さん (san)`, `し (shi)`, `A`, `一 means "one". မြန်မာလို - တစ်`],
      [`What is the reading of 二?`, `いち (ichi)`, `に (ni)`, `さん (san)`, `よん (yon)`, `B`, `二 means "two". မြန်မာလို - နှစ်`],
      [`What is the reading of 三?`, `に (ni)`, `さん (san)`, `し (shi)`, `ご (go)`, `B`, `三 means "three". မြန်မာလို - သုံး`],
      [`What is the reading of 四?`, `さん (san)`, `し/よん (shi/yon)`, `ご (go)`, `ろく (roku)`, `B`, `四 means "four". It can be read し or よん. မြန်မာလို - လေး`],
      [`What is the reading of 五?`, `し (shi)`, `ご (go)`, `ろく (roku)`, `なな (nana)`, `B`, `五 means "five". မြန်မာလို - ငါး`],
      [`What is the reading of 六?`, `ご (go)`, `ろく (roku)`, `なな (nana)`, `はち (hachi)`, `B`, `六 means "six". မြန်မာလို - ခြောက်`],
      [`What is the reading of 七?`, `ろく (roku)`, `なな/しち (nana/shichi)`, `はち (hachi)`, `きゅう (kyuu)`, `B`, `七 means "seven". It can be read なな or しち. မြန်မာလို - ခုနစ်`],
      [`What is the reading of 八?`, `ろく (roku)`, `なな (nana)`, `はち (hachi)`, `きゅう (kyuu)`, `C`, `八 means "eight". မြန်မာလို - ရှစ်`],
      [`What is the reading of 九?`, `はち (hachi)`, `きゅう/く (kyuu/ku)`, `じゅう (juu)`, `ひゃく (hyaku)`, `B`, `九 means "nine". It can be read きゅう or く. မြန်မာလို - ကိုး`],
      [`What is the reading of 十?`, `きゅう (kyuu)`, `じゅう (juu)`, `ひゃく (hyaku)`, `せん (sen)`, `B`, `十 means "ten". မြန်မာလို - ဆယ်`],
      [`What is the reading of 百?`, `じゅう (juu)`, `ひゃく (hyaku)`, `せん (sen)`, `まん (man)`, `B`, `百 means "one hundred". မြန်မာလို - တစ်ရာ`],
      [`What is the reading of 千?`, `ひゃく (hyaku)`, `せん (sen)`, `まん (man)`, `おく (oku)`, `B`, `千 means "one thousand". မြန်မာလို - တစ်ထောင်`],
      [`What is the reading of 万?`, `せん (sen)`, `まん (man)`, `おく (oku)`, `ちょう (chou)`, `B`, `万 means "ten thousand". မြန်မာလို - တစ်သောင်း`],

      // --- Time / Days ---
      [`What is the reading of 日?`, `にち/ひ (nichi/hi)`, `げつ (getsu)`, `ねん (nen)`, `じ (ji)`, `A`, `日 means "day" or "sun". မြန်မာလို - နေ့ / နေ`],
      [`What is the reading of 月?`, `にち (nichi)`, `げつ/がつ (getsu/gatsu)`, `ねん (nen)`, `か (ka)`, `B`, `月 means "month" or "moon". မြန်မာလို - လ`],
      [`What is the reading of 年?`, `げつ (getsu)`, `ねん/とし (nen/toshi)`, `か (ka)`, `じ (ji)`, `B`, `年 means "year". မြန်မာလို - နှစ်`],
      [`What is the reading of 時?`, `にち (nichi)`, `ねん (nen)`, `じ/とき (ji/toki)`, `ふん (fun)`, `C`, `時 means "time" or "hour". မြန်မာလို - အချိန် / နာရီ`],
      [`What is the reading of 分?`, `じ (ji)`, `ふん/ぶん (fun/bun)`, `びょう (byou)`, `かん (kan)`, `B`, `分 means "minute" or "part". မြန်မာလို - မိနစ်`],
      [`What is the reading of 半?`, `ぜん (zen)`, `はん (han)`, `ぶん (bun)`, `まえ (mae)`, `B`, `半 means "half". မြန်မာလို - တစ်ဝက်`],
      [`What is the reading of 今?`, `いま (ima)`, `きのう (kinou)`, `あした (ashita)`, `らいねん (rainen)`, `A`, `今 means "now". 今日 = きょう (today). မြန်မာလို - အခု`],
      [`What does 毎 mean?`, `Every`, `Next`, `Last`, `This`, `A`, `毎 (まい/mai) means "every". 毎日 = every day. မြန်မာလို - တိုင်း`],
      [`What is the reading of 先?`, `あと (ato)`, `さき/せん (saki/sen)`, `つぎ (tsugi)`, `まえ (mae)`, `B`, `先 means "previous" or "ahead". 先生 = teacher, 先週 = last week. မြန်မာလို - အရင်`],
      [`What is the reading of 週?`, `しゅう (shuu)`, `にち (nichi)`, `げつ (getsu)`, `ねん (nen)`, `A`, `週 means "week". 今週 = this week. မြန်မာလို - အပတ်`],

      // --- Nature ---
      [`What is the reading of 山?`, `かわ (kawa)`, `やま (yama)`, `もり (mori)`, `うみ (umi)`, `B`, `山 means "mountain". မြန်မာလို - တောင်`],
      [`What is the reading of 川?`, `やま (yama)`, `かわ (kawa)`, `うみ (umi)`, `みずうみ (mizuumi)`, `B`, `川 means "river". မြန်မာလို - မြစ်`],
      [`What does 水 mean?`, `Fire`, `Water`, `Earth`, `Wind`, `B`, `水 (みず/mizu) means "water". မြန်မာလို - ရေ`],
      [`What does 火 mean?`, `Water`, `Earth`, `Fire`, `Wind`, `C`, `火 (ひ/hi) means "fire". 火曜日 = Tuesday. မြန်မာလို - မီး`],
      [`What does 木 mean?`, `Mountain`, `River`, `Tree/Wood`, `Flower`, `C`, `木 (き/ki) means "tree" or "wood". 木曜日 = Thursday. မြန်မာလို - သစ်ပင်`],
      [`What does 金 mean?`, `Silver`, `Gold/Money`, `Copper`, `Iron`, `B`, `金 (きん/かね) means "gold" or "money". 金曜日 = Friday. မြန်မာလို - ရွှေ / ပိုက်ဆံ`],
      [`What does 土 mean?`, `Water`, `Fire`, `Wood`, `Earth/Soil`, `D`, `土 (つち/tsuchi) means "earth/soil". 土曜日 = Saturday. မြန်မာလို - မြေ`],
      [`What does 天 mean?`, `Earth`, `Sea`, `Sky/Heaven`, `Mountain`, `C`, `天 (てん/ten) means "sky" or "heaven". 天気 = weather. မြန်မာလို - ကောင်းကင်`],
      [`What does 雨 mean?`, `Snow`, `Rain`, `Cloud`, `Wind`, `B`, `雨 (あめ/ame) means "rain". မြန်မာလို - မိုး`],
      [`What is the reading of 花?`, `くさ (kusa)`, `き (ki)`, `はな (hana)`, `もり (mori)`, `C`, `花 means "flower". မြန်မာလို - ပန်း`],

      // --- People / Body ---
      [`What is the reading of 人?`, `ひと/じん (hito/jin)`, `おとこ (otoko)`, `おんな (onna)`, `こ (ko)`, `A`, `人 means "person". 日本人 = Japanese person. မြန်မာလို - လူ`],
      [`What is the reading of 男?`, `おんな (onna)`, `おとこ (otoko)`, `こ (ko)`, `ひと (hito)`, `B`, `男 means "man/male". မြန်မာလို - ယောက်ျား`],
      [`What is the reading of 女?`, `おとこ (otoko)`, `おんな (onna)`, `こ (ko)`, `ひと (hito)`, `B`, `女 means "woman/female". မြန်မာလို - မိန်းမ`],
      [`What is the reading of 子?`, `おとこ (otoko)`, `おんな (onna)`, `こ/し (ko/shi)`, `ひと (hito)`, `C`, `子 means "child". 子ども = children. မြန်မာလို - ကလေး`],
      [`What does 目 mean?`, `Ear`, `Eye`, `Mouth`, `Hand`, `B`, `目 (め/me) means "eye". မြန်မာလို - မျက်စိ`],
      [`What does 耳 mean?`, `Eye`, `Ear`, `Mouth`, `Nose`, `B`, `耳 (みみ/mimi) means "ear". မြန်မာလို - နား`],
      [`What does 口 mean?`, `Eye`, `Ear`, `Mouth`, `Nose`, `C`, `口 (くち/kuchi) means "mouth". 入口 = entrance. မြန်မာလို - ပါးစပ်`],
      [`What does 手 mean?`, `Foot`, `Head`, `Face`, `Hand`, `D`, `手 (て/te) means "hand". မြန်မာလို - လက်`],
      [`What does 足 mean?`, `Hand`, `Head`, `Foot/Leg`, `Face`, `C`, `足 (あし/ashi) means "foot" or "leg". မြန်မာလို - ခြေ`],

      // --- Places ---
      [`What is the reading of 学校?`, `びょういん (byouin)`, `がっこう (gakkou)`, `えき (eki)`, `としょかん (toshokan)`, `B`, `学校 means "school". မြန်မာလို - ကျောင်း`],
      [`What is the reading of 大学?`, `しょうがっこう (shougakkou)`, `ちゅうがっこう (chuugakkou)`, `だいがく (daigaku)`, `こうこう (koukou)`, `C`, `大学 means "university". မြန်မာလို - တက္ကသိုလ်`],
      [`What is the reading of 駅?`, `えき (eki)`, `まち (machi)`, `みせ (mise)`, `いえ (ie)`, `A`, `駅 means "station". မြန်မာလို - ဘူတာရုံ`],
      [`What does 店 mean?`, `House`, `Shop/Store`, `School`, `Hospital`, `B`, `店 (みせ/mise) means "shop" or "store". မြန်မာလို - ဆိုင်`],
      [`What is the reading of 国?`, `くに/こく (kuni/koku)`, `まち (machi)`, `むら (mura)`, `とし (toshi)`, `A`, `国 means "country". 外国 = foreign country. မြန်မာလို - နိုင်ငံ`],

      // --- Direction / Position ---
      [`What does 上 mean?`, `Down`, `Up/Above`, `Left`, `Right`, `B`, `上 (うえ/ue) means "up" or "above". မြန်မာလို - အပေါ်`],
      [`What does 下 mean?`, `Up`, `Down/Below`, `Left`, `Right`, `B`, `下 (した/shita) means "down" or "below". မြန်မာလို - အောက်`],
      [`What does 中 mean?`, `Outside`, `Inside/Middle`, `Up`, `Down`, `B`, `中 (なか/naka) means "inside" or "middle". 中国 = China. မြန်မာလို - အထဲ / အလယ်`],
      [`What does 外 mean?`, `Inside`, `Outside`, `Up`, `Down`, `B`, `外 (そと/soto) means "outside". 外国 = foreign country. မြန်မာလို - အပြင်`],
      [`What does 右 mean?`, `Left`, `Right`, `Up`, `Down`, `B`, `右 (みぎ/migi) means "right". မြန်မာလို - ညာ`],
      [`What does 左 mean?`, `Right`, `Left`, `Up`, `Down`, `B`, `左 (ひだり/hidari) means "left". မြန်မာလို - ဘယ်`],
      [`What does 北 mean?`, `South`, `East`, `West`, `North`, `D`, `北 (きた/kita) means "north". မြန်မာလို - မြောက်`],
      [`What does 南 mean?`, `North`, `South`, `East`, `West`, `B`, `南 (みなみ/minami) means "south". မြန်မာလို - တောင်`],
      [`What does 東 mean?`, `West`, `South`, `East`, `North`, `C`, `東 (ひがし/higashi) means "east". မြန်မာလို - အရှေ့`],
      [`What does 西 mean?`, `East`, `North`, `South`, `West`, `D`, `西 (にし/nishi) means "west". မြန်မာလို - အနောက်`],

      // --- Actions ---
      [`What is the reading of 食べる?`, `のむ (nomu)`, `たべる (taberu)`, `みる (miru)`, `きく (kiku)`, `B`, `食べる means "to eat". မြန်မာလို - စားသည်`],
      [`What is the reading of 飲む?`, `たべる (taberu)`, `のむ (nomu)`, `よむ (yomu)`, `かく (kaku)`, `B`, `飲む means "to drink". မြန်မာလို - သောက်သည်`],
      [`What does 見る mean?`, `To hear`, `To read`, `To see/watch`, `To write`, `C`, `見る (みる/miru) means "to see" or "to watch". မြန်မာလို - ကြည့်သည်`],
      [`What does 聞く mean?`, `To see`, `To hear/ask`, `To write`, `To read`, `B`, `聞く (きく/kiku) means "to hear" or "to ask". မြန်မာလို - နားထောင်သည် / မေးသည်`],
      [`What does 読む mean?`, `To write`, `To speak`, `To read`, `To hear`, `C`, `読む (よむ/yomu) means "to read". မြန်မာလို - ဖတ်သည်`],
      [`What does 書く mean?`, `To read`, `To write`, `To draw`, `To speak`, `B`, `書く (かく/kaku) means "to write". မြန်မာလို - ရေးသည်`],
      [`What does 話す mean?`, `To listen`, `To read`, `To write`, `To speak/talk`, `D`, `話す (はなす/hanasu) means "to speak" or "to talk". မြန်မာလို - ပြောသည်`],
      [`What does 行く mean?`, `To come`, `To return`, `To go`, `To walk`, `C`, `行く (いく/iku) means "to go". မြန်မာလို - သွားသည်`],
      [`What does 来る mean?`, `To go`, `To come`, `To return`, `To walk`, `B`, `来る (くる/kuru) means "to come". မြန်မာလို - လာသည်`],
      [`What does 帰る mean?`, `To go`, `To come`, `To return/go home`, `To walk`, `C`, `帰る (かえる/kaeru) means "to go home" or "to return". မြန်မာလို - ပြန်သည်`],
      [`What does 入る mean?`, `To exit`, `To enter`, `To sit`, `To stand`, `B`, `入る (はいる/hairu) means "to enter". မြန်မာလို - ဝင်သည်`],
      [`What does 出る mean?`, `To enter`, `To exit/go out`, `To sit`, `To sleep`, `B`, `出る (でる/deru) means "to exit" or "to go out". မြန်မာလို - ထွက်သည်`],
      [`What does 立つ mean?`, `To sit`, `To sleep`, `To stand`, `To walk`, `C`, `立つ (たつ/tatsu) means "to stand". မြန်မာလို - ရပ်သည်`],
      [`What does 休む mean?`, `To work`, `To study`, `To play`, `To rest`, `D`, `休む (やすむ/yasumu) means "to rest". 休み = holiday. မြန်မာလို - နား`],
      [`What does 買う mean?`, `To sell`, `To buy`, `To give`, `To receive`, `B`, `買う (かう/kau) means "to buy". မြန်မာလို - ဝယ်သည်`],
      [`What does 会う mean?`, `To meet`, `To call`, `To wait`, `To walk`, `A`, `会う (あう/au) means "to meet". မြန်မာလို - တွေ့သည်`],
      [`What does 待つ mean?`, `To meet`, `To call`, `To wait`, `To walk`, `C`, `待つ (まつ/matsu) means "to wait". မြန်မာလို - စောင့်သည်`],

      // --- Adjectives ---
      [`What does 大きい mean?`, `Small`, `Big/Large`, `Long`, `Short`, `B`, `大きい (おおきい/ookii) means "big/large". မြန်မာလို - ကြီးသော`],
      [`What does 小さい mean?`, `Big`, `Small/Little`, `Long`, `Short`, `B`, `小さい (ちいさい/chiisai) means "small/little". မြန်မာလို - သေးသော`],
      [`What does 新しい mean?`, `Old`, `New`, `Cheap`, `Expensive`, `B`, `新しい (あたらしい/atarashii) means "new". မြန်မာလို - အသစ်`],
      [`What does 古い mean?`, `New`, `Old`, `Cheap`, `Expensive`, `B`, `古い (ふるい/furui) means "old (things)". မြန်မာလို - ဟောင်းသော`],
      [`What does 高い mean?`, `Low/Cheap`, `Expensive/Tall`, `Short`, `Wide`, `B`, `高い (たかい/takai) means "expensive" or "tall/high". မြန်မာလို - မြင့်သော / ဈေးကြီးသော`],
      [`What does 安い mean?`, `Expensive`, `Cheap`, `Heavy`, `Light`, `B`, `安い (やすい/yasui) means "cheap". မြန်မာလို - ဈေးသက်သာသော`],
      [`What does 長い mean?`, `Short`, `Long`, `Wide`, `Narrow`, `B`, `長い (ながい/nagai) means "long". မြန်မာလို - ရှည်သော`],
      [`What does 白い mean?`, `Black`, `Red`, `White`, `Blue`, `C`, `白い (しろい/shiroi) means "white". မြန်မာလို - ဖြူသော`],
      [`What does 黒い mean?`, `White`, `Black`, `Red`, `Blue`, `B`, `黒い (くろい/kuroi) means "black". မြန်မာလို - မည်းသော`],
      [`What does 赤い mean?`, `Blue`, `White`, `Black`, `Red`, `D`, `赤い (あかい/akai) means "red". မြန်မာလို - နီသော`],

      // --- Common Nouns ---
      [`What is the reading of 電車?`, `じどうしゃ (jidousha)`, `でんしゃ (densha)`, `ちかてつ (chikatetsu)`, `バス (basu)`, `B`, `電車 means "electric train". မြန်မာလို - ရထား`],
      [`What is the reading of 電話?`, `でんわ (denwa)`, `でんき (denki)`, `でんしゃ (densha)`, `でんち (denchi)`, `A`, `電話 means "telephone". မြန်မာလို - ဖုန်း`],
      [`What is the reading of 車?`, `くるま (kuruma)`, `でんしゃ (densha)`, `バス (basu)`, `ふね (fune)`, `A`, `車 means "car". မြန်မာလို - ကား`],
      [`What does 本 mean?`, `Pen`, `Book`, `Paper`, `Desk`, `B`, `本 (ほん/hon) means "book". 日本 = Japan. မြန်မာလို - စာအုပ်`],
      [`What is the reading of 友達?`, `せんせい (sensei)`, `ともだち (tomodachi)`, `かぞく (kazoku)`, `こども (kodomo)`, `B`, `友達 means "friend". မြန်မာလို - သူငယ်ချင်း`],
      [`What is the reading of 先生?`, `がくせい (gakusei)`, `ともだち (tomodachi)`, `せんせい (sensei)`, `いしゃ (isha)`, `C`, `先生 means "teacher". မြန်မာလို - ဆရာ`],
      [`What does 何 mean?`, `Who`, `Where`, `What`, `When`, `C`, `何 (なに/なん) means "what". 何ですか？ = What is it? မြန်မာလို - ဘာ`],

      // --- More Verbs ---
      [`What does 使う mean?`, `To make`, `To use`, `To break`, `To fix`, `B`, `使う (つかう/tsukau) means "to use". မြန်မာလို - သုံးသည်`],
      [`What does 作る mean?`, `To break`, `To use`, `To make/create`, `To sell`, `C`, `作る (つくる/tsukuru) means "to make" or "to create". မြန်မာလို - လုပ်သည် / ဖန်တီးသည်`],
      [`What does 思う mean?`, `To know`, `To think`, `To feel`, `To forget`, `B`, `思う (おもう/omou) means "to think". မြန်မာလို - ထင်သည် / စဉ်းစားသည်`],
      [`What does 知る mean?`, `To forget`, `To remember`, `To know`, `To think`, `C`, `知る (しる/shiru) means "to know". 知りません = I don't know. မြန်မာလို - သိသည်`],
      [`What does 住む mean?`, `To work`, `To live/reside`, `To visit`, `To move`, `B`, `住む (すむ/sumu) means "to live" or "to reside". မြန်မာလို - နေထိုင်သည်`],
      [`What does 働く mean?`, `To play`, `To study`, `To rest`, `To work`, `D`, `働く (はたらく/hataraku) means "to work". မြန်မာလို - အလုပ်လုပ်သည်`],
      [`What does 勉強 mean?`, `Work`, `Study`, `Practice`, `Test`, `B`, `勉強 (べんきょう/benkyou) means "study". 勉強する = to study. မြန်မာလို - စာကျက်ခြင်း`],

      // --- More school/daily life ---
      [`What is the reading of 朝?`, `あさ (asa)`, `ひる (hiru)`, `ばん (ban)`, `よる (yoru)`, `A`, `朝 means "morning". 朝ごはん = breakfast. မြန်မာလို - နံနက်`],
      [`What is the reading of 昼?`, `あさ (asa)`, `ひる (hiru)`, `ばん (ban)`, `よる (yoru)`, `B`, `昼 means "noon/daytime". 昼ごはん = lunch. မြန်မာလို - နေ့လည်`],
      [`What is the reading of 夜?`, `あさ (asa)`, `ひる (hiru)`, `ばん (ban)`, `よる (yoru)`, `D`, `夜 means "night/evening". 夜ごはん = dinner. မြန်မာလို - ည`],
      [`What does 言う mean?`, `To hear`, `To speak`, `To say`, `To read`, `C`, `言う (いう/iu) means "to say". မြန်မာလို - ပြောသည်`],
      [`What does 名前 mean?`, `Address`, `Age`, `Name`, `Birthday`, `C`, `名前 (なまえ/namae) means "name". မြန်မာလို - နာမည်`],
      [`What is the reading of 気?`, `き (ki)`, `て (te)`, `め (me)`, `ち (chi)`, `A`, `気 means "spirit/mind/air". 天気 = weather, 元気 = healthy. မြန်မာလို - စိတ်`],
      [`What does 前 mean?`, `After/Behind`, `Before/Front`, `Above`, `Below`, `B`, `前 (まえ/mae) means "before" or "in front". 名前 = name. မြန်မာလို - ရှေ့ / အရင်`],
      [`What does 後 mean?`, `Before`, `After/Behind`, `Above`, `Below`, `B`, `後 (あと/うしろ) means "after" or "behind". 午後 = afternoon. မြန်မာလို - နောက်`],
    ];

    // =====================================================
    // N5 GRAMMAR
    // =====================================================
    const n5Grammar = [
      [`Fill in: わたし ___ がくせいです。`, `を`, `に`, `は`, `で`, `C`, `は is the topic marker particle. "I am a student." မြန်မာလို - ကျွန်တော်/ကျွန်မ ကျောင်းသားပါ။`],
      [`Which is correct? "I eat sushi."`, `すしを たべます`, `すしは たべます`, `すしに たべます`, `すしで たべます`, `A`, `を marks the direct object of an action verb. မြန်မာလို - ဆူရှီ စားပါတယ်။`],
      [`Fill in: がっこう ___ いきます。`, `を`, `に`, `は`, `で`, `B`, `に indicates direction/destination with movement verbs. မြန်မာလို - ကျောင်းသွားပါတယ်။`],
      [`Fill in: でんしゃ ___ いきます。`, `を`, `に`, `は`, `で`, `D`, `で marks the means/method of transport. မြန်မာလို - ရထားနဲ့ သွားပါတယ်။`],
      [`Which means "I don't eat"?`, `たべます`, `たべません`, `たべました`, `たべましょう`, `B`, `～ません is the negative present polite form. မြန်မာလို - မစားပါဘူး။`],
      [`Which is past tense of たべます?`, `たべます`, `たべません`, `たべました`, `たべましょう`, `C`, `～ました is the past polite form. မြန်မာလို - စားခဲ့ပါတယ်။`],
      [`Fill in: きのう なにを ___か。`, `します`, `しました`, `しません`, `していません`, `B`, `Past tense question: "What did you do yesterday?" မြန်မာလို - မနေ့က ဘာလုပ်ခဲ့ပါသလဲ။`],
      [`"There is a cat" → ねこが ___。`, `います`, `あります`, `です`, `なります`, `A`, `います is for living things (people, animals). မြန်မာလို - ကြောင်ရှိပါတယ်။`],
      [`"There is a book" → ほんが ___。`, `います`, `あります`, `です`, `なります`, `B`, `あります is for non-living things. မြန်မာလို - စာအုပ်ရှိပါတယ်။`],
      [`Fill in: この りんご ___ おいしいです。`, `が`, `を`, `に`, `で`, `A`, `が marks the subject with adjective predicates. မြန်မာလို - ဒီပန်းသီး အရသာကောင်းပါတယ်။`],
      [`Which means "Let's eat"?`, `たべます`, `たべません`, `たべました`, `たべましょう`, `D`, `～ましょう is the "let's do ~" suggestion form. မြန်မာလို - စားကြရအောင်။`],
      [`Fill in: ミラーさん ___ アメリカ人です。`, `が`, `は`, `を`, `に`, `B`, `は introduces the topic of the sentence. မြန်မာလို - မီလာဆန်ဟာ အမေရိကန်ပါ။`],
      [`"Don't run!" → ___。`, `はしります`, `はしってください`, `はしらないでください`, `はしりましょう`, `C`, `～ないでください is the polite negative request form. မြန်မာလို - မပြေးပါနှင့်။`],
      [`Which is て-form of のむ?`, `のんで`, `のみて`, `のって`, `のして`, `A`, `のむ → のんで (む→んで pattern). မြန်မာလို - သောက်ပြီး...`],
      [`"Please sit" → ___。`, `すわります`, `すわってください`, `すわりません`, `すわりましょう`, `B`, `～てください is the polite request form. မြန်မာလို - ထိုင်ပါ။`],
    ];

    // =====================================================
    // N4 KANJI — Minna no Nihongo II (Lessons 26–50)
    // =====================================================
    const n4Kanji = [
      // --- Lesson 26-30 range kanji ---
      [`What is the reading of 会社?`, `がっこう (gakkou)`, `かいしゃ (kaisha)`, `びょういん (byouin)`, `えき (eki)`, `B`, `会社 means "company". မြန်မာလို - ကုမ္ပဏီ`],
      [`What does 教える mean?`, `To learn`, `To teach`, `To read`, `To speak`, `B`, `教える (おしえる) means "to teach". မြန်မာလို - သင်ပေးသည်`],
      [`What does 習う mean?`, `To teach`, `To learn`, `To play`, `To work`, `B`, `習う (ならう/narau) means "to learn (from someone)". မြန်မာလို - သင်ယူသည်`],
      [`What does 答える mean?`, `To ask`, `To answer`, `To teach`, `To think`, `B`, `答える (こたえる/kotaeru) means "to answer". မြန်မာလို - ဖြေသည်`],
      [`What does 問題 mean?`, `Answer`, `Question/Problem`, `Lesson`, `Textbook`, `B`, `問題 (もんだい/mondai) means "question" or "problem". မြန်မာလို - ပြဿနာ / မေးခွန်း`],
      [`What does 質問 mean?`, `Answer`, `Test`, `Question`, `Problem`, `C`, `質問 (しつもん/shitsumon) means "question". မြန်မာလို - မေးခွန်း`],
      [`What does 開ける mean?`, `To close`, `To open`, `To push`, `To pull`, `B`, `開ける (あける/akeru) means "to open". မြန်မာလို - ဖွင့်သည်`],
      [`What does 閉める mean?`, `To open`, `To close`, `To push`, `To pull`, `B`, `閉める (しめる/shimeru) means "to close". မြန်မာလို - ပိတ်သည်`],
      [`What does 始まる mean?`, `To end`, `To begin`, `To continue`, `To stop`, `B`, `始まる (はじまる/hajimaru) means "to begin". မြန်မာလို - စတင်သည်`],
      [`What does 終わる mean?`, `To begin`, `To end/finish`, `To continue`, `To rest`, `B`, `終わる (おわる/owaru) means "to end" or "to finish". မြန်မာလို - ပြီးဆုံးသည်`],
      [`What does 送る mean?`, `To receive`, `To send`, `To carry`, `To throw`, `B`, `送る (おくる/okuru) means "to send". မြန်မာလို - ပို့သည်`],
      [`What does 届ける mean?`, `To receive`, `To deliver`, `To return`, `To borrow`, `B`, `届ける (とどける/todokeru) means "to deliver". မြန်မာလို - ပို့ပေးသည်`],
      [`What does 届く mean?`, `To send`, `To deliver`, `To arrive/reach`, `To leave`, `C`, `届く (とどく/todoku) means "to arrive" or "to reach". မြန်မာလို - ရောက်သည်`],
      [`What does 持つ mean?`, `To give`, `To have/hold`, `To throw`, `To catch`, `B`, `持つ (もつ/motsu) means "to hold" or "to have". မြန်မာလို - ကိုင်သည် / ရှိသည်`],
      [`What does 走る mean?`, `To walk`, `To run`, `To fly`, `To swim`, `B`, `走る (はしる/hashiru) means "to run". မြန်မာလို - ပြေးသည်`],
      [`What does 歩く mean?`, `To run`, `To walk`, `To fly`, `To swim`, `B`, `歩く (あるく/aruku) means "to walk". မြန်မာလို - လမ်းလျှောက်သည်`],
      [`What does 泳ぐ mean?`, `To run`, `To walk`, `To fly`, `To swim`, `D`, `泳ぐ (およぐ/oyogu) means "to swim". မြန်မာလို - ရေကူးသည်`],
      [`What does 遊ぶ mean?`, `To work`, `To study`, `To play`, `To rest`, `C`, `遊ぶ (あそぶ/asobu) means "to play". မြန်မာလို - ကစားသည်`],
      [`What does 売る mean?`, `To buy`, `To sell`, `To give`, `To take`, `B`, `売る (うる/uru) means "to sell". မြန်မာလို - ရောင်းသည်`],
      [`What does 払う mean?`, `To receive`, `To pay`, `To save`, `To lend`, `B`, `払う (はらう/harau) means "to pay". မြန်မာလို - ပေးချေသည်`],

      // --- More N4 Kanji ---
      [`What is the reading of 旅行?`, `しゅっちょう (shucchou)`, `りょこう (ryokou)`, `さんぽ (sanpo)`, `うんどう (undou)`, `B`, `旅行 means "travel/trip". မြန်မာလို - ခရီးသွားခြင်း`],
      [`What is the reading of 病院?`, `びょういん (byouin)`, `がっこう (gakkou)`, `えき (eki)`, `うち (uchi)`, `A`, `病院 means "hospital". မြန်မာလို - ဆေးရုံ`],
      [`What is the reading of 病気?`, `てんき (tenki)`, `げんき (genki)`, `びょうき (byouki)`, `でんき (denki)`, `C`, `病気 means "illness/sick". မြန်မာလို - ရောဂါ / နာမကျန်း`],
      [`What does 元気 mean?`, `Sick`, `Healthy/Fine`, `Tired`, `Busy`, `B`, `元気 (げんき/genki) means "healthy" or "fine". မြန်မာလို - ကျန်းမာသော`],
      [`What does 有名 mean?`, `Unknown`, `Famous`, `Quiet`, `Busy`, `B`, `有名 (ゆうめい/yuumei) means "famous". မြန်မာလို - ကျော်ကြားသော`],
      [`What does 便利 mean?`, `Inconvenient`, `Convenient`, `Difficult`, `Easy`, `B`, `便利 (べんり/benri) means "convenient". မြန်မာလို - အဆင်ပြေသော`],
      [`What does 不便 mean?`, `Convenient`, `Inconvenient`, `Easy`, `Difficult`, `B`, `不便 (ふべん/fuben) means "inconvenient". မြန်မာလို - အဆင်မပြေသော`],
      [`What does 大切 mean?`, `Useless`, `Important/Precious`, `Difficult`, `Easy`, `B`, `大切 (たいせつ/taisetsu) means "important" or "precious". မြန်မာလို - အရေးကြီးသော`],
      [`What does 残念 mean?`, `Happy`, `Regrettable/Unfortunate`, `Angry`, `Sad`, `B`, `残念 (ざんねん/zannen) means "unfortunate/regrettable". မြန်မာလို - ဝမ်းနည်းစရာ`],
      [`What does 特別 mean?`, `Normal`, `Special`, `Ordinary`, `Usual`, `B`, `特別 (とくべつ/tokubetsu) means "special". မြန်မာလို - ထူးခြားသော`],
      [`What does 必要 mean?`, `Unnecessary`, `Necessary/Needed`, `Possible`, `Impossible`, `B`, `必要 (ひつよう/hitsuyou) means "necessary". မြန်မာလို - လိုအပ်သော`],
      [`What does 安全 mean?`, `Dangerous`, `Safe`, `Scary`, `Strong`, `B`, `安全 (あんぜん/anzen) means "safe/safety". မြན်မာလို - ဘေးကင်းသော`],
      [`What does 危険 mean?`, `Safe`, `Dangerous`, `Easy`, `Fun`, `B`, `危険 (きけん/kiken) means "dangerous/danger". မြန်မာလို - အန္တရာယ်ရှိသော`],

      // --- Family / People N4 ---
      [`What is the reading of 家族?`, `かぞく (kazoku)`, `ともだち (tomodachi)`, `りょうしん (ryoushin)`, `きょうだい (kyoudai)`, `A`, `家族 means "family". မြန်မာလို - မိသားစု`],
      [`What is the reading of 両親?`, `かぞく (kazoku)`, `こども (kodomo)`, `りょうしん (ryoushin)`, `きょうだい (kyoudai)`, `C`, `両親 means "parents" (both). မြန်မာလို - မိဘနှစ်ပါး`],
      [`What is the reading of 兄弟?`, `りょうしん (ryoushin)`, `きょうだい (kyoudai)`, `ともだち (tomodachi)`, `かぞく (kazoku)`, `B`, `兄弟 means "siblings/brothers". မြန်မာလို - ညီအစ်ကို`],
      [`What does 父 mean?`, `Mother`, `Father`, `Brother`, `Sister`, `B`, `父 (ちち/chichi) means "father" (humble). မြန်မာလို - အဖေ`],
      [`What does 母 mean?`, `Father`, `Mother`, `Brother`, `Sister`, `B`, `母 (はは/haha) means "mother" (humble). မြန်မာလို - အမေ`],
      [`What does 兄 mean?`, `Younger brother`, `Older brother`, `Older sister`, `Younger sister`, `B`, `兄 (あに/ani) means "older brother" (humble). မြန်မာလို - အစ်ကို`],
      [`What does 姉 mean?`, `Younger sister`, `Older sister`, `Older brother`, `Younger brother`, `B`, `姉 (あね/ane) means "older sister" (humble). မြန်မာလို - အစ်မ`],
      [`What does 弟 mean?`, `Older brother`, `Younger brother`, `Older sister`, `Younger sister`, `B`, `弟 (おとうと/otouto) means "younger brother". မြန်မာလို - ညီ`],
      [`What does 妹 mean?`, `Older sister`, `Younger sister`, `Older brother`, `Younger brother`, `B`, `妹 (いもうと/imouto) means "younger sister". မြန်မာလို - ညီမ`],

      // --- More everyday N4 ---
      [`What does 料理 mean?`, `Shopping`, `Cooking/Cuisine`, `Cleaning`, `Washing`, `B`, `料理 (りょうり/ryouri) means "cooking" or "cuisine". မြန်မာလို - ချက်ပြုတ်ခြင်း`],
      [`What does 洗う mean?`, `To clean`, `To wash`, `To dry`, `To iron`, `B`, `洗う (あらう/arau) means "to wash". မြန်မာလို - ဆေးသည်`],
      [`What does 引く mean?`, `To push`, `To pull`, `To lift`, `To carry`, `B`, `引く (ひく/hiku) means "to pull". Also: 辞書を引く = look up in dictionary. မြန်မာလို - ဆွဲသည်`],
      [`What does 押す mean?`, `To pull`, `To push`, `To lift`, `To throw`, `B`, `押す (おす/osu) means "to push". မြန်မာလို - တွန်းသည်/ဖိသည်`],
      [`What does 変える mean?`, `To decide`, `To change`, `To continue`, `To stop`, `B`, `変える (かえる/kaeru) means "to change (something)". မြန်မာလို - ပြောင်းသည်`],
      [`What does 決める mean?`, `To change`, `To decide`, `To stop`, `To continue`, `B`, `決める (きめる/kimeru) means "to decide". မြန်မာလို - ဆုံးဖြတ်သည်`],
      [`What does 忘れる mean?`, `To remember`, `To forget`, `To think`, `To know`, `B`, `忘れる (わすれる/wasureru) means "to forget". မြန်မာလို - မေ့သည်`],
      [`What does 覚える mean?`, `To forget`, `To remember/memorize`, `To think`, `To dream`, `B`, `覚える (おぼえる/oboeru) means "to remember" or "to memorize". မြန်မာလို - မှတ်မိသည်`],
      [`What does 考える mean?`, `To know`, `To forget`, `To think/consider`, `To decide`, `C`, `考える (かんがえる/kangaeru) means "to think" or "to consider". မြန်မာလို - တွေးသည်`],
      [`What does 調べる mean?`, `To ask`, `To look up/investigate`, `To teach`, `To answer`, `B`, `調べる (しらべる/shiraberu) means "to investigate" or "to look up". မြန်မာလို - ရှာဖွေစစ်ဆေးသည်`],
      [`What does 選ぶ mean?`, `To decide`, `To choose/select`, `To change`, `To compare`, `B`, `選ぶ (えらぶ/erabu) means "to choose" or "to select". မြန်မာလို - ရွေးချယ်သည်`],
      [`What does 集める mean?`, `To scatter`, `To collect/gather`, `To separate`, `To break`, `B`, `集める (あつめる/atsumeru) means "to collect" or "to gather". မြန်မာလို - စုဆောင်းသည်`],
      [`What does 受ける mean?`, `To give`, `To receive/take`, `To send`, `To throw`, `B`, `受ける (うける/ukeru) means "to receive" or "to take (a test)". မြန်မာလို - ခံယူသည်`],
      [`What does 約束 mean?`, `Meeting`, `Promise/Appointment`, `Plan`, `Memory`, `B`, `約束 (やくそく/yakusoku) means "promise" or "appointment". မြန်မာလို - ကတိ`],
      [`What does 準備 mean?`, `Review`, `Preparation`, `Practice`, `Test`, `B`, `準備 (じゅんび/junbi) means "preparation". မြန်မာလို - ပြင်ဆင်ခြင်း`],
      [`What does 経験 mean?`, `Knowledge`, `Memory`, `Study`, `Experience`, `D`, `経験 (けいけん/keiken) means "experience". မြန်မာလို - အတွေ့အကြုံ`],
      [`What does 生活 mean?`, `Work`, `Life/Living`, `Study`, `Hobby`, `B`, `生活 (せいかつ/seikatsu) means "life" or "living". မြန်မာလို - နေထိုင်မှု`],
      [`What does 世界 mean?`, `Country`, `City`, `World`, `Town`, `C`, `世界 (せかい/sekai) means "world". မြန်မာလို - ကမ္ဘာ`],
      [`What does 社会 mean?`, `Company`, `Society`, `School`, `Government`, `B`, `社会 (しゃかい/shakai) means "society". မြန်မာလို - လူ့အဖွဲ့အစည်း`],
    ];

    // =====================================================
    // N4 GRAMMAR
    // =====================================================
    const n4Grammar = [
      [`Choose the correct て-form of 書く:`, `書いて`, `書って`, `書きて`, `書して`, `A`, `書く → 書いて (く→いて pattern). မြန်မာလို - ရေးပြီးတော့...`],
      [`Fill in: 雨が ふって___、さんぽに いきませんでした。`, `いたから`, `いるので`, `いたので`, `いますから`, `C`, `〜ていたので expresses reason in past progressive. မြန်မာလို - မိုးရွာနေလို့ လမ်းမလျှောက်ဖြစ်ခဲ့ပါ`],
      [`Which expresses ability? "I can speak Japanese."`, `にほんごを はなします`, `にほんごが はなせます`, `にほんごを はなしたい`, `にほんごに はなします`, `B`, `〜が + potential form expresses ability. မြန်မာလို - ဂျပန်စကား ပြောတတ်ပါတယ်`],
      [`Choose the correct て-form of 飲む:`, `飲んで`, `飲みて`, `飲って`, `飲して`, `A`, `飲む → 飲んで (む→んで pattern). မြန်မာလို - သောက်ပြီး...`],
      [`Choose the correct て-form of 待つ:`, `待いて`, `待って`, `待ちて`, `待して`, `B`, `待つ → 待って (つ→って pattern). မြန်မာလို - စောင့်ပြီး...`],
      [`Fill in: たなかさんは いま ごはんを ___います。`, `たべる`, `たべて`, `たべた`, `たべ`, `B`, `〜ています expresses ongoing action. "Tanaka is eating now." မြန်မာလို - တနာကာ ယခု ထမင်းစားနေပါသည်`],
      [`Which means "I want to go to Japan"?`, `にほんに いきます`, `にほんに いきたいです`, `にほんに いきました`, `にほんに いきません`, `B`, `〜たいです expresses desire. မြန်မာလို - ဂျပန်သွားချင်ပါတယ်`],
      [`Fill in: まど ___ あけてください。`, `が`, `を`, `に`, `で`, `B`, `を marks the object of the action あける (to open). မြန်မာလို - ပြတင်းပေါက်ကို ဖွင့်ပေးပါ`],
      [`Which means "must study"?`, `べんきょうしなくてもいいです`, `べんきょうしなければなりません`, `べんきょうしてもいいです`, `べんきょうしたいです`, `B`, `〜なければなりません means "must do ~". မြန်မာလို - စာကျက်ရမည်`],
      [`Which means "may I take a photo"?`, `しゃしんを とります`, `しゃしんを とってもいいですか`, `しゃしんを とりません`, `しゃしんを とらなければなりません`, `B`, `〜てもいいですか asks for permission. မြန်မာလို - ဓာတ်ပုံ ရိုက်လို့ ရပါသလား`],
      [`Fill in: びょうきの とき、くすりを ___。`, `のみます`, `のんでいます`, `のんだことがあります`, `のまないでください`, `A`, `〜のとき describes a conditional time. မြန်မာလို - ဖျားတဲ့အခါ ဆေးသောက်ပါတယ်`],
      [`Which means "I have been to Kyoto"?`, `きょうとに いきます`, `きょうとに いきたいです`, `きょうとに いったことがあります`, `きょうとに いってください`, `C`, `〜たことがあります expresses past experience. မြန်မာလို - ကျိုတိုကို သွားဖူးပါတယ်`],
      [`Fill in: テレビを みた ___ ねました。`, `あとで`, `まえに`, `あいだに`, `ながら`, `A`, `〜あとで means "after doing ~". မြန်မာလို - TV ကြည့်ပြီးတော့ အိပ်ခဲ့ပါတယ်`],
      [`Fill in: ごはんを たべる ___ てを あらいます。`, `あとで`, `まえに`, `とき`, `ながら`, `B`, `〜まえに means "before doing ~". မြန်မာလို - ထမင်းမစားခင် လက်ဆေးပါတယ်`],
      [`Which means "became expensive"?`, `たかいです`, `たかくなりました`, `たかかったです`, `たかくないです`, `B`, `い-adj → 〜くなりました means "became ~". မြန်မာလို - ဈေးကြီးလာခဲ့ပါတယ်`],
      [`Fill in: おんがくを ___ながら べんきょうします。`, `きく`, `きいて`, `きき`, `きいた`, `C`, `〜ながら (stem+ながら) = while doing. မြန်မာလို - ဂီတနားထောင်ရင်း စာကျက်ပါတယ်`],
      [`Which is the conditional? "If it rains..."`, `あめが ふると`, `あめが ふって`, `あめが ふったから`, `あめが ふりますが`, `A`, `〜と expresses a natural/automatic condition. မြန်မာလို - မိုးရွာရင်...`],
      [`Which means "seems delicious"?`, `おいしいです`, `おいしかったです`, `おいしそうです`, `おいしくないです`, `C`, `〜そうです (stem+そう) expresses appearance. မြန်မာလို - အရသာကောင်းပုံပဲ`],
      [`Fill in: にほんごが ___ なりました。`, `じょうずに`, `じょうずく`, `じょうずで`, `じょうずな`, `A`, `な-adj → 〜になりました means "became ~". မြန်မာလို - ဂျပန်စကား ကျွမ်းကျင်လာပါပြီ`],
      [`Which means "I think it will rain"?`, `あめが ふると おもいます`, `あめが ふっています`, `あめが ふりました`, `あめが ふってください`, `A`, `〜とおもいます expresses opinion. မြန်မာလို - မိုးရွာမယ်ထင်ပါတယ်`],
    ];

    // =====================================================
    // N3 KANJI
    // =====================================================
    const n3Kanji = [
      [`What is the reading of 経験?`, `けいけん (keiken)`, `けっかん (kekkan)`, `きけん (kiken)`, `しけん (shiken)`, `A`, `経験 means "experience". မြန်မာလို - အတွေ့အကြုံ`],
      [`What does 届ける mean?`, `To receive`, `To deliver`, `To return`, `To borrow`, `B`, `届ける (とどける) means "to deliver". မြန်မာလို - ပို့ပေးသည်`],
      [`What does 伝える mean?`, `To hide`, `To convey/tell`, `To forget`, `To receive`, `B`, `伝える (つたえる/tsutaeru) means "to convey" or "to tell". မြန်မာလို - ပြောကြားသည်`],
      [`What does 受け取る mean?`, `To send`, `To give`, `To receive`, `To throw`, `C`, `受け取る (うけとる/uketoru) means "to receive". မြန်မာလို - လက်ခံရရှိသည်`],
      [`What does 努力 mean?`, `Talent`, `Luck`, `Effort`, `Rest`, `C`, `努力 (どりょく/doryoku) means "effort". မြန်မာလို - ကြိုးပမ်းအားထုတ်မှု`],
      [`What does 成功 mean?`, `Failure`, `Success`, `Effort`, `Chance`, `B`, `成功 (せいこう/seikou) means "success". မြန်မာလို - အောင်မြင်ခြင်း`],
      [`What does 失敗 mean?`, `Success`, `Failure`, `Effort`, `Practice`, `B`, `失敗 (しっぱい/shippai) means "failure". မြန်မာလို - ကျရှုံးခြင်း`],
      [`What does 確認 mean?`, `Denial`, `Confirmation/Check`, `Question`, `Answer`, `B`, `確認 (かくにん/kakunin) means "confirmation" or "to check". မြန်မာလို - အတည်ပြုခြင်း`],
      [`What does 連絡 mean?`, `Meeting`, `Contact/Inform`, `Discussion`, `Argument`, `B`, `連絡 (れんらく/renraku) means "contact" or "to inform". မြန်မာလို - ဆက်သွယ်ခြင်း`],
      [`What does 紹介 mean?`, `Cancellation`, `Introduction`, `Invitation`, `Rejection`, `B`, `紹介 (しょうかい/shoukai) means "introduction". မြန်မာလို - မိတ်ဆက်ခြင်း`],
      [`What does 説明 mean?`, `Question`, `Explanation`, `Answer`, `Silence`, `B`, `説明 (せつめい/setsumei) means "explanation". မြန်မာလို - ရှင်းပြခြင်း`],
      [`What does 参加 mean?`, `Cancellation`, `Refusal`, `Participation`, `Absence`, `C`, `参加 (さんか/sanka) means "participation". မြန်မာလို - ပါဝင်ခြင်း`],
      [`What does 予定 mean?`, `Memory`, `Schedule/Plan`, `Record`, `Dream`, `B`, `予定 (よてい/yotei) means "schedule" or "plan". မြန်မာလို - အစီအစဉ်`],
      [`What does 予約 mean?`, `Cancellation`, `Reservation`, `Order`, `Payment`, `B`, `予約 (よやく/yoyaku) means "reservation" or "booking". မြန်မာလို - ကြိုတင်မှာယူခြင်း`],
      [`What does 注意 mean?`, `Praise`, `Caution/Attention`, `Ignorance`, `Forgiveness`, `B`, `注意 (ちゅうい/chuui) means "caution" or "attention". မြန်မာလို - သတိထားခြင်း`],
      [`What does 相談 mean?`, `Argument`, `Consultation`, `Decision`, `Promise`, `B`, `相談 (そうだん/soudan) means "consultation". 相談する = to consult. မြန်မာလို - တိုင်ပင်ခြင်း`],
      [`What does 反対 mean?`, `Agreement`, `Opposition/Opposite`, `Neutrality`, `Approval`, `B`, `反対 (はんたい/hantai) means "opposition" or "opposite". မြန်မာလို - ဆန့်ကျင်ခြင်း`],
      [`What does 賛成 mean?`, `Opposition`, `Agreement/Approval`, `Question`, `Silence`, `B`, `賛成 (さんせい/sansei) means "agreement" or "approval". မြန်မာလို - သဘောတူခြင်း`],
      [`What does 自然 mean?`, `Artificial`, `Nature`, `Science`, `Technology`, `B`, `自然 (しぜん/shizen) means "nature". မြန်မာလို - သဘာဝ`],
      [`What does 環境 mean?`, `Weather`, `Environment`, `Nature`, `Garden`, `B`, `環境 (かんきょう/kankyou) means "environment". မြန်မာလို - ပတ်ဝန်းကျင်`],
      [`What does 政治 mean?`, `Economy`, `Politics`, `Science`, `History`, `B`, `政治 (せいじ/seiji) means "politics". မြန်မာလို - နိုင်ငံရေး`],
      [`What does 経済 mean?`, `Politics`, `Economy`, `Society`, `Culture`, `B`, `経済 (けいざい/keizai) means "economy". မြန်မာလို - စီးပွားရေး`],
      [`What does 文化 mean?`, `Literature`, `Culture`, `Language`, `Art`, `B`, `文化 (ぶんか/bunka) means "culture". မြန်မာလို - ယဉ်ကျေးမှု`],
      [`What does 歴史 mean?`, `Geography`, `Science`, `Math`, `History`, `D`, `歴史 (れきし/rekishi) means "history". မြန်မာလို - သမိုင်း`],
      [`What does 関係 mean?`, `Separation`, `Relationship/Connection`, `Distance`, `Difference`, `B`, `関係 (かんけい/kankei) means "relationship" or "connection". မြန်မာလို - ဆက်ဆံရေး`],
      [`What does 原因 mean?`, `Result`, `Cause/Reason`, `Effect`, `Method`, `B`, `原因 (げんいん/gen'in) means "cause" or "reason". မြန်မာလို - အကြောင်းရင်း`],
      [`What does 結果 mean?`, `Cause`, `Result/Outcome`, `Process`, `Method`, `B`, `結果 (けっか/kekka) means "result" or "outcome". မြန်မာလို - ရလဒ်`],
      [`What does 影響 mean?`, `Cause`, `Result`, `Influence/Effect`, `Reason`, `C`, `影響 (えいきょう/eikyou) means "influence" or "effect". မြန်မာလို - သက်ရောက်မှု`],
      [`What does 比較 mean?`, `Competition`, `Comparison`, `Agreement`, `Difference`, `B`, `比較 (ひかく/hikaku) means "comparison". မြန်မာလို - နှိုင်းယှဉ်ခြင်း`],
      [`What does 増える mean?`, `To decrease`, `To increase`, `To change`, `To stop`, `B`, `増える (ふえる/fueru) means "to increase". မြန်မာလို - တိုးသည်`],
      [`What does 減る mean?`, `To increase`, `To decrease`, `To stay`, `To change`, `B`, `減る (へる/heru) means "to decrease". မြန်မာလို - လျော့သည်`],
      [`What does 捨てる mean?`, `To pick up`, `To throw away`, `To keep`, `To find`, `B`, `捨てる (すてる/suteru) means "to throw away". မြန်မာလို - စွန့်ပစ်သည်`],
      [`What does 拾う mean?`, `To throw`, `To pick up`, `To drop`, `To break`, `B`, `拾う (ひろう/hirou) means "to pick up". မြန်မာလို - ကောက်ယူသည်`],
      [`What does 壊す mean?`, `To fix`, `To break/destroy`, `To build`, `To clean`, `B`, `壊す (こわす/kowasu) means "to break" or "to destroy". မြန်မာလို - ဖျက်ဆီးသည်`],
      [`What does 直す mean?`, `To break`, `To fix/repair`, `To throw`, `To find`, `B`, `直す (なおす/naosu) means "to fix" or "to repair". မြန်မာလို - ပြင်ဆင်သည်`],
      [`What does 届く mean?`, `To send`, `To arrive/reach`, `To leave`, `To wait`, `B`, `届く (とどく/todoku) means "to arrive" or "to reach". မြန်မာလို - ရောက်ရှိသည်`],
      [`What does 間違える mean?`, `To be correct`, `To make a mistake`, `To understand`, `To forget`, `B`, `間違える (まちがえる/machigaeru) means "to make a mistake". မြန်မာလို - မှားသည်`],
      [`What does 慣れる mean?`, `To forget`, `To get used to`, `To learn`, `To teach`, `B`, `慣れる (なれる/nareru) means "to get used to". မြန်မာလို - အသားကျသည်`],
      [`What does 似る mean?`, `To differ`, `To resemble`, `To change`, `To copy`, `B`, `似る (にる/niru) means "to resemble". မြန်မာလို - တူသည်`],
      [`What does 興味 mean?`, `Boredom`, `Interest`, `Excitement`, `Fear`, `B`, `興味 (きょうみ/kyoumi) means "interest". 興味がある = to be interested. မြန်မာလို - စိတ်ဝင်စားမှု`],
    ];

    // =====================================================
    // N3 GRAMMAR
    // =====================================================
    const n3Grammar = [
      [`Fill in: この問題は 難しすぎて、___。`, `できました`, `できません`, `できます`, `できるでしょう`, `B`, `〜すぎて implies excessive degree leading to negative result. မြန်မာလို - ဒီပြဿနာက ခက်လွန်းလို့ မလုပ်နိုင်ပါ`],
      [`Choose the correct usage of ようにする:`, `毎日 運動する ようにしています`, `毎日 運動した ようにしています`, `毎日 運動の ようにしています`, `毎日 運動 ようにしています`, `A`, `〜ようにする means "to make an effort to do". မြန်မာလို - နေ့တိုင်း လေ့ကျင့်ခန်းလုပ်အောင် ကြိုးစားနေပါတယ်`],
      [`Which means "according to the news"?`, `ニュースによると`, `ニュースについて`, `ニュースに対して`, `ニュースにとって`, `A`, `〜によると means "according to". မြန်မာလို - သတင်းအရ`],
      [`Fill in: ___ば、じょうずに なります。`, `れんしゅうすれ`, `れんしゅうして`, `れんしゅうする`, `れんしゅうした`, `A`, `〜ば is the conditional form. "If you practice, you'll improve." မြန်မာလို - လေ့ကျင့်ရင် ကျွမ်းကျင်လာပါမယ်`],
      [`Fill in: 日本に 来て___、もう 2年に なります。`, `から`, `まで`, `ので`, `のに`, `A`, `〜てから means "since doing ~". မြန်မာလို - ဂျပန်ရောက်ကတည်းက နှစ်နှစ်ရှိပြီ`],
      [`Which means "it seems like rain"?`, `あめが ふるらしいです`, `あめが ふるそうです`, `あめが ふるようです`, `All are correct`, `D`, `らしい, そう(伝聞), よう all express "it seems". Each has slight nuance differences. မြန်မာလို - မိုးရွာမယ်ပုံပဲ`],
      [`Fill in: せんせいに ___ました。`, `ほめて`, `ほめられ`, `ほめさせ`, `ほめる`, `B`, `〜られました is the passive form. "I was praised by the teacher." မြန်မာလို - ဆရာဆီက ချီးကျူးခံရပါတယ်`],
      [`Which is the causative? "Made the child study."`, `こどもが べんきょうしました`, `こどもに べんきょうさせました`, `こどもは べんきょうしています`, `こどもを べんきょうしました`, `B`, `〜させました is the causative form. မြန်မာလို - ကလေးကို स्टာကျက်ခိုင်းခဲ့ပါတယ်`],
      [`Fill in: でんきを つけた___、へやを でました。`, `まま`, `ところ`, `ばかり`, `はず`, `A`, `〜たまま means "leaving something as is". မြန်မာလို - မီးဖွင့်ထားလျက် အခန်းကထွက်ခဲ့ပါတယ်`],
      [`Fill in: いま ごはんを たべた ___です。`, `まま`, `ところ`, `ばかり`, `はず`, `C`, `〜たばかりです means "just did ~". မြန်မာလို - ယခုမှ ထမင်းစားပြီးချင်းပဲ`],
      [`Which means "supposed to come"?`, `くるところです`, `くるはずです`, `くるばかりです`, `くるままです`, `B`, `〜はずです means "supposed to / expected to". မြန်မာလို - လာရမှာပါ`],
      [`Fill in: かのじょは うれしくて、ない___。`, `そうです`, `みたいです`, `ようです`, `らしいです`, `A`, `〜(ない)そうです = "looks like (won't cry)". Based on speaker's direct observation. မြန်မာလို - ပျော်လွန်းလို့ မငိုဟန်ပဲ`],
      [`Fill in: にほんごの じょうずな ___、えいごも できます。`, `だけでなく`, `ために`, `おかげで`, `せいで`, `A`, `〜だけでなく means "not only ~ but also". မြန်မာလို - ဂျပန်စကား ကျွမ်းရုံမက အင်္ဂလိပ်စကားလည်း ပြောတတ်ပါတယ်`],
      [`Fill in: 友達の ___で、しごとが みつかりました。`, `おかげ`, `せい`, `ため`, `わけ`, `A`, `〜のおかげで means "thanks to ~" (positive cause). မြန်မာလို - သူငယ်ချင်းကြောင့် အလုပ်ရခဲ့ပါတယ်`],
      [`Fill in: 電車が おくれた ___で、ちこくしました。`, `おかげ`, `せい`, `ため`, `わけ`, `B`, `〜のせいで means "because of ~" (negative cause). မြန်မာလို - ရထားနောက်ကျလို့ စာအတန်းနောက်ကျခဲ့ပါတယ်`],
      [`Which means "in order to pass the test"?`, `しけんに うかるように`, `しけんに うかるために`, `Both are correct`, `Neither is correct`, `C`, `〜ように and 〜ために both express purpose. ように is for potential/intransitive verbs. မြန်မာလို - စာမေးပွဲအောင်ဖို့`],
      [`Fill in: この本は 子ども___ 書かれた 本です。`, `ために`, `のために`, `ように`, `として`, `B`, `〜のために means "for the sake of ~". မြန်မာလို - ဒီစာအုပ်က ကလေးများအတွက် ရေးသားထားတဲ့ စာအုပ်ပါ`],
      [`Fill in: あの人は 日本人___話します。`, `ように`, `みたいに`, `らしく`, `All are correct`, `D`, `〜のように / みたいに / らしく all mean "like a ~". မြန်မာလို - ထိုသူက ဂျပန်လူလို ပြောပါတယ်`],
      [`Which means "whether or not"?`, `かどうか`, `かもしれない`, `にちがいない`, `にくい`, `A`, `〜かどうか means "whether or not". မြန်မာလို - ဟုတ်မဟုတ်`],
      [`Fill in: あした 雨が ふる___。`, `かもしれません`, `にちがいありません`, `はずです`, `わけです`, `A`, `〜かもしれません means "might ~". မြန်မာလို - မနက်ဖြန် မိုးရွာနိုင်ပါတယ်`],
    ];

    // =====================================================
    // N2 KANJI
    // =====================================================
    const n2Kanji = [
      [`What does 諦める mean?`, `To accept`, `To give up`, `To challenge`, `To try`, `B`, `諦める (あきらめる) means "to give up". မြန်မာလို - စွန့်လွှတ်သည်`],
      [`What does 驚く mean?`, `To laugh`, `To cry`, `To be surprised`, `To be angry`, `C`, `驚く (おどろく) means "to be surprised". မြန်မာလို - အံ့သြသည်`],
      [`What does 悩む mean?`, `To relax`, `To worry`, `To laugh`, `To sleep`, `B`, `悩む (なやむ) means "to worry/be troubled". မြန်မာလို - စိတ်ပူသည်`],
      [`What does 暮らす mean?`, `To work`, `To live/make a living`, `To travel`, `To play`, `B`, `暮らす (くらす) means "to live/make a living". မြန်မာလို - အသက်မွေးဝမ်းကျောင်းပြုသည်`],
      [`What does 育てる mean?`, `To teach`, `To raise/bring up`, `To play with`, `To protect`, `B`, `育てる (そだてる) means "to raise/bring up". မြန်မာလို - ပြုစုပျိုးထောင်သည်`],
      [`What does 目立つ mean?`, `To hide`, `To stand out`, `To shine`, `To disappear`, `B`, `目立つ (めだつ) means "to stand out". မြန်မာလို - ထင်ရှားသည်`],
      [`What does 尊敬 mean?`, `Love`, `Respect`, `Fear`, `Hate`, `B`, `尊敬 (そんけい) means "respect". မြန်မာလို - လေးစားခြင်း`],
      [`What does 交換 mean?`, `Purchase`, `Exchange`, `Return`, `Discard`, `B`, `交換 (こうかん) means "exchange". မြန်မာလို - လဲလှယ်ခြင်း`],
      [`What does 印象 mean?`, `Memory`, `Impression`, `Record`, `Photo`, `B`, `印象 (いんしょう) means "impression". မြန်မာလို - ပထမအကြိမ် အထင်အမြင်`],
      [`What does 価値 mean?`, `Price`, `Value/Worth`, `Cost`, `Tax`, `B`, `価値 (かち) means "value/worth". မြန်မာလို - တန်ဖိုး`],
      [`What does 常識 mean?`, `Knowledge`, `Common sense`, `Intelligence`, `Wisdom`, `B`, `常識 (じょうしき) means "common sense". မြန်မာလို - အထွေထွေ ဗဟုသုတ`],
      [`What does 制度 mean?`, `Law`, `System/Institution`, `Rule`, `Custom`, `B`, `制度 (せいど) means "system/institution". မြန်မာလို - စနစ်`],
      [`What does 対策 mean?`, `Problem`, `Countermeasure`, `Prevention`, `Solution`, `B`, `対策 (たいさく) means "countermeasure". မြန်မာလို - ပြန်လည်တုံ့ပြန်ရေး အစီအမံ`],
      [`What does 批判 mean?`, `Praise`, `Criticism`, `Report`, `Advice`, `B`, `批判 (ひはん) means "criticism". မြန်မာလို - ဝေဖန်ခြင်း`],
      [`What does 責任 mean?`, `Duty`, `Responsibility`, `Power`, `Position`, `B`, `責任 (せきにん) means "responsibility". မြန်မာလို - တာဝန်`],
      [`What does 状況 mean?`, `Condition`, `Situation`, `Weather`, `Mood`, `B`, `状況 (じょうきょう) means "situation". မြန်မာလို - အခြေအနေ`],
      [`What does 分野 mean?`, `Category`, `Field/Area`, `Subject`, `Topic`, `B`, `分野 (ぶんや) means "field/area (of study)". မြန်မာလို - နယ်ပယ်`],
      [`What does 資料 mean?`, `Reference`, `Materials/Data`, `Textbook`, `Dictionary`, `B`, `資料 (しりょう) means "materials/data". မြန်မာလို - အချက်အလက်`],
      [`What does 議論 mean?`, `Conversation`, `Discussion/Debate`, `Lecture`, `Speech`, `B`, `議論 (ぎろん) means "discussion/debate". မြန်မာလို - ဆွေးနွေးခြင်း`],
      [`What does 傾向 mean?`, `Direction`, `Tendency/Trend`, `Habit`, `Pattern`, `B`, `傾向 (けいこう) means "tendency/trend". မြန်မာလို - ခေတ်ရေစီးကြောင်း`],
      [`What does 曖昧 mean?`, `Clear`, `Vague/Ambiguous`, `Certain`, `Accurate`, `B`, `曖昧 (あいまい) means "vague/ambiguous". မြန်မာလို - ရှင်းလင်းမှုမရှိသော`],
      [`What does 素直 mean?`, `Stubborn`, `Honest/Obedient`, `Proud`, `Mean`, `B`, `素直 (すなお) means "honest/obedient". မြန်မာလို - ရိုးသားသော`],
      [`What does 柔軟 mean?`, `Rigid`, `Flexible`, `Strong`, `Weak`, `B`, `柔軟 (じゅうなん) means "flexible". မြန်မာလို - ပြောင်းလွယ်ပြင်လွယ်`],
      [`What does 効率的 mean?`, `Wasteful`, `Efficient`, `Simple`, `Complex`, `B`, `効率的 (こうりつてき) means "efficient". မြန်မာလို - ထိရောက်သော`],
      [`What does 具体的 mean?`, `Abstract`, `Concrete/Specific`, `General`, `Vague`, `B`, `具体的 (ぐたいてき) means "concrete/specific". မြန်မာလို - တိကျသော`],
      [`What does 実現 mean?`, `Dream`, `Realization/Achievement`, `Plan`, `Idea`, `B`, `実現 (じつげん) means "realization/achievement". မြန်မာလို - အကောင်အထည်ဖော်ခြင်း`],
      [`What does 貢献 mean?`, `Donation`, `Contribution`, `Support`, `Assistance`, `B`, `貢献 (こうけん) means "contribution". မြန်မာလို - ပံ့ပိုးကူညီခြင်း`],
      [`What does 活躍 mean?`, `Rest`, `Active role/Achievement`, `Victory`, `Participation`, `B`, `活躍 (かつやく) means "playing an active role". မြန်မာလို - တက်ကြွစွာ ပါဝင်ဆောင်ရွက်ခြင်း`],
      [`What does 取り消す mean?`, `To confirm`, `To cancel`, `To change`, `To add`, `B`, `取り消す (とりけす) means "to cancel". မြန်မာလို - ဖျက်သိမ်းသည်`],
      [`What does 向かう mean?`, `To return`, `To head toward`, `To arrive`, `To leave`, `B`, `向かう (むかう) means "to head toward". မြန်မာလို - ဦးတည်သွားသည်`],
    ];

    // =====================================================
    // N2 GRAMMAR
    // =====================================================
    const n2Grammar = [
      [`Fill in: この本は 大人___、子どもにも 読みやすい。`, `だけでなく`, `ばかりか`, `に限らず`, `All are correct`, `D`, `All three express "not only A but also B". မြန်မာလို - ဒီစာအုပ်က လူကြီးတွေသာမက ကလေးတွေအတွက်လည်း ဖတ်ရလွယ်ပါတယ်`],
      [`Which means "as long as"?`, `〜限り`, `〜次第`, `〜際に`, `〜上で`, `A`, `〜限り(かぎり) means "as long as". မြန်မာလို - ...သရွေ့`],
      [`Fill in: 試験に 合格した ___、就職が 決まった。`, `おかげで`, `せいで`, `くせに`, `わりに`, `A`, `〜おかげで indicates positive cause. မြန်မာလို - စာမေးပွဲ အောင်တဲ့ ကျေးဇူးနဲ့ အလုပ်ရခဲ့ပါတယ်`],
      [`Fill in: 日本語が 下手な ___、よく 話します。`, `おかげで`, `せいで`, `くせに`, `わりに`, `C`, `〜くせに means "even though" (critical nuance). မြန်မာလို - ဂျပန်စကား ညံ့ပါတဲ့နဲ့ အများကြီး ပြောပါတယ်`],
      [`Which means "depending on"?`, `〜次第`, `〜に関して`, `〜について`, `〜に対して`, `A`, `〜次第(しだい) means "depending on". မြန်မာလို - ...အပေါ်မူတည်ပြီး`],
      [`Fill in: 問題が ___次第、連絡します。`, `解決する`, `解決した`, `解決し`, `解決して`, `C`, `(Verb stem)＋次第 means "as soon as". မြန်မာလို - ပြဿနာ ဖြေရှင်းပြီးတာနဲ့ ဆက်သွယ်ပါမယ်`],
      [`Which means "regarding"?`, `〜に対して`, `〜に関して`, `〜について`, `Both B and C`, `D`, `〜に関して and 〜について both mean "regarding/about". မြန်မာလို - ...နှင့်ပတ်သက်၍`],
      [`Fill in: 彼は 学生___、会社も 経営している。`, `でありながら`, `にもかかわらず`, `であるくせに`, `Both A and B`, `D`, `Both express "despite being a student". မြန်မာလို - ကျောင်းသားဖြစ်ပါတဲ့နဲ့ ကုမ္ပဏီလည်း အုပ်ချုပ်ပါတယ်`],
      [`Which means "as a result"?`, `その結果`, `したがって`, `そのため`, `All are correct`, `D`, `All three can express "as a result" or "therefore". မြန်မာလို - ထို့ကြောင့်`],
      [`Fill in: 忙しい___、旅行に 行きたいです。`, `としても`, `にしても`, `ものの`, `Both A and B`, `D`, `〜としても/〜にしても both mean "even if". မြန်မာလို - အလုပ်များပေမယ့် ခရီးသွားချင်ပါတယ်`],
      [`Fill in: 日本に 来た ___は、日本語が 全然 分かりませんでした。`, `ばかり`, `ところ`, `ころ/とき`, `はず`, `C`, `〜ころ/とき means "when/around the time". မြန်မာလို - ဂျပန်ရောက်ကစက ဂျပန်စာ လုံးဝနားမလည်ခဲ့ပါ`],
      [`Which means "it's not that... (but)"?`, `〜わけではない`, `〜はずがない`, `〜ことはない`, `〜べきではない`, `A`, `〜わけではない means "it doesn't mean that...". မြန်မာလို - ...ဆိုတာ မဟုတ်ပါ`],
      [`Fill in: 薬を 飲んだ ___、まだ 頭が 痛いです。`, `のに`, `ので`, `から`, `ために`, `A`, `〜のに expresses frustration - "even though". မြန်မာလို - ဆေးသောက်ပေမယ့် ခေါင်းကိုက်နေသေးတယ်`],
      [`Which is correct for "should do"?`, `〜べきです`, `〜ことです`, `〜ものです`, `〜わけです`, `A`, `〜べきです means "should/ought to". မြန်မာလို - ...သင့်ပါတယ်`],
      [`Fill in: この仕事は 3人___では 終わらない。`, `だけ`, `ばかり`, `しか`, `ほど`, `A`, `〜だけでは means "just with/only with". မြန်မာလို - ဒီအလုပ် ၃ယောက်တည်းနဲ့ မပြီးနိုင်ပါ`],
    ];

    // =====================================================
    // N1 KANJI
    // =====================================================
    const n1Kanji = [
      [`What does 覆す mean?`, `To cover`, `To overturn/reverse`, `To hide`, `To protect`, `B`, `覆す (くつがえす) means "to overturn/reverse". မြန်မာလို - ပြောင်းပြန်လှန်သည်`],
      [`What does 潤う mean?`, `To dry`, `To be moist/profit`, `To flow`, `To freeze`, `B`, `潤う (うるおう) means "to be moist/to profit". မြန်မာလို - စိုပြေသည်`],
      [`What does 見なす mean?`, `To look at`, `To regard as`, `To ignore`, `To compare`, `B`, `見なす (みなす) means "to regard as/consider". မြန်မာလို - မှတ်ယူသည်`],
      [`What does 仕上げる mean?`, `To start`, `To finish/complete`, `To continue`, `To postpone`, `B`, `仕上げる (しあげる) means "to finish/complete". မြန်မာလို - ပြီးစီးအောင်ဆောင်ရွက်သည်`],
      [`What does 築く mean?`, `To destroy`, `To build/construct`, `To plan`, `To repair`, `B`, `築く (きずく) means "to build/construct". မြန်မာလို - တည်ဆောက်သည်`],
      [`What does 挑む mean?`, `To avoid`, `To challenge`, `To accept`, `To refuse`, `B`, `挑む (いどむ) means "to challenge". မြန်မာလို - စိန်ခေါ်သည်`],
      [`What does 促す mean?`, `To stop`, `To urge/encourage`, `To delay`, `To cancel`, `B`, `促す (うながす) means "to urge/encourage". မြန်မာလို - တိုက်တွန်းသည်`],
      [`What does 携わる mean?`, `To quit`, `To be engaged in`, `To observe`, `To avoid`, `B`, `携わる (たずさわる) means "to be engaged in". မြန်မာလို - ပါဝင်ဆောင်ရွက်သည်`],
      [`What does 免れる mean?`, `To receive`, `To escape/be exempt`, `To accept`, `To endure`, `B`, `免れる (まぬかれる) means "to escape/be exempt". မြန်မာလို - လွတ်မြောက်သည်`],
      [`What does 概念 mean?`, `Example`, `Concept/Notion`, `Summary`, `Introduction`, `B`, `概念 (がいねん) means "concept/notion". မြန်မာလို - သဘောတရား`],
      [`What does 本質 mean?`, `Appearance`, `Essence/True nature`, `Surface`, `Feature`, `B`, `本質 (ほんしつ) means "essence/true nature". မြန်မာလို - အနှစ်သာရ`],
      [`What does 矛盾 mean?`, `Agreement`, `Contradiction`, `Similarity`, `Harmony`, `B`, `矛盾 (むじゅん) means "contradiction". မြန်မာလို - ဆန့်ကျင်ကွဲလွဲမှု`],
      [`What does 哲学 mean?`, `Science`, `Philosophy`, `Psychology`, `History`, `B`, `哲学 (てつがく) means "philosophy". မြန်မာလို - ဒဿနိကဗေဒ`],
      [`What does 倫理 mean?`, `Logic`, `Ethics`, `Law`, `Custom`, `B`, `倫理 (りんり) means "ethics". မြန်မာလို - ကျင့်ဝတ်`],
      [`What does 偏見 mean?`, `Opinion`, `Prejudice/Bias`, `Viewpoint`, `Knowledge`, `B`, `偏見 (へんけん) means "prejudice/bias". မြန်မာလို - ဘက်လိုက်မှု`],
      [`What does 兆候 mean?`, `Prediction`, `Sign/Symptom`, `Result`, `Cause`, `B`, `兆候 (ちょうこう) means "sign/symptom". မြန်မာလို - လက္ခဏာ`],
      [`What does 洞察 mean?`, `Observation`, `Insight`, `Investigation`, `Experiment`, `B`, `洞察 (どうさつ) means "insight". မြန်မာလို - ထိုးထွင်းသိမြင်မှု`],
      [`What does 配慮 mean?`, `Ignorance`, `Consideration/Care`, `Attention`, `Awareness`, `B`, `配慮 (はいりょ) means "consideration/care". မြန်မာလို - ဂရုစိုက်မှု`],
      [`What does 把握 mean?`, `Assumption`, `Grasp/Comprehension`, `Memorization`, `Study`, `B`, `把握 (はあく) means "grasp/comprehension". မြန်မာလို - နားလည်သဘောပေါက်မှု`],
      [`What does 根拠 mean?`, `Opinion`, `Basis/Grounds`, `Conclusion`, `Summary`, `B`, `根拠 (こんきょ) means "basis/grounds". မြန်မာလို - အခြေအမြစ်`],
      [`What does 恩恵 mean?`, `Debt`, `Benefit/Blessing`, `Gift`, `Reward`, `B`, `恩恵 (おんけい) means "benefit/blessing". မြန်မာလို - ကျေးဇူး / ကောင်းချီး`],
      [`What does 葛藤 mean?`, `Peace`, `Conflict/Struggle`, `Harmony`, `Agreement`, `B`, `葛藤 (かっとう) means "conflict/struggle". မြန်မာလို - ပဋိပက္ခ`],
      [`What does 顕著 mean?`, `Hidden`, `Remarkable/Prominent`, `Subtle`, `Average`, `B`, `顕著 (けんちょ) means "remarkable/prominent". မြန်မာလို - ထင်ရှားသော`],
      [`What does 膨大 mean?`, `Tiny`, `Enormous/Vast`, `Normal`, `Average`, `B`, `膨大 (ぼうだい) means "enormous/vast". မြန်မာလို - ကြီးမားသော`],
      [`What does 深刻 mean?`, `Light`, `Serious/Grave`, `Funny`, `Simple`, `B`, `深刻 (しんこく) means "serious/grave". မြန်မာလို - ဆိုးရွားသော`],
      [`What does 壮大 mean?`, `Small`, `Magnificent/Grand`, `Simple`, `Ordinary`, `B`, `壮大 (そうだい) means "magnificent/grand". မြန်မာလို - ကြီးကျယ်ခမ်းနားသော`],
      [`What does 微妙 mean?`, `Obvious`, `Subtle/Delicate`, `Strong`, `Clear`, `B`, `微妙 (びみょう) means "subtle/delicate". မြန်မာလို - မထင်မရှားသော`],
      [`What does 緻密 mean?`, `Rough`, `Meticulous/Elaborate`, `Simple`, `Quick`, `B`, `緻密 (ちみつ) means "meticulous/elaborate". မြန်မာလို - စေ့စပ်သေချာသော`],
      [`What does 著しい mean?`, `Slight`, `Remarkable/Striking`, `Normal`, `Gradual`, `B`, `著しい (いちじるしい) means "remarkable/striking". မြန်မာလို - ထင်ရှားစွာ`],
      [`What does 培う mean?`, `To destroy`, `To cultivate/foster`, `To plant`, `To harvest`, `B`, `培う (つちかう) means "to cultivate/foster". မြန်မာလို - ပျိုးထောင်သည်`],
    ];

    // =====================================================
    // N1 GRAMMAR
    // =====================================================
    const n1Grammar = [
      [`Fill in: 彼は 医者で___、研究者でもある。`, `あるとともに`, `ありながら`, `あると同時に`, `All are correct`, `D`, `All express "as well as being". မြန်မာလို - သူက ဆရာဝန်အဖြစ်သာမက သုတေသီလည်း ဖြစ်ပါတယ်`],
      [`Which means "to the extent that"?`, `〜ほど`, `〜くらい`, `〜だけ`, `Both A and B`, `D`, `〜ほど and 〜くらい both express degree. မြန်မာလို - ...လောက်ထိ`],
      [`Fill in: 努力した ___、成功した。`, `からこそ`, `からには`, `からして`, `からといって`, `A`, `〜からこそ means "precisely because". မြန်မာလို - ကြိုးစားခဲ့လို့သာလျှင် အောင်မြင်ခဲ့တာပါ`],
      [`Fill in: 約束した ___、守らなければならない。`, `からこそ`, `からには`, `からして`, `からといって`, `B`, `〜からには means "now that/since". မြန်မာလို - ကတိပေးခဲ့တာကိုးတည် တည်ရမည်`],
      [`Which means "not necessarily"?`, `〜とは限らない`, `〜わけがない`, `〜はずがない`, `〜ことはない`, `A`, `〜とは限らない means "not necessarily". မြန်မာလို - ...ဟူ၍ မဟုတ်ချေ`],
      [`Fill in: どんなに 忙しく___、健康は 大切だ。`, `ても`, `ては`, `ないと`, `なくては`, `A`, `〜ても means "even if/no matter how". မြန်မာလို - ဘယ်လောက်ပဲ အလုပ်များများ ကျန်းမာရေးက အရေးကြီးပါတယ်`],
      [`Which means "as if / it looks like"?`, `〜かのようだ`, `〜みたいだ`, `〜らしい`, `All are correct`, `D`, `All express appearance/seeming, with different formality levels. မြန်မာလို - ...ကဲ့သို့ / ...ပုံပဲ`],
      [`Fill in: 結果は ___にせよ、全力を 尽くそう。`, `どう`, `なに`, `いつ`, `どこ`, `A`, `〜にせよ means "regardless of". မြန်မာလို - ရလဒ် ဘယ်လိုပဲ ဖြစ်ဖြစ် အားကုန်ထုတ်ကြစို့`],
      [`Which means "without doing"?`, `〜ないで`, `〜ずに`, `〜ことなく`, `All are correct`, `D`, `All three express "without doing ~". 〜ことなく is most formal. မြန်မာလို - ...မလုပ်ဘဲ`],
      [`Fill in: 時間が ない ___、急ぎましょう。`, `以上`, `上は`, `からには`, `All are correct`, `D`, `〜以上/〜上は/〜からには all mean "since/given that". မြန်မာလို - အချိန်မရှိသང်ဘာ့ အမြန်လုပ်ကြပါစို့`],
      [`Fill in: 彼の 態度は 許す ___。`, `べきだ`, `べきではない`, `べからず`, `べからざる`, `C`, `〜べからず is classical "must not / should not". မြန်မာလို - သူ့ သဘောထားကို ခွင့်လွှတ်နိုင်ဖွယ် မရှိပါ`],
      [`Which means "as expected"?`, `やはり`, `さすが`, `まさか`, `Both A and B`, `D`, `やはり and さすが both can mean "as expected" with different nuances. မြန်မာလို - မျှော်လင့်ထားတဲ့ အတိုင်းပဲ`],
      [`Fill in: 合格___不合格___、連絡します。`, `であれ/であれ`, `にせよ/にせよ`, `にしろ/にしろ`, `All are correct`, `D`, `All patterns mean "whether A or B". မြန်မာလို - အောင်ဖြစ်ဖြစ် ကျဖြစ်ဖြစ် ဆက်သွယ်ပါမယ်`],
      [`Fill in: この映画は 見れば 見る___、面白くなる。`, `ほど`, `だけ`, `ばかり`, `まで`, `A`, `〜ば〜ほど means "the more...the more". မြန်မာလို - ကြည့်ရင်ကြည့်လေ ပိုစိတ်ဝင်စားလေပါ`],
      [`Which means "it goes without saying"?`, `言うまでもない`, `言わざるを得ない`, `言いようがない`, `言うべきだ`, `A`, `言うまでもない means "it goes without saying". မြန်မာလို - ပြောစရာမလိုပါ`],
    ];

    // Helper to build INSERT values
    function buildInsert(rows, level, category) {
      const values = [];
      const params = [];
      let idx = 1;
      for (const row of rows) {
        values.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5}, $${idx+6}, $${idx+7}, $${idx+8})`);
        params.push(level, category, row[0], row[1], row[2], row[3], row[4], row[5], row[6]);
        idx += 9;
      }
      return { values: values.join(',\n        '), params };
    }

    // Insert N5 Kanji
    let ins = buildInsert(n5Kanji, 'N5', 'kanji');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N5 Kanji: ${n5Kanji.length} questions`);

    // Insert N5 Grammar
    ins = buildInsert(n5Grammar, 'N5', 'grammar');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N5 Grammar: ${n5Grammar.length} questions`);

    // Insert N4 Kanji
    ins = buildInsert(n4Kanji, 'N4', 'kanji');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N4 Kanji: ${n4Kanji.length} questions`);

    // Insert N4 Grammar
    ins = buildInsert(n4Grammar, 'N4', 'grammar');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N4 Grammar: ${n4Grammar.length} questions`);

    // Insert N3 Kanji
    ins = buildInsert(n3Kanji, 'N3', 'kanji');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N3 Kanji: ${n3Kanji.length} questions`);

    // Insert N3 Grammar
    ins = buildInsert(n3Grammar, 'N3', 'grammar');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N3 Grammar: ${n3Grammar.length} questions`);

    // Insert N2 Kanji
    ins = buildInsert(n2Kanji, 'N2', 'kanji');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N2 Kanji: ${n2Kanji.length} questions`);

    // Insert N2 Grammar
    ins = buildInsert(n2Grammar, 'N2', 'grammar');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N2 Grammar: ${n2Grammar.length} questions`);

    // Insert N1 Kanji
    ins = buildInsert(n1Kanji, 'N1', 'kanji');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N1 Kanji: ${n1Kanji.length} questions`);

    // Insert N1 Grammar
    ins = buildInsert(n1Grammar, 'N1', 'grammar');
    await pool.query(`
      INSERT INTO quiz_questions (level, category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES ${ins.values}
    `, ins.params);
    console.log(`  ✅ N1 Grammar: ${n1Grammar.length} questions`);

    const total = n5Kanji.length + n5Grammar.length + n4Kanji.length + n4Grammar.length + n3Kanji.length + n3Grammar.length + n2Kanji.length + n2Grammar.length + n1Kanji.length + n1Grammar.length;
    console.log(`\n🎉 Total: ${total} quiz questions seeded!`);
    console.log('   N5: ' + (n5Kanji.length + n5Grammar.length) + ' (' + n5Kanji.length + ' kanji + ' + n5Grammar.length + ' grammar)');
    console.log('   N4: ' + (n4Kanji.length + n4Grammar.length) + ' (' + n4Kanji.length + ' kanji + ' + n4Grammar.length + ' grammar)');
    console.log('   N3: ' + (n3Kanji.length + n3Grammar.length) + ' (' + n3Kanji.length + ' kanji + ' + n3Grammar.length + ' grammar)');
    console.log('   N2: ' + (n2Kanji.length + n2Grammar.length) + ' (' + n2Kanji.length + ' kanji + ' + n2Grammar.length + ' grammar)');
    console.log('   N1: ' + (n1Kanji.length + n1Grammar.length) + ' (' + n1Kanji.length + ' kanji + ' + n1Grammar.length + ' grammar)');

  } catch (err) {
    console.error('❌ Error seeding kanji quiz data:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

seedKanjiQuiz();

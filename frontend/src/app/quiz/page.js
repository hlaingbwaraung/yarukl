'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuizQuestions, submitQuiz, getQuizHistory } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const TIMER_SECONDS = 30;
const QUESTIONS_PER_PART = 20;

export default function QuizPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState('select'); // select | quiz | result
  const [level, setLevel] = useState(null);
  const [category, setCategory] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]); // all fetched questions
  const [questions, setQuestions] = useState([]); // current part questions
  const [currentPart, setCurrentPart] = useState(1);
  const [totalParts, setTotalParts] = useState(1);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startTimer() {
    stopTimer();
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Auto-advance when timer hits 0 during active question
  useEffect(() => {
    if (phase === 'quiz' && timeLeft === 0 && !showFeedback) {
      setShowFeedback(true);
      // Mark as unanswered (no selectedOption set)
    }
  }, [timeLeft, phase, showFeedback]);

  // Start timer whenever we move to a new question
  useEffect(() => {
    if (phase === 'quiz') {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQ]);

  async function loadHistory() {
    try {
      const data = await getQuizHistory();
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    }
  }

  function getPartQuestions(allQs, part) {
    const start = (part - 1) * QUESTIONS_PER_PART;
    const end = start + QUESTIONS_PER_PART;
    return allQs.slice(start, end);
  }

  async function startQuiz(selectedLevel, selectedCategory) {
    setLoading(true);
    setLevel(selectedLevel);
    setCategory(selectedCategory);

    try {
      const data = await getQuizQuestions(selectedLevel, selectedCategory);
      if (data.questions && data.questions.length > 0) {
        const allQs = data.questions;
        const parts = Math.ceil(allQs.length / QUESTIONS_PER_PART);
        setAllQuestions(allQs);
        setTotalParts(parts);
        setCurrentPart(1);
        setQuestions(getPartQuestions(allQs, 1));
        setPhase('quiz');
        setCurrentQ(0);
        setAnswers({});
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        alert('No questions available for this selection.');
      }
    } catch (err) {
      alert('Failed to load questions.');
    }
    setLoading(false);
  }

  function handleAnswer(option) {
    if (showFeedback) return;
    stopTimer();
    setSelectedOption(option);
    setShowFeedback(true);
    setAnswers((prev) => ({ ...prev, [questions[currentQ].id]: option }));
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      finishQuiz();
    }
  }

  async function finishQuiz() {
    setLoading(true);
    // Build answers for current part, including unanswered questions
    const answerArray = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] || '',
    }));

    try {
      const data = await submitQuiz(level, category, answerArray, currentPart);
      setResult(data);
      setPhase('result');
      loadHistory();
    } catch (err) {
      alert('Failed to submit quiz.');
    }
    setLoading(false);
  }

  function startNextPart() {
    const nextPart = currentPart + 1;
    setCurrentPart(nextPart);
    setQuestions(getPartQuestions(allQuestions, nextPart));
    setPhase('quiz');
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setSelectedOption(null);
    setShowFeedback(false);
  }

  function resetQuiz() {
    stopTimer();
    setPhase('select');
    setLevel(null);
    setCategory(null);
    setAllQuestions([]);
    setQuestions([]);
    setCurrentPart(1);
    setTotalParts(1);
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setSelectedOption(null);
    setShowFeedback(false);
    setTimeLeft(TIMER_SECONDS);
  }

  // Level Selection Phase
  if (phase === 'select') {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            🎯 Quiz | စာမေးပွဲ
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">သင့်အဆင့်နှင့် အမျိုးအစားကို ရွေးချယ်ပြီး စတင်ပါ။</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { lvl: 'N5', desc: 'အခြေခံ', color: 'from-green-400 to-green-600', emoji: '🌱' },
            { lvl: 'N4', desc: 'အလယ်တန်းအောက်', color: 'from-blue-400 to-blue-600', emoji: '📚' },
            { lvl: 'N3', desc: 'အလယ်တန်း', color: 'from-purple-400 to-purple-600', emoji: '🎓' },
            { lvl: 'N2', desc: 'အဆင့်မြင့်', color: 'from-orange-400 to-orange-600', emoji: '🏆' },
            { lvl: 'N1', desc: 'ကျွမ်းကျင်', color: 'from-red-400 to-red-600', emoji: '👑' },
          ].map((item) => (
            <div key={item.lvl} className="card group">
              <div className={`h-2 rounded-full bg-gradient-to-r ${item.color} mb-4`} />
              <div className="text-4xl mb-3">{item.emoji}</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.lvl}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{item.desc}</p>
              <div className="space-y-2">
                <button
                  onClick={() => startQuiz(item.lvl, 'kanji')}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium
                             hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  漢字 ကန်ဂျီ
                </button>
                <button
                  onClick={() => startQuiz(item.lvl, 'grammar')}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-sakura-50 dark:bg-sakura-900/30 text-sakura-700 dark:text-sakura-300 rounded-lg text-sm font-medium
                             hover:bg-sakura-100 dark:hover:bg-sakura-900/50 transition-colors"
                >
                  文法 သဒ္ဒါ
                </button>
                <button
                  onClick={() => startQuiz(item.lvl, null)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium
                             hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  🔀 ရောနှောမေးခွန်း
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quiz History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📊 ယခင် ရလဒ်များ</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">အဆင့်</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">အမျိုးအစား</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">ရမှတ်</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">ရက်စွဲ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                          {h.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{h.category === 'kanji' ? 'ကန်ဂျီ' : h.category === 'grammar' ? 'သဒ္ဒါ' : 'ရောနှော'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          (h.score / h.total) >= 0.8 ? 'text-green-600' :
                          (h.score / h.total) >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {h.score}/{h.total} ({Math.round((h.score / h.total) * 100)}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 dark:text-gray-500">
                        {new Date(h.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quiz Phase
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const options = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ];

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium mr-2">
                {level}
              </span>
              {category && <span className="mr-2">{category === 'kanji' ? 'ကန်ဂျီ' : category === 'grammar' ? 'သဒ္ဒါ' : 'ရောနှော'}</span>}
              {totalParts > 1 && (
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
                  Part {currentPart}/{totalParts}
                </span>
              )}
            </span>
            <div className="flex items-center gap-3">
              <span>မေးခွန်း {currentQ + 1} / {questions.length}</span>
              {/* Circular Timer */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                  <circle
                    cx="20" cy="20" r="16"
                    stroke={timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#6366f1'}
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(timeLeft / TIMER_SECONDS) * 100.5} 100.5`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                  timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-yellow-500' : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {timeLeft}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-2">{q.category}</p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-relaxed font-japanese">
            {q.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {options.map((opt) => {
            let style = 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer';

            if (showFeedback) {
              if (opt.key === selectedOption && opt.key !== answers[q.id]) {
                // Need to check correctness from backend - we'll use simple approach
                // Since we don't have correct answer on client, show selected state
              }
              if (opt.key === selectedOption) {
                style = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-200 dark:ring-indigo-700';
              }
            } else if (opt.key === selectedOption) {
                style = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30';
            }

            return (
              <button
                key={opt.key}
                onClick={() => handleAnswer(opt.key)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${style} disabled:cursor-default`}
              >
                <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
                  {opt.key}
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-japanese">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Next / Finish Button */}
        {showFeedback && (
          <div className="text-center">
            {!selectedOption && (
              <p className="text-red-500 dark:text-red-400 text-sm font-medium mb-3">⏰ အချိန်ကုန်သွားပါပြီ! (Time&apos;s up!)</p>
            )}
            <button
              onClick={nextQuestion}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {currentQ < questions.length - 1 ? 'နောက်မေးခွန်း →' : '🏁 ပြီးဆုံးပါပြီ'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Result Phase
  if (phase === 'result' && result) {
    const percentage = result.percentage;
    const studentName = result.studentName || user?.name || 'Student';
    const hasNextPart = currentPart < totalParts;
    let emoji = '😢';
    let message = 'ဆက်ကြိုးစားပါ! မလေ့မနေပါနဲ့!';
    if (percentage >= 80) { emoji = '🎉'; message = 'အရမ်းတော်ပါတယ်! ဂုဏ်ယူပါတယ်!'; }
    else if (percentage >= 60) { emoji = '😊'; message = 'ကောင်းပါတယ်! ဆက်ကြိုးစားပါ!'; }
    else if (percentage >= 40) { emoji = '💪'; message = 'ကြိုးစားနေတာ ကောင်းပါတယ်! ဆက်လုပ်ပါ!'; }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Score Card */}
        <div className="card text-center mb-8">
          <div className="text-6xl mb-4">{emoji}</div>
          {/* Student Name */}
          <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-1">👤 {studentName}</p>
          {/* Part indicator */}
          {totalParts > 1 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-3">
              📋 Part {currentPart} / {totalParts}
            </p>
          )}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {result.score} / {result.total}
          </h2>
          <div className="w-32 h-32 mx-auto relative mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle
                cx="64" cy="64" r="56"
                stroke={percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(percentage / 100) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {percentage}%
            </span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">{message}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              {level}
            </span>
            {category && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                {category === 'kanji' ? 'ကန်ဂျီ' : category === 'grammar' ? 'သဒ္ဒါ' : 'ရောနှော'}
              </span>
            )}
          </div>
        </div>

        {/* Answer Details */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 အဖြေစစ်ဆေးချက်</h3>
        <div className="space-y-3 mb-8">
          {result.details?.map((d, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border-2 ${
                d.isCorrect
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{d.isCorrect ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    သင့်အဖြေ: <span className="font-medium">{d.yourAnswer}</span>
                    {!d.isCorrect && (
                      <span className="ml-2">
                        | မှန်သောအဖြေ: <span className="font-medium text-green-700 dark:text-green-400">{d.correctAnswer}</span>
                      </span>
                    )}
                  </p>
                  {d.explanation && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{d.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasNextPart && (
            <button onClick={startNextPart} className="btn-primary">
              ▶️ နောက် Part {currentPart + 1} စတင်ရန်
            </button>
          )}
          <button onClick={resetQuiz} className={hasNextPart ? 'btn-secondary' : 'btn-primary'}>
            🔄 အခြားမေးခွန်း ဖြေရန်
          </button>
          <button onClick={() => startQuiz(level, category)} className="btn-secondary">
            🔁 တူညီသောမေးခွန်း ထပ်ဖြေရန်
          </button>
        </div>
      </div>
    );
  }

  return null;
}

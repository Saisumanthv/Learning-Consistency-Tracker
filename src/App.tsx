import { useEffect, useState } from 'react';
import { Check, Flame } from 'lucide-react';
import Confetti from './components/Confetti';

interface TopicState {
  ai_knowledge: boolean;
  codebasics: boolean;
  trading: boolean;
}

interface DailyCompletion {
  date: string;
  ai_knowledge: boolean;
  codebasics: boolean;
  trading: boolean;
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [topics, setTopics] = useState<TopicState>({
    ai_knowledge: false,
    codebasics: false,
    trading: false,
  });
  const [completionMessages, setCompletionMessages] = useState<Record<string, boolean>>({});
  const [showBigCongrats, setShowBigCongrats] = useState(false);
  const [monthlyCompletions, setMonthlyCompletions] = useState<Record<string, DailyCompletion>>({});
  const [streak, setStreak] = useState(0);

  const topicNames = {
    ai_knowledge: 'AI Knowledge',
    codebasics: 'Codebasics',
    trading: 'Trading',
  };

  const STORAGE_KEY = 'daily-completions';

  const getAllCompletions = (): DailyCompletion[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const saveCompletions = (completions: DailyCompletion[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completions));
  };

  useEffect(() => {
    loadTodayData();
    loadMonthlyData();
    calculateStreak();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);

      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadTodayData();
        loadMonthlyData();
        calculateStreak();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (topics.ai_knowledge && topics.codebasics && topics.trading && !showBigCongrats) {
      setShowBigCongrats(true);
      setTimeout(() => setShowBigCongrats(false), 5000);
    }
  }, [topics]);

  const loadTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    const completions = getAllCompletions();
    const todayData = completions.find((c) => c.date === today);

    if (todayData) {
      setTopics({
        ai_knowledge: todayData.ai_knowledge,
        codebasics: todayData.codebasics,
        trading: todayData.trading,
      });
    } else {
      setTopics({
        ai_knowledge: false,
        codebasics: false,
        trading: false,
      });
    }
  };

  const loadMonthlyData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const completions = getAllCompletions();
    const monthlyData = completions.filter(
      (c) => c.date >= firstDay && c.date <= lastDay
    );

    const completionsMap: Record<string, DailyCompletion> = {};
    monthlyData.forEach((completion) => {
      completionsMap[completion.date] = completion;
    });
    setMonthlyCompletions(completionsMap);
  };

  const calculateStreak = () => {
    const completions = getAllCompletions();
    completions.sort((a, b) => b.date.localeCompare(a.date));

    if (completions.length === 0) {
      setStreak(0);
      return;
    }

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    for (let i = 0; i < completions.length + 1; i++) {
      const expectedDate = new Date(checkDate).toISOString().split('T')[0];
      const completion = completions.find((d) => d.date === expectedDate);

      if (!completion) {
        if (expectedDate === today) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }

      if (completion.ai_knowledge && completion.codebasics && completion.trading) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const handleTopicCheck = (topic: keyof TopicState) => {
    const newValue = !topics[topic];
    const today = new Date().toISOString().split('T')[0];

    const updatedTopics = { ...topics, [topic]: newValue };
    setTopics(updatedTopics);

    if (newValue) {
      setCompletionMessages({ ...completionMessages, [topic]: true });
      setTimeout(() => {
        setCompletionMessages((prev) => ({ ...prev, [topic]: false }));
      }, 3000);
    }

    const completions = getAllCompletions();
    const existingIndex = completions.findIndex((c) => c.date === today);

    if (existingIndex >= 0) {
      completions[existingIndex] = {
        ...completions[existingIndex],
        [topic]: newValue,
      };
    } else {
      completions.push({
        date: today,
        ai_knowledge: topic === 'ai_knowledge' ? newValue : false,
        codebasics: topic === 'codebasics' ? newValue : false,
        trading: topic === 'trading' ? newValue : false,
      });
    }

    saveCompletions(completions);
    loadMonthlyData();
    calculateStreak();
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getDateColor = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    if (dateString > today) {
      return 'bg-slate-800/40 border-2 border-slate-600/40 text-slate-400/60';
    }

    const completion = monthlyCompletions[dateString];
    if (!completion) {
      return 'bg-gradient-to-br from-red-600 to-red-700 text-white border-2 border-red-500/50';
    }

    if (completion.ai_knowledge && completion.codebasics && completion.trading) {
      return 'bg-gradient-to-br from-emerald-600 to-green-600 text-white border-2 border-emerald-400/50';
    }

    return 'bg-gradient-to-br from-red-600 to-red-700 text-white border-2 border-red-500/50';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      {showBigCongrats && <Confetti />}

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/40 to-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-400/20 p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-400 to-blue-300 mb-3 tracking-wide">
              Daily Consistency Tracker
            </h1>
            <p className="text-lg text-blue-300/90 font-light tracking-wide">
              {formatDate(currentDate)}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-blue-200/90 mb-5 text-center tracking-wide">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 min-w-max px-2 justify-center">
                {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map((day) => (
                  <div
                    key={day}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg font-semibold text-base ${getDateColor(
                      day
                    )} flex-shrink-0 transition-all hover:scale-110 shadow-lg`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center bg-gradient-to-r from-orange-900/40 to-orange-800/40 border border-orange-500/30 px-6 py-3 rounded-full shadow-lg">
              <Flame className="w-6 h-6 text-orange-400 mr-2 drop-shadow-glow" />
              <span className="text-2xl font-bold text-orange-300">{streak}</span>
              <span className="ml-2 text-orange-200/80 text-base font-normal">day streak</span>
            </div>
          </div>

          {showBigCongrats && (
            <div className="bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 border-2 border-emerald-400 text-emerald-100 p-6 rounded-2xl mb-6 text-center animate-pulse shadow-2xl">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-300">
                Congratulations!
              </h2>
              <p className="text-xl mt-2 text-emerald-200/90">You've made your time useful today!</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            {(Object.keys(topicNames) as Array<keyof TopicState>).map((topic) => (
              <div key={topic}>
                <button
                  onClick={() => handleTopicCheck(topic)}
                  className={`w-full flex items-center justify-between p-6 rounded-xl cursor-pointer transition-all duration-300 shadow-lg ${
                    topics[topic]
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 border-2 border-emerald-400 hover:from-emerald-700 hover:to-green-700'
                      : 'bg-slate-800/30 border-2 border-slate-700/30 hover:bg-slate-700/30 hover:border-blue-500/40'
                  }`}
                >
                  <span className="text-lg font-medium text-blue-100 tracking-wide">
                    {topicNames[topic]}
                  </span>
                  {topics[topic] && (
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  )}
                </button>
                {completionMessages[topic] && (
                  <div className="mt-2 ml-4 text-emerald-300 font-normal text-base animate-pulse">
                    Congrats on completing {topicNames[topic]} today!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

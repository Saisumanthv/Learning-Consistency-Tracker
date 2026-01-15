import { useEffect, useState, useRef } from 'react';
import { Check, Flame, Brain, GitBranch, FileCode } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [topics, setTopics] = useState<TopicState>({
    ai_knowledge: false,
    codebasics: false,
    trading: false,
  });
  const [completionMessages, setCompletionMessages] = useState<Record<string, boolean>>({});
  const [showBigCongrats, setShowBigCongrats] = useState(false);
  const [monthlyCompletions, setMonthlyCompletions] = useState<Record<string, DailyCompletion>>({});
  const [streak, setStreak] = useState(0);
  const currentDateRef = useRef<HTMLDivElement>(null);

  const topicNames = {
    ai_knowledge: 'AI Knowledge',
    codebasics: 'Codebasics',
    trading: 'Trading',
  };

  const topicIcons = {
    ai_knowledge: Brain,
    codebasics: GitBranch,
    trading: FileCode,
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
    loadDateData(selectedDate);
    loadMonthlyData();
    calculateStreak();
  }, []);

  useEffect(() => {
    loadDateData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);

      if (now.getHours() === 0 && now.getMinutes() === 0) {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
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

  useEffect(() => {
    if (currentDateRef.current) {
      currentDateRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [monthlyCompletions]);

  const loadDateData = (dateString: string) => {
    const completions = getAllCompletions();
    const dateData = completions.find((c) => c.date === dateString);

    if (dateData) {
      setTopics({
        ai_knowledge: dateData.ai_knowledge,
        codebasics: dateData.codebasics,
        trading: dateData.trading,
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

    const updatedTopics = { ...topics, [topic]: newValue };
    setTopics(updatedTopics);

    if (newValue) {
      setCompletionMessages({ ...completionMessages, [topic]: true });
      setTimeout(() => {
        setCompletionMessages((prev) => ({ ...prev, [topic]: false }));
      }, 3000);
    }

    const completions = getAllCompletions();
    const existingIndex = completions.findIndex((c) => c.date === selectedDate);

    if (existingIndex >= 0) {
      completions[existingIndex] = {
        ...completions[existingIndex],
        [topic]: newValue,
      };
    } else {
      completions.push({
        date: selectedDate,
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
      return 'bg-gray-900/40 border-2 border-gray-700/40 text-gray-500/60';
    }

    const completion = monthlyCompletions[dateString];
    if (!completion) {
      return 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400 border-2 border-gray-600/50';
    }

    if (completion.ai_knowledge && completion.codebasics && completion.trading) {
      return 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-2 border-emerald-400/70 shadow-lg shadow-emerald-500/30';
    }

    return 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400 border-2 border-gray-600/50';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950 py-8 px-4">
      {showBigCongrats && <Confetti />}

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900/90 via-emerald-950/30 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-500/30 p-8 mb-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Brain className="w-10 h-10 text-emerald-400" />
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 tracking-tight">
                Daily Consistency Tracker
              </h1>
              <Brain className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-base text-emerald-300/80 font-mono tracking-wider">
              {formatDate(new Date(selectedDate + 'T00:00:00'))}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-emerald-300/90 mb-5 text-center tracking-wide font-mono">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 min-w-max px-8 justify-center">
                {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map((day) => {
                  const isToday = day === new Date().getDate();
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateString === selectedDate;

                  return (
                    <div
                      key={day}
                      ref={isToday ? currentDateRef : null}
                      onClick={() => handleDateClick(day)}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg font-semibold text-base ${getDateColor(
                        day
                      )} flex-shrink-0 transition-all hover:scale-105 cursor-pointer font-mono ${
                        isSelected
                          ? 'shadow-[0_0_0_2px_rgb(16_185_129)] shadow-emerald-500'
                          : 'shadow-lg'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/50 px-6 py-3 rounded-full shadow-lg shadow-emerald-500/20">
              <Flame className="w-6 h-6 text-emerald-400 mr-2 drop-shadow-glow" />
              <span className="text-2xl font-bold text-emerald-300 font-mono">{streak}</span>
              <span className="ml-2 text-emerald-200/80 text-base font-normal">day streak</span>
            </div>
          </div>

          {showBigCongrats && (
            <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-400 text-emerald-100 p-6 rounded-xl mb-6 text-center animate-pulse shadow-2xl shadow-emerald-500/20">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-300">
                Congratulations!
              </h2>
              <p className="text-xl mt-2 text-emerald-200/90">You've made your time useful today!</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            {(Object.keys(topicNames) as Array<keyof TopicState>).map((topic) => {
              const Icon = topicIcons[topic];
              return (
                <div key={topic}>
                  <button
                    onClick={() => handleTopicCheck(topic)}
                    className={`w-full flex items-center justify-between p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                      topics[topic]
                        ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border-2 border-emerald-400/70 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20'
                        : 'bg-gray-800/40 border-2 border-gray-700/40 hover:bg-gray-800/60 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${topics[topic] ? 'text-white' : 'text-emerald-400'}`} />
                      <span className={`text-lg font-medium tracking-wide ${topics[topic] ? 'text-white' : 'text-emerald-200'}`}>
                        {topicNames[topic]}
                      </span>
                    </div>
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

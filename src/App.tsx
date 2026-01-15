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
      return 'bg-black/60 border-2 border-gray-800/60 text-gray-600/60';
    }

    const completion = monthlyCompletions[dateString];
    if (!completion) {
      return 'bg-gradient-to-br from-gray-900 to-black text-gray-500 border-2 border-gray-700/70';
    }

    if (completion.ai_knowledge && completion.codebasics && completion.trading) {
      return 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 text-black border-2 border-yellow-300 neon-border-gold font-black';
    }

    return 'bg-gradient-to-br from-gray-900 to-black text-gray-500 border-2 border-gray-700/70';
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
    <div className="min-h-screen bg-black cyber-grid py-4 sm:py-6 md:py-8 px-2 sm:px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-yellow-950/40"></div>
      {showBigCongrats && <Confetti />}

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gradient-to-br from-black/95 via-purple-950/50 to-black/95 backdrop-blur-sm rounded-none border-4 border-yellow-500 neon-border-gold shadow-2xl p-4 sm:p-6 md:p-8 mb-6 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-fuchsia-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-fuchsia-500"></div>

          <div className="text-center mb-6 sm:mb-8">
            <div className="mb-2 sm:mb-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-yellow-400 to-fuchsia-500 tracking-wide sm:tracking-wider neon-text-gold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                LEARNING CONSISTENCY TRACKER
              </h1>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-yellow-400 tracking-widest uppercase">
              {formatDate(new Date(selectedDate + 'T00:00:00'))}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-fuchsia-400 mb-5 text-center tracking-widest uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 sm:gap-3 min-w-max px-4 sm:px-8 justify-center">
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
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-none font-bold text-sm sm:text-base ${getDateColor(
                        day
                      )} flex-shrink-0 transition-all hover:scale-110 cursor-pointer uppercase ${
                        isSelected
                          ? 'shadow-[0_0_0_3px_rgb(234_179_8)] shadow-yellow-500 neon-border-gold'
                          : 'shadow-lg'
                      }`}
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center bg-gradient-to-r from-fuchsia-950/80 to-yellow-950/80 border-2 border-fuchsia-500 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-none shadow-lg neon-border-pink relative">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-400"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-fuchsia-500"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-fuchsia-500"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-400"></div>
              <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-fuchsia-400 mr-2 sm:mr-3 drop-shadow-glow" />
              <span className="text-2xl sm:text-3xl font-bold text-yellow-400 neon-text-gold" style={{ fontFamily: 'Orbitron, sans-serif' }}>{streak}</span>
              <span className="ml-2 sm:ml-3 text-fuchsia-300 text-sm sm:text-base font-normal uppercase tracking-wider">DAY STREAK</span>
            </div>
          </div>

          {showBigCongrats && (
            <div className="bg-gradient-to-r from-fuchsia-500/30 via-yellow-500/30 to-fuchsia-500/30 border-4 border-yellow-400 text-white p-4 sm:p-6 md:p-8 rounded-none mb-6 text-center animate-pulse shadow-2xl neon-border-gold relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-fuchsia-500"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-yellow-500"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-yellow-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-fuchsia-500"></div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-yellow-300 to-fuchsia-300 neon-text-gold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Congratulations!
              </h2>
              <p className="text-base sm:text-lg md:text-xl mt-3 text-yellow-300 uppercase tracking-wide">You've made your time useful today!</p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 md:space-y-5 mb-8">
            {(Object.keys(topicNames) as Array<keyof TopicState>).map((topic) => {
              const Icon = topicIcons[topic];
              return (
                <div key={topic}>
                  <button
                    onClick={() => handleTopicCheck(topic)}
                    className={`w-full flex items-center justify-between p-4 sm:p-5 md:p-6 rounded-none cursor-pointer transition-all duration-300 relative ${
                      topics[topic]
                        ? 'bg-gradient-to-r from-fuchsia-600/90 to-yellow-600/90 border-2 border-yellow-400 hover:from-fuchsia-600 hover:to-yellow-600 shadow-lg neon-border-gold'
                        : 'bg-black/70 border-2 border-gray-700 hover:bg-black/90 hover:border-yellow-500/60'
                    }`}
                  >
                    {topics[topic] && (
                      <>
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-fuchsia-400"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-fuchsia-400"></div>
                      </>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${topics[topic] ? 'text-white drop-shadow-glow' : 'text-yellow-400'}`} />
                      <span className={`text-base sm:text-lg font-bold tracking-wider uppercase ${topics[topic] ? 'text-white' : 'text-yellow-300'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {topicNames[topic]}
                      </span>
                    </div>
                    {topics[topic] && (
                      <Check className="w-6 h-6 sm:w-7 sm:h-7 text-fuchsia-300 drop-shadow-glow" />
                    )}
                  </button>
                  {completionMessages[topic] && (
                    <div className="mt-3 ml-4 text-yellow-400 font-normal text-sm sm:text-base animate-pulse uppercase tracking-wide">
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

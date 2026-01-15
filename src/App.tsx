import { useEffect, useState } from 'react';
import { Check, Flame, LogOut } from 'lucide-react';
import { supabase, DailyCompletion } from './lib/supabase';
import { useAuth } from './lib/auth';
import Confetti from './components/Confetti';
import Auth from './components/Auth';

interface TopicState {
  ai_knowledge: boolean;
  codebasics: boolean;
  trading: boolean;
}

interface CompletionMessage {
  topic: string;
  show: boolean;
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
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
  const [loading, setLoading] = useState(true);

  const topicNames = {
    ai_knowledge: 'AI Knowledge',
    codebasics: 'Codebasics',
    trading: 'Trading',
  };

  useEffect(() => {
    if (user) {
      loadTodayData();
      loadMonthlyData();
      calculateStreak();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);

      if (now.getHours() === 0 && now.getMinutes() === 0 && user) {
        loadTodayData();
        loadMonthlyData();
        calculateStreak();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (topics.ai_knowledge && topics.codebasics && topics.trading && !showBigCongrats) {
      setShowBigCongrats(true);
      setTimeout(() => setShowBigCongrats(false), 5000);
    }
  }, [topics]);

  const loadTodayData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('date', today)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading today data:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setTopics({
        ai_knowledge: data.ai_knowledge,
        codebasics: data.codebasics,
        trading: data.trading,
      });
    } else {
      setTopics({
        ai_knowledge: false,
        codebasics: false,
        trading: false,
      });
    }
    setLoading(false);
  };

  const loadMonthlyData = async () => {
    if (!user) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay);

    if (error) {
      console.error('Error loading monthly data:', error);
      return;
    }

    const completionsMap: Record<string, DailyCompletion> = {};
    data?.forEach((completion) => {
      completionsMap[completion.date] = completion;
    });
    setMonthlyCompletions(completionsMap);
  };

  const calculateStreak = async () => {
    if (!user) {
      setStreak(0);
      return;
    }

    const { data, error } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error calculating streak:', error);
      return;
    }

    if (!data || data.length === 0) {
      setStreak(0);
      return;
    }

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    for (let i = 0; i < data.length; i++) {
      const expectedDate = new Date(checkDate).toISOString().split('T')[0];
      const completion = data.find((d) => d.date === expectedDate);

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

  const handleTopicCheck = async (topic: keyof TopicState) => {
    if (!user) return;

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

    const { data: existing } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('date', today)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('daily_completions')
        .update({
          [topic]: newValue,
        })
        .eq('date', today)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating completion:', error);
      }
    } else {
      const { error } = await supabase
        .from('daily_completions')
        .insert({
          date: today,
          user_id: user.id,
          ai_knowledge: topic === 'ai_knowledge' ? newValue : false,
          codebasics: topic === 'codebasics' ? newValue : false,
          trading: topic === 'trading' ? newValue : false,
        });

      if (error) {
        console.error('Error inserting completion:', error);
      }
    }

    await loadMonthlyData();
    await calculateStreak();
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
      return 'bg-purple-800/40 border-2 border-purple-600/40 text-purple-400/60';
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center">
        <div className="text-xl text-amber-300">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 py-8 px-4">
      {showBigCongrats && <Confetti />}

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-purple-900/50 via-purple-800/40 to-purple-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-400/20 p-8 mb-6">
          <div className="text-center mb-8 relative">
            <button
              onClick={signOut}
              className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-purple-800/50 hover:bg-purple-700/50 border border-purple-600/50 hover:border-amber-500/50 rounded-lg text-amber-200 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 mb-3 tracking-wide">
              Daily Consistency Tracker
            </h1>
            <p className="text-lg text-rose-300/90 font-light tracking-wide">
              {formatDate(currentDate)}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-amber-200/90 mb-5 text-center tracking-wide">
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
            <div className="flex items-center bg-gradient-to-r from-amber-900/40 to-amber-800/40 border border-amber-500/30 px-6 py-3 rounded-full shadow-lg">
              <Flame className="w-6 h-6 text-amber-400 mr-2 drop-shadow-glow" />
              <span className="text-2xl font-bold text-amber-300">{streak}</span>
              <span className="ml-2 text-amber-200/80 text-base font-normal">day streak</span>
            </div>
          </div>

          {showBigCongrats && (
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 text-amber-100 p-6 rounded-2xl mb-6 text-center animate-pulse shadow-2xl">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-300">
                Congratulations!
              </h2>
              <p className="text-xl mt-2 text-amber-200/90">You've made your time useful today!</p>
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
                      : 'bg-purple-800/30 border-2 border-purple-700/30 hover:bg-purple-700/30 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-lg font-medium text-amber-100 tracking-wide">
                    {topicNames[topic]}
                  </span>
                  {topics[topic] && (
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  )}
                </button>
                {completionMessages[topic] && (
                  <div className="mt-2 ml-4 text-amber-300 font-normal text-base animate-pulse">
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

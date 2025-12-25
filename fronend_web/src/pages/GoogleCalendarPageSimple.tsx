import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, ChevronLeft, ChevronRight, Sync } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  html_link?: string;
}

const GoogleCalendarPageSimple: React.FC = () => {
  const { user, token } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentDate]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      
      const response = await fetch('http://localhost:8004/api/google-cloud/calendar/list-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          time_min: timeMin,
          time_max: timeMax,
          max_results: 100,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Load events error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    if (!user || !token) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    try {
      setSyncing(true);
      const response = await axios.post(
        'http://localhost:8000/api/calendar/sync-schedule',
        { week: null, hoc_ky: null },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`✅ Đã đồng bộ ${response.data.events_created} lớp học!`);
        loadEvents();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.response?.data?.detail || 'Không thể đồng bộ TKB');
    } finally {
      setSyncing(false);
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const days = getMonthDays();
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <Calendar size={32} className="text-blue-500" />
            Google Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncSchedule}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <Sync size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Đang sync...' : 'Sync TKB'}
          </button>

          <button
            onClick={() => toast.info('Tính năng đang phát triển')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus size={18} />
            Tạo sự kiện
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
          >
            Hôm nay
          </button>
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={loadEvents}
          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-600 dark:text-gray-400 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isTodayDate = isToday(day);
            const isCurrentMonthDate = isCurrentMonth(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 ${
                  !isCurrentMonthDate ? 'bg-gray-50 dark:bg-dark-900' : ''
                } ${isTodayDate ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isTodayDate 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : isCurrentMonthDate 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 truncate"
                      title={`${event.summary}\n${formatTime(event.start)} - ${formatTime(event.end)}`}
                    >
                      {formatTime(event.start)} {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events count */}
      <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
        {events.length > 0 ? `${events.length} sự kiện trong tháng này` : 'Không có sự kiện nào'}
      </div>
    </div>
  );
};

export default GoogleCalendarPageSimple;

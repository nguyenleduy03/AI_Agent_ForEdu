import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, RefreshCw, ChevronLeft, ChevronRight, Sync } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { calendarService } from '../services/calendarService';
import type { CalendarEvent } from '../services/calendarService';
import toast from 'react-hot-toast';
import axios from 'axios';

type ViewMode = 'month' | 'day';

const GoogleCalendarPageNew: React.FC = () => {
  const { user, token } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewMode]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let timeMin: Date, timeMax: Date;
      
      if (viewMode === 'month') {
        timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      } else {
        timeMin = new Date(currentDate);
        timeMin.setHours(0, 0, 0, 0);
        timeMax = new Date(currentDate);
        timeMax.setHours(23, 59, 59);
      }
      
      const allEvents = await calendarService.listEvents(
        user.id,
        timeMin.toISOString(),
        timeMax.toISOString(),
        100
      );
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Không thể tải lịch');
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
      toast.error(error.response?.data?.detail || 'Không thể đồng bộ TKB');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formatDateTime = (datetime: string) => {
      if (!datetime) return '';
      const withSeconds = datetime.includes(':') && datetime.split(':').length === 2 
        ? datetime + ':00' 
        : datetime;
      return withSeconds + '+07:00';
    };

    try {
      const event = await calendarService.createEvent({
        user_id: user.id,
        summary,
        description,
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
        location,
      });

      if (event) {
        toast.success('✅ Đã tạo sự kiện!');
        setShowCreateModal(false);
        resetForm();
        loadEvents();
      }
    } catch (error) {
      toast.error('Lỗi khi tạo sự kiện');
    }
  };

  const resetForm = () => {
    setSummary('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setLocation('');
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
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
    startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
    
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

  const renderMonthView = () => {
    const days = getMonthDays();
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-600 dark:text-gray-400 text-sm">
              {day}
            </div>
          ))}
        </div>

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
                } ${isTodayDate ? 'bg-green-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isTodayDate 
                    ? 'text-green-600 dark:text-blue-400' 
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
                      className="text-xs p-1 bg-green-100 dark:bg-blue-900/30 text-green-800 dark:text-blue-300 rounded cursor-pointer hover:bg-green-200 dark:hover:bg-blue-900/50 truncate"
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
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold dark:text-white">
            {currentDate.toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = new Date(event.start).getHours();
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-100 dark:border-gray-700">
                <div className="w-20 p-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 min-h-[80px]">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-3 bg-green-100 dark:bg-blue-900/30 text-green-800 dark:text-blue-300 rounded mb-2"
                    >
                      <div className="font-semibold">{event.summary}</div>
                      <div className="text-sm opacity-75 flex items-center gap-2 mt-1">
                        <Clock size={14} />
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                      {event.location && (
                        <div className="text-sm opacity-75 flex items-center gap-2 mt-1">
                          <MapPin size={14} />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <Calendar size={32} className="text-green-500" />
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
            onClick={() => {
              setShowCreateModal(true);
              const now = new Date();
              now.setMinutes(0, 0, 0);
              now.setHours(now.getHours() + 1);
              setStartTime(now.toISOString().slice(0, 16));
              const end = new Date(now);
              end.setHours(end.getHours() + 1);
              setEndTime(end.toISOString().slice(0, 16));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Plus size={18} />
            Tạo sự kiện
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
          >
            Hôm nay
          </button>
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={loadEvents}
            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'month'
                ? 'bg-white dark:bg-dark-600 shadow text-green-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'day'
                ? 'bg-white dark:bg-dark-600 shadow text-green-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Ngày
          </button>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'day' && renderDayView()}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Tạo sự kiện mới</h2>
            
            <form onSubmit={handleCreateEvent}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Tiêu đề *</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-dark-700 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-dark-700 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Bắt đầu *</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-dark-700 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Kết thúc *</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-dark-700 dark:text-white"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Địa điểm</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-dark-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg dark:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarPageNew;

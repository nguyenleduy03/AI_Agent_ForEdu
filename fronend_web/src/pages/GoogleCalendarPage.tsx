import { useState, useEffect } from 'react';
import { 
  Calendar, Plus, RefreshCw, ChevronLeft, ChevronRight, Clock, MapPin, 
  ExternalLink, Bell, Settings, X, Trash2, Edit, BellRing, AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { calendarService } from '../services/calendarService';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  html_link: string;
}

const GoogleCalendarPage = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  const [reminderEmail, setReminderEmail] = useState<number | null>(30);
  const [reminderPopup, setReminderPopup] = useState<number | null>(15);
  const [notificationEmail, setNotificationEmail] = useState('');
  
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:00',
    location: '',
    reminderEmail: 30 as number | null,
    reminderPopup: 15 as number | null,
    attendees: '' as string, // Nhiều email cách nhau bởi dấu phẩy
  });

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const reminderOptions = [
    { value: null, label: 'Không nhắc' },
    { value: 5, label: '5 phút' },
    { value: 15, label: '15 phút' },
    { value: 30, label: '30 phút' },
    { value: 60, label: '1 giờ' },
    { value: 1440, label: '1 ngày' },
  ];

  useEffect(() => {
    if (user?.id) loadEvents();
    else setLoading(false);
  }, [user?.id, currentDate.getMonth(), currentDate.getFullYear()]);

  const loadEvents = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const data = await calendarService.listEvents(user.id, timeMin, timeMax, 100);
      setEvents(data || []);
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    if (!user) return toast.error('Vui lòng đăng nhập');
    setSyncing(true);
    setShowSyncSettings(false);
    try {
      const response = await axios.post('http://localhost:8000/api/calendar/sync-schedule', { 
        week: null, hoc_ky: null, user_id: user.id,
        reminder_email: reminderEmail, reminder_popup: reminderPopup,
        notification_email: notificationEmail || null
      });
      if (response.data.success) {
        const skipped = response.data.events_skipped || 0;
        toast.success(`Đã đồng bộ ${response.data.events_created} lớp!${skipped > 0 ? ` (${skipped} đã có)` : ''}`);
        loadEvents();
      } else toast.error(response.data.message || 'Lỗi đồng bộ');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi đồng bộ');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!user?.id) return toast.error('Vui lòng đăng nhập');
    if (!newEvent.summary.trim()) return toast.error('Nhập tên sự kiện');
    setCreating(true);
    try {
      // Parse attendees từ chuỗi email (cách nhau bởi dấu phẩy)
      const attendeesList = newEvent.attendees
        .split(',')
        .map(e => e.trim())
        .filter(e => e && e.includes('@'));
      
      const response = await axios.post('http://localhost:8004/api/google-cloud/calendar/create-event', {
        user_id: user.id,
        summary: newEvent.summary,
        description: newEvent.description || null,
        start_time: `${newEvent.date}T${newEvent.startTime}:00+07:00`,
        end_time: `${newEvent.date}T${newEvent.endTime}:00+07:00`,
        location: newEvent.location || null,
        reminder_email: newEvent.reminderEmail,
        reminder_popup: newEvent.reminderPopup,
        attendees: attendeesList.length > 0 ? attendeesList : null,
      });
      if (response.data.success) {
        toast.success('Đã tạo sự kiện!');
        setShowCreateModal(false);
        setNewEvent({ summary: '', description: '', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '09:00', location: '', reminderEmail: 30, reminderPopup: 15, attendees: '' });
        loadEvents();
      } else toast.error('Không thể tạo sự kiện');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Lỗi tạo sự kiện');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user?.id || !confirm('Xóa sự kiện này?')) return;
    try {
      const success = await calendarService.deleteEvent(eventId, user.id);
      if (success) {
        toast.success('Đã xóa');
        setShowEventModal(false);
        loadEvents();
      } else toast.error('Không thể xóa');
    } catch { toast.error('Lỗi xóa'); }
  };

  const navigateMonth = (dir: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const getMonthDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dow = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));
    const days: Date[] = [];
    const cur = new Date(startDate);
    for (let i = 0; i < 42; i++) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return days;
  };

  const getEventsForDate = (date: Date) => events.filter(e => new Date(e.start).toDateString() === date.toDateString());
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();
  const formatTime = (s: string) => { try { return new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
  const formatDate = (s: string) => { try { return new Date(s).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' }); } catch { return ''; } };

  const upcomingEvents = events
    .filter(e => { const d = new Date(e.start); return d >= new Date() && d <= new Date(Date.now() + 7*24*60*60*1000); })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 10);

  const days = getMonthDays();
  const todayEvents = events.filter(e => isToday(new Date(e.start)));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lịch Google</h1>
              <p className="text-gray-600">{currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowNotificationPanel(!showNotificationPanel)} className="relative p-2 bg-white border rounded-xl hover:bg-gray-50">
              <BellRing className="w-5 h-5 text-gray-600" />
              {upcomingEvents.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{upcomingEvents.length}</span>}
            </button>

            <div className="relative">
              <div className="flex">
                <button onClick={handleSyncSchedule} disabled={syncing} className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-l-xl hover:bg-green-600 disabled:opacity-50">
                  <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Đang sync...' : 'Đồng bộ TKB'}</span>
                </button>
                <button onClick={() => setShowSyncSettings(!showSyncSettings)} className="px-2 py-2 bg-green-600 text-white rounded-r-xl hover:bg-green-700">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              {showSyncSettings && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border p-4 z-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold">Cài đặt đồng bộ</span>
                    <button onClick={() => setShowSyncSettings(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <input type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} placeholder="Email thông báo (tùy chọn)" className="w-full p-2 border rounded-lg text-sm mb-3" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">📧 Email</label>
                      <select value={reminderEmail ?? ''} onChange={(e) => setReminderEmail(e.target.value ? Number(e.target.value) : null)} className="w-full p-2 border rounded-lg text-sm">
                        {reminderOptions.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">🔔 Popup</label>
                      <select value={reminderPopup ?? ''} onChange={(e) => setReminderPopup(e.target.value ? Number(e.target.value) : null)} className="w-full p-2 border rounded-lg text-sm">
                        {reminderOptions.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
              <Plus className="w-5 h-5" />
              <span>Tạo sự kiện</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white border rounded-xl hover:bg-gray-50">Hôm nay</button>
                <button onClick={() => navigateMonth(-1)} className="p-2 bg-white border rounded-xl hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => navigateMonth(1)} className="p-2 bg-white border rounded-xl hover:bg-gray-50"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <button onClick={loadEvents} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {weekDays.map(d => <div key={d} className="p-3 text-center font-semibold text-gray-600 text-sm">{d}</div>)}
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-32"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-7">
                  {days.map((day, i) => {
                    const dayEvents = getEventsForDate(day);
                    const today = isToday(day);
                    const curMonth = isCurrentMonth(day);
                    return (
                      <div key={i} className={`min-h-[100px] border-r border-b p-1.5 ${!curMonth ? 'bg-gray-50' : ''} ${today ? 'bg-blue-50 ring-2 ring-blue-200 ring-inset' : ''}`}>
                        <div className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${today ? 'bg-blue-600 text-white' : curMonth ? 'text-gray-900' : 'text-gray-400'}`}>{day.getDate()}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(e => (
                            <div key={e.id} onClick={() => { setSelectedEvent(e); setShowEventModal(true); }} className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate">
                              {formatTime(e.start)} {e.summary}
                            </div>
                          ))}
                          {dayEvents.length > 2 && <div className="text-xs text-blue-600">+{dayEvents.length - 2}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-gray-600">{events.length > 0 ? `📅 ${events.length} sự kiện` : '📭 Không có sự kiện'}</p>
          </div>

          {/* Notification Panel */}
          {showNotificationPanel && (
            <div className="w-72 bg-white rounded-2xl shadow-lg border p-4 h-fit">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold flex items-center space-x-2"><BellRing className="w-5 h-5 text-orange-500" /><span>Sắp tới</span></span>
                <button onClick={() => setShowNotificationPanel(false)}><X className="w-5 h-5" /></button>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Không có sự kiện</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {upcomingEvents.map(e => {
                    const d = new Date(e.start);
                    const isEventToday = isToday(d);
                    return (
                      <div key={e.id} onClick={() => { setSelectedEvent(e); setShowEventModal(true); }} className={`p-2 rounded-lg border cursor-pointer hover:shadow ${isEventToday ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                        <p className="font-medium text-sm truncate">{e.summary}</p>
                        <p className="text-xs text-gray-500">{isEventToday ? '🔴 Hôm nay' : formatDate(e.start)} • {formatTime(e.start)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today Events */}
        {todayEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">🕐 Hôm nay ({todayEvents.length})</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayEvents.map(e => (
                <div key={e.id} onClick={() => { setSelectedEvent(e); setShowEventModal(true); }} className="bg-white rounded-xl p-4 shadow border cursor-pointer hover:shadow-lg">
                  <h3 className="font-bold mb-2">{e.summary}</h3>
                  <p className="text-sm text-gray-600 flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{formatTime(e.start)} - {formatTime(e.end)}</span></p>
                  {e.location && <p className="text-sm text-gray-600 flex items-center space-x-1 mt-1"><MapPin className="w-4 h-4" /><span>{e.location}</span></p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl font-bold truncate">{selectedEvent.summary}</h2>
                  <p className="text-blue-100 text-sm mt-1">{formatDate(selectedEvent.start)}</p>
                </div>
                <button onClick={() => setShowEventModal(false)} className="p-1 hover:bg-white/20 rounded"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                  <p className="text-gray-600 text-sm whitespace-pre-line">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.html_link && (
                <a href={selectedEvent.html_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 w-full p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  <Edit className="w-4 h-4" /><span>Chỉnh sửa trên Google Calendar</span>
                </a>
              )}
            </div>
            <div className="border-t p-4 flex space-x-3">
              <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200">
                <Trash2 className="w-4 h-4 inline mr-1" />Xóa
              </button>
              {selectedEvent.html_link && (
                <a href={selectedEvent.html_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
                  <ExternalLink className="w-4 h-4 mr-1" />Mở Calendar
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Tạo sự kiện</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/20 rounded"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Tên sự kiện *</label>
                <input type="text" value={newEvent.summary} onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})} placeholder="Nhập tên..." className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày</label>
                <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Bắt đầu</label>
                  <input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kết thúc</label>
                  <input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa điểm</label>
                <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} placeholder="Tùy chọn" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} placeholder="Tùy chọn" rows={2} className="w-full p-2 border rounded-lg resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">📧 Gửi thông báo đến</label>
                <input 
                  type="text" 
                  value={newEvent.attendees} 
                  onChange={(e) => setNewEvent({...newEvent, attendees: e.target.value})} 
                  placeholder="email1@gmail.com, email2@gmail.com" 
                  className="w-full p-2 border rounded-lg" 
                />
                <p className="text-xs text-gray-500 mt-1">Nhiều email cách nhau bởi dấu phẩy. Họ sẽ nhận email mời và nhắc nhở.</p>
              </div>
              <div className="border-t pt-3">
                <p className="font-medium mb-2 flex items-center"><Bell className="w-4 h-4 mr-1 text-orange-500" />Nhắc nhở</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">📧 Qua Email</label>
                    <select value={newEvent.reminderEmail ?? ''} onChange={(e) => setNewEvent({...newEvent, reminderEmail: e.target.value ? Number(e.target.value) : null})} className="w-full p-2 border rounded-lg text-sm">
                      {reminderOptions.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">🔔 Popup</label>
                    <select value={newEvent.reminderPopup ?? ''} onChange={(e) => setNewEvent({...newEvent, reminderPopup: e.target.value ? Number(e.target.value) : null})} className="w-full p-2 border rounded-lg text-sm">
                      {reminderOptions.map(o => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t p-4 flex space-x-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Hủy</button>
              <button onClick={handleCreateEvent} disabled={creating || !newEvent.summary.trim()} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50">
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GoogleCalendarPage;

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { springApi } from '../services/api';
import toast from 'react-hot-toast';

interface Schedule {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  teacher: string;
  notes?: string;
}

const SchedulePage = () => {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'today' | 'all'>('today');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // Load today's schedule
      const todayResponse = await springApi.get('/api/schedules/today');
      setTodaySchedules(todayResponse.data);

      // Load all schedules
      const allResponse = await springApi.get('/api/schedules/all');
      setAllSchedules(allResponse.data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast.error('Không thể tải thời khóa biểu');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      'MONDAY': 'Thứ 2',
      'TUESDAY': 'Thứ 3',
      'WEDNESDAY': 'Thứ 4',
      'THURSDAY': 'Thứ 5',
      'FRIDAY': 'Thứ 6',
      'SATURDAY': 'Thứ 7',
      'SUNDAY': 'Chủ Nhật'
    };
    return days[day] || day;
  };

  const groupSchedulesByDay = (schedules: Schedule[]) => {
    const grouped: Record<string, Schedule[]> = {};
    schedules.forEach(schedule => {
      if (!grouped[schedule.dayOfWeek]) {
        grouped[schedule.dayOfWeek] = [];
      }
      grouped[schedule.dayOfWeek].push(schedule);
    });
    return grouped;
  };

  const renderScheduleCard = (schedule: Schedule) => (
    <div key={schedule.id} className="card mb-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {schedule.subject}
          </h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>
                {schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Phòng {schedule.room}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{schedule.teacher}</span>
            </div>
          </div>
          
          {schedule.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
              {schedule.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold">Thời Khóa Biểu</h1>
          </div>
          
          <button
            onClick={loadSchedules}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setView('today')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              view === 'today'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              view === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toàn bộ
          </button>
        </div>

        {/* Today's Schedule */}
        {view === 'today' && (
          <div>
            {todaySchedules.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  📅 Lịch học hôm nay ({todaySchedules.length} lớp)
                </h2>
                {todaySchedules.map(renderScheduleCard)}
              </div>
            ) : (
              <div className="card text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  Không có lớp học hôm nay
                </h3>
                <p className="text-gray-500">
                  Bạn có thể nghỉ ngơi hoặc tự học!
                </p>
              </div>
            )}
          </div>
        )}

        {/* All Schedules */}
        {view === 'all' && (
          <div>
            {allSchedules.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupSchedulesByDay(allSchedules)).map(([day, schedules]) => (
                  <div key={day}>
                    <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                      <span className="w-2 h-8 bg-primary-600 rounded"></span>
                      <span>{getDayName(day)}</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({schedules.length} lớp)
                      </span>
                    </h2>
                    {schedules.map(renderScheduleCard)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  Chưa có thời khóa biểu
                </h3>
                <p className="text-gray-500 mb-4">
                  Thời khóa biểu sẽ được cập nhật tự động từ trang trường
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SchedulePage;

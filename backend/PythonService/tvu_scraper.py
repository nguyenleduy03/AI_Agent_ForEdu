"""
TVU (Trà Vinh University) Portal Scraper
Sử dụng API thay vì scraping HTML

API Endpoints:
- Login: GET /api/pn-signin?code=BASE64({username, password, uri})
- Danh sách học kỳ: POST /dkmh/api/sch/w-locdshockytkbuser
- TKB theo tuần: POST /dkmh/api/sch/w-locdstkbtuanusertheohocky
"""

import requests
from typing import List, Dict, Optional
import logging
from datetime import datetime, timedelta
import json
import base64
import urllib.parse
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TVUScraper:
    """
    Scraper cho trang sinh viên TVU (https://ttsv.tvu.edu.vn)
    Đây là Angular SPA, sử dụng API để lấy dữ liệu
    """
    
    def __init__(self):
        self.base_url = "https://ttsv.tvu.edu.vn"
        self.api_url = f"{self.base_url}/api"
        self.dkmh_api_url = f"{self.base_url}/dkmh/api"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://ttsv.tvu.edu.vn',
            'Referer': 'https://ttsv.tvu.edu.vn/'
        })
        self.is_logged_in = False
        self.token = None
        self.current_hoc_ky = None
    
    def login(self, username: str, password: str) -> bool:
        """
        Đăng nhập vào hệ thống TVU
        
        TVU sử dụng GET request với base64 encoded credentials
        Format: /api/pn-signin?code=BASE64({username, password, uri})
        """
        try:
            logger.info(f"TVU Login attempt for: {username}")
            
            # Tạo login data theo format TVU
            login_data = {
                "username": username,
                "password": password,
                "uri": f"{self.base_url}/#/home"
            }
            
            # Convert to JSON string
            json_str = json.dumps(login_data, separators=(',', ':'))
            logger.info(f"Login data: {json_str}")
            
            # Base64 encode
            encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
            
            # URL encode
            code = urllib.parse.quote(encoded)
            
            # Tạo URL
            login_url = f"{self.api_url}/pn-signin?code={code}&gopage=&mgr=1"
            
            logger.info(f"Login URL: {login_url[:100]}...")
            
            # Gửi GET request
            response = self.session.get(login_url, timeout=15, allow_redirects=True)
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Final URL after redirects: {response.url[:100]}...")
            
            # Kiểm tra cookies
            cookies = self.session.cookies.get_dict()
            logger.info(f"Cookies received: {list(cookies.keys())}")
            
            # Kiểm tra error trong URL
            if 'error=' in response.url or 'CurrUser=null' in response.url:
                logger.error(f"❌ TVU login failed - error in URL")
                return False
            
            # Extract token từ URL redirect (CurrUser parameter)
            if 'CurrUser=' in response.url and 'CurrUser=null' not in response.url:
                try:
                    curr_user_match = re.search(r'CurrUser=([^&]+)', response.url)
                    if curr_user_match:
                        curr_user_encoded = urllib.parse.unquote(curr_user_match.group(1))
                        try:
                            curr_user_json = base64.b64decode(curr_user_encoded).decode('utf-8')
                            curr_user_data = json.loads(curr_user_json)
                            
                            # Extract access_token
                            self.token = curr_user_data.get('access_token')
                            if self.token:
                                self.session.headers['Authorization'] = f'Bearer {self.token}'
                                logger.info(f"✅ Extracted access_token: {self.token[:50]}...")
                                self.is_logged_in = True
                                logger.info("✅ TVU login successful! (token extracted)")
                                return True
                        except Exception as e:
                            logger.warning(f"Failed to decode CurrUser: {e}")
                except Exception as e:
                    logger.warning(f"Failed to extract token from URL: {e}")
            
            # Kiểm tra redirect về home
            if response.status_code == 200 and '/#/home' in response.url:
                self.is_logged_in = True
                logger.info("✅ TVU login successful! (redirected to home)")
                return True
            
            logger.error("❌ TVU login failed - no valid token or redirect")
            return False
            
        except Exception as e:
            logger.error(f"TVU login error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_hoc_ky_list(self) -> List[Dict]:
        """
        Lấy danh sách học kỳ có TKB
        Endpoint: POST /dkmh/api/sch/w-locdshockytkbuser
        """
        if not self.is_logged_in:
            logger.error("Not logged in!")
            return []
        
        try:
            url = f"{self.dkmh_api_url}/sch/w-locdshockytkbuser"
            
            payload = {
                "filter": {},
                "additional": {
                    "paging": {"limit": 100, "page": 1}
                }
            }
            
            logger.info(f"POST {url}")
            response = self.session.post(url, json=payload, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"Failed to get hoc ky list: {response.status_code}")
                return []
            
            data = response.json()
            
            if data.get('result'):
                hoc_ky_list = data.get('data', {}).get('ds_hoc_ky', [])
                logger.info(f"✅ Found {len(hoc_ky_list)} học kỳ")
                
                # Lưu học kỳ hiện tại (đầu tiên trong list thường là hiện tại)
                if hoc_ky_list:
                    self.current_hoc_ky = hoc_ky_list[0].get('hoc_ky')
                    logger.info(f"Current hoc_ky: {self.current_hoc_ky}")
                
                return hoc_ky_list
            
            return []
            
        except Exception as e:
            logger.error(f"Get hoc ky list error: {e}")
            return []
    
    def get_current_week(self) -> int:
        """
        Tính tuần học kỳ hiện tại
        
        Tìm tuần có lịch học gần với ngày hiện tại nhất
        Trả về: số tuần hoặc -1 nếu không có lịch
        """
        today = datetime.now()
        
        # Nếu đã có thông tin từ API
        if hasattr(self, 'current_week_from_api') and self.current_week_from_api:
            logger.info(f"Using week from API: {self.current_week_from_api}")
            return self.current_week_from_api
        
        # Thử lấy tuần từ API response
        try:
            if self.is_logged_in and self.current_hoc_ky:
                url = f"{self.dkmh_api_url}/sch/w-locdstkbtuanusertheohocky"
                payload = {
                    "filter": {
                        "hoc_ky": self.current_hoc_ky,
                        "tuan": 1
                    },
                    "additional": {
                        "paging": {"limit": 100, "page": 1}
                    }
                }
                
                response = self.session.post(url, json=payload, timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('data') and data['data'].get('ds_tuan_tkb'):
                        ds_tuan = data['data']['ds_tuan_tkb']
                        
                        # Tìm tuần có lịch học và parse ngày
                        weeks_with_schedule = []
                        for tuan in ds_tuan:
                            tuan_num = tuan.get('tuan_hoc_ky', tuan.get('tuan', 0))
                            ds_tkb = tuan.get('ds_thoi_khoa_bieu', [])
                            thong_tin = tuan.get('thong_tin_tuan', '')
                            
                            if ds_tkb and tuan_num > 0:
                                # Parse date range from thong_tin: "Tuần X [từ ngày DD/MM/YYYY đến ngày DD/MM/YYYY]"
                                start_date = None
                                end_date = None
                                date_match = re.search(r'từ ngày (\d{2}/\d{2}/\d{4}) đến ngày (\d{2}/\d{2}/\d{4})', thong_tin)
                                if date_match:
                                    try:
                                        start_date = datetime.strptime(date_match.group(1), '%d/%m/%Y')
                                        end_date = datetime.strptime(date_match.group(2), '%d/%m/%Y')
                                    except:
                                        pass
                                
                                weeks_with_schedule.append({
                                    'week': tuan_num,
                                    'info': thong_tin,
                                    'count': len(ds_tkb),
                                    'start_date': start_date,
                                    'end_date': end_date
                                })
                        
                        self.weeks_with_schedule = weeks_with_schedule
                        
                        if weeks_with_schedule:
                            # Tìm tuần chứa ngày hiện tại
                            for w in weeks_with_schedule:
                                if w['start_date'] and w['end_date']:
                                    if w['start_date'] <= today <= w['end_date']:
                                        self.current_week_from_api = w['week']
                                        logger.info(f"Found current week: {w['week']} ({w['info']})")
                                        return w['week']
                            
                            # Không có tuần nào chứa ngày hiện tại
                            # Kiểm tra xem ngày hiện tại có trước hay sau học kỳ
                            first_week = weeks_with_schedule[0]
                            last_week = weeks_with_schedule[-1]
                            
                            if first_week['start_date'] and today < first_week['start_date']:
                                # Học kỳ chưa bắt đầu - trả về tuần đầu tiên
                                self.current_week_from_api = first_week['week']
                                self.schedule_status = 'not_started'
                                logger.info(f"Semester not started yet, first week: {first_week['week']}")
                                return first_week['week']
                            elif last_week['end_date'] and today > last_week['end_date']:
                                # Học kỳ đã kết thúc - trả về -1 để báo không có lịch
                                self.schedule_status = 'ended'
                                logger.info(f"Semester ended, last week was: {last_week['week']}")
                                return -1
                            else:
                                # Trong khoảng học kỳ nhưng không có lịch tuần này
                                # Trả về tuần gần nhất có lịch
                                self.current_week_from_api = first_week['week']
                                self.schedule_status = 'no_class_this_week'
                                logger.info(f"No class this week, using first available: {first_week['week']}")
                                return first_week['week']
        except Exception as e:
            logger.warning(f"Error getting week from API: {e}")
        
        # Fallback: Trả về -1 (không có lịch)
        logger.info("Fallback: no schedule found")
        return -1
    
    def get_schedule(self, week: int = None, hoc_ky: str = None) -> List[Dict]:
        """
        Lấy thời khóa biểu từ API TVU
        Endpoint: POST /dkmh/api/sch/w-locdstkbtuanusertheohocky
        
        Args:
            week: Tuần học (1-20), mặc định là tuần hiện tại. -1 = không có lịch
            hoc_ky: Mã học kỳ (vd: "20241"), mặc định là học kỳ hiện tại
            
        Returns:
            List[Dict]: Danh sách lịch học, hoặc [] nếu không có
        """
        if not self.is_logged_in:
            logger.error("Not logged in!")
            return []
        
        try:
            logger.info("Fetching TVU schedule...")
            
            # Lấy danh sách học kỳ nếu chưa có
            if not self.current_hoc_ky:
                self.get_hoc_ky_list()
            
            # Sử dụng tham số hoặc giá trị mặc định
            target_hoc_ky = hoc_ky or self.current_hoc_ky
            target_week = week if week is not None else self.get_current_week()
            
            # Nếu week = -1, nghĩa là không có lịch (học kỳ đã kết thúc)
            if target_week == -1:
                logger.info("No schedule available (semester ended or no schedule)")
                return []
            
            # Nếu vẫn không có học kỳ, tính từ ngày hiện tại
            if not target_hoc_ky:
                current_month = datetime.now().month
                current_year = datetime.now().year
                
                if 8 <= current_month <= 12:
                    target_hoc_ky = f"{current_year}1"  # VD: 20241
                elif 1 <= current_month <= 5:
                    target_hoc_ky = f"{current_year}2"  # VD: 20252
                else:
                    target_hoc_ky = f"{current_year}3"  # VD: 20253
            
            # TVU API endpoint
            url = f"{self.dkmh_api_url}/sch/w-locdstkbtuanusertheohocky"
            
            # Request payload theo format TVU
            payload = {
                "filter": {
                    "hoc_ky": target_hoc_ky,
                    "tuan": target_week
                },
                "additional": {
                    "paging": {
                        "limit": 100,
                        "page": 1
                    }
                }
            }
            
            logger.info(f"POST {url}")
            logger.info(f"Payload: hoc_ky={target_hoc_ky}, tuan={target_week}")
            
            response = self.session.post(url, json=payload, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"Failed to get schedule: {response.status_code}")
                logger.error(f"Response: {response.text[:500]}")
                return []
            
            data = response.json()
            logger.info(f"API Response keys: {data.keys() if isinstance(data, dict) else 'not a dict'}")
            
            if not data.get('result'):
                logger.warning(f"API returned result=false: {data.get('message', 'Unknown error')}")
                # Thử format payload khác
                return self._try_alternative_schedule_api(target_hoc_ky, target_week)
            
            # Parse response
            schedules = self._parse_tvu_schedule(data, target_week)
            
            logger.info(f"✅ Parsed {len(schedules)} schedule entries for week {target_week}")
            return schedules
            
        except Exception as e:
            logger.error(f"Get schedule error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _try_alternative_schedule_api(self, hoc_ky: str, tuan: int) -> List[Dict]:
        """
        Thử format payload khác nếu format chính không work
        """
        try:
            url = f"{self.dkmh_api_url}/sch/w-locdstkbtuanusertheohocky"
            
            # Format đơn giản hơn
            payload = {
                "hocky": hoc_ky,
                "tuan": tuan
            }
            
            logger.info(f"Trying alternative payload: {payload}")
            
            response = self.session.post(url, json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('result') or isinstance(data, list):
                    return self._parse_tvu_schedule(data, tuan)
            
            return []
            
        except Exception as e:
            logger.error(f"Alternative API error: {e}")
            return []
    
    def get_schedule_for_today(self) -> List[Dict]:
        """
        Lấy TKB cho hôm nay
        """
        today = datetime.now()
        day_of_week = today.weekday()  # 0=Monday, 6=Sunday
        
        # Lấy TKB tuần này
        schedules = self.get_schedule()
        
        # Map Python weekday to TVU format
        day_map = {
            0: 'MONDAY',
            1: 'TUESDAY', 
            2: 'WEDNESDAY',
            3: 'THURSDAY',
            4: 'FRIDAY',
            5: 'SATURDAY',
            6: 'SUNDAY'
        }
        
        today_name = day_map.get(day_of_week, 'MONDAY')
        
        # Filter cho hôm nay
        today_schedules = [s for s in schedules if s.get('day_of_week') == today_name]
        
        logger.info(f"Found {len(today_schedules)} classes for today ({today_name})")
        return today_schedules
    
    def get_schedule_for_week(self, week_offset: int = 0) -> List[Dict]:
        """
        Lấy TKB cho tuần hiện tại hoặc tuần khác
        
        Args:
            week_offset: 0 = tuần này, 1 = tuần sau, -1 = tuần trước
        """
        current_week = self.get_current_week()
        target_week = current_week + week_offset
        target_week = max(1, min(target_week, 20))  # Giới hạn 1-20
        
        return self.get_schedule(week=target_week)
    
    def _parse_tvu_schedule(self, data, target_week: int = None) -> List[Dict]:
        """
        Parse TVU schedule response format
        
        Cấu trúc response:
        data.data.ds_tuan_tkb[] - mỗi phần tử là 1 tuần với:
            - tuan: số tuần
            - ds_thoi_khoa_bieu[]: danh sách lịch học trong tuần đó
        
        Chỉ lấy lịch của tuần target_week
        """
        schedules = []
        
        try:
            # Xác định data source
            api_data = data
            if isinstance(data, dict):
                if 'data' in data:
                    api_data = data['data']
            
            # Case 1: ds_tuan_tkb format - CHÍNH
            if isinstance(api_data, dict) and 'ds_tuan_tkb' in api_data:
                ds_tuan_tkb = api_data.get('ds_tuan_tkb', [])
                logger.info(f"Found ds_tuan_tkb format with {len(ds_tuan_tkb)} weeks")
                logger.info(f"Looking for week: {target_week}")
                
                # Chỉ lấy tuần target_week
                for tuan_data in ds_tuan_tkb:
                    # Field chính xác là tuan_hoc_ky
                    tuan_number = tuan_data.get('tuan_hoc_ky', tuan_data.get('tuan', 0))
                    
                    # Filter theo tuần nếu có target_week
                    if target_week and tuan_number != target_week:
                        continue
                    
                    logger.info(f"Processing week {tuan_number}: {tuan_data.get('thong_tin_tuan', '')}")
                    ds_thoi_khoa_bieu = tuan_data.get('ds_thoi_khoa_bieu', [])
                    
                    for tkb in ds_thoi_khoa_bieu:
                        schedule = self._parse_single_schedule(tkb, target_week)
                        if schedule:
                            schedules.append(schedule)
                    
                    # Nếu đã tìm thấy tuần target, break
                    if target_week and tuan_number == target_week:
                        break
            
            # Case 2: Array trực tiếp
            elif isinstance(api_data, list):
                logger.info(f"Found array format with {len(api_data)} items")
                for tkb in api_data:
                    schedule = self._parse_single_schedule(tkb, target_week)
                    if schedule:
                        schedules.append(schedule)
            
            # Case 3: ds_thoi_khoa_bieu trực tiếp
            elif isinstance(api_data, dict) and 'ds_thoi_khoa_bieu' in api_data:
                ds_tkb = api_data.get('ds_thoi_khoa_bieu', [])
                logger.info(f"Found ds_thoi_khoa_bieu format with {len(ds_tkb)} items")
                for tkb in ds_tkb:
                    schedule = self._parse_single_schedule(tkb, target_week)
                    if schedule:
                        schedules.append(schedule)
            
            # Loại bỏ trùng lặp dựa trên (day, time, subject, room)
            seen = set()
            unique_schedules = []
            for s in schedules:
                key = (s['day_of_week'], s['start_time'], s['subject'], s['room'])
                if key not in seen:
                    seen.add(key)
                    unique_schedules.append(s)
            
            schedules = unique_schedules
            logger.info(f"Successfully parsed {len(schedules)} unique schedule entries")
            
        except Exception as e:
            logger.error(f"Parse TVU schedule error: {e}")
            import traceback
            traceback.print_exc()
        
        return schedules
    
    def _parse_single_schedule(self, tkb: Dict, target_week: int = None) -> Optional[Dict]:
        """
        Parse một entry thời khóa biểu
        """
        try:
            # Kiểm tra tuần học nếu có target_week
            tuan_hoc = tkb.get('tuanHoc', tkb.get('tuan_hoc', []))
            if target_week and tuan_hoc:
                if isinstance(tuan_hoc, list) and target_week not in tuan_hoc:
                    return None  # Không học tuần này
            
            # Map thu (2=Monday, 3=Tuesday, etc.)
            thu = tkb.get('thu', tkb.get('thu_kieu_so', 2))
            day_map = {
                2: 'MONDAY',
                3: 'TUESDAY',
                4: 'WEDNESDAY',
                5: 'THURSDAY',
                6: 'FRIDAY',
                7: 'SATURDAY',
                8: 'SUNDAY',
                1: 'SUNDAY'
            }
            day_of_week = day_map.get(thu, 'MONDAY')
            
            # Tính thời gian từ tiết
            tiet_bat_dau = tkb.get('tietBatDau', tkb.get('tiet_bat_dau', 1))
            so_tiet = tkb.get('soTiet', tkb.get('so_tiet', 1))
            
            start_time, end_time = self._calculate_time_from_tiet(tiet_bat_dau, so_tiet)
            
            # Build schedule object
            schedule = {
                'day_of_week': day_of_week,
                'start_time': start_time,
                'end_time': end_time,
                'subject': tkb.get('tenMonHoc', tkb.get('ten_mon', 'Unknown')),
                'room': tkb.get('phong', tkb.get('ma_phong', '')),
                'teacher': tkb.get('giangVien', tkb.get('ten_giang_vien', '')),
                'notes': f"Tiết {tiet_bat_dau}-{tiet_bat_dau + so_tiet - 1}"
            }
            
            return schedule
            
        except Exception as e:
            logger.warning(f"Failed to parse schedule item: {e}")
            return None
    
    def _calculate_time_from_tiet(self, tiet_bat_dau: int, so_tiet: int) -> tuple:
        """
        Tính thời gian bắt đầu và kết thúc từ số tiết
        
        TVU Schedule (thường):
        - Tiết 1: 7:00 - 7:50
        - Tiết 2: 8:00 - 8:50
        - Tiết 3: 9:00 - 9:50
        - Tiết 4: 10:00 - 10:50
        - Tiết 5: 11:00 - 11:50
        - (Nghỉ trưa)
        - Tiết 6: 13:00 - 13:50
        - Tiết 7: 14:00 - 14:50
        - Tiết 8: 15:00 - 15:50
        - Tiết 9: 16:00 - 16:50
        - Tiết 10: 17:00 - 17:50
        """
        # Map tiết -> giờ bắt đầu
        tiet_time_map = {
            1: "07:00", 2: "08:00", 3: "09:00", 4: "10:00", 5: "11:00",
            6: "13:00", 7: "14:00", 8: "15:00", 9: "16:00", 10: "17:00",
            11: "18:00", 12: "19:00", 13: "20:00"
        }
        
        tiet_end_map = {
            1: "07:50", 2: "08:50", 3: "09:50", 4: "10:50", 5: "11:50",
            6: "13:50", 7: "14:50", 8: "15:50", 9: "16:50", 10: "17:50",
            11: "18:50", 12: "19:50", 13: "20:50"
        }
        
        start_time = tiet_time_map.get(tiet_bat_dau, "07:00")
        end_tiet = tiet_bat_dau + so_tiet - 1
        end_time = tiet_end_map.get(end_tiet, "10:50")
        
        return start_time, end_time
    
    def _parse_schedule_response(self, data) -> List[Dict]:
        """
        Parse schedule data từ API response
        Cần customize dựa trên format thực tế
        """
        schedules = []
        
        try:
            # Case 1: data là array trực tiếp
            if isinstance(data, list):
                items = data
            # Case 2: data.data là array
            elif isinstance(data, dict) and 'data' in data:
                items = data['data']
            # Case 3: data.schedules là array
            elif isinstance(data, dict) and 'schedules' in data:
                items = data['schedules']
            else:
                logger.warning(f"Unknown schedule format: {type(data)}")
                return []
            
            # Parse từng item
            for item in items:
                try:
                    schedule = {
                        'day_of_week': self._parse_day(
                            item.get('dayOfWeek') or 
                            item.get('thu') or 
                            item.get('day') or 
                            'MONDAY'
                        ),
                        'start_time': self._parse_time(
                            item.get('startTime') or 
                            item.get('gioBatDau') or 
                            item.get('start') or 
                            '08:00'
                        ),
                        'end_time': self._parse_time(
                            item.get('endTime') or 
                            item.get('gioKetThuc') or 
                            item.get('end') or 
                            '10:00'
                        ),
                        'subject': (
                            item.get('subject') or 
                            item.get('tenMonHoc') or 
                            item.get('monHoc') or 
                            'Unknown'
                        ),
                        'room': (
                            item.get('room') or 
                            item.get('phongHoc') or 
                            item.get('phong') or 
                            ''
                        ),
                        'teacher': (
                            item.get('teacher') or 
                            item.get('giangVien') or 
                            item.get('gv') or 
                            ''
                        )
                    }
                    schedules.append(schedule)
                except Exception as e:
                    logger.warning(f"Failed to parse schedule item: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Parse schedule error: {e}")
        
        return schedules
    
    def _parse_day(self, day_value) -> str:
        """Convert day to standard format"""
        if isinstance(day_value, int):
            days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
            if 1 <= day_value <= 7:
                return days[day_value - 1]
            elif 2 <= day_value <= 8:
                return days[day_value - 2]
        
        day_str = str(day_value).lower()
        
        day_map = {
            'monday': 'MONDAY', 'mon': 'MONDAY', 'thứ 2': 'MONDAY', 'thu 2': 'MONDAY',
            'tuesday': 'TUESDAY', 'tue': 'TUESDAY', 'thứ 3': 'TUESDAY', 'thu 3': 'TUESDAY',
            'wednesday': 'WEDNESDAY', 'wed': 'WEDNESDAY', 'thứ 4': 'WEDNESDAY', 'thu 4': 'WEDNESDAY',
            'thursday': 'THURSDAY', 'thu': 'THURSDAY', 'thứ 5': 'THURSDAY', 'thu 5': 'THURSDAY',
            'friday': 'FRIDAY', 'fri': 'FRIDAY', 'thứ 6': 'FRIDAY', 'thu 6': 'FRIDAY',
            'saturday': 'SATURDAY', 'sat': 'SATURDAY', 'thứ 7': 'SATURDAY', 'thu 7': 'SATURDAY',
            'sunday': 'SUNDAY', 'sun': 'SUNDAY', 'chủ nhật': 'SUNDAY', 'cn': 'SUNDAY',
        }
        
        for key, value in day_map.items():
            if key in day_str:
                return value
        
        return 'MONDAY'
    
    def _parse_time(self, time_value) -> str:
        """Parse time to HH:MM format"""
        if not time_value:
            return "00:00"
        
        time_str = str(time_value)
        
        # Already in HH:MM format
        if ':' in time_str and len(time_str) <= 5:
            return time_str
        
        # Extract HH:MM using regex
        import re
        match = re.search(r'(\d{1,2}):(\d{2})', time_str)
        if match:
            hour = match.group(1).zfill(2)
            minute = match.group(2)
            return f"{hour}:{minute}"
        
        return "00:00"


# Update factory function
def get_scraper(school_url: str):
    """Factory function to get appropriate scraper"""
    if 'tvu.edu.vn' in school_url.lower():
        return TVUScraper()
    else:
        # Import generic scraper
        from school_scraper import SchoolPortalScraper
        return SchoolPortalScraper(school_url)

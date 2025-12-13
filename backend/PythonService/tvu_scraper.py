"""
TVU (Trà Vinh University) Portal Scraper
Sử dụng API thay vì scraping HTML
"""

import requests
from typing import List, Dict, Optional
import logging
from datetime import datetime

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
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.is_logged_in = False
        self.token = None
    
    def login(self, username: str, password: str) -> bool:
        """
        Đăng nhập vào hệ thống TVU
        
        TVU sử dụng GET request với base64 encoded credentials
        Format: /api/pn-signin?code=BASE64({username, password, uri})
        """
        try:
            logger.info(f"TVU Login attempt for: {username}")
            
            import json
            import base64
            import urllib.parse
            
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
            
            # URL encode (optional, nhưng an toàn hơn)
            code = urllib.parse.quote(encoded)
            
            # Tạo URL
            login_url = f"{self.api_url}/pn-signin?code={code}&gopage=&mgr=1"
            
            logger.info(f"Login URL: {login_url}")
            
            # Gửi GET request
            response = self.session.get(login_url, timeout=10, allow_redirects=True)
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Final URL after redirects: {response.url}")
            
            # Kiểm tra cookies
            cookies = self.session.cookies.get_dict()
            logger.info(f"Cookies received: {list(cookies.keys())}")
            
            # Kiểm tra error trong URL
            if 'error=' in response.url or 'CurrUser=null' in response.url:
                logger.error(f"❌ TVU login failed - error in URL: {response.url}")
                return False
            
            # Extract token từ URL redirect (nếu có)
            if 'CurrUser=' in response.url and 'CurrUser=null' not in response.url:
                try:
                    import re
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
                        except:
                            pass
                except Exception as e:
                    logger.warning(f"Failed to extract token from URL: {e}")
            
            # TVU có thể set cookie hoặc redirect về trang home
            # Kiểm tra xem có đăng nhập thành công không
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
    
    def get_schedule(self) -> List[Dict]:
        """
        Lấy thời khóa biểu từ API TVU
        Endpoint: POST /api/sch/w-locdstkbtuanusertheohocky
        """
        if not self.is_logged_in:
            logger.error("Not logged in!")
            return []
        
        try:
            logger.info("Fetching TVU schedule...")
            
            # TVU API endpoint - sử dụng endpoint đúng
            url = f"{self.api_url}/sch/w-locdstkbtuanusertheohocky"
            
            # Request payload - lấy học kỳ hiện tại
            from datetime import datetime
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            # Tính học kỳ hiện tại
            # HK1: tháng 8-12, HK2: tháng 1-5, HK3 (hè): tháng 6-7
            if 8 <= current_month <= 12:
                hoc_ky = current_year * 10 + 1  # VD: 20251
            elif 1 <= current_month <= 5:
                hoc_ky = current_year * 10 + 2  # VD: 20252
            else:
                hoc_ky = current_year * 10 + 3  # VD: 20253
            
            payload = {
                "filter": {
                    "hoc_ky": hoc_ky
                },
                "additional": {
                    "paging": {
                        "limit": 100,
                        "page": 1
                    }
                }
            }
            
            logger.info(f"POST {url} with hoc_ky={hoc_ky}")
            
            response = self.session.post(url, json=payload, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"Failed to get schedule: {response.status_code}")
                logger.error(f"Response: {response.text[:500]}")
                return []
            
            data = response.json()
            logger.info(f"API Response keys: {data.keys() if isinstance(data, dict) else 'not a dict'}")
            
            if not data.get('result'):
                logger.error("API returned result=false")
                return []
            
            # Parse response
            schedules = self._parse_tvu_schedule(data)
            
            logger.info(f"✅ Parsed {len(schedules)} schedule entries")
            return schedules
            
        except Exception as e:
            logger.error(f"Get schedule error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _parse_tvu_schedule(self, data) -> List[Dict]:
        """
        Parse TVU schedule response format
        Data structure: data.data.ds_tuan_tkb[].ds_thoi_khoa_bieu[]
        """
        schedules = []
        
        try:
            # Extract ds_tuan_tkb from data.data
            api_data = data.get('data', {})
            ds_tuan_tkb = api_data.get('ds_tuan_tkb', [])
            
            logger.info(f"Found {len(ds_tuan_tkb)} weeks of schedule")
            
            # Iterate through each week
            for tuan in ds_tuan_tkb:
                ds_thoi_khoa_bieu = tuan.get('ds_thoi_khoa_bieu', [])
                
                # Iterate through each schedule entry
                for tkb in ds_thoi_khoa_bieu:
                    try:
                        # Map thu_kieu_so (2=Monday, 3=Tuesday, etc.) to day name
                        thu_kieu_so = tkb.get('thu_kieu_so', 2)
                        day_map = {
                            2: 'MONDAY',
                            3: 'TUESDAY',
                            4: 'WEDNESDAY',
                            5: 'THURSDAY',
                            6: 'FRIDAY',
                            7: 'SATURDAY',
                            8: 'SUNDAY'
                        }
                        day_of_week = day_map.get(thu_kieu_so, 'MONDAY')
                        
                        # Calculate start and end time from tiet_bat_dau and so_tiet
                        tiet_bat_dau = tkb.get('tiet_bat_dau', 1)
                        so_tiet = tkb.get('so_tiet', 1)
                        
                        # TVU schedule: tiết 1 = 7:00, mỗi tiết 50 phút
                        start_hour = 7 + (tiet_bat_dau - 1) // 2
                        start_minute = 0 if (tiet_bat_dau - 1) % 2 == 0 else 50
                        start_time = f"{start_hour:02d}:{start_minute:02d}"
                        
                        end_tiet = tiet_bat_dau + so_tiet - 1
                        end_hour = 7 + end_tiet // 2
                        end_minute = 50 if end_tiet % 2 == 0 else 40
                        end_time = f"{end_hour:02d}:{end_minute:02d}"
                        
                        schedule = {
                            'day_of_week': day_of_week,
                            'start_time': start_time,
                            'end_time': end_time,
                            'subject': tkb.get('ten_mon', 'Unknown'),
                            'room': tkb.get('ma_phong', ''),
                            'teacher': tkb.get('ten_giang_vien', '')
                        }
                        
                        schedules.append(schedule)
                        
                    except Exception as e:
                        logger.warning(f"Failed to parse schedule item: {e}")
                        continue
            
            logger.info(f"Successfully parsed {len(schedules)} schedule entries")
            
        except Exception as e:
            logger.error(f"Parse TVU schedule error: {e}")
            import traceback
            traceback.print_exc()
        
        return schedules
    
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

"""
School Portal Web Scraper
Tự động login và lấy thời khóa biểu từ trang web trường
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SchoolPortalScraper:
    """
    Generic scraper for school schedule websites
    CUSTOMIZE based on your school's website structure
    """
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.is_logged_in = False
    
    def login(self, username: str, password: str) -> bool:
        """
        Login to school portal
        CUSTOMIZE THIS based on your school's login form
        """
        try:
            logger.info(f"Attempting login for user: {username}")
            
            # Step 1: Get login page to extract CSRF token (if any)
            login_page_url = f"{self.base_url}/login"
            response = self.session.get(login_page_url, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Failed to load login page: {response.status_code}")
                return False
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract CSRF token (if exists)
            csrf_token = None
            csrf_input = soup.find('input', {'name': 'csrf_token'})
            if not csrf_input:
                csrf_input = soup.find('input', {'name': '_token'})
            if csrf_input:
                csrf_token = csrf_input.get('value')
                logger.info("CSRF token found")
            
            # Step 2: Submit login form
            login_data = {
                'username': username,
                'password': password,
            }
            
            if csrf_token:
                login_data['csrf_token'] = csrf_token
            
            response = self.session.post(login_page_url, data=login_data, timeout=10)
            
            # Check if login successful
            # CUSTOMIZE: Check for success indicators in your school's website
            success_indicators = ['logout', 'đăng xuất', 'sign out', 'dashboard', 'trang chủ']
            response_text_lower = response.text.lower()
            
            for indicator in success_indicators:
                if indicator in response_text_lower:
                    self.is_logged_in = True
                    logger.info("Login successful!")
                    return True
            
            logger.error("Login failed - no success indicator found")
            return False
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            return False
    
    def get_schedule(self) -> List[Dict]:
        """
        Get schedule from school portal
        CUSTOMIZE THIS based on your school's schedule page structure
        """
        if not self.is_logged_in:
            logger.error("Not logged in!")
            return []
        
        try:
            logger.info("Fetching schedule...")
            
            # Navigate to schedule page
            schedule_url = f"{self.base_url}/schedule"
            response = self.session.get(schedule_url, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Failed to load schedule page: {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Parse schedule table
            # CUSTOMIZE: Find the correct table/div containing schedule
            schedule_table = soup.find('table', {'class': 'schedule-table'})
            
            if not schedule_table:
                # Try alternative selectors
                schedule_table = soup.find('table', {'id': 'timetable'})
            
            if not schedule_table:
                # Try finding any table with schedule-related content
                tables = soup.find_all('table')
                for table in tables:
                    if 'thời khóa biểu' in table.text.lower() or 'schedule' in table.text.lower():
                        schedule_table = table
                        break
            
            if not schedule_table:
                logger.error("Schedule table not found")
                return []
            
            schedules = []
            
            # Parse table rows
            rows = schedule_table.find_all('tr')[1:]  # Skip header
            
            for row in rows:
                cols = row.find_all('td')
                
                if len(cols) >= 5:
                    try:
                        schedule = {
                            'day_of_week': self._parse_day(cols[0].text.strip()),
                            'start_time': self._parse_time(cols[1].text.strip()),
                            'end_time': self._parse_time(cols[2].text.strip()),
                            'subject': cols[3].text.strip(),
                            'room': cols[4].text.strip(),
                            'teacher': cols[5].text.strip() if len(cols) > 5 else ''
                        }
                        schedules.append(schedule)
                        logger.info(f"Parsed: {schedule['subject']} on {schedule['day_of_week']}")
                    except Exception as e:
                        logger.warning(f"Failed to parse row: {e}")
                        continue
            
            logger.info(f"Successfully parsed {len(schedules)} schedule entries")
            return schedules
            
        except Exception as e:
            logger.error(f"Get schedule error: {e}")
            return []
    
    def _parse_day(self, day_text: str) -> str:
        """Convert Vietnamese day to English"""
        day_map = {
            'thứ 2': 'MONDAY',
            'thứ 3': 'TUESDAY',
            'thứ 4': 'WEDNESDAY',
            'thứ 5': 'THURSDAY',
            'thứ 6': 'FRIDAY',
            'thứ 7': 'SATURDAY',
            'chủ nhật': 'SUNDAY',
            'monday': 'MONDAY',
            'tuesday': 'TUESDAY',
            'wednesday': 'WEDNESDAY',
            'thursday': 'THURSDAY',
            'friday': 'FRIDAY',
            'saturday': 'SATURDAY',
            'sunday': 'SUNDAY',
            'mon': 'MONDAY',
            'tue': 'TUESDAY',
            'wed': 'WEDNESDAY',
            'thu': 'THURSDAY',
            'fri': 'FRIDAY',
            'sat': 'SATURDAY',
            'sun': 'SUNDAY',
        }
        
        day_lower = day_text.lower()
        for key, value in day_map.items():
            if key in day_lower:
                return value
        
        # Try to extract number (2-8)
        match = re.search(r'(\d)', day_text)
        if match:
            day_num = int(match.group(1))
            if 2 <= day_num <= 8:
                days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
                return days[day_num - 2]
        
        return 'MONDAY'  # Default
    
    def _parse_time(self, time_text: str) -> str:
        """Parse time string to HH:MM format"""
        # Extract time using regex
        match = re.search(r'(\d{1,2}):(\d{2})', time_text)
        if match:
            hour = match.group(1).zfill(2)
            minute = match.group(2)
            return f"{hour}:{minute}"
        
        # Try to extract just hour
        match = re.search(r'(\d{1,2})', time_text)
        if match:
            hour = match.group(1).zfill(2)
            return f"{hour}:00"
        
        return "00:00"


class HCMUScraper(SchoolPortalScraper):
    """
    Example scraper for HCMUS (University of Science HCMC)
    Customize for your specific school
    """
    
    def __init__(self):
        super().__init__("https://student.hcmus.edu.vn")
    
    def login(self, username: str, password: str) -> bool:
        """Custom login for HCMUS (ASP.NET based)"""
        try:
            logger.info(f"HCMUS Login for: {username}")
            
            login_url = f"{self.base_url}/Login.aspx"
            
            # Get login page
            response = self.session.get(login_url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract ASP.NET ViewState
            viewstate = soup.find('input', {'name': '__VIEWSTATE'})
            viewstate_value = viewstate['value'] if viewstate else ''
            
            viewstate_generator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
            viewstate_gen_value = viewstate_generator['value'] if viewstate_generator else ''
            
            event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})
            event_val_value = event_validation['value'] if event_validation else ''
            
            # Submit login
            login_data = {
                '__VIEWSTATE': viewstate_value,
                '__VIEWSTATEGENERATOR': viewstate_gen_value,
                '__EVENTVALIDATION': event_val_value,
                'txtUsername': username,
                'txtPassword': password,
                'btnLogin': 'Đăng nhập'
            }
            
            response = self.session.post(login_url, data=login_data, timeout=10)
            
            if 'logout' in response.text.lower() or 'đăng xuất' in response.text.lower():
                self.is_logged_in = True
                logger.info("HCMUS login successful!")
                return True
            
            logger.error("HCMUS login failed")
            return False
            
        except Exception as e:
            logger.error(f"HCMUS login error: {e}")
            return False
    
    def get_schedule(self) -> List[Dict]:
        """Custom schedule parser for HCMUS"""
        if not self.is_logged_in:
            return []
        
        try:
            schedule_url = f"{self.base_url}/ThoiKhoaBieu.aspx"
            response = self.session.get(schedule_url, timeout=10)
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find schedule table (customize selector)
            table = soup.find('table', {'id': 'GridViewTKB'})
            
            if not table:
                table = soup.find('table', {'class': 'table-schedule'})
            
            schedules = []
            
            if table:
                rows = table.find_all('tr')[1:]  # Skip header
                
                for row in rows:
                    cols = row.find_all('td')
                    
                    if len(cols) >= 6:
                        try:
                            schedules.append({
                                'day_of_week': self._parse_day(cols[0].text),
                                'start_time': self._parse_time(cols[1].text.strip()),
                                'end_time': self._parse_time(cols[2].text.strip()),
                                'subject': cols[3].text.strip(),
                                'room': cols[4].text.strip(),
                                'teacher': cols[5].text.strip()
                            })
                        except:
                            continue
            
            logger.info(f"HCMUS: Parsed {len(schedules)} schedules")
            return schedules
            
        except Exception as e:
            logger.error(f"HCMUS get schedule error: {e}")
            return []


# Factory function to get appropriate scraper
def get_scraper(school_url: str) -> SchoolPortalScraper:
    """
    Factory function to return appropriate scraper based on URL
    """
    if 'hcmus.edu.vn' in school_url.lower():
        return HCMUScraper()
    else:
        # Generic scraper for other schools
        return SchoolPortalScraper(school_url)

import re
import requests
from typing import Dict, List, Optional
from datetime import datetime
try:
    from tvu_scraper import get_scraper
except ImportError:
    from school_scraper import get_scraper
from school_credentials_encryption import decrypt_credentials
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentFeatures:
    def __init__(self, spring_boot_url: str = "http://localhost:8080"):
        self.spring_boot_url = spring_boot_url
    
    def detect_schedule_intent(self, message: str) -> bool:
        """Detect if user wants to see schedule"""
        patterns = [
            r'thời khóa biểu',
            r'tkb',
            r'lịch học',
            r'hôm nay.*lớp',
            r'có lớp',
            r'schedule'
        ]
        
        message_lower = message.lower()
        return any(re.search(pattern, message_lower) for pattern in patterns)
    
    def detect_grade_intent(self, message: str) -> bool:
        """Detect if user wants to see grades"""
        patterns = [
            r'điểm',
            r'grade',
            r'kết quả học tập',
            r'điểm số'
        ]
        
        message_lower = message.lower()
        return any(re.search(pattern, message_lower) for pattern in patterns)
    
    def detect_email_intent(self, message: str) -> bool:
        """Detect if user wants to send email"""
        patterns = [
            r'gửi email',
            r'send email',
            r'email cho',
            r'mail cho'
        ]
        
        message_lower = message.lower()
        return any(re.search(pattern, message_lower) for pattern in patterns)
    
    def get_credential_for_purpose(self, token: str, purpose_query: str) -> Optional[Dict]:
        """
        Use AI semantic search to find the right credential
        """
        try:
            logger.info(f"Searching credential for purpose: {purpose_query}")
            
            # Call Python vector search API
            response = requests.post(
                "http://localhost:8000/api/credentials/ai/select-credential",
                json={
                    "user_id": 1,  # TODO: Get from token
                    "query": purpose_query
                },
                timeout=5
            )
            
            if response.status_code != 200:
                logger.warning("AI credential selection failed, falling back to category search")
                return None
            
            ai_result = response.json()
            credential_id = ai_result.get('credential_id')
            confidence = ai_result.get('confidence', 0)
            
            logger.info(f"AI selected credential {credential_id} with confidence {confidence:.2f}")
            
            # Get full credential with decrypted password
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{self.spring_boot_url}/api/credentials/{credential_id}?decrypt=true",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                credential = response.json()
                logger.info(f"Retrieved credential: {credential['serviceName']}")
                return credential
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting credential: {e}")
            return None
    
    def sync_schedule_from_school(self, token: str) -> Dict:
        """
        Sync schedule from school website using web scraper
        Now uses Universal Credential Manager with AI semantic search
        """
        try:
            logger.info("Starting schedule sync from school website...")
            
            # Use AI to find school credential
            credential = self.get_credential_for_purpose(
                token, 
                "Xem thời khóa biểu và lịch học trường"
            )
            
            if not credential:
                # Fallback: Try to get EDUCATION category credential
                logger.info("AI search failed, trying category search...")
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(
                    f"{self.spring_boot_url}/api/credentials?category=EDUCATION&active=true",
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    credentials_list = response.json()
                    if credentials_list:
                        # Get first education credential with decrypt
                        cred_id = credentials_list[0]['id']
                        response = requests.get(
                            f"{self.spring_boot_url}/api/credentials/{cred_id}?decrypt=true",
                            headers=headers,
                            timeout=5
                        )
                        if response.status_code == 200:
                            credential = response.json()
                
                if not credential:
                    return {
                        "success": False,
                        "message": "❌ Chưa cấu hình tài khoản trường. Vui lòng thêm tài khoản trong Settings."
                    }
            
            # Extract credentials
            school_username = credential['username']
            school_password = credential['password']
            school_url = credential.get('serviceUrl', 'https://student.hcmus.edu.vn')
            
            logger.info(f"Using credential: {credential['serviceName']} for user: {school_username}")
            
            # Initialize scraper
            scraper = get_scraper(school_url)
            
            # Login
            logger.info("Attempting login to school portal...")
            if not scraper.login(school_username, school_password):
                return {
                    "success": False,
                    "message": "❌ Đăng nhập thất bại. Vui lòng kiểm tra tài khoản trường."
                }
            
            logger.info("Login successful! Fetching schedule...")
            
            # Get schedule
            schedules = scraper.get_schedule()
            
            if not schedules:
                return {
                    "success": False,
                    "message": "❌ Không tìm thấy thời khóa biểu trên trang trường."
                }
            
            logger.info(f"Found {len(schedules)} schedule entries")
            
            # Delete old schedules
            requests.delete(
                f"{self.spring_boot_url}/api/schedules/all",
                headers=headers,
                timeout=5
            )
            
            # Save to database via Spring Boot
            saved_count = 0
            for schedule in schedules:
                try:
                    response = requests.post(
                        f"{self.spring_boot_url}/api/schedules",
                        json=schedule,
                        headers=headers,
                        timeout=5
                    )
                    if response.status_code in [200, 201]:
                        saved_count += 1
                except Exception as e:
                    logger.warning(f"Failed to save schedule: {e}")
                    continue
            
            # Log credential usage
            try:
                headers = {"Authorization": f"Bearer {token}"}
                requests.post(
                    f"{self.spring_boot_url}/api/credentials/{credential['id']}/use",
                    json={
                        "action": "login",
                        "context": f"Đồng bộ thời khóa biểu - {saved_count} lịch học"
                    },
                    headers=headers,
                    timeout=5
                )
                logger.info(f"Logged credential usage for {credential['serviceName']}")
            except Exception as e:
                logger.warning(f"Failed to log credential usage: {e}")
            
            logger.info(f"Successfully synced {saved_count} schedules")
            
            return {
                "success": True,
                "message": f"✅ Đã đồng bộ {saved_count} lịch học từ trang trường!\n🔐 Sử dụng credential: {credential['serviceName']}",
                "count": saved_count,
                "credential_used": credential['serviceName']
            }
            
        except Exception as e:
            logger.error(f"Sync error: {e}")
            return {
                "success": False,
                "message": f"❌ Lỗi đồng bộ: {str(e)}"
            }
    
    def extract_day_from_message(self, message: str) -> Optional[str]:
        """Extract day of week from user message"""
        message_lower = message.lower()
        
        # Map Vietnamese day names to English
        day_map = {
            'hôm nay': None,  # Today - will use current day
            'today': None,
            'thứ 2': 'MONDAY',
            'thứ hai': 'MONDAY',
            'monday': 'MONDAY',
            'thứ 3': 'TUESDAY',
            'thứ ba': 'TUESDAY',
            'tuesday': 'TUESDAY',
            'thứ 4': 'WEDNESDAY',
            'thứ tư': 'WEDNESDAY',
            'wednesday': 'WEDNESDAY',
            'thứ 5': 'THURSDAY',
            'thứ năm': 'THURSDAY',
            'thursday': 'THURSDAY',
            'thứ 6': 'FRIDAY',
            'thứ sáu': 'FRIDAY',
            'friday': 'FRIDAY',
            'thứ 7': 'SATURDAY',
            'thứ bảy': 'SATURDAY',
            'saturday': 'SATURDAY',
            'chủ nhật': 'SUNDAY',
            'sunday': 'SUNDAY'
        }
        
        for key, value in day_map.items():
            if key in message_lower:
                return value
        
        return None  # Default to today
    
    def get_schedule(self, token: str, message: str = "", force_sync: bool = False) -> Dict:
        """
        Get user's schedule - auto sync from school if needed
        Filters by day based on user message
        """
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            # Extract day from message
            requested_day = self.extract_day_from_message(message)
            
            # Determine endpoint based on requested day
            if requested_day:
                # Specific day requested
                endpoint = f"{self.spring_boot_url}/api/schedules/day/{requested_day}"
                day_label = {
                    'MONDAY': 'Thứ 2',
                    'TUESDAY': 'Thứ 3',
                    'WEDNESDAY': 'Thứ 4',
                    'THURSDAY': 'Thứ 5',
                    'FRIDAY': 'Thứ 6',
                    'SATURDAY': 'Thứ 7',
                    'SUNDAY': 'Chủ nhật'
                }.get(requested_day, requested_day)
            else:
                # Default to today
                endpoint = f"{self.spring_boot_url}/api/schedules/today"
                from datetime import datetime
                day_label = "hôm nay"
            
            # Check if schedule exists in DB
            response = requests.get(endpoint, headers=headers, timeout=5)
            
            if response.status_code == 200:
                schedules = response.json()
                
                # If no schedule or force sync, scrape from school
                if (not schedules or force_sync):
                    logger.info("No schedule in DB or force sync requested")
                    sync_result = self.sync_schedule_from_school(token)
                    
                    if not sync_result['success']:
                        return sync_result
                    
                    # Get schedule again after sync
                    response = requests.get(endpoint, headers=headers, timeout=5)
                    schedules = response.json()
                
                if not schedules:
                    return {
                        "success": True,
                        "message": f"📅 {day_label.capitalize()} bạn không có lớp nào.",
                        "schedules": []
                    }
                
                # Format schedule
                message_text = f"📅 **Lịch học {day_label}:**\n\n"
                for schedule in schedules:
                    start_time = schedule['startTime'][:5]  # HH:MM
                    end_time = schedule['endTime'][:5] if 'endTime' in schedule else ""
                    time_str = f"{start_time} - {end_time}" if end_time else start_time
                    
                    message_text += f"🕐 **{time_str}**\n"
                    message_text += f"   📚 {schedule['subject']}\n"
                    message_text += f"   🏫 Phòng {schedule['room']}\n"
                    if schedule.get('teacher'):
                        message_text += f"   👨‍🏫 {schedule['teacher']}\n"
                    message_text += "\n"
                
                return {
                    "success": True,
                    "message": message_text,
                    "schedules": schedules
                }
            else:
                return {
                    "success": False,
                    "message": "❌ Không thể lấy thời khóa biểu."
                }
        except Exception as e:
            logger.error(f"Get schedule error: {e}")
            return {
                "success": False,
                "message": f"❌ Lỗi: {str(e)}"
            }
    
    def get_grades(self, token: str) -> Dict:
        """Get user's grades"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{self.spring_boot_url}/api/grades/my-grades",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                grades = response.json()
                
                if not grades:
                    return {
                        "success": True,
                        "message": "📊 Chưa có điểm nào được ghi nhận.",
                        "grades": []
                    }
                
                # Group grades by course
                course_grades = {}
                for grade in grades:
                    course_name = grade['courseName']
                    if course_name not in course_grades:
                        course_grades[course_name] = []
                    course_grades[course_name].append(grade)
                
                # Format grades
                message = "📊 **Điểm của bạn:**\n\n"
                total_avg = 0
                course_count = 0
                
                for course_name, grades_list in course_grades.items():
                    message += f"📚 **{course_name}**\n"
                    course_total = 0
                    for grade in grades_list:
                        grade_value = float(grade['grade'])
                        message += f"   • {grade['gradeType']}: {grade_value}/10\n"
                        course_total += grade_value
                    
                    course_avg = course_total / len(grades_list)
                    message += f"   ➡️ Trung bình: **{course_avg:.2f}/10**\n\n"
                    total_avg += course_avg
                    course_count += 1
                
                if course_count > 0:
                    overall_avg = total_avg / course_count
                    message += f"📈 **Trung bình tổng:** {overall_avg:.2f}/10"
                
                return {
                    "success": True,
                    "message": message,
                    "grades": grades
                }
            else:
                return {
                    "success": False,
                    "message": "❌ Không thể lấy điểm số."
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"❌ Lỗi: {str(e)}"
            }
    
    def generate_email_draft(self, recipient_name: str, subject: str, gemini_model) -> str:
        """Generate email draft using AI"""
        prompt = f"""
        Viết email gửi {recipient_name} về {subject}.
        
        Yêu cầu:
        - Tone: Lịch sự, trang trọng
        - Độ dài: Ngắn gọn, súc tích (3-5 câu)
        - Format: Email chuẩn với lời chào và kết thúc
        
        Chỉ trả về nội dung email, không giải thích.
        """
        
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    
    def handle_email_request(self, message: str, token: str, gemini_model) -> Dict:
        """Handle email sending request"""
        try:
            # Get user's contacts
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{self.spring_boot_url}/api/contacts",
                headers=headers,
                timeout=5
            )
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "message": "❌ Không thể lấy danh bạ."
                }
            
            contacts = response.json()
            
            # Find recipient in message
            recipient = None
            for contact in contacts:
                if contact['contactName'].lower() in message.lower():
                    recipient = contact
                    break
            
            if not recipient:
                # List available contacts
                contact_list = "\n".join([f"• {c['contactName']}" for c in contacts])
                return {
                    "success": False,
                    "message": f"❌ Không tìm thấy người nhận.\n\n**Danh bạ của bạn:**\n{contact_list}"
                }
            
            # Extract subject
            subject_prompt = f"""
            Từ câu: "{message}"
            Trích xuất chủ đề email (subject).
            Chỉ trả về subject ngắn gọn, không giải thích.
            """
            subject = gemini_model.generate_content(subject_prompt).text.strip()
            
            # Generate email body
            email_body = self.generate_email_draft(recipient['contactName'], subject, gemini_model)
            
            # Return draft for user to review
            message_response = f"""
📧 **Email Draft**

**Người nhận:** {recipient['contactName']} ({recipient['contactEmail']})
**Chủ đề:** {subject}

**Nội dung:**
{email_body}

---
✅ Email draft đã được tạo! Bạn có thể copy và gửi qua email client của mình.
"""
            
            return {
                "success": True,
                "message": message_response,
                "email_draft": {
                    "to": recipient['contactEmail'],
                    "to_name": recipient['contactName'],
                    "subject": subject,
                    "body": email_body
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"❌ Lỗi: {str(e)}"
            }

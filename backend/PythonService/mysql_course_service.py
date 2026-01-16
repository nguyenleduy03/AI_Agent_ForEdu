"""
MySQL Course Service - Direct database access for chatbot
Truy vấn trực tiếp MySQL database thay vì ChromaDB
"""
import mysql.connector
from typing import List, Dict, Optional
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MySQLCourseService:
    """Service to query courses directly from MySQL database"""
    
    def __init__(self):
        """Initialize MySQL connection"""
        self.config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'port': int(os.getenv('MYSQL_PORT', '3306')),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', '1111'),
            'database': os.getenv('MYSQL_DATABASE', 'Agent_Db'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Establish database connection"""
        try:
            if self.connection is None or not self.connection.is_connected():
                self.connection = mysql.connector.connect(**self.config)
                self.cursor = self.connection.cursor(dictionary=True)
                logger.info("✅ Connected to MySQL database")
            return True
        except mysql.connector.Error as e:
            logger.error(f"❌ MySQL connection error: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("Disconnected from MySQL")
    
    def search_courses(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search courses by keyword in title or description
        
        Args:
            query: Search keyword
            limit: Maximum number of results
        
        Returns:
            List of matching courses
        """
        if not self.connect():
            return []
        
        try:
            # Search in title and description
            sql = """
                SELECT 
                    c.id,
                    c.title,
                    c.description,
                    c.thumbnail_url,
                    c.is_public,
                    c.created_at,
                    c.updated_at,
                    u.username as creator_name,
                    u.full_name as creator_full_name,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    COUNT(DISTINCT l.id) as lesson_count
                FROM courses c
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN course_enrollments e ON c.id = e.course_id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE 
                    c.title LIKE %s 
                    OR c.description LIKE %s
                GROUP BY c.id
                ORDER BY enrollment_count DESC, c.created_at DESC
                LIMIT %s
            """
            
            search_pattern = f"%{query}%"
            self.cursor.execute(sql, (search_pattern, search_pattern, limit))
            courses = self.cursor.fetchall()
            
            logger.info(f"Found {len(courses)} courses matching '{query}'")
            return courses
            
        except mysql.connector.Error as e:
            logger.error(f"Error searching courses: {e}")
            return []
    
    def get_course_by_id(self, course_id: int) -> Optional[Dict]:
        """Get course details by ID"""
        if not self.connect():
            return None
        
        try:
            sql = """
                SELECT 
                    c.*,
                    u.username as creator_name,
                    u.full_name as creator_full_name,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    COUNT(DISTINCT l.id) as lesson_count
                FROM courses c
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN course_enrollments e ON c.id = e.course_id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE c.id = %s
                GROUP BY c.id
            """
            
            self.cursor.execute(sql, (course_id,))
            course = self.cursor.fetchone()
            
            return course
            
        except mysql.connector.Error as e:
            logger.error(f"Error getting course {course_id}: {e}")
            return None
    
    def get_lessons_by_course(self, course_id: int) -> List[Dict]:
        """Get all lessons for a course"""
        if not self.connect():
            return []
        
        try:
            sql = """
                SELECT 
                    l.id,
                    l.title,
                    l.content,
                    l.order_index,
                    l.created_at,
                    l.updated_at,
                    COUNT(DISTINCT m.id) as material_count
                FROM lessons l
                LEFT JOIN materials m ON l.id = m.lesson_id
                WHERE l.course_id = %s
                GROUP BY l.id
                ORDER BY l.order_index ASC
            """
            
            self.cursor.execute(sql, (course_id,))
            lessons = self.cursor.fetchall()
            
            return lessons
            
        except mysql.connector.Error as e:
            logger.error(f"Error getting lessons for course {course_id}: {e}")
            return []
    
    def get_all_courses(self, limit: int = 50) -> List[Dict]:
        """Get all courses (for general queries)"""
        if not self.connect():
            return []
        
        try:
            sql = """
                SELECT 
                    c.id,
                    c.title,
                    c.description,
                    c.thumbnail_url,
                    c.is_public,
                    c.created_at,
                    u.username as creator_name,
                    u.full_name as creator_full_name,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    COUNT(DISTINCT l.id) as lesson_count
                FROM courses c
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN course_enrollments e ON c.id = e.course_id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE c.is_public = 1
                GROUP BY c.id
                ORDER BY enrollment_count DESC, c.created_at DESC
                LIMIT %s
            """
            
            self.cursor.execute(sql, (limit,))
            courses = self.cursor.fetchall()
            
            return courses
            
        except mysql.connector.Error as e:
            logger.error(f"Error getting all courses: {e}")
            return []
    
    def get_popular_courses(self, limit: int = 10) -> List[Dict]:
        """Get most popular courses by enrollment count"""
        if not self.connect():
            return []
        
        try:
            sql = """
                SELECT 
                    c.id,
                    c.title,
                    c.description,
                    c.thumbnail_url,
                    u.username as creator_name,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    COUNT(DISTINCT l.id) as lesson_count
                FROM courses c
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN course_enrollments e ON c.id = e.course_id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE c.is_public = 1
                GROUP BY c.id
                HAVING enrollment_count > 0
                ORDER BY enrollment_count DESC
                LIMIT %s
            """
            
            self.cursor.execute(sql, (limit,))
            courses = self.cursor.fetchall()
            
            return courses
            
        except mysql.connector.Error as e:
            logger.error(f"Error getting popular courses: {e}")
            return []
    
    def get_courses_by_creator(self, creator_name: str) -> List[Dict]:
        """Get courses by creator username"""
        if not self.connect():
            return []
        
        try:
            sql = """
                SELECT 
                    c.id,
                    c.title,
                    c.description,
                    c.thumbnail_url,
                    c.created_at,
                    u.username as creator_name,
                    u.full_name as creator_full_name,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    COUNT(DISTINCT l.id) as lesson_count
                FROM courses c
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN course_enrollments e ON c.id = e.course_id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE u.username LIKE %s OR u.full_name LIKE %s
                GROUP BY c.id
                ORDER BY c.created_at DESC
            """
            
            search_pattern = f"%{creator_name}%"
            self.cursor.execute(sql, (search_pattern, search_pattern))
            courses = self.cursor.fetchall()
            
            return courses
            
        except mysql.connector.Error as e:
            logger.error(f"Error getting courses by creator: {e}")
            return []
    
    def format_course_for_chat(self, course: Dict) -> str:
        """Format course data for chatbot response"""
        title = course.get('title', 'Unknown')
        description = course.get('description', 'Không có mô tả')
        course_id = course.get('id', '')
        creator = course.get('creator_full_name') or course.get('creator_name', 'Unknown')
        enrollment_count = course.get('enrollment_count', 0)
        lesson_count = course.get('lesson_count', 0)
        
        return f"""**{title}** (ID: {course_id})
📝 Mô tả: {description[:200]}{'...' if len(description) > 200 else ''}
👨‍🏫 Giảng viên: {creator}
👥 Học viên: {enrollment_count} | 📚 Bài học: {lesson_count}"""
    
    def format_courses_for_chat(self, courses: List[Dict]) -> str:
        """Format multiple courses for chatbot response"""
        if not courses:
            return "Không tìm thấy khóa học nào phù hợp."
        
        result = f"Tìm thấy {len(courses)} khóa học:\n\n"
        
        for i, course in enumerate(courses, 1):
            result += f"{i}. {self.format_course_for_chat(course)}\n\n"
        
        return result


# Singleton instance
_mysql_service = None


def get_mysql_course_service() -> MySQLCourseService:
    """Get or create singleton instance"""
    global _mysql_service
    if _mysql_service is None:
        _mysql_service = MySQLCourseService()
    return _mysql_service


# Test function
if __name__ == "__main__":
    print("=" * 60)
    print("Testing MySQL Course Service")
    print("=" * 60)
    
    service = MySQLCourseService()
    
    # Test connection
    print("\n1. Testing connection...")
    if service.connect():
        print("   ✅ Connected successfully")
    else:
        print("   ❌ Connection failed")
        exit(1)
    
    # Test search
    print("\n2. Searching for 'Python'...")
    courses = service.search_courses("Python")
    print(f"   Found {len(courses)} courses")
    if courses:
        print(f"   First course: {courses[0].get('title')}")
    
    # Test get all
    print("\n3. Getting all courses...")
    all_courses = service.get_all_courses(limit=5)
    print(f"   Found {len(all_courses)} courses")
    
    # Test popular
    print("\n4. Getting popular courses...")
    popular = service.get_popular_courses(limit=3)
    print(f"   Found {len(popular)} popular courses")
    
    # Test format
    if courses:
        print("\n5. Formatted output:")
        print(service.format_courses_for_chat(courses[:2]))
    
    service.disconnect()
    print("\n" + "=" * 60)

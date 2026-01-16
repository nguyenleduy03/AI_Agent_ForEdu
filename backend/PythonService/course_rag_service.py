"""
Course RAG Service - Sync courses/lessons to RAG and search
Cho phep AI tim kiem khoa hoc tu database thuc te
"""
import requests
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SPRING_BOOT_URL = "http://localhost:8080"


class CourseRAGService:
    """Service to sync courses to RAG and search"""
    
    def __init__(self, vector_db=None):
        """
        Initialize with vector database
        
        Args:
            vector_db: SimpleVectorDB or ChromaVectorService instance
        """
        self.vector_db = vector_db
        self.spring_boot_url = SPRING_BOOT_URL
    
    def fetch_all_courses(self) -> List[Dict]:
        """Fetch all courses from Spring Boot API (internal endpoint)"""
        try:
            response = requests.get(
                f"{self.spring_boot_url}/api/courses/internal/all",
                timeout=10
            )
            if response.status_code == 200:
                courses = response.json()
                logger.info(f"Fetched {len(courses)} courses from database")
                return courses
            else:
                logger.error(f"Failed to fetch courses: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching courses: {e}")
            return []
    
    def fetch_lessons_for_course(self, course_id: int) -> List[Dict]:
        """Fetch lessons for a specific course (internal endpoint)"""
        try:
            response = requests.get(
                f"{self.spring_boot_url}/api/courses/internal/{course_id}/lessons",
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"Error fetching lessons for course {course_id}: {e}")
            return []
    
    def sync_courses_to_rag(self) -> Dict:
        """
        Sync all courses and lessons to RAG vector database
        
        Returns:
            Dict with sync status
        """
        if not self.vector_db:
            return {"status": "error", "message": "Vector DB not initialized"}
        
        courses = self.fetch_all_courses()
        if not courses:
            return {"status": "error", "message": "No courses found"}
        
        documents = []
        metadatas = []
        ids = []
        
        for course in courses:
            course_id = course.get('id')
            title = course.get('title', '')
            description = course.get('description', '')
            creator = course.get('creatorName', 'Unknown')
            
            # Create course document
            course_doc = f"""Course: {title}
Description: {description}
Created by: {creator}
Course ID: {course_id}"""
            
            documents.append(course_doc)
            metadatas.append({
                "type": "course",
                "course_id": str(course_id),
                "title": title,
                "source": "database"
            })
            ids.append(f"course_{course_id}")
            
            # Fetch and add lessons
            lessons = self.fetch_lessons_for_course(course_id)
            for lesson in lessons:
                lesson_id = lesson.get('id')
                lesson_title = lesson.get('title', '')
                lesson_content = lesson.get('content', '')[:2000]  # Limit content
                
                lesson_doc = f"""Lesson: {lesson_title}
Course: {title}
Content: {lesson_content}
Lesson ID: {lesson_id}
Course ID: {course_id}"""
                
                documents.append(lesson_doc)
                metadatas.append({
                    "type": "lesson",
                    "lesson_id": str(lesson_id),
                    "course_id": str(course_id),
                    "course_title": title,
                    "title": lesson_title,
                    "source": "database"
                })
                ids.append(f"lesson_{lesson_id}")
        
        # Add to vector database
        try:
            result = self.vector_db.add_documents(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Synced {len(documents)} documents to RAG")
            return {
                "status": "success",
                "courses_synced": len(courses),
                "total_documents": len(documents),
                "message": f"Synced {len(courses)} courses and their lessons to RAG"
            }
        except Exception as e:
            logger.error(f"Error syncing to RAG: {e}")
            return {"status": "error", "message": str(e)}
    
    def search_courses(self, query: str, n_results: int = 5) -> Dict:
        """
        Search courses using RAG
        
        Args:
            query: Search query (e.g., "khoa hoc ve Machine Learning")
            n_results: Number of results
        
        Returns:
            Dict with matching courses/lessons
        """
        if not self.vector_db:
            return {"status": "error", "message": "Vector DB not initialized"}
        
        # Search in vector database
        results = self.vector_db.search(query, n_results=n_results)
        
        courses = []
        lessons = []
        
        for i, (doc, metadata) in enumerate(zip(
            results.get('documents', []),
            results.get('metadatas', [])
        )):
            distance = results.get('distances', [])[i] if results.get('distances') else 0
            similarity = 1 - distance if distance else 0
            
            item = {
                "content": doc,
                "similarity": round(similarity * 100, 1),
                **metadata
            }
            
            if metadata.get('type') == 'course':
                courses.append(item)
            elif metadata.get('type') == 'lesson':
                lessons.append(item)
        
        return {
            "status": "success",
            "query": query,
            "courses": courses,
            "lessons": lessons,
            "total_results": len(courses) + len(lessons)
        }
    
    def search_courses_direct(self, query: str) -> Dict:
        """
        Search courses directly from database (fallback if RAG empty)
        
        Args:
            query: Search query
        
        Returns:
            Dict with matching courses
        """
        try:
            # Use Spring Boot search endpoint if available
            response = requests.get(
                f"{self.spring_boot_url}/api/courses",
                timeout=10
            )
            
            if response.status_code != 200:
                return {"status": "error", "message": "Failed to fetch courses"}
            
            courses = response.json()
            query_lower = query.lower()
            
            # Simple keyword matching
            matching_courses = []
            for course in courses:
                title = course.get('title', '').lower()
                description = course.get('description', '').lower()
                
                if query_lower in title or query_lower in description:
                    matching_courses.append(course)
                # Also check individual words
                elif any(word in title or word in description 
                        for word in query_lower.split() if len(word) > 2):
                    matching_courses.append(course)
            
            return {
                "status": "success",
                "query": query,
                "courses": matching_courses[:10],
                "total_results": len(matching_courses)
            }
        except Exception as e:
            logger.error(f"Error searching courses: {e}")
            return {"status": "error", "message": str(e)}
    
    def format_search_results(self, results: Dict) -> str:
        """Format search results for AI response"""
        if results.get('status') != 'success':
            return "Khong tim thay khoa hoc phu hop."
        
        courses = results.get('courses', [])
        lessons = results.get('lessons', [])
        
        if not courses and not lessons:
            return "Khong tim thay khoa hoc nao phu hop voi yeu cau cua ban."
        
        response_parts = []
        
        if courses:
            response_parts.append("**Khoa hoc phu hop:**")
            for i, course in enumerate(courses[:5], 1):
                title = course.get('title', 'Unknown')
                course_id = course.get('course_id', '')
                similarity = course.get('similarity', 0)
                response_parts.append(f"{i}. **{title}** (ID: {course_id}, Match: {similarity}%)")
        
        if lessons:
            response_parts.append("\n**Bai hoc lien quan:**")
            for i, lesson in enumerate(lessons[:5], 1):
                title = lesson.get('title', 'Unknown')
                course_title = lesson.get('course_title', '')
                similarity = lesson.get('similarity', 0)
                response_parts.append(f"{i}. **{title}** (Khoa hoc: {course_title}, Match: {similarity}%)")
        
        return "\n".join(response_parts)


# Singleton instance
_course_rag_service = None


def get_course_rag_service(vector_db=None) -> CourseRAGService:
    """Get or create singleton instance"""
    global _course_rag_service
    if _course_rag_service is None:
        _course_rag_service = CourseRAGService(vector_db)
    elif vector_db and _course_rag_service.vector_db is None:
        _course_rag_service.vector_db = vector_db
    return _course_rag_service


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Course RAG Service")
    print("=" * 60)
    
    service = CourseRAGService()
    
    # Test fetch courses
    print("\n1. Fetching courses...")
    courses = service.fetch_all_courses()
    print(f"   Found {len(courses)} courses")
    
    # Test direct search
    print("\n2. Direct search for 'Python'...")
    results = service.search_courses_direct("Python")
    print(f"   Found {results.get('total_results', 0)} matching courses")
    
    print("\n" + "=" * 60)

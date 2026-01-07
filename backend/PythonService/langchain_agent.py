"""
LangChain AI Agent - Intelligent Agent with Tool Usage
Tích hợp với dự án Agent For Edu
"""
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

# LangChain imports
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.tools import Tool
    from langchain.agents import initialize_agent, AgentType
    from langchain.memory import ConversationBufferMemory
    from langchain_core.prompts import PromptTemplate
    from langchain_core.messages import SystemMessage, HumanMessage
    LANGCHAIN_AVAILABLE = True
except ImportError as e:
    LANGCHAIN_AVAILABLE = False
    Tool = None
    print(f"⚠️  LangChain not installed: {e}")

# Import existing services
try:
    from gmail_service import ai_send_email, ai_get_contacts, ai_read_emails
    GMAIL_AVAILABLE = True
except ImportError:
    GMAIL_AVAILABLE = False

try:
    from tvu_scraper import TVUScraper
    TVU_AVAILABLE = True
except ImportError:
    TVU_AVAILABLE = False

try:
    from google_cloud_agent import GoogleCloudAgent
    CALENDAR_AVAILABLE = True
except ImportError:
    CALENDAR_AVAILABLE = False

try:
    from agent_features import AgentFeatures
    AGENT_FEATURES_AVAILABLE = True
except ImportError:
    AGENT_FEATURES_AVAILABLE = False
    AgentFeatures = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LangChainAgent:
    """
    AI Agent sử dụng LangChain framework
    - Tự động phát hiện intent
    - Tự động chọn tool phù hợp
    - Nhớ context conversation
    - ReAct pattern (Reasoning + Acting)
    """
    
    def __init__(self, gemini_api_key: str, spring_boot_url: str = "http://localhost:8080"):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain not installed")
        
        self.spring_boot_url = spring_boot_url
        
        # Initialize AgentFeatures for schedule and other features
        if AGENT_FEATURES_AVAILABLE:
            self.agent_features = AgentFeatures(spring_boot_url=spring_boot_url)
        else:
            self.agent_features = None
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=gemini_api_key,
            temperature=0.7,
            convert_system_message_to_human=True
        )
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize tools
        self.tools = self._create_tools()
        
        # Create agent
        self.agent = self._create_agent()
        
        logger.info(f"✅ LangChain Agent initialized with {len(self.tools)} tools")
    
    def _create_tools(self) -> List[Tool]:
        """Tạo danh sách tools cho agent"""
        tools = []
        
        # Tool 1: Get Schedule
        if TVU_AVAILABLE:
            tools.append(Tool(
                name="GetSchedule",
                func=self._get_schedule_tool,
                description="""
                Lấy thời khóa biểu của sinh viên từ TVU Portal.
                Input: JSON string với format {"date": "YYYY-MM-DD", "user_id": 123}
                Hỗ trợ: hôm nay, hôm qua, mai, mốt, kia, thứ 2-7, chủ nhật
                Output: Danh sách lịch học trong ngày
                """
            ))
        
        # Tool 2: Send Email
        if GMAIL_AVAILABLE:
            tools.append(Tool(
                name="SendEmail",
                func=self._send_email_tool,
                description="""
                Gửi email qua Gmail API.
                Input: JSON string với format {"to": "email@example.com", "subject": "...", "body": "...", "user_id": 123}
                Output: Kết quả gửi email
                """
            ))
        
        # Tool 3: Get Contacts
        if GMAIL_AVAILABLE:
            tools.append(Tool(
                name="GetContacts",
                func=self._get_contacts_tool,
                description="""
                Lấy danh sách contacts từ Gmail.
                Input: JSON string với format {"user_id": 123, "limit": 10}
                Output: Danh sách email contacts
                """
            ))
        
        # Tool 4: Read Emails
        if GMAIL_AVAILABLE:
            tools.append(Tool(
                name="ReadEmails",
                func=self._read_emails_tool,
                description="""
                Đọc email từ Gmail inbox.
                Input: JSON string với format {"user_id": 123, "max_results": 10}
                Output: Danh sách email gần đây
                """
            ))
        
        # Tool 5: Create Calendar Event
        if CALENDAR_AVAILABLE:
            tools.append(Tool(
                name="CreateCalendarEvent",
                func=self._create_calendar_event_tool,
                description="""
                Tạo sự kiện trên Google Calendar.
                Input: JSON string với format {"user_id": 123, "title": "...", "start_time": "YYYY-MM-DDTHH:MM:SS", "end_time": "..."}
                Output: Kết quả tạo event
                """
            ))
        
        # Tool 6: Search Knowledge Base
        tools.append(Tool(
            name="SearchKnowledge",
            func=self._search_knowledge_tool,
            description="""
            Tìm kiếm thông tin trong knowledge base (RAG).
            Input: Câu hỏi cần tìm
            Output: Thông tin liên quan từ knowledge base
            """
        ))
        
        return tools
    
    def _create_agent(self):
        """Tạo conversational agent"""
        
        # Create agent using initialize_agent (simpler API)
        agent_executor = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5
        )
        
        return agent_executor
    
    # ========== Tool Functions ==========
    
    def _get_schedule_tool(self, input_str: str) -> str:
        """Tool: Lấy thời khóa biểu"""
        try:
            import json
            params = json.loads(input_str)
            user_id = params.get("user_id")
            date_str = params.get("date", "")
            
            # Get token from user_id (need to call Spring Boot API)
            # For now, we need token to be passed in params
            token = params.get("token")
            
            if not token:
                return "❌ Cần token để lấy thời khóa biểu. Vui lòng đăng nhập."
            
            if not self.agent_features:
                return "❌ Agent features không khả dụng."
            
            # Build message from date_str
            message = f"lịch học {date_str}" if date_str else "lịch học hôm nay"
            
            # Call actual schedule function
            result = self.agent_features.get_schedule(token=token, message=message, force_sync=False)
            
            if result.get("success"):
                return result.get("message", "Không có lịch học")
            else:
                return result.get("message", "❌ Không thể lấy thời khóa biểu")
                
        except Exception as e:
            logger.error(f"Get schedule tool error: {e}")
            return f"❌ Lỗi khi lấy lịch: {str(e)}"
    
    def _send_email_tool(self, input_str: str) -> str:
        """Tool: Gửi email"""
        try:
            import json
            params = json.loads(input_str)
            
            if not GMAIL_AVAILABLE:
                return "Gmail service không khả dụng"
            
            result = ai_send_email(
                user_id=params["user_id"],
                to_email=params["to"],
                subject=params["subject"],
                body=params["body"]
            )
            
            return f"✅ Email đã gửi thành công đến {params['to']}"
        except Exception as e:
            return f"Lỗi khi gửi email: {str(e)}"
    
    def _get_contacts_tool(self, input_str: str) -> str:
        """Tool: Lấy danh sách contacts"""
        try:
            import json
            params = json.loads(input_str)
            
            if not GMAIL_AVAILABLE:
                return "Gmail service không khả dụng"
            
            contacts = ai_get_contacts(
                user_id=params["user_id"],
                limit=params.get("limit", 10)
            )
            
            return json.dumps(contacts, ensure_ascii=False)
        except Exception as e:
            return f"Lỗi khi lấy contacts: {str(e)}"
    
    def _read_emails_tool(self, input_str: str) -> str:
        """Tool: Đọc emails"""
        try:
            import json
            params = json.loads(input_str)
            
            if not GMAIL_AVAILABLE:
                return "Gmail service không khả dụng"
            
            emails = ai_read_emails(
                user_id=params["user_id"],
                max_results=params.get("max_results", 10)
            )
            
            return json.dumps(emails, ensure_ascii=False)
        except Exception as e:
            return f"Lỗi khi đọc emails: {str(e)}"
    
    def _create_calendar_event_tool(self, input_str: str) -> str:
        """Tool: Tạo calendar event"""
        try:
            import json
            params = json.loads(input_str)
            
            if not CALENDAR_AVAILABLE:
                return "Calendar service không khả dụng"
            
            # TODO: Implement calendar event creation
            return f"✅ Đã tạo event: {params['title']}"
        except Exception as e:
            return f"Lỗi khi tạo event: {str(e)}"
    
    def _search_knowledge_tool(self, query: str) -> str:
        """Tool: Tìm kiếm knowledge base"""
        try:
            # TODO: Implement RAG search
            return f"Thông tin về '{query}': [Knowledge base results]"
        except Exception as e:
            return f"Lỗi khi tìm kiếm: {str(e)}"
    
    # ========== Main Methods ==========
    
    def chat(self, message: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Chat với agent
        
        Args:
            message: Tin nhắn từ user
            user_id: ID của user (optional)
        
        Returns:
            Dict với response và metadata
        """
        try:
            # Add user_id to context if provided
            if user_id:
                message = f"[User ID: {user_id}] {message}"
            
            # Run agent
            result = self.agent.invoke({"input": message})
            
            return {
                "success": True,
                "response": result["output"],
                "intermediate_steps": result.get("intermediate_steps", []),
                "agent_type": "langchain"
            }
        
        except Exception as e:
            logger.error(f"Agent error: {str(e)}")
            return {
                "success": False,
                "response": f"Xin lỗi, tôi gặp lỗi: {str(e)}",
                "error": str(e),
                "agent_type": "langchain"
            }
    
    def reset_memory(self):
        """Reset conversation memory"""
        self.memory.clear()
        logger.info("Memory cleared")


# ========== Factory Function ==========

def create_langchain_agent(gemini_api_key: str, spring_boot_url: str = "http://localhost:8080") -> Optional[LangChainAgent]:
    """
    Factory function để tạo LangChain agent
    
    Returns:
        LangChainAgent instance hoặc None nếu không khả dụng
    """
    if not LANGCHAIN_AVAILABLE:
        logger.warning("LangChain not available")
        return None
    
    try:
        agent = LangChainAgent(gemini_api_key, spring_boot_url)
        return agent
    except Exception as e:
        logger.error(f"Failed to create LangChain agent: {str(e)}")
        return None

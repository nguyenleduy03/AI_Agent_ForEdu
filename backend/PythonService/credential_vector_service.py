"""
Universal Credential Manager - Vector Database Service
Provides semantic search for credentials using embeddings
"""

import os
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CredentialVectorService:
    """Service for managing credential embeddings and semantic search"""
    
    def __init__(self, persist_directory: str = "./chroma_credentials"):
        """Initialize vector database and embedding model"""
        self.persist_directory = persist_directory
        
        # Initialize ChromaDB
        self.client = chromadb.Client(Settings(
            persist_directory=persist_directory,
            anonymized_telemetry=False
        ))
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="user_credentials",
            metadata={"description": "User credentials with semantic search"}
        )
        
        # Initialize embedding model
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        logger.info("CredentialVectorService initialized successfully")
    
    def add_credential(
        self,
        credential_id: int,
        user_id: int,
        service_name: str,
        purpose: str,
        description: Optional[str] = None,
        category: str = "OTHER",
        tags: Optional[List[str]] = None
    ) -> bool:
        """Add or update credential in vector database"""
        try:
            # Combine text for embedding
            combined_text = f"{purpose}"
            if description:
                combined_text += f". {description}"
            if tags:
                combined_text += f". Tags: {', '.join(tags)}"
            
            # Generate embedding
            embedding = self.model.encode(combined_text).tolist()
            
            # Prepare metadata
            metadata = {
                "user_id": user_id,
                "credential_id": credential_id,
                "service_name": service_name,
                "category": category,
                "purpose": purpose[:500],  # Limit length
            }
            
            if tags:
                metadata["tags"] = ",".join(tags)
            
            # Add to collection
            doc_id = f"cred_{user_id}_{credential_id}"
            self.collection.upsert(
                ids=[doc_id],
                embeddings=[embedding],
                documents=[combined_text],
                metadatas=[metadata]
            )
            
            logger.info(f"Added credential {credential_id} to vector DB")
            return True
            
        except Exception as e:
            logger.error(f"Error adding credential to vector DB: {e}")
            return False
    
    def search_credentials(
        self,
        user_id: int,
        query: str,
        category: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict]:
        """
        Semantic search for credentials
        
        Args:
            user_id: User ID to filter results
            query: Search query (e.g., "xem thời khóa biểu", "watch movies")
            category: Optional category filter
            top_k: Number of results to return
            
        Returns:
            List of matching credentials with relevance scores
        """
        try:
            # Generate query embedding
            query_embedding = self.model.encode(query).tolist()
            
            # Prepare filter
            where_filter = {"user_id": user_id}
            if category:
                where_filter["category"] = category
            
            # Search
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter
            )
            
            # Format results
            credentials = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    credential = {
                        "credential_id": results['metadatas'][0][i]['credential_id'],
                        "service_name": results['metadatas'][0][i]['service_name'],
                        "category": results['metadatas'][0][i]['category'],
                        "purpose": results['metadatas'][0][i]['purpose'],
                        "relevance_score": 1 - results['distances'][0][i],  # Convert distance to similarity
                        "matched_text": results['documents'][0][i]
                    }
                    credentials.append(credential)
            
            logger.info(f"Found {len(credentials)} credentials for query: {query}")
            return credentials
            
        except Exception as e:
            logger.error(f"Error searching credentials: {e}")
            return []
    
    def delete_credential(self, user_id: int, credential_id: int) -> bool:
        """Delete credential from vector database"""
        try:
            doc_id = f"cred_{user_id}_{credential_id}"
            self.collection.delete(ids=[doc_id])
            logger.info(f"Deleted credential {credential_id} from vector DB")
            return True
        except Exception as e:
            logger.error(f"Error deleting credential: {e}")
            return False
    
    def get_user_credentials_count(self, user_id: int) -> int:
        """Get count of credentials for a user"""
        try:
            results = self.collection.get(
                where={"user_id": user_id}
            )
            return len(results['ids']) if results['ids'] else 0
        except Exception as e:
            logger.error(f"Error getting credential count: {e}")
            return 0
    
    def find_similar_credentials(
        self,
        user_id: int,
        credential_id: int,
        top_k: int = 3
    ) -> List[Dict]:
        """Find similar credentials to a given credential"""
        try:
            # Get the credential's embedding
            doc_id = f"cred_{user_id}_{credential_id}"
            result = self.collection.get(
                ids=[doc_id],
                include=["embeddings"]
            )
            
            if not result['embeddings']:
                return []
            
            embedding = result['embeddings'][0]
            
            # Search for similar
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=top_k + 1,  # +1 because it will include itself
                where={"user_id": user_id}
            )
            
            # Format and exclude the original credential
            credentials = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    cred_id = results['metadatas'][0][i]['credential_id']
                    if cred_id != credential_id:  # Exclude self
                        credential = {
                            "credential_id": cred_id,
                            "service_name": results['metadatas'][0][i]['service_name'],
                            "category": results['metadatas'][0][i]['category'],
                            "purpose": results['metadatas'][0][i]['purpose'],
                            "similarity_score": 1 - results['distances'][0][i]
                        }
                        credentials.append(credential)
            
            return credentials[:top_k]
            
        except Exception as e:
            logger.error(f"Error finding similar credentials: {e}")
            return []


# Singleton instance
_credential_vector_service = None


def get_credential_vector_service() -> CredentialVectorService:
    """Get or create singleton instance"""
    global _credential_vector_service
    if _credential_vector_service is None:
        _credential_vector_service = CredentialVectorService()
    return _credential_vector_service


# Example usage and testing
if __name__ == "__main__":
    service = get_credential_vector_service()
    
    # Test adding credentials
    print("\n=== Testing Add Credentials ===")
    service.add_credential(
        credential_id=1,
        user_id=1,
        service_name="school_portal",
        purpose="Xem thời khóa biểu và điểm số",
        description="Tài khoản trường học để tra cứu lịch học hàng tuần",
        category="EDUCATION",
        tags=["school", "schedule", "grades"]
    )
    
    service.add_credential(
        credential_id=2,
        user_id=1,
        service_name="netflix",
        purpose="Watch movies and TV shows",
        description="Streaming service for entertainment",
        category="ENTERTAINMENT",
        tags=["movies", "streaming", "entertainment"]
    )
    
    service.add_credential(
        credential_id=3,
        user_id=1,
        service_name="facebook",
        purpose="Kết nối với bạn bè và gia đình",
        description="Mạng xã hội để chia sẻ và giao lưu",
        category="SOCIAL",
        tags=["social", "friends", "communication"]
    )
    
    # Test semantic search
    print("\n=== Testing Semantic Search ===")
    
    queries = [
        "Tôi muốn xem lịch học",
        "xem phim",
        "đăng bài lên mạng xã hội",
        "check my grades"
    ]
    
    for query in queries:
        print(f"\nQuery: '{query}'")
        results = service.search_credentials(user_id=1, query=query, top_k=2)
        for result in results:
            print(f"  - {result['service_name']}: {result['purpose']}")
            print(f"    Relevance: {result['relevance_score']:.3f}")
    
    # Test similar credentials
    print("\n=== Testing Similar Credentials ===")
    similar = service.find_similar_credentials(user_id=1, credential_id=1, top_k=2)
    print(f"Credentials similar to school_portal:")
    for cred in similar:
        print(f"  - {cred['service_name']}: {cred['purpose']}")
        print(f"    Similarity: {cred['similarity_score']:.3f}")
    
    # Test count
    print(f"\n=== Credential Count ===")
    count = service.get_user_credentials_count(user_id=1)
    print(f"User 1 has {count} credentials")

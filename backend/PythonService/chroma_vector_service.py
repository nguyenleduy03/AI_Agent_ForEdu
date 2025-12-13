"""
ChromaDB Vector Service - Production Ready
Sử dụng ChromaDB với HNSW index cho performance tối ưu
"""
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import os
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChromaVectorService:
    """Production-grade vector service với ChromaDB"""
    
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize ChromaDB với persistent storage
        
        Args:
            persist_directory: Thư mục lưu trữ database
        """
        self.persist_directory = persist_directory
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Initialize embedding model
        # Sử dụng model đa ngôn ngữ (Vietnamese + English)
        logger.info("Loading embedding model...")
        self.embedding_model = SentenceTransformer(
            'paraphrase-multilingual-MiniLM-L12-v2'
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="knowledge_base",
            metadata={
                "description": "RAG knowledge base for AI agent",
                "hnsw:space": "cosine"  # Cosine similarity
            }
        )
        
        logger.info(f"✅ ChromaDB initialized: {self.collection.count()} documents")
    
    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Thêm documents vào vector database
        
        Args:
            documents: List văn bản cần thêm
            metadatas: Metadata cho mỗi document
            ids: IDs tùy chỉnh (auto-generate nếu None)
        
        Returns:
            Dict với status và count
        """
        try:
            # Generate IDs if not provided
            if ids is None:
                start_id = self.collection.count()
                ids = [f"doc_{start_id + i}" for i in range(len(documents))]
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(
                documents,
                show_progress_bar=False,
                convert_to_numpy=True
            ).tolist()
            
            # Add to ChromaDB
            self.collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas or [{"source": "manual"} for _ in documents],
                ids=ids
            )
            
            logger.info(f"✅ Added {len(documents)} documents to ChromaDB")
            
            return {
                "status": "success",
                "count": len(documents),
                "total_documents": self.collection.count()
            }
        
        except Exception as e:
            logger.error(f"❌ Error adding documents: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def search(
        self,
        query: str,
        n_results: int = 5,
        where: Optional[Dict] = None
    ) -> Dict:
        """
        Tìm kiếm semantic với ChromaDB
        
        Args:
            query: Câu hỏi/query
            n_results: Số kết quả trả về
            where: Filter metadata (vd: {"category": "programming"})
        
        Returns:
            Dict với documents, distances, metadatas
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(
                query,
                show_progress_bar=False,
                convert_to_numpy=True
            ).tolist()
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where
            )
            
            return {
                "documents": results['documents'][0] if results['documents'] else [],
                "distances": results['distances'][0] if results['distances'] else [],
                "metadatas": results['metadatas'][0] if results['metadatas'] else [],
                "ids": results['ids'][0] if results['ids'] else []
            }
        
        except Exception as e:
            logger.error(f"❌ Error searching: {e}")
            return {
                "documents": [],
                "distances": [],
                "metadatas": [],
                "ids": []
            }
    
    def delete_documents(self, ids: List[str]) -> Dict:
        """Xóa documents theo IDs"""
        try:
            self.collection.delete(ids=ids)
            return {"status": "success", "deleted": len(ids)}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def delete_all(self) -> Dict:
        """Xóa tất cả documents"""
        try:
            self.client.delete_collection("knowledge_base")
            self.collection = self.client.create_collection(
                name="knowledge_base",
                metadata={"hnsw:space": "cosine"}
            )
            return {"status": "success", "message": "All documents deleted"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_count(self) -> int:
        """Lấy số lượng documents"""
        return self.collection.count()
    
    def get_all_documents(self) -> Dict:
        """Lấy tất cả documents"""
        try:
            results = self.collection.get()
            return {
                "documents": results['documents'],
                "metadatas": results['metadatas'],
                "ids": results['ids'],
                "count": len(results['documents'])
            }
        except Exception as e:
            return {
                "documents": [],
                "metadatas": [],
                "ids": [],
                "count": 0
            }


# Singleton instance
_chroma_service = None


def get_chroma_service() -> ChromaVectorService:
    """Get or create singleton instance"""
    global _chroma_service
    if _chroma_service is None:
        _chroma_service = ChromaVectorService()
    return _chroma_service


# Test
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 Testing ChromaDB Vector Service")
    print("=" * 60)
    
    service = get_chroma_service()
    
    # Test add
    print("\n1. Adding documents...")
    result = service.add_documents(
        documents=[
            "Python là ngôn ngữ lập trình bậc cao, dễ học và mạnh mẽ.",
            "Machine Learning là nhánh của AI cho phép máy học từ dữ liệu.",
            "FastAPI là framework Python hiện đại để xây dựng API."
        ],
        metadatas=[
            {"category": "programming", "tags": "python"},
            {"category": "ai", "tags": "ml"},
            {"category": "programming", "tags": "fastapi"}
        ]
    )
    print(f"✅ Added: {result['count']} documents")
    print(f"📊 Total: {result['total_documents']} documents")
    
    # Test search
    print("\n2. Searching...")
    results = service.search("Làm sao học lập trình?", n_results=2)
    for i, (doc, dist) in enumerate(zip(results['documents'], results['distances']), 1):
        similarity = 1 - dist
        print(f"\n   {i}. {doc[:60]}...")
        print(f"      Similarity: {similarity:.3f} ({similarity*100:.1f}%)")
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("=" * 60)

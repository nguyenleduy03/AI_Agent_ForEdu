"""
FastAPI endpoints for Universal Credential Manager
Integrates with vector database for semantic search
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
try:
    from credential_vector_service import get_credential_vector_service
except ImportError:
    # Fallback to simple version without ChromaDB
    from simple_credential_vector import get_credential_vector_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/credentials", tags=["Credentials Vector Search"])


# Request/Response Models
class AddCredentialRequest(BaseModel):
    credential_id: int
    user_id: int
    service_name: str
    purpose: str
    description: Optional[str] = None
    category: str = "OTHER"
    tags: Optional[List[str]] = None


class SearchCredentialRequest(BaseModel):
    user_id: int
    query: str
    category: Optional[str] = None
    top_k: int = 5


class DeleteCredentialRequest(BaseModel):
    user_id: int
    credential_id: int


class CredentialSearchResult(BaseModel):
    credential_id: int
    service_name: str
    category: str
    purpose: str
    relevance_score: float
    matched_text: str


class SimilarCredentialResult(BaseModel):
    credential_id: int
    service_name: str
    category: str
    purpose: str
    similarity_score: float


# Endpoints
@router.post("/vector/add")
async def add_credential_to_vector_db(request: AddCredentialRequest):
    """
    Add credential to vector database for semantic search
    Called automatically when credential is created in SQL
    """
    try:
        service = get_credential_vector_service()
        success = service.add_credential(
            credential_id=request.credential_id,
            user_id=request.user_id,
            service_name=request.service_name,
            purpose=request.purpose,
            description=request.description,
            category=request.category,
            tags=request.tags
        )
        
        if success:
            return {"status": "success", "message": "Credential added to vector DB"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add credential")
            
    except Exception as e:
        logger.error(f"Error in add_credential_to_vector_db: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vector/search", response_model=List[CredentialSearchResult])
async def semantic_search_credentials(request: SearchCredentialRequest):
    """
    Semantic search for credentials using AI
    
    Example queries:
    - "Tôi muốn xem thời khóa biểu"
    - "Watch movies online"
    - "Post on social media"
    - "Check my bank account"
    """
    try:
        service = get_credential_vector_service()
        results = service.search_credentials(
            user_id=request.user_id,
            query=request.query,
            category=request.category,
            top_k=request.top_k
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error in semantic_search_credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vector/delete")
async def delete_credential_from_vector_db(request: DeleteCredentialRequest):
    """
    Delete credential from vector database
    Called automatically when credential is deleted from SQL
    """
    try:
        service = get_credential_vector_service()
        success = service.delete_credential(
            user_id=request.user_id,
            credential_id=request.credential_id
        )
        
        if success:
            return {"status": "success", "message": "Credential deleted from vector DB"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete credential")
            
    except Exception as e:
        logger.error(f"Error in delete_credential_from_vector_db: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vector/similar/{user_id}/{credential_id}", response_model=List[SimilarCredentialResult])
async def find_similar_credentials(user_id: int, credential_id: int, top_k: int = 3):
    """
    Find credentials similar to a given credential
    Useful for suggesting related credentials
    """
    try:
        service = get_credential_vector_service()
        results = service.find_similar_credentials(
            user_id=user_id,
            credential_id=credential_id,
            top_k=top_k
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error in find_similar_credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vector/count/{user_id}")
async def get_credential_count(user_id: int):
    """Get count of credentials in vector DB for a user"""
    try:
        service = get_credential_vector_service()
        count = service.get_user_credentials_count(user_id)
        return {"user_id": user_id, "count": count}
        
    except Exception as e:
        logger.error(f"Error in get_credential_count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/select-credential")
async def ai_select_credential(request: SearchCredentialRequest):
    """
    AI-powered credential selection
    Given a user query/context, return the best matching credential
    
    This is the main endpoint for AI Agent to use
    """
    try:
        service = get_credential_vector_service()
        results = service.search_credentials(
            user_id=request.user_id,
            query=request.query,
            category=request.category,
            top_k=1  # Return only the best match
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="No matching credential found")
        
        best_match = results[0]
        
        return {
            "status": "success",
            "credential_id": best_match["credential_id"],
            "service_name": best_match["service_name"],
            "category": best_match["category"],
            "purpose": best_match["purpose"],
            "confidence": best_match["relevance_score"],
            "reasoning": f"Selected based on semantic similarity to query: '{request.query}'"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ai_select_credential: {e}")
        raise HTTPException(status_code=500, detail=str(e))

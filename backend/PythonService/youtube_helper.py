"""
YouTube Helper - Tìm và phát video YouTube
"""
import requests
from typing import Optional
import re

def search_youtube_video(query: str) -> Optional[str]:
    """
    Tìm video YouTube đầu tiên và trả về video ID
    Sử dụng web scraping (không cần API key)
    """
    try:
        # Search trên YouTube
        search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        
        # Get HTML
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(search_url, headers=headers, timeout=5)
        
        if response.status_code != 200:
            return None
        
        # Extract video ID từ HTML
        # Pattern: "videoId":"VIDEO_ID"
        pattern = r'"videoId":"([a-zA-Z0-9_-]{11})"'
        matches = re.findall(pattern, response.text)
        
        if matches:
            # Lấy video đầu tiên
            video_id = matches[0]
            return video_id
        
        return None
    
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        return None

def get_youtube_watch_url(video_id: str, autoplay: bool = True) -> str:
    """Tạo URL để xem video với autoplay"""
    if autoplay:
        return f"https://www.youtube.com/watch?v={video_id}&autoplay=1"
    return f"https://www.youtube.com/watch?v={video_id}"

def get_youtube_embed_url(video_id: str, autoplay: bool = True) -> str:
    """Tạo URL embed để nhúng video"""
    if autoplay:
        return f"https://www.youtube.com/embed/{video_id}?autoplay=1"
    return f"https://www.youtube.com/embed/{video_id}"

# Test
if __name__ == "__main__":
    query = "doraemon tập 1"
    print(f"Searching: {query}")
    
    video_id = search_youtube_video(query)
    if video_id:
        print(f"Found video ID: {video_id}")
        print(f"Watch URL: {get_youtube_watch_url(video_id)}")
        print(f"Embed URL: {get_youtube_embed_url(video_id)}")
    else:
        print("No video found")

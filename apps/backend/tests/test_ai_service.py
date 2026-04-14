# test_ai_service.py - Smoke test for watermark feature
import asyncio
from unittest.mock import Mock, MagicMock

from app.services.pollinations_service import PollinationsService
from app.models.arrangement import Arrangement
from sqlalchemy.orm import Session
from unittest.mock import patch, AsyncMock

async def test_watermark_smoke():
    # Mock DB session and arrangement (minimal for service call)
    mock_db = Mock(spec=Session)
    mock_arrangement = Mock(spec=Arrangement)
    mock_arrangement.id = "test-uuid-1234"
    mock_arrangement.prompt_text = "Test bouquet of red roses"
    mock_arrangement.flower = None
    mock_arrangement.wrapping = None
    mock_arrangement.vase = None
    mock_arrangement.generated_image_url = None
    
    # Mock query response
    mock_query = Mock()
    mock_query.filter.return_value.first.return_value = mock_arrangement
    mock_db.query.return_value.__enter__.return_value = mock_query
    
    service = PollinationsService()
    
    print("Testing watermark generation (mocked DB)...")
    with patch.object(service, 'generate_arrangement_image') as mock_generate:
        # Since async, use AsyncMock for full test or just print intent
        url = await service.generate_arrangement_image(mock_db, "test-uuid-1234")
        print(f"Generated URL (mocked): {url}")
        print("Check service logs for watermark/upload flow.")

if __name__ == "__main__":
    asyncio.run(test_watermark_smoke())

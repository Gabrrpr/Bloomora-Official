# test_ai_service.py
import asyncio
from sqlalchemy.orm import Session
from app.services.pollinations_service import PollinationsService
from app.models.arrangement import Arrangement, ArrangementFlower
from app.core.database import SessionLocal

async def test_generation():
    db = SessionLocal()
    service = PollinationsService()

    # 1. Create a dummy arrangement with multiple flowers
    new_arr = Arrangement(name="Test Bouquet", prompt_text="A rustic wedding bouquet")
    db.add(new_arr)
    db.flush() # Get the ID

    # 2. Add multiple flower types (Simulating Mix & Match)
    flower1 = ArrangementFlower(arrangement_id=new_arr.id, flower_id=SOME_FLOWER_UUID, quantity=5)
    flower2 = ArrangementFlower(arrangement_id=new_arr.id, flower_id=ANOTHER_FLOWER_UUID, quantity=3)
    db.add_all([flower1, flower2])
    db.commit()

    # 3. Trigger AI Generation
    print("Generating image...")
    url = await service.generate_arrangement_image(db, new_arr.id)
    print(f"Success! Image URL: {url}")

if __name__ == "__main__":
    asyncio.run(test_generation())
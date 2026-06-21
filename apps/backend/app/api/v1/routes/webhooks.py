from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.models import Order

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/lalamove")
async def lalamove_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        # Lalamove sends data as JSON
        payload = await request.json()
        
        # Extract the event type and the data
        event_type = payload.get("eventType")
        data = payload.get("data", {})
        lalamove_order_id = data.get("orderId")
        
        if lalamove_order_id and event_type:
            # Find the matching order in your database
            order = db.query(Order).filter(Order.lalamove_order_id == lalamove_order_id).first()
            
            if order:
                # Update the delivery status with Lalamove's new status
                # (e.g., ASSIGNING_DRIVER, ON_GOING, PICKED_UP, COMPLETED)
                order.delivery_status = event_type
                db.commit()
                print(f"Lalamove Webhook: Order {order.id} updated to {event_type}")
            else:
                print(f"Lalamove Webhook: Order with Lalamove ID {lalamove_order_id} not found.")
                
        # You MUST return 200 OK to Lalamove, otherwise they will keep retrying
        return {"status": "success"}

    except Exception as e:
        print("WEBHOOK ERROR:", str(e))
        # Still return 200 to prevent Lalamove from spamming the endpoint if there's a minor error
        return {"status": "error", "message": str(e)}
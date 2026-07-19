from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.models import Delivery, DeliveryStatusEnum, ExternalShipment, Order, OrderStatusEnum
from app.services.delivery_tracking import apply_external_status, external_event_key, get_or_create_external_shipment

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
                order.lalamove_status = event_type
                order.delivery_provider = "lalamove"
                shipment = get_or_create_external_shipment(db, order)
                shipment.external_reference = lalamove_order_id
                shipment.tracking_url = data.get("shareLink") or shipment.tracking_url or order.lalamove_share_link
                delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
                normalized_status = "awaiting_booking"
                if event_type in {"ASSIGNING_DRIVER", "DRIVER_ASSIGNED"}:
                    order.status = OrderStatusEnum.preparing
                    normalized_status = "booked"
                    if delivery:
                        delivery.status = DeliveryStatusEnum.assigned
                elif event_type in {"ON_GOING", "PICKED_UP"}:
                    order.status = OrderStatusEnum.out_for_delivery
                    normalized_status = "in_transit" if event_type == "ON_GOING" else "picked_up"
                    if delivery:
                        delivery.status = DeliveryStatusEnum.out_for_delivery
                elif event_type in {"COMPLETED", "DELIVERED"}:
                    order.status = OrderStatusEnum.delivered
                    normalized_status = "delivered"
                    if delivery:
                        delivery.status = DeliveryStatusEnum.delivered
                elif "CANCEL" in event_type:
                    normalized_status = "cancelled"
                elif "FAIL" in event_type:
                    normalized_status = "failed"
                apply_external_status(
                    db,
                    shipment,
                    normalized_status,
                    provider_status=event_type,
                    message=f"Lalamove reported {event_type.replace('_', ' ').title()}.",
                    raw_payload=payload,
                    event_key=external_event_key(payload, event_type),
                )
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

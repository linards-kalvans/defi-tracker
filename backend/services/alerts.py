from sqlalchemy.future import select
from database import AsyncSessionLocal, Alert, Asset, PriceHistory
from services.market_data import market_service

class AlertService:
    async def check_alerts(self):
        """Checks all active alerts against latest prices."""
        async with AsyncSessionLocal() as session:
            # Get active alerts
            result = await session.execute(select(Alert).where(Alert.is_active == 1))
            alerts = result.scalars().all()
            
            for alert in alerts:
                # Get latest price for the asset
                price = await market_service.fetch_price(alert.asset.symbol)
                if not price:
                    continue
                
                triggered = False
                if alert.condition == "above" and price > alert.target_price:
                    triggered = True
                elif alert.condition == "below" and price < alert.target_price:
                    triggered = True
                    
                if triggered:
                    print(f"ALERT TRIGGERED: {alert.asset.symbol} is {alert.condition} {alert.target_price} (Current: {price})")
                    # Here we would send email/socket notification
                    alert.is_active = 0 # Deactivate after trigger
            
            await session.commit()

alert_service = AlertService()

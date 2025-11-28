from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import init_db, get_db, Asset, PriceHistory, Alert, AsyncSessionLocal
from services.market_data import market_service
from services.alerts import alert_service
from pydantic import BaseModel

scheduler = AsyncIOScheduler()

class AlertCreate(BaseModel):
    symbol: str
    target_price: float
    condition: str
    email: str = None

class AssetCreate(BaseModel):
    symbol: str
    name: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    # Seed data
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Asset))
        if not result.scalars().first():
            session.add_all([
                Asset(symbol="BTC/EUR", name="Bitcoin"),
                Asset(symbol="ETH/EUR", name="Ethereum"),
                Asset(symbol="SOL/EUR", name="Solana")
            ])
            await session.commit()
            
    # Start Scheduler
    scheduler.add_job(market_service.update_prices, 'interval', seconds=60)
    scheduler.add_job(alert_service.check_alerts, 'interval', seconds=30)
    scheduler.add_job(broadcast_prices, 'interval', seconds=5)
    scheduler.start()
    
    yield
    
    await market_service.close()

app = FastAPI(title="Crypto Price Tracker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Crypto Tracker API is running"}

@app.get("/api/assets")
async def get_assets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset))
    return result.scalars().all()

@app.post("/api/assets")
async def create_asset(asset: AssetCreate, db: AsyncSession = Depends(get_db)):
    # Check if asset already exists
    result = await db.execute(select(Asset).where(Asset.symbol == asset.symbol))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset already exists")
    
    new_asset = Asset(symbol=asset.symbol, name=asset.name)
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    return new_asset

@app.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted"}

@app.get("/api/available-pairs")
async def get_available_pairs():
    """Get all available EUR trading pairs from Coinbase."""
    pairs = await market_service.get_available_eur_pairs()
    return pairs

@app.get("/api/history/{symbol:path}")
async def get_history(symbol: str, db: AsyncSession = Depends(get_db)):
    # Use :path to allow slashes in the path parameter
    # FastAPI automatically decodes URL-encoded parameters
    from urllib.parse import unquote
    from datetime import datetime, timezone
    
    decoded_symbol = unquote(symbol)
    
    result = await db.execute(select(Asset).where(Asset.symbol == decoded_symbol))
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset not found: {decoded_symbol}")
        
    history_result = await db.execute(
        select(PriceHistory).where(PriceHistory.asset_id == asset.id).order_by(PriceHistory.timestamp.desc()).limit(100)
    )
    history = history_result.scalars().all()
    
    # Ensure timestamps are returned as UTC ISO strings with timezone info
    # Convert to dict format with explicit UTC timestamps
    return [
        {
            "id": h.id,
            "asset_id": h.asset_id,
            "price": h.price,
            "timestamp": h.timestamp.isoformat() + "Z" if h.timestamp else None
        }
        for h in history
    ]

@app.post("/api/alerts")
async def create_alert(alert: AlertCreate, db: AsyncSession = Depends(get_db)):
    # Find asset
    result = await db.execute(select(Asset).where(Asset.symbol == alert.symbol))
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, message="Asset not found")
        
    new_alert = Alert(
        asset_id=asset.id,
        target_price=alert.target_price,
        condition=alert.condition,
        email=alert.email
    )
    db.add(new_alert)
    await db.commit()
    return {"message": "Alert created"}

from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/prices")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages (optional, maybe heartbeat)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Update scheduler to broadcast prices
async def broadcast_prices():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Asset))
        assets = result.scalars().all()
        prices = {}
        for asset in assets:
            # In a real app, we'd get the latest price from cache/memory
            # For now, let's just fetch from DB or use the service cache if we had one
            # To avoid hitting API too much, we rely on the scheduled job to update DB
            # and here we read from DB
            latest_price = await session.execute(
                select(PriceHistory).where(PriceHistory.asset_id == asset.id).order_by(PriceHistory.timestamp.desc()).limit(1)
            )
            price_entry = latest_price.scalars().first()
            if price_entry:
                prices[asset.symbol] = price_entry.price
        
        if prices:
            await manager.broadcast(prices)

# Add broadcast job
# (Merged into the main lifespan above)

import ccxt.async_support as ccxt
import asyncio
from sqlalchemy.future import select
from database import AsyncSessionLocal, Asset, PriceHistory
from datetime import datetime
from config import settings

class MarketDataService:
    def __init__(self):
        # Using Kraken for better ARB/EUR support and lower fees
        exchange_config = {}
        if settings.KRAKEN_API_KEY and settings.KRAKEN_SECRET:
            exchange_config = {
                'apiKey': settings.KRAKEN_API_KEY,
                'secret': settings.KRAKEN_SECRET,
            }
        self.exchange = ccxt.kraken(exchange_config)

    async def close(self):
        await self.exchange.close()

    async def fetch_price(self, symbol: str):
        try:
            ticker = await self.exchange.fetch_ticker(symbol)
            return ticker['last']
        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")
            return None

    async def get_available_eur_pairs(self):
        """Fetch all available EUR trading pairs from Kraken."""
        try:
            await self.exchange.load_markets()
            eur_pairs = []
            for symbol, market in self.exchange.markets.items():
                # Kraken uses ZEUR internally often, but ccxt normalizes quote to EUR usually.
                # Checking both covers bases.
                if market['quote'] in ['EUR', 'ZEUR'] and market['active']:
                    eur_pairs.append({
                        'symbol': symbol,
                        'base': market['base'],
                        'name': market['base']
                    })
            return sorted(eur_pairs, key=lambda x: x['base'])
        except Exception as e:
            print(f"Error fetching EUR pairs: {e}")
            return []

    async def update_prices(self):
        """Polls prices for all tracked assets and saves to DB."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Asset))
            assets = result.scalars().all()
            
            for asset in assets:
                price = await self.fetch_price(asset.symbol)
                if price:
                    history = PriceHistory(asset_id=asset.id, price=price, timestamp=datetime.utcnow())
                    session.add(history)
            
            await session.commit()

market_service = MarketDataService()

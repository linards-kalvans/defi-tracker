from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Configuration
DATABASE_URL = settings.DATABASE_URL

# Handle Postgres connection string compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
     DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Parse URL and handle SSL parameters for asyncpg
parsed = urlparse(DATABASE_URL)
connect_args = {}

if parsed.scheme in ["postgresql+asyncpg", "postgresql"]:
    # Extract query parameters
    query_params = parse_qs(parsed.query)
    
    # Handle sslmode parameter - asyncpg uses 'ssl' in connect_args instead
    if 'sslmode' in query_params:
        sslmode = query_params['sslmode'][0]
        if sslmode == 'require':
            connect_args['ssl'] = 'require'
        # Remove sslmode from URL query params
        del query_params['sslmode']
        
        # Rebuild URL without sslmode
        new_query = urlencode(query_params, doseq=True)
        DATABASE_URL = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))

engine = create_async_engine(DATABASE_URL, echo=True, connect_args=connect_args)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)  # e.g., "BTC/USDT"
    name = Column(String)
    
    prices = relationship("PriceHistory", back_populates="asset")

class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    asset = relationship("Asset", back_populates="prices")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    target_price = Column(Float)
    condition = Column(String)  # "above" or "below"
    is_active = Column(Integer, default=1)  # 1=active, 0=triggered/inactive
    email = Column(String, nullable=True)
    
    asset = relationship("Asset")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

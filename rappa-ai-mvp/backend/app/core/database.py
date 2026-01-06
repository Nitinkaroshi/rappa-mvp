"""Database connection and session management using SQLAlchemy.

This module provides database engine, session factory, and dependency injection
for database sessions in FastAPI route handlers.
"""

import logging
from typing import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, event, exc, pool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, QueuePool

from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create declarative base for models
Base = declarative_base()


class DatabaseManager:
    """Database connection manager with proper pooling and error handling."""

    def __init__(self):
        """Initialize database engine and session factory."""
        self._engine = None
        self._session_factory = None
        self._initialized = False

    def initialize(self):
        """Initialize database engine and session factory.

        This should be called during application startup.
        """
        if self._initialized:
            logger.warning("Database already initialized, skipping")
            return

        try:
            # Determine pooling strategy based on environment
            if settings.ENVIRONMENT == "test":
                # Use NullPool for testing to avoid connection issues
                poolclass = NullPool
                logger.info("Using NullPool for test environment")
            else:
                # Use QueuePool for production/development
                poolclass = QueuePool
                logger.info("Using QueuePool with connection pooling")

            # Create database engine
            self._engine = create_engine(
                settings.database_url_sync,
                poolclass=poolclass,
                pool_size=settings.DB_POOL_SIZE if poolclass == QueuePool else None,
                max_overflow=settings.DB_MAX_OVERFLOW if poolclass == QueuePool else None,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=True,  # Verify connections before using
                echo=settings.DB_ECHO,  # Log all SQL statements if enabled
                future=True,  # Use SQLAlchemy 2.0 style
            )

            # Add connection event listeners for better error handling
            self._setup_event_listeners()

            # Create session factory
            self._session_factory = sessionmaker(
                bind=self._engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False,  # Prevent lazy loading issues
            )

            self._initialized = True
            logger.info("Database initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}")
            raise

    def _setup_event_listeners(self):
        """Setup SQLAlchemy event listeners for connection management."""

        @event.listens_for(self._engine, "connect")
        def receive_connect(dbapi_conn, connection_record):
            """Event listener for new database connections."""
            logger.debug("New database connection established")

        @event.listens_for(self._engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            """Event listener for connection checkout from pool."""
            logger.debug("Connection checked out from pool")

        @event.listens_for(self._engine, "checkin")
        def receive_checkin(dbapi_conn, connection_record):
            """Event listener for connection checkin to pool."""
            logger.debug("Connection checked in to pool")

    def get_engine(self):
        """Get the database engine.

        Returns:
            Engine: SQLAlchemy engine instance

        Raises:
            RuntimeError: If database is not initialized
        """
        if not self._initialized:
            raise RuntimeError(
                "Database not initialized. Call initialize() first."
            )
        return self._engine

    def get_session_factory(self):
        """Get the session factory.

        Returns:
            sessionmaker: SQLAlchemy session factory

        Raises:
            RuntimeError: If database is not initialized
        """
        if not self._initialized:
            raise RuntimeError(
                "Database not initialized. Call initialize() first."
            )
        return self._session_factory

    def create_all_tables(self):
        """Create all database tables.

        This should only be used in development/testing.
        Use Alembic migrations in production.
        """
        if not self._initialized:
            raise RuntimeError(
                "Database not initialized. Call initialize() first."
            )
        Base.metadata.create_all(bind=self._engine)
        logger.info("All database tables created")

    def drop_all_tables(self):
        """Drop all database tables.

        WARNING: This will delete all data. Only use in testing.
        """
        if not self._initialized:
            raise RuntimeError(
                "Database not initialized. Call initialize() first."
            )
        if settings.ENVIRONMENT == "production":
            raise RuntimeError(
                "Cannot drop tables in production environment"
            )
        Base.metadata.drop_all(bind=self._engine)
        logger.warning("All database tables dropped")

    def dispose(self):
        """Dispose of the database engine and close all connections.

        This should be called during application shutdown.
        """
        if self._engine:
            self._engine.dispose()
            logger.info("Database connections closed")
        self._initialized = False

    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """Provide a transactional scope for database operations.

        Usage:
            with db_manager.session_scope() as session:
                session.query(User).all()

        Yields:
            Session: SQLAlchemy session

        Raises:
            Exception: Re-raises any exception after rollback
        """
        session = self._session_factory()
        try:
            yield session
            session.commit()
        except exc.SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error: {str(e)}")
            raise
        except Exception as e:
            session.rollback()
            logger.error(f"Unexpected error: {str(e)}")
            raise
        finally:
            session.close()


# Global database manager instance
db_manager = DatabaseManager()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database sessions.

    This function should be used with Depends() in route handlers:

    Example:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()

    Yields:
        Session: SQLAlchemy database session

    Raises:
        Exception: Re-raises any exception after rollback
    """
    session = db_manager.get_session_factory()()
    try:
        yield session
        session.commit()
    except exc.SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error in request: {str(e)}")
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error in request: {str(e)}")
        raise
    finally:
        session.close()


def init_db():
    """Initialize database connection.

    This should be called during application startup.
    """
    try:
        db_manager.initialize()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise


def close_db():
    """Close database connections.

    This should be called during application shutdown.
    """
    try:
        db_manager.dispose()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")
        raise


def create_tables():
    """Create all database tables.

    Only use in development. Use Alembic migrations in production.
    """
    try:
        db_manager.create_all_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
        raise


# Health check function
def check_database_health() -> bool:
    """Check if database is accessible and healthy.

    Returns:
        bool: True if database is healthy, False otherwise
    """
    try:
        with db_manager.session_scope() as session:
            # Execute a simple query to verify connection
            session.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False

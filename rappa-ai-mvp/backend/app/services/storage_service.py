"""S3 storage service for file upload and management.

This service handles file uploads to AWS S3 or compatible storage (Backblaze B2).
"""

import logging
import os
from pathlib import Path
from typing import BinaryIO, Optional
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
from botocore.client import Config

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """S3-compatible storage service for file management.

    Supports:
    - AWS S3
    - Backblaze B2
    - MinIO
    - Any S3-compatible storage
    """

    def __init__(self):
        """Initialize S3 client with configuration from settings."""
        self._s3_client = None
        self._bucket_name = settings.AWS_BUCKET_NAME

    def _get_s3_client(self):
        """Lazy load S3 client to avoid errors if credentials not set."""
        if self._s3_client is None:
            try:
                # Configure S3 client with timeouts
                config_args = {
                    "signature_version": "s3v4",
                    "connect_timeout": 30,  # 30 seconds to establish connection
                    "read_timeout": 120,    # 120 seconds to read data
                    "retries": {
                        "max_attempts": 3,
                        "mode": "adaptive"
                    }
                }

                # Create S3 client
                self._s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION,
                    endpoint_url=settings.S3_ENDPOINT_URL,  # For Backblaze B2 or MinIO
                    config=Config(**config_args),
                    use_ssl=settings.S3_USE_SSL,
                    verify=settings.S3_VERIFY_SSL,
                )

                logger.info(f"S3 client initialized (bucket: {self._bucket_name})")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {str(e)}")
                raise RuntimeError(f"S3 client initialization failed: {str(e)}") from e

        return self._s3_client

    def upload_file(
        self,
        file_obj: BinaryIO,
        filename: str,
        user_id: int,
        content_type: Optional[str] = None,
        folder: str = "uploads"
    ) -> str:
        """Upload a file to storage (local or S3).

        Files are organized by folder, user_id and timestamp:
        {folder}/{user_id}/{timestamp}_{filename}

        Args:
            file_obj: File-like object to upload
            filename: Original filename
            user_id: User ID for organization
            content_type: MIME type of the file
            folder: Base folder for organization (default: "uploads")

        Returns:
            str: Path of the uploaded file

        Raises:
            RuntimeError: If upload fails
        """
        # Generate unique key
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        file_key = f"{folder}/{user_id}/{timestamp}_{filename}"

        # Use S3/Backblaze storage
        logger.info(f"Uploading file to S3: {file_key}")
        return self._upload_s3(file_obj, file_key, content_type)



    def _upload_s3(self, file_obj: BinaryIO, s3_key: str, content_type: Optional[str] = None) -> str:
        """Upload file to S3 storage."""
        try:
            s3_client = self._get_s3_client()

            # Prepare upload arguments
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type

            # Upload file
            s3_client.upload_fileobj(
                file_obj,
                self._bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )

            logger.info(f"File uploaded to S3: {s3_key}")
            return s3_key

        except ClientError as e:
            logger.error(f"S3 upload error: {str(e)}")
            raise RuntimeError(f"Failed to upload file: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected upload error: {str(e)}")
            raise RuntimeError(f"Unexpected error during upload: {str(e)}") from e

    def get_file_content(self, s3_key: str) -> bytes:
        """Get file content from S3 as bytes (in-memory).

        Args:
            s3_key: S3 path of the file

        Returns:
            bytes: File content

        Raises:
            RuntimeError: If download fails

        Example:
            content = storage.get_file_content("uploads/123/doc.pdf")
        """
        try:
            s3_client = self._get_s3_client()

            # Download file content to memory
            response = s3_client.get_object(
                Bucket=self._bucket_name,
                Key=s3_key
            )

            # Read the entire file content
            file_content = response['Body'].read()

            logger.info(f"File content retrieved from S3: {s3_key} ({len(file_content)} bytes)")
            return file_content

        except ClientError as e:
            logger.error(f"S3 get_object error: {str(e)}")
            raise RuntimeError(f"Failed to get file content: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error getting file content: {str(e)}")
            raise RuntimeError(f"Unexpected error: {str(e)}") from e

    def download_file(
        self,
        s3_key: str,
        local_path: str | Path
    ) -> Path:
        """Download a file from storage to local path.

        Args:
            s3_key: Storage path of the file
            local_path: Local path to save the file

        Returns:
            Path: Local path of the downloaded file

        Raises:
            RuntimeError: If download fails
        """
        local_path = Path(local_path)

        # Download from S3/Backblaze
        return self._download_s3(s3_key, local_path)



    def _download_s3(self, s3_key: str, local_path: Path) -> Path:
        """Download file from S3 storage."""
        try:
            s3_client = self._get_s3_client()

            # Ensure parent directory exists
            local_path.parent.mkdir(parents=True, exist_ok=True)

            # Download file
            s3_client.download_file(
                self._bucket_name,
                s3_key,
                str(local_path)
            )

            logger.info(f"File downloaded from S3: {s3_key} -> {local_path}")
            return local_path

        except ClientError as e:
            logger.error(f"S3 download error: {str(e)}")
            raise RuntimeError(f"Failed to download file: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected download error: {str(e)}")
            raise RuntimeError(f"Unexpected error during download: {str(e)}") from e

    def delete_file(self, s3_key: str) -> bool:
        """Delete a file from S3 storage.

        Args:
            s3_key: S3 path of the file to delete

        Returns:
            bool: True if deleted successfully

        Raises:
            RuntimeError: If deletion fails

        Example:
            success = storage.delete_file("uploads/123/20240101_120000_doc.pdf")
        """
        try:
            s3_client = self._get_s3_client()

            s3_client.delete_object(
                Bucket=self._bucket_name,
                Key=s3_key
            )

            logger.info(f"File deleted from S3: {s3_key}")
            return True

        except ClientError as e:
            logger.error(f"S3 deletion error: {str(e)}")
            raise RuntimeError(f"Failed to delete file: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected deletion error: {str(e)}")
            raise RuntimeError(f"Unexpected error during deletion: {str(e)}") from e

    def get_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600
    ) -> str:
        """Generate a presigned URL for temporary file access.

        Args:
            s3_key: S3 path of the file
            expiration: URL expiration time in seconds (default: 1 hour)

        Returns:
            str: Presigned URL for file access

        Raises:
            RuntimeError: If URL generation fails

        Example:
            url = storage.get_presigned_url("uploads/123/doc.pdf", expiration=7200)
        """
        try:
            s3_client = self._get_s3_client()

            url = s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self._bucket_name,
                    "Key": s3_key
                },
                ExpiresIn=expiration
            )

            logger.debug(f"Presigned URL generated for: {s3_key}")
            return url

        except ClientError as e:
            logger.error(f"Presigned URL error: {str(e)}")
            raise RuntimeError(f"Failed to generate presigned URL: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected presigned URL error: {str(e)}")
            raise RuntimeError(f"Unexpected error generating URL: {str(e)}") from e

    def file_exists(self, s3_key: str) -> bool:
        """Check if a file exists in S3 storage.

        Args:
            s3_key: S3 path of the file

        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            s3_client = self._get_s3_client()

            s3_client.head_object(
                Bucket=self._bucket_name,
                Key=s3_key
            )

            return True

        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            logger.error(f"Error checking file existence: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error checking file: {str(e)}")
            return False


# Global storage service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get the global storage service instance.

    This function provides dependency injection for FastAPI routes.

    Returns:
        StorageService: The global storage service instance

    Example:
        @app.post("/upload")
        def upload(
            file: UploadFile,
            storage: StorageService = Depends(get_storage_service)
        ):
            s3_path = storage.upload_file(file.file, file.filename, user_id=123)
            return {"s3_path": s3_path}
    """
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service

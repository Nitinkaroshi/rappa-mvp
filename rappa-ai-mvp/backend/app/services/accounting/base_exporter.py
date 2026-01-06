"""Base class for all accounting software exporters."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseAccountingExporter(ABC):
    """Base class for all accounting software exporters.

    Each accounting software (Tally, QuickBooks, Zoho) should implement
    this interface to provide consistent export functionality.
    """

    @abstractmethod
    def validate_data(self, extracted_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate that extracted data has required fields for this software.

        Args:
            extracted_data: List of extracted documents with their fields

        Returns:
            Dictionary with validation results:
            {
                "valid": bool,
                "errors": List[str],
                "warnings": List[str]
            }
        """
        pass

    @abstractmethod
    def transform_data(
        self,
        extracted_data: List[Dict[str, Any]],
        config: Dict[str, Any]
    ) -> Any:
        """Transform extracted data to software-specific format.

        Args:
            extracted_data: List of extracted documents
            config: User's software-specific settings (ledger mappings, etc.)

        Returns:
            Transformed data in software-specific format
        """
        pass

    @abstractmethod
    def generate_export_file(self, transformed_data: Any) -> bytes:
        """Generate the final export file (XML, CSV, JSON, etc.).

        Args:
            transformed_data: Data already transformed to software format

        Returns:
            File content as bytes ready for download
        """
        pass

    @abstractmethod
    def get_required_fields(self) -> List[str]:
        """Return list of required fields for this software.

        Returns:
            List of field names that must be present in extracted data.
            Example: ["supplier_name", "invoice_number", "date", "total_amount"]
        """
        pass

    @abstractmethod
    def get_default_config(self) -> Dict[str, Any]:
        """Return default configuration for this software.

        Returns:
            Dictionary with default settings.
            Example for Tally:
            {
                "voucher_type": "Purchase",
                "ledger_mappings": {
                    "party": "Sundry Creditors",
                    "cgst": "CGST Payable",
                    ...
                }
            }
        """
        pass

    @abstractmethod
    def get_config_schema(self) -> Dict[str, Any]:
        """Return JSON schema for configuration UI.

        Returns:
            JSON schema describing the configuration options for the UI.
            This helps the frontend generate appropriate input fields.
        """
        pass

    def preview_data(
        self,
        extracted_data: List[Dict[str, Any]],
        config: Dict[str, Any],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Generate a preview of how data will look after transformation.

        Args:
            extracted_data: List of extracted documents
            config: User's configuration
            limit: Maximum number of items to preview

        Returns:
            List of preview items (limited to 'limit' entries)
        """
        transformed = self.transform_data(extracted_data, config)

        # Handle both list and dict transformed data
        if isinstance(transformed, list):
            return transformed[:limit]
        elif isinstance(transformed, dict) and 'vouchers' in transformed:
            return transformed['vouchers'][:limit]

        return [transformed]

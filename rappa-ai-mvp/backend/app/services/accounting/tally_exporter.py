"""Tally Prime XML exporter for purchase/sales vouchers."""

import xml.etree.ElementTree as ET
from typing import List, Dict, Any
from datetime import datetime
from .base_exporter import BaseAccountingExporter


class TallyExporter(BaseAccountingExporter):
    """Tally Prime XML exporter.

    Generates XML files compatible with Tally Prime for importing
    purchase vouchers, sales vouchers, payment vouchers, etc.
    """

    def validate_data(self, extracted_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate that extracted data has required fields for Tally."""
        errors = []
        warnings = []

        required_fields = self.get_required_fields()

        for idx, doc in enumerate(extracted_data, 1):
            # Check required fields
            for field in required_fields:
                if field not in doc or not doc[field]:
                    errors.append(
                        f"Document {idx}: Missing required field '{field}'"
                    )

            # GST validation (if present)
            if doc.get('gst_number'):
                gst = str(doc['gst_number']).strip()
                if len(gst) != 15:
                    warnings.append(
                        f"Document {idx}: GST number should be 15 characters, got {len(gst)}"
                    )

            # Date format validation
            if doc.get('invoice_date'):
                try:
                    self._parse_date(doc['invoice_date'])
                except ValueError:
                    errors.append(
                        f"Document {idx}: Invalid date format '{doc['invoice_date']}'. "
                        "Expected DD/MM/YYYY or YYYY-MM-DD"
                    )

            # Amount validation
            if doc.get('total_amount'):
                try:
                    float(doc['total_amount'])
                except (ValueError, TypeError):
                    errors.append(
                        f"Document {idx}: Invalid total_amount '{doc['total_amount']}'"
                    )

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    def transform_data(
        self,
        extracted_data: List[Dict[str, Any]],
        config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Transform extracted data to Tally voucher structure."""
        vouchers = []

        voucher_type = config.get("voucher_type", "Purchase")
        ledger_mappings = config.get("ledger_mappings", {})

        for doc in extracted_data:
            voucher = {
                "voucher_type": voucher_type,
                "date": self._format_date_for_tally(doc.get("invoice_date")),
                "party_name": doc.get("supplier_name") or doc.get("customer_name") or "Unknown",
                "voucher_number": doc.get("invoice_number"),
                "reference": doc.get("invoice_number"),
                "ledger_entries": []
            }

            # Get amounts
            total_amount = float(doc.get("total_amount", 0))
            taxable_amount = float(doc.get("taxable_amount") or doc.get("subtotal", 0))
            cgst_amount = float(doc.get("cgst_amount", 0))
            sgst_amount = float(doc.get("sgst_amount", 0))
            igst_amount = float(doc.get("igst_amount", 0))

            # Party ledger (Sundry Creditors for Purchase, Sundry Debtors for Sales)
            party_ledger = ledger_mappings.get("party", "Sundry Creditors")
            party_amount = -total_amount if voucher_type == "Purchase" else total_amount

            voucher["ledger_entries"].append({
                "ledger_name": party_ledger,
                "amount": party_amount,
                "is_party_ledger": True
            })

            # Purchase/Sales ledger
            purchase_sales_ledger = ledger_mappings.get(
                "purchase" if voucher_type == "Purchase" else "sales",
                "Purchase" if voucher_type == "Purchase" else "Sales"
            )
            voucher["ledger_entries"].append({
                "ledger_name": purchase_sales_ledger,
                "amount": taxable_amount if voucher_type == "Purchase" else -taxable_amount
            })

            # CGST ledger
            if cgst_amount > 0:
                cgst_ledger = ledger_mappings.get("cgst", "CGST Payable")
                voucher["ledger_entries"].append({
                    "ledger_name": cgst_ledger,
                    "amount": cgst_amount if voucher_type == "Purchase" else -cgst_amount
                })

            # SGST ledger
            if sgst_amount > 0:
                sgst_ledger = ledger_mappings.get("sgst", "SGST Payable")
                voucher["ledger_entries"].append({
                    "ledger_name": sgst_ledger,
                    "amount": sgst_amount if voucher_type == "Purchase" else -sgst_amount
                })

            # IGST ledger
            if igst_amount > 0:
                igst_ledger = ledger_mappings.get("igst", "IGST Payable")
                voucher["ledger_entries"].append({
                    "ledger_name": igst_ledger,
                    "amount": igst_amount if voucher_type == "Purchase" else -igst_amount
                })

            vouchers.append(voucher)

        return vouchers

    def generate_export_file(self, transformed_data: List[Dict[str, Any]]) -> bytes:
        """Generate Tally XML file."""
        # Create XML structure
        root = ET.Element("ENVELOPE")

        # Header
        header = ET.SubElement(root, "HEADER")
        ET.SubElement(header, "TALLYREQUEST").text = "Import Data"

        # Body
        body = ET.SubElement(root, "BODY")
        import_data = ET.SubElement(body, "IMPORTDATA")

        request_desc = ET.SubElement(import_data, "REQUESTDESC")
        ET.SubElement(request_desc, "REPORTNAME").text = "Vouchers"
        ET.SubElement(request_desc, "STATICVARIABLES").text = "SVCURRENTCOMPANY"

        request_data = ET.SubElement(import_data, "REQUESTDATA")

        # Add each voucher
        for voucher in transformed_data:
            self._add_voucher_to_xml(request_data, voucher)

        # Convert to XML string with proper formatting
        xml_str = ET.tostring(root, encoding='unicode', method='xml')

        # Add XML declaration
        xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
        final_xml = xml_declaration + xml_str

        return final_xml.encode('utf-8')

    def get_required_fields(self) -> List[str]:
        """Return required fields for Tally export."""
        return [
            "invoice_date",
            "invoice_number",
            "total_amount"
        ]

    def get_default_config(self) -> Dict[str, Any]:
        """Return default Tally configuration."""
        return {
            "voucher_type": "Purchase",
            "company_name": "",
            "ledger_mappings": {
                "party": "Sundry Creditors",
                "purchase": "Purchase",
                "sales": "Sales",
                "cgst": "CGST Payable",
                "sgst": "SGST Payable",
                "igst": "IGST Payable"
            },
            "gst_treatment": "Registered"
        }

    def get_config_schema(self) -> Dict[str, Any]:
        """Return JSON schema for Tally configuration UI."""
        return {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "title": "Company Name",
                    "description": "Your company name in Tally"
                },
                "voucher_type": {
                    "type": "string",
                    "title": "Voucher Type",
                    "enum": ["Purchase", "Sales", "Payment", "Receipt"],
                    "default": "Purchase"
                },
                "gst_treatment": {
                    "type": "string",
                    "title": "GST Treatment",
                    "enum": ["Registered", "Unregistered", "Composition"],
                    "default": "Registered"
                },
                "ledger_mappings": {
                    "type": "object",
                    "title": "Ledger Mappings",
                    "properties": {
                        "party": {
                            "type": "string",
                            "title": "Party Ledger",
                            "default": "Sundry Creditors"
                        },
                        "purchase": {
                            "type": "string",
                            "title": "Purchase Ledger",
                            "default": "Purchase"
                        },
                        "sales": {
                            "type": "string",
                            "title": "Sales Ledger",
                            "default": "Sales"
                        },
                        "cgst": {
                            "type": "string",
                            "title": "CGST Ledger",
                            "default": "CGST Payable"
                        },
                        "sgst": {
                            "type": "string",
                            "title": "SGST Ledger",
                            "default": "SGST Payable"
                        },
                        "igst": {
                            "type": "string",
                            "title": "IGST Ledger",
                            "default": "IGST Payable"
                        }
                    }
                }
            }
        }

    def _add_voucher_to_xml(self, parent: ET.Element, voucher: Dict[str, Any]) -> None:
        """Add a single voucher to the XML structure."""
        tallymessage = ET.SubElement(parent, "TALLYMESSAGE", {"xmlns:UDF": "TallyUDF"})

        voucher_elem = ET.SubElement(tallymessage, "VOUCHER", {
            "REMOTEID": str(voucher.get("voucher_number", "")),
            "VCHTYPE": voucher["voucher_type"],
            "ACTION": "Create",
            "OBJVIEW": "Accounting Voucher View"
        })

        # Basic voucher details
        ET.SubElement(voucher_elem, "DATE").text = voucher["date"]
        ET.SubElement(voucher_elem, "VOUCHERTYPENAME").text = voucher["voucher_type"]
        ET.SubElement(voucher_elem, "VOUCHERNUMBER").text = str(voucher.get("voucher_number", ""))
        ET.SubElement(voucher_elem, "PARTYLEDGERNAME").text = voucher["party_name"]

        if voucher.get("reference"):
            ET.SubElement(voucher_elem, "REFERENCE").text = str(voucher["reference"])

        # Add ledger entries
        for entry in voucher["ledger_entries"]:
            ledger_list = ET.SubElement(voucher_elem, "ALLLEDGERENTRIES.LIST")

            ET.SubElement(ledger_list, "LEDGERNAME").text = entry["ledger_name"]
            ET.SubElement(ledger_list, "ISDEEMEDPOSITIVE").text = "Yes" if entry["amount"] >= 0 else "No"
            ET.SubElement(ledger_list, "AMOUNT").text = f"{entry['amount']:.2f}"

            if entry.get("is_party_ledger"):
                ET.SubElement(ledger_list, "ISPARTYLEDGER").text = "Yes"

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date from various formats."""
        if not date_str:
            raise ValueError("Date is empty")

        date_str = str(date_str).strip()

        # Try different date formats
        formats = [
            "%d/%m/%Y",
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%Y/%m/%d",
            "%d.%m.%Y"
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        raise ValueError(f"Unable to parse date: {date_str}")

    def _format_date_for_tally(self, date_str: str) -> str:
        """Format date for Tally (YYYYMMDD format)."""
        if not date_str:
            return datetime.now().strftime("%Y%m%d")

        try:
            dt = self._parse_date(date_str)
            return dt.strftime("%Y%m%d")
        except ValueError:
            # Fallback to current date
            return datetime.now().strftime("%Y%m%d")

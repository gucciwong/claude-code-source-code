"""
Tests for Zero-Trust Local AI (ZTLA) — Innovation #9
"""

import pytest
import re
from enterprise_data.zero_trust import (
    OutputScanner,
    NetworkEgressMonitor,
    ZeroTrustMonitor,
    ThreatLevel,
    ExfilCategory,
    SecurityScan,
    AuditEntry,
)


# ---------------------------------------------------------------------------
# OutputScanner
# ---------------------------------------------------------------------------


class TestOutputScanner:
    """Tests for the OutputScanner exfiltration pattern detector."""

    def setup_method(self):
        self.scanner = OutputScanner()

    def test_scan_clean_text_returns_safe(self):
        scan = self.scanner.scan("Hello, this is a normal response about Python programming.")
        assert scan.threat_level == ThreatLevel.SAFE
        assert len(scan.findings) == 0

    def test_scan_detects_base64_encoded_data(self):
        # Long base64 string (40+ chars)
        b64_data = "A" * 44 + "=="
        scan = self.scanner.scan(f"Here is the data: {b64_data}")
        categories = [f["category"] for f in scan.findings]
        assert "base64_encoded" in categories

    def test_scan_short_base64_is_low_threat(self):
        # Short base64 (< 100 chars) should be LOW
        short_b64 = "SGVsbG8gV29ybGQ="
        scan = self.scanner.scan(f"Example: {short_b64}")
        b64_finding = [f for f in scan.findings if f["category"] == "base64_encoded"]
        if b64_finding:
            assert b64_finding[0]["threat_level"] == "low"

    def test_scan_detects_url(self):
        scan = self.scanner.scan("Visit https://evil.example.com/data for more info")
        categories = [f["category"] for f in scan.findings]
        assert "url_in_output" in categories

    def test_scan_safe_url_is_low_threat(self):
        scan = self.scanner.scan("See https://docs.python.org/3/library/os.html")
        url_finding = [f for f in scan.findings if f["category"] == "url_in_output"]
        if url_finding:
            assert url_finding[0]["threat_level"] == "low"

    def test_scan_detects_email(self):
        scan = self.scanner.scan("Contact user@company.com for details")
        categories = [f["category"] for f in scan.findings]
        assert "email_in_output" in categories

    def test_scan_detects_credential_leak(self):
        scan = self.scanner.scan('api_key="sk-1234567890abcdef"')
        categories = [f["category"] for f in scan.findings]
        assert "credential_leak" in categories

    def test_credential_leak_is_critical(self):
        scan = self.scanner.scan('password="supersecret12345678"')
        cred_finding = [f for f in scan.findings if f["category"] == "credential_leak"]
        if cred_finding:
            assert cred_finding[0]["threat_level"] == "critical"

    def test_scan_detects_private_key(self):
        scan = self.scanner.scan("-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA")
        categories = [f["category"] for f in scan.findings]
        assert "private_key_leak" in categories

    def test_private_key_is_critical(self):
        scan = self.scanner.scan("-----BEGIN PRIVATE KEY-----\nMIIEpAIBAAKCAQEA")
        key_finding = [f for f in scan.findings if f["category"] == "private_key_leak"]
        if key_finding:
            assert key_finding[0]["threat_level"] == "critical"

    def test_scan_detects_ip_address(self):
        scan = self.scanner.scan("Server is at 192.168.1.100")
        categories = [f["category"] for f in scan.findings]
        assert "ip_address" in categories

    def test_scan_detects_phone_number(self):
        scan = self.scanner.scan("Call +1-555-123-4567 for support")
        categories = [f["category"] for f in scan.findings]
        assert "phone_number" in categories

    def test_scan_detects_suspicious_encoding(self):
        hex_encoded = "\\x41\\x42\\x43\\x44\\x45\\x46\\x47\\x48"
        scan = self.scanner.scan(f"Data: {hex_encoded}")
        categories = [f["category"] for f in scan.findings]
        assert "suspicious_encoding" in categories

    def test_scan_detects_data_dump(self):
        # The data_dump regex matches repeated {"key":"value"} patterns without spaces
        data_dump = ''.join([f'{{"item{i}":"val{i}"}}' for i in range(6)])
        scan = self.scanner.scan(f"Result: {data_dump}")
        categories = [f["category"] for f in scan.findings]
        assert "data_dump" in categories

    def test_scan_has_id(self):
        scan = self.scanner.scan("clean text")
        assert scan.id.startswith("scan-")

    def test_scan_duration_is_recorded(self):
        scan = self.scanner.scan("some text to scan")
        assert scan.scan_duration_ms >= 0

    def test_scan_to_dict(self):
        scan = self.scanner.scan("clean text")
        d = scan.to_dict()
        assert "id" in d
        assert "threat_level" in d
        assert "findings_count" in d
        assert "findings" in d

    def test_repetition_detection(self):
        repeated = "\n".join(["same line repeated"] * 20)
        scan = self.scanner.scan(repeated)
        categories = [f["category"] for f in scan.findings]
        assert "repeated_pattern" in categories

    def test_no_repetition_for_short_text(self):
        scan = self.scanner.scan("short")
        rep_findings = [f for f in scan.findings if f["category"] == "repeated_pattern"]
        assert len(rep_findings) == 0

    def test_multiple_threats_max_level_wins(self):
        # Text with both URL and credential
        text = 'Visit https://evil.com and password="longsecret12345678"'
        scan = self.scanner.scan(text)
        assert scan.threat_level == ThreatLevel.CRITICAL


# ---------------------------------------------------------------------------
# NetworkEgressMonitor
# ---------------------------------------------------------------------------


class TestNetworkEgressMonitor:
    """Tests for the NetworkEgressMonitor."""

    def setup_method(self):
        self.monitor = NetworkEgressMonitor()

    def test_check_egress_returns_clean(self):
        result = self.monitor.check_egress()
        assert result["status"] == "clean"
        assert result["connections_found"] == 0

    def test_check_egress_has_check_id(self):
        result = self.monitor.check_egress()
        assert "check_id" in result
        assert result["check_id"].startswith("egress-")

    def test_check_egress_increments_count(self):
        self.monitor.check_egress()
        self.monitor.check_egress()
        stats = self.monitor.get_stats()
        assert stats["total_checks"] == 2

    def test_record_violation(self):
        self.monitor.record_violation({"type": "outbound_http", "host": "evil.com"})
        stats = self.monitor.get_stats()
        assert stats["violations"] == 1

    def test_get_stats_returns_dict(self):
        stats = self.monitor.get_stats()
        assert "total_checks" in stats
        assert "violations" in stats

    def test_violation_details_keeps_last_5(self):
        for i in range(7):
            self.monitor.record_violation({"index": i})
        stats = self.monitor.get_stats()
        assert len(stats["violation_details"]) == 5


# ---------------------------------------------------------------------------
# ZeroTrustMonitor
# ---------------------------------------------------------------------------


class TestZeroTrustMonitor:
    """Tests for the high-level ZeroTrustMonitor API."""

    def setup_method(self):
        self.monitor = ZeroTrustMonitor()

    def test_scan_output_returns_security_scan(self):
        scan = self.monitor.scan_output("clean text")
        assert isinstance(scan, SecurityScan)

    def test_scan_output_logs_audit(self):
        self.monitor.scan_output("clean text")
        log = self.monitor.get_audit_log()
        assert len(log) == 1
        assert log[0]["event_type"] == "scan"

    def test_scan_output_critical_logs_threat(self):
        self.monitor.scan_output('password="supersecret12345678"')
        log = self.monitor.get_audit_log()
        # Find the scan entry (most recent first)
        scan_entries = [e for e in log if e["event_type"] == "scan"]
        assert len(scan_entries) > 0
        assert scan_entries[0]["threat_level"] == "critical"

    def test_check_network_egress(self):
        result = self.monitor.check_network_egress()
        assert "status" in result
        assert result["status"] == "clean"

    def test_check_network_egress_logs_audit(self):
        self.monitor.check_network_egress()
        log = self.monitor.get_audit_log()
        assert any(e["event_type"] == "network_check" for e in log)

    def test_verify_sandbox(self):
        result = self.monitor.verify_sandbox()
        assert result["network_isolated"] is True
        assert result["filesystem_restricted"] is True
        assert result["memory_isolated"] is True
        assert result["capabilities_restricted"] is True

    def test_verify_sandbox_logs_audit(self):
        self.monitor.verify_sandbox()
        log = self.monitor.get_audit_log()
        assert any(e["event_type"] == "sandbox" for e in log)

    def test_get_audit_log_returns_list(self):
        self.monitor.scan_output("text1")
        self.monitor.scan_output("text2")
        log = self.monitor.get_audit_log()
        assert isinstance(log, list)
        assert len(log) == 2

    def test_get_audit_log_most_recent_first(self):
        self.monitor.scan_output("first")
        self.monitor.scan_output("second")
        log = self.monitor.get_audit_log()
        # Most recent first
        assert log[0]["details"]["scan_id"] != log[1]["details"]["scan_id"]

    def test_get_audit_log_respects_limit(self):
        for i in range(10):
            self.monitor.scan_output(f"text-{i}")
        log = self.monitor.get_audit_log(limit=3)
        assert len(log) == 3

    def test_get_security_report(self):
        self.monitor.scan_output("clean text")
        self.monitor.scan_output('api_key="sk-1234567890abcdef"')
        report = self.monitor.get_security_report()
        assert "total_scans" in report
        assert "threats_detected" in report
        assert "egress_stats" in report
        assert "audit_entries" in report
        assert report["total_scans"] == 2
        assert report["threats_detected"] == 1

    def test_get_security_report_empty(self):
        report = self.monitor.get_security_report()
        assert report["total_scans"] == 0
        assert report["threats_detected"] == 0
        assert report["last_scan"] is None

    def test_audit_entry_has_signature(self):
        self.monitor.scan_output("text")
        log = self.monitor.get_audit_log()
        assert "signature" in log[0]
        assert len(log[0]["signature"]) > 0

    def test_multiple_scan_types_in_audit(self):
        self.monitor.scan_output("text")
        self.monitor.check_network_egress()
        self.monitor.verify_sandbox()
        log = self.monitor.get_audit_log()
        event_types = {e["event_type"] for e in log}
        assert "scan" in event_types
        assert "network_check" in event_types
        assert "sandbox" in event_types


# ---------------------------------------------------------------------------
# ThreatLevel enum
# ---------------------------------------------------------------------------


class TestThreatLevel:
    """Tests for ThreatLevel enum."""

    def test_threat_levels_exist(self):
        assert ThreatLevel.SAFE.label == "safe"
        assert ThreatLevel.LOW.label == "low"
        assert ThreatLevel.MEDIUM.label == "medium"
        assert ThreatLevel.HIGH.label == "high"
        assert ThreatLevel.CRITICAL.label == "critical"

    def test_threat_level_ordering(self):
        levels = [ThreatLevel.SAFE, ThreatLevel.LOW, ThreatLevel.MEDIUM,
                  ThreatLevel.HIGH, ThreatLevel.CRITICAL]
        for i in range(len(levels) - 1):
            assert levels[i].value < levels[i + 1].value


# ---------------------------------------------------------------------------
# ExfilCategory enum
# ---------------------------------------------------------------------------


class TestExfilCategory:
    """Tests for ExfilCategory enum."""

    def test_all_categories_exist(self):
        expected = [
            "base64_encoded", "url_in_output", "email_in_output",
            "repeated_pattern", "suspicious_encoding", "data_dump",
            "credential_leak", "private_key_leak", "ip_address",
            "phone_number",
        ]
        actual = [c.value for c in ExfilCategory]
        for cat in expected:
            assert cat in actual

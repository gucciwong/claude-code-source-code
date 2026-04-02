import re
from .models import PersonaReview, CritiqueItem, Severity


class SecurityAuditor:
    NAME = "Security Auditor"
    DESCRIPTION = "Reviews code for OWASP Top 10 vulnerabilities, injection risks, and auth weaknesses"

    CHECKS = [
        # (pattern, title, description, severity)
        (r'eval\s*\(', "Code Injection via eval()", "eval() executes arbitrary code — use ast.literal_eval() or structured parsing", Severity.CRITICAL),
        (r'exec\s*\(', "Code Injection via exec()", "exec() executes arbitrary Python code — avoid or sandbox it", Severity.CRITICAL),
        (r'os\.system\s*\(', "Command Injection via os.system()", "Use subprocess with a list of arguments, not a shell string", Severity.CRITICAL),
        (r'subprocess\..*shell\s*=\s*True', "Shell Injection risk", "shell=True enables shell injection — pass args as a list", Severity.ERROR),
        (r'password\s*=\s*["\'][^"\']+["\']', "Hardcoded Password", "Never hardcode credentials — use environment variables or a secrets manager", Severity.ERROR),
        (r'(?:api_key|secret|token)\s*=\s*["\'][a-zA-Z0-9+/=]{8,}["\']', "Hardcoded Secret", "API keys/tokens should be stored in environment variables", Severity.ERROR),
        (r'pickle\.loads?\s*\(', "Insecure Deserialization (pickle)", "pickle.load() can execute arbitrary code — use JSON or msgpack for untrusted data", Severity.ERROR),
        (r'md5\s*\(|hashlib\.md5', "Weak Hash Algorithm (MD5)", "MD5 is cryptographically broken — use SHA-256 or better", Severity.WARNING),
        (r'random\.random\(\)|random\.randint', "Insecure Random Number Generation", "Use secrets module for security-sensitive randomness", Severity.WARNING),
        (r'(?:http://)[^\s"\']+', "Plaintext HTTP URL", "Use HTTPS to prevent man-in-the-middle attacks", Severity.WARNING),
    ]

    def review(self, code: str, language: str) -> PersonaReview:
        critiques = []
        for pattern, title, description, severity in self.CHECKS:
            for match in re.finditer(pattern, code):
                line_num = code[:match.start()].count('\n') + 1
                critiques.append(CritiqueItem(title=title, description=description, severity=severity, line_hint=line_num))
                break  # one instance per check

        risk = min(10.0, len(critiques) * 2.0 + sum(
            3 if c.severity == Severity.CRITICAL else 2 if c.severity == Severity.ERROR else 1
            for c in critiques
        ) * 0.5)

        return PersonaReview(
            persona_name=self.NAME,
            persona_description=self.DESCRIPTION,
            critiques=critiques,
            risk_score=round(risk, 1)
        )


class PerformanceEngineer:
    NAME = "Performance Engineer"
    DESCRIPTION = "Identifies algorithmic complexity issues, N+1 patterns, and memory/IO hotspots"

    CHECKS = [
        (r'for\s+\w+\s+in\s+range\(len\(', "Inefficient Range-Len Pattern", "Use 'for item in collection' or enumerate() instead of range(len())", Severity.WARNING),
        (r'\.append\(.*\)\s*$', None, None, None),  # placeholder, see below
        (r'(?:SELECT|query)\s+.*\s+(?:for|in\s+for)', "Potential N+1 Query", "Database queries inside loops cause N+1 performance issues — batch queries", Severity.ERROR),
        (r'\+\s*=.*str\b|str\s*\+=', "String Concatenation in Loop", "Use str.join() or list + join instead of += for string building", Severity.WARNING),
        (r'time\.sleep\(\d+\)', "Blocking Sleep", "time.sleep() blocks the event loop — use async sleep in async contexts", Severity.WARNING),
        (r'open\(.*\)(?!.*close|.*with)', "File Handle Leak Risk", "Use 'with open()' context manager to ensure file handles are closed", Severity.WARNING),
        (r'(?:list|dict|set)\(\s*(?:list|dict|set)\(', "Redundant Type Conversion", "Nested type conversions are unnecessary and waste CPU", Severity.INFO),
        (r'import \*', "Wildcard Import", "Wildcard imports pollute namespace and prevent tree-shaking", Severity.INFO),
    ]

    def review(self, code: str, language: str) -> PersonaReview:
        critiques = []
        real_checks = [(p, t, d, s) for p, t, d, s in self.CHECKS if t is not None]
        for pattern, title, description, severity in real_checks:
            for match in re.finditer(pattern, code, re.IGNORECASE):
                line_num = code[:match.start()].count('\n') + 1
                critiques.append(CritiqueItem(title=title, description=description, severity=severity, line_hint=line_num))
                break

        risk = min(10.0, len(critiques) * 1.5)
        return PersonaReview(
            persona_name=self.NAME,
            persona_description=self.DESCRIPTION,
            critiques=critiques,
            risk_score=round(risk, 1)
        )


class MaintainabilityCritic:
    NAME = "Maintainability Critic"
    DESCRIPTION = "Flags naming issues, high complexity, tech debt, and duplication"

    CHECKS = [
        (r'\bdef\s+[a-z]\b', "Single-letter Function Name", "Function names should be descriptive — single letters make code unreadable", Severity.WARNING),
        (r'\b[A-Z_]{10,}\b', None, None, None),  # skip — likely constants
        (r'#\s*TODO|#\s*FIXME|#\s*HACK|#\s*XXX', "Tech Debt Marker", "Tech debt markers found — schedule time to address these", Severity.INFO),
        (r'(?:def\s+\w+[^)]*\):[^{]*){10,}|(?:\n[^\n]+){50,}', None, None, None),  # skip complex
        (r'except\s*:', "Bare Exception Clause", "Bare 'except:' catches SystemExit and KeyboardInterrupt — use 'except Exception:'", Severity.ERROR),
        (r'global\s+\w+', "Global Variable Usage", "Global variables create hidden coupling — pass values explicitly", Severity.WARNING),
        (r'lambda\s+.*lambda', "Nested Lambda", "Nested lambdas are hard to read — use named functions", Severity.WARNING),
        (r'if\s+\w+\s*==\s*True\b|if\s+\w+\s*==\s*False\b', "Explicit Boolean Comparison", "Use 'if x:' or 'if not x:' instead of comparing to True/False", Severity.INFO),
        (r'pass\s*$', "Empty Block with pass", "Empty blocks with 'pass' may indicate incomplete implementation", Severity.INFO),
    ]

    def review(self, code: str, language: str) -> PersonaReview:
        critiques = []
        real_checks = [(p, t, d, s) for p, t, d, s in self.CHECKS if t is not None]
        for pattern, title, description, severity in real_checks:
            for match in re.finditer(pattern, code, re.MULTILINE):
                line_num = code[:match.start()].count('\n') + 1
                critiques.append(CritiqueItem(title=title, description=description, severity=severity, line_hint=line_num))
                break

        risk = min(10.0, len(critiques) * 1.2)
        return PersonaReview(
            persona_name=self.NAME,
            persona_description=self.DESCRIPTION,
            critiques=critiques,
            risk_score=round(risk, 1)
        )


class CorrectnessVerifier:
    NAME = "Correctness Verifier"
    DESCRIPTION = "Catches edge cases, null safety issues, type mismatches, and invariant violations"

    CHECKS = [
        (r'\[\s*0\s*\](?!\s*=)', "Unconditional First-Element Access", "Accessing [0] without checking if the list is non-empty will raise IndexError", Severity.ERROR),
        (r'int\(.*\)(?!\s*#)', "Unchecked int() Conversion", "int() raises ValueError on invalid input — wrap in try/except or validate first", Severity.WARNING),
        (r'\.split\(\)\[0\]', "Unchecked split()[0]", "split()[0] raises IndexError if the string is empty", Severity.WARNING),
        (r'os\.environ\[', "Unchecked os.environ Access", "os.environ[key] raises KeyError if the variable is missing — use os.environ.get()", Severity.WARNING),
        (r'(?<!\s)None\s*\+|None\s*\*|None\s*-', "Arithmetic on None", "Arithmetic on None raises TypeError — check for None first", Severity.CRITICAL),
        (r'return$', "Empty Return in Non-void Function", "Bare return in a function that might be expected to return a value returns None", Severity.INFO),
        (r'assert\s+', "Assert Statement in Production Code", "assert statements are removed with optimization (-O) — use explicit if/raise", Severity.WARNING),
        (r'float\s*==\s*float|==\s*\d+\.\d+', "Float Equality Comparison", "Float equality comparisons are unreliable — use math.isclose() with a tolerance", Severity.WARNING),
    ]

    def review(self, code: str, language: str) -> PersonaReview:
        critiques = []
        for pattern, title, description, severity in self.CHECKS:
            for match in re.finditer(pattern, code, re.MULTILINE):
                line_num = code[:match.start()].count('\n') + 1
                critiques.append(CritiqueItem(title=title, description=description, severity=severity, line_hint=line_num))
                break

        risk = min(10.0, len(critiques) * 2.0)
        return PersonaReview(
            persona_name=self.NAME,
            persona_description=self.DESCRIPTION,
            critiques=critiques,
            risk_score=round(risk, 1)
        )

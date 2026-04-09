"""
Script to add slowapi rate limiting to FastAPI services.
Run from the repository root: python scripts/add_rate_limiting.py
"""
import re
import sys

SLOWAPI_IMPORTS = (
    "from starlette.requests import Request\n"
    "from slowapi import Limiter, _rate_limit_exceeded_handler\n"
    "from slowapi.util import get_remote_address\n"
    "from slowapi.errors import RateLimitExceeded\n"
)

LIMITER_SETUP = (
    "\nlimiter = Limiter(key_func=get_remote_address)\n"
    "app.state.limiter = limiter\n"
    "app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)\n"
)

SERVICES = [
    "analytics-service",
    "award-service",
    "code-completion-service",
    "enterprise-data-service",
    "execution-trace-service",
    "federation-service",
    "knowledge-service",
    "memory-service",
    "messaging-bridge-service",
    "org-intelligence-service",
    "persona-council-service",
    "plugin-registry-service",
    "pr-review-service",
    "semantic-search-service",
]

# Services where existing pydantic param is named "request"
# Maps route function name -> body param to rename (old_name, new_name)
PARAM_RENAMES = {
    "execution-trace-service": {
        "trace_python": ("request", "req"),
        "trace_js": ("request", "req"),
    },
    "knowledge-service": {
        "embed": ("request", "req"),
        "search": ("request", "req"),
    },
}


def add_rate_limiting(svc: str, content: str) -> str:
    if "from slowapi" in content:
        print(f"  {svc}: already has slowapi, skipping")
        return content

    # 1. Insert slowapi imports just before "app = FastAPI("
    # Find "app = FastAPI(" line start
    match = re.search(r'\napp = FastAPI\(', content)
    if match:
        insert_pos = match.start() + 1  # after the \n
        content = content[:insert_pos] + SLOWAPI_IMPORTS + content[insert_pos:]
    else:
        # Fallback: insert before first blank line before app
        content = SLOWAPI_IMPORTS + content

    # 2. Add limiter setup after "app = FastAPI(...)\n"
    # Handle both single-line and multi-line app = FastAPI(...)
    # Find the closing paren of app = FastAPI(...)
    app_match = re.search(r'app = FastAPI\(', content)
    if app_match:
        # Find the matching closing paren
        start = app_match.end() - 1  # position of opening (
        depth = 0
        i = start
        while i < len(content):
            if content[i] == '(':
                depth += 1
            elif content[i] == ')':
                depth -= 1
                if depth == 0:
                    # Found closing )
                    # Move to end of line
                    line_end = content.index('\n', i) + 1
                    content = content[:line_end] + LIMITER_SETUP + content[line_end:]
                    break
            i += 1

    # 3. Add @limiter.limit("60/minute") before each @app. route decorator
    content = re.sub(
        r'(@app\.(get|post|delete|put|patch)\()',
        r'@limiter.limit("60/minute")\n\1',
        content
    )

    # 4. Add request: Request to route function signatures
    # Strategy: Process line by line, tracking state
    renames = PARAM_RENAMES.get(svc, {})
    lines = content.split('\n')
    new_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Detect start of route handler: @limiter.limit line
        if '@limiter.limit(' in line and '@app.' not in line:
            new_lines.append(line)
            i += 1
            # Consume @app.XXX line(s)
            while i < len(lines) and '@app.' in lines[i]:
                new_lines.append(lines[i])
                i += 1
            # Consume any response_model or other decorator lines until def
            while i < len(lines):
                stripped = lines[i].strip()
                if stripped.startswith('async def ') or stripped.startswith('def '):
                    break
                new_lines.append(lines[i])
                i += 1

            if i < len(lines):
                func_line = lines[i]
                # Extract function name and params
                func_match = re.match(r'^(\s*(?:async )?def )(\w+)(\()', func_line)
                if func_match:
                    prefix = func_match.group(1)
                    func_name = func_match.group(2)
                    after_open = func_line[func_match.end():]

                    # Check if signature is all on one line
                    if ')' in after_open:
                        # Single-line signature
                        close_pos = after_open.rindex(')')
                        params_str = after_open[:close_pos]
                        suffix = after_open[close_pos:]  # ") -> ... :" or "):"

                        # Handle param rename if needed
                        rename = renames.get(func_name)
                        if rename:
                            old_name, new_name = rename
                            # Rename in signature
                            params_str = re.sub(
                                rf'\b{old_name}\b(?=\s*:)',
                                new_name,
                                params_str,
                                count=1
                            )

                        if not params_str.strip():
                            new_func_line = prefix + func_name + '(request: Request' + suffix
                        elif params_str.strip().startswith('request: Request'):
                            new_func_line = func_line  # already has it
                        else:
                            new_func_line = prefix + func_name + '(request: Request, ' + params_str + suffix
                        new_lines.append(new_func_line)
                    else:
                        # Multi-line signature: opens on this line with just (
                        # Check for rename
                        rename = renames.get(func_name)
                        new_lines.append(prefix + func_name + '(request: Request,')
                        i += 1
                        # Continue collecting param lines
                        while i < len(lines):
                            param_line = lines[i]
                            if rename:
                                old_name, new_name = rename
                                param_line = re.sub(
                                    rf'\b{old_name}\b(?=\s*:)',
                                    new_name,
                                    param_line,
                                    count=1
                                )
                            new_lines.append(param_line)
                            if ')' in param_line:
                                i += 1
                                break
                            i += 1
                        continue
                else:
                    new_lines.append(func_line)
                i += 1

            # Now handle body renames for renamed params
            if renames:
                # Look ahead: for lines in the function body, rename "old_name." -> "new_name."
                # We'll do this in a post-processing step
                pass
        else:
            new_lines.append(line)
            i += 1

    content = '\n'.join(new_lines)

    # 5. Post-process: rename body param uses for renamed routes
    if renames:
        for func_name, (old_name, new_name) in renames.items():
            # Replace "old_name." in function bodies - be careful not to rename
            # the "request: Request" we just added
            # Replace "request." (when it refers to pydantic model) -> "req."
            # This is safe because "request." only appears in the function body
            # after we've already renamed the param signature
            content = content.replace(f'{old_name}.', f'{new_name}.', )

    return content


def main():
    import os
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for svc in SERVICES:
        path = os.path.join(base, 'services', svc, 'main.py')
        if not os.path.exists(path):
            print(f"SKIP {svc}: {path} not found")
            continue

        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = add_rate_limiting(svc, content)

        if new_content != content:
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(new_content)
            print(f"  {svc}: updated")
        else:
            print(f"  {svc}: no changes needed")


if __name__ == '__main__':
    main()

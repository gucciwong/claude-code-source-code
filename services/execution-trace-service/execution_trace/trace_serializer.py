import xml.sax.saxutils as saxutils


class TraceSerializer:
    def to_annotated_source(self, source_code: str, trace_lines: list[dict], language: str = "python") -> str:
        """
        Insert inline comments after each traced line.

        For each event in trace_lines with a 'line' number, find that line in
        source_code and append a comment showing variable values.

        Example:
          Source line 3: x = 5
          Trace event: {"line": 3, "vars": {"x": 5}}
          Output line 3: x = 5  # trace: x=5
        """
        comment_char = "//" if language == "javascript" else "#"
        lines = source_code.split("\n")

        for event in trace_lines:
            lineno = event.get("line")
            if lineno is None:
                continue
            idx = lineno - 1  # convert to 0-based
            if idx < 0 or idx >= len(lines):
                continue

            parts = []
            if "call" in event:
                parts.append(f"call={event['call']}()")
                if "duration_ms" in event:
                    parts.append(f"duration={event['duration_ms']}ms")
            elif "vars" in event:
                for k, v in event["vars"].items():
                    parts.append(f"{k}={v}")

            if parts:
                lines[idx] += f"  {comment_char} trace: {', '.join(parts)}"

        return "\n".join(lines)

    def to_xml_context(self, language: str, source_code: str, trace_lines: list[dict], error: str | None) -> str:
        """
        Build <trace_context lang="python"> ... </trace_context> XML block.
        Includes the annotated source and error if any.
        """
        annotated = self.to_annotated_source(source_code, trace_lines, language)
        error_block = ""
        if error:
            escaped_error = saxutils.escape(error)
            error_block = f"\n  <error>{escaped_error}</error>"

        return (
            f'<trace_context lang="{language}">\n'
            f"  <source><![CDATA[{annotated}]]></source>"
            f"{error_block}\n"
            f"</trace_context>"
        )

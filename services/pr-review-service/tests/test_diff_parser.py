import pytest
from review.diff_parser import GitDiffParser


@pytest.fixture
def parser():
    return GitDiffParser()


SIMPLE_DIFF = """\
diff --git a/src/auth.py b/src/auth.py
index 1234..5678 100644
--- a/src/auth.py
+++ b/src/auth.py
@@ -10,6 +10,9 @@ class Auth:
 def login(self):
+    password = "hunter2"
+    print("Logging in...")
+    # TODO: add 2FA
     return True
"""

TWO_FILE_DIFF = """\
diff --git a/foo.py b/foo.py
index 0000..1111 100644
--- a/foo.py
+++ b/foo.py
@@ -1,3 +1,4 @@
+import os
 x = 1
diff --git a/bar.py b/bar.py
index 2222..3333 100644
--- a/bar.py
+++ b/bar.py
@@ -1,3 +1,2 @@
-old_line
+new_line
"""

NEW_FILE_DIFF = """\
diff --git a/newfile.py b/newfile.py
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/newfile.py
@@ -0,0 +1,3 @@
+def hello():
+    pass
"""


def test_parse_empty_returns_empty_parsed_diff(parser):
    result = parser.parse("")
    assert result.files == []
    assert result.total_additions == 0
    assert result.total_deletions == 0


def test_parse_one_file_per_diff_git_header(parser):
    result = parser.parse(SIMPLE_DIFF)
    assert len(result.files) == 1


def test_parse_two_files_two_diff_git_headers(parser):
    result = parser.parse(TWO_FILE_DIFF)
    assert len(result.files) == 2


def test_parse_counts_additions(parser):
    result = parser.parse(SIMPLE_DIFF)
    assert result.files[0].additions == 3


def test_parse_counts_deletions(parser):
    result = parser.parse(TWO_FILE_DIFF)
    bar_file = next(f for f in result.files if "bar" in f.file_path)
    assert bar_file.deletions == 1


def test_parse_extracts_file_path_from_plus_plus_plus(parser):
    result = parser.parse(SIMPLE_DIFF)
    assert result.files[0].file_path == "src/auth.py"


def test_parse_sets_is_new_file_true(parser):
    result = parser.parse(NEW_FILE_DIFF)
    assert result.files[0].is_new_file is True


def test_parse_sets_total_additions_and_deletions_as_sums(parser):
    result = parser.parse(TWO_FILE_DIFF)
    # foo.py: +1 addition, bar.py: +1 addition / -1 deletion
    assert result.total_additions == 2
    assert result.total_deletions == 1

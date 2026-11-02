"""Optional macOS integration test using the installed OpenCode and a fake pbcopy.

Run: python3 tests/tui-smoke.py
Uses synthetic history, inline CLI config, and no model requests.
"""
import fcntl
import json
import os
from pathlib import Path
import pty
import select
import signal
import struct
import tempfile
import termios
import time
from terminal_screen import screen_text

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / "tests/fixtures/tui-smoke"


with tempfile.TemporaryDirectory(prefix="copy-code-smoke-", dir=os.environ.get("TMPDIR")) as directory:
    output = Path(directory) / "clipboard"
    failure = Path(str(output) + ".fail")
    failure.touch()
    pid, terminal = pty.fork()
    if pid == 0:
        os.chdir(ROOT)
        os.environ.update({
            "TERM": "xterm-256color",
            "PATH": str(FIXTURE) + os.pathsep + os.environ["PATH"],
            "COPY_CODE_SMOKE_OUTPUT": str(output),
            "OPENCODE_CLI_CONFIG_CONTENT": json.dumps({
                "plugins": [str(FIXTURE)], "animations": False, "highlights": False, "mouse": True,
            }),
        })
        os.execvp("opencode", ["opencode"])

    fcntl.ioctl(terminal, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 120, 0, 0))
    transcript = b""
    width = 120

    def expect(label, text, keys=b"", timeout=20):
        global transcript
        if keys:
            os.write(terminal, keys)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            ready, _, _ = select.select([terminal], [], [], 0.2)
            if not ready:
                continue
            chunk = os.read(terminal, 65536)
            if not chunk:
                break
            transcript += chunk
            if text in screen_text(transcript, width):
                # Finish this frame before sending the next key. OpenTUI writes
                # incremental updates, not a full screen for each interaction.
                while select.select([terminal], [], [], 0.15)[0]:
                    transcript += os.read(terminal, 65536)
                print("PASS", label)
                return screen_text(transcript, width)
        raise AssertionError(f"{label}: missing {text!r}\n{screen_text(transcript, width)}")

    try:
        initial = expect("picker and five-line preview render", "5 │ line5")
        rows = initial.splitlines()
        table_row = next(i for i, row in enumerate(rows) if "Language" in row)
        preview_row = next(i for i, row in enumerate(rows) if "Preview · first" in row)
        assert table_row == preview_row, "wide preview must be beside the list"
        assert rows[preview_row].index("Preview") > rows[table_row].index("Language")
        code_rows = [row for row in rows if "turn  1" in row]
        assert len(code_rows) == 2
        assert len({row.index(" lines") for row in code_rows}) == 1, "line counts must align"
        assert len({row.index("turn  1") for row in code_rows}) == 1, "turns must align"
        print("PASS side-by-side preview and aligned metadata columns")
        assert "First line" not in initial, "redundant first-line column must be absent"
        assert sum(row.count("const newest") for row in rows) == 1, "code belongs only in the preview"
        note_row = next(i for i, row in enumerate(rows) if "1 more line included when copying" in row)
        assert note_row > next(i for i, row in enumerate(rows) if "5 │ line5" in row)
        assert "Cancel" in rows[note_row], "copy note belongs in the footer, beside the controls"
        print("PASS simplified table and bottom-aligned copy note")
        python_row = next(i for i, row in enumerate(rows) if "python" in row and "turn  1" in row)
        x = rows[python_row].index("python") + 1
        y = python_row + 1
        click = f"\x1b[<0;{x};{y}M\x1b[<0;{x};{y}m".encode()
        expect("clicking a row selects it", "1 │ print('older')", click)
        expect("keyboard navigation works after clicking", "1 │ const newest", b"\x1b[A")
        expect("filter with no results", "No matching blocks.", b"zzzz")
        expect("backspace restores results", "const newest", b"\x7f\x7f\x7f\x7f")
        expect("down selects older code", "1 │ print('older')", b"\x1b[B")
        expect("up selects newest code", "1 │ const newest", b"\x1b[A")
        expect("failed copy keeps picker open", "fixture clipboard denied", b"\r")
        failure.unlink()
        filtered = expect("filter still works after failure", "print('older')", b"python")
        rows = filtered.splitlines()
        footer_row = next(i for i, row in enumerate(rows) if " Enter " in row and " Cancel" in row)
        x = rows[footer_row].index(" Enter ") + 2
        y = footer_row + 1
        click = f"\x1b[<0;{x};{y}M\x1b[<0;{x};{y}m".encode()
        expect("clicking Copy retries successfully", "Code copied", click)
        assert output.read_bytes() == b"print('older')\n", "raw copied contents differ"
        print("PASS exact raw code copied to test double, not the system clipboard")
        expect("slash alias is registered", "Preview and copy", b"/cc")
        expect("slash alias reopens picker", "5 │ line5", b"\r")
        width = 80
        transcript = b""
        fcntl.ioctl(terminal, termios.TIOCSWINSZ, struct.pack("HHHH", 40, width, 0, 0))
        os.kill(pid, signal.SIGWINCH)
        narrow = expect("preview survives terminal resize", "5 │ line5")
        rows = narrow.splitlines()
        table_row = next(i for i, row in enumerate(rows) if "Language" in row)
        preview_row = next(i for i, row in enumerate(rows) if "Preview · first" in row)
        assert preview_row > table_row, "narrow preview must stack below the list"
        print("PASS narrow terminal stacks the preview below the list")
        expect("escape cancels picker", "Ask anything", b"\x1b")
        assert output.read_bytes() == b"print('older')\n", "cancel unexpectedly copied code"
    finally:
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        os.waitpid(pid, 0)
        os.close(terminal)

"""Small screen reader for OpenTUI's cursor-positioned output in smoke tests."""
import re
import unicodedata


def screen_text(data, width, height=40):
    cells = [[" "] * width for _ in range(height)]
    row = column = 0
    tokens = re.finditer(
        r"\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][\s\S]*?(?:\x07|\x1b\\)|"
        r"\x1bP[\s\S]*?\x1b\\|\x1b.|[^\x1b]+",
        data.decode("utf-8", "replace"),
    )
    for token in tokens:
        value = token.group()
        if value.startswith("\x1b["):
            command = value[-1]
            parameters = value[2:-1]
            if parameters.startswith("?"):
                continue
            numbers = [int(part or 0) for part in parameters.split(";")] if re.fullmatch(r"[\d;]*", parameters) else [0]
            amount = numbers[0] or 1
            if command in ("H", "f"):
                row = (numbers[0] or 1) - 1
                column = ((numbers[1] if len(numbers) > 1 else 1) or 1) - 1
            elif command == "G": column = amount - 1
            elif command == "d": row = amount - 1
            elif command == "A": row -= amount
            elif command == "B": row += amount
            elif command == "C": column += amount
            elif command == "D": column -= amount
            elif command == "J" and numbers[0] in (2, 3):
                cells = [[" "] * width for _ in range(height)]
            elif command == "K" and 0 <= row < height:
                start, end = (0, width) if numbers[0] == 2 else ((0, column + 1) if numbers[0] == 1 else (column, width))
                for x in range(max(0, start), min(width, end)): cells[row][x] = " "
        elif not value.startswith("\x1b"):
            for character in value:
                if character == "\r": column = 0
                elif character == "\n": row += 1
                elif character == "\b": column = max(0, column - 1)
                elif character >= " " and not unicodedata.combining(character):
                    if 0 <= row < height and 0 <= column < width: cells[row][column] = character
                    column += 2 if unicodedata.east_asian_width(character) in ("W", "F") else 1
    return "\n".join("".join(line) for line in cells)

import glob
import json


if __name__ == '__main__':
    for file_path in glob.glob("pack-data\\**\\*.json", recursive=True):
        # replacement strings
        WINDOWS_LINE_ENDING = b'\r\n'
        UNIX_LINE_ENDING = b'\n'

        with open(file_path, 'rb') as open_file:
            content = open_file.read()

        # Windows ➡ Unix
        # content = content.replace(WINDOWS_LINE_ENDING, UNIX_LINE_ENDING)

        # Unix ➡ Windows
        content = content.replace(UNIX_LINE_ENDING, WINDOWS_LINE_ENDING)

        with open(file_path, 'wb') as open_file:
            open_file.write(content)
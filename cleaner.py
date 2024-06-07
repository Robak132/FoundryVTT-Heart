import glob
import json


def clean(dictionary):
    dictionary.pop("ownership", None)
    dictionary.pop("_stats", None)
    dictionary.pop("folder", None)
    dictionary.pop("sort", None)
    dictionary.pop("prototypeToken", None)


def iterative_clean(dictionary):
    assert type(dictionary) is dict
    clean(dictionary)
    for item in dictionary.values():
        list_iterative_clean(item)


def list_iterative_clean(item):
    if type(item) is dict:
        iterative_clean(item)
    elif type(item) is list:
        for sub_item in item:
            list_iterative_clean(sub_item)


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

    for file in glob.glob("pack-data\\**\\*.json", recursive=True):
        j_file = json.load(open(file, 'r', encoding="utf-8"))
        iterative_clean(j_file)
        with open(file, 'w+', encoding="utf-8") as f:
            json.dump(j_file, f, indent=2, ensure_ascii=False)
            f.write('\n')

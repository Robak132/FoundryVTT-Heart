import glob
import json
import re
from collections.abc import MutableMapping

def flatten_dict(d: MutableMapping, parent_key: str = '', sep: str ='.') -> MutableMapping:
    items = []
    for k, v in d.items():
        new_key = parent_key + sep + k if parent_key else k
        if isinstance(v, MutableMapping):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def replacer(searchedHeader, codeHeader, value):
    description = value["description"]
    result = re.search(f"<p><b>{searchedHeader}:</b> (.*)</p>(\n)*", description)
    if result:
        value["description"] = description.replace(result.group(0), "")
        value[codeHeader] = result.group(1)


def unflatten_dict(d):
    result = {}
    for key, value in d.items():
        parts = key.split('.')
        sub_dict = result
        for part in parts[:-1]:
            if part not in sub_dict:
                sub_dict[part] = {}
            sub_dict = sub_dict[part]
        sub_dict[parts[-1]] = value
    return result


if __name__ == '__main__':
    for name in glob.glob("pack-data/actors/*"):
        file = json.load(open(name, "r", encoding="utf-8"))
        key = ".".join(file["name"].split(".")[:-1])
        file["system"]["resources"] = f"{key}.resources.description"
        file["system"]["equipment"] = f"{key}.equipment.description"
        with open(name, "w", encoding="utf-8") as f:
            json.dump(file, f, ensure_ascii=False, indent=2)
            f.write("\n")

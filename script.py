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
    en = json.load(open('static/lang/en.json', 'r', encoding="utf-8"))
    for key, value in en["heart"]["actor"].items():
        if "resources.description" in value.keys():
            value["resources"]["description"] = value["resources.description"]
            value.pop("resources.description")
        if "equipment.description" in value.keys():
            value["equipment"]["description"] = value["equipment.description"]
            value.pop("equipment.description")

    json.dump(en, open(f'static/lang/en.json', 'w+', encoding="utf-8"), ensure_ascii=False, indent=4)

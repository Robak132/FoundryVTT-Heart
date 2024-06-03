import csv
import json
import random
import string


def random_id(length=16) -> str:
    return str(''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(length)))


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


def make_entry(title, key, value) -> str:
    return f"<p><b>{title}:</b> {value[key]}</p>" if key in value.keys() else ""


if __name__ == '__main__':
    random.seed(42)

    headers = ['name', 'description', 'names', 'descriptors', 'motivation',
               'difficulty', 'resistanceDesc', 'protectionDesc',
               'resources', 'equipment', 'special', 'domains']
    data = []

    with open('actors.csv', newline='', encoding="utf-8") as csvfile:
        spamreader = csv.reader(csvfile, delimiter='|')
        for row in spamreader:
            data.append(row)

    full_lang = {}

    for i in range(len(data)):
        id = random_id()
        name = data[i][0]
        name = name.replace(" ", "_").lower().strip()

        for j in range(len(headers)):
            head = headers[j]
            value = data[i][j]

            if head == "descriptors":
                result = "".join([f"<li>{entry}</li>" for entry in value.split("; ")])
                value = f"<ul>{result}</ul>"

            if head == "name":
                value = value.title()

            full_value = value
            if value != "":
                try:
                    value = int(value)
                    if head == "resistanceDesc":
                        continue
                    elif head == "protectionDesc":
                        continue
                except ValueError:
                    full_lang[f"actor.{name.replace("-", "_")}.{head}"] = full_value

    full_lang = unflatten_dict(full_lang)
    en = json.load(open(f'static/lang/en.json', 'r', encoding="utf-8"))
    for key, value in full_lang["actor"].items():
        value["description"] = (f"<p>{value['description']}</p>"
                                f"{make_entry("Names", "names", value)}"
                                f"{make_entry("Resistance", "resistanceDesc", value)}"
                                f"{make_entry("Protection", "protectionDesc", value)}"
                                f"{make_entry("Resources", "resources", value)}"
                                f"{make_entry("Equipment", "equipment", value)}"
                                f"{make_entry("Domains", "domains", value)}")
        value.pop("names", None)
        value.pop("resistanceDesc", None)
        value.pop("protectionDesc", None)
        if "resources" in en["heart"]["actor"][f"{key}"].keys():
            value["resources"] = en["heart"]["actor"][f"{key}"]["resources"]
        if "equipment" in en["heart"]["actor"][f"{key}"].keys():
            value["equipment"] = en["heart"]["actor"][f"{key}"]["equipment"]
        value.pop("domains", None)

    en["heart"].update(unflatten_dict(full_lang))
    json.dump(en, open(f'static/lang/en.json', 'w+', encoding="utf-8"), ensure_ascii=False, indent=4)

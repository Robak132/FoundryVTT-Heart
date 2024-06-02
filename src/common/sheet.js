import sheetHTML from './sheet.hbs';

export default function HeartSheetMixin(baseClass) {
    return class extends baseClass {
        get template() {
            return sheetHTML.path;
        }

        get default_img() {
            return CONST.DEFAULT_TOKEN;
        }

        get img() {
            return 'systems/heart/assets/battle-gear.svg';
        }

        get title() {
            const key = 'heart.' + super.title;
            const resp = game.i18n.localize(key);
            if (resp == key) {
                return super.title;
            } else {
                return resp;
            }
        }

        getData() {
            const data = super.getData();
            // Check for data type and assign default img where appropriate
            if (data.actor && (data.actor.img === this.default_img)) {
                data.actor.img = this.img;
            }
            else if (data.item) {
                data.item.img = this.img;
            }
            else {
                data.img = this.img;
            }
            return data;
        }
    };
}

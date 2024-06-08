import sheetHTML from './sheet.hbs';
import templateJSON from './template.json';
import HeartItemSheet from "../base/sheet";

import './sheet.sass';

const data = Object.freeze({
    type: Object.keys(templateJSON.Item)[0],
    img: 'systems/heart/assets/ore.svg',
    template: sheetHTML.path,
});

export default class extends HeartItemSheet {
    static get type() { return data.type; }

    get template() {
        return data.template || sheetHTML.path;
    }

    get img() {
        return data.img;
    }

    get id() {
        return `${this.constructor.name}-${this.document.uuid.replace(/[.@]/g, "-")}`;
    }

    getData() {
        return super.getData();
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.ordered-checkable-box:not(.checked)').click(ev => {
            ev.preventDefault();
            const element = ev.currentTarget;
            const parent = element.parentElement;
            const target = parent.dataset.target;
            const value = parent.dataset.value;

            let currentDomains = getProperty(this.item, target)
            if (!(currentDomains instanceof Array)) {
                currentDomains = [currentDomains]
            }
            currentDomains.push(value)
            let data = {}
            data[target] = currentDomains
            this.item.update(data)
        });

        html.find('.ordered-checkable-box.checked').click(ev => {
            ev.preventDefault();
            const element = ev.currentTarget;
            const parent = element.parentElement;
            const target = parent.dataset.target;
            const value = parent.dataset.value;

            let newDomains = getProperty(this.item, target).filter(e => e !== value)
            if (!(newDomains instanceof Array)) {
                newDomains = [newDomains]
            }
            let data = {}
            data[target] = newDomains
            this.item.update(data)
        });
    }
}

export {
    data
}
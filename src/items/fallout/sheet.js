import sheetHTML from './sheet.hbs';
import templateJSON from './template.json';
import HeartItemSheet from "../base/sheet";

import './sheet.sass';

const fallout_levels = ['minor', 'major', 'critical']

function initialise() {
    game.heart.fallout_levels = fallout_levels;
}

const data = Object.freeze({
    type: Object.keys(templateJSON.Item)[0],
    img: 'systems/heart/assets/fallout-shelter.svg',
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

    get resistanceTypes() {
        return this.system.resistances;
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

            let currentResistances = getProperty(this.item, target)
            if (!(currentResistances instanceof Array)) {
                currentResistances = [currentResistances]
            }
            currentResistances.push(value)
            let data = {}
            data[target] = currentResistances
            this.item.update(data)
        });

        html.find('.ordered-checkable-box.checked').click(ev => {
            ev.preventDefault();
            const element = ev.currentTarget;
            const parent = element.parentElement;
            const target = parent.dataset.target;
            const value = parent.dataset.value;

            let newResistances = getProperty(this.item, target).filter(e => e !== value)
            if (!(newResistances instanceof Array)) {
                newResistances = [newResistances]
            }
            let data = {}
            data[target] = newResistances
            this.item.update(data)
        });
    }
}

export {
    data,
    initialise
}
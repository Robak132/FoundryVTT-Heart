import applicationHTML from './application.hbs';
import HeartApplication from '../base/application';

export default class RequirementApplication extends HeartApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: applicationHTML.path,
        });
    }

    static get formType() {
        return 'requirement'
    }

    get title() {
        return game.i18n.localize(`heart.${this.options.type}.title`);
    }

    static build({requirements, callback, type}) {
        new this({}, {
            type,
            requirements,
            callback
        }).render(this);
    }
    
    activateListeners(html) {
        super.activateListeners(html);
        const form = html.get(0);

        html.find('[data-action=submit]').click(async ev => {
            const data = new FormData(form);

            const output = Object.entries(this.options.requirements).reduce((map, [key, requirement]) => {
                if(requirement.isCheckbox) {
                    const value = data.get(key);
                    map[key] = value !== null;
                } else if(requirement.isMany) {
                    map[key] = data.getAll(key);
                } else {
                    map[key] = data.get(key);
                }

                return map;
            }, {});

            this.options.callback(output);
            this.close()
        });
    }
}
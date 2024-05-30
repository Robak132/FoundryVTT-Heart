import HeartItemSheet from './base/sheet';
import sheetModules from './**/sheet.js';
import proxies from './*/proxy.js';

class HeartItem extends Item {
    constructor(data = {}, context = {}) {
        super(data, context);

        Object.defineProperty(this, "parentItem", {
            value: context.parentItem || null,
            writable: false
        });

        this.children;
    }

    get proxy() {
        if (this._proxy === undefined && this.constructor.proxies[this.type] !== undefined) {
            this._proxy = this.constructor.proxies[this.type](this);
        }

        return this._proxy;
    }

    get isChild() {
        return this.parentItem !== null;
    }

    get heart_effects() {
        if (this.proxy !== undefined && this.proxy.effects !== undefined) {
            const effects = new Collection(super.effects.entries());
            this.proxy.effects.forEach(effect => {
                effects.set(effect.id, effect);
            });
            return effects;
        } else {
            return super.effects;
        }
    }

    get uuid() {
        if (!this.isChild) {
            return super.uuid;
        } else {
            return this.parentItem.uuid + '.@' + super.uuid;
        }
    }

    get children() {
        if (this._children !== undefined)
            return this._children;

        if (this.system.children === undefined) {
            if (game.system.model.Item[this.type].children !== undefined) {
                return new Collection();
            } else {
                return
            }
        }

        const map = new Collection();
        Object.entries(this.system.children).forEach(([key, data]) => {
            let documentName = data.documentName;
            const child = new CONFIG[documentName ?? 'Item'].documentClass(data, {
                parentItem: this
            });

            map.set(key, child);
        });

        this._children = map;

        return map;
    }

    get childrenTypes() {
        return this.children.reduce((map, child) => {
            if (map[child.type] === undefined)
                map[child.type] = [];

            map[child.type].push(child);
            return map;
        }, {});
    }

    get isOwner() {
        if (!this.isChild) {
            return this.testUserPermission(game.user, "OWNER");
        }

        return this.parentItem.testUserPermission(game.user, "OWNER");
    }

    _onUpdate(data, options, userId) {
        // Refresh the "item.children" compendium and re-render any
        // documents when we update them
        super._onUpdate(data, options, userId);
        if(data.system?.children !== undefined) {
            
            this.refreshChildren();
        }
    }

    async update(data = {}, context = {}) {
        if (this.isChild) {
            await this.parentItem.updateChildren({ [`${this.id}`]: data }, context);
        } else {
            return await super.update(data, context);
        }
    }

    _addChild(data) {
        let class_;
        if (Item.TYPES.includes(data.type)) {
            class_ = CONFIG.Item.documentClass;
        } else {
            class_ = CONFIG.Actor.documentClass;
        }

        const child = new class_(data, {
            parentItem: this
        });

        const id = child.id;
        this.children.set(id, child);
        return child;
    }

    chatDataSetup(content, modeOverride = false, isRoll = false, {forceWhisper, alias, flavor}={}) {
        let chatData = {
            user: game.user.id,
            rollMode: modeOverride || game.settings.get("core", "rollMode"),
            content: content
        };
        if (isRoll)
            chatData.sound = CONFIG.sounds.dice;

        if (["gmroll", "blindroll"].includes(chatData.rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
        if (chatData.rollMode === "blindroll") chatData["blind"] = true;
        else if (chatData.rollMode === "selfroll") chatData["whisper"] = [game.user.id];

        if (alias)
            chatData.speaker = {alias};
        if (flavor)
            chatData.flavor = flavor;

        if (forceWhisper) { // Final force !
            chatData["speaker"] = ChatMessage.getSpeaker();
            chatData["whisper"] = ChatMessage.getWhisperRecipients(forceWhisper);
        }

        return chatData;
    }

    async post() {
        let postedItem = this.toObject();
        let chatData = duplicate(postedItem);

        // Pre-translate description to avoid issues with rendering
        chatData.system.description = localizeHeart(chatData.system.description)

        renderTemplate('heart:templates/post.html', chatData).then(html => {
            let chatOptions = this.chatDataSetup(html);

            // Setup drag and drop data
            chatOptions["flags.transfer"] = JSON.stringify(
                {
                    type: "postedItem",
                    payload: postedItem,
                });
            chatOptions["flags.recreationData"] = chatData;
            ChatMessage.create(chatOptions);
        });
    }


    async addChildren(datas=[]) {
        const update = {};
        datas.forEach(data => {
            const id = randomID();
            data._id = id;
            const child = this._addChild(data);
            const childData = child.toObject();
            childData.documentName = data.documentName;
            update[child.id] = childData;
        });

        return this.update(flattenObject({'system.children': update}), {render: true});
    }

    async refreshChildren() {
        if(this.system.children === undefined) return;
        Object.entries(this.system.children).forEach(([id, data]) => {
            if(this.children.has(id)) {
                const child = this.children.get(id);
                child.updateSource(this.system.children[child.id]);
                child.prepareData();

                if (child.children?.size ?? 0 >= 0) {
                    child.refreshChildren();
                }

                if (child.sheet.rendered)
                    child.sheet.render();
            } else {
                this._addChild(data);
            }
        });

        this.children.forEach(child => {
            if(this.system.children[child.id] === undefined) {
                this._deleteChild(child.id);
            }
        })

        if(this.sheet.rendered) {
            this.sheet.render();
        }
    }

    async updateChildren(data = {}, context = {}) {
        // why
        const ctx = { ...context} ; //, render: false };
        const updates = await this.update({ 'system.children': data }, ctx);
        if (updates === undefined) return;
        
        if(this.isEmbedded && this.parent.sheet.rendered)
            await this.parent.sheet.render(true);
            
        return updates;
    }

    async delete() {
        if (this.isChild) {
            if (this.sheet.rendered)
                await this.sheet.close()

            await this.parentItem.deleteChildren([this.id]);
        } else
            return super.delete();
    }

    _deleteChild(id) {
        const child = this.children.get(id)
        child.sheet.close();
        this.children.delete(id); 
    }
    async deleteChildren(ids) {
        if (this.system.children === undefined) return;

        const updates = {};
        ids.forEach(id => {
            this._deleteChild(id);
            updates[`system.children.-=${id}`] = null
        });

        return this.update(updates);
    }

    getEmbeddedDocument(embeddedName, embeddedId) {
        if (embeddedName.startsWith('@')) {
            if (this.system.children === undefined)
                return;
            return this.children.get(embeddedId);
        } else {
            return super.getEmbeddedDocument(embeddedName, embeddedId);
        }
    }

    get permission() {
        if (this.isChild) return this.parentItem.permission;
        return super.permission;
    }

    testUserPermission(user, permission, { exact = false } = {}) {
        if (this.isChild) return this.parentItem.testUserPermission(user, permission, { exact });
        return super.testUserPermission(user, permission, { exact });
    }
}

HeartItem.proxies = {};


function ItemSheetFactory(data) {
    const safe_data = Object.freeze({ ...data });
    const CustomHeartItemSheet = class extends HeartItemSheet {
        static get type() { return data.type; }

        get template() {
            return safe_data.template;
        }

        get img() {
            return safe_data.img;
        }

        /** @inheritdoc */
        get id() {
            return `${this.constructor.name}-${this.document.uuid.replace(/[\.@]/g, "-")}`;
        }
    };
    return CustomHeartItemSheet;
}

export function initialise() {
    console.log('heart | Assigning new Item documentClass');
    CONFIG.Item.documentClass = HeartItem;
    console.log('heart | Registering item sheets');
    Items.unregisterSheet('core', ItemSheet);
    sheetModules.forEach((module) => {

        const data = module.data;
        let Sheet;
        if (module.default !== undefined) {
            Sheet = module.default;
        } else if (data.sheet instanceof ItemSheet) {
            Sheet = data.sheet
        } else {
            Sheet = ItemSheetFactory(data);
        }

        const type = Sheet.type;

        console.log(`heart | -- Registering ${type} sheet`);
        if (game.heart.items === undefined) {
            game.heart.items = {}
        }

        if (game.heart.items[type] === undefined) {
            game.heart.items[type] = {}
        }

        game.heart.items[type].sheet = Sheet
        if (module.initialise) {
            module.initialise();
        }

        if (type === 'base') return;

        CONFIG.Item.typeLabels[type] = `heart.${type}.single`;
        Items.registerSheet('heart', Sheet, {
            types: [type],
            makeDefault: true,
            label: `heart.${type}.single`
        });
    });

    proxies.forEach(function (module) {
        Object.entries(module.default).forEach(([type, proxy]) => {
            HeartItem.proxies[type] = proxy;
        });
    });
}
import sheet_modules from './*/sheet.js';
import proxies from './*/proxy.js';

class HeartActor extends Actor {
    get proxy() {
        if(this._proxy === undefined && this.constructor.proxies[this.type] !== undefined) {
            this._proxy = this.constructor.proxies[this.type](this);
        }

        return this._proxy;
    }

    get heart_effects() {
        if(this.proxy !== undefined) {
            const effects = new Collection(super.effects.entries());
            this.proxy.effects.forEach(effect => {
                effects.set(effect.id, effect);
            });
            return effects;
        } else {
            return super.effects;
        }
    }

    chatDataSetup(content, modeOverride=false, isRoll = false, {forceWhisper, alias, flavor}={}) {
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

        await renderTemplate('heart:templates/post.hbs', chatData).then(html => {
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

    getEmbeddedDocument(embeddedName, embeddedId) {
        if(embeddedName.startsWith('@')) {
            if(this.system.children === undefined) 
            return;
        
            const child_data = this.system.children[embeddedId];
            if(child_data === undefined)
                return undefined;
            const documentName = embeddedName.slice(1) || child_data.documentName;
            return new CONFIG[documentName].documentClass(child_data, {
                parentItem: this
            });
        } else {
            return super.getEmbeddedDocument(embeddedName, embeddedId);
        }
    };
}

HeartActor.proxies = {};

export function initialise() {
    console.log('heart | Registering actor sheets');
    Actors.unregisterSheet('core', ActorSheet);

    sheet_modules.forEach(function(module) {
        const Sheet = module.default;
        const type = Sheet.type;

        if(game.heart.actors === undefined) {
            game.heart.actors = {}
        }

        if(game.heart.actors[type] === undefined) {
            game.heart.actors[type] = {}
        }
        
        CONFIG.Actor.typeLabels[type] = `heart.${type}.single`;

        game.heart.actors[type].sheet = Sheet

        if(type === 'base') return;

        Actors.registerSheet('heart', Sheet, {
            types: [type],
            makeDefault: true,
            label: `heart.${type}`
        });
    });

    CONFIG.Actor.documentClass = HeartActor;

    proxies.forEach(function(module) {
        Object.entries(module.default).forEach(([type, proxy]) => {
            HeartActor.proxies[type] = proxy;
        });
    });
}
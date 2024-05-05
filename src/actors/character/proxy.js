export default {
    'character': function Character(actor) {
        return new Proxy(actor, {
            get(actor, name, proxy) {
                if (name === 'totalStress') {
                    return Object.values(actor.system.resistances).reduce((sum, resistance) => {
                        return sum + resistance.value;
                    }, 0);
                }

                if (name === 'calling') {
                    const calling = actor.items.find(x => x.type === 'calling');
                    return calling;
                }

                if (name === 'class') {
                    const class_ = actor.items.find(x => x.type === 'class');
                    return class_;
                }

                if (name === 'ancestry') {
                    const ancestry = actor.items.find(x => x.type === 'ancestry');
                    return ancestry;
                }

                if (name === 'beats') {
                    function isActiveBeat(beat) {
                        return beat.type === "beat" && beat.system.active && !beat.system.complete
                    }
                    const beats = [];
                    const calling = actor.proxy.calling;
                    if (calling !== undefined) {
                        beats.push(...calling.children.filter(isActiveBeat))
                    }
                    beats.push(...actor.items.filter(isActiveBeat));
                    return beats;
                }

                if (name === 'abilities') {
                    function isAbility(item) {
                        return item.type === "ability" && item.system.active;
                    }
                    const abilities = [];
                    const calling = actor.proxy.calling;
                    if (calling !== undefined) {
                        abilities.push(...calling.children.filter(item => item.type === "ability"));
                    }

                    const class_ = actor.proxy.class;
                    if (class_ !== undefined) {
                        abilities.push(...class_.children.filter(isAbility));
                    }

                    abilities.push(...actor.items.filter(item => item.type === "ability"));

                    return abilities;
                }

                if (name === 'effects') {
                    return actor.items.reduce((o, item) => {
                        return o.concat(item.transferredEffects);
                    }, []);
                }

                if (name === 'resources') {
                    function isActiveResource(resource) {
                        const isActive = resource.system.active ?? true;
                        const isComplete = resource.system.complete ?? false;
                        return resource.type === "resource" && isActive && !isComplete;
                    }
                    const class_ = actor.proxy.class;
                    const resources = [];
                    if (class_ !== undefined) {
                        resources.push(...class_.children.filter(isActiveResource))
                    }
                    resources.push(...actor.items.filter(isActiveResource));
                    return resources;
                }

                if (name === 'equipment') {
                    function isActiveEquipment(equipment) {
                        const isActive = equipment.system.active ?? true;
                        const isComplete = equipment.system.complete ?? false;
                        return equipment.type === "equipment" && isActive && !isComplete;
                    }
                    const equipment = [];

                    const class_ = actor.proxy.class;
                    if (class_ !== undefined) {
                        equipment.push(...class_.children.filter(isActiveEquipment))
                    }

                    equipment.push(...actor.items.filter(isActiveEquipment));
                    return equipment;
                }

            }
        });
    }
}
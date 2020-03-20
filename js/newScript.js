async function getData() {
    return await fetch('js/data.json')
        .then(resp => resp.json());
}

(async function () {
    let data = await getData();
    localStorage.setItem('cruises', JSON.stringify(data));
})();


function getDeepKeys(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
        if (typeof obj[key] === "object") {
            var subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(subkeys.map(function (subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}

function getValueByPath(obj, path) {
    let value = obj;
    let path_mass = path.split('.');
    for (let i = 0; i < path_mass.length; i++) {
        if (path_mass[i] === "") {
            return undefined;
        }
        value = value[path_mass[i]];
    }
    return value;
}

class Directive {
    rendererState = null;

    constructor(element, config, component) {
        this.element = element;
        this.config = config;
        this.component = component;
    }

    checkUpdate() {
        return true;
    }

    render(newState) {
        if (this.checkUpdate(newState)) {
            this.applyState(newState);
            this.rendererState = newState;
        }
    }

    applyState(newState) {

    }
}

class TextDirective extends Directive {
    checkUpdate(newState) {
        if (this.config.includes('~')) {
            return this.element.textContent !== this.config.slice(1);
        } else if (Object.keys(newState).includes(this.config)) {
            return this.rendererState !== newState;
        }
    }

    applyState(newState) {
        if (this.config.includes('~')) {
            this.element.textContent = this.config.slice(1);
        } else {
            this.element.textContent = newState[this.config];
        }
    }
}

class AttrsDirective extends Directive {
    attributes = null;

    checkUpdate(newState) {
        this.attributes = JSON.parse(this.config);
        for (let attribute in this.attributes) {
            if (!this.element.hasAttribute(attribute) || !this.element.classList.contains(attribute)) {
                return true;
            }
        }

    }

    applyState(newState) {
        for (let attribute in this.attributes) {
            if (getDeepKeys(newState).includes(this.attributes[attribute])) {
				if(attribute === "class") {
					this.element.classList.add(getValueByPath(newState, this.attributes[attribute]))
				} else {
					this.element.setAttribute(attribute, getValueByPath(newState, this.attributes[attribute]));
				}
			} else {
                this.element.setAttribute(attribute, this.attributes[attribute]);
            }
        }
    }
}

class IfDirective extends Directive {
    checkUpdate(newState) {
    	if(getDeepKeys(newState).includes(this.config)){
			return !newState[this.config];
		} else {
    		return !eval(this.config);
		}
    }

    applyState(newState) {
        this.element.remove();
    }
}

class ListenersDirective extends Directive {
    listenersHasBeenAdded = false;

    checkUpdate(newState) {
        return !this.listenersHasBeenAdded;
    }

    applyState(newState) {

        let listeners = JSON.parse(this.config);
        for (let listener in listeners) {
            this.element.addEventListener(listener, (event) => {
                event.preventDefault();
                this.component[listeners[listener]](event);
            });
        }

        this.listenersHasBeenAdded = true;
    }
}

class ForDirective extends Directive {
    params = null;
    createdComponents = [];

    checkUpdate(newState) {
        this.params = JSON.parse(this.config);
        return this.rendererState !== newState[this.params.collection];
    }

    applyState(newState) {
        while (this.element.children.length > newState[this.params.collection].length) {
            this.element.lastElementChild.remove();
            this.createdComponents.pop();
        }

        newState[this.params.collection].forEach((item, index) => {
            let component = this.getComponent(index);
            component.state = item;

            if (component.template) {
                component.render();
            } else {
                this.element.append(component.render());
            }
        });
    }

    getComponent(index) {
        let component = this.createdComponents[index];
        if (component == null) {
            let componentClass = classRegistry.get(this.params.component);
            component = new componentClass();
            this.createdComponents.push(component);

        }
        return component;
    }
}

class PutDirective extends Directive {
    createdComponent = false;

    checkUpdate(newState) {
        return !this.createdComponent;
    }

    applyState(newState) {
        let componentClass = classRegistry.get(this.config);
        let component = new componentClass();
        this.element.append(component.render());
        this.createdComponent = true;
    }
}


class Component {
    state = {};
    directives = [];
    template = null;

    getTemplate(selector) {
        return document.querySelector(selector).content.cloneNode(true).firstElementChild;
    };

    render() {
        if (this.template) {
            this.directives.forEach(directive => {
                directive.render(this.state);
            })
        } else {
            this.template = this.getTemplate();

            let directivesTypes = ['text', 'attrs', 'if', 'listeners', 'for', 'put'];

            directivesTypes.forEach(directiveType => {
                let directiveElements = this.template.querySelectorAll(`[data-${directiveType}]`);
                directiveElements.forEach(directiveElement => {
                    let directiveClass = classRegistry.get(directiveType[0].toUpperCase() + directiveType.slice(1) + 'Directive');
                    let directive = new directiveClass(directiveElement, directiveElement.dataset[directiveType], this);
                    this.directives.push(directive);
                    directive.render(this.state);
                })
            });
        }
        return this.template;
    }
}

class AppComponent extends Component {
    state = {
        cruises: [],
		form: {

		}
    };

    getTemplate() {
        return super.getTemplate('#app_component');
    }

    remove() {
        backend.remove(this.state.id);
    }
}

class CruiseComponent extends Component {
    state = {};

    getTemplate() {
        return super.getTemplate('#cruise_component');
    }

    edit() {
		console.log('edit');
	}

    remove() {
        backend.remove(this.state.id);
    }

}

class FormComponent extends Component {
    state = {
        photo: ''
    };

    getTemplate() {
        return super.getTemplate('#form_component');
    }

    edit() {
		backend.edit(document.getElementById('photo').value,
			document.getElementById('name').value,
			document.getElementById('route').value,
			document.getElementById('time').value,
			document.getElementById('price').value,
			document.getElementById('old-price').value);
	}

    create() {
        backend.create(document.getElementById('photo').value,
            document.getElementById('name').value,
            document.getElementById('route').value,
            document.getElementById('time').value,
            document.getElementById('price').value,
            document.getElementById('old-price').value)
    }
}

class Backend {
    state = [];
    callbacks = [];

    constructor() {
        this.getAllData()
    }

    getAllData() {
        this.state = JSON.parse(localStorage.getItem('cruises'));
    }

    create(img, name, route, time, price, old_price) {
        this.state.push({
            "id": this.state[this.state.length - 1].id + 1,
            "tag_text": null,
            "category": null,
            "img": {
                "small": img,
                "normal": img
            },
            "name": name,
            "route": route,
            "time": time,
            "price": price,
            "old_price": old_price,
        });
        this.startCallbacks();
    }

    remove(id) {
        this.state.splice(this.state.findIndex(item => item.id === id), 1);
        this.startCallbacks();
    }

    edit(img, name, route, time, price, old_price) {

    	this.startCallbacks();
    }

    startCallbacks() {
        this.callbacks.forEach((callback) => {
            callback(this.state);
        })
    }

    addCallback(callback) {
        this.callbacks.push(callback)
    }
}


const backend = new Backend();

let classRegistry = {
    classRegister: {},
    get: function (className) {
        return this.classRegister[className];
    },

    add: function (className) {
        this.classRegister[className.name] = className;
    }
};


classRegistry.add(AppComponent);
classRegistry.add(CruiseComponent);
classRegistry.add(FormComponent);

classRegistry.add(TextDirective);
classRegistry.add(AttrsDirective);
classRegistry.add(IfDirective);
classRegistry.add(ListenersDirective);
classRegistry.add(ForDirective);
classRegistry.add(PutDirective);


const appComponent = new AppComponent();
appComponent.state.cruises = backend.state;
let app = document.getElementById('app');
app.append(appComponent.render());

backend.addCallback(function (data) {
    // appComponent.state.cruises = data;

    if (appComponent.template) {
        appComponent.render();
    } else {
        app.append(appComponent.render());
    }
});






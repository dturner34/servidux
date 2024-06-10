const { createStore } = require('redux');
const { composeWithDevTools } = require('redux-devtools-extension');

const PREFIX = '__servidux';
export const SERVIDUX_ORIGINAL_FN = `${PREFIX}_original_`;
export const SERVIDUX_STORE = `store`;
export const SERVIDUX_RESULTS = `${PREFIX}_results`;
export const SERVIDUX_IS_EXECUTING = `${PREFIX}_is_executing`;

function generateReducer(classInstance) {
    return (state = {...classInstance}, action) => {
        if (typeof classInstance[`${SERVIDUX_ORIGINAL_FN}${action.type}`] === 'function') {
            classInstance[SERVIDUX_RESULTS] = classInstance[`${SERVIDUX_ORIGINAL_FN}${action.type}`](...action.payload);
            return { ...classInstance };
        }
        return state;
    };
}

function Servidux() {
    return function (target) {
        return class extends target {
            constructor(...args) {
                super(...args);
                const reducer = generateReducer(this);
                this[SERVIDUX_STORE] = createStore(reducer, composeWithDevTools());

                this[SERVIDUX_STORE].subscribe((state) => {
                    Object.assign(this, state);
                });

                let proto = Object.getPrototypeOf(this);
                while (proto && proto !== Object.prototype) {
                    for (const functionName of Object.getOwnPropertyNames(proto)) {
                        const originalFunction = this[functionName];
                        if (typeof originalFunction === 'function') {
                            this[`${SERVIDUX_ORIGINAL_FN}${functionName}`] = originalFunction;
                            this[functionName] = (...methodArgs) => {
                                if (this[SERVIDUX_IS_EXECUTING]) {
                                    return this[`${SERVIDUX_ORIGINAL_FN}${functionName}`](...methodArgs)
                                } else {
                                    this[SERVIDUX_IS_EXECUTING] = true;
                                }

                                const actionType = functionName;
                                this[SERVIDUX_STORE].dispatch({ type: actionType, payload: methodArgs });
                                this[SERVIDUX_IS_EXECUTING] = false;
                                return this[SERVIDUX_RESULTS];
                            };
                        }
                    }
                    proto = Object.getPrototypeOf(proto);
                }
            }
        };
    };
}

module.exports = Servidux;

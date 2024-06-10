const Servidux = require('./index');

@Servidux()
class TestService {
    constructor() {
        this.localVariable1 = '';
        this.localVariable2 = 0;
    }

    someFunction(payload) {
        this.localVariable1 = payload;
    }

    anotherFunction(payload) {
        this.localVariable2 += payload;
    }

    parentFunction(payload) {
        this.localVariable1 = 'test parent';
        this.childFunction(payload);
    }

    childFunction(payload) {
        this.localVariable2 = payload;
    }
}


test('should initialize service with Redux store', () => {
    const testService = new TestService();
    expect(testService.store).toBeDefined();
    expect(testService.store.getState()).toEqual({
        localVariable1: '',
        localVariable2: 0
    });
});

test('should dispatch actions and update state for someFunction', () => {
    const testService = new TestService();
    testService.someFunction('test payload');
    expect(testService.store.getState().localVariable1).toBe('test payload');
    expect(testService.localVariable1).toBe('test payload'); // also check the instance variable
});

test('should dispatch actions and update state for anotherFunction', () => {
    const testService = new TestService();
    testService.anotherFunction(5);
    expect(testService.store.getState().localVariable2).toBe(5);
    expect(testService.localVariable2).toBe(5); // also check the instance variable
});

test('should handle multiple function calls correctly', () => {
    const testService = new TestService();
    testService.someFunction('test payload');
    testService.anotherFunction(5);
    testService.anotherFunction(3);

    expect(testService.store.getState()).toMatchObject({
        localVariable1: 'test payload',
        localVariable2: 8
    });
    expect(testService.localVariable1).toBe('test payload'); // also check the instance variable
    expect(testService.localVariable2).toBe(8); // also check the instance variable
});

test('should call child function from parent', () => {
    const testService = new TestService();
    testService.parentFunction(6);
    expect(testService.store.getState()).toMatchObject({
        localVariable1: 'test parent',
        localVariable2: 6
    });
    expect(testService.localVariable1).toBe('test parent');
    expect(testService.localVariable2).toBe(6);
});

# Servidux

Servidux is a decorator that integrates service classes with Redux, enabling seamless state management and action tracking within service classes.

- Augment service classes with the capabilities of Redux
- Enable state management without refactoring code
- Use Redux DevTools with existing services
- Simplify the Action/Store/Reducer pattern using traditional service patterns

## Usage

Install Servidux via yarn or npm \
`yarn add servidux` or `npm install servidux`

Then decorate classes with `@Servidux()`
```js
import Servidux from 'servidux'

@Servidux() // decorate class with @Servidux()
class UserService { // UserService becomes a store
    private user // local variables become state
    public error
    
    // loadUser becomes an action, parameters become the payload
    async loadUser(userId) { // function defintions become the UserService reducer
        try {
            const response = await fetch(`/api/user/${userId}`)
            this.user = await response.json()
        } catch (error) {
            this.error = error.message;
        }
    }
    
    setUser(user) {this.user = user}
}
```

UserService can now be integrated with your redux libraries.
```js
import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit';


// The UserService can still be defined and used like any other service
const userService = new UserService()

// `loadUser` can be called from anywhere in the app by dispatching to the store
store.dispatch(`UserService.loadUser`, userId)

// You can write selectors against the service
const selectUserState = (state) => state.user;
const selectUser = createSelector(
    selectUserState,
    (userState) => userState.user
);

// and select the user state from anywhere in the app
store.pipe(map(selectUser)).subscribe(user => this.user = user)
store.pipe(map(selectUser)).subscribe(error => this.error = error)
```

We can expand on the UserService example to create a request to update the users name with an optimistic request

```js
@Servidux()
class UserService {
    ...
    
    // create setName(name) action
    async setName(name) {
        const originalName = user.name

        // optimistically assume request will succeed for instant feedback
        this.setUser({...this.user, name})
        try {
            const updatedUserResponse = await fetch(`/api/user/${userId}`, {
                    method: 'POST',
                    body: {name}
            })
            this.setUser({...updatedUserResponse.json()})
        } catch (error) {
            this.setUser({...this.user, originalName}) // roll back users name on failure
            this.error = error.message
        }
    }

    // selectors can be defined in the class for better organization
    static selectName = createSelector(
        selectUserState,
        (userState) => userState.user?.name
    )
    
    async loadUser(userId) {...}
    setUser(user) {...}
}
```
Events on the user can now be integrated with other reducers, including reducers not defined by Servidux.

For example, we can create a Document store that displays the users name as owner of a document,
that could be defined with the following:

```js
// Initial state for document
const initialDocumentState = {
    document: {
        owner: '',
    },
}

// Document reducer
export const documentReducer = (state = initialDocumentState, action) => {
    switch (action.type) {
        case 'UserService.setUser':
            return {
                ...state,
                document: {
                    ...state.document,
                    owner: action.payload.name
                },
            };
        default:
            return state
    }
}
```

## When to use Servidux
Servidex is **NOT** intended to replace existing redux libraries but to augment services to enable writing
simpler reducers with less code using the traditional service pattern.

A rule of thumb is to use Servidux is when stores are simple enough where actions and reducers can be coupled together.
When actions need to be defined independently from reducers or if the service doesn't convert neatly to a reducer, the code
would likely be organized better with traditional Redux patterns.

## Motivation

There's a common trend where applications start with a simple service pattern and move to Redux as they inevitably start sharing state.
As the app grows, someone will typically create a library to try abstract the complexity of Redux to follow the simple service pattern,
often in a way that requires refactoring and creates accidental complexity.

Servidux attempts to solve this with a decorator that doesn't require refactoring existing code. We can have our cake and eat it too.


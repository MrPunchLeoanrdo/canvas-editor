/// <reference types="cypress" />

declare namespace Editor {
  import('../online_editor/src/editor/index')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import Editor from '../online_editor/src/editor/index'
}

declare namespace Cypress {
  interface Chainable {
    getEditor(): Chainable<Editor>
  }
}


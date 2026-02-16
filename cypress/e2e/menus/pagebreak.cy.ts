import Editor from '../../../online_editor/src/editor'

describe('菜单-分页�?, () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('分页�?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__page-break').click().click()

      cy.get('canvas').should('have.length', 2)
    })
  })
})


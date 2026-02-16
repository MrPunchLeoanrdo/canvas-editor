import Editor from '../../../online_editor/src/editor'

describe('菜单-代码�?, () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = `console.log('canvas-editor')`

  it('代码�?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__codeblock').click()

      cy.get('.dialog-option [name="codeblock"]').type(text)

      cy.get('.dialog-menu button')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main[2]

          expect(data.value).to.eq('log')

          expect(data.color).to.eq('#b9a40a')
        })
    })
  })
})


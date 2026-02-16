import Editor from '../../../online_editor/src/editor'

describe('菜单-行处�?, () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('左对�?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__left')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].rowFlex).to.eq('left')
        })
    })
  })

  it('居中对齐', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__center')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].rowFlex).to.eq('center')
        })
    })
  })

  it('靠右对齐', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__right')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].rowFlex).to.eq('right')
        })
    })
  })

  it('行间�?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__row-margin').as('rowMargin').click()

      cy.get('@rowMargin')
        .find('li')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].rowMargin).to.eq(1.25)
        })
    })
  })
})


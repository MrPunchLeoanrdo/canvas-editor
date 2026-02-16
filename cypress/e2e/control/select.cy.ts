import Editor, { ControlType, ElementType } from '../../../online_editor/src/editor'

describe('æŽ§ä»¶-åˆ—ä¸¾åž?, () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = `æœ‰`
  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'select'

  it('åˆ—ä¸¾åž?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          type: elementType,
          value: '',
          control: {
            type: controlType,
            value: null,
            placeholder: 'åˆ—ä¸¾åž?,
            valueSets: [
              {
                value: 'æœ?,
                code: '98175'
              },
              {
                value: 'æ—?,
                code: '98176'
              }
            ]
          }
        }
      ])

      cy.get('@canvas').type(`{leftArrow}`)

      cy.get('.ce-select-control-popup li')
        .eq(0)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main[0]

          expect(data.control!.value![0].value).to.be.eq(text)

          expect(data.control!.code).to.be.eq('98175')
        })
    })
  })
})


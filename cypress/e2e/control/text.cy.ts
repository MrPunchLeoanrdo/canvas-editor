import Editor, { ControlType, ElementType } from '../../../online_editor/src/editor'

describe('控件-文本�?, () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = `canvas-editor`
  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'text'

  it('文本�?, () => {
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
            placeholder: '文本�?
          }
        }
      ])

      cy.get('@canvas').type(`{leftArrow}`)

      cy.get('.ce-inputarea')
        .type(text)
        .then(() => {
          const data = editor.command.getValue().data.main[0]

          expect(data.control!.value![0].value).to.be.eq(text)
        })
    })
  })
})


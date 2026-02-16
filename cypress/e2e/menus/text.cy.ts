import Editor from '../../../online_editor/src/editor'

describe('菜单-文本处理', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const textLength = text.length

  it('字体', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__font').as('font').click()

      cy.get('@font')
        .find('li')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].font).to.eq('华文宋体')
        })
    })
  })

  it('字号设置', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__size').as('size').click()

      cy.get('@size')
        .find('li')
        .eq(0)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].size).to.eq(56)
        })
    })
  })

  it('字体增大', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__size-add')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].size).to.eq(18)
        })
    })
  })

  it('字体减小', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__size-minus')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].size).to.eq(14)
        })
    })
  })

  it('加粗', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__bold')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].bold).to.eq(true)
        })
    })
  })

  it('斜体', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__italic')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].italic).to.eq(true)
        })
    })
  })

  it('下划�?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__underline')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].underline).to.eq(true)
        })
    })
  })

  it('删除�?, () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__strikeout')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].strikeout).to.eq(true)
        })
    })
  })

  it('上标', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__superscript')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq('superscript')
        })
    })
  })

  it('下标', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__subscript')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq('subscript')
        })
    })
  })

  it('字体颜色', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      editor.command.executeColor('red')

      const data = editor.command.getValue().data.main

      expect(data[0].color).to.eq('red')
    })
  })

  it('高亮', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      editor.command.executeHighlight('red')

      const data = editor.command.getValue().data.main

      expect(data[0].highlight).to.eq('red')
    })
  })
})


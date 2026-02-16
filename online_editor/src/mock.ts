import { IEditorOption, IElement } from './editor'

export const data: IElement[] = []

interface IComment {
  id: string
  content: string
  userName: string
  rangeText: string
  createdDate: string
}

export const commentList: IComment[] = []

export const options: IEditorOption = {
  margins: [100, 120, 100, 120],
  pageNumber: {
    disabled: true
  },
  placeholder: {
    data: ''
  },
  zone: {
    tipDisabled: false
  },
  maskMargin: [100, 0, 30, 0] // 菜单栏高度60 + 导入条高度40
}

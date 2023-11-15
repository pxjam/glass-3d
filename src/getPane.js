import { Pane } from 'tweakpane'

let pane

export const getPane = () => {
    if (!pane) {
        pane = new Pane()
        pane.title = 'Hide/Show params'
    }
    return pane
}

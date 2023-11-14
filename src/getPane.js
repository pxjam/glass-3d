import { Pane } from 'tweakpane'

let pane

export const getPane = () => {
    if (!pane) {
        pane = new Pane()
    }
    return pane
}

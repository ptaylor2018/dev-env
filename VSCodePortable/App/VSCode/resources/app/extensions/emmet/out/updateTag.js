"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
function updateTag(tagName) {
    let editor = vscode.window.activeTextEditor;
    if (!util_1.validate(false)) {
        return;
    }
    let rootNode = util_1.parseDocument(editor.document);
    if (!rootNode) {
        return;
    }
    let rangesToUpdate = [];
    editor.selections.reverse().forEach(selection => {
        rangesToUpdate = rangesToUpdate.concat(getRangesToUpdate(editor, selection, rootNode));
    });
    return editor.edit(editBuilder => {
        rangesToUpdate.forEach(range => {
            editBuilder.replace(range, tagName);
        });
    });
}
exports.updateTag = updateTag;
function getRangesToUpdate(editor, selection, rootNode) {
    let nodeToUpdate = util_1.getNode(rootNode, selection.start);
    if (!nodeToUpdate) {
        return [];
    }
    let openStart = nodeToUpdate.open.start.translate(0, 1);
    let openEnd = openStart.translate(0, nodeToUpdate.name.length);
    let ranges = [new vscode.Range(openStart, openEnd)];
    if (nodeToUpdate.close) {
        let closeStart = nodeToUpdate.close.start.translate(0, 2);
        let closeEnd = nodeToUpdate.close.end.translate(0, -1);
        ranges.push(new vscode.Range(closeStart, closeEnd));
    }
    return ranges;
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/41abd21afdf7424c89319ee7cb0445cc6f376959/extensions\emmet\out/updateTag.js.map

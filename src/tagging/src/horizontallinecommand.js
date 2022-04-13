/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module horizontal-line/horizontallinecommand
 */

import { Command } from 'ckeditor5/src/core';
import { findOptimalInsertionRange } from 'ckeditor5/src/widget';

/**
 * The horizontal line command.
 *
 * The command is registered by {@link module:horizontal-line/horizontallineediting~TaggingEditing} as `'tagging'`.
 *
 * To insert a horizontal line at the current selection, execute the command:
 *
 *		editor.execute( 'tagging' );
 *
 * @extends module:core/command~Command
 */
export default class TaggingCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		this.isEnabled = true;
	}

	/**
	 * Executes the command.
	 *
	 * @fires execute
	 */
	execute() {
		const model = this.editor.model;
		const selection = model.document.selection;

		model.change( writer => {

			const horizontalElement = writer.createElement( 'tagging' );
			console.log("horizontalElement", horizontalElement);
			console.log("selection", selection);
			const position = selection.getFirstPosition();
			console.log("position", position);

			const { end: positionAfter } = model.insertContent( writer.createText( '#' ), position );

			// Put the selection at the end of the inserted invite.
			// Using end of range returned from insertContent in case nodes with the same attributes got merged.
			writer.setSelection( positionAfter );
			// model.insertObject( horizontalElement, null, null, { setSelection: 'after' } );
		} );
	}
}

// Checks if a horizontal line is allowed by the schema in the optimal insertion parent.
//
// @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
// @param {module:engine/model/schema~Schema} schema
// @param {module:engine/model/model~Model} model Model instance.
// @returns {Boolean}
function isTaggingAllowedInParent( selection, schema, model ) {
	const parent = getInsertTaggingParent( selection, model );

	return schema.checkChild( parent, 'tagging' );
}

// Returns a node that will be used to insert a horizontal line with `model.insertContent` to check if the horizontal line can be
// placed there.
//
// @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
// @param {module:engine/model/model~Model} model Model instance.
// @returns {module:engine/model/element~Element}
function getInsertTaggingParent( selection, model ) {
	const insertionRange = findOptimalInsertionRange( selection, model );
	const parent = insertionRange.start.parent;

	if ( parent.isEmpty && !parent.is( 'element', '$root' ) ) {
		return parent.parent;
	}

	return parent;
}

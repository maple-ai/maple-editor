/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file/filetypecommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The file type command. It changes the type of a selected file, depending on the configuration.
 *
 * @extends module:core/command~Command
 */
export default class FileTypeCommand extends Command {
	/**
	 * @inheritDoc
	 *
	 * @param {module:core/editor/editor~Editor} editor
	 * @param {'fileBlock'|'fileInline'} modelElementName Model element name the command converts to.
	 */
	constructor( editor, modelElementName ) {
		super( editor );

		/**
		 * Model element name the command converts to.
		 *
		 * @readonly
		 * @private
		 * @member {'fileBlock'|'fileInline'}
		 */
		this._modelElementName = modelElementName;
	}

	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const element = fileUtils.getClosestSelectedFileElement( this.editor.model.document.selection );

		if ( this._modelElementName === 'fileBlock' ) {
			this.isEnabled = fileUtils.isInlineFile( element );
		} else {
			this.isEnabled = fileUtils.isBlockFile( element );
		}
	}

	/**
	 * Executes the command and changes the type of a selected file.
	 *
	 * @fires execute
	 * @returns {Object|null} An object containing references to old and new model file elements
	 * (for before and after the change) so external integrations can hook into the decorated
	 * `execute` event and handle this change. `null` if the type change failed.
	 */
	execute() {
		const editor = this.editor;
		const model = this.editor.model;
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const oldElement = fileUtils.getClosestSelectedFileElement( model.document.selection );
		const attributes = Object.fromEntries( oldElement.getAttributes() );

		// Don't change file type if "src" is missing (a broken file), unless there's "uploadId" set.
		// This state may happen during file upload (before it finishes) and it should be possible to change type
		// of the file in the meantime.
		if ( !attributes.src && !attributes.uploadId ) {
			return null;
		}

		return model.change( writer => {
			// Get all markers that contain the old file element.
			const markers = Array.from( model.markers )
				.filter( marker => marker.getRange().containsItem( oldElement ) );

			const newElement = fileUtils.insertFile( attributes, model.createSelection( oldElement, 'on' ), this._modelElementName );

			if ( !newElement ) {
				return null;
			}

			const newElementRange = writer.createRangeOn( newElement );

			// Expand the previously intersecting markers' ranges to include the new file element.
			for ( const marker of markers ) {
				const markerRange = marker.getRange();

				// Join the survived part of the old marker range with the new element range
				// (loosely because there could be some new paragraph or the existing one might got split).
				const range = markerRange.root.rootName != '$graveyard' ?
					markerRange.getJoined( newElementRange, true ) : newElementRange;

				writer.updateMarker( marker, { range } );
			}

			return {
				oldElement,
				newElement
			};
		} );
	}
}

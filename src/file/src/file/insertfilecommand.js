/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { Command } from 'ckeditor5/src/core';
import { logWarning, toArray } from 'ckeditor5/src/utils';

/**
 * @module file/file/insertfilecommand
 */

/**
 * Insert file command.
 *
 * The command is registered by the {@link module:file/file/fileediting~FileEditing} plugin as `insertFile`
 * and it is also available via aliased `fileInsert` name.
 *
 * In order to insert an file at the current selection position
 * (according to the {@link module:widget/utils~findOptimalInsertionRange} algorithm),
 * execute the command and specify the file source:
 *
 *		editor.execute( 'insertFile', { source: 'http://url.to.the/file' } );
 *
 * It is also possible to insert multiple files at once:
 *
 *		editor.execute( 'insertFile', {
 *			source:  [
 *				'path/to/file.jpg',
 *				'path/to/other-file.jpg'
 *			]
 *		} );
 *
 * If you want to take the full control over the process, you can specify iniframeidual model attributes:
 *
 *		editor.execute( 'insertFile', {
 *			source:  [
 *				{ src: 'path/to/file.jpg', alt: 'First alt text' },
 *				{ src: 'path/to/other-file.jpg', alt: 'Second alt text', customAttribute: 'My attribute value' }
 *			]
 *		} );
 *
 * @extends module:core/command~Command
 */
export default class InsertFileCommand extends Command {
	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		let configFileInsertType = editor.config.get( 'file.insert.type' );
		configFileInsertType = 'inline';

		if ( !editor.plugins.has( 'FileInlineEditing' ) ) {
			if ( configFileInsertType === 'inline' ) {
				/**
				 * The {@link module:file/fileinline~FileInline} plugin must be enabled to allow inserting inline files. See
				 * {@link module:file/fileinsert~FileInsertConfig#type} to learn more.
				 *
				 * @error file-inline-plugin-required
				 */
				logWarning( 'file-inline-plugin-required' );
			}
		}

		if ( !editor.plugins.has( 'FileBlockEditing' ) ) {
			if ( configFileInsertType === 'block' ) {
				/**
				 * The {@link module:file/fileblock~FileBlock} plugin must be enabled to allow inserting block files. See
				 * {@link module:file/fileinsert~FileInsertConfig#type} to learn more.
				 *
				 * @error file-block-plugin-required
				 */
				logWarning( 'file-block-plugin-required' );
			} else {
				if ( configFileInsertType === 'inline' ) {
					/**
					 * The {@link module:file/fileinline~FileInline} plugin must be enabled to allow inserting inline files. See
					 * {@link module:file/fileinsert~FileInsertConfig#type} to learn more.
					 *
					 * @error file-inline-plugin-required
					 */
					logWarning( 'file-inline-plugin-required' );
				}
			}
		}
	}

	/**
	 * @inheritDoc
	 */
	refresh() {
		this.isEnabled = this.editor.plugins.get( 'FileUtils' ).isFileAllowed();
	}

	/**
	 * Executes the command.
	 *
	 * @fires execute
	 * @param {Object} options Options for the executed command.
	 * @param {String|Array.<String>|Array.<Object>} options.source The file source or an array of file sources to insert.
	 * See the documentation of the command to learn more about accepted formats.
	 */
	execute( options ) {
		const sourceDefinitions = toArray( options.source );
		const selection = this.editor.model.document.selection;
		const fileUtils = this.editor.plugins.get( 'FileUtils' );

		// In case of multiple files, each file (starting from the 2nd) will be inserted at a position that
		// follows the previous one. That will move the selection and, to stay on the safe side and make sure
		// all files inherit the same selection attributes, they are collected beforehand.
		//
		// Applying these attributes ensures, for instance, that inserting an (inline) file into a link does
		// not split that link but preserves its continuity.
		//
		// Note: Selection attributes that do not make sense for files will be filtered out by insertFile() anyway.
		const selectionAttributes = Object.fromEntries( selection.getAttributes() );

		sourceDefinitions.forEach( ( sourceDefinition, index ) => {
			const selectedElement = selection.getSelectedElement();

			if ( typeof sourceDefinition === 'string' ) {
				sourceDefinition = { src: sourceDefinition };
			}

			// Inserting of an inline file replace the selected element and make a selection on the inserted file.
			// Therefore inserting multiple inline files requires creating position after each element.
			if ( index && selectedElement && fileUtils.isFile( selectedElement ) ) {
				const position = this.editor.model.createPositionAfter( selectedElement );

				fileUtils.insertFile( { ...sourceDefinition, ...selectionAttributes }, position );
			} else {
				fileUtils.insertFile( { ...sourceDefinition, ...selectionAttributes } );
			}
		} );
	}
}

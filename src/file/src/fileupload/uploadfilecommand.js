/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { FileRepository } from 'ckeditor5/src/upload';
import { Command } from 'ckeditor5/src/core';
import { toArray } from 'ckeditor5/src/utils';

/**
 * @module file/fileupload/uploadfilecommand
 */

/**
 * The upload file command.
 *
 * The command is registered by the {@link module:file/fileupload/fileuploadediting~FileUploadEditing} plugin as `uploadFile`
 * and it is also available via aliased `fileUpload` name.
 *
 * In order to upload an file at the current selection position
 * (according to the {@link module:widget/utils~findOptimalInsertionRange} algorithm),
 * execute the command and pass the native file file instance:
 *
 *		this.listenTo( editor.editing.view.document, 'clipboardInput', ( evt, data ) => {
 *			// Assuming that only files were pasted:
 *			const files = Array.from( data.dataTransfer.files );
 *
 *			// Upload the first file:
 *			editor.execute( 'uploadFile', { file: files[ 0 ] } );
 *		} );
 *
 * It is also possible to insert multiple files at once:
 *
 *		editor.execute( 'uploadFile', {
 *			file: [
 *				file1,
 *				file2
 *			]
 *		} );
 *
 * @extends module:core/command~Command
 */
export default class UploadFileCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const selectedElement = editor.model.document.selection.getSelectedElement();

		// TODO: This needs refactoring.
		this.isEnabled = fileUtils.isFileAllowed() || fileUtils.isFile( selectedElement );
	}

	/**
	 * Executes the command.
	 *
	 * @fires execute
	 * @param {Object} options Options for the executed command.
	 * @param {File|Array.<File>} options.file The file file or an array of file files to upload.
	 */
	execute( options ) {
		const files = toArray( options.file );
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

		files.forEach( ( file, index ) => {
			const selectedElement = selection.getSelectedElement();

			// Inserting of an inline file replace the selected element and make a selection on the inserted file.
			// Therefore inserting multiple inline files requires creating position after each element.
			if ( index && selectedElement && fileUtils.isFile( selectedElement ) ) {
				const position = this.editor.model.createPositionAfter( selectedElement );

				this._uploadFile( file, selectionAttributes, position );
			} else {
				this._uploadFile( file, selectionAttributes );
			}
		} );
	}

	/**
	 * Handles uploading single file.
	 *
	 * @private
	 * @param {File} file
	 * @param {Object} attributes
	 * @param {module:engine/model/position~Position} position
	 */
	_uploadFile( file, attributes, position ) {
		const editor = this.editor;
		const fileRepository = editor.plugins.get( FileRepository );
		const loader = fileRepository.createLoader( file );
		const fileUtils = editor.plugins.get( 'FileUtils' );

		// Do not throw when upload adapter is not set. FileRepository will log an error anyway.
		if ( !loader ) {
			return;
		}

		
		
		
		fileUtils.insertFile( { ...attributes, uploadId: loader.id }, position );
	}
}

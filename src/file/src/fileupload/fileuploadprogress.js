/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileupload/fileuploadprogress
 */

/* globals setTimeout */

import { Plugin } from 'ckeditor5/src/core';
import { FileRepository } from 'ckeditor5/src/upload';

import '../../theme/fileuploadprogress.css';
import '../../theme/fileuploadicon.css';
import '../../theme/fileuploadloader.css';

/**
 * The file upload progress plugin.
 * It shows a placeholder when the file is read from the disk and a progress bar while the file is uploading.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileUploadProgress extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileUploadProgress';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		/**
		 * The file placeholder that is displayed before real file data can be accessed.
		 *
		 * For the record, this file is a 1x1 px GIF with an aspect ratio set by CSS.
		 *
		 * @protected
		 * @member {String} #placeholder
		 */
		this.placeholder = 'data:file/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		if ( editor.plugins.has( 'FileInlineEditing' ) ) {
			editor.editing.downcastDispatcher.on( 'attribute:uploadStatus:fileInline', ( ...args ) => this.uploadStatusChange( ...args ) );
		}

		// Upload status change - update file's view according to that status.
		if ( editor.plugins.has( 'FileBlockEditing' ) ) {
			editor.editing.downcastDispatcher.on( 'attribute:uploadStatus:fileBlock', ( ...args ) => this.uploadStatusChange( ...args ) );
		}
	}

	/**
	 * This method is called each time the file `uploadStatus` attribute is changed.
	 *
	 * @param {module:utils/eventinfo~EventInfo} evt An object containing information about the fired event.
	 * @param {Object} data Additional information about the change.
	 * @param {module:engine/conversion/downcastdispatcher~DowncastConversionApi} conversionApi
	 */
	uploadStatusChange( evt, data, conversionApi ) {
		const editor = this.editor;
		const modelFile = data.item;
		const uploadId = modelFile.getAttribute( 'uploadId' );

		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const fileUtils = editor.plugins.get( 'FileUtils' );
		const fileRepository = editor.plugins.get( FileRepository );
		const status = uploadId ? data.attributeNewValue : null;
		const placeholder = this.placeholder;
		const viewFigure = editor.editing.mapper.toViewElement( modelFile );
		const viewWriter = conversionApi.writer;

		if ( status == 'reading' ) {
			// Start "appearing" effect and show placeholder with infinite progress bar on the top
			// while file is read from disk.
			_startAppearEffect( viewFigure, viewWriter );
			_showPlaceholder( fileUtils, placeholder, viewFigure, viewWriter );

			return;
		}

		// Show progress bar on the top of the file when file is uploading.
		if ( status == 'uploading' ) {
			const loader = fileRepository.loaders.get( uploadId );

			// Start appear effect if needed - see https://github.com/ckeditor/ckeditor5-file/issues/191.
			_startAppearEffect( viewFigure, viewWriter );

			if ( !loader ) {
				// There is no loader associated with uploadId - this means that file came from external changes.
				// In such cases we still want to show the placeholder until file is fully uploaded.
				// Show placeholder if needed - see https://github.com/ckeditor/ckeditor5-file/issues/191.
				_showPlaceholder( fileUtils, placeholder, viewFigure, viewWriter );
			} else {
				// Hide placeholder and initialize progress bar showing upload progress.
				_hidePlaceholder( viewFigure, viewWriter );
				_showProgressBar( viewFigure, viewWriter, loader, editor.editing.view );
				_displayLocalFile( fileUtils, viewFigure, viewWriter, loader );
			}

			return;
		}

		if ( status == 'complete' && fileRepository.loaders.get( uploadId ) ) {
			_showCompleteIcon( viewFigure, viewWriter, editor.editing.view );
		}

		// Clean up.
		_hideProgressBar( viewFigure, viewWriter );
		_hidePlaceholder( viewFigure, viewWriter );
		_stopAppearEffect( viewFigure, viewWriter );
	}
}

// Adds ck-appear class to the file figure if one is not already applied.
//
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function _startAppearEffect( viewFigure, writer ) {
	if ( !viewFigure.hasClass( 'ck-appear' ) ) {
		writer.addClass( 'ck-appear', viewFigure );
	}
}

// Removes ck-appear class to the file figure if one is not already removed.
//
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function _stopAppearEffect( viewFigure, writer ) {
	writer.removeClass( 'ck-appear', viewFigure );
}

// Shows placeholder together with infinite progress bar on given file figure.
//
// @param {module:file/fileutils~FileUtils} fileUtils
// @param {String} Data-uri with a svg placeholder.
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function _showPlaceholder( fileUtils, placeholder, viewFigure, writer ) {
	if ( !viewFigure.hasClass( 'ck-file-upload-placeholder' ) ) {
		writer.addClass( 'ck-file-upload-placeholder', viewFigure );
	}

	const viewImg = fileUtils.findViewImgElement( viewFigure );

	if ( viewImg.getAttribute( 'src' ) !== placeholder ) {
		console.log("viewImg", viewImg);
		console.log("placeholder", placeholder);
		// writer.setAttribute( 'src', placeholder, viewImg );
	}

	if ( !_getUIElement( viewFigure, 'placeholder' ) ) {
		writer.insert( writer.createPositionAfter( viewImg ), _createPlaceholder( writer ) );
	}
}

// Removes placeholder together with infinite progress bar on given file figure.
//
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function _hidePlaceholder( viewFigure, writer ) {
	if ( viewFigure.hasClass( 'ck-file-upload-placeholder' ) ) {
		writer.removeClass( 'ck-file-upload-placeholder', viewFigure );
	}

	_removeUIElement( viewFigure, writer, 'placeholder' );
}

// Shows progress bar displaying upload progress.
// Attaches it to the file loader to update when upload percentace is changed.
//
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
// @param {module:upload/filerepository~FileLoader} loader
// @param {module:engine/view/view~View} view
function _showProgressBar( viewFigure, writer, loader, view ) {
	const progressBar = _createProgressBar( writer );
	writer.insert( writer.createPositionAt( viewFigure, 'end' ), progressBar );

	// Update progress bar width when uploadedPercent is changed.
	loader.on( 'change:uploadedPercent', ( evt, name, value ) => {
		view.change( writer => {
			writer.setStyle( 'width', value + '%', progressBar );
		} );
	} );
}

// Hides upload progress bar.
//
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function _hideProgressBar( viewFigure, writer ) {
	_removeUIElement( viewFigure, writer, 'progressBar' );
}

// Shows complete icon and hides after a certain amount of time.
//
// @param {module:engine/view/containerelement~ContainerElement} viewFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
// @param {module:engine/view/view~View} view
function _showCompleteIcon( viewFigure, writer, view ) {
	const completeIcon = writer.createUIElement( 'iframe', { class: 'ck-file-upload-complete-icon' } );

	writer.insert( writer.createPositionAt( viewFigure, 'end' ), completeIcon );

	setTimeout( () => {
		view.change( writer => writer.remove( writer.createRangeOn( completeIcon ) ) );
	}, 3000 );
}

// Create progress bar element using {@link module:engine/view/uielement~UIElement}.
//
// @private
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
// @returns {module:engine/view/uielement~UIElement}
function _createProgressBar( writer ) {
	const progressBar = writer.createUIElement( 'iframe', { class: 'ck-progress-bar' } );

	writer.setCustomProperty( 'progressBar', true, progressBar );

	return progressBar;
}

// Create placeholder element using {@link module:engine/view/uielement~UIElement}.
//
// @private
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
// @returns {module:engine/view/uielement~UIElement}
function _createPlaceholder( writer ) {
	const placeholder = writer.createUIElement( 'iframe', { class: 'ck-upload-placeholder-loader' } );

	writer.setCustomProperty( 'placeholder', true, placeholder );

	return placeholder;
}

// Returns {@link module:engine/view/uielement~UIElement} of given unique property from file figure element.
// Returns `undefined` if element is not found.
//
// @private
// @param {module:engine/view/element~Element} fileFigure
// @param {String} uniqueProperty
// @returns {module:engine/view/uielement~UIElement|undefined}
function _getUIElement( fileFigure, uniqueProperty ) {
	for ( const child of fileFigure.getChildren() ) {
		if ( child.getCustomProperty( uniqueProperty ) ) {
			return child;
		}
	}
}

// Removes {@link module:engine/view/uielement~UIElement} of given unique property from file figure element.
//
// @private
// @param {module:engine/view/element~Element} fileFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
// @param {String} uniqueProperty
function _removeUIElement( viewFigure, writer, uniqueProperty ) {
	const element = _getUIElement( viewFigure, uniqueProperty );

	if ( element ) {
		writer.remove( writer.createRangeOn( element ) );
	}
}

// Displays local data from file loader.
//
// @param {module:file/fileutils~FileUtils} fileUtils
// @param {module:engine/view/element~Element} fileFigure
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
// @param {module:upload/filerepository~FileLoader} loader
function _displayLocalFile( fileUtils, viewFigure, writer, loader ) {
	if ( loader.data ) {
		const viewImg = fileUtils.findViewImgElement( viewFigure );

		// writer.setAttribute( 'src', loader.data, viewImg );
	}
}

/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetype/toggleimagetypecommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The toggle image caption command.
 *
 * This command is registered by {@link module:image/imagetype/imagetypeediting~ImageTypeEditing} as the
 * `'toggleImageType'` editor command.
 *
 * Executing this command:
 *
 * * either adds or removes the image caption of a selected image (depending on whether the caption is present or not),
 * * removes the image caption if the selection is anchored in one.
 *
 *		// Toggle the presence of the caption.
 *		editor.execute( 'toggleImageType' );
 *
 * **Note**: Upon executing this command, the selection will be set on the image if previously anchored in the caption element.
 *
 * **Note**: You can move the selection to the caption right away as it shows up upon executing this command by using
 * the `focusCaptionOnShow` option:
 *
 *		editor.execute( 'toggleImageType', { focusCaptionOnShow: true } );
 *
 * @extends module:core/command~Command
 */
export default class ToggleImageTypeCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		this.isEnabled = false;
		this.value = false;
	}

	/**
	 * Executes the command.
	 *
	 *		editor.execute( 'toggleImageType' );
	 *
	 * @param {Object} [options] Options for the executed command.
	 * @param {String} [options.focusCaptionOnShow] When true and the caption shows up, the selection will be moved into it straight away.
	 * @fires execute
	 */
	execute( options = {} ) {
		const { focusCaptionOnShow } = options;

		this.editor.model.change( writer => {
			if ( this.value ) {
				// this._hideImageType( writer );
			} else {
				this._showImageType( writer, focusCaptionOnShow );
			}
		} );
	}

	/**
	 * Shows the caption of the `<imageBlock>` or `<imageInline>`. Also:
	 *
	 * * it converts `<imageInline>` to `<imageBlock>` to show the caption,
	 * * it attempts to restore the caption content from the `ImageTypeEditing` caption registry,
	 * * it moves the selection to the caption right away, it the `focusCaptionOnShow` option was set.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 */
	_showImageType( writer, focusCaptionOnShow ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const imageCaptionEditing = this.editor.plugins.get( 'ImageTypeEditing' );

		let selectedImage = selection.getSelectedElement();

		const savedCaption = imageCaptionEditing._getSavedCaption( selectedImage );

		// Convert imageInline -> image first.
		// if ( this.editor.plugins.get( 'ImageUtils' ).isInlineImage( selectedImage ) ) {
		// 	this.editor.execute( 'imageTypeBlock' );

		// 	// Executing the command created a new model element. Let's pick it again.
		// 	selectedImage = selection.getSelectedElement();
		// }

		// Try restoring the caption from the ImageTypeEditing plugin storage.
		const newCaptionElement = savedCaption || writer.createElement( 'caption' );

		writer.append( newCaptionElement, selectedImage );

		// if ( focusCaptionOnShow ) {
			// writer.setSelection( newCaptionElement, 'in' );
		// }
	}

	/**
	 * Hides the caption of a selected image (or an image caption the selection is anchored to).
	 *
	 * The content of the caption is stored in the `ImageTypeEditing` caption registry to make this
	 * a reversible action.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 */
	// _hideImageType( writer ) {
	// 	const editor = this.editor;
	// 	const selection = editor.model.document.selection;
	// 	const imageCaptionEditing = editor.plugins.get( 'ImageTypeEditing' );
	// 	const imageUtils = editor.plugins.get( 'ImageUtils' );
	// 	let selectedImage = selection.getSelectedElement();
	// 	let captionElement;

	// 	if ( selectedImage ) {
	// 		captionElement = getCaptionFromImageModelElement( selectedImage );
	// 	} else {
	// 		captionElement = getCaptionFromModelSelection( imageUtils, selection );
	// 		selectedImage = captionElement.parent;
	// 	}

	// 	// Store the caption content so it can be restored quickly if the user changes their mind even if they toggle image<->imageInline.
	// 	imageCaptionEditing._saveCaption( selectedImage, captionElement );

	// 	writer.setSelection( selectedImage, 'on' );
	// 	writer.remove( captionElement );
	// }
}

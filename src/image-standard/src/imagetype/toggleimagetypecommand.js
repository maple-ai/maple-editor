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
 * This command is registered by {@link module:image/imagetype/imagetypeediting~ImageStandardTypeEditing} as the
 * `'toggleImageStandardType'` editor command.
 *
 * Executing this command:
 *
 * * either adds or removes the image caption of a selected image (depending on whether the caption is present or not),
 * * removes the image caption if the selection is anchored in one.
 *
 *		// Toggle the presence of the caption.
 *		editor.execute( 'toggleImageStandardType' );
 *
 * **Note**: Upon executing this command, the selection will be set on the image if previously anchored in the caption element.
 *
 * **Note**: You can move the selection to the caption right away as it shows up upon executing this command by using
 * the `focusCaptionOnShow` option:
 *
 *		editor.execute( 'toggleImageStandardType', { focusCaptionOnShow: true } );
 *
 * @extends module:core/command~Command
 */
export default class ToggleImageStandardTypeCommand extends Command {
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
	 *		editor.execute( 'toggleImageStandardType' );
	 *
	 * @param {Object} [options] Options for the executed command.
	 * @param {String} [options.focusCaptionOnShow] When true and the caption shows up, the selection will be moved into it straight away.
	 * @fires execute
	 */
	execute( options = {} ) {
		const { focusCaptionOnShow } = options;

		this.editor.model.change( writer => {
			if ( this.value ) {
				// this._hideImageStandardType( writer );
			} else {
				this._showImageStandardType( writer, focusCaptionOnShow );
			}
		} );
	}

	/**
	 * Shows the caption of the `<imageStandardBlock>` or `<imageStandardInline>`. Also:
	 *
	 * * it converts `<imageStandardInline>` to `<imageStandardBlock>` to show the caption,
	 * * it attempts to restore the caption content from the `ImageStandardTypeEditing` caption registry,
	 * * it moves the selection to the caption right away, it the `focusCaptionOnShow` option was set.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 */
	_showImageStandardType( writer, focusCaptionOnShow ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const imageCaptionEditing = this.editor.plugins.get( 'ImageStandardTypeEditing' );

		let selectedImageStandard = selection.getSelectedElement();

		const savedCaption = imageCaptionEditing._getSavedCaption( selectedImageStandard );

		// Convert imageStandardInline -> image first.
		// if ( this.editor.plugins.get( 'ImageStandardUtils' ).isInlineImageStandard( selectedImageStandard ) ) {
		// 	this.editor.execute( 'imageTypeBlock' );

		// 	// Executing the command created a new model element. Let's pick it again.
		// 	selectedImageStandard = selection.getSelectedElement();
		// }

		// Try restoring the caption from the ImageStandardTypeEditing plugin storage.
		const newCaptionElement = savedCaption || writer.createElement( 'caption' );

		writer.append( newCaptionElement, selectedImageStandard );

		// if ( focusCaptionOnShow ) {
			// writer.setSelection( newCaptionElement, 'in' );
		// }
	}

	/**
	 * Hides the caption of a selected image (or an image caption the selection is anchored to).
	 *
	 * The content of the caption is stored in the `ImageStandardTypeEditing` caption registry to make this
	 * a reversible action.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 */
	// _hideImageStandardType( writer ) {
	// 	const editor = this.editor;
	// 	const selection = editor.model.document.selection;
	// 	const imageCaptionEditing = editor.plugins.get( 'ImageStandardTypeEditing' );
	// 	const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
	// 	let selectedImageStandard = selection.getSelectedElement();
	// 	let captionElement;

	// 	if ( selectedImageStandard ) {
	// 		captionElement = getCaptionFromImageStandardModelElement( selectedImageStandard );
	// 	} else {
	// 		captionElement = getCaptionFromModelSelection( imageUtils, selection );
	// 		selectedImageStandard = captionElement.parent;
	// 	}

	// 	// Store the caption content so it can be restored quickly if the user changes their mind even if they toggle image<->imageStandardInline.
	// 	imageCaptionEditing._saveCaption( selectedImageStandard, captionElement );

	// 	writer.setSelection( selectedImageStandard, 'on' );
	// 	writer.remove( captionElement );
	// }
}

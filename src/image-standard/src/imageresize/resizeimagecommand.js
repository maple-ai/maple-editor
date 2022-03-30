/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageresize/resizeimagecommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The resize image command. Currently, it only supports the width attribute.
 *
 * @extends module:core/command~Command
 */
export default class ResizeImageStandardCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const element = imageUtils.getClosestSelectedImageStandardElement( editor.model.document.selection );

		this.isEnabled = !!element;

		if ( !element || !element.hasAttribute( 'width' ) ) {
			this.value = null;
		} else {
			this.value = {
				width: element.getAttribute( 'width' ),
				height: null
			};
		}
	}

	/**
	 * Executes the command.
	 *
	 *		// Sets the width to 50%:
	 *		editor.execute( 'resizeImageStandard', { width: '50%' } );
	 *
	 *		// Removes the width attribute:
	 *		editor.execute( 'resizeImageStandard', { width: null } );
	 *
	 * @param {Object} options
	 * @param {String|null} options.width The new width of the image.
	 * @fires execute
	 */
	execute( options ) {
		const editor = this.editor;
		const model = editor.model;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const imageElement = imageUtils.getClosestSelectedImageStandardElement( model.document.selection );

		this.value = {
			width: options.width,
			height: null
		};

		if ( imageElement ) {
			model.change( writer => {
				writer.setAttribute( 'width', options.width, imageElement );
			} );
		}
	}
}
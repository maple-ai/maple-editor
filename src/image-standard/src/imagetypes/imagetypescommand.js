/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetypes/resizeimagecommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The resize image command. Currently, it only supports the type attribute.
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

		if ( !element || !element.hasAttribute( 'type' ) ) {
			this.value = null;
		} else {
			this.value = {
				type: element.getAttribute( 'type' ),
				height: null
			};
		}
	}

	/**
	 * Executes the command.
	 *
	 *		// Sets the type to 50%:
	 *		editor.execute( 'imageTypes', { type: '50%' } );
	 *
	 *		// Removes the type attribute:
	 *		editor.execute( 'imageTypes', { type: null } );
	 *
	 * @param {Object} options
	 * @param {String|null} options.type The new type of the image.
	 * @fires execute
	 */
	execute( options ) {
		const editor = this.editor;
		const model = editor.model;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const imageElement = imageUtils.getClosestSelectedImageStandardElement( model.document.selection );

		this.value = {
			type: options.type,
			height: null
		};

		if ( imageElement ) {
			model.change( writer => {
				console.log("options.type", options);
				writer.setAttribute( 'type', options.type, imageElement );
				writer.setAttribute( 'data-type', options.type, imageElement );
				// const newCaptionElement = writer.createElement( 'caption' );
				// writer.append( newCaptionElement, imageElement );
			} );
		}
	}
}

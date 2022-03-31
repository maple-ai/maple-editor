/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagedelete/imagedeletecommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The image text alternative command. It is used to change the `alt` attribute of `<imageStandardBlock>` and `<imageStandardInline>` model elements.
 *
 * @extends module:core/command~Command
 */
export default class ImageStandardDeleteCommand extends Command {
	/**
	 * The command value: `false` if there is no `alt` attribute, otherwise the value of the `alt` attribute.
	 *
	 * @readonly
	 * @observable
	 * @member {String|Boolean} #value
	 */

	/**
	 * @inheritDoc
	 */
	refresh() {
		const editor = this.editor;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const element = imageUtils.getClosestSelectedImageStandardElement( this.editor.model.document.selection );

		this.isEnabled = !!element;

		if ( this.isEnabled && element.hasAttribute( 'alt' ) ) {
			this.value = element.getAttribute( 'alt' );
		} else {
			this.value = false;
		}
	}

	/**
	 * Executes the command.
	 *
	 * @fires execute
	 * @param {Object} options
	 * @param {String} options.newValue The new value of the `alt` attribute to set.
	 */
	execute( options ) {
		const editor = this.editor;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const model = editor.model;
		const imageElement = imageUtils.getClosestSelectedImageStandardElement( model.document.selection );

		model.change( writer => {
			writer.setAttribute( 'alt', options.newValue, imageElement );
		} );
	}
}

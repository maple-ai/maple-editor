/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/filedelete/filedeletecommand
 */

import { Command } from 'ckeditor5/src/core';

/**
 * The file text alternative command. It is used to change the `alt` attribute of `<fileBlock>` and `<fileInline>` model elements.
 *
 * @extends module:core/command~Command
 */
export default class FileDeleteCommand extends Command {
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
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const element = fileUtils.getClosestSelectedFileElement( this.editor.model.document.selection );

		this.isEnabled = !!element;

		if ( this.isEnabled && element.hasAttribute( 'src' ) ) {
			this.value = element.getAttribute( 'src' );
		} else {
			this.value = true;
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
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const model = editor.model;
		const fileElement = fileUtils.getClosestSelectedFileElement( model.document.selection );

		model.change( writer => {
			writer.setAttribute( 'alt', options.newValue, fileElement );
		} );
	}
}

/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/filedelete/filedeleteui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView, ContextualBalloon } from 'ckeditor5/src/ui';

/**
 * The file text alternative UI plugin.
 *
 * The plugin uses the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileDeleteUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ContextualBalloon ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileDeleteUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this._createButton();
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		super.destroy();
	}

	/**
	 * Creates a button showing the balloon panel for changing the file text alternative and
	 * registers it in the editor {@link module:ui/componentfactory~ComponentFactory ComponentFactory}.
	 *
	 * @private
	 */
	_createButton() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add( 'FileDelete', locale => {
			const command = editor.commands.get( 'FileDelete' );
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Delete File' ),
				icon: `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M6 19.5C6 20.6 6.9 21.5 8 21.5H16C17.1 21.5 18 20.6 18 19.5V9.5C18 8.4 17.1 7.5 16 7.5H8C6.9 7.5 6 8.4 6 9.5V19.5ZM18 4.5H15.5L14.79 3.79C14.61 3.61 14.35 3.5 14.09 3.5H9.91C9.65 3.5 9.39 3.61 9.21 3.79L8.5 4.5H6C5.45 4.5 5 4.95 5 5.5C5 6.05 5.45 6.5 6 6.5H18C18.55 6.5 19 6.05 19 5.5C19 4.95 18.55 4.5 18 4.5Z" fill="#D21A1A"/>
				</svg>
				`,
				tooltip: true
			} );

			view.bind( 'isEnabled' ).to( command, 'isEnabled' );

			this.listenTo( view, 'execute', () => {
				const editor = this.editor;
				const selection = editor.model.document.selection;
				editor.model.change( writer => {
					let selectedFile = selection.getSelectedElement();
					writer.remove( selectedFile );
				});
			} );
			return view;
		} );
	}
}

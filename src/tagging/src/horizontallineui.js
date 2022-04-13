/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module horizontal-line/horizontallineui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';

import taggingIcon from '../theme/icons/tagging.svg';

/**
 * The horizontal line UI plugin.
 *
 * @extends module:core/plugin~Plugin
 */
export default class TaggingUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'TaggingUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;

		// Add the `tagging` button to feature components.
		editor.ui.componentFactory.add( 'tagging', locale => {
			const command = editor.commands.get( 'tagging' );
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Tag' ),
				icon: taggingIcon,
				tooltip: true
			} );

			view.bind( 'isEnabled' ).to( command, 'isEnabled' );

			// Execute the command.
			this.listenTo( view, 'execute', () => {
				editor.execute( 'tagging' );
				editor.editing.view.focus();
			} );

			return view;
		} );
	}
}

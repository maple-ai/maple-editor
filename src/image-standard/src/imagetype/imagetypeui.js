/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetype/imagetypeui
 */

import { Plugin, icons } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';
import ImageStandardUtils from '../imageutils';

import { getCaptionFromModelSelection } from './utils';

/**
 * The image caption UI plugin. It introduces the `'toggleImageStandardType'` UI button.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardTypeUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardTypeUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const editingView = editor.editing.view;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const t = editor.t;

		editor.ui.componentFactory.add( 'toggleImageStandardType', locale => {
			const command = editor.commands.get( 'toggleImageStandardType' );
			const view = new ButtonView( locale );

			view.set( {
				icon: icons.caption,
				tooltip: true,
				isToggleable: true
			} );

			view.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );
			view.bind( 'label' ).to( command, 'value', value => value ? t( 'Toggle caption off' ) : t( 'Toggle caption on' ) );

			this.listenTo( view, 'execute', () => {
				editor.execute( 'toggleImageStandardType', { focusCaptionOnShow: true } );

				// Scroll to the selection and highlight the caption if the caption showed up.
				const modelCaptionElement = getCaptionFromModelSelection( imageUtils, editor.model.document.selection );

				if ( modelCaptionElement ) {
					const figtypeElement = editor.editing.mapper.toViewElement( modelCaptionElement );

					editingView.scrollToTheSelection();

					editingView.change( writer => {
						writer.addClass( 'image__caption_highlighted', figtypeElement );
					} );
				}
			} );

			return view;
		} );
	}
}

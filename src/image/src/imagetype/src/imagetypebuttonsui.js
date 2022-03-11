/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module imagetype/imagetypebuttonsui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';

import { getLocalizedOptions } from './utils';
import iconImageType1 from '../theme/icons/default.svg';
import iconImageType2 from '../theme/icons/before.svg';
import iconImageType3 from '../theme/icons/after.svg';

const defaultIcons = {
	default: iconImageType1,
	before: iconImageType2,
	after: iconImageType3
};

/**
 * The `ImageTypeButtonsUI` plugin defines a set of UI buttons that can be used instead of the
 * standard drop down component.
 *
 * This feature is not enabled by default by the {@link module:imagetype/imagetype~ImageType} plugin and needs to be
 * installed manually to the editor configuration.
 *
 * Plugin introduces button UI elements, which names are same as `model` property from {@link module:imagetype/imagetype~ImageTypeOption}.
 *
 *		ClassicEditor
 *			.create( {
 *				plugins: [ ..., ImageType, Paragraph, ImageTypeButtonsUI, ParagraphButtonUI ]
 *				imagetype: {
 *					options: [
 *						{ model: 'paragraph', title: 'Paragraph', class: 'ck-imagetype_paragraph' },
 *						{ model: 'default', view: 'h2', title: 'Default', class: 'ck-imagetype_default' },
 *						{ model: 'before', view: 'h3', title: 'Before', class: 'ck-imagetype_before' },
 *						{ model: 'after', view: 'h4', title: 'After', class: 'ck-imagetype_after' }
 *					]
 * 				},
 * 				toolbar: [ 'paragraph', 'default', 'before', 'after' ]
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * NOTE: The `'paragraph'` button is defined in by the {@link module:paragraph/paragraphbuttonui~ParagraphButtonUI} plugin
 * which needs to be loaded manually as well.
 *
 * It is possible to use custom icons by providing `icon` config option in {@link module:imagetype/imagetype~ImageTypeOption}.
 * For the default configuration standard icons are used.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageTypeButtonsUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const options = getLocalizedOptions( this.editor );

		options
			.filter( item => item.model !== 'paragraph' )
			.map( item => this._createButton( item ) );
	}

	/**
	 * Creates single button view from provided configuration option.
	 *
	 * @private
	 * @param {Object} option
	 */
	_createButton( option ) {
		const editor = this.editor;

		editor.ui.componentFactory.add( option.model, locale => {
			const view = new ButtonView( locale );
			const command = editor.commands.get( 'imagetype' );

			view.label = option.title;
			view.icon = option.icon || defaultIcons[ option.model ];
			view.tooltip = true;
			view.isToggleable = true;
			view.bind( 'isEnabled' ).to( command );
			view.bind( 'isOn' ).to( command, 'value', value => value == option.model );

			view.on( 'execute', () => {
				editor.execute( 'imagetype', { value: option.model } );
				editor.editing.view.focus();
			} );

			return view;
		} );
	}
}

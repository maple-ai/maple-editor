/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module imagetype/imagetypeui
 */

import { Plugin } from 'ckeditor5/src/core';
import { Model, createDropdown, addListToDropdown } from 'ckeditor5/src/ui';
import { Collection } from 'ckeditor5/src/utils';

import { getLocalizedOptions } from './utils';

import '../theme/imagetype.css';

/**
 * The imagetypes UI feature. It introduces the `imagetypes` dropdown.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageTypeUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageTypeUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;
		const options = getLocalizedOptions( editor );
		const defaultTitle = t( 'Default' );
		const dropdownTooltip = t( 'Choose Image Type' );

		// Register UI component.
		editor.ui.componentFactory.add( 'imagetype', locale => {
			const titles = {};
			const itemDefinitions = new Collection();

			const imagetypeCommand = editor.commands.get( 'imagetype' );
			const paragraphCommand = editor.commands.get( 'paragraph' );

			const commands = [ imagetypeCommand ];

			for ( const option of options ) {
				const def = {
					type: 'button',
					model: new Model( {
						label: option.title,
						class: option.class,
						withText: true
					} )
				};

				if ( option.model === 'paragraph' ) {
					def.model.bind( 'isOn' ).to( paragraphCommand, 'value' );
					def.model.set( 'commandName', 'paragraph' );
					commands.push( paragraphCommand );
				} else {
					def.model.bind( 'isOn' ).to( imagetypeCommand, 'value', value => value === option.model );
					def.model.set( {
						commandName: 'imagetype',
						commandValue: option.model
					} );
				}

				// Add the option to the collection.
				itemDefinitions.add( def );

				titles[ option.model ] = option.title;
			}

			const dropdownView = createDropdown( locale );
			addListToDropdown( dropdownView, itemDefinitions );

			dropdownView.buttonView.set( {
				isOn: false,
				withText: true,
				tooltip: dropdownTooltip
			} );

			dropdownView.extendTemplate( {
				attributes: {
					class: [
						'ck-imagetype-dropdown'
					]
				}
			} );

			dropdownView.bind( 'isEnabled' ).toMany( commands, 'isEnabled', ( ...areEnabled ) => {
				return true;
			} );

			dropdownView.buttonView.bind( 'label' ).to( imagetypeCommand, 'value', paragraphCommand, 'value', ( value, para ) => {
				const whichModel = value || para && 'paragraph';
				// If none of the commands is active, display default title.
				return titles[ whichModel ] ? titles[ whichModel ] : defaultTitle;
			} );

			// Execute command when an item from the dropdown is selected.
			this.listenTo( dropdownView, 'execute', evt => {
				editor.execute( evt.source.commandName, evt.source.commandValue ? { value: evt.source.commandValue } : undefined );
				editor.editing.view.focus();
			} );

			return dropdownView;
		} );
	}
}

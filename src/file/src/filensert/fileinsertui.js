/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileinsert/fileinsertui
 */

import { Plugin } from 'ckeditor5/src/core';
import FileInsertPanelView from './ui/fileinsertpanelview';
import { prepareIntegrations } from './utils';

/**
 * The file insert dropdown plugin.
 *
 * For a detailed overview, check the {@glink features/files/file-upload/file-upload File upload feature}
 * and {@glink features/files/file-upload/files-inserting#inserting-files-via-source-url Insert files via source URL} documentation.
 *
 * Adds the `'insertFile'` dropdown to the {@link module:ui/componentfactory~ComponentFactory UI component factory}
 * and also the `fileInsert` dropdown as an alias for backward compatibility.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileInsertUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileInsertUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const componentCreator = locale => {
			return this._createDropdownView( locale );
		};

		// Register `insertFile` dropdown and add `fileInsert` dropdown as an alias for backward compatibility.
		editor.ui.componentFactory.add( 'insertFile', componentCreator );
		editor.ui.componentFactory.add( 'fileInsert', componentCreator );
	}

	/**
	 * Creates the dropdown view.
	 *
	 * @param {module:utils/locale~Locale} locale The localization services instance.
	 *
	 * @private
	 * @returns {module:ui/dropdown/dropdownview~DropdownView}
	 */
	_createDropdownView( locale ) {
		const editor = this.editor;
		const fileInsertView = new FileInsertPanelView( locale, prepareIntegrations( editor ) );
		const command = editor.commands.get( 'uploadFile' );

		const dropdownView = fileInsertView.dropdownView;
		const splitButtonView = dropdownView.buttonView;

		splitButtonView.actionView = editor.ui.componentFactory.create( 'uploadFile' );
		// After we replaced action button with `uploadFile` component,
		// we have lost a proper styling and some minor visual quirks have appeared.
		// Brining back original split button classes helps fix the button styling
		// See https://github.com/ckeditor/ckeditor5/issues/7986.
		splitButtonView.actionView.extendTemplate( {
			attributes: {
				class: 'ck ck-button ck-splitbutton__action'
			}
		} );

		return this._setUpDropdown( dropdownView, fileInsertView, command );
	}

	/**
	 * Sets up the dropdown view.
	 *
	 * @param {module:ui/dropdown/dropdownview~DropdownView} dropdownView A dropdownView.
	 * @param {module:file/fileinsert/ui/fileinsertpanelview~FileInsertPanelView} fileInsertView An fileInsertView.
	 * @param {module:core/command~Command} command An insertFile command
	 *
	 * @private
	 * @returns {module:ui/dropdown/dropdownview~DropdownView}
	 */
	_setUpDropdown( dropdownView, fileInsertView, command ) {
		const editor = this.editor;
		const t = editor.t;
		const insertButtonView = fileInsertView.insertButtonView;
		const insertFileViaUrlForm = fileInsertView.getIntegration( 'insertFileViaUrl' );
		const panelView = dropdownView.panelView;
		const fileUtils = this.editor.plugins.get( 'FileUtils' );

		dropdownView.bind( 'isEnabled' ).to( command );

		// Defer the children injection to improve initial performance.
		// See https://github.com/ckeditor/ckeditor5/pull/8019#discussion_r484069652.
		dropdownView.buttonView.once( 'open', () => {
			panelView.children.add( fileInsertView );
		} );

		dropdownView.on( 'change:isOpen', () => {
			const selectedElement = editor.model.document.selection.getSelectedElement();

			if ( dropdownView.isOpen ) {
				fileInsertView.focus();

				if ( fileUtils.isFile( selectedElement ) ) {
					fileInsertView.fileURLInputValue = selectedElement.getAttribute( 'src' );
					insertButtonView.label = t( 'Update' );
					insertFileViaUrlForm.label = t( 'Update file URL' );
				} else {
					fileInsertView.fileURLInputValue = '';
					insertButtonView.label = t( 'Insert' );
					insertFileViaUrlForm.label = t( 'Insert file via URL' );
				}
			}
		// Note: Use the low priority to make sure the following listener starts working after the
		// default action of the drop-down is executed (i.e. the panel showed up). Otherwise, the
		// invisible form/input cannot be focused/selected.
		}, { priority: 'low' } );

		fileInsertView.delegate( 'submit', 'cancel' ).to( dropdownView );
		this.delegate( 'cancel' ).to( dropdownView );

		dropdownView.on( 'submit', () => {
			closePanel();
			onSubmit();
		} );

		dropdownView.on( 'cancel', () => {
			closePanel();
		} );

		function onSubmit() {
			
			const selectedElement = editor.model.document.selection.getSelectedElement();

			if ( fileUtils.isFile( selectedElement ) ) {
				editor.model.change( writer => {
					writer.setAttribute( 'src', fileInsertView.fileURLInputValue, selectedElement );
					writer.removeAttribute( 'srcset', selectedElement );
					writer.removeAttribute( 'sizes', selectedElement );
				} );
			} else {
				editor.execute( 'insertFile', { source: fileInsertView.fileURLInputValue } );
			}
		}

		function closePanel() {
			editor.editing.view.focus();
			dropdownView.isOpen = false;
		}

		return dropdownView;
	}
}

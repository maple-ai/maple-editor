/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageinsert/imageinsertui
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardInsertPanelView from './ui/imageinsertpanelview';
import { prepareIntegrations } from './utils';

/**
 * The image insert dropdown plugin.
 *
 * For a detailed overview, check the {@glink features/images/image-upload/image-upload ImageStandard upload feature}
 * and {@glink features/images/image-upload/images-inserting#inserting-images-via-source-url Insert images via source URL} documentation.
 *
 * Adds the `'insertImageStandard'` dropdown to the {@link module:ui/componentfactory~ComponentFactory UI component factory}
 * and also the `imageInsert` dropdown as an alias for backward compatibility.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardInsertUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardInsertUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const componentCreator = locale => {
			return this._createDropdownView( locale );
		};

		// Register `insertImageStandard` dropdown and add `imageInsert` dropdown as an alias for backward compatibility.
		editor.ui.componentFactory.add( 'insertImageStandard', componentCreator );
		editor.ui.componentFactory.add( 'imageInsert', componentCreator );
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
		const imageInsertView = new ImageStandardInsertPanelView( locale, prepareIntegrations( editor ) );
		const command = editor.commands.get( 'uploadImageStandard' );

		const dropdownView = imageInsertView.dropdownView;
		const splitButtonView = dropdownView.buttonView;

		splitButtonView.actionView = editor.ui.componentFactory.create( 'uploadImageStandard' );
		// After we replaced action button with `uploadImageStandard` component,
		// we have lost a proper styling and some minor visual quirks have appeared.
		// Brining back original split button classes helps fix the button styling
		// See https://github.com/ckeditor/ckeditor5/issues/7986.
		splitButtonView.actionView.extendTemplate( {
			attributes: {
				class: 'ck ck-button ck-splitbutton__action'
			}
		} );

		return this._setUpDropdown( dropdownView, imageInsertView, command );
	}

	/**
	 * Sets up the dropdown view.
	 *
	 * @param {module:ui/dropdown/dropdownview~DropdownView} dropdownView A dropdownView.
	 * @param {module:image/imageinsert/ui/imageinsertpanelview~ImageStandardInsertPanelView} imageInsertView An imageInsertView.
	 * @param {module:core/command~Command} command An insertImageStandard command
	 *
	 * @private
	 * @returns {module:ui/dropdown/dropdownview~DropdownView}
	 */
	_setUpDropdown( dropdownView, imageInsertView, command ) {
		const editor = this.editor;
		const t = editor.t;
		const insertButtonView = imageInsertView.insertButtonView;
		const insertImageStandardViaUrlForm = imageInsertView.getIntegration( 'insertImageStandardViaUrl' );
		const panelView = dropdownView.panelView;
		const imageUtils = this.editor.plugins.get( 'ImageStandardUtils' );

		dropdownView.bind( 'isEnabled' ).to( command );

		// Defer the children injection to improve initial performance.
		// See https://github.com/ckeditor/ckeditor5/pull/8019#discussion_r484069652.
		dropdownView.buttonView.once( 'open', () => {
			panelView.children.add( imageInsertView );
		} );

		dropdownView.on( 'change:isOpen', () => {
			const selectedElement = editor.model.document.selection.getSelectedElement();

			if ( dropdownView.isOpen ) {
				imageInsertView.focus();

				if ( imageUtils.isImageStandard( selectedElement ) ) {
					imageInsertView.imageURLInputValue = selectedElement.getAttribute( 'src' );
					insertButtonView.label = t( 'Update' );
					insertImageStandardViaUrlForm.label = t( 'Update image URL' );
				} else {
					imageInsertView.imageURLInputValue = '';
					insertButtonView.label = t( 'Insert' );
					insertImageStandardViaUrlForm.label = t( 'Insert image via URL' );
				}
			}
		// Note: Use the low priority to make sure the following listener starts working after the
		// default action of the drop-down is executed (i.e. the panel showed up). Otherwise, the
		// invisible form/input cannot be focused/selected.
		}, { priority: 'low' } );

		imageInsertView.delegate( 'submit', 'cancel' ).to( dropdownView );
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

			if ( imageUtils.isImageStandard( selectedElement ) ) {
				editor.model.change( writer => {
					writer.setAttribute( 'src', imageInsertView.imageURLInputValue, selectedElement );
					writer.removeAttribute( 'srcset', selectedElement );
					writer.removeAttribute( 'sizes', selectedElement );
				} );
			} else {
				editor.execute( 'insertImageStandard', { source: imageInsertView.imageURLInputValue } );
			}
		}

		function closePanel() {
			editor.editing.view.focus();
			dropdownView.isOpen = false;
		}

		return dropdownView;
	}
}

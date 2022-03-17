/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileinsert/utils
 */

import { LabeledFieldView, createLabeledInputText } from 'ckeditor5/src/ui';

/**
 * Creates integrations object that will be passed to the
 * {@link module:file/fileinsert/ui/fileinsertpanelview~FileInsertPanelView}.
 *
 * @param {module:core/editor/editor~Editor} editor Editor instance.
 *
 * @returns {Object.<String, module:ui/view~View>} Integrations object.
 */
export function prepareIntegrations( editor ) {
	const panelItems = editor.config.get( 'file.insert.integrations' );
	const fileInsertUIPlugin = editor.plugins.get( 'FileInsertUI' );

	const PREDEFINED_INTEGRATIONS = {
		'insertFileViaUrl': createLabeledInputView( editor.locale )
	};

	if ( !panelItems ) {
		return PREDEFINED_INTEGRATIONS;
	}

	// Prepares ckfinder component for the `openCKFinder` integration token.
	if ( panelItems.find( item => item === 'openCKFinder' ) && editor.ui.componentFactory.has( 'ckfinder' ) ) {
		const ckFinderButton = editor.ui.componentFactory.create( 'ckfinder' );
		ckFinderButton.set( {
			withText: true,
			class: 'ck-file-insert__ck-finder-button'
		} );

		// We want to close the dropdown panel view when user clicks the ckFinderButton.
		ckFinderButton.delegate( 'execute' ).to( fileInsertUIPlugin, 'cancel' );

		PREDEFINED_INTEGRATIONS.openCKFinder = ckFinderButton;
	}

	// Creates integrations object of valid views to pass it to the FileInsertPanelView.
	return panelItems.reduce( ( object, key ) => {
		if ( PREDEFINED_INTEGRATIONS[ key ] ) {
			object[ key ] = PREDEFINED_INTEGRATIONS[ key ];
		} else if ( editor.ui.componentFactory.has( key ) ) {
			object[ key ] = editor.ui.componentFactory.create( key );
		}

		return object;
	}, {} );
}

/**
 * Creates labeled field view.
 *
 * @param {module:utils/locale~Locale} locale The localization services instance.
 *
 * @returns {module:ui/labeledfield/labeledfieldview~LabeledFieldView}
 */
export function createLabeledInputView( locale ) {
	const t = locale.t;
	const labeledInputView = new LabeledFieldView( locale, createLabeledInputText );

	labeledInputView.set( {
		label: t( 'Insert file via URL' )
	} );
	labeledInputView.fieldView.placeholder = 'https://example.com/file.png';

	return labeledInputView;
}

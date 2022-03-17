/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/filetoolbar
 */

import { Plugin } from 'ckeditor5/src/core';
import { WidgetToolbarRepository } from 'ckeditor5/src/widget';
import FileUtils from './fileutils';
import { isObject } from 'lodash-es';

/**
 * The file toolbar plugin. It creates and manages the file toolbar (the toolbar displayed when an file is selected).
 *
 * For an overview, check the {@glink features/files/files-overview#file-contextual-toolbar file contextual toolbar} documentation.
 *
 * Instances of toolbar components (e.g. buttons) are created using the editor's
 * {@link module:ui/componentfactory~ComponentFactory component factory}
 * based on the {@link module:file/file~FileConfig#toolbar `file.toolbar` configuration option}.
 *
 * The toolbar uses the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileToolbar extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ WidgetToolbarRepository, FileUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileToolbar';
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const editor = this.editor;
		const t = editor.t;
		const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );
		const fileUtils = editor.plugins.get( 'FileUtils' );

		widgetToolbarRepository.register( 'file', {
			ariaLabel: t( 'File toolbar' ),
			items: normalizeDeclarativeConfig( editor.config.get( 'file.toolbar' ) || [] ),
			getRelatedElement: selection => fileUtils.getClosestSelectedFileWidget( selection )
		} );
	}
}

/**
 * Items to be placed in the file toolbar.
 * This option is used by the {@link module:file/filetoolbar~FileToolbar} feature.
 *
 * Assuming that you use the following features:
 *
 * * {@link module:file/filestyle~FileStyle} (with a default configuration),
 * * {@link module:file/filetextalternative~FileTextAlternative},
 * * {@link module:file/filecaption~FileCaption},
 *
 * the following toolbar items will be available in {@link module:ui/componentfactory~ComponentFactory}:
 * * `'fileTextAlternative'`,
 * * `'toggleFileCaption'`,
 * * {@link module:file/file~FileConfig#styles buttons provided by the `FileStyle` plugin},
 * * {@link module:file/filestyle/utils~DEFAULT_DROPDOWN_DEFINITIONS drop-downs provided by the `FileStyle` plugin},
 *
 * so you can configure the toolbar like this:
 *
 *		const fileConfig = {
 *			toolbar: [
 *	 			'fileStyle:inline', 'fileStyle:wrapText', 'fileStyle:breakText', '|',
 *				'toggleFileCaption', 'fileTextAlternative'
 *			]
 *		};
 *
 * Besides that, the `FileStyle` plugin allows to define a
 * {@link module:file/filestyle/filestyleui~FileStyleDropdownDefinition custom drop-down} while configuring the toolbar.
 *
 * The same items can also be used in the {@link module:core/editor/editorconfig~EditorConfig#toolbar main editor toolbar}.
 *
 * Read more about configuring toolbar in {@link module:core/editor/editorconfig~EditorConfig#toolbar}.
 *
 * @member {Array.<String>} module:file/file~FileConfig#toolbar
 */

// Convert the dropdown definitions to their keys registered in the ComponentFactory.
// The registration precess should be handled by the plugin which handles the UI of a particular feature.
//
// @param {Array.<String|module:file/filestyle/filestyleui~FileStyleDropdownDefinition>} config
//
// @returns {Array.<String>}
function normalizeDeclarativeConfig( config ) {
	return config.map( item => isObject( item ) ? item.name : item );
}

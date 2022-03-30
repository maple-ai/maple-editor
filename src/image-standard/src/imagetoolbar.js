/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetoolbar
 */

import { Plugin } from 'ckeditor5/src/core';
import { WidgetToolbarRepository } from 'ckeditor5/src/widget';
import ImageStandardUtils from './imageutils';
import { isObject } from 'lodash-es';

/**
 * The image toolbar plugin. It creates and manages the image toolbar (the toolbar displayed when an image is selected).
 *
 * For an overview, check the {@glink features/images/images-overview#image-contextual-toolbar image contextual toolbar} documentation.
 *
 * Instances of toolbar components (e.g. buttons) are created using the editor's
 * {@link module:ui/componentfactory~ComponentFactory component factory}
 * based on the {@link module:image/image~ImageStandardConfig#toolbar `image.toolbar` configuration option}.
 *
 * The toolbar uses the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardToolbar extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ WidgetToolbarRepository, ImageStandardUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardToolbar';
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const editor = this.editor;
		const t = editor.t;
		const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

		widgetToolbarRepository.register( 'imageStandard', {
			ariaLabel: t( 'ImageStandard toolbar' ),
			items: normalizeDeclarativeConfig( editor.config.get( 'image.toolbar' ) || [] ),
			getRelatedElement: selection => imageUtils.getClosestSelectedImageStandardWidget( selection )
		} );
	}
}

/**
 * Items to be placed in the image toolbar.
 * This option is used by the {@link module:image/imagetoolbar~ImageStandardToolbar} feature.
 *
 * Assuming that you use the following features:
 *
 * * {@link module:image/imagestyle~ImageStandardStyle} (with a default configuration),
 * * {@link module:image/imagetextalternative~ImageStandardTextAlternative},
 * * {@link module:image/imagecaption~ImageStandardCaption},
 *
 * the following toolbar items will be available in {@link module:ui/componentfactory~ComponentFactory}:
 * * `'imageTextAlternative'`,
 * * `'toggleImageStandardCaption'`,
 * * {@link module:image/image~ImageStandardConfig#styles buttons provided by the `ImageStandardStyle` plugin},
 * * {@link module:image/imagestyle/utils~DEFAULT_DROPDOWN_DEFINITIONS drop-downs provided by the `ImageStandardStyle` plugin},
 *
 * so you can conimage the toolbar like this:
 *
 *		const imageConfig = {
 *			toolbar: [
 *	 			'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
 *				'toggleImageStandardCaption', 'imageTextAlternative'
 *			]
 *		};
 *
 * Besides that, the `ImageStandardStyle` plugin allows to define a
 * {@link module:image/imagestyle/imagestyleui~ImageStandardStyleDropdownDefinition custom drop-down} while configuring the toolbar.
 *
 * The same items can also be used in the {@link module:core/editor/editorconfig~EditorConfig#toolbar main editor toolbar}.
 *
 * Read more about configuring toolbar in {@link module:core/editor/editorconfig~EditorConfig#toolbar}.
 *
 * @member {Array.<String>} module:image/image~ImageStandardConfig#toolbar
 */

// Convert the dropdown definitions to their keys registered in the ComponentFactory.
// The registration precess should be handled by the plugin which handles the UI of a particular feature.
//
// @param {Array.<String|module:image/imagestyle/imagestyleui~ImageStandardStyleDropdownDefinition>} config
//
// @returns {Array.<String>}
function normalizeDeclarativeConfig( config ) {
	return config.map( item => isObject( item ) ? item.name : item );
}

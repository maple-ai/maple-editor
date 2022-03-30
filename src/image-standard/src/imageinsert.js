/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageinsert
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardUpload from './imageupload';
import ImageStandardInsertUI from './imageinsert/imageinsertui';

/**
 * The image insert plugin.
 *
 * For a detailed overview, check the {@glink features/images/image-upload/image-upload ImageStandard upload feature}
 * and {@glink features/images/image-upload/images-inserting#inserting-images-via-source-url Insert images via source URL} documentation.
 *
 * This plugin does not do anything directly, but it loads a set of specific plugins
 * to enable image uploading or inserting via implemented integrations:
 *
 * * {@link module:image/imageupload~ImageStandardUpload}
 * * {@link module:image/imageinsert/imageinsertui~ImageStandardInsertUI},
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardInsert extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardInsert';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardUpload, ImageStandardInsertUI ];
	}
}

/**
 * The image insert configuration.
 *
 * @member {module:image/imageinsert~ImageStandardInsertConfig} module:image/image~ImageStandardConfig#insert
 */

/**
 * The configuration of the image insert dropdown panel view. Used by the image insert feature in the `@ckeditor/ckeditor5-image` package.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				image: {
 * 					insert: {
 *						... // settings for "insertImageStandard" view goes here
 * 					}
 * 				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface module:image/imageinsert~ImageStandardInsertConfig
 */

/**
 * The image insert panel view configuration contains a list of {@link module:image/imageinsert~ImageStandardInsert} integrations.
 *
 * The option accepts string tokens.
 * * for predefined integrations, we have two special strings: `insertImageStandardViaUrl` and `openCKFinder`.
 * The former adds the **Insert image via URL** feature, while the latter adds the built-in **CKFinder** integration.
 * * for custom integrations, each string should be a name of the component registered in the
 * {@link module:ui/componentfactory~ComponentFactory component factory}.
 * If you have a plugin `PluginX` that registers `pluginXButton` component, then the integration token
 * in that case should be `pluginXButton`.
 *
 *		// Add `insertImageStandardViaUrl`, `openCKFinder` and custom `pluginXButton` integrations.
 *		const imageInsertConfig = {
 *			insert: {
 *				integrations: [
 *					'insertImageStandardViaUrl',
 *					'openCKFinder',
 *					'pluginXButton'
 *				]
 *			}
 *		};
 *
 * @protected
 * @member {Array.<String>} module:image/imageinsert~ImageStandardInsertConfig#integrations
 * @default [ 'insertImageStandardViaUrl' ]
 */

/**
 * This options allows to override the image type used by the {@link module:image/image/insertimagecommand~InsertImageStandardCommand} when the user
 * inserts new images into the editor content. By default, this option is unset which means the editor will choose the optimal image type
 * based on the context of the insertion (e.g. the current selection and availability of plugins)
 *
 * Available options are:
 *
 * * `'block'` – all images inserted into the editor will be block (requires the {@link module:image/imageblock~ImageStandardBlock} plugin),
 * * `'inline'` – all images inserted into the editor will be inline (requires the {@link module:image/imageinline~ImageStandardInline} plugin).
 *
 * @member {'inline'|'block'|undefined} module:image/imageinsert~ImageStandardInsertConfig#type
 */

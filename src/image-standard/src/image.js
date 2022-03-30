/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/image
 */

import { Plugin } from 'ckeditor5/src/core';

import ImageStandardBlock from './imageblock';
import ImageStandardInline from './imageinline';

import '../theme/image.css';

/**
 * The image plugin.
 *
 * For a detailed overview, check the {@glink features/images/images-overview image feature} documentation.
 *
 * This is a "glue" plugin which loads the following plugins:
 *
 * * {@link module:image/imageblock~ImageStandardBlock},
 * * {@link module:image/imageinline~ImageStandardInline},
 *
 * Usually, it is used in conjunction with other plugins from this package. See the {@glink api/image package page}
 * for more information.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandard extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardBlock, ImageStandardInline ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandard';
	}
}

/**
 * The configuration of the image features. Used by the image features in the `@ckeditor/ckeditor5-image` package.
 *
 * Read more in {@link module:image/image~ImageStandardConfig}.
 *
 * @member {module:image/image~ImageStandardConfig} module:core/editor/editorconfig~EditorConfig#image
 */

/**
 * The configuration of the image features. Used by the image features in the `@ckeditor/ckeditor5-image` package.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				image: ... // ImageStandard feature options.
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface ImageStandardConfig
 */
